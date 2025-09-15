import { LitElement, html, css } from "lit";
import { API_KEY, API_URL } from "../constants.js";

class ServicesList extends LitElement {
    static properties = {
        services: {
            type: Array,
        },
        count: { type: Number },
    };
    services = [];
    count = 0;
    hasLoaded = false;
    page = 1;
    per_page = 5;

    static styles = css`
        .services-list-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .services-list {
            border: 1px solid #ccc;
            padding: 10px;
            border-radius: 5px;
        }
        .services-list-header-title {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
            padding: 0;
        }
        .service-item {
            border: 1px solid #ccc;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 10px;
            gap: 10px;
        }
        .service-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .service-item-body {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
        }
        .service-item-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
        }
        .service-item h3 {
            font-size: 18px;
            font-weight: bold;
            margin: 0;
            padding: 0;
        }
        .service-item p {
            margin: 0;
            padding: 0;
        }
        .pagination-controls-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .pagination-controls-buttons {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
        }
        .pagination-controls-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
        }
        .service-item-name-version {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
        }
        .service-item-status {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
        }

        /* Status chip styles */
        .status-chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid transparent;
            transition: all 0.2s ease;
        }

        .status-icon {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        /* Status colors */
        .status-healthy {
            background: #e8f5e8;
            color: #2e7d32;
            border-color: #4caf50;
        }

        .status-degraded {
            background: #fff3e0;
            color: #ef6c00;
            border-color: #ff9800;
        }

        .status-down {
            background: #ffebee;
            color: #c62828;
            border-color: #f44336;
        }

        .status-maintenance {
            background: #f3e5f5;
            color: #7b1fa2;
            border-color: #9c27b0;
        }

        .status-scaling {
            background: #e3f2fd;
            color: #1565c0;
            border-color: #2196f3;
        }

        /* Icon colors */
        .status-healthy .status-icon {
            background: #4caf50;
        }

        .status-degraded .status-icon {
            background: #ff9800;
        }

        .status-down .status-icon {
            background: #f44336;
        }

        .status-maintenance .status-icon {
            background: #9c27b0;
        }

        .status-scaling .status-icon {
            background: #2196f3;
        }

        /* Pulsing animation for down status */
        .status-down {
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% {
                opacity: 1;
            }
            50% {
                opacity: 0.7;
            }
            100% {
                opacity: 1;
            }
        }
    `;

    get hasPreviousPage() {
        return this.page > 1;
    }

    set hasPreviousPage(value) {
        // This setter is required by LitElement but we don't need to store the value
        // since it's calculated dynamically
    }

    get hasNextPage() {
        return this.page < Math.ceil(this.count / this.per_page);
    }

    set hasNextPage(value) {
        // This setter is required by LitElement but we don't need to store the value
        // since it's calculated dynamically
    }

    connectedCallback() {
        super.connectedCallback();
        console.log("ServicesList connected to DOM");

        if (!this.hasLoaded) {
            this.loadServices();
            this.loadCount();
            this.hasLoaded = true;
        }
    }

    async loadServices() {
        console.log("loadServices called");

        const url = new URL(`${API_URL}/services`);
        url.searchParams.set("page", this.page);
        url.searchParams.set("per_page", this.per_page);

        const response = await fetch(url, {
            headers: {
                "X-API-Key": API_KEY,
            },
        });

        console.log("response", response);
        const data = await response.json();
        console.log("data", data);

        console.log("Before assignment - services:", this.services);
        this.services = [...data.data];
        console.log("After assignment - services:", this.services);
        this.requestUpdate();
    }

    async loadCount() {
        const response = await fetch(`${API_URL}/services/count`, {
            headers: {
                "X-API-Key": API_KEY,
            },
        });
        const data = await response.json();
        console.log("data from count", data);
        this.count = data.data;
        console.log("count updated to:", this.count);
        this.requestUpdate();
    }

    getHeaderTitleLengthDisplay(length) {
        return length > 0 ? `(${length})` : "";
    }

    loadPreviousPage() {
        console.log("loadPreviousPage called");
        this.page--;
        this.loadServices();
    }

    loadNextPage() {
        console.log("loadNextPage called");
        this.page++;
        this.loadServices();
    }

    render() {
        return html`
            <div class="services-list">
                <div class="services-list-header">
                    <h2 class="services-list-header-title">
                        Available Services
                        ${this.getHeaderTitleLengthDisplay(this.count)}
                    </h2>

                    <button @click=${this.loadServices}>Reload Services</button>
                </div>
                ${this.services.map(
                    (service, index) =>
                        html`<div class="service-item">
                            <div class="service-item-header">
                                <div class="service-item-name-version">
                                    <h3>${service.name}</h3>
                                    <p>Version: ${service.version}</p>
                                </div>
                                <div class="service-item-status">
                                    <span
                                        class="status-chip status-${service.status.toLowerCase()}"
                                    >
                                        <span class="status-icon"></span>
                                        <span class="status-text"
                                            >${service.status}</span
                                        >
                                    </span>
                                </div>
                            </div>
                            <div class="service-item-body">
                                <p>Replicas: ${service.replicas}</p>
                                <p>
                                    Desired Replicas:
                                    ${service.desired_replicas}
                                </p>
                            </div>
                            <div class="service-item-footer">
                                <p>Last Deploy At: ${service.last_deploy_at}</p>
                                <p>Owner: ${service.owner}</p>
                                <p>ID: ${service.id}</p>
                            </div>
                        </div>`
                )}
                <div class="pagination-controls-container">
                    <div class="pagination-controls-buttons">
                        <button
                            @click=${this.loadPreviousPage}
                            ?disabled=${!this.hasPreviousPage}
                        >
                            Previous
                        </button>
                        <button
                            @click=${this.loadNextPage}
                            ?disabled=${!this.hasNextPage}
                        >
                            Next
                        </button>
                    </div>
                    <div class="pagination-controls-info">
                        <p>Page: ${this.page}</p>
                        <p>Per Page: ${this.per_page}</p>
                        <p>Total pages: ${this.count / this.per_page}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("services-list", ServicesList);
