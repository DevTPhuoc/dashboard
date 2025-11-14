// Trang Admin - Chức năng nâng cao với validation

// Khởi tạo khi DOM được load
document.addEventListener("DOMContentLoaded", function () {
  initAdminForms();
  initCardToggle();
  initUserSearch();
  initPermissionFeatures();
  extractRolesData();
  // restoreCardState(); // Bỏ comment nếu muốn dùng tính năng lưu trạng thái card
});

// Khởi tạo tất cả forms admin với AJAX
function initAdminForms() {
  const forms = document.querySelectorAll(".admin-ajax-form");
  forms.forEach((form) => {
    form.addEventListener("submit", handleFormSubmit);
  });
}

// Chức năng toggle card
function initCardToggle() {
  // Làm cho toàn bộ header có thể click để toggle card
  const cardHeaders = document.querySelectorAll(
    ".admin-card .flex.items-center.justify-between"
  );
  
  cardHeaders.forEach((header) => {
    // Thêm style cursor pointer
    header.style.cursor = "pointer";
    header.style.userSelect = "none";

    header.addEventListener("click", function (e) {
      // Ngăn event bubbling từ buttons hoặc các elements tương tác khác
      if (
        e.target.closest("button") ||
        e.target.closest("input") ||
        e.target.closest("select")
      ) {
        return;
      }

      const toggleButton = this.querySelector(".card-toggle");
      if (toggleButton) {
        toggleCard(toggleButton);
      }
    });
  });

  // Giữ chức năng button gốc cho accessibility
  const toggleButtons = document.querySelectorAll(".card-toggle");
  toggleButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.stopPropagation(); // Ngăn header click từ firing
      toggleCard(this);
    });
  });
}

// Toggle card mở rộng/thu gọn
function toggleCard(button) {
  const card = button.closest(".admin-card");
  const content = card.querySelector(".card-content");
  const icon = button.querySelector(".toggle-icon");
  
  if (!card || !content || !icon) {
    console.error("Không tìm thấy các elements cần thiết cho toggle card");
    return;
  }

  const isExpanded = content.classList.contains("expanded");
  
  if (content.classList.contains("collapsed")) {
    content.classList.remove("collapsed");
    content.classList.add("expanded");
    icon.classList.replace("fa-chevron-down", "fa-chevron-up");
    button.setAttribute("aria-expanded", "true");
  } else {
    content.classList.remove("expanded");
    content.classList.add("collapsed");
    icon.classList.replace("fa-chevron-up", "fa-chevron-down");
    button.setAttribute("aria-expanded", "false");
  }
  
  // Lưu trạng thái card (nếu cần)
  const cardId = card.dataset.cardId || card.id;
  if (cardId) {
    sessionStorage.setItem(`card-${cardId}`, isExpanded ? "collapsed" : "expanded");
  }
}

// Khởi tạo chức năng tìm kiếm user
function initUserSearch() {
  const userSearch = document.getElementById("userSearch");
  if (userSearch) {
    userSearch.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase();
      const userRows = document.querySelectorAll(".user-row");

      userRows.forEach((row) => {
        const username = row.dataset.username || "";
        if (username.includes(searchTerm)) {
          row.classList.remove("hidden");
        } else {
          row.classList.add("hidden");
        }
      });
    });
  }
}

// Khôi phục trạng thái card (nếu cần sử dụng)
function restoreCardState() {
  const cards = document.querySelectorAll(".admin-card");
  cards.forEach((card) => {
    const cardId = card.dataset.cardId || card.id;
    if (!cardId) return;
    
    const content = card.querySelector(".card-content");
    const button = card.querySelector(".card-toggle");
    const icon = button?.querySelector(".toggle-icon");

    if (!content || !button || !icon) return;

    const state = sessionStorage.getItem(`card-${cardId}`);
    if (state === "expanded") {
      content.classList.remove("collapsed");
      content.classList.add("expanded");
      icon.classList.replace("fa-chevron-down", "fa-chevron-up");
      button.setAttribute("aria-expanded", "true");
    } else if (state === "collapsed") {
      content.classList.remove("expanded");
      content.classList.add("collapsed");
      icon.classList.replace("fa-chevron-up", "fa-chevron-down");
      button.setAttribute("aria-expanded", "false");
    }
  });
}

