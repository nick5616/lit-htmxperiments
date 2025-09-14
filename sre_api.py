import time
import uuid
import threading
from datetime import datetime
from functools import wraps

from flask import Flask, jsonify, request, g
from flask_cors import CORS

from seed_data import seed_data, generate_logs_for_service

app = Flask(__name__)
CORS(app)

# ----------------------------------------------------------------------
#  In‑memory "database"
# ----------------------------------------------------------------------
API_KEY = "dev-secret"

SERVICES = {}
INCIDENTS = {}
OPERATIONS = {}
LOGS = {}


def now_iso():
    """Return current UTC time as ISO-8601 string (e.g. 2025-06-28T12:34:56Z)."""
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"


# Initialize data using the external seed_data module
services_data, incidents_data = seed_data()
print(f"DEBUG: Generated {len(services_data)} services and {len(incidents_data)} incidents")

# Populate the in-memory databases
for service in services_data:
    SERVICES[service["id"]] = service
    LOGS[service["id"]] = generate_logs_for_service(service)

for incident in incidents_data:
    INCIDENTS[incident["id"]] = incident

print(f"DEBUG: Populated SERVICES with {len(SERVICES)} services")

# ----------------------------------------------------------------------
#  Helpers & Middleware
# ----------------------------------------------------------------------
@app.before_request
def add_request_id():
    """Create a request ID for every request (used in error payloads)."""
    g.request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())


@app.after_request
def add_request_id_header(resp):
    resp.headers["X-Request-ID"] = g.request_id
    return resp


def error_response(status, message, code=None, details=None):
    """Consistent JSON error format."""
    payload = {
        "error": {
            "message": message,
            "code": code or status,
            "request_id": g.request_id,
        }
    }
    if details is not None:
        payload["error"]["details"] = details
    return jsonify(payload), status


@app.errorhandler(404)
def not_found(_):
    return error_response(404, "Not found")


@app.errorhandler(400)
def bad_request(e):
    return error_response(400, "Bad request", details=str(e))


@app.errorhandler(Exception)
def internal_error(e):
    # In a real system you would log the exception with g.request_id
    return error_response(500, "Internal server error", details=str(e))


