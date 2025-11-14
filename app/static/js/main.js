/**
 * Main Application Initialization
 * Entry point for the dashboard application
 */

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize sidebar manager
  new SidebarWithPin();

  // Load dynamic menu from API
  loadDynamicMenu();
});
