import { LitElement, html, css } from "lit";

class StatusChip extends LitElement {
    static properties = {
        status: { type: String },
        size: { type: String },
        showIcon: { type: Boolean },
    };

    status = "unknown";
    size = "medium";
    showIcon = false;

    constructor() {
        super();
        console.log("StatusChip constructor called");
    }

    connectedCallback() {
        super.connectedCallback();
        console.log("StatusChip connected, status:", this.status);
    }

    updated(changedProperties) {
        console.log(
            "StatusChip updated, changed properties:",
            changedProperties
        );
        if (changedProperties.has("status")) {
            console.log(
                "Status changed from",
                changedProperties.get("status"),
                "to",
                this.status
            );
        }
    }

    static styles = css`
        :host {
            display: inline-block;
        }

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

        /* Size variants */
        .size-small {
            padding: 2px 6px;
            font-size: 10px;
            border-radius: 8px;
        }

        .size-medium {
            padding: 4px 8px;
            font-size: 12px;
            border-radius: 12px;
        }

        .size-large {
            padding: 6px 12px;
            font-size: 14px;
            border-radius: 16px;
        }

        /* Status colors - ALL the statuses your API returns */
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

        /* Fallback for unknown statuses */
        .status-unknown {
            background: #f5f5f5;
            color: #616161;
            border-color: #9e9e9e;
        }

        /* Icon styles */
        .status-icon {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .size-small .status-icon {
            width: 6px;
            height: 6px;
        }

        .size-large .status-icon {
            width: 10px;
            height: 10px;
        }

        /* Icon colors - ALL the statuses */
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

        .status-unknown .status-icon {
            background: #9e9e9e;
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

    get statusClass() {
        const cls = `status-${this.status.toLowerCase()}`;
        console.log(
            "StatusChip statusClass computed:",
            cls,
            "for status:",
            this.status
        );
        return cls;
    }

    get sizeClass() {
        return `size-${this.size}`;
    }

    render() {
        console.log("StatusChip render called with status:", this.status);
        return html`
            <span class="status-chip ${this.statusClass} ${this.sizeClass}">
                ${this.showIcon ? html`<span class="status-icon"></span>` : ""}
                <span class="status-text">${this.status}</span>
            </span>
        `;
    }
}

customElements.define("status-chip", StatusChip);
