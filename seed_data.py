import random
from datetime import datetime, timedelta


def now_iso():
    """Return current UTC time as ISO-8601 string (e.g. 2025-06-28T12:34:56Z)."""
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"


def random_iso_time(days_ago=30):
    """Return a random ISO time within the last N days."""
    now = datetime.utcnow()
    random_days = random.randint(0, days_ago)
    random_hours = random.randint(0, 23)
    random_minutes = random.randint(0, 59)
    random_seconds = random.randint(0, 59)
    
    random_time = now - timedelta(
        days=random_days,
        hours=random_hours,
        minutes=random_minutes,
        seconds=random_seconds
    )
    return random_time.isoformat(timespec="seconds") + "Z"


def seed_data():
    """Populate the demo data set with large datasets for pagination testing."""
    
    # Service templates for generating variety
    service_names = [
        "api-gateway", "auth-service", "billing", "search", "notifications",
        "user-service", "payment-processor", "email-service", "sms-service",
        "analytics", "metrics-collector", "log-aggregator", "cache-service",
        "database-proxy", "file-storage", "image-processor", "video-encoder",
        "recommendation-engine", "fraud-detector", "compliance-checker",
        "audit-logger", "backup-service", "monitoring", "alerting",
        "dashboard", "reporting", "data-pipeline", "etl-processor",
        "ml-training", "model-serving", "feature-store", "experiment-tracker",
        "ab-testing", "content-cdn", "edge-cache", "load-balancer",
        "service-mesh", "api-docs", "swagger-ui", "openapi-validator",
        "rate-limiter", "circuit-breaker", "retry-handler", "timeout-manager",
        "health-checker", "liveness-probe", "readiness-probe", "graceful-shutdown",
        "config-manager", "secret-manager", "vault-client", "cert-manager",
        "ssl-terminator", "tls-handler", "jwt-validator", "oauth-provider",
        "saml-provider", "ldap-client", "rbac-enforcer", "permission-checker",
        "audit-trail", "compliance-reporter", "data-classifier", "privacy-filter",
        "gdpr-processor", "ccpa-handler", "data-retention", "backup-scheduler",
        "disaster-recovery", "failover-manager", "cluster-coordinator", "leader-election",
        "distributed-lock", "consensus-protocol", "raft-implementation", "paxos-handler",
        "event-sourcing", "cqrs-processor", "saga-orchestrator", "workflow-engine",
        "task-scheduler", "cron-manager", "job-queue", "message-broker",
        "pub-sub", "event-stream", "kafka-producer", "kafka-consumer",
        "redis-client", "memcached-client", "elasticsearch-client", "mongodb-client",
        "postgres-client", "mysql-client", "cassandra-client", "dynamodb-client",
        "s3-client", "gcs-client", "azure-blob-client", "minio-client",
        "terraform-runner", "ansible-executor", "chef-client", "puppet-agent",
        "kubernetes-client", "docker-client", "container-registry", "image-scanner",
        "vulnerability-scanner", "security-auditor", "penetration-tester", "threat-detector",
        "intrusion-detector", "anomaly-detector", "behavior-analyzer", "risk-assessor"
    ]
    
    service_types = ["microservice", "api", "worker", "scheduler", "processor", "gateway", "proxy"]
    owners = ["sre", "platform", "finops", "ml", "growth", "security", "data", "infrastructure", "devops", "backend", "frontend", "mobile", "qa", "product"]
    statuses = ["healthy", "degraded", "down", "maintenance", "scaling"]
    versions = ["1.0.0", "1.1.0", "1.2.0", "2.0.0", "2.1.0", "2.2.0", "3.0.0", "3.1.0", "0.1.0", "0.2.0", "0.3.0"]
    
    # Generate 150+ services
    services = []
    for i in range(150):
        service_name = random.choice(service_names)
        service_type = random.choice(service_types)
        owner = random.choice(owners)
        status = random.choice(statuses)
        version = random.choice(versions)
        
        # Generate realistic replica counts based on status
        if status == "down":
            replicas = 0
            desired_replicas = 0
        elif status == "maintenance":
            replicas = random.randint(0, 2)
            desired_replicas = random.randint(1, 3)
        else:
            replicas = random.randint(1, 10)
            desired_replicas = replicas
        
        service_id = f"svc-{service_name.replace('-', '')}-{i:03d}"
        
        service = {
            "id": service_id,
            "name": f"{service_name}-{service_type}",
            "status": status,
            "version": version,
            "replicas": replicas,
            "desired_replicas": desired_replicas,
            "owner": owner,
            "last_deploy_at": random_iso_time(7)  # Deployed within last week
        }
        services.append(service)
    
    # Generate incidents for some services
    incidents = []
    incident_templates = [
        "High error rate detected",
        "Response time degradation",
        "Memory usage spike",
        "CPU utilization high",
        "Disk space low",
        "Network connectivity issues",
        "Database connection pool exhausted",
        "Cache hit rate dropped",
        "Queue backlog growing",
        "Authentication failures",
        "Authorization errors",
        "Rate limit exceeded",
        "Circuit breaker opened",
        "Health check failing",
        "Service discovery issues",
        "Load balancer problems",
        "SSL certificate expired",
        "DNS resolution failures",
        "Time synchronization issues",
        "Resource contention detected"
    ]
    
    severities = ["low", "medium", "high", "critical"]
    incident_statuses = ["open", "acknowledged", "resolved"]
    
    # Generate 50+ incidents
    for i in range(50):
        service = random.choice(services)
        severity = random.choice(severities)
        status = random.choice(incident_statuses)
        title = random.choice(incident_templates)
        
        incident_id = f"inc-{i+1001:04d}"
        
        incident = {
            "id": incident_id,
            "service_id": service["id"],
            "severity": severity,
            "status": status,
            "title": f"{title} - {service['name']}",
            "created_at": random_iso_time(30),  # Created within last month
            "acked_by": "alice" if status in ["acknowledged", "resolved"] else None,
            "resolved_by": "bob" if status == "resolved" else None
        }
        incidents.append(incident)
    
    return services, incidents


