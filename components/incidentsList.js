import { LitElement, html, css } from "lit";
import { API_KEY, API_URL } from "../constants.js";

class IncidentsList extends LitElement {
    static properties = {
        incidents: { type: Array },
        count: { type: Number },
        filters: { type: Object },
        loading: { type: Boolean },
    };

    incidents = [];
    count = 0;
    filters = {
        status: "",
        severity: "",
        service_id: "",
    };
    loading = false;
    page = 1;
    per_page = 10;

    static styles = css`
        .incidents-container {
            border: 1px solid #ccc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }

        .incidents-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .incidents-title {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
        }

        .filters {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            align-items: center;
        }

        .filter-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .filter-group label {
            font-size: 12px;
            font-weight: bold;
        }

        .filter-group select,
        .filter-group input {
            padding: 5px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }

        .incident-item {
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 10px;
            background: #f9f9f9;
        }

        .incident-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }

        .incident-title {
            font-size: 18px;
            font-weight: bold;
            margin: 0;
            color: #333;
        }

        .incident-meta {
            display: flex;
            gap: 15px;
            font-size: 14px;
            color: #666;
        }

        .severity-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .severity-critical {
            background: #ff4444;
            color: white;
        }
        .severity-high {
            background: #ff8800;
            color: white;
        }
        .severity-medium {
            background: #ffaa00;
            color: black;
        }
        .severity-low {
            background: #44aa44;
            color: white;
        }

        .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }

        .status-open {
            background: #ff4444;
            color: white;
        }
        .status-acknowledged {
            background: #ffaa00;
            color: black;
        }
        .status-resolved {
            background: #44aa44;
            color: white;
        }

        .incident-actions {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }

        .incident-actions button {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }

        .btn-ack {
            background: #ffaa00;
            color: black;
        }
        .btn-resolve {
            background: #44aa44;
            color: white;
        }
        .btn-create {
            background: #0066cc;
            color: white;
        }

        .pagination {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
        }

        .pagination-buttons {
            display: flex;
            gap: 10px;
        }

        .pagination-info {
            font-size: 14px;
            color: #666;
        }

        .loading {
            text-align: center;
            padding: 20px;
            color: #666;
        }
    `;

    connectedCallback() {
        super.connectedCallback();
        console.log("IncidentsList connected to DOM");
        console.log("IncidentsList parent element:", this.parentElement);
        console.log(
            "IncidentsList previous sibling:",
            this.previousElementSibling
        );
        this.loadIncidents();
    }

    // Old HTMX handler methods removed - now using pure JavaScript

    async loadIncidents() {
        console.log("loadIncidents called");
        this.loading = true;
        this.requestUpdate();

        try {
            const url = new URL(`${API_URL}/incidents`);

            // Add filter parameters
            if (this.filters.status)
                url.searchParams.set("status", this.filters.status);
            if (this.filters.severity)
                url.searchParams.set("severity", this.filters.severity);
            if (this.filters.service_id)
                url.searchParams.set("service_id", this.filters.service_id);

            // Add pagination parameters
            url.searchParams.set("page", this.page);
            url.searchParams.set("per_page", this.per_page);

            console.log("Fetching from URL:", url.toString());

            const response = await fetch(url, {
                headers: {
                    "X-API-Key": API_KEY,
                },
            });

            console.log("Response status:", response.status);
            const data = await response.json();
            console.log("Incidents data:", data);

            this.incidents = data.data;
            this.count = data.meta.total;
            this.loading = false;
            this.requestUpdate();
        } catch (error) {
            console.error("Failed to load incidents:", error);
            this.loading = false;
            this.requestUpdate();
        }
    }

    handleFilterChange(event) {
        const { name, value } = event.target;
        this.filters[name] = value;
        this.loadIncidents();
    }

    loadPreviousPage() {
        if (this.page > 1) {
            this.page--;
            this.loadIncidents();
        }
    }

    loadNextPage() {
        if (this.page < Math.ceil(this.count / this.per_page)) {
            this.page++;
            this.loadIncidents();
        }
    }

