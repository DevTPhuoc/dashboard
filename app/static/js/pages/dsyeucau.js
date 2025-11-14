document.addEventListener('DOMContentLoaded', function () {
    let currentDevices = [];
    let labs = [];
    let teams = [];
    let currentFilter = 'all';
    let deviceToDelete = null;

    // Khởi tạo trang
    initPage();

    // Hàm khởi tạo trang
    function initPage() {
        loadLabs();
        loadTeams();
        loadDevices();
        setupEventListeners();
    }

    // Thiết lập các event listeners
    function setupEventListeners() {
        // Lọc theo trạng thái
        document.querySelectorAll('.filter-status').forEach(item => {
            item.addEventListener('click', function () {
                currentFilter = this.getAttribute('data-status');
                filterDevices(currentFilter);

                // Cập nhật UI
                document.querySelectorAll('.filter-status').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Lưu thiết bị mới
        document.getElementById('saveDeviceBtn').addEventListener('click', addDevice);

        // Cập nhật thiết bị
        document.getElementById('updateDeviceBtn').addEventListener('click', updateDevice);

        // Xác nhận xóa thiết bị
        document.getElementById('confirmDeleteBtn').addEventListener('click', deleteDevice);

        // Đóng modal và reset form
        document.getElementById('addDeviceModal').addEventListener('hidden.bs.modal', function () {
            document.getElementById('addDeviceForm').reset();
        });

        document.getElementById('editDeviceModal').addEventListener('hidden.bs.modal', function () {
            document.getElementById('editDeviceForm').reset();
        });
    }

    // Tải danh sách phòng lab
    function loadLabs() {
        fetch('/labs/')
            .then(response => response.json())
            .then(data => {
                labs = data;
                populateLabDropdowns();
            })
            .catch(error => {
                console.error('Error loading labs:', error);
                showAlert('Không thể tải danh sách phòng lab', 'danger');
            });
    }

    // Tải danh sách nhóm
    function loadTeams() {
        fetch('/teams/')
            .then(response => response.json())
            .then(data => {
                teams = data;
                populateTeamDropdowns();
            })
            .catch(error => {
                console.error('Error loading teams:', error);
                showAlert('Không thể tải danh sách nhóm', 'danger');
            });
    }

    // Điền dữ liệu vào dropdown phòng lab
    function populateLabDropdowns() {
        const labDropdowns = [
            document.getElementById('deviceLab'),
            document.getElementById('editDeviceLab')
        ];

        labDropdowns.forEach(dropdown => {
            if (dropdown) {
                // Giữ option đầu tiên, xóa các option cũ
                while (dropdown.options.length > 1) {
                    dropdown.remove(1);
                }

                // Thêm options mới
                labs.forEach(lab => {
                    const option = document.createElement('option');
                    option.value = lab.idlab;
                    option.textContent = lab.name;
                    dropdown.appendChild(option);
                });
            }
        });
    }

    // Điền dữ liệu vào dropdown nhóm
    function populateTeamDropdowns() {
        const teamDropdowns = [
            document.getElementById('deviceTeam'),
            document.getElementById('editDeviceTeam')
        ];

        teamDropdowns.forEach(dropdown => {
            if (dropdown) {
                // Giữ option đầu tiên, xóa các option cũ
                while (dropdown.options.length > 1) {
                    dropdown.remove(1);
                }

                // Thêm options mới
                teams.forEach(team => {
                    const option = document.createElement('option');
                    option.value = team.idteam;
                    option.textContent = team.name;
                    dropdown.appendChild(option);
                });
            }
        });
    }

    // Tải danh sách thiết bị
    function loadDevices() {
        fetch('/request/')
            .then(response => response.json())
            .then(data => {
                currentDevices = data;
                renderDevicesTable(currentDevices);
            })
            .catch(error => {
                console.error('Error loading devices:', error);
                showAlert('Không thể tải danh sách thiết bị', 'danger');
            });
    }

    // Lọc thiết bị theo trạng thái
    function filterDevices(status) {
        if (status === 'all') {
            renderDevicesTable(currentDevices);
        } else {
            const filteredDevices = currentDevices.filter(device => device.status === status);
            renderDevicesTable(filteredDevices);
        }
    }

    // Hiển thị danh sách thiết bị trong bảng
    function renderDevicesTable(devices) {
        const tbody = document.querySelector('requestsTableBody');
        tbody.innerHTML = '';

        if (devices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Không có thiết bị nào</td></tr>';
            return;
        }

        devices.forEach(device => {
            const row = document.createElement('tr');

    

            // Lấy tên phòng lab và nhóm
            const lab = labs.find(l => l.idlab === device.idlab) || { name: 'N/A' };
            const team = teams.find(t => t.idteam === device.idteam) || { name: 'N/A' };

            // Tạo badge trạng thái
            let statusBadge = '';
            switch (device.status) {
                case 'available':
                    statusBadge = '<span class="badge bg-success">Sẵn sàng</span>';
                    break;
                case 'in_use':
                    statusBadge = '<span class="badge bg-primary">Đang sử dụng</span>';
                    break;
                case 'maintenance':
                    statusBadge = '<span class="badge bg-warning">Bảo trì</span>';
                    break;
                case 'broken':
                    statusBadge = '<span class="badge bg-danger">Hỏng</span>';
                    break;
                default:
                    statusBadge = '<span class="badge bg-secondary">Không xác định</span>';
            }

            row.innerHTML = `
                <td>${device.idevice}</td>
                <td>${device.name}</td>
                <td>${lab.name}</td>
                <td>${team.name}</td>
                <td>${statusBadge}</td>
                
                <td>
                    <button class="btn btn-sm btn-info view-device" data-id="${device.idevice}" title="Xem chi tiết">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning edit-device" data-id="${device.idevice}" title="Chỉnh sửa">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-device" data-id="${device.idevice}" data-name="${device.name}" title="Xóa">
                        <i class="bi bi-trash"></i>
                    </button>
                    <button class="btn btn-sm btn-warning report-failure" data-id="${device.idevice}" data-name="${device.name}" title="Báo cáo hư hỏng">
                        <i class="bi bi-exclamation-triangle"></i>
                    </button>
    
                </td>
            `;

            tbody.appendChild(row);
        });

        // Thêm event listeners cho các nút
        addTableEventListeners();
    }

    // Thêm event listeners cho các nút trong bảng
    function addTableEventListeners() {
        // Xem chi tiết
        document.querySelectorAll('.view-device').forEach(btn => {
            btn.addEventListener('click', function () {
                const deviceId = this.getAttribute('data-id');
                viewDeviceDetails(deviceId);
            });
        });

        // Chỉnh sửa
        document.querySelectorAll('.edit-device').forEach(btn => {
            btn.addEventListener('click', function () {
                const deviceId = this.getAttribute('data-id');
                openEditModal(deviceId);
            });
        });

        // Xóa
        document.querySelectorAll('.delete-device').forEach(btn => {
            btn.addEventListener('click', function () {
                const deviceId = this.getAttribute('data-id');
                const deviceName = this.getAttribute('data-name');
                openDeleteModal(deviceId, deviceName);
            });
        });
        // 🚀 Fix: Báo cáo hư hỏng
    document.querySelectorAll('.report-failure').forEach(btn => {
        btn.addEventListener('click', function () {
            const deviceId = this.getAttribute('data-id');
            const deviceName = this.getAttribute('data-name');
            openRepairRequestModal(deviceId, deviceName);
        });
    });
    }

    // Mở modal xem chi tiết thiết bị
    function viewDeviceDetails(deviceId) {
        const device = currentDevices.find(d => d.idevice == deviceId);
        if (!device) return;

        // Lấy thông tin phòng lab và nhóm
        const lab = labs.find(l => l.idlab === device.idlab) || { name: 'N/A' };
        const team = teams.find(t => t.idteam === device.idteam) || { name: 'N/A' };

        // Điền thông tin cơ bản
        document.getElementById('detailId').textContent = device.idevice;
        document.getElementById('detailName').textContent = device.name;
        document.getElementById('detailLab').textContent = lab.name;
        document.getElementById('detailTeam').textContent = team.name;

        // Điền trạng thái với badge
        let statusText = '';
        switch (device.status) {
            case 'available':
                statusText = '<span class="badge bg-success">Sẵn sàng</span>';
                break;
            case 'in_use':
                statusText = '<span class="badge bg-primary">Đang sử dụng</span>';
                break;
            case 'maintenance':
                statusText = '<span class="badge bg-warning">Bảo trì</span>';
                break;
            case 'broken':
                statusText = '<span class="badge bg-danger">Hỏng</span>';
                break;
            default:
                statusText = '<span class="badge bg-secondary">Không xác định</span>';
        }
        document.getElementById('detailStatus').innerHTML = statusText;

        // Tải lịch sử sửa chữa
        loadRepairHistory(deviceId);

        // Hiển thị modal
        const modal = new bootstrap.Modal(document.getElementById('deviceDetailModal'));
        modal.show();
    }

    // Tải lịch sử sửa chữa
    function loadRepairHistory(deviceId) {
        fetch(`/requests/device/${deviceId}`)
            .then(response => response.json())
            .then(requests => {
                const tbody = document.querySelector('#repairHistoryTable tbody');
                tbody.innerHTML = '';

                if (requests.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Không có lịch sử sửa chữa</td></tr>';
                    return;
                }

                requests.forEach(request => {
                    const row = document.createElement('tr');

                    // Định dạng ngày
                    const requestDate = request.request_date ? new Date(request.request_date).toLocaleDateString('vi-VN') : 'N/A';

                    // Tạo badge trạng thái
                    let statusBadge = '';
                    switch (request.status) {
                        case 'pending':
                            statusBadge = '<span class="badge bg-warning">Chờ xử lý</span>';
                            break;
                        case 'in_progress':
                            statusBadge = '<span class="badge bg-primary">Đang xử lý</span>';
                            break;
                        case 'completed':
                            statusBadge = '<span class="badge bg-success">Hoàn thành</span>';
                            break;
                        default:
                            statusBadge = '<span class="badge bg-secondary">Không xác định</span>';
                    }

                    // Tạo badge ưu tiên
                    let priorityBadge = '';
                    switch (request.priority) {
                        case 'low':
                            priorityBadge = '<span class="badge bg-info">Thấp</span>';
                            break;
                        case 'medium':
                            priorityBadge = '<span class="badge bg-warning">Trung bình</span>';
                            break;
                        case 'high':
                            priorityBadge = '<span class="badge bg-danger">Cao</span>';
                            break;
                        default:
                            priorityBadge = '<span class="badge bg-secondary">Không xác định</span>';
                    }

                    row.innerHTML = `
                        <td>${requestDate}</td>
                        <td>${request.description}</td>
                        <td>${statusBadge}</td>
                        <td>${priorityBadge}</td>
                    `;

                    tbody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error loading repair history:', error);
                const tbody = document.querySelector('#repairHistoryTable tbody');
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">Không thể tải lịch sử sửa chữa</td></tr>';
            });
    }

    // Mở modal chỉnh sửa thiết bị
    function openEditModal(deviceId) {
        const device = currentDevices.find(d => d.idevice == deviceId);
        if (!device) return;

        // Điền thông tin vào form
        document.getElementById('editDeviceId').value = device.idevice;
        document.getElementById('editDeviceName').value = device.name;
        document.getElementById('editDeviceLab').value = device.idlab || '';
        document.getElementById('editDeviceTeam').value = device.idteam || '';
        document.getElementById('editDeviceStatus').value = device.status;
        

        // Hiển thị modal
        const modal = new bootstrap.Modal(document.getElementById('editDeviceModal'));
        modal.show();
    }

    // Mở modal xóa thiết bị
    function openDeleteModal(deviceId, deviceName) {
        deviceToDelete = deviceId;
        document.getElementById('deleteDeviceName').textContent = deviceName;

        const modal = new bootstrap.Modal(document.getElementById('deleteDeviceModal'));
        modal.show();
    }

    // Thêm thiết bị mới
    function addDevice() {
        const formData = {
            name: document.getElementById('deviceName').value,
            idlab: document.getElementById('deviceLab').value || null,
            idteam: document.getElementById('deviceTeam').value || null,
            status: document.getElementById('deviceStatus').value
        };

        // Validate
        if (!formData.name) {
            showAlert('Vui lòng nhập tên thiết bị', 'danger');
            return;
        }

        if (!formData.idlab) {
            showAlert('Vui lòng chọn phòng lab', 'danger');
            return;
        }

        fetch('/devices/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw err; });
                }
                return response.json();
            })
            .then(newDevice => {
                // Đóng modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('addDeviceModal'));
                modal.hide();

                // Hiển thị thông báo
                showAlert('Thiết bị đã được thêm thành công', 'success');

                // Tải lại danh sách thiết bị
                loadDevices();
            })
            .catch(error => {
                console.error('Error adding device:', error);
                showAlert('Không thể thêm thiết bị: ' + (error.error || 'Lỗi không xác định'), 'danger');
            });
    }

    // Cập nhật thiết bị
    function updateDevice() {
        const deviceId = document.getElementById('editDeviceId').value;
        const formData = {
            name: document.getElementById('editDeviceName').value,
            idlab: document.getElementById('editDeviceLab').value || null,
            idteam: document.getElementById('editDeviceTeam').value || null,
            status: document.getElementById('editDeviceStatus').value
        };

        // Validate
        if (!formData.name) {
            showAlert('Vui lòng nhập tên thiết bị', 'danger');
            return;
        }

        if (!formData.idlab) {
            showAlert('Vui lòng chọn phòng lab', 'danger');
            return;
        }

        fetch(`/devices/${deviceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw err; });
                }
                return response.json();
            })
            .then(updatedDevice => {
                // Đóng modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editDeviceModal'));
                modal.hide();

                // Hiển thị thông báo
                showAlert('Thiết bị đã được cập nhật thành công', 'success');

                // Tải lại danh sách thiết bị
                loadDevices();
            })
            .catch(error => {
                console.error('Error updating device:', error);
                showAlert('Không thể cập nhật thiết bị: ' + (error.error || 'Lỗi không xác định'), 'danger');
            });
    }

    // Xóa thiết bị
    function deleteDevice() {
        if (!deviceToDelete) return;

        fetch(`/devices/${deviceToDelete}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw err; });
                }
                return response.json();
            })
            .then(() => {
                // Đóng modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('deleteDeviceModal'));
                modal.hide();

                // Hiển thị thông báo
                showAlert('Thiết bị đã được xóa thành công', 'success');

                // Tải lại danh sách thiết bị
                loadDevices();

                // Reset biến
                deviceToDelete = null;
            })
            .catch(error => {
                console.error('Error deleting device:', error);
                showAlert('Không thể xóa thiết bị: ' + (error.error || 'Lỗi không xác định'), 'danger');
            });
    }

    // Hiển thị thông báo
    function showAlert(message, type) {
        const alertContainer = document.getElementById('alertContainer');
        const alertId = 'alert-' + Date.now();

        const alert = document.createElement('div');
        alert.id = alertId;
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        alertContainer.appendChild(alert);

        // Tự động ẩn sau 5 giây
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                const bsAlert = new bootstrap.Alert(alertElement);
                bsAlert.close();
            }
        }, 5000);
    }
    // Trong hàm setupEventListeners(), thêm sự kiện cho nút gửi yêu cầu sửa chữa
    document.getElementById('submitRepairRequestBtn').addEventListener('click', submitRepairRequest);

    // Trong hàm addTableEventListeners(), thêm sự kiện cho nút "Phát hiện hư hỏng"
    document.querySelectorAll('.report-failure').forEach(btn => {
        btn.addEventListener('click', function () {
            const deviceId = this.getAttribute('data-id');
            const deviceName = this.getAttribute('data-name');
            openRepairRequestModal(deviceId, deviceName);
        });
    });

    /// Trong hàm setupEventListeners(), thêm sự kiện cho nút gửi yêu cầu sửa chữa
    document.getElementById('submitRepairRequestBtn').addEventListener('click', submitRepairRequest);

    // Trong hàm addTableEventListeners(), thêm sự kiện cho nút "Phát hiện hư hỏng"
    document.querySelectorAll('.report-failure').forEach(btn => {
        btn.addEventListener('click', function () {
            const deviceId = this.getAttribute('data-id');
            const deviceName = this.getAttribute('data-name');
            openRepairRequestModal(deviceId, deviceName);
        });
    });

    // Hàm mở modal yêu cầu sửa chữa
    function openRepairRequestModal(deviceId, deviceName) {
        const device = currentDevices.find(d => d.idevice == deviceId);
        if (!device) return;

        // Lấy thông tin phòng lab
        const lab = labs.find(l => l.idlab === device.idlab) || { name: 'N/A' };

        // Điền thông tin vào form
        document.getElementById('repairDeviceId').value = deviceId;
        document.getElementById('repairDeviceName').textContent = deviceName;
        document.getElementById('repairDeviceLab').textContent = lab.name;

        // Hiển thị modal
        const modal = new bootstrap.Modal(document.getElementById('repairRequestModal'));
        modal.show();
    }

    // Hàm gửi yêu cầu sửa chữa
    function submitRepairRequest() {
        const deviceId = document.getElementById('repairDeviceId').value;
        const formData = {
            iddevice: parseInt(deviceId),
            status: 'pending'
        };


        fetch('/requests/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw err; });
                }
                return response.json();
            })
            .then(newRequest => {
                // Cập nhật trạng thái thiết bị thành "broken"
                updateDeviceStatus(deviceId, 'broken');

                // Đóng modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('repairRequestModal'));
                modal.hide();

                // Hiển thị thông báo
                showAlert('Yêu cầu sửa chữa đã được gửi thành công', 'success');
            })
            .catch(error => {
                console.error('Error submitting repair request:', error);
                showAlert('Không thể gửi yêu cầu sửa chữa: ' + (error.error || 'Lỗi không xác định'), 'danger');
            });
    }

    // Hàm cập nhật trạng thái thiết bị
    function updateDeviceStatus(deviceId, status) {
        const device = currentDevices.find(d => d.idevice == deviceId);
        if (!device) return;

        const updateData = {
            status: status
        };

        fetch(`/devices/${deviceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw err; });
                }
                return response.json();
            })
            .then(updatedDevice => {
                // Cập nhật danh sách thiết bị
                loadDevices();
            })
            .catch(error => {
                console.error('Error updating device status:', error);
            });
    }



});