// Settings Page JavaScript
class SettingsManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupPasswordToggles();
    this.setupForms();
  }

  setupPasswordToggles() {
    const passwordToggles = document.querySelectorAll(".password-toggle");
    passwordToggles.forEach((toggle) => {
      toggle.addEventListener("click", (e) => {
        e.preventDefault();
        this.togglePassword(toggle);
      });
    });
  }

  togglePassword(toggle) {
    const input = toggle
      .closest(".password-input-wrapper")
      .querySelector("input");
    const icon = toggle.querySelector("i");

    if (input.type === "password") {
      input.type = "text";
      icon.className = "fas fa-eye-slash";
      toggle.style.color = "rgba(59, 130, 246, 0.8)";
    } else {
      input.type = "password";
      icon.className = "fas fa-eye";
      toggle.style.color = "rgba(255, 255, 255, 0.5)";
    }
  }

  setupForms() {
    // Change Password Form
    const changePasswordForm = document.getElementById("change-password-form");
    if (changePasswordForm) {
      changePasswordForm.addEventListener("submit", (e) => {
        this.handleChangePassword(e);
      });
    }

    // BVLab Settings Form
    const bvlabForm = document.getElementById("bvlab-form");
    if (bvlabForm) {
      bvlabForm.addEventListener("submit", (e) => {
        this.handleBVLabSettings(e);
      });
    }
  }

  showLoading(form) {
    let loading = form.querySelector(".form-loading");
    if (!loading) {
      loading = document.createElement("div");
      loading.className =
        "form-loading absolute inset-0 flex items-center justify-center z-10";
      loading.innerHTML = '<div class="loading-spinner"></div>';
      form.style.position = "relative";
      form.appendChild(loading);
    }
  }

  hideLoading(form) {
    const loading = form.querySelector(".form-loading");
    if (loading) {
      loading.remove();
    }
  }

  showMessage(elementId, message, type = "success") {
    const messageEl = document.getElementById(elementId);
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = `settings-message ${type}`;

      if (type === "success") {
        setTimeout(() => {
          messageEl.textContent = "";
          messageEl.className = "settings-message";
        }, 3000);
      }
    }
  }

  async handleChangePassword(e) {
    e.preventDefault();
    const form = e.target;

    try {
      this.showLoading(form);

      const formData = new FormData(form);
      const data = {
        username: document.querySelector("[data-username]").dataset.username,
        old_password: formData.get("old_password"),
        new_password: formData.get("new_password"),
      };

      const response = await fetch("/user_setting/api/change_password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        this.showMessage(
          "change-password-msg",
          result.message || "Đổi mật khẩu thành công",
          "success"
        );
        form.reset();
      } else {
        this.showMessage(
          "change-password-msg",
          result.message || "Có lỗi xảy ra",
          "error"
        );
      }
    } catch (error) {
      console.error("Error changing password:", error);
      this.showMessage(
        "change-password-msg",
        "Có lỗi xảy ra khi đổi mật khẩu",
        "error"
      );
    } finally {
      this.hideLoading(form);
    }
  }

  async handleBVLabSettings(e) {
    e.preventDefault();
    const form = e.target;

    try {
      this.showLoading(form);

      const formData = new FormData(form);
      const data = {
        user_bvlab: formData.get("user_bvlab"),
        password_bvlab: formData.get("password_bvlab"),
      };

      const response = await fetch("/user_setting/api/save_bvlab", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        this.showMessage(
          "bvlab-msg",
          result.message || "Lưu cài đặt BVLab thành công",
          "success"
        );
        form.reset();
      } else {
        this.showMessage(
          "bvlab-msg",
          result.message || "Có lỗi xảy ra",
          "error"
        );
      }
    } catch (error) {
      console.error("Error saving BVLab settings:", error);
      this.showMessage("bvlab-msg", "Có lỗi xảy ra khi lưu cài đặt", "error");
    } finally {
      this.hideLoading(form);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SettingsManager();
});
