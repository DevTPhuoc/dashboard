/**
 * Pagination Utility Class - Có thể tái sử dụng cho nhiều loại dữ liệu
 * @class Pagination
 * @param {Object} options - Các tùy chọn cấu hình
 * @param {string} options.container - Selector của container phân trang
 * @param {number} options.perPage - Số items mỗi trang (mặc định: 10)
 * @param {number} options.visiblePages - Số trang hiển thị (mặc định: 5)
 * @param {Function} options.onPageChange - Callback khi thay đổi trang
 * @param {Function} options.renderFunction - Hàm render dữ liệu
 * @param {boolean} options.showInfo - Hiển thị thông tin phân trang (mặc định: true)
 * @param {boolean} options.showPerPage - Hiển thị chọn số items/trang (mặc định: true)
 * @param {string} options.sortField - Trường sắp xếp mặc định
 * @param {string} options.sortOrder - Thứ tự sắp xếp ('asc' hoặc 'desc')
 */
class Pagination {
  constructor(options = {}) {
    this.options = {
      container: options.container || "#pagination",
      perPage: options.perPage || 10,
      visiblePages: options.visiblePages || 5,
      onPageChange: options.onPageChange || null,
      renderFunction: options.renderFunction || null,
      showInfo: options.showInfo !== false,
      showPerPage: options.showPerPage !== false,
      sortField: options.sortField || "id",
      sortOrder: options.sortOrder || "desc",
      ...options,
    };

    this.currentPage = 1;
    this.totalPages = 1;
    this.totalItems = 0;
    this.data = [];
    this.filteredData = [];
    this.displayData = [];
    this.isLoading = false;

    this.init();
  }

  /**
   * Khởi tạo phân trang
   */
  init() {
    this.createPaginationContainer();
    this.renderPagination();
  }

  /**
   * Tạo container phân trang nếu chưa tồn tại
   */
  createPaginationContainer() {
    let container = document.querySelector(this.options.container);
    if (!container) {
      container = document.createElement("div");
      container.id = this.options.container.replace("#", "");
      document.body.appendChild(container);
    }
  }

  /**
   * Cập nhật dữ liệu và phân trang
   * @param {Array} data - Mảng dữ liệu
   * @param {boolean} sortByNewest - Tự động sắp xếp mới nhất lên đầu
   */
  update(data, sortByNewest = true) {
    this.data = sortByNewest ? this.sortData(data) : data;
    this.filteredData = [...this.data];
    this.totalItems = this.filteredData.length;
    this.totalPages = Math.ceil(this.totalItems / this.options.perPage);
    this.currentPage = 1;

    this.renderPagination();
    this.renderCurrentPage();
  }

  /**
   * Sắp xếp dữ liệu
   * @param {Array} data - Dữ liệu cần sắp xếp
   * @returns {Array} Dữ liệu đã sắp xếp
   */
  sortData(data) {
    return data.sort((a, b) => {
      let aValue = this.getNestedValue(a, this.options.sortField);
      let bValue = this.getNestedValue(b, this.options.sortField);

      // Xử lý các kiểu dữ liệu khác nhau
      if (aValue instanceof Date && bValue instanceof Date) {
        return this.options.sortOrder === "desc"
          ? bValue.getTime() - aValue.getTime()
          : aValue.getTime() - bValue.getTime();
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return this.options.sortOrder === "desc"
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return this.options.sortOrder === "desc"
          ? bValue - aValue
          : aValue - bValue;
      }

      // Ưu tiên items có id lớn hơn (mới hơn)
      if (a.id && b.id) {
        return this.options.sortOrder === "desc" ? b.id - a.id : a.id - b.id;
      }

      return 0;
    });
  }

  /**
   * Lọc dữ liệu theo hàm callback
   * @param {Function} filterFn - Hàm lọc dữ liệu
   */
  filterData(filterFn) {
    this.filteredData = this.data.filter(filterFn);
    this.totalItems = this.filteredData.length;
    this.totalPages = Math.ceil(this.totalItems / this.options.perPage);
    this.currentPage = 1;
    this.renderPagination();
    this.renderCurrentPage();
  }

  /**
   * Tìm kiếm dữ liệu
   * @param {string} searchTerm - Từ khóa tìm kiếm
   * @param {Array} searchFields - Các trường tìm kiếm
   */
  searchData(searchTerm, searchFields = []) {
    if (!searchTerm) {
      this.filteredData = [...this.data];
    } else {
      this.filteredData = this.data.filter((item) =>
        searchFields.some((field) => {
          const value = this.getNestedValue(item, field);
          return (
            value &&
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
          );
        })
      );
    }

    this.totalItems = this.filteredData.length;
    this.totalPages = Math.ceil(this.totalItems / this.options.perPage);
    this.currentPage = 1;
    this.renderPagination();
    this.renderCurrentPage();
  }