// Khởi tạo các tính năng phân quyền
function initPermissionFeatures() {
  // Tìm kiếm và lọc phân quyền user
  const userPermissionSearch = document.getElementById("userPermissionSearch");
  const userPermissionFilter = document.getElementById("userPermissionFilter");

  if (userPermissionSearch) {
    userPermissionSearch.addEventListener("input", function () {
      filterUserPermissions();
    });
  }

  if (userPermissionFilter) {
    userPermissionFilter.addEventListener("change", function () {
      filterUserPermissions();
    });
  }

  // Lọc phân quyền role
  const rolePermissionFilter = document.getElementById("rolePermissionFilter");
  if (rolePermissionFilter) {
    rolePermissionFilter.addEventListener("change", function () {
      filterRolePermissions();
    });
  }

  // Các nút Chọn tất cả / Bỏ chọn tất cả
  initSelectButtons();
}

// Lọc phân quyền user
function filterUserPermissions() {
  const userPermissionSearch = document.getElementById("userPermissionSearch");
  const userPermissionFilter = document.getElementById("userPermissionFilter");
  
  if (!userPermissionSearch || !userPermissionFilter) return;
  
  const searchTerm = userPermissionSearch.value.toLowerCase();
  const selectedUserId = userPermissionFilter.value;
  const userForms = document.querySelectorAll(".user-permission-form");

  userForms.forEach((form) => {
    const username = form.dataset.username || "";
    const userId = form.dataset.userId || "";

    let showBySearch = !searchTerm || username.includes(searchTerm);
    let showByFilter = !selectedUserId || userId === selectedUserId;

    if (showBySearch && showByFilter) {
      form.classList.remove("hidden");
    } else {
      form.classList.add("hidden");
    }
  });
}

// Lọc phân quyền role
function filterRolePermissions() {
  const rolePermissionFilter = document.getElementById("rolePermissionFilter");
  if (!rolePermissionFilter) return;
  
  const selectedRoleId = rolePermissionFilter.value;
  const roleForms = document.querySelectorAll(".role-permission-form");

  roleForms.forEach((form) => {
    const roleId = form.dataset.roleId || "";

    if (!selectedRoleId || roleId === selectedRoleId) {
      form.classList.remove("hidden");
    } else {
      form.classList.add("hidden");
    }
  });
}

// Khởi tạo các nút chọn tất cả/bỏ chọn tất cả
function initSelectButtons() {
  // Các nút Chọn tất cả
  document.querySelectorAll(".select-all-pages").forEach((button) => {
    button.addEventListener("click", function () {
      const form = this.closest("form");
      if (form) {
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox) => {
          checkbox.checked = true;
        });
      }
    });
  });

  // Các nút Bỏ chọn tất cả
  document.querySelectorAll(".clear-all-pages").forEach((button) => {
    button.addEventListener("click", function () {
      const form = this.closest("form");
      if (form) {
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox) => {
          checkbox.checked = false;
        });
      }
    });
  });
}

// Validation form
function validateForm(form) {
  const action = form.getAttribute("action") || "";
  const formData = new FormData(form);

  // Validation role
  if (action.includes("add_role")) {
    const roleName = formData.get("role_name");
    if (!roleName || roleName.trim() === "") {
      showMessage("Tên role không được để trống", "error");
      return false;
    }
    if (roleName.length > 50) {
      showMessage("Tên role không được dài quá 50 ký tự", "error");
      return false;
    }
  }

  // Validation user
  if (action.includes("add_user")) {
    const username = formData.get("username");
    const password = formData.get("password");
    
    if (!username || username.trim() === "") {
      showMessage("Tên đăng nhập không được để trống", "error");
      return false;
    }
    if (!password || password.trim() === "") {
      showMessage("Mật khẩu không được để trống", "error");
      return false;
    }
    if (username.length > 50) {
      showMessage("Tên đăng nhập không được dài quá 50 ký tự", "error");
      return false;
    }
  }

  return true;
}

// Hiển thị trạng thái loading
function showLoading(form) {
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.dataset.originalText = originalText;
    submitBtn.innerHTML =
      '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full admin-loading-spin mr-2 inline-block animate-spin"></div>Đang xử lý...';
  }
}

// Ẩn trạng thái loading
function hideLoading(form) {
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = false;
    if (submitBtn.dataset.originalText) {
      submitBtn.innerHTML = submitBtn.dataset.originalText;
    }
  }
}

