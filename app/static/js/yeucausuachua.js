// Biến toàn cục
let currentUser = null;
let availableDevices = [];

document.addEventListener("DOMContentLoaded", function () {
  // Khởi tạo ứng dụng
  initializeApp();
});

// Khởi tạo ứng dụng
async function initializeApp() {
  try {
    // Load thông tin user
    await loadCurrentUser();

    // Thiết lập event listeners
    setupEventListeners();

    // Load dữ liệu ban đầu
    await loadInitialData();
  } catch (error) {
    console.error("Error initializing app:", error);
    showAlert("Không thể khởi tạo ứng dụng. Vui lòng tải lại trang.", "error");
  }
}

// Load thông tin user hiện tại
async function loadCurrentUser() {
  try {
    const response = await fetch("/current_user");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    currentUser = await response.json();
    console.log("Current user:", currentUser);
  } catch (error) {
    console.error("Error loading current user:", error);
    // Fallback: sử dụng thông tin user từ template (nếu có)
    currentUser = {
      id: 1,
      username: "Unknown User",
      idlab: null,
      idteam: null,
    };
  }
}
// Load team user cứng cho user không phải admin
async function loadTeamUser() {
  try {
    // FIX: Sử dụng API active để lấy devices của user
    const response = await fetch("/devices/active?Status=available");

    if (!response.ok) {
      throw new Error("Không thể load thông tin user");
    }

    const devices = await response.json();
    console.log("User devices:", devices);

    if (devices.length === 0) {
      showAlert("Không có thiết bị nào khả dụng cho user này", "warning");
      return;
    }

    // Lấy lab và team từ device đầu tiên (vì user chỉ thuộc 1 lab/team)
    const firstDevice = devices[0];
    const labId = firstDevice.LabID;
    const teamId = firstDevice.TeamID;
    const labName = firstDevice.LabName;
    const teamName = firstDevice.TeamName;

    // FIX: Set giá trị cứng cho dropdowns
    const labSelect = document.getElementById("labSelect");
    const teamSelect = document.getElementById("teamSelect");

    // Clear và set lab
    labSelect.innerHTML = "";
    const labOption = document.createElement("option");
    labOption.value = labId;
    labOption.textContent = labName;
    labSelect.appendChild(labOption);
    labSelect.disabled = true;

    // Clear và set team
    teamSelect.innerHTML = "";
    const teamOption = document.createElement("option");
    teamOption.value = teamId;
    teamOption.textContent = teamName;
    teamSelect.appendChild(teamOption);
    teamSelect.disabled = true;

    // Load devices ngay lập tức
    await loadDevices();
  } catch (error) {
    console.error("Error loading team user:", error);
    showAlert("Không thể tải thông tin user", "error");
  }
}

// Thiết lập event listeners
function setupEventListeners() {
  // Lab selection
  document.getElementById("labSelect").addEventListener("change", function () {
    const labId = this.value;
    if (labId) {
      loadTeams(labId);
    } else {
      document.getElementById("teamSelect").disabled = true;
      document.getElementById("teamSelect").innerHTML =
        '<option value="">-- Choose Team --</option>';
      resetDeviceSelection();
    }
  });

  // Team selection
  document.getElementById("teamSelect").addEventListener("change", function () {
    const teamId = this.value;
    const labId = document.getElementById("labSelect").value;
    if (teamId && labId) {
      loadDevices();
    } else {
      resetDeviceSelection();
    }
  });

  // Device search
  document
    .getElementById("deviceSearch")
    .addEventListener("input", function () {
      filterDevices(this.value);
    });

  // Add selected devices
  document
    .getElementById("addSelectedDevicesBtn")
    .addEventListener("click", function () {
      addSelectedDevices();
    });

  // Form submission
  document
    .getElementById("repairRequestForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      submitRepairRequest();
    });

  // Form reset
  document
    .getElementById("repairRequestForm")
    .addEventListener("reset", function () {
      setTimeout(() => {
        resetDeviceSelection();
        document.getElementById("teamSelect").disabled = true;
        document.getElementById("teamSelect").innerHTML =
          '<option value="">-- Choose Team --</option>';
      }, 0);
    });

  // Modal close
  document
    .getElementById("closeSuccessModalBtn")
    .addEventListener("click", function () {
      hideModal("successModal");
    });

  document
    .getElementById("successModalOverlay")
    .addEventListener("click", function () {
      hideModal("successModal");
    });
}

