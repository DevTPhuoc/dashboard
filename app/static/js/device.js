class DeviceManager {
  constructor() {
    this.currentDevices = [];
    this.labs = [];
    this.teams = [];
    this.currentFilter = "all";
    this.deviceToDelete = null;
    this.pagination = null;
    this.currentSortField = "id";
    this.currentSortOrder = "desc";
    this.init();
  }

  // Khởi tạo trang
  init() {
    this.loadTeams("all");
    this.loadLabs();

    this.initPagination();
    this.setupEventListeners();
    this.setupModalEvents();
    this.loadDevices();
  }

  initPagination() {
    this.pagination = new Pagination({
      container: "#devicesPagination",
      perPage: 10,
      visiblePages: 5,
      sortField: this.currentSortField,
      sortOrder: this.currentSortOrder,
      onPageChange: (data, currentPage, totalPages) => {
        console.log(`Đang xem trang ${currentPage} của ${totalPages}`);
      },
      renderFunction: (data, paginationInfo) =>
        this.renderDevicesTable(data, paginationInfo),
    });
  }

  // Thiết lập event listeners cho các nút và filter
  setupEventListeners() {
    // Lọc theo trạng thái
    document.querySelectorAll(".filter-status").forEach((item) => {
      item.addEventListener("click", () => {
        this.currentFilter = item.getAttribute("data-status");
        this.filterDevices(this.currentFilter);

        // Cập nhật UI
        document.querySelectorAll(".filter-status").forEach((i) => {
          i.classList.remove("active", "bg-blue-600");
          i.classList.add("bg-gray-700", "hover:bg-gray-600");
        });
        item.classList.add("active", "bg-blue-600");
        item.classList.remove("bg-gray-700", "hover:bg-gray-600");
      });
    });

    // Tìm kiếm thiết bị
    const searchInput = document.getElementById("searchDevice");
    if (searchInput) {
      searchInput.addEventListener("input", () => this.searchDevices());
    }

    const clearSearchBtn = document.getElementById("clearSearchBtn");
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener("click", () => this.clearSearch());
    }

    // Lọc theo phòng lab
    // Trong setupEventListeners, sửa phần lab change events:
    const labFilter = document.getElementById("labFilter");
    if (labFilter) {
      labFilter.addEventListener("change", () => {
        this.filterByLab();
        this.loadTeams("labFilter"); // Chỉ cần truyền id lab
      });
    }
    const teamFilter = document.getElementById("teamFilter");
    if (teamFilter) {
      teamFilter.addEventListener("change", () => {
        this.filterByTeam();
       
      });
    }

    const editDeviceLab = document.getElementById("editDeviceLab");
    if (editDeviceLab) {
      editDeviceLab.addEventListener("change", () => {
        this.loadTeams("editDeviceLab"); // Chỉ cần truyền id lab
      });
    }

    const deviceLab = document.getElementById("deviceLab");
    if (deviceLab) {
      deviceLab.addEventListener("change", () => {
        this.loadTeams("deviceLab", "deviceTeam"); // Chỉ cần truyền id lab
      });
    }

    // Sắp xếp
    document.querySelectorAll(".sortable").forEach((th) => {
      th.addEventListener("click", () => {
        const field = th.getAttribute("data-sort");
        this.toggleSort(field);
      });
    });
  }

  // Thiết lập events cho modal
  setupModalEvents() {
    // Modal thêm thiết bị
    const addModal = document.getElementById("addDeviceModal");
    if (addModal) {
      const addModalContent = document.getElementById("modalContent");
      const openBtn = document.getElementById("openModalBtn");
      const closeBtn = document.getElementById("closeModalBtn");
      const cancelBtn = document.getElementById("cancelModalBtn");
      const overlay = document.getElementById("modalOverlay");
      const form = document.getElementById("addDeviceForm");

      if (openBtn)
        openBtn.addEventListener(
          "click",
          () => (
            (document.getElementById("deviceEqid").value = ""),
            (document.getElementById("deviceName").value = ""),
            this.openModal(addModal, addModalContent)
          )
        );
      if (closeBtn)
        closeBtn.addEventListener("click", () =>
          this.closeModal(addModal, addModalContent)
        );
      if (cancelBtn)
        cancelBtn.addEventListener("click", () =>
          this.closeModal(addModal, addModalContent)
        );
      if (overlay)
        overlay.addEventListener("click", () =>
          this.closeModal(addModal, addModalContent)
        );
      if (form)
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          this.addDevice();
        });
    }

    // Modal chỉnh sửa
    const editModal = document.getElementById("editDeviceModal");
    if (editModal) {
      const editModalContent = document.getElementById("editModalContent");
      const closeBtn = document.getElementById("closeEditModalBtn");
      const cancelBtn = document.getElementById("cancelEditModalBtn");
      const overlay = document.getElementById("editModalOverlay");
      const updateBtn = document.getElementById("updateDeviceBtn");

      if (closeBtn)
        closeBtn.addEventListener("click", () =>
          this.closeModal(editModal, editModalContent)
        );
      if (cancelBtn)
        cancelBtn.addEventListener("click", () =>
          this.closeModal(editModal, editModalContent)
        );
      if (overlay)
        overlay.addEventListener("click", () =>
          this.closeModal(editModal, editModalContent)
        );
      if (updateBtn)
        updateBtn.addEventListener("click", () => this.updateDevice());
    }

    // Modal xóa
    const deleteModal = document.getElementById("deleteDeviceModal");
    if (deleteModal) {
      const deleteModalContent = document.getElementById("deleteModalContent");
      const closeBtn = document.getElementById("closeDeleteModalBtn");
      const cancelBtn = document.getElementById("cancelDeleteModalBtn");
      const overlay = document.getElementById("deleteModalOverlay");
      const confirmBtn = document.getElementById("confirmDeleteBtn");

      if (closeBtn)
        closeBtn.addEventListener("click", () =>
          this.closeModal(deleteModal, deleteModalContent)
        );
      if (cancelBtn)
        cancelBtn.addEventListener("click", () =>
          this.closeModal(deleteModal, deleteModalContent)
        );
      if (overlay)
        overlay.addEventListener("click", () =>
          this.closeModal(deleteModal, deleteModalContent)
        );
      if (confirmBtn)
        confirmBtn.addEventListener("click", () => this.deleteDevice());
    }

    // Modal báo cáo hư hỏng
    const repairModal = document.getElementById("repairRequestModal");
    if (repairModal) {
      const repairModalContent = document.getElementById("repairModalContent");
      const closeBtn = document.getElementById("closeRepairModalBtn");
      const cancelBtn = document.getElementById("cancelRepairModalBtn");
      const overlay = document.getElementById("repairModalOverlay");
      const submitBtn = document.getElementById("submitRepairRequestBtn");

      if (closeBtn)
        closeBtn.addEventListener("click", () =>
          this.closeModal(repairModal, repairModalContent)
        );
      if (cancelBtn)
        cancelBtn.addEventListener("click", () =>
          this.closeModal(repairModal, repairModalContent)
        );
      if (overlay)
        overlay.addEventListener("click", () =>
          this.closeModal(repairModal, repairModalContent)
        );
      if (submitBtn)
        submitBtn.addEventListener("click", () => this.submitRepairRequest());
    }

    // Modal chi tiết
    const detailModal = document.getElementById("deviceDetailModal");
    if (detailModal) {
      const detailModalContent = document.getElementById("detailModalContent");
      const closeBtn = document.getElementById("closeDetailModalBtn");
      const closeBtn2 = document.getElementById("closeDetailModalBtn2");
      const overlay = document.getElementById("detailModalOverlay");

      if (closeBtn)
        closeBtn.addEventListener("click", () =>
          this.closeModal(detailModal, detailModalContent)
        );
      if (closeBtn2)
        closeBtn2.addEventListener("click", () =>
          this.closeModal(detailModal, detailModalContent)
        );
      if (overlay)
        overlay.addEventListener("click", () =>
          this.closeModal(detailModal, detailModalContent)
        );
    }
  }

  // Mở modal
  openModal(modal, modalContent) {
    if (!modal || !modalContent) return;
    modal.classList.remove("hidden");
    setTimeout(() => {
      modalContent.classList.remove("opacity-0", "scale-95");
      modalContent.classList.add("opacity-100", "scale-100");
    }, 10);
  }

  // Đóng modal
  closeModal(modal, modalContent) {
    if (!modal || !modalContent) return;
    modalContent.classList.remove("opacity-100", "scale-100");
    modalContent.classList.add("opacity-0", "scale-95");
    setTimeout(() => modal.classList.add("hidden"), 200);
  }

  // Tải danh sách phòng lab