// Hiển thị thông báo
function showMessage(message, type = "success") {
  const container = document.getElementById("admin-messages");
  if (!container) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = `p-4 rounded-lg mb-4 font-medium text-sm transition-all duration-300`;

  if (type === "success") {
    messageDiv.classList.add(
      "bg-green-500/10",
      "border",
      "border-green-500/30",
      "text-green-400"
    );
  } else if (type === "error") {
    messageDiv.classList.add(
      "bg-red-500/10",
      "border",
      "border-red-500/30",
      "text-red-400"
    );
  }

  messageDiv.textContent = message;
  container.innerHTML = "";
  container.appendChild(messageDiv);

  // Tự động ẩn thông báo thành công
  if (type === "success") {
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.style.opacity = "0";
        setTimeout(() => {
          if (messageDiv.parentNode) {
            messageDiv.remove();
          }
        }, 300);
      }
    }, 3000);
  }
}

// Hiển thị hiệu ứng lưu thành công
function showSuccessEffect(element) {
  if (!element) return;

  // Tạo hiệu ứng flash xanh
  const originalBg = element.style.backgroundColor;
  const originalBorder = element.style.border;

  element.style.backgroundColor = "rgba(34, 197, 94, 0.1)";
  element.style.border = "2px solid rgba(34, 197, 94, 0.3)";
  element.style.transform = "scale(1.02)";
  element.style.transition = "all 0.3s ease";

  // Tạo icon checkmark tạm thời
  const checkIcon = document.createElement("div");
  checkIcon.innerHTML = '<i class="fas fa-check text-green-400"></i>';
  checkIcon.className =
    "absolute top-2 right-2 bg-green-500/20 rounded-full p-2 animate-pulse";
  checkIcon.style.zIndex = "1000";

  const elementPosition = element.style.position;
  if (elementPosition !== "relative" && elementPosition !== "absolute") {
    element.style.position = "relative";
  }

  element.appendChild(checkIcon);

  // Reset sau 2 giây
  setTimeout(() => {
    element.style.backgroundColor = originalBg;
    element.style.border = originalBorder;
    element.style.transform = "scale(1)";

    if (checkIcon.parentNode) {
      checkIcon.remove();
    }
  }, 2000);
}

// Xử lý submit form
async function handleFormSubmit(e) {
  e.preventDefault();

  const form = e.target;

  // Validate form
  if (!validateForm(form)) {
    return;
  }

  // Hiển thị xác nhận cho các thao tác xóa
  const action = form.getAttribute("action") || "";
  if (action.includes("delete")) {
    const confirmMessage = action.includes("delete_user")
      ? "Bạn chắc chắn muốn xóa user này?"
      : "Bạn chắc chắn muốn xóa role này?";

    if (!confirm(confirmMessage)) {
      return;
    }
  }

  try {
    showLoading(form);

    const formData = new FormData(form);
    const response = await fetch(form.action, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      showMessage(result.message, "success");

      // Hiển thị hiệu ứng lưu thành công
      showSuccessEffect(form);

            // Xử lý các thao tác khác nhau mà không reload trang
      handleSuccessAction(form, result);
    } else {
      showMessage(result.message || "Có lỗi xảy ra", "error");
    }
  } catch (error) {
    console.error("Lỗi form admin:", error);
    showMessage("Có lỗi kết nối xảy ra", "error");
  } finally {
    hideLoading(form);
  }
}

// Xử lý thao tác thành công mà không reload trang
function handleSuccessAction(form, result) {
  const action = form.getAttribute("action") || "";

  // Reset form cho các thao tác thêm
  if (action.includes("add_")) {
    form.reset();
  }

  // Xử lý xóa user
  if (action.includes("delete_user")) {
    const userRow = form.closest("tr");
    if (userRow) {
      userRow.style.opacity = "0";
      userRow.style.transform = "translateX(-100%)";
      setTimeout(() => {
        userRow.remove();
      }, 300);
    }
  }

  // Xử lý xóa role
  if (action.includes("delete_role")) {
    const roleItem = form.closest(".flex.items-center");
    if (roleItem) {
      roleItem.style.opacity = "0";
      roleItem.style.transform = "scale(0.8)";
      setTimeout(() => {
        roleItem.remove();
      }, 300);
    }
  }

  // Xử lý thêm user - thêm row mới vào table động
  if (action.includes("add_user") && result.user) {
    addUserToTable(result.user);
    updateUserPermissionOptions(result.user);
    addUserPermissionForm(result.user);
  }

  // Xử lý thêm role - thêm role tag mới động
  if (action.includes("add_role") && result.role) {
    addRoleToList(result.role);
  }

  // Xử lý thay đổi role - cập nhật badge role của user
  if (action.includes("set_role") && result.user) {
    updateUserRoleBadge(form, result.user);
  }
}

