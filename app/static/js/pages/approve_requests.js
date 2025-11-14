document.addEventListener('DOMContentLoaded', function() {
    let currentRequests = [];
    let devices = [];
    let labs = [];
    let currentRequestId = null;
    let currentFilter = 'all';

    // Khởi tạo trang
    initPage();

    function initPage() {
        loadDevices();
        loadLabs();
        loadRequests();
        setupEventListeners();
    }

    function setupEventListeners() {
        // Lọc theo trạng thái
        document.querySelectorAll('.filter-status').forEach(item => {
            item.addEventListener('click', function() {
                currentFilter = this.getAttribute('data-status');
                filterRequests(currentFilter);
                
                document.querySelectorAll('.filter-status').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Xử lý duyệt và từ chối
        document.getElementById('approveRequestBtn').addEventListener('click', function() {
            approveRequest(true);
        });

        document.getElementById('rejectRequestBtn').addEventListener('click', function() {
            approveRequest(false);
        });
    }

    function loadDevices() {
        fetch('/devices/')
            .then(response => response.json())
            .then(data => {
                devices = data;
            })
            .catch(error => {
                console.error('Error loading devices:', error);
            });
    }

    function loadLabs() {
        fetch('/labs/')
            .then(response => response.json())
            .then(data => {
                labs = data;
            })
            .catch(error => {
                console.error('Error loading labs:', error);
            });
    }

    function loadRequests() {
        fetch('/requests/')
            .then(response => response.json())
            .then(data => {
                currentRequests = data;
                renderRequestsTable(currentRequests);
            })
            .catch(error => {
                console.error('Error loading requests:', error);
                showAlert('Không thể tải danh sách yêu cầu', 'danger');
            });
    }

    function filterRequests(status) {
        if (status === 'all') {
            renderRequestsTable(currentRequests);
        } else {
            const filteredRequests = currentRequests.filter(request => request.status === status);
            renderRequestsTable(filteredRequests);
        }
    }

    function renderRequestsTable(requests) {
        const tbody = document.querySelector('#requestsTable tbody');
        tbody.innerHTML = '';

        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Không có yêu cầu nào</td></tr>';
            return;
        }

        requests.forEach(request => {
            const row = document.createElement('tr');
            
            // Lấy thông tin thiết bị
            const device = devices.find(d => d.idevice === request.iddevice) || { name: 'N/A' };
            
            // Định dạng ngày
            const requestDate = request.request_date ? new Date(request.request_date).toLocaleDateString('vi-VN') : 'N/A';
            
            // Tạo badge trạng thái
            let statusBadge = '';
            switch(request.status) {
                case 'pending':
                    statusBadge = '<span class="badge bg-warning">Chờ duyệt</span>';
                    break;
                case 'approved':
                    statusBadge = '<span class="badge bg-success">Đã duyệt</span>';
                    break;
                case 'rejected':
                    statusBadge = '<span class="badge bg-danger">Từ chối</span>';
                    break;
                case 'internal':
                    statusBadge = '<span class="badge bg-info">Sửa nội bộ</span>';
                    break;
                case 'external':
                    statusBadge = '<span class="badge bg-primary">Sửa ngoài</span>';
                    break;
                case 'completed':
                    statusBadge = '<span class="badge bg-secondary">Hoàn thành</span>';
                    break;
                default:
                    statusBadge = '<span class="badge bg-secondary">Không xác định</span>';
            }
            
            // Tạo badge ưu tiên
            let priorityBadge = '';
            switch(request.priority) {
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
                <td>${request.idrequest}</td>
                <td>${device.name}</td>
                <td>${request.requester_name || 'N/A'}</td>
                <td>${request.description ? (request.description.length > 50 ? request.description.substring(0, 50) + '...' : request.description) : 'N/A'}</td>
                <td>${priorityBadge}</td>
                <td>${requestDate}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-info view-request" data-id="${request.idrequest}" title="Xem chi tiết">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Thêm event listeners
        addTableEventListeners();
    }

    function addTableEventListeners() {
        document.querySelectorAll('.view-request').forEach(btn => {
            btn.addEventListener('click', function() {
                const requestId = this.getAttribute('data-id');
                viewRequestDetails(requestId);
            });
        });
    }

    function viewRequestDetails(requestId) {
        const request = currentRequests.find(r => r.idrequest == requestId);
        if (!request) return;
        
        currentRequestId = requestId;
        
        // Lấy thông tin thiết bị và phòng lab
        const device = devices.find(d => d.idevice === request.iddevice) || { name: 'N/A', idlab: null };
        const lab = labs.find(l => l.idlab === device.idlab) || { name: 'N/A' };
        
        // Điền thông tin vào modal
        document.getElementById('detailRequestId').textContent = request.idrequest;
        document.getElementById('detailDevice').textContent = device.name;
        document.getElementById('detailLab').textContent = lab.name;
        document.getElementById('detailRequester').textContent = request.requester_name || 'N/A';
        document.getElementById('detailContact').textContent = request.contact_info || 'N/A';
        document.getElementById('detailRequestDate').textContent = request.request_date ? new Date(request.request_date).toLocaleDateString('vi-VN') : 'N/A';
        document.getElementById('detailDescription').textContent = request.description || 'Không có mô tả';
        
        // Điền thông tin ưu tiên
        let priorityText = '';
        switch(request.priority) {
            case 'low':
                priorityText = '<span class="badge bg-info">Thấp</span>';
                break;
            case 'medium':
                priorityText = '<span class="badge bg-warning">Trung bình</span>';
                break;
            case 'high':
                priorityText = '<span class="badge bg-danger">Cao</span>';
                break;
            default:
                priorityText = '<span class="badge bg-secondary">Không xác định</span>';
        }
        document.getElementById('detailPriority').innerHTML = priorityText;
        
        // Điền thông tin chi phí
        document.getElementById('detailCost').textContent = request.estimated_cost ? request.estimated_cost.toLocaleString('vi-VN') + ' VND' : 'Chưa có';
        
        // Điền thông tin trạng thái
        let statusText = '';
        switch(request.status) {
            case 'pending':
                statusText = '<span class="badge bg-warning">Chờ duyệt</span>';
                break;
            case 'approved':
                statusText = '<span class="badge bg-success">Đã duyệt</span>';
                break;
            case 'rejected':
                statusText = '<span class="badge bg-danger">Từ chối</span>';
                break;
            case 'internal':
                statusText = '<span class="badge bg-info">Sửa nội bộ</span>';
                break;
            case 'external':
                statusText = '<span class="badge bg-primary">Sửa ngoài</span>';
                break;
            case 'completed':
                statusText = '<span class="badge bg-secondary">Hoàn thành</span>';
                break;
            default:
                statusText = '<span class="badge bg-secondary">Không xác định</span>';
        }
        document.getElementById('detailStatus').innerHTML = statusText;
        
        // Hiển thị/ẩn section phê duyệt
        const approvalSection = document.getElementById('approvalSection');
        if (request.status === 'pending') {
            approvalSection.style.display = 'block';
            document.getElementById('approvalNotes').value = '';
        } else {
            approvalSection.style.display = 'none';
        }
        
        // Hiển thị modal
        const modal = new bootstrap.Modal(document.getElementById('requestDetailModal'));
        modal.show();
    }

    function approveRequest(isApproved) {
        if (!currentRequestId) return;
        
        const notes = document.getElementById('approvalNotes').value;
        const newStatus = isApproved ? 'approved' : 'rejected';
        
        fetch(`/requests/${currentRequestId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus,
                approval_notes: notes,
                approval_date: new Date().toISOString()
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw err; });
            }
            return response.json();
        })
        .then(updatedRequest => {
            // Đóng modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('requestDetailModal'));
            modal.hide();
            
            // Hiển thị thông báo
            showAlert(`Yêu cầu đã được ${isApproved ? 'duyệt' : 'từ chối'} thành công`, 'success');
            
            // Tải lại danh sách yêu cầu
            loadRequests();
        })
        .catch(error => {
            console.error('Error updating request:', error);
            showAlert('Không thể cập nhật yêu cầu: ' + (error.error || 'Lỗi không xác định'), 'danger');
        });
    }

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
        
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                const bsAlert = new bootstrap.Alert(alertElement);
                bsAlert.close();
            }
        }, 5000);
    }
});