

document.addEventListener('DOMContentLoaded', function () {
    // ================= STATE =================
    let repairRequests = [];

    // ================= INIT =================
    initPage();

    function initPage() {
        loadRequests();
        setupEventListeners();
    }

    // ================= EVENT LISTENERS =================
    function setupEventListeners() {
        // Lọc
        document.getElementById('filterButton').addEventListener('click', function() {
            const status = document.getElementById('statusFilter').value;
            renderRequests(status);
        });

        // Modal show
        document.getElementById('classifyModal').addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const requestId = button.getAttribute('data-request-id');
            const row = button.closest('tr');
            document.getElementById('requestIdDisplay').textContent =
                requestId + ' - ' + row.querySelector('td:nth-child(2)').textContent;
            document.getElementById('issueDescription').textContent =
                row.querySelector('td:nth-child(3)').textContent;
        });
    }

    // ================= API CALLS =================
    async function loadRequests() {
        try {
            const res = await fetch('/requests');
            if (!res.ok) throw new Error("Lỗi tải dữ liệu");
            repairRequests = await res.json();
            renderRequests();
        } catch (err) {
            console.error(err);
            alert("Không thể tải danh sách yêu cầu!");
        }
    }

    // ================= RENDER =================
    function renderRequests(filter = '') {
        const tbody = document.getElementById('repairTableBody');
        tbody.innerHTML = '';

        let filtered = repairRequests;
        if (filter) {
            filtered = repairRequests.filter(r => (r.status || 'pending') === filter);
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center">Không có yêu cầu nào</td></tr>`;
            return;
        }

        filtered.forEach(req => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${req.idrequest}</td>
                <td>${req.device_name || ('#' + req.iddevice)}</td>
                <td>${req.description}</td>
                <td>${req.requester_name || '-'}</td>
                <td>${formatDate(req.request_date)}</td>
                <td>${req.priority || '-'}</td>
                <td>${req.status || 'pending'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" 
                            data-bs-toggle="modal" 
                            data-bs-target="#classifyModal" 
                            data-request-id="${req.idrequest}">
                        Phân loại
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // ================= UTILS =================
    function formatDate(dateString) {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return d.toLocaleDateString('vi-VN') + " " + d.toLocaleTimeString('vi-VN');
    }
    
});