  /**
   * Lấy giá trị nested từ object
   * @param {Object} obj - Object cần lấy giá trị
   * @param {string} path - Đường dẫn đến giá trị
   * @returns {*} Giá trị tìm thấy
   */
  getNestedValue(obj, path) {
    return path.split(".").reduce((acc, part) => {
      if (acc === null || acc === undefined) return undefined;
      return acc[part];
    }, obj);
  }

  /**
   * Render giao diện phân trang
   */
  renderPagination() {
    const container = document.querySelector(this.options.container);
    if (!container) return;

    if (this.totalItems === 0) {
      container.innerHTML =
        '<div class="text-gray-400 text-center py-4">Không có dữ liệu</div>';
      return;
    }

    const pages = this.getVisiblePages();
    const startItem = this.getStartIndex() + 1;
    const endItem = this.getEndIndex();

    container.innerHTML = `
            <div class="flex flex-wrap items-center justify-center gap-4">
                ${
                  this.options.showInfo
                    ? `
                    <div class="pagination-info">
                        Total <strong>${startItem}-${endItem} </strong> of 
                        <strong>${this.totalItems}</strong> items
                    </div>
                `
                    : ""
                }
                
                <div class="pagination-buttons flex items-center space-x-2">
                    <!-- Nút đầu trang -->
                    <button class="pagination-btn pagination-first" 
                            title="Trang đầu" ${
                              this.currentPage === 1 ? "disabled" : ""
                            }>
                        <i class="fas fa-angle-double-left"></i>
                    </button>

                    <!-- Nút previous -->
                    <button class="pagination-btn pagination-prev" 
                            title="Trang trước" ${
                              this.currentPage === 1 ? "disabled" : ""
                            }>
                        <i class="fas fa-angle-left"></i>
                    </button>

                    <!-- Các trang -->
                    ${pages
                      .map(
                        (page) => `
                        <button class="pagination-btn pagination-page ${
                          page === this.currentPage ? "active" : ""
                        }" 
                                data-page="${page}" title="page ${page}">
                            ${page}
                        </button>
                    `
                      )
                      .join("")}

                    <!-- Nút next -->
                    <button class="pagination-btn pagination-next" 
                            title="Trang sau" ${
                              this.currentPage === this.totalPages
                                ? "disabled"
                                : ""
                            }>
                        <i class="fas fa-angle-right"></i>
                    </button>

                    <!-- Nút cuối trang -->
                    <button class="pagination-btn pagination-last" 
                            title="Trang cuối" ${
                              this.currentPage === this.totalPages
                                ? "disabled"
                                : ""
                            }>
                        <i class="fas fa-angle-double-right"></i>
                    </button>
                </div>

                ${
                  this.options.showPerPage
                    ? `
                    <div class="pagination-controls flex items-center space-x-2">
                        <select class="pagination-perpage text-white">
                            <option class="text-white" value="5" ${
                              this.options.perPage === 5 ? "selected" : ""
                            }>5 / trang</option>
                            <option class="text-white" value="10" ${
                              this.options.perPage === 10 ? "selected" : ""
                            }>10 / trang</option>
                            <option class="text-white" value="20" ${
                              this.options.perPage === 20 ? "selected" : ""
                            }>20 / trang</option>
                            <option class="text-white" value="50" ${
                              this.options.perPage === 50 ? "selected" : ""
                            }>50 / trang</option>
                        </select>
                    </div>
                `
                    : ""
                }
            </div>
        `;

