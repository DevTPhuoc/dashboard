/**
 * Utility Functions
 * Common helper functions used throughout the application
 */

/**
 * Page loading functionality for iframe
 * @param {string} url - URL to load in the iframe
 */
function loadPage(url) {
  const iframe = document.getElementById("contentFrame");
  const loading = document.querySelector(".loading-overlay");

  if (loading) {
    loading.style.display = "flex";
  }
  iframe.src = url;

  iframe.onload = () => {
    setTimeout(() => {
      if (loading) loading.style.display = "none";
    }, 500);
  };
}

/**
 * Get icon class for page based on content mapping
 * @param {Object} page - Page object
 * @returns {string} - Font Awesome icon class
 */
function getIconForPage(page) {
  // Extract icon from page name or use default mapping
  const iconMap = {
    "báo cáo": "fas fa-chart-bar",
    report: "fas fa-chart-bar",
    "thống kê": "fas fa-chart-line",
    statistics: "fas fa-chart-line",
    "quản lý": "fas fa-cogs",
    management: "fas fa-cogs",
    "cài đặt": "fas fa-cog",
    settings: "fas fa-cog",
    "người dùng": "fas fa-users",
    users: "fas fa-users",
    "tài liệu": "fas fa-file-alt",
    documents: "fas fa-file-alt",
    audit: "fas fa-shield-alt",
    "kiểm tra": "fas fa-shield-alt",
  };

  const pageName = page.name.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (pageName.includes(key)) {
      return icon;
    }
  }

  // Default icon
  return "fas fa-circle";
}

/**
 * Get color class for page icon
 * @param {Object} page - Page object
 * @returns {string} - Tailwind color class
 */
function getColorForPage(page) {
  const colorMap = {
    "báo cáo": "text-blue-400",
    report: "text-blue-400",
    "thống kê": "text-green-400",
    statistics: "text-green-400",
    "quản lý": "text-purple-400",
    management: "text-purple-400",
    "cài đặt": "text-yellow-400",
    settings: "text-yellow-400",
    "người dùng": "text-cyan-400",
    users: "text-cyan-400",
    "tài liệu": "text-orange-400",
    documents: "text-orange-400",
    audit: "text-red-400",
    "kiểm tra": "text-red-400",
  };

  const pageName = page.name.toLowerCase();
  for (const [key, color] of Object.entries(colorMap)) {
    if (pageName.includes(key)) {
      return color;
    }
  }

  // Default color
  return "text-gray-400";
}

// Export functions for global use
window.loadPage = loadPage;
window.getIconForPage = getIconForPage;
window.getColorForPage = getColorForPage;