def generate_logs_for_service(service):
    """Generate realistic log entries for a service."""
    logs = []
    
    # Initial startup logs
    logs.append(f'{service["last_deploy_at"]} INFO {service["name"]} starting version={service["version"]}')
    logs.append(f'{service["last_deploy_at"]} INFO {service["name"]} health check passed')
    
    # Generate logs based on service status
    if service["status"] == "healthy":
        # Generate normal operation logs
        for _ in range(random.randint(5, 15)):
            log_time = random_iso_time(1)  # Within last day
            log_level = random.choice(["INFO", "DEBUG"])
            log_messages = [
                f"Processing request",
                f"Cache hit",
                f"Database query completed",
                f"Response sent",
                f"Metrics updated",
                f"Health check passed",
                f"Memory usage normal",
                f"CPU usage normal"
            ]
            logs.append(f'{log_time} {log_level} {service["name"]} {random.choice(log_messages)}')
    
    elif service["status"] == "degraded":
        # Mix of normal and warning logs
        for _ in range(random.randint(3, 8)):
            log_time = random_iso_time(1)
            log_level = random.choice(["INFO", "WARN"])
            log_messages = [
                "Response time increased",
                "Memory usage elevated",
                "Cache miss rate high",
                "Database connection slow",
                "Queue processing delayed",
                "Health check slow",
                "CPU usage high",
                "Disk I/O increased"
            ]
            logs.append(f'{log_time} {log_level} {service["name"]} {random.choice(log_messages)}')
    
    elif service["status"] == "down":
        # Error logs leading to failure
        for _ in range(random.randint(2, 5)):
            log_time = random_iso_time(1)
            log_level = random.choice(["ERROR", "FATAL"])
            log_messages = [
                "Service unavailable",
                "Health check failed",
                "Out of memory",
                "Database connection lost",
                "Network timeout",
                "Process crashed",
                "Configuration error",
                "Dependency unavailable"
            ]
            logs.append(f'{log_time} {log_level} {service["name"]} {random.choice(log_messages)}')
    
    # Sort logs by timestamp
    logs.sort(key=lambda x: x.split(' ')[0])
    return logs