// Thêm user mới vào table một cách động
function addUserToTable(user) {
  const tableBody = document.querySelector("#usersTable tbody");
  if (!tableBody) {
    console.error("Không tìm thấy tbody của usersTable!");
    return;
  }

  const roleClass = getRoleClass(user.role_name);

  const newRow = document.createElement("tr");
  newRow.className = "hover:bg-white/5 transition-colors user-row";
  newRow.dataset.username = user.username.toLowerCase();
  newRow.style.transition = "all 0.3s ease";

  newRow.innerHTML = `
    <td class="py-3 px-4 text-gray-300">${user.id}</td>
    <td class="py-3 px-4 text-white font-medium">${user.username}</td>
    <td class="py-3 px-4">
      <span class="inline-flex px-3 py-1 rounded-full text-xs font-medium ${roleClass}">
        ${user.role_name}
      </span>
    </td>
    <td class="py-3 px-4">
      <form class="admin-ajax-form flex gap-2 items-center" method="post" action="/admin/set_role/${user.id}">
        <select name="role_id" class="admin-glass-input px-2 py-1 border border-white/10 rounded text-white text-sm focus:border-blue-500/50 focus:outline-none">
          ${generateRoleOptions(user.role_id)}
        </select>
        <button type="submit" class="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded border border-blue-500/30 text-sm transition-all">
          Cập nhật
        </button>
      </form>
    </td>
    <td class="py-3 px-4">
      ${user.username !== "admin"
        ? `<form class="admin-ajax-form" method="post" action="/admin/delete_user/${user.id}">
            <button type="submit" class="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded border border-red-500/30 text-sm transition-all">
              Xóa
            </button>
           </form>`
        : '<span class="text-gray-500 text-sm">Không thể xóa</span>'
      }
    </td>
  `;

  // Thêm với animation
  newRow.style.opacity = "0";
  newRow.style.transform = "translateY(-20px)";
  tableBody.appendChild(newRow);

  // Khởi tạo lại form handlers cho row mới
  const newForms = newRow.querySelectorAll(".admin-ajax-form");
  newForms.forEach((form) => {
    form.addEventListener("submit", handleFormSubmit);
  });

  // Animate vào
  requestAnimationFrame(() => {
    newRow.style.opacity = "1";
    newRow.style.transform = "translateY(0)";
  });
}

// Helper function để lấy class cho role
function getRoleClass(roleName) {
  switch (roleName) {
    case "admin":
      return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
    case "user":
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    case "manager":
      return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
  }
}

// Thêm role mới vào danh sách một cách động
function addRoleToList(role) {
  const rolesList = document.querySelector(".flex.flex-wrap.gap-3");
  if (!rolesList) {
    console.error("Không tìm thấy danh sách roles!");
    return;
  }

  const newRoleDiv = document.createElement("div");
  newRoleDiv.className =
    "flex items-center bg-blue-500/10 border border-blue-500/30 px-4 py-2 rounded-lg";

  newRoleDiv.innerHTML = `
    <span class="text-blue-400 font-medium">${role.name}</span>
    ${role.name !== 'admin' 
      ? `<form class="admin-ajax-form ml-3" method="post" action="/admin/delete_role/${role.id}">
          <button type="submit" class="text-red-400 hover:text-red-300 transition-colors">
            <i class="fas fa-times"></i>
          </button>
         </form>`
      : ''
    }
  `;

  // Thêm với animation
  newRoleDiv.style.opacity = "0";
  newRoleDiv.style.transform = "scale(0.8)";
  newRoleDiv.style.transition = "all 0.3s ease";
  rolesList.appendChild(newRoleDiv);

  // Khởi tạo lại form handlers nếu có nút xóa
  const deleteForm = newRoleDiv.querySelector(".admin-ajax-form");
  if (deleteForm) {
    deleteForm.addEventListener("submit", handleFormSubmit);
  }

  // Animate vào
  setTimeout(() => {
    newRoleDiv.style.opacity = "1";
    newRoleDiv.style.transform = "scale(1)";
  }, 100);
}

