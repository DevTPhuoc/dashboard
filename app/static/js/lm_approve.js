// File JavaScript bổ sung cho LM Approval

// Hàm kiểm tra quyền truy cập LM
// function checkLMAccess() {
//     const userRole = localStorage.getItem('userRole');
//     if (userRole !== 'LM') {
//         window.location.href = '/unauthorized';
//         return false;
//     }
//     return true;
// }

// Hàm lấy thông tin lab của user
async function getCurrentUserLab() {
    try {
        const response = await fetch('/api/current_user');
        if (response.ok) {
            const user = await response.json();
            return user.LabID;
        }
    } catch (error) {
        console.error('Error getting user lab:', error);
    }
    return null;
}

// Hàm định dạng trạng thái approval
function formatApprovalStatus(approval) {
    if (!approval) return { text: 'Chờ duyệt', class: 'bg-yellow-500 text-yellow-100' };
    
    switch (approval.Decision) {
        case 'Approved':
            return { text: 'Đã duyệt', class: 'bg-green-500 text-green-100' };
        case 'Rejected':
            return { text: 'Đã từ chối', class: 'bg-red-500 text-red-100' };
        default:
            return { text: 'Chờ duyệt', class: 'bg-yellow-500 text-yellow-100' };
    }
}

// Hàm kiểm tra điều kiện phê duyệt LM
function canLMApprove(request) {
    // Kiểm tra EM đã approved chưa
    const emApproval = request.approvals?.find(a => a.ApproverRole === 'EM' && a.Decision === 'Approved');
    if (!emApproval) return false;
    
    // Kiểm tra LM chưa quyết định
    const lmApproval = request.approvals?.find(a => a.ApproverRole === 'LM');
    if (lmApproval && lmApproval.Decision !== 'Pending') return false;
    
    // Kiểm tra request thuộc lab của LM
    const userLabId = localStorage.getItem('userLabId');
    if (userLabId && request.LabID != userLabId) return false;
    
    return true;
}

// Khởi tạo kiểm tra quyền khi trang load
document.addEventListener('DOMContentLoaded', function() {
    if (!checkLMAccess()) {
        return;
    }
    
    // Lưu thông tin lab vào localStorage
    getCurrentUserLab().then(labId => {
        if (labId) {
            localStorage.setItem('userLabId', labId);
        }
    });
});

// Export các hàm để sử dụng trong console (cho mục đích debug)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // checkLMAccess,
        getCurrentUserLab,
        formatApprovalStatus,
        canLMApprove
    };
}