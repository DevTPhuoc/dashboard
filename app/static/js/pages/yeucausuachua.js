// static/js/yeucausuachua.js

document.addEventListener("DOMContentLoaded", function () {
  // Khởi tạo các biến toàn cục
  let labs = [];
  let teams = [];
  let devices = [];

  // Load dữ liệu khi trang được tải
  loadLabs();

  // Thiết lập event listeners
  document.getElementById("labSelect").addEventListener("change", function () {
    const labId = this.value;
    if (labId) {
      loadTeams(labId);
      document.getElementById("teamSelect").disabled = false;
      document.getElementById("deviceSelect").disabled = true;
      document.getElementById("deviceSelect").innerHTML =
        '<option value="">-- Chọn Thiết Bị --</option>';
    } else {
      document.getElementById("teamSelect").disabled = true;
      document.getElementById("deviceSelect").disabled = true;
      document.getElementById("teamSelect").innerHTML =
        '<option value="">-- Chọn Team --</option>';
      document.getElementById("deviceSelect").innerHTML =
        '<option value="">-- Chọn Thiết Bị --</option>';
    }
  });

  document.getElementById("teamSelect").addEventListener("change", function () {
    const teamId = this.value;
    const labId = document.getElementById("labSelect").value;
    if (teamId && labId) {
      loadDevices(labId, teamId);
      document.getElementById("deviceSelect").disabled = false;
    } else {
      document.getElementById("deviceSelect").disabled = true;
      document.getElementById("deviceSelect").innerHTML =
        '<option value="">-- Chọn Thiết Bị --</option>';
    }
  });

  // Xử lý submit form
  document
    .getElementById("repairRequestForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      submitRepairRequest();
    });
});

