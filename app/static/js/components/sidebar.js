/**
 * Sidebar with Pin Functionality
 * Handles sidebar toggle, pin, hover, and user dropdown functionality
 */

class SidebarWithPin {
  constructor() {
    this.sidebar = document.getElementById("sidebar");
    this.toggle = document.getElementById("sidebarToggle");
    this.pinButton = document.getElementById("pinButton");
    this.mainContent = document.getElementById("mainContent");
    this.isHidden = false;
    this.isPinned = true;

    this.init();
  }

  init() {
    this.toggle.addEventListener("click", () => this.toggleSidebar());
    this.pinButton.addEventListener("click", () => this.togglePin());
    this.loadPinnedState();
    this.initUserDropdown();
    this.initSmartHover();
  }

  initSmartHover() {
    // Smart hover that excludes toggle button area
    this.sidebar.addEventListener("mouseenter", (e) => {
      // Only expand if mouse is not over toggle button and x > 30px
      if (e.clientX > 30 && !this.isToggleHovered()) {
        this.sidebar.classList.add("hover-expand");
      }
    });

    this.sidebar.addEventListener("mouseleave", () => {
      this.sidebar.classList.remove("hover-expand");
    });

    this.sidebar.addEventListener("mousemove", (e) => {
      // Check if mouse is in safe hover zone (x > 30px)
      if (e.clientX > 30 && !this.isToggleHovered()) {
        this.sidebar.classList.add("hover-expand");
      } else if (e.clientX <= 30) {
        this.sidebar.classList.remove("hover-expand");
      }
    });
  }

  isToggleHovered() {
    return this.toggle.matches(":hover");
  }

  toggleSidebar() {
    this.isHidden = !this.isHidden;

    if (this.isHidden) {
      this.sidebar.classList.add("hidden");
      this.mainContent.classList.add("sidebar-hidden");
      this.toggle.querySelector(".toggle-icon").className =
        "fas fa-chevron-right toggle-icon";
    } else {
      this.sidebar.classList.remove("hidden");
      this.mainContent.classList.remove("sidebar-hidden");
      this.toggle.querySelector(".toggle-icon").className =
        "fas fa-chevron-left toggle-icon";
    }
  }

  togglePin() {
    this.isPinned = !this.isPinned;

    if (this.isPinned) {
      this.sidebar.classList.add("pinned");
      this.pinButton.querySelector("i").style.transform = "rotate(0deg)";
      this.pinButton.classList.add("text-blue-400", "border-blue-400");
    } else {
      this.sidebar.classList.remove("pinned");
      this.pinButton.querySelector("i").style.transform = "rotate(45deg)";
      this.pinButton.classList.remove("text-blue-400", "border-blue-400");
    }

    this.savePinnedState();
  }

  loadPinnedState() {
    try {
      this.isPinned = localStorage.getItem("sidebar-pinned") === "true";
      if (this.isPinned) {
        this.sidebar.classList.add("pinned");
        this.pinButton.querySelector("i").style.transform = "rotate(0deg)";
        this.pinButton.classList.add("text-blue-400", "border-blue-400");
      }
    } catch (e) {
      this.isPinned = false;
    }
  }

  savePinnedState() {
    try {
      localStorage.setItem("sidebar-pinned", this.isPinned.toString());
    } catch (e) {
      console.warn("Could not save sidebar state");
    }
  }

  initUserDropdown() {
    const dropdown = document.querySelector(".user-dropdown");
    if (!dropdown) return;

    const button = dropdown.querySelector(".user-button");
    const menu = dropdown.querySelector(".dropdown-menu");

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("open");
      if (dropdown.classList.contains("open")) {
        menu.classList.remove("opacity-0", "invisible", "-translate-y-2");
        menu.classList.add("opacity-100", "visible", "translate-y-0");
      } else {
        menu.classList.add("opacity-0", "invisible", "-translate-y-2");
        menu.classList.remove("opacity-100", "visible", "translate-y-0");
      }
    });

    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("open");
        menu.classList.add("opacity-0", "invisible", "-translate-y-2");
        menu.classList.remove("opacity-100", "visible", "translate-y-0");
      }
    });
  }
}

// Export for use in other modules
window.SidebarWithPin = SidebarWithPin;