// Load dữ liệu ban đầu
async function loadInitialData() {
  try {
    //Nếu là admin thì load labs, nếu không thì load team user
    if (userRoleId === "1") {
      // Admin: load labs để chọn
      await loadLabs();
    } else {
      // User thường: load team user cứng
      await loadTeamUser();
    }
  } catch (error) {
    console.error("Error loading initial data:", error);
    showAlert("Không thể tải dữ liệu ban đầu. Vui lòng thử lại sau.", "error");
  }
}

// Load danh sách labs
async function loadLabs() {
  //Nếu user không phải admin, không cần load labs
  if (userRoleId !== "1") {
    return;
  }

  try {
    const url = `/labs`;
    const response = await fetch(url);

    if (!response.ok) {
      showAlert("Không thể tải danh sách lab", "error");
      return;
    }

    const labs = await response.json();

    // Clear dropdown trước khi thêm mới
    const labSelect = document.getElementById("labSelect");
    labSelect.innerHTML = '<option value="">-- Choose Department --</option>';

    // Thêm options mới
    if (Array.isArray(labs)) {
      labs.forEach((lab) => {
        const option = document.createElement("option");
        option.value = lab.id;
        option.textContent = lab.LabName;
        labSelect.appendChild(option);
      });
    } else {
      // Nếu labs là object đơn lẻ
      const option = document.createElement("option");
      option.value = labs.id;
      option.textContent = labs.LabName;
      labSelect.appendChild(option);
    }

    labSelect.disabled = false;
  } catch (error) {
    console.error("Error loading labs:", error);
    document.getElementById("labSelect").innerHTML =
      '<option value="">-- Error loading labs --</option>';
    showAlert("Cannot load lab list. Please try again later.", "error");
  }
}