// Hàm load danh sách labs
async function loadLabs() {
  try {
    const labSelect = document.getElementById("labSelect");
    labSelect.innerHTML = '<option value="">-- Đang tải labs... --</option>';

    const response = await fetch("/labs");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const labs = await response.json();

    labSelect.innerHTML = '<option value="">-- Chọn Lab --</option>';

    if (labs.length === 0) {
      labSelect.innerHTML = '<option value="">-- Không có lab nào --</option>';
      return;
    }

    labs.forEach((lab) => {
      const option = document.createElement("option");
      option.value = lab.id;
      option.textContent = lab.name || lab.lab_name || `Lab ${lab.id}`;
      labSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading labs:", error);
    document.getElementById("labSelect").innerHTML =
      '<option value="">-- Lỗi khi tải labs --</option>';
    showAlert("Không thể tải danh sách lab. Vui lòng thử lại sau.", "danger");
  }
}

// Hàm load danh sách teams theo lab
async function loadTeams(labId) {
  try {
    const teamSelect = document.getElementById("teamSelect");
    teamSelect.innerHTML = '<option value="">-- Đang tải teams... --</option>';

    const response = await fetch(`/teams`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const teams = await response.json();

    teamSelect.innerHTML = '<option value="">-- Chọn Team --</option>';

    if (teams.length === 0) {
      teamSelect.innerHTML =
        '<option value="">-- Không có team nào --</option>';
      return;
    }

    teams.forEach((team) => {
      const option = document.createElement("option");
      option.value = team.id;
      option.textContent = team.name || team.team_name || `Team ${team.id}`;
      teamSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading teams:", error);
    document.getElementById("teamSelect").innerHTML =
      '<option value="">-- Lỗi khi tải teams --</option>';
    showAlert("Không thể tải danh sách team. Vui lòng thử lại sau.", "danger");
  }
}

// Hàm load danh sách devices theo lab và team
async function loadDevices(labId, teamId) {
  try {
    const deviceSelect = document.getElementById("deviceSelect");
    deviceSelect.innerHTML =
      '<option value="">-- Đang tải thiết bị... --</option>';

    const response = await fetch(`/api/labs/${labId}/teams/${teamId}/devices`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const devices = await response.json();

    deviceSelect.innerHTML = '<option value="">-- Chọn Thiết Bị --</option>';

    if (devices.length === 0) {
      deviceSelect.innerHTML =
        '<option value="">-- Không có thiết bị nào --</option>';
      return;
    }

    devices.forEach((device) => {
      const option = document.createElement("option");
      option.value = device.id;
      let deviceText =
        device.name || device.device_name || `Thiết bị ${device.id}`;

      // Thêm trạng thái nếu có
      if (device.status) {
        const statusText = getStatusText(device.status);
        deviceText += ` (${statusText})`;
      }

      option.textContent = deviceText;
      option.dataset.status = device.status || "";
      deviceSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading devices:", error);
    document.getElementById("deviceSelect").innerHTML =
      '<option value="">-- Lỗi khi tải thiết bị --</option>';
    showAlert(
      "Không thể tải danh sách thiết bị. Vui lòng thử lại sau.",
      "danger"
    );
  }
}

/// Hàm xử lý submit form yêu cầu sửa chữa
async function submitRepairRequest() {
  try {
    const labId = document.getElementById("labSelect").value;
    const teamId = document.getElementById("teamSelect").value;
    const deviceSelect = document.getElementById("deviceSelect");
    const priority = document.getElementById("prioritySelect").value;
    const description = document.getElementById("issueDescription").value;

    // Lấy tất cả các thiết bị được chọn
    const selectedDevices = Array.from(deviceSelect.selectedOptions)
      .map((option) => option.value)
      .filter((value) => value !== "");

    // Validate form
    if (
      !labId ||
      !teamId ||
      selectedDevices.length === 0 ||
      !priority ||
      !description
    ) {
      showAlert(
        "Vui lòng điền đầy đủ thông tin bắt buộc và chọn ít nhất một thiết bị.",
        "warning"
      );
      return;
    }

    // Hiển thị trạng thái loading
    const submitBtn = document.querySelector(
      '#repairRequestForm button[type="submit"]'
    );
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin me-1"></i> Đang gửi...';
    submitBtn.disabled = true;

    // Tạo các request cho từng thiết bị
    const requests = selectedDevices.map(async (deviceId) => {
      const formData = new FormData();
      formData.append("lab_id", labId);
      formData.append("team_id", teamId);
      formData.append("device_id", deviceId);
      formData.append("priority", priority);
      formData.append("description", description);

      // Thêm files nếu có (mỗi request sẽ có cùng hình ảnh)
      const imageFiles = document.getElementById("issueImages").files;
      for (let i = 0; i < imageFiles.length; i++) {
        if (i < 5) {
          // Giới hạn 5 ảnh
          formData.append("images", imageFiles[i]);
        }
      }

      const response = await fetch("/api/repair-requests", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    });

    // Chờ tất cả request hoàn thành
    const results = await Promise.all(requests);

    // Hiển thị modal thành công với danh sách mã yêu cầu
    if (results.length > 0) {
      const requestIds = results.map((result) => result.request_id).join(", ");
      document.getElementById("successRequestId").textContent = requestIds;
      const successModal = new bootstrap.Modal(
        document.getElementById("successModal")
      );
      successModal.show();

      // Reset form
      document.getElementById("repairRequestForm").reset();
      document.getElementById("teamSelect").disabled = true;
      document.getElementById("deviceSelect").disabled = true;
      document.getElementById("teamSelect").innerHTML =
        '<option value="">-- Chọn Team --</option>';
      document.getElementById("deviceSelect").innerHTML =
        '<option value="">-- Chọn Thiết Bị --</option>';
    }
  } catch (error) {
    console.error("Error submitting repair request:", error);
    showAlert("Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại sau.", "danger");
  } finally {
    // Khôi phục trạng thái nút submit
    const submitBtn = document.querySelector(
      '#repairRequestForm button[type="submit"]'
    );
    submitBtn.innerHTML = '<i class="fas fa-paper-plane me-1"></i> Gửi yêu cầu';
    submitBtn.disabled = false;
  }
}

// Hàm hiển thị thông báo
function showAlert(message, type) {
  const alertContainer = document.createElement("div");
  alertContainer.className = `alert alert-${type} alert-dismissible fade show`;
  alertContainer.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

  // Thêm alert vào đầu form
  const form = document.getElementById("repairRequestForm");
  form.insertBefore(alertContainer, form.firstChild);

  // Tự động xóa alert sau 5 giây
  setTimeout(() => {
    if (alertContainer.parentNode) {
      alertContainer.remove();
    }
  }, 5000);
}

// Hàm chuyển đổi status code thành text
function getStatusText(status) {
  const statusMap = {
    available: "Sẵn sàng",
    in_use: "Đang sử dụng",
    maintenance: "Bảo trì",
    broken: "Hỏng",
  };
  return statusMap[status] || status;
}

// Xử lý sự kiện cho nút "Xem danh sách yêu cầu" trong modal
document.addEventListener("DOMContentLoaded", function () {
  const viewRequestsBtn = document.querySelector("#successModal .btn-primary");
  if (viewRequestsBtn) {
    viewRequestsBtn.addEventListener("click", function () {
      window.location.href = "{{ url_for('dsyeucau') }}";
    });
  }
});