    async createTestIncident() {
        try {
            const response = await fetch(`${API_URL}/incidents`, {
                method: "POST",
                headers: {
                    "X-API-Key": API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    service_id: "svc-001",
                    title: "Test Incident",
                    severity: "medium",
                }),
            });

            const data = await response.json();
            const newIncident = data.data;

            // Add the new incident to our local array
            this.incidents.unshift(newIncident);
            this.count++;
            this.requestUpdate();
        } catch (error) {
            console.error("Failed to create incident:", error);
        }
    }

    async acknowledgeIncident(incidentId) {
        try {
            const response = await fetch(
                `${API_URL}/incidents/${incidentId}/ack`,
                {
                    method: "POST",
                    headers: {
                        "X-API-Key": API_KEY,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        actor: "user",
                    }),
                }
            );

            const data = await response.json();
            const updatedIncident = data.data;

            // Update the incident in our local array
            const index = this.incidents.findIndex(
                (inc) => inc.id === updatedIncident.id
            );
            if (index !== -1) {
                this.incidents[index] = updatedIncident;
                this.requestUpdate();
            }
        } catch (error) {
            console.error("Failed to acknowledge incident:", error);
        }
    }

    async resolveIncident(incidentId) {
        try {
            const response = await fetch(
                `${API_URL}/incidents/${incidentId}/resolve`,
                {
                    method: "POST",
                    headers: {
                        "X-API-Key": API_KEY,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        actor: "user",
                    }),
                }
            );

            const data = await response.json();
            const updatedIncident = data.data;

            // Update the incident in our local array
            const index = this.incidents.findIndex(
                (inc) => inc.id === updatedIncident.id
            );
            if (index !== -1) {
                this.incidents[index] = updatedIncident;
                this.requestUpdate();
            }
        } catch (error) {
            console.error("Failed to resolve incident:", error);
        }
    }

    render() {
        console.log(
            "IncidentsList render called, incidents:",
            this.incidents.length,
            "loading:",
            this.loading
        );
        return html`
            <div class="incidents-container">
                <div class="incidents-header">
                    <h2 class="incidents-title">Incidents (${this.count})</h2>
                    <button
                        class="btn-create"
                        @click=${this.createTestIncident}
                    >
                        Create Test Incident
                    </button>
                </div>

                <!-- Filters using JavaScript -->
                <div class="filters">
                    <div class="filter-group">
                        <label>Status</label>
                        <select
                            name="status"
                            @change=${this.handleFilterChange}
                        >
                            <option value="">All Statuses</option>
                            <option value="open">Open</option>
                            <option value="acknowledged">Acknowledged</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label>Severity</label>
                        <select
                            name="severity"
                            @change=${this.handleFilterChange}
                        >
                            <option value="">All Severities</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label>Service ID</label>
                        <input
                            type="text"
                            name="service_id"
                            placeholder="Filter by service..."
                            @input=${this.handleFilterChange}
                        />
                    </div>
                </div>

                <!-- Initial load trigger removed - using JavaScript instead -->

                <!-- Lit renders the incidents -->
                ${this.loading
                    ? html`<div class="loading">Loading incidents...</div>`
                    : ""}
                ${this.incidents.map(
                    (incident) => html`
                        <div class="incident-item">
                            <div class="incident-header">
                                <h3 class="incident-title">
                                    ${incident.title}
                                </h3>
                                <div class="incident-meta">
                                    <span
                                        class="severity-badge severity-${incident.severity}"
                                        >${incident.severity}</span
                                    >
                                    <span
                                        class="status-badge status-${incident.status}"
                                        >${incident.status}</span
                                    >
                                    <span>ID: ${incident.id}</span>
                                </div>
                            </div>
                            <div class="incident-details">
                                <p>
                                    <strong>Service:</strong>
                                    ${incident.service_id}
                                </p>
                                <p>
                                    <strong>Created:</strong>
                                    ${incident.created_at}
                                </p>
                                ${incident.acked_by
                                    ? html`<p>
                                          <strong>Acknowledged by:</strong>
                                          ${incident.acked_by}
                                      </p>`
                                    : ""}
                                ${incident.resolved_by
                                    ? html`<p>
                                          <strong>Resolved by:</strong>
                                          ${incident.resolved_by}
                                      </p>`
                                    : ""}
                            </div>
                            <div class="incident-actions">
                                ${incident.status === "open"
                                    ? html`
                                          <button
                                              class="btn-ack"
                                              @click=${() =>
                                                  this.acknowledgeIncident(
                                                      incident.id
                                                  )}
                                          >
                                              Acknowledge
                                          </button>
                                      `
                                    : ""}
                                ${incident.status === "open" ||
                                incident.status === "acknowledged"
                                    ? html`
                                          <button
                                              class="btn-resolve"
                                              @click=${() =>
                                                  this.resolveIncident(
                                                      incident.id
                                                  )}
                                          >
                                              Resolve
                                          </button>
                                      `
                                    : ""}
                            </div>
                        </div>
                    `
                )}

                <!-- Pagination -->
                <div class="pagination">
                    <div class="pagination-buttons">
                        ${this.page > 1
                            ? html`
                                  <button @click=${this.loadPreviousPage}>
                                      Previous
                                  </button>
                              `
                            : ""}
                        ${this.page < Math.ceil(this.count / this.per_page)
                            ? html`
                                  <button @click=${this.loadNextPage}>
                                      Next
                                  </button>
                              `
                            : ""}
                    </div>
                    <div class="pagination-info">
                        Page ${this.page} of
                        ${Math.ceil(this.count / this.per_page)} (${this.count}
                        total)
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("incidents-list", IncidentsList);