// Load danh sách teams theo lab
async function loadTeams(labId) {
  // FIX: Nếu user không phải admin, không cần load teams
  if (userRoleId !== "1") {
    return;
  }

  try {
    const url = `/teams/by_LabID?LabID=${labId}`;
    const response = await fetch(url);

    if (!response.ok) {
      showAlert("Cannot load team list!!", "error");
      return;
    }

    const teams = await response.json();

    // FIX: Đảm bảo teams luôn là mảng ép kiểu về mảng nếu API trả về object đơn lẻ
    if (!Array.isArray(teams)) {
      teams = [teams];
    }

    // FIX: Clear dropdown trước khi thêm mới
    const teamSelect = document.getElementById("teamSelect");
    teamSelect.innerHTML = '<option value="">-- Choose Team --</option>';

    // Thêm options mới
    teams.forEach((team) => {
      const option = document.createElement("option");
      option.value = team.id;
      option.textContent = team.TeamName;
      teamSelect.appendChild(option);
    });

    teamSelect.disabled = false;
    resetDeviceSelection();
  } catch (error) {
    console.error("Error loading teams:", error);
    document.getElementById("teamSelect").innerHTML =
      '<option value="">-- Error loading teams --</option>';
    showAlert("Cannot load team list. Please try again later.", "error");
  }
}
async function loadDevices() {
  try {
    const labId = document.getElementById("labSelect").value;
    const teamId = document.getElementById("teamSelect").value;

    if (!labId || !teamId) {
      document.getElementById("deviceList").innerHTML =
        '<div class="text-center text-sm py-4 text-white">-- Please select Lab and Team --</div>';
      return;
    }

    const deviceList = document.getElementById("deviceList");
    deviceList.innerHTML =
      '<div class="text-center text-sm py-4 text-white">-- Loading devices... --</div>';

    // FIX: Sử dụng API filter với lab_id và team_id
    const response = await fetch(
      `/devices/filter?lab_id=${labId}&team_id=${teamId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const devicesData = await response.json();
    console.log("API Response:", devicesData);

    availableDevices = devicesData || [];

    // SỬA: Lọc theo LabID và TeamID và chỉ lấy thiết bị có trạng thái 'available'
    const filteredDevices =
      devicesData.filter((device) => device.Status === "available") || [];

    console.log("Filtered devices:", filteredDevices);

    if (filteredDevices.length === 0) {
      deviceList.innerHTML =
        '<div class="text-center text-sm py-4 text-gray-500">-- No devices found --</div>';
      return;
    }

    renderDeviceList(filteredDevices);
  } catch (error) {
    console.error("Error loading devices:", error);
    document.getElementById("deviceList").innerHTML =
      '<div class="text-center text-sm py-4 text-gray-500">-- Error loading devices --</div>';
    showAlert("Cannot load device list. Please try again later.", "error");
  }
}

// Hiển thị danh sách thiết bị - ĐÃ SỬA THEO CẤU TRÚC DỮ LIỆU THỰC TẾ
function renderDeviceList(devices) {
  const deviceList = document.getElementById("deviceList");
  deviceList.innerHTML = "";

  if (devices.length === 0) {
    deviceList.innerHTML =
      '<div class="text-center text-sm py-4 text-gray-500  ">-- No devices found --</div>';
    return;
  }

  devices.forEach((device) => {
    const deviceItem = document.createElement("div");
    deviceItem.className =
      "flex items-center p-2 hover:bg-gray-700  cursor-pointer border-b border-gray-500";
    deviceItem.dataset.deviceId = device.id;

    // SỬA: Sử dụng đúng tên property từ dữ liệu thực tế
    const statusColor = getStatusColor(device.Status);
    const statusText = getStatusText(device.Status);

    // SỬA: Sử dụng đúng tên property từ dữ liệu thực tế
    const deviceCode = device.DeviceCode;
    const deviceName = device.DeviceName;

    deviceItem.innerHTML = `
  
                <input type="checkbox" class="device-checkbox mr-3 w-5 h-5" value="${device.id}">
                <div class="flex-grow relative">
                    <div class="font-mono text-sm">🏷️DeviceCode: ${deviceCode} - ⚡DeviceName: ${deviceName}</div>
                    
                    <div class="text-sm text-gray-400 flex items-center gap-2">
                        <span class="inline-flex items-center gap-1">
                            <i class="fas fa-circle ${statusColor} text-[0.7rem]"></i>
                            ${statusText}
                        </span>
                        <span class="text-gray-500 text-sm">• Lab: ${device.LabName} • Team: ${device.TeamName}</span>
                    </div>
                    <div class="absolute right-4 bottom-4">
                        <label class="flex items-center gap-2 font-medium whitespace-nowrap text-green-600">
                          Priority
                      <input type="checkbox" name="priority" class="w-5 h-5 accent-yellow-400" />
                    </label>
                    </div>
                    

                </div>
               
            `;

    deviceList.appendChild(deviceItem);
  });
}

// Lọc thiết bị theo từ khóa tìm kiếm
function filterDevices(searchTerm) {
  const deviceItems = document.querySelectorAll("#deviceList > div");
  const searchLower = searchTerm.toLowerCase();

  deviceItems.forEach((item) => {
    if (item.classList.contains("text-center")) return;

    const deviceText = item.textContent.toLowerCase();
    if (deviceText.includes(searchLower)) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });
}

// Thêm các thiết bị đã chọn vào danh sách
function addSelectedDevices() {
  const checkboxes = document.querySelectorAll(".device-checkbox:checked");

  if (checkboxes.length === 0) {
    showAlert("Please select at least one device", "warning");
    return;
  }

  checkboxes.forEach((checkbox) => {
    const deviceId = checkbox.value;
    const deviceItem = checkbox.closest("div[data-device-id]");
    const deviceText = deviceItem.querySelector(".font-mono").textContent;

    addDeviceToSelection(deviceId, deviceText);

    // Bỏ chọn sau khi thêm
    checkbox.checked = false;
  });

  showAlert(`Chose ${checkboxes.length} devices to the list`, "success");
}

// Thêm thiết bị vào danh sách đã chọn
function addDeviceToSelection(deviceId, deviceText) {
  // Kiểm tra xem thiết bị đã được thêm chưa
  if (document.querySelector(`.selected-device[data-id="${deviceId}"]`)) {
    showAlert(
      `Equipment "${deviceText}" has already been added to the list`,
      "warning"
    );
    return;
  }

  const container = document.getElementById("selectedDevicesContainer");

  // Xóa thông báo "chưa có thiết bị" nếu có
  if (container.querySelector(".text-center")) {
    container.innerHTML = "";
  }

  // Tạo phần tử thiết bị
  const deviceElement = document.createElement("div");
  deviceElement.className =
    "selected-device bg-gray-800 rounded p-4 border border-gray-700";
  deviceElement.dataset.id = deviceId;

  deviceElement.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h4 class=" text-white text-sm">${deviceText}</h4>
                    <p class="text-sm text-gray-400">Equipments needs repair</p>
                </div>
                <button type="button" class="remove-device text-red-400 hover:text-red-300">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div>
                <label class="block text-sm mb-1">Describle the issue <span class="text-red-500">*</span></label>
                <textarea class="problem-description w-full p-2 rounded bg-gray-700 border border-gray-600 text-white" 
                          rows="3" placeholder="Describe the issue..." required></textarea>
                <p class="text-red-400 text-sm mt-1 hidden description-error">Please enter a problem description</p>
            </div>
        `;

  container.appendChild(deviceElement);

  // Xử lý xóa thiết bị
  deviceElement
    .querySelector(".remove-device")
    .addEventListener("click", function () {
      deviceElement.remove();
      checkEmptySelectedDevices();
    });

  // Xử lý validate real-time
  deviceElement
    .querySelector(".problem-description")
    .addEventListener("input", function () {
      if (this.value.trim()) {
        this.classList.remove("border-red-500");
        this.nextElementSibling.classList.add("hidden");
      }
    });
}

// Kiểm tra và hiển thị thông báo nếu không có thiết bị nào
function checkEmptySelectedDevices() {
  const container = document.getElementById("selectedDevicesContainer");
  if (container.querySelectorAll(".selected-device").length === 0) {
    container.innerHTML =
      '<div class="text-center py-4 text-gray-500 border border-dashed border-gray-700 rounded">' +
      '<i class="fas fa-desktop text-2xl mb-2"></i>' +
      "<p>No devices selected</p>" +
      "</div>";
  }
}

// Reset selection thiết bị
function resetDeviceSelection() {
  const container = document.getElementById("selectedDevicesContainer");
  container.innerHTML =
    '<div class="text-center py-4 text-gray-500 border border-dashed border-gray-700 rounded">' +
    '<i class="fas fa-desktop text-2xl mb-2"></i>' +
    "<p>No devices selected</p>" +
    "</div>";

  // Clear device list
  document.getElementById("deviceList").innerHTML =
    '<div class="text-center py-4 text-gray-500">-- Please select Lab and Team to display devices --</div>';
  document.getElementById("deviceSearch").value = "";
}

// Xử lý submit form yêu cầu sửa chữa
async function submitRepairRequest() {
  try {
    const selectedDevices = document.querySelectorAll(".selected-device");

    // Validate form
    if (selectedDevices.length === 0) {
      showAlert("Vui lòng chọn ít nhất một thiết bị", "error");
      return;
    }

    // Lấy thông tin lab và team
    const labId = document.getElementById("labSelect").value;
    const teamId = document.getElementById("teamSelect").value;

    if (!labId || !teamId) {
      showAlert("Please select Lab and Team", "error");
      return;
    }

    // Chuẩn bị dữ liệu gửi đi
    const formData = new FormData();
    formData.append("lab_id", labId);
    formData.append("team_id", teamId);

    // Thêm device_ids và descriptions
    let hasError = false;

    selectedDevices.forEach((device) => {
      const deviceId = device.dataset.id;
      const description = device
        .querySelector(".problem-description")
        .value.trim();
      const errorElement = device.querySelector(".description-error");

      if (!description) {
        hasError = true;
        device
          .querySelector(".problem-description")
          .classList.add("border-red-500");
        errorElement.classList.remove("hidden");
      } else {
        device
          .querySelector(".problem-description")
          .classList.remove("border-red-500");
        errorElement.classList.add("hidden");
        formData.append("device_ids[]", deviceId);
        formData.append(`description_${deviceId}`, description);
      }
    });

    if (hasError) {
      showAlert("Please enter a problem description for all devices", "error");
      return;
    }

    // Hiển thị trạng thái loading
    const submitBtn = document.querySelector(
      '#repairRequestForm button[type="submit"]'
    );
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin mr-2"></i> Sending...';
    submitBtn.disabled = true;

    // Gửi request đến API
    const response = await fetch("/repair_requests/create", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    // Hiển thị modal thành công
    document.getElementById("successRequestId").textContent =
      result.request_id || result.request_ids.join(", ");
    showModal("successModal");

    // Reset form sau 2 giây
    setTimeout(() => {
      document.getElementById("repairRequestForm").reset();
      resetDeviceSelection();
    }, 2000);
  } catch (error) {
    console.error("Error submitting repair request:", error);
    showAlert("Có lỗi xảy ra khi gửi yêu cầu: " + error.message, "error");
  } finally {
    // Khôi phục trạng thái nút submit
    const submitBtn = document.querySelector(
      '#repairRequestForm button[type="submit"]'
    );
    submitBtn.innerHTML =
      '<i class="fas fa-paper-plane mr-2"></i> Send Request';
    submitBtn.disabled = false;
  }
}

// Hiển thị thông báo
function showAlert(message, type) {
  const alertContainer = document.getElementById("alertContainer");
  const alertId = "alert-" + Date.now();

  let bgColor, icon;
  switch (type) {
    case "success":
      bgColor = "bg-green-900 border-green-700";
      icon = "fa-check-circle";
      break;
    case "error":
      bgColor = "bg-red-900 border-red-700";
      icon = "fa-exclamation-circle";
      break;
    case "warning":
      bgColor = "bg-yellow-900 border-yellow-700";
      icon = "fa-exclamation-triangle";
      break;
    default:
      bgColor = "bg-blue-900 border-blue-700";
      icon = "fa-info-circle";
  }

  const alertElement = document.createElement("div");
  alertElement.id = alertId;
  alertElement.className = `${bgColor} border-l-4 p-4 mb-4 rounded-md flex items-center justify-between`;

  alertElement.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${icon} mr-3"></i>
                <span>${message}</span>
            </div>
            <button type="button" class="text-gray-300 hover:text-white" onclick="document.getElementById('${alertId}').remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

  alertContainer.appendChild(alertElement);

  // Tự động xóa thông báo sau 5 giây
  setTimeout(() => {
    if (document.getElementById(alertId)) {
      document.getElementById(alertId).remove();
    }
  }, 5000);
}

// Chuyển đổi status code thành text
function getStatusText(status) {
  const statusMap = {
    available: "Active",
    broken: "Broken",
  };
  return statusMap[status] || status;
}

// Lấy màu cho trạng thái
function getStatusColor(status) {
  const colorMap = {
    available: "text-green-400",
    in_use: "text-blue-400",
    maintenance: "text-yellow-400",
    broken: "text-red-400",
    ready: "text-green-400",
    using: "text-blue-400",
  };
  return colorMap[status] || "text-gray-400";
}

// Hiển thị modal
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  const modalContent = document.getElementById(modalId + "Content");

  modal.classList.remove("hidden");
  setTimeout(() => {
    modalContent.classList.remove("scale-95", "opacity-0");
    modalContent.classList.add("scale-100", "opacity-100");
  }, 10);
}

// Ẩn modal
function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  const modalContent = document.getElementById(modalId + "Content");

  modalContent.classList.remove("scale-100", "opacity-100");
  modalContent.classList.add("scale-95", "opacity-0");

  setTimeout(() => {
    modal.classList.add("hidden");
  }, 200);
}

function loadSelect(idFilter, ls, isDisabled, name) {
  const idE = document.getElementById(idFilter);
  if (!idE) return;
  newLs = ls.map((l) => `<option value="${l.id}">${l[name]}</option>`);
  str = newLs.join("");
  idE.innerHTML = `<option value="all">All</option>` + str;
  idE.disabled = isDisabled;
}
