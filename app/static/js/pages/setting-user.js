// Setting User Page - Simple Functions with Full Validation

// Initialize when DOM loaded
document.addEventListener("DOMContentLoaded", function () {
  initPasswordToggles();
  initForms();
});

// Password toggle functionality
function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll(".password-toggle");
  toggleButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      togglePassword(this);
    });
  });
}

function togglePassword(button) {
  const input = button.parentElement.querySelector("input");
  const icon = button.querySelector("i");

  if (input.type === "password") {
    input.type = "text";
    icon.classList.replace("fa-eye", "fa-eye-slash");
    button.classList.remove("text-gray-400");
    button.classList.add("text-blue-400");
  } else {
    input.type = "password";
    icon.classList.replace("fa-eye-slash", "fa-eye");
    button.classList.remove("text-blue-400");
    button.classList.add("text-gray-400");
  }
}

// Form initialization
function initForms() {
  const passwordForm = document.getElementById("password-form");
  const bvlabForm = document.getElementById("bvlab-form");

  if (passwordForm) {
    passwordForm.addEventListener("submit", handlePasswordSubmit);
  }

  if (bvlabForm) {
    bvlabForm.addEventListener("submit", handleBVLabSubmit);
  }
}

// Password validation
function validatePassword(password) {
  const errors = [];

  if (!password) {
    errors.push("Mật khẩu không được để trống");
  }

  return errors;
}

// BVLab validation
function validateBVLab(username, password) {
  const errors = [];

  if (!username || username.trim() === "") {
    errors.push("Tài khoản BVLab không được để trống");
  }

  if (!password || password.trim() === "") {
    errors.push("Mật khẩu BVLab không được để trống");
  }

  return errors;
}

// Show loading state
function showLoading(form) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;

  submitBtn.disabled = true;
  submitBtn.innerHTML =
    '<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full loading-spin mr-2"></div>Đang xử lý...';
  submitBtn.dataset.originalText = originalText;
}

// Hide loading state
function hideLoading(form) {
  const submitBtn = form.querySelector('button[type="submit"]');

  submitBtn.disabled = false;
  if (submitBtn.dataset.originalText) {
    submitBtn.innerHTML = submitBtn.dataset.originalText;
  }
}

// Show message
function showMessage(containerId, message, type = "success") {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.textContent = message;

  // Remove existing classes
  container.className = "mt-4 p-3 rounded-lg text-sm font-medium";

  // Add type-specific classes
  if (type === "success") {
    container.classList.add(
      "bg-green-500/10",
      "border",
      "border-green-500/30",
      "text-green-400"
    );
  } else if (type === "error") {
    container.classList.add(
      "bg-red-500/10",
      "border",
      "border-red-500/30",
      "text-red-400"
    );
  }

  // Auto hide success messages
  if (type === "success") {
    setTimeout(() => {
      container.textContent = "";
      container.className = "mt-4";
    }, 3000);
  }
}

// Handle password form submission
async function handlePasswordSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const oldPassword = formData.get("old_password");
  const newPassword = formData.get("new_password");
  const username = document.querySelector("[data-username]")?.dataset.username;

  // Clear previous messages
  showMessage("password-message", "", "success");

  // Validate old password
  if (!oldPassword || oldPassword.trim() === "") {
    showMessage("password-message", "Vui lòng nhập mật khẩu hiện tại", "error");
    return;
  }

  // Validate new password
  const passwordErrors = validatePassword(newPassword);
  if (passwordErrors.length > 0) {
    showMessage("password-message", passwordErrors.join(", "), "error");
    return;
  }

  // Check if passwords are the same
  if (oldPassword === newPassword) {
    showMessage(
      "password-message",
      "Mật khẩu mới phải khác mật khẩu hiện tại",
      "error"
    );
    return;
  }

  try {
    showLoading(form);

    const response = await fetch("/user_setting/api/change_password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      showMessage(
        "password-message",
        result.message || "Đổi mật khẩu thành công",
        "success"
      );
      form.reset();
    } else {
      showMessage(
        "password-message",
        result.message || "Có lỗi xảy ra",
        "error"
      );
    }
  } catch (error) {
    console.error("Password change error:", error);
    showMessage("password-message", "Có lỗi kết nối xảy ra", "error");
  } finally {
    hideLoading(form);
  }
}

// Handle BVLab form submission
async function handleBVLabSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const userBvlab = formData.get("user_bvlab");
  const passwordBvlab = formData.get("password_bvlab");

  // Clear previous messages
  showMessage("bvlab-message", "", "success");

  // Validate BVLab credentials
  const bvlabErrors = validateBVLab(userBvlab, passwordBvlab);
  if (bvlabErrors.length > 0) {
    showMessage("bvlab-message", bvlabErrors.join(", "), "error");
    return;
  }

  try {
    showLoading(form);

    const response = await fetch("/user_setting/api/save_bvlab", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_bvlab: userBvlab.trim(),
        password_bvlab: passwordBvlab.trim(),
      }),
    });

    const result = await response.json();

    if (response.ok) {
      showMessage(
        "bvlab-message",
        result.message || "Lưu cài đặt BVLab thành công",
        "success"
      );
    } else {
      showMessage("bvlab-message", result.message || "Có lỗi xảy ra", "error");
    }
  } catch (error) {
    console.error("BVLab save error:", error);
    showMessage("bvlab-message", "Có lỗi kết nối xảy ra", "error");
  } finally {
    hideLoading(form);
  }
}
