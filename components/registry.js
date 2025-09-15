// Load components in dependency order
console.log("Loading components...");

// Load base components first
import "./statusChip.js";
console.log("StatusChip loaded");

import "./statusIndicator.js";
console.log("StatusIndicator loaded");

// Load components that depend on others
import "./servicesList.js";
console.log("ServicesList loaded");

import "./incidentsList.js";
console.log("IncidentsList loaded");

console.log("All components loaded");
