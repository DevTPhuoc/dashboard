/**
 * Dynamic Menu System
 * Handles loading and rendering of permission-based menu from API
 */

/**
 * Load dynamic menu from API and render it
 */
async function loadDynamicMenu() {
  try {
    const response = await fetch("/api/user/menu");
    if (!response.ok) {
      console.warn("Could not load dynamic menu, using default");
      return;
    }

    const menuData = await response.json();
    if (menuData && menuData.pages) {
      renderDynamicMenu(menuData.pages);
    }
  } catch (error) {
    console.error("Error loading dynamic menu:", error);
  }
}

/**
 * Render the dynamic menu from page data
 * @param {Array} pages - Array of page objects
 */
function renderDynamicMenu(pages) {
  const menuContainer = document.getElementById("dynamic-menu");
  if (!menuContainer) return;

  // Keep the dashboard link (first child)
  const dashboardLink = menuContainer.firstElementChild;

  // Clear existing dynamic content but keep dashboard
  menuContainer.innerHTML = "";
  if (dashboardLink) {
    menuContainer.appendChild(dashboardLink);
  }

  // Group pages by parent
  const mainPages = pages.filter((page) => !page.parent_id);
  const subPages = pages.filter((page) => page.parent_id);

  mainPages.forEach((mainPage) => {
    const children = subPages.filter((sub) => sub.parent_id === mainPage.id);
    const hasChildren = children.length > 0;

    if (hasChildren) {
      // Create parent with dropdown
      const parentElement = createParentMenuItem(mainPage, children);
      menuContainer.appendChild(parentElement);
    } else {
      // Create simple link
      const linkElement = createSimpleMenuItem(mainPage);
      menuContainer.appendChild(linkElement);
    }
  });

  // Add admin link if user is admin
  if (window.userConfig && window.userConfig.isAdmin) {
    const adminLink = createAdminMenuItem();
    menuContainer.appendChild(adminLink);
  }
}

/**
 * Create a simple menu item (no children)
 * @param {Object} page - Page object
 * @returns {HTMLElement} - Link element
 */
function createSimpleMenuItem(page) {
  const link = document.createElement("a");
  link.href = "#";
  link.onclick = () => loadPage(page.url);
  link.className =
    "nav-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200";

  const { icon, displayName } = parsePageNameAndIcon(page.name);

  link.innerHTML = `
    <span class="w-5 h-5 mr-3 flex-shrink-0 text-center text-lg">${icon}</span>
    <span class="nav-text whitespace-nowrap">${displayName}</span>
  `;

  return link;
}

/**
 * Create a parent menu item with children dropdown
 * @param {Object} mainPage - Main page object
 * @param {Array} children - Array of child page objects
 * @returns {HTMLElement} - Container element with dropdown
 */
function createParentMenuItem(mainPage, children) {
  const container = document.createElement("div");
  container.className = "dropdown-container";

  // Main button
  const button = document.createElement("button");
  button.className =
    "nav-link group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200";

  const { icon, displayName } = parsePageNameAndIcon(mainPage.name);

  button.innerHTML = `
    <span class="w-5 h-5 mr-3 text-center text-lg">${icon}</span>
    <span class="nav-text whitespace-nowrap">${displayName}</span>
    <i class="fas fa-chevron-down ml-auto text-xs transition-transform duration-200 chevron"></i>
  `;

  // Children container (hidden by default)
  const childrenContainer = document.createElement("div");
  childrenContainer.className = "children-menu ml-6 mt-1 space-y-1 hidden";

  children.forEach((child) => {
    const childLink = document.createElement("a");
    childLink.href = "#";
    childLink.onclick = () => loadPage(child.url);
    childLink.className =
      "block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200";
    childLink.textContent = child.name;
    childrenContainer.appendChild(childLink);
  });

  // Toggle children on click
  button.onclick = function () {
    const isHidden = childrenContainer.classList.contains("hidden");
    const chevron = button.querySelector(".chevron");

    if (isHidden) {
      childrenContainer.classList.remove("hidden");
      chevron.style.transform = "rotate(180deg)";
    } else {
      childrenContainer.classList.add("hidden");
      chevron.style.transform = "rotate(0deg)";
    }
  };

  container.appendChild(button);
  container.appendChild(childrenContainer);

  return container;
}

/**
 * Create admin menu item
 * @returns {HTMLElement} - Admin link element
 */
function createAdminMenuItem() {
  const link = document.createElement("a");
  link.href = "#";
  link.onclick = () => loadPage("/admin");
  link.className =
    "nav-link group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200";

  link.innerHTML = `
    <span class="w-5 h-5 mr-3 text-red-400 flex-shrink-0 text-center">🛠️</span>
    <span class="nav-text whitespace-nowrap">Admin</span>
  `;

  return link;
}

/**
 * Parse page name to extract icon and display name
 * @param {string} pageName - Full page name
 * @returns {Object} - Object with icon and displayName
 */
function parsePageNameAndIcon(pageName) {
  if (pageName && pageName.length > 0) {
    // Use proper emoji/unicode splitting
    const symbols = [...pageName]; // This handles multi-byte characters properly
    const icon = symbols[0]; // First symbol (emoji or character)
    const displayName = symbols.slice(1).join("").trim(); // Rest of the string

    return {
      icon: icon,
      displayName: displayName,
    };
  }

  // Fallback if empty name
  return {
    icon: "📄",
    displayName: pageName || "Unknown",
  };
}

// Export functions for global use
window.loadDynamicMenu = loadDynamicMenu;
window.renderDynamicMenu = renderDynamicMenu;
window.createSimpleMenuItem = createSimpleMenuItem;
window.createParentMenuItem = createParentMenuItem;
window.createAdminMenuItem = createAdminMenuItem;
window.parsePageNameAndIcon = parsePageNameAndIcon;