    this.attachPaginationEvents();
  }

  /**
   * Lấy danh sách trang hiển thị
   * @returns {Array} Mảng các trang hiển thị
   */
  getVisiblePages() {
    if (this.totalPages <= 1) return [1];

    const half = Math.floor(this.options.visiblePages / 2);
    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(this.totalPages, start + this.options.visiblePages - 1);

    // Điều chỉnh nếu không đủ số trang hiển thị
    if (end - start + 1 < this.options.visiblePages) {
      start = Math.max(1, end - this.options.visiblePages + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  /**
   * Gắn sự kiện cho các nút phân trang
   */
  attachPaginationEvents() {
    // Các nút phân trang
    document.querySelectorAll(".pagination-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();

        if (btn.disabled) return;

        let targetPage = this.currentPage;

        if (btn.classList.contains("pagination-first")) {
          targetPage = 1;
        } else if (btn.classList.contains("pagination-prev")) {
          targetPage = this.currentPage - 1;
        } else if (btn.classList.contains("pagination-next")) {
          targetPage = this.currentPage + 1;
        } else if (btn.classList.contains("pagination-last")) {
          targetPage = this.totalPages;
        } else if (btn.classList.contains("pagination-page")) {
          targetPage = parseInt(btn.getAttribute("data-page"));
        }

        this.goToPage(targetPage);
      });
    });

    // Thay đổi số items mỗi trang
    const perPageSelect = document.querySelector(".pagination-perpage");
    if (perPageSelect) {
      perPageSelect.addEventListener("change", (e) => {
        this.setPerPage(parseInt(e.target.value));
      });
    }
  }

  /**
   * Chuyển đến trang cụ thể
   * @param {number} page - Số trang
   */
  goToPage(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;

    this.currentPage = page;
    this.renderPagination();
    this.renderCurrentPage();

    // Gọi callback nếu có
    if (this.options.onPageChange) {
      this.options.onPageChange(
        this.getCurrentPageData(),
        this.currentPage,
        this.totalPages
      );
    }
  }

  /**
   * Đặt số items mỗi trang
   * @param {number} perPage - Số items mỗi trang
   */
  setPerPage(perPage) {
    this.options.perPage = perPage;
    this.totalPages = Math.ceil(this.totalItems / this.options.perPage);

    // Đảm bảo trang hiện tại không vượt quá tổng số trang
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }

    this.renderPagination();
    this.renderCurrentPage();
  }

  /**
   * Render dữ liệu trang hiện tại
   */
  renderCurrentPage() {
    this.displayData = this.getCurrentPageData();

    // Gọi render function từ options
    if (this.options.renderFunction) {
      this.options.renderFunction(this.displayData, this.getPaginationInfo());
    }
  }

  /**
   * Lấy dữ liệu trang hiện tại
   * @returns {Array} Dữ liệu trang hiện tại
   */
  getCurrentPageData() {
    const startIndex = this.getStartIndex();
    const endIndex = this.getEndIndex();
    return this.filteredData.slice(startIndex, endIndex);
  }

  /**
   * Lấy chỉ số bắt đầu
   * @returns {number} Chỉ số bắt đầu
   */
  getStartIndex() {
    return (this.currentPage - 1) * this.options.perPage;
  }

  /**
   * Lấy chỉ số kết thúc
   * @returns {number} Chỉ số kết thúc
   */
  getEndIndex() {
    return Math.min(this.currentPage * this.options.perPage, this.totalItems);
  }

  /**
   * Thêm item mới (sẽ xuất hiện đầu tiên)
   * @param {Object} item - Item mới
   */
  addItem(item) {
    this.data.unshift(item); // Thêm vào đầu mảng
    this.filteredData.unshift(item);
    this.totalItems = this.filteredData.length;
    this.totalPages = Math.ceil(this.totalItems / this.options.perPage);

    // Luôn chuyển về trang đầu tiên để thấy item mới
    this.currentPage = 1;

    this.renderPagination();
    this.renderCurrentPage();
  }

  /**
   * Cập nhật item
   * @param {*} itemId - ID của item
   * @param {Object} updatedItem - Dữ liệu cập nhật
   */
  updateItem(itemId, updatedItem) {
    const index = this.data.findIndex(
      (item) => this.getItemId(item) === itemId
    );
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...updatedItem };

      const filteredIndex = this.filteredData.findIndex(
        (item) => this.getItemId(item) === itemId
      );
      if (filteredIndex !== -1) {
        this.filteredData[filteredIndex] = {
          ...this.filteredData[filteredIndex],
          ...updatedItem,
        };
      }

      this.renderCurrentPage();
    }
  }

  /**
   * Xóa item
   * @param {*} itemId - ID của item
   */
  removeItem(itemId) {
    this.data = this.data.filter((item) => this.getItemId(item) !== itemId);
    this.filteredData = this.filteredData.filter(
      (item) => this.getItemId(item) !== itemId
    );
    this.totalItems = this.filteredData.length;
    this.totalPages = Math.ceil(this.totalItems / this.options.perPage);

    // Điều chỉnh trang hiện tại nếu cần
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }

    this.renderPagination();
    this.renderCurrentPage();
  }

  /**
   * Lấy ID của item (hỗ trợ nhiều trường ID khác nhau)
   * @param {Object} item - Item
   * @returns {*} ID của item
   */
  getItemId(item) {
    return item.id || item._id || item.ID || item.Id;
  }

  /**
   * Lấy thông tin phân trang hiện tại
   * @returns {Object} Thông tin phân trang
   */
  getPaginationInfo() {
    return {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      totalItems: this.totalItems,
      startIndex: this.getStartIndex(),
      endIndex: this.getEndIndex(),
      perPage: this.options.perPage,
      hasNext: this.currentPage < this.totalPages,
      hasPrev: this.currentPage > 1,
    };
  }

  /**
   * Hiển thị trạng thái loading
   * @param {boolean} loading - Trạng thái loading
   */
  setLoading(loading) {
    this.isLoading = loading;
    const container = document.querySelector(this.options.container);
    if (container) {
      if (loading) {
        container.innerHTML = '<div class="pagination-loading mx-auto"></div>';
      } else {
        this.renderPagination();
      }
    }
  }

  /**
   * Reset phân trang
   */
  reset() {
    this.currentPage = 1;
    this.data = [];
    this.filteredData = [];
    this.displayData = [];
    this.totalItems = 0;
    this.totalPages = 1;
    this.renderPagination();
  }

  /**
   * Refresh phân trang (giữ nguyên dữ liệu)
   */
  refresh() {
    this.renderPagination();
    this.renderCurrentPage();
  }
}

// Export để sử dụng trong các module khác
if (typeof module !== "undefined" && module.exports) {
  module.exports = Pagination;
} else {
  window.Pagination = Pagination;
}