// Cập nhật badge role của user một cách động
function updateUserRoleBadge(form, user) {
  const row = form.closest("tr");
  if (!row) return;

  const roleBadge = row.querySelector("span.inline-flex");
  if (!roleBadge) return;

  // Xóa các class cũ
  roleBadge.className = "inline-flex px-3 py-1 rounded-full text-xs font-medium";

  // Thêm class mới dựa trên role
  const roleClass = getRoleClass(user.role_name);
  roleBadge.className += " " + roleClass;
  roleBadge.textContent = user.role_name;

  // Cập nhật giá trị select
  const select = form.querySelector("select");
  if (select) {
    select.value = user.role_id;
  }

  // Hiệu ứng flash
  roleBadge.style.transform = "scale(1.1)";
  setTimeout(() => {
    roleBadge.style.transform = "scale(1)";
  }, 200);
}

// Tạo các options role cho select
function generateRoleOptions(selectedRoleId) {
  if (rolesData.length === 0) {
    // Fallback: lấy từ DOM nếu rolesData chưa được khởi tạo
    extractRolesData();
  }

  let options = "";
  rolesData.forEach((role) => {
    const isSelected = role.id == selectedRoleId ? "selected" : "";
    options += `<option value="${role.id}" ${isSelected} class="bg-slate-800">${role.name}</option>`;
  });

  return options;
}

// Khởi tạo dữ liệu roles khi load trang cho các thao tác động
let rolesData = [];

// Trích xuất dữ liệu roles từ DOM hiện tại
function extractRolesData() {
  const existingSelect = document.querySelector('select[name="role_id"]');
  if (existingSelect) {
    rolesData = Array.from(existingSelect.options).map((option) => ({
      id: option.value,
      name: option.textContent.trim(),
    }));
  }
}

// Cập nhật filter options cho user permission khi thêm user mới
function updateUserPermissionOptions(user) {
  const userPermissionFilter = document.getElementById("userPermissionFilter");
  if (!userPermissionFilter) return;

  const newOption = document.createElement("option");
  newOption.value = user.id;
  newOption.className = "bg-slate-800";
  newOption.textContent = user.username;

  userPermissionFilter.appendChild(newOption);
}

// Thêm user permission form mới
function addUserPermissionForm(user) {
  const userPermissionForms = document.getElementById("userPermissionForms");
  if (!userPermissionForms) return;

  // Lấy template từ form đầu tiên
  const firstForm = userPermissionForms.querySelector(".user-permission-form");
  if (!firstForm) return;

  const newForm = firstForm.cloneNode(true);

  // Cập nhật thông tin user
  newForm.setAttribute("action", `/admin/set_user_pages/${user.id}`);
  newForm.setAttribute("data-user-id", user.id);
  newForm.setAttribute("data-username", user.username.toLowerCase());

  // Cập nhật tên user trong form
  const usernameSpan = newForm.querySelector(".font-semibold.text-green-400");
  if (usernameSpan) {
    usernameSpan.innerHTML = `<i class="fas fa-user mr-2"></i>${user.username} <span class="ml-2 text-xs text-gray-500">(${user.role_name})</span>`;
  }

  // Bỏ check tất cả checkboxes
  const checkboxes = newForm.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });

  // Thêm form mới
  userPermissionForms.appendChild(newForm);

  // Khởi tạo event listeners
  newForm.addEventListener("submit", handleFormSubmit);
  initSelectButtonsForForm(newForm);
}

// Khởi tạo select buttons cho form cụ thể
function initSelectButtonsForForm(form) {
  const selectAllBtn = form.querySelector(".select-all-pages");
  const clearAllBtn = form.querySelector(".clear-all-pages");

  if (selectAllBtn) {
    selectAllBtn.addEventListener("click", function () {
      const checkboxes = form.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach((checkbox) => {
        checkbox.checked = true;
      });
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", function () {
      const checkboxes = form.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
      });
    });
  }
}

// Thêm CSS animation cho loading spinner
const style = document.createElement('style');
style.textContent = `
  .admin-loading-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .card-content {
    transition: all 0.3s ease-in-out;
    overflow: hidden;
  }
  
  .card-content.collapsed {
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    opacity: 0;
  }
  
  .card-content.expanded {
    max-height: 1000px;
    opacity: 1;
  }
`;
document.head.appendChild(style);