async loadLabs() {
  try {
    // Role khác 2 và 4: load toàn bộ labs, dropdown lab enable
    if (userRoleID !== "2" && userRoleID !== "4") {
      const response = await fetch("/labs");
      const labs = await response.json();
      const isLabDisabled = false;

      // Cập nhật dropdown labs
      loadSelect(
        "labFilter",
        "editDeviceLab",
        "deviceLab",
        labs,
        isLabDisabled,
        "LabName"
      );
      return;
    }

    // Role = 2: cố định lab + team (giữ nguyên hành vi cũ)
    if (userRoleID === "2") {
      const labResponse = await fetch(`/labs/${userLabId}`);
      const lab = await labResponse.json();

      const teamResponse = await fetch(`/teams/${userTeamId}`);
      const team = await teamResponse.json();

      // Gán cố định lab & team
      loadTeamUser(
        "labFilter",
        lab.id,
        lab.LabName,
        "teamFilter",
        team.id,
        team.TeamName
      );
      loadTeamUser(
        "editDeviceLab",
        lab.id,
        lab.LabName,
        "editDeviceTeam",
        team.id,
        team.TeamName
      );
      loadTeamUser(
        "deviceLab",
        lab.id,
        lab.LabName,
        "deviceTeam",
        team.id,
        team.TeamName
      );
      return;
    }

    // Role = 4: gắn cứng LabName, disable lab; team vẫn chọn bình thường
    if (userRoleID === "4") {
      const lab = await (await fetch(`/labs/${userLabId}`)).json();
      const teams = await (await fetch(`/teams/by_LabID?LabID=${userLabId}`)).json();
      ["labFilter", "editDeviceLab", "deviceLab"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.innerHTML = ""; 
          const opt = document.createElement("option");
          opt.value = lab.id;
          opt.textContent = lab.LabName; 
          opt.selected = true;
          el.appendChild(opt);
          el.disabled = true; 
        }
      });

      // Team: load danh sách theo lab, enable chọn
      loadSelect(
        "teamFilter",
        "editDeviceTeam",
        "deviceTeam",
        teams,
        false,      // team enable
        "TeamName"
      );
      return;
    }

  } catch (error) {
    console.error("Error loading labs:", error);
    this.showAlert("Không thể tải danh sách phòng lab", "danger");
  }
}

  // Tải danh sách nhóm
  async loadTeams(id = "all", idTeam = "") {
    try {
      if (id === "all") return;
      const labId = document.getElementById(id).value;
      if (labId === "all") {
        resetTeamSelect(idTeam);
        return;
      }

      let teams;
      let isTeamDisabled = false;


      if (userRoleID !== "2" && userRoleID !== "4") {
      const response = await fetch(`/teams/by_LabID?LabID=${labId}`);
      teams = await response.json();
    } else if (userRoleID === "2") {
      // role 2: disable cả lab và team
      const response = await fetch(`/teams/${userTeamId}`);
      teams = await response.json();
      isTeamDisabled = true;
    } else if (userRoleID === "4") {
      // role 4: chỉ disable lab, team vẫn enable
      const response = await fetch(`/teams/by_LabID?LabID=${userLabId}`);
      teams = await response.json();
      isTeamDisabled = false;
    }

      // Đảm bảo teams luôn là mảng
      if (!Array.isArray(teams)) {
        teams = [teams];
      }

      // FIX ĐƠN GIẢN: Chỉ update dropdown được chỉ định
      const targetId =
        id === "labFilter"
          ? "teamFilter"
          : id === "editDeviceLab"
          ? "editDeviceTeam"
          : id === "deviceLab"
          ? "deviceTeam"
          : idTeam;

      this.updateSingleDropdown(targetId, teams, isTeamDisabled, "TeamName");
    } catch (error) {
      console.error("Error loading teams:", error);
      this.showAlert("Không thể tải danh sách nhóm", "danger");
    }
  }
  // Cập nhật một dropdown duy nhất
  updateSingleDropdown(dropdownId, data, isDisabled, nameField) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    // Lưu giá trị hiện tại
    const currentValue = dropdown.value;

    // Clear và thêm options mới
    dropdown.innerHTML = '<option value="all">Tất cả</option>';

    if (Array.isArray(data)) {
      data.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item[nameField];
        dropdown.appendChild(option);
      });
    }

    // Khôi phục giá trị nếu vẫn tồn tại trong options mới
    if (
      currentValue &&
      dropdown.querySelector(`option[value="${currentValue}"]`)
    ) {
      dropdown.value = currentValue;
    }

    dropdown.disabled = isDisabled;
  }
  // Tải danh sách thiết bị
  async loadDevices() {
    try {
      this.setLoadingState(true);

      const response = await fetch("/devices/my_devices");
      let devices = await response.json();

      // Lấy user từ localStorage
      const user = JSON.parse(localStorage.getItem("user"));

      if (user) {
        if (user.idteam) {
          devices = devices.filter((d) => d.team === user.idteam);
        } else if (user.idlab) {
          devices = devices.filter((d) => d.lab === user.idlab);
        }
      }

      this.currentDevices = devices;

      // Cập nhật dữ liệu cho phân trang
      if (this.pagination) {
        this.pagination.update(this.currentDevices, true);
      } else {
        this.renderDevicesTable(this.currentDevices);
      }
    } catch (error) {
      console.error("Error loading devices:", error);
      this.showAlert("Không thể tải danh sách thiết bị", "danger");
    } finally {
      this.setLoadingState(false);
    }
  }

  // Thiết lập trạng thái loading
  setLoadingState(isLoading) {
    const loadingState = document.getElementById("loadingState");
    const emptyState = document.getElementById("emptyState");
    const tableBody = document.getElementById("devicesTableBody");

    if (isLoading) {
      if (loadingState) loadingState.classList.remove("hidden");
      if (emptyState) emptyState.classList.add("hidden");
      if (tableBody) tableBody.classList.add("hidden");
    } else {
      if (loadingState) loadingState.classList.add("hidden");
      if (tableBody) tableBody.classList.remove("hidden");
    }
  }

  // Lọc thiết bị theo trạng thái
  filterDevices(status) {
    if (!this.pagination) return;

    if (status === "all") {
      this.pagination.filterData(() => true);
    } else {
      this.pagination.filterData((device) => device.Status === status);
    }
  }

  // Tìm kiếm thiết bị
  searchDevices() {
    if (!this.pagination) return;

    const searchTerm = document
      .getElementById("searchDevice")
      .value.toLowerCase();
    this.pagination.searchData(searchTerm, ["DeviceCode", "DeviceName"]);
  }

  // Xóa tìm kiếm
  clearSearch() {
    if (!this.pagination) return;

    document.getElementById("searchDevice").value = "";
    this.pagination.filterData(() => true);
  }

  // Lọc theo phòng lab
  filterByLab() {
    if (!this.pagination) return;

    const labId = document.getElementById("labFilter").value;

    if (!labId || labId === "all") {
      this.pagination.filterData(() => true);
    } else {
      this.pagination.filterData((device) => device.LabID == labId);
    }
  }

  // Lọc theo nhóm
  filterByTeam() {
    if (!this.pagination) return;

    const teamId = document.getElementById("teamFilter").value;

    if (!teamId || teamId === "all") {
      this.pagination.filterData(() => true);
    } else {
      this.pagination.filterData((device) => device.TeamID == teamId);
    }
  }

  // Sắp xếp dữ liệu
  toggleSort(field) {
    if (!this.pagination) return;

    // Xác định thứ tự sắp xếp mới
    if (this.currentSortField === field) {
      this.currentSortOrder = this.currentSortOrder === "asc" ? "desc" : "asc";
    } else {
      this.currentSortField = field;
      this.currentSortOrder = "asc";
    }

    // Cập nhật UI
    this.updateSortUI();

    // Áp dụng sắp xếp
    this.pagination.sortData(field, this.currentSortOrder);
  }

  // Cập nhật UI sắp xếp
  updateSortUI() {
    // Xóa tất cả các lớp active
    document.querySelectorAll(".sortable").forEach((th) => {
      th.classList.remove("active");
      const icon = th.querySelector("i");
      if (icon) {
        icon.className = "fas fa-sort text-xs opacity-50";
      }
    });

    // Thêm lớp active cho cột đang sắp xếp
    const activeTh = document.querySelector(
      `.sortable[data-sort="${this.currentSortField}"]`
    );
    if (activeTh) {
      activeTh.classList.add("active");
      const icon = activeTh.querySelector("i");
      if (icon) {
        icon.className =
          this.currentSortOrder === "asc"
            ? "fas fa-sort-up text-xs"
            : "fas fa-sort-down text-xs";
      }
    }
  }

  // Hiển thị danh sách thiết bị trong bảng
  renderDevicesTable(devices, paginationInfo) {
    const tbody = document.getElementById("devicesTableBody");
    const emptyState = document.getElementById("emptyState");

    if (!tbody || !emptyState) return;

    tbody.innerHTML = "";

    if (!devices || devices.length === 0) {
      tbody.classList.add("hidden");
      emptyState.classList.remove("hidden");
      return;
    }

    tbody.classList.remove("hidden");
    emptyState.classList.add("hidden");

    devices.forEach((device) => {
      const row = this.createDeviceRow(device);
      tbody.appendChild(row);
    });

    // Thêm event listeners cho các nút
    this.addTableEventListeners();
  }

  // Tạo row cho thiết bị
  createDeviceRow(device) {
    const row = document.createElement("tr");
    row.className = "table-row-hover animate-fade-in";

    let statusBadge = "";
    switch (device.Status) {
      case "available":
        statusBadge =
          '<span class="px-3 py-1 rounded block w-full text-xs bg-green-600 font-medium">Active</span>';
        break;
      case "broken":
        statusBadge =
          '<span class="px-3 py-1 rounded block w-full text-xs bg-red-600 font-medium">Broken</span>';
        break;
      default:
        statusBadge = `<span class="px-3 py-1 rounded block w-full text-xs bg-gray-600 font-medium">${
          device.Status || "Unknown"
        }</span>`;
    }

    row.innerHTML = `
            <td class=" text-center text-sm px-4 py-1 border border-gray-700">${
              device.id
            }</td>
            <td class=" text-center text-sm px-4 py-1 border border-gray-700">${
              device.DeviceCode
            }</td>
            <td class=" text-center text-sm px-4 py-1 border border-gray-700 ">${
              device.DeviceName
            }</td>
            <td class=" text-center text-sm px-4 py-1 border border-gray-700">${
              device.LabName
            }</td>
            <td class=" text-center text-sm px-4 py-1 border border-gray-700">${
              device.TeamName
            }</td>
            <td class=" text-center text-sm px-4 py-1 border border-gray-700 ">${
              device.Model
            }</td>
            <td class=" text-center text-sm px-4 py-1 border border-gray-700 ">${
              device.Branch
            }</td>
            <td class=" text-center text-sm px-4 py-1 border border-gray-700 ">${
              device.ImportDate
            }</td>
            <td class=" text-center text-sm px-4 py-1 border border-gray-700">${statusBadge}</td>
            <td class=" text-center text-sm px-4 py-1 border border-gray-700 flex  justify-start">
                <div class="flex gap-1">
                    <button class="view-device p-1 rounded bg-blue-600 hover:bg-blue-500 transition transform hover:scale-105" 
                            data-id="${device.id}" title="Xem chi tiết">
                        <i class="fas fa-eye text-white text-sm"></i>
                    </button>
                    <button class="edit-device p-1 rounded bg-yellow-600 hover:bg-yellow-500 transition transform hover:scale-105" 
                            data-id="${device.id}" title="Chỉnh sửa">
                        <i class="fas fa-edit text-white text-sm"></i>
                    </button>
                    ${
                      device.Status !== "broken"
                        ? `
                    <button class="report-failure p-1 rounded bg-orange-600 hover:bg-orange-500 transition transform hover:scale-105" 
                            data-id="${device.id}" data-eqid="${device.DeviceCode}" data-name="${device.DeviceName}" title="Báo cáo hư hỏng">
                        <i class="fas fa-exclamation-triangle text-white text-sm"></i>
                    </button>
                    `
                        : ""
                    }
                </div>
            </td>
        `;

    return row;
  }

  // Thêm event listeners cho các nút trong bảng
  addTableEventListeners() {
    // Xem chi tiết
    document.querySelectorAll(".view-device").forEach((btn) => {
      btn.addEventListener("click", () => {
        const deviceId = btn.getAttribute("data-id");
        this.viewDeviceDetails(deviceId);
      });
    });

    // Chỉnh sửa
    document.querySelectorAll(".edit-device").forEach((btn) => {
      btn.addEventListener("click", () => {
        const deviceId = btn.getAttribute("data-id");
        this.openEditModal(deviceId);
      });
    });

    // Xóa
    document.querySelectorAll(".delete-device").forEach((btn) => {
      btn.addEventListener("click", () => {
        const deviceId = btn.getAttribute("data-id");
        const deviceEqid = btn.getAttribute("data-eqid");
        const deviceName = btn.getAttribute("data-name");
        this.openDeleteModal(deviceId, deviceEqid, deviceName);
      });
    });

    // Báo cáo hư hỏng
    document.querySelectorAll(".report-failure").forEach((btn) => {
      btn.addEventListener("click", () => {
        const deviceId = btn.getAttribute("data-id");
        const deviceEqid = btn.getAttribute("data-eqid");
        const deviceName = btn.getAttribute("data-name");
        this.openRepairRequestModal(deviceId, deviceEqid, deviceName);
      });
    });
  }

  // Mở modal xem chi tiết thiết bị
  async viewDeviceDetails(deviceId) {
    // Tìm device trong toàn bộ dữ liệu
    const device = this.currentDevices.find((d) => d.id == deviceId);
    if (!device) return;

    // Điền thông tin cơ bản
    this.fillDeviceDetails(device);

    // Tải lịch sử sửa chữa - thử cả 2 API
    try {
      await this.loadRepairHistory(deviceId);
    } catch (error) {
      console.log("Trying alternative API...");
      await this.loadRepairHistoryFromRequests(deviceId);
    }

    // Hiển thị modal
    const modal = document.getElementById("deviceDetailModal");
    const modalContent = document.getElementById("detailModalContent");
    this.openModal(modal, modalContent);
  }

  // Điền thông tin chi tiết thiết bị
  fillDeviceDetails(device) {
    const detailId = document.getElementById("detailId");
    const detailEqid = document.getElementById("detailEqid");
    const detailName = document.getElementById("detailName");
    const detailLab = document.getElementById("detailLab");
    const detailTeam = document.getElementById("detailTeam");
    const detailModel = document.getElementById("detailModel");
    const detailBranch = document.getElementById("detailBranch");
    const detailImportDate = document.getElementById("detailImportDate");
    const detailStatus = document.getElementById("detailStatus");

    if (detailId) detailId.textContent = device.id;
    if (detailEqid) detailEqid.textContent = device.DeviceCode;
    if (detailName) detailName.textContent = device.DeviceName;
    if (detailLab) detailLab.textContent = device.LabName;
    if (detailTeam) detailTeam.textContent = device.TeamName;
    if (detailModel) detailModel.textContent = device.Model;
    if (detailBranch) detailBranch.textContent = device.Branch;
    if (detailImportDate) detailImportDate.textContent = device.ImportDate;
    // Điền trạng thái với badge
    let statusText = "";
    switch (device.Status) {
      case "available":
        statusText =
          '<span class="px-3 py-1 rounded text-sm bg-green-600 ">Available</span>';
        break;

      case "broken":
        statusText =
          '<span class="px-3 py-1 rounded text-sm bg-red-600 ">Broken</span>';
        break;
      default:
        statusText = `<span class="px-3 py-1 rounded text-sm bg-gray-600 ">${
          device.Status || "Unknown"
        }</span>`;
    }
    if (detailStatus) detailStatus.innerHTML = statusText;
  }

  // Tải lịch sử sửa chữa
  async loadRepairHistory(deviceId) {
    try {
      const response = await fetch(
        `/historyrepair/by_DeviceID?DeviceID=${deviceId}`
      );
      const repairHistory = await response.json();

      this.renderRepairHistory(repairHistory);
    } catch (error) {
      console.error("Error loading repair history:", error);
      throw error;
    }
  }

  // Nếu API không tồn tại, sử dụng API repair_requests để lấy dữ liệu
  async loadRepairHistoryFromRequests(deviceId) {
    try {
      const response = await fetch(`/repair_requests?device_id=${deviceId}`);
      const repairRequests = await response.json();

      // Lọc các yêu cầu đã hoàn thành
      const completedRepairs = repairRequests.filter(
        (req) =>
          req.Status === "DoneInternalRepair" || req.Status === "Completed"
      );

      this.renderRepairHistory(completedRepairs);
    } catch (error) {
      console.error("Error loading repair history from requests:", error);
      this.showRepairHistoryError();
    }
  }

  // Hiển thị lịch sử sửa chữa
  renderRepairHistory(repairHistory) {
    const tbody = document.getElementById("repairHistoryBody");
    const emptyState = document.getElementById("repairHistoryEmpty");
    const repairCountElement = document.getElementById("detailRepairCount");
    const repairCostElement = document.getElementById("detailRepairCost");

    if (!tbody || !emptyState || !repairCountElement || !repairCostElement)
      return;

    // Ẩn/hiển thị empty state
    if (!repairHistory || repairHistory.length === 0) {
      tbody.innerHTML = "";
      emptyState.classList.remove("hidden");
      repairCountElement.textContent = "0";
      repairCostElement.textContent = "0 ₫";
      return;
    }

    emptyState.classList.add("hidden");
    tbody.innerHTML = "";

    // Tính toán thống kê
    let totalRepairCount = repairHistory.length;
    let totalRepairCost = 0;

    repairHistory.forEach((repair) => {
      const row = document.createElement("tr");
      row.className = "hover:bg-gray-700/50 transition-colors animate-fade-in";

      // Định dạng ngày
      const repairDate = repair.RepairDate
        ? new Date(repair.RepairDate).toLocaleDateString("vi-VN")
        : "N/A";

      // Định dạng chi phí
      const cost = repair.Cost
        ? repair.Cost.toLocaleString("vi-VN") + " ₫"
        : "0 ₫";
      // FIX: Cộng dồn cost từ TẤT CẢ các bản ghi
      totalRepairCost += parseFloat(repair.Cost) || 0;
      // Trạng thái sửa chữa
      let statusBadge = "";
      switch (repair.Status) {
        case "Completed":
          statusBadge =
            '<span class="px-2 py-1 rounded text-xs bg-green-600">Hoàn thành</span>';

          break;
        default:
          statusBadge =
            '<span class="px-2 py-1 rounded text-xs bg-green-600">Done</span>';
      }

      row.innerHTML = `
                <td class="px-4 py-3 border border-b-gray-800 pb-2">${repairDate}</td>
                <td class="px-4 py-3 border border-b-gray-800 pb-2">
                    <div class="max-w-xs">
                        <p class="text-white truncate" title="${
                          repair.Notes || repair.Description || "no description"
                        }">
                            ${
                              repair.Notes ||
                              repair.Description ||
                              "No description"
                            }
                        </p>
                    </div>
                </td>
                <td class="px-4 py-3 border border-b-gray-800 pb-2">
                    <span class="text-white-300">${
                      repair.TechName || "Unknown"
                    }</span>
                </td>
                <td class="px-4 py-3 border border-b-gray-800 pb-2">
                    <span class="px-2 py-1 rounded-full text-xs ${
                      repair.RepairType === "Internal" ||
                      repair.Status === "DoneInternalRepair"
                        ? "bg-indigo-600"
                        : repair.RepairType === "External"
                        ? "bg-purple-600"
                        : "bg-gray-600"
                    }">
                        ${
                          repair.RepairType === "Internal" ||
                          repair.Status === "DoneInternalRepair"
                            ? "Internal"
                            : repair.RepairType === "External"
                            ? "External"
                            : repair.RepairType || "Unknown"
                        }
                    </span>
                </td>
                <td class="px-4 py-3 border border-b-gray-800 pb-2">${cost}</td>
                <td class="px-4 py-3 border border-b-gray-800 pb-2">${statusBadge}</td>
            `;

      tbody.appendChild(row);
    });

    // Cập nhật thống kê
    repairCountElement.textContent = totalRepairCount.toString();
    repairCostElement.textContent =
      totalRepairCost.toLocaleString("vi-VN") + " ₫";
  }

  // Hiển thị lỗi khi không tải được dữ liệu
  showRepairHistoryError() {
    const tbody = document.getElementById("repairHistoryBody");
    const emptyState = document.getElementById("repairHistoryEmpty");
    const repairCountElement = document.getElementById("detailRepairCount");
    const repairCostElement = document.getElementById("detailRepairCost");

    if (tbody) {
      tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-red-400">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    Không thể tải lịch sử sửa chữa
                </td>
            </tr>
        `;
    }

    if (emptyState) emptyState.classList.add("hidden");

    // Tính toán repair count và repair cost từ dữ liệu hiện có (nếu có)
    let totalRepairCount = 0;
    let totalRepairCost = 0;

    // Nếu có dữ liệu repair history từ các nguồn khác, tính toán từ đó
    if (this.currentRepairHistory && this.currentRepairHistory.length > 0) {
      this.currentRepairHistory.forEach((repair) => {
        // Chỉ tính các repair đã hoàn thành
        if (
          repair.Status === "Completed" ||
          repair.Status === "DoneInternalRepair"
        ) {
          totalRepairCount++;
          totalRepairCost += repair.Cost || 0;
        }
      });
    }

    // Cập nhật UI
    if (repairCountElement)
      repairCountElement.textContent = totalRepairCount.toString();
    if (repairCostElement)
      repairCostElement.textContent =
        totalRepairCost.toLocaleString("vi-VN") + " ₫";
  }

  // Mở modal chỉnh sửa thiết bị
  openEditModal(deviceId) {
    // Tìm device trong toàn bộ dữ liệu
    const device = this.currentDevices.find((d) => d.id == deviceId);
    if (!device) return;

    // Điền thông tin vào form
    const editDeviceId = document.getElementById("editDeviceId");
    const editDeviceEqid = document.getElementById("editDeviceEqid");
    const editDeviceName = document.getElementById("editDeviceName");
    const editDeviceLab = document.getElementById("editDeviceLab");
    const editDeviceTeam = document.getElementById("editDeviceTeam");
    const editDeviceModel = document.getElementById("editDeviceModel");
    const editDeviceBranch = document.getElementById("editDeviceBranch");
    const editDeviceImportDate = document.getElementById("editDeviceImportDate");
    if (editDeviceId) editDeviceId.value = device.id;
    if (editDeviceEqid) editDeviceEqid.textContent = device.DeviceCode;
    if (editDeviceModel) editDeviceModel.value = device.Model;
    if (editDeviceBranch) editDeviceBranch.value = device.Branch;
    if (editDeviceImportDate) editDeviceImportDate.value = device.ImportDate;
    if (editDeviceName) editDeviceName.value = device.DeviceName;
    if (editDeviceLab) editDeviceLab.value = device.LabID || "";
    // FIX ĐƠN GIẢN: Set giá trị team trực tiếp, không cần load teams
    if (editDeviceTeam) {
      // Đảm bảo option cho team này tồn tại
      const existingOption = editDeviceTeam.querySelector(
        `option[value="${device.TeamID}"]`
      );
      if (!existingOption && device.TeamID) {
        // Nếu chưa có option, thêm mới
        const newOption = document.createElement("option");
        newOption.value = device.TeamID;
        newOption.textContent = device.TeamName;
        editDeviceTeam.appendChild(newOption);
      }
      // Set giá trị
      editDeviceTeam.value = device.TeamID || "";
    }
    // Hiển thị modal
    const modal = document.getElementById("editDeviceModal");
    const modalContent = document.getElementById("editModalContent");
    this.openModal(modal, modalContent);
  }

  // Mở modal xóa thiết bị
  openDeleteModal(deviceId, deviceEqid, deviceName) {
    this.deviceToDelete = deviceId;

    const deleteDeviceName = document.getElementById("deleteDeviceName");
    const deleteDeviceEqid = document.getElementById("deleteDeviceEqid");

    if (deleteDeviceName) deleteDeviceName.textContent = deviceName;
    if (deleteDeviceEqid) deleteDeviceEqid.textContent = deviceEqid;

    const modal = document.getElementById("deleteDeviceModal");
    const modalContent = document.getElementById("deleteModalContent");
    this.openModal(modal, modalContent);
  }

  // Mở modal yêu cầu sửa chữa
  openRepairRequestModal(deviceId, deviceEqid, deviceName) {
    // Tìm device trong toàn bộ dữ liệu
    const device = this.currentDevices.find((d) => d.id == deviceId);
    if (!device) return;
    // THÊM các dòng này để reset form:
  const priorityCheckbox = document.getElementById("priorityCheckbox");
  const problemDescription = document.getElementById("problemDescription");
  if (priorityCheckbox) priorityCheckbox.checked = false;
  if (problemDescription) problemDescription.value = "";


    // Điền thông tin vào form
    const repairDeviceId = document.getElementById("repairDeviceId");
    const repairDeviceName = document.getElementById("repairDeviceName");
    const repairDeviceEqid = document.getElementById("repairDeviceEqid");
    const repairDeviceLab = document.getElementById("repairDeviceLab");
    const repairDeviceModel = document.getElementById("repairDeviceModel");
    const repairDeviceBranch = document.getElementById("repairDeviceBranch");
    const repairDeviceImportDate = document.getElementById("repairDeviceImportDate");
    document.getElementById("problemDescription").value = "";

    if (repairDeviceId) repairDeviceId.value = deviceId;
    if (repairDeviceName) repairDeviceName.textContent = deviceName;
    if (repairDeviceEqid) repairDeviceEqid.textContent = deviceEqid;
    if (repairDeviceLab) repairDeviceLab.textContent = device.LabName;
    if (repairDeviceModel) repairDeviceModel.textContent = device.Model;
    if (repairDeviceBranch) repairDeviceBranch.textContent = device.Branch;
    if (repairDeviceImportDate) repairDeviceImportDate.textContent = device.ImportDate;
    // Hiển thị modal
    const modal = document.getElementById("repairRequestModal");
    const modalContent = document.getElementById("repairModalContent");
    this.openModal(modal, modalContent);
  }

  // Thêm thiết bị mới
  async addDevice() {
    const deviceEqid = document.getElementById("deviceEqid");
    const deviceName = document.getElementById("deviceName");
    const deviceTeam = document.getElementById("deviceTeam");
    const deviceModel = document.getElementById("deviceModel");
    const deviceBranch = document.getElementById("deviceBranch");
    const deviceImportDate = document.getElementById("deviceImportDate");
    const deviceStatus = document.getElementById("deviceStatus");

    if (!deviceEqid || !deviceName || !deviceTeam || !deviceStatus) return;
    if (deviceTeam.value === "all" || !deviceTeam.value) {
      this.showAlert("Vui lòng chọn team", "danger");
      return;
    }
    const formData = {
      DeviceCode: deviceEqid.value,
      DeviceName: deviceName.value,
      TeamID: deviceTeam.value || null,
      Model: deviceModel.value,
      Branch: deviceBranch.value,
      ImportDate: deviceImportDate.value,
      Status: deviceStatus.value,
    };

    // Validate
    if (!formData.DeviceCode) {
      this.showAlert("Vui lòng nhập mã thiết bị", "danger");
      return;
    }

    if (!formData.DeviceName) {
      this.showAlert("Vui lòng nhập tên thiết bị", "danger");
      return;
    }

    try {
      const response = await fetch("/devices/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      const newDevice = await response.json();

      // Đóng modal
      const modal = document.getElementById("addDeviceModal");
      const modalContent = document.getElementById("modalContent");
      this.closeModal(modal, modalContent);

      // Hiển thị thông báo
      this.showAlert("Thiết bị đã được thêm thành công", "success");

      // Thêm device mới vào phân trang (sẽ xuất hiện đầu tiên)
      if (this.pagination) {
        this.pagination.addItem(newDevice);
      }
      await this.loadDevices();
    } catch (error) {
      console.error("Error adding device:", error);
      this.showAlert(
        "Không thể thêm thiết bị: " + (error.error || "Lỗi không xác định"),
        "danger"
      );
    }
  }

  // Cập nhật thiết bị
  async updateDevice() {
    const editDeviceId = document.getElementById("editDeviceId");
    const editDeviceName = document.getElementById("editDeviceName");
    const editDeviceTeam = document.getElementById("editDeviceTeam");
    const editDeviceModel = document.getElementById("editDeviceModel");
    const editDeviceBranch = document.getElementById("editDeviceBranch");
    const editDeviceImportDate = document.getElementById("editDeviceImportDate");
    if (!editDeviceId || !editDeviceName || !editDeviceTeam) return;

    const deviceId = editDeviceId.value;
    const formData = {
      DeviceName: editDeviceName.value,
      TeamID: editDeviceTeam.value || null,
      Model:editDeviceModel.value,
      Branch: editDeviceBranch.value,
      ImportDate: editDeviceImportDate.value
    };

    // Validate
    if (!formData.DeviceName) {
      this.showAlert("Vui lòng nhập tên thiết bị", "danger");
      return;
    }

    try {
      const response = await fetch(`/devices/${deviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      const updatedDevice = await response.json();

      // Đóng modal
      const modal = document.getElementById("editDeviceModal");
      const modalContent = document.getElementById("editModalContent");
      this.closeModal(modal, modalContent);

      // Hiển thị thông báo
      this.showAlert("Thiết bị đã được cập nhật thành công", "success");

      // Cập nhật device trong phân trang
      if (this.pagination) {
        this.pagination.updateItem(deviceId, updatedDevice);
      }
      await this.loadDevices();
    } catch (error) {
      console.error("Error updating device:", error);
      this.showAlert(
        "Không thể cập nhật thiết bị: " + (error.error || "Lỗi không xác định"),
        "danger"
      );
    }
  }

  // Xóa thiết bị
  async deleteDevice() {
    if (!this.deviceToDelete) return;

    try {
      const response = await fetch(`/devices/${this.deviceToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      // Đóng modal
      const modal = document.getElementById("deleteDeviceModal");
      const modalContent = document.getElementById("deleteModalContent");
      this.closeModal(modal, modalContent);

      // Hiển thị thông báo
      this.showAlert("Thiết bị đã được xóa thành công", "success");

      // Xóa device khỏi phân trang
      if (this.pagination) {
        this.pagination.removeItem(this.deviceToDelete);
      }
      await this.loadDevices();

      // Reset biến
      this.deviceToDelete = null;
    } catch (error) {
      console.error("Error deleting device:", error);
      this.showAlert(
        "Không thể xóa thiết bị: " + (error.error || "Lỗi không xác định"),
        "danger"
      );
    }
  }

  // Gửi yêu cầu sửa chữa
  // TÌM và THAY THẾ hoàn toàn phương thức submitRepairRequest bằng:
async submitRepairRequest() {
  const repairDeviceId = document.getElementById("repairDeviceId");
  const problemDescription = document.getElementById("problemDescription");
  const priorityCheckbox = document.getElementById("priorityCheckbox");

  if (!repairDeviceId || !problemDescription || !priorityCheckbox) return;

  const deviceId = repairDeviceId.value;
  const problemDesc = problemDescription.value.trim();
  const isPriority = priorityCheckbox.checked;

  // THÊM validation mới:
  if (!problemDesc) {
    this.showAlert("Vui lòng nhập mô tả vấn đề", "danger");
    problemDescription.focus();
    return;
  }

  if (problemDesc.length < 10) {
    this.showAlert("Mô tả vấn đề phải có ít nhất 10 ký tự", "danger");
    problemDescription.focus();
    return;
  }

  const device = this.currentDevices.find((d) => d.id == deviceId);
  if (!device) {
    this.showAlert("Không tìm thấy thông tin thiết bị", "danger");
    return;
  }

  // SỬA formData - thêm trường Priority:
  const formData = {
    DeviceID: parseInt(deviceId),
    LabID: device.LabID,
    TeamID: device.TeamID,
    RequestedBy: username,
    Description: problemDesc,
    Priority: priorityCheckbox.checked,// SỬA: chỉ true/false
    Status: "Wait Evaluation",
    RequestDate: fnGetCurrentDateTime(),
  };

  try {
    // THÊM loading state:
    const submitBtn = document.getElementById("submitRepairRequestBtn");
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
    submitBtn.disabled = true;

    const response = await fetch("/repair_requests/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Lỗi không xác định");
    }

    const newRequest = await response.json();

    await this.updateDeviceStatus(deviceId, "broken");

    const modal = document.getElementById("repairRequestModal");
    const modalContent = document.getElementById("repairModalContent");
    this.closeModal(modal, modalContent);

    
    this.showAlert(`Yêu cầu sửa chữa đã được gửi thành công`, "success");

  } catch (error) {
    console.error("Error submitting repair request:", error);
    this.showAlert(
      "Không thể gửi yêu cầu sửa chữa: " + error.message,
      "danger"
    );
  } finally {
    // THÊM phần khôi phục nút:
    const submitBtn = document.getElementById("submitRepairRequestBtn");
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Gửi báo cáo';
      submitBtn.disabled = false;
    }
  }
}
  // Cập nhật trạng thái thiết bị
  async updateDeviceStatus(deviceId, status) {
    const device = this.currentDevices.find((d) => d.id == deviceId);
    if (!device) return;

    const updateData = {
      DeviceCode: device.DeviceCode,
      DeviceName: device.DeviceName,
      TeamID: device.TeamID,
      Status: status,
    };

    try {
      const response = await fetch(`/devices/${deviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      const updatedDevice = await response.json();

      // Cập nhật device trong phân trang
      if (this.pagination) {
        this.pagination.updateItem(deviceId, updatedDevice);
      }
      await this.loadDevices();
    } catch (error) {
      console.error("Error updating device status:", error);
    }
  }

  // Hiển thị thông báo
  showAlert(message, type) {
    const alertContainer = document.getElementById("alertContainer");
    if (!alertContainer) return;

    const alertId = "alert-" + Date.now();

    const alertClasses = {
      success: "bg-green-900 border-green-700 text-green-300",
      danger: "bg-red-900 border-red-700 text-red-300",
      warning: "bg-yellow-900 border-yellow-700 text-yellow-300",
      info: "bg-blue-900 border-blue-700 text-blue-300",
    };

    const alert = document.createElement("div");
    alert.id = alertId;
    alert.className = `p-4 rounded-lg border ${
      alertClasses[type] || alertClasses.info
    } mb-4 transition-all duration-300 transform animate-fade-in shadow-lg`;
    alert.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <i class="fas fa-${
                      type === "success"
                        ? "check-circle"
                        : type === "danger"
                        ? "exclamation-triangle"
                        : type === "warning"
                        ? "exclamation-circle"
                        : "info-circle"
                    }"></i>
                    <span>${message}</span>
                </div>
                <button onclick="document.getElementById('${alertId}').remove()" class="text-lg hover:opacity-70 transition">
                    &times;
                </button>
            </div>
        `;

    alertContainer.appendChild(alert);

    // Tự động ẩn sau 5 giây
    setTimeout(() => {
      const alertElement = document.getElementById(alertId);
      if (alertElement) {
        alertElement.style.opacity = "0";
        alertElement.style.transform = "translateX(100%)";
        setTimeout(() => {
          if (alertElement.parentNode) {
            alertElement.parentNode.removeChild(alertElement);
          }
        }, 300);
      }
    }, 5000);
  }
}

// Khởi tạo khi trang được tải
document.addEventListener("DOMContentLoaded", function () {
  new DeviceManager();
});

function loadSelect(idFilter, idEdit, idAdd, ls, isDisabled, name) {
  function getLabList(id) {
    const idE = document.getElementById(id);
    if (!idE) return;
    newLs = ls.map((l) => `<option value="${l.id}">${l[name]}</option>`);
    str = newLs.join("");
    idE.innerHTML = `<option value="all">All</option>` + str;
    idE.disabled = isDisabled;
  }
  getLabList(idFilter);
  getLabList(idEdit);
  getLabList(idAdd);
}

function resetTeamSelect(id) {
  const idE = document.getElementById(id);
  if (!idE) return;
  idE.innerHTML = `<option value="all">All</option>`;
  idE.disabled = false;
}

function loadTeamUser(
  idLabElement,
  idLab,
  labName,
  idTeamElement,
  idTeam,
  TeamName,
  isDisabled = true
) {
  const labId = document.getElementById(idLabElement);
  const teamId = document.getElementById(idTeamElement);
  labId.innerHTML = `<option value="${idLab}">${labName}</option>`;
  teamId.innerHTML = `<option value="${idTeam}">${TeamName}</option>`;
  labId.disabled = isDisabled;
  teamId.disabled = isDisabled;
}

// Thêm hàm mới:
function loadSelectWithClear(idFilter, idEdit, idAdd, ls, isDisabled, name) {
  // FIX: Xử lý từng dropdown riêng biệt thay vì cả 3 cùng một lúc
  function updateSelect(id, data, disabled) {
    const selectElement = document.getElementById(id);
    if (!selectElement) return;

    // CLEAR TRƯỚC KHI THÊM MỚI
    selectElement.innerHTML = `<option value="all">All</option>`;

    // Thêm options mới
    if (Array.isArray(data)) {
      data.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item[name];
        selectElement.appendChild(option);
      });
    }

    selectElement.disabled = disabled;
  }

  // Chỉ update các dropdown có tồn tại
  if (idFilter) updateSelect(idFilter, ls, isDisabled);
  if (idEdit) updateSelect(idEdit, ls, isDisabled);
  if (idAdd) updateSelect(idAdd, ls, isDisabled);
}
