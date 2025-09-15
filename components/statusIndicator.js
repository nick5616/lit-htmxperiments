import { LitElement, html, css } from "lit";
import { API_KEY, API_URL } from "../constants.js";

class StatusIndicator extends LitElement {
    static properties = {
        status: { type: String },
        lastUpdate: { type: String },
        loading: { type: Boolean },
    };

    status = "unknown";
    lastUpdate = "";
    loading = false;

    static styles = css`
        .status-indicator {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 4px;
            background: #f5f5f5;
            border: 1px solid #ddd;
        }

        .status-badge {
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-ok {
            background: #4caf50;
            color: white;
        }
        .status-error {
            background: #f44336;
            color: white;
        }
        .status-unknown {
            background: #ff9800;
            color: white;
        }

        .last-update {
            font-size: 12px;
            color: #666;
        }

        .loading {
            color: #999;
        }
    `;

    connectedCallback() {
        super.connectedCallback();
        this.loadStatus();
        // Set up periodic updates
        this.intervalId = setInterval(() => this.loadStatus(), 30000);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    async loadStatus() {
        this.loading = true;
        this.requestUpdate();

        try {
            const response = await fetch(
                `${API_URL.replace("/v1", "")}/healthz`,
                {
                    headers: {
                        "X-API-Key": API_KEY,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                this.status = data.status;
                this.lastUpdate = new Date(data.time).toLocaleString();
            } else {
                this.status = "error";
                this.lastUpdate = new Date().toLocaleString();
            }
        } catch (error) {
            console.error("Failed to load status:", error);
            this.status = "error";
            this.lastUpdate = new Date().toLocaleString();
        } finally {
            this.loading = false;
            this.requestUpdate();
        }
    }

    render() {
        return html`
            <div class="status-indicator">
                <span class="status-label">System Status:</span>
                <span class="status-badge status-${this.status}">
                    ${this.loading ? "..." : this.status.toUpperCase()}
                </span>
                <span class="last-update">
                    ${this.loading ? "Checking..." : `as of ${this.lastUpdate}`}
                </span>
            </div>
        `;
    }
}

customElements.define("status-indicator", StatusIndicator);