def require_api_key(fn):
    """Simple token auth decorator."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        key = request.headers.get("X-API-Key")
        if key != API_KEY:
            return error_response(401, "Unauthorized")
        return fn(*args, **kwargs)
    return wrapper


def paginate(items):
    """Return a slice of `items` based on query params `page` and `per_page`."""
    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(max(int(request.args.get("per_page", 20)), 1), 100)
    total = len(items)
    start = (page - 1) * per_page
    end = start + per_page
    meta = {
        "page": page,
        "per_page": per_page,
        "total": total,
        "total_pages": (total + per_page - 1) // per_page,
    }
    return items[start:end], meta


def as_list(value):
    """Normalize a query param that may be a single value or a comma-separated list."""
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [v.strip() for v in str(value).split(",") if v.strip()]


# ----------------------------------------------------------------------
#  Async operation simulation
# ----------------------------------------------------------------------
def create_operation(op_type, target_type, target_id, metadata=None):
    """Create an operation record and run a background thread to simulate work."""
    op_id = f"op-{uuid.uuid4().hex[:8]}"
    OPERATIONS[op_id] = {
        "id": op_id,
        "type": op_type,
        "target_type": target_type,
        "target_id": target_id,
        "status": "pending",
        "created_at": now_iso(),
        "updated_at": now_iso(),
        "metadata": metadata or {},
    }
    thread = threading.Thread(target=_simulate_operation, args=(op_id,), daemon=True)
    thread.start()
    return OPERATIONS[op_id]


def _simulate_operation(op_id):
    """Simple state machine: pending -> running -> succeeded/failed."""
    op = OPERATIONS.get(op_id)
    if not op:
        return

    # ---- pending -> running ----
    time.sleep(0.3)
    op["status"] = "running"
    op["updated_at"] = now_iso()
    time.sleep(1.0)

    # ---- do the work (very naive) ----
    try:
        svc = SERVICES.get(op["target_id"])
        if op["type"] == "restart" and svc:
            LOGS[svc["id"]].append(f"{now_iso()} INFO restart requested")
            time.sleep(0.4)
            svc["status"] = "healthy"
            LOGS[svc["id"]].append(f"{now_iso()} INFO service restarted status=healthy")

        elif op["type"] == "scale" and svc:
            replicas = int(op["metadata"].get("replicas", svc["replicas"]))
            svc["desired_replicas"] = replicas
            LOGS[svc["id"]].append(f"{now_iso()} INFO scaling to replicas={replicas}")
            time.sleep(0.5)
            svc["replicas"] = replicas
            LOGS[svc["id"]].append(f"{now_iso()} INFO scale complete replicas={replicas}")

        elif op["type"] == "deploy" and svc:
            version = op["metadata"].get("version", svc["version"])
            LOGS[svc["id"]].append(f"{now_iso()} INFO deploying version={version}")
            time.sleep(0.6)
            svc["version"] = version
            svc["last_deploy_at"] = now_iso()
            LOGS[svc["id"]].append(f"{now_iso()} INFO deploy complete version={version}")

        op["status"] = "succeeded"
    except Exception as exc:
        op["status"] = "failed"
        op["metadata"]["error"] = str(exc)

    finally:
        op["updated_at"] = now_iso()


# ----------------------------------------------------------------------
#  API Endpoints
# ----------------------------------------------------------------------
@app.get("/healthz")
def healthz():
    """Simple health check endpoint."""
    return jsonify({"status": "ok", "time": now_iso()})


# -------------------- Services --------------------
@app.get("/v1/services")
@require_api_key
def list_services():
    """List services with optional filters and pagination."""
    # Filters
    q = (request.args.get("q", "")).lower()
    statuses = set(as_list(request.args.get("status")))
    owners = set(as_list(request.args.get("owner")))
    sort = request.args.get("sort", "name")
    order = request.args.get("order", "asc")
    reverse = order == "desc"

    items = list(SERVICES.values())

    if q:
        items = [s for s in items if q in s["id"].lower() or q in s["name"].lower()]
    if statuses:
        items = [s for s in items if s["status"] in statuses]
    if owners:
        items = [s for s in items if s["owner"] in owners]

    # Simple sorting
    key_func = lambda s: s.get(sort, "")
    items.sort(key=key_func, reverse=reverse)

    page_items, meta = paginate(items)
    return jsonify({"data": page_items, "meta": meta})

@app.get("/v1/services/count")
@require_api_key
def get_services_count():
    print(f"DEBUG: Count endpoint called, SERVICES has {len(SERVICES)} items")
    return jsonify({"data": len(SERVICES)})

@app.get("/v1/services/<sid>")
@require_api_key
def get_service(sid):
    svc = SERVICES.get(sid)
    if not svc:
        return error_response(404, "Service not found")
    return jsonify({"data": svc})


@app.get("/v1/services/<sid>/logs")
@require_api_key
def get_service_logs(sid):
    if sid not in SERVICES:
        return error_response(404, "Service not found")
    limit = int(request.args.get("limit", 100))
    tail = request.args.get("tail", "false").lower() == "true"
    logs = LOGS.get(sid, [])
    if tail:
        logs = logs[-limit:]
    else:
        logs = logs[:limit]
    return jsonify({"data": logs, "meta": {"count": len(logs), "total": len(LOGS.get(sid, []))}})


@app.post("/v1/services/<sid>/restart")
@require_api_key
def restart_service(sid):
    if sid not in SERVICES:
        return error_response(404, "Service not found")
    op = create_operation("restart", "service", sid)
    return jsonify({"data": op}), 202


@app.post("/v1/services/<sid>/scale")
@require_api_key
def scale_service(sid):
    if sid not in SERVICES:
        return error_response(404, "Service not found")
    payload = request.get_json(silent=True) or {}
    replicas = payload.get("replicas")
    if replicas is None:
        return error_response(400, "replicas field is required")
    try:
        replicas = int(replicas)
    except ValueError:
        return error_response(400, "replicas must be an integer")
    op = create_operation("scale", "service", sid, {"replicas": replicas})
    return jsonify({"data": op}), 202


@app.post("/v1/services/<sid>/deploy")
@require_api_key
def deploy_service(sid):
    if sid not in SERVICES:
        return error_response(404, "Service not found")
    payload = request.get_json(silent=True) or {}
    version = payload.get("version")
    if not version:
        return error_response(400, "version field is required")
    op = create_operation("deploy", "service", sid, {"version": version})
    return jsonify({"data": op}), 202


# -------------------- Incidents --------------------
@app.get("/v1/incidents")
@require_api_key
def list_incidents():
    """List incidents with optional filters."""
    status = set(as_list(request.args.get("status")))
    severity = set(as_list(request.args.get("severity")))
    service_id = request.args.get("service_id")
    items = list(INCIDENTS.values())

    if status:
        items = [i for i in items if i["status"] in status]
    if severity:
        items = [i for i in items if i["severity"] in severity]
    if service_id:
        items = [i for i in items if i["service_id"] == service_id]

    items.sort(key=lambda i: (i["severity"], i["created_at"]), reverse=True)
    page_items, meta = paginate(items)
    return jsonify({"data": page_items, "meta": meta})


@app.post("/v1/incidents")
@require_api_key
def create_incident():
    payload = request.get_json(silent=True) or {}
    service_id = payload.get("service_id")
    title = payload.get("title")
    severity = payload.get("severity", "low")
    if not service_id or not title:
        return error_response(400, "service_id and title are required")
    if service_id not in SERVICES:
        return error_response(404, "Service not found")
    inc_id = f"inc-{uuid.uuid4().hex[:6]}"
    inc = {
        "id": inc_id,
        "service_id": service_id,
        "severity": severity,
        "status": "open",
        "title": title,
        "created_at": now_iso(),
        "acked_by": None,
        "resolved_by": None,
    }
    INCIDENTS[inc_id] = inc
    return jsonify({"data": inc}), 201


@app.post("/v1/incidents/<iid>/ack")
@require_api_key
def ack_incident(iid):
    payload = request.get_json(silent=True) or {}
    actor = payload.get("actor", "system")
    inc = INCIDENTS.get(iid)
    if not inc:
        return error_response(404, "Incident not found")
    if inc["status"] not in ("open", "acknowledged"):
        return error_response(409, "Incident cannot be acked in its current state")
    inc["status"] = "acknowledged"
    inc["acked_by"] = actor
    return jsonify({"data": inc})


@app.post("/v1/incidents/<iid>/resolve")
@require_api_key
def resolve_incident(iid):
    payload = request.get_json(silent=True) or {}
    actor = payload.get("actor", "system")
    inc = INCIDENTS.get(iid)
    if not inc:
        return error_response(404, "Incident not found")
    if inc["status"] == "resolved":
        return error_response(409, "Incident already resolved")
    inc["status"] = "resolved"
    inc["resolved_by"] = actor
    return jsonify({"data": inc})


# -------------------- Operations --------------------
@app.get("/v1/operations/<opid>")
@require_api_key
def get_operation(opid):
    op = OPERATIONS.get(opid)
    if not op:
        return error_response(404, "Operation not found")
    return jsonify({"data": op})


# ----------------------------------------------------------------------
#  Run the app
# ----------------------------------------------------------------------
if __name__ == "__main__":
    # Debug mode is handy for development, but you can turn it off.
    app.run(host="0.0.0.0", port=5001, debug=True)