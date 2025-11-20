let chartInstance = null;

// ============================================
// 1. KHỞI TẠO GRADIENT
// ============================================
function createGradients(ctx) {
  // Gradient màu 1 (Xanh dương)
  const barGradient1 = ctx.createLinearGradient(0, 80, 0, 400);
  barGradient1.addColorStop(0, "#73ffe7");
  barGradient1.addColorStop(0.3, "#18ecec");
  barGradient1.addColorStop(0.7, "#11b5c7");
  barGradient1.addColorStop(1, "#025185");

  // Gradient màu 2 (Hồng/Tím)
  const barGradient2 = ctx.createLinearGradient(0, 80, 0, 400);
  barGradient2.addColorStop(0, "#ff6ec7");
  barGradient2.addColorStop(0.3, "#ff1493");
  barGradient2.addColorStop(0.7, "#c71585");
  barGradient2.addColorStop(1, "#8b0a50");

  return { barGradient1, barGradient2 };
}

// ============================================
// 2. VẼ BÓNG ĐỔ
// ============================================
function drawShadow(ctx, x, base, width) {
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.ellipse(x, base + 12, width * 0.5, 10, 0, 0, 2 * Math.PI);
  ctx.closePath();

  const shadowGrad = ctx.createRadialGradient(
    x,
    base + 12,
    2,
    x,
    base + 12,
    24
  );
  shadowGrad.addColorStop(0, "#6fe5ff");
  shadowGrad.addColorStop(0.6, "#123958");
  shadowGrad.addColorStop(1, "transparent");

  ctx.fillStyle = shadowGrad;
  ctx.fill();
  ctx.restore();
}

// ============================================
// 3. VẼ MẶT TRƯỚC CỘT
// ============================================
function drawFrontFace(ctx, x, y, base, width, gradient) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - width / 2, base);
  ctx.lineTo(x - width / 2, y);
  ctx.lineTo(x + width / 2, y);
  ctx.lineTo(x + width / 2, base);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
}

// ============================================
// 4. VẼ MẶT NGHIÊNG PHẢI
// ============================================
function drawRightFace(ctx, x, y, base, width) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + width / 2, base);
  ctx.lineTo(x + width / 2 + 10, base - 10);
  ctx.lineTo(x + width / 2 + 10, y - 10);
  ctx.lineTo(x + width / 2, y);
  ctx.closePath();

  const sideGrad = ctx.createLinearGradient(
    x + width / 2,
    base,
    x + width / 2 + 10,
    y - 10
  );
  sideGrad.addColorStop(0, "#12d2d2");
  sideGrad.addColorStop(1, "#013a51");

  ctx.fillStyle = sideGrad;
  ctx.globalAlpha = 0.6;
  ctx.fill();
  ctx.restore();
}

// ============================================
// 5. VẼ CỘT 3D HOÀN CHỈNH
// ============================================
function drawColumn3D(ctx, x, y, base, width, gradient) {
  drawShadow(ctx, x, base, width);
  drawFrontFace(ctx, x, y, base, width, gradient);
  drawRightFace(ctx, x, y, base, width);
}

// ============================================
// 6. VẼ ĐƯỜNG LINE
// ============================================
function drawLineConnector(ctx, lineData) {
  ctx.strokeStyle = "rgba(255,255,90,1)";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();

  lineData.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();
}

// ============================================
// 7. VẼ CHẤM VÀNG
// ============================================
function drawYellowDots(ctx, lineData) {
  lineData.forEach((point) => {
    ctx.save();

    // Vẽ chấm vàng
    ctx.fillStyle = "rgba(255,255,90,1)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 7, 0, 2 * Math.PI);
    ctx.fill();

    // Viền chấm
    ctx.strokeStyle = "#1936b0";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  });
}

// ============================================
// 8. TẠO PLUGIN VẼ CỘT 3D
// ============================================
function createColumn3DPlugin(barGradient1, barGradient2) {
  return {
    id: "column3d",
    beforeDatasetsDraw(chart) {
      const { ctx } = chart;

      // Vẽ dataset 0
      const meta0 = chart.getDatasetMeta(0);
      if (!meta0.hidden) {
        ctx.save();
        meta0.data.forEach((bar) => {
          const { x, y, base, width } = bar.getProps(
            ["x", "y", "base", "width"],
            true
          );
          drawColumn3D(ctx, x, y, base, width, barGradient1);
        });
        ctx.restore();
      }

      // Vẽ dataset 1
      const meta1 = chart.getDatasetMeta(1);
      if (!meta1.hidden) {
        ctx.save();
        meta1.data.forEach((bar) => {
          const { x, y, base, width } = bar.getProps(
            ["x", "y", "base", "width"],
            true
          );
          drawColumn3D(ctx, x, y, base, width, barGradient2);
        });
        ctx.restore();
      }
    },
  };
}

// ============================================
// 9. TẠO PLUGIN VẼ LINE + CHẤM
// ============================================
function createLineDotsPlugin() {
  return {
    id: "lineDotsTop",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(2);

      if (meta.hidden) return;

      ctx.save();
      const lineData = meta.data;

      if (lineData.length > 0) {
        drawLineConnector(ctx, lineData);
        drawYellowDots(ctx, lineData);
      }
      ctx.restore();
    },
  };
}

// ============================================
// 10. TẠO DỮ LIỆU CHART
// ============================================
function createChartData() {
  return {
    labels: [
      "Evaluation",
      "Approval",
      "Quotation",
      "Approve Quotation",
      "PR",
      "PO",
      "Fixed",
      "Done",
    ],
    datasets: [
      {
        type: "bar",
        label: "Normal",
        data: [1, 2, 1, 5, 10, 7, 6, 0.5],
        backgroundColor: "barGradient1",
        borderWidth: 0,
        barPercentage: 0.75,
        categoryPercentage: 0.75,
        borderRadius: 6,
        hidden: false,
      },
      {
        type: "bar",
        label: "Priority",
        data: [6, 10, 2, 7, 6, 7, 0.6, 5],
        backgroundColor: "barGradient2",
        borderWidth: 0,
        barPercentage: 0.75,
        categoryPercentage: 0.75,
        borderRadius: 6,
        hidden: false,
      },
      {
        type: "line",
        label: "KPI",
        data: [1, 0.5, 0.5, 3, 0.5, 0.5, 1, 1],
        borderColor: "rgba(255,255,90,0)",
        pointBackgroundColor: "rgba(255,255,90,1)",
        pointBorderColor: "#1936b0",
        pointBorderWidth: 2,
        backgroundColor: "rgba(255,255,90,0)",
        fill: false,
        tension: 0.25,
        pointRadius: 7,
        pointHoverRadius: 9,
        hidden: false,
        yAxisID: "y1",
      },
    ],
  };
}

// ============================================
// 11. TẠO CẤU HÌNH CHART
// ============================================
function createChartOptions() {
  return {
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0,
    },
    interaction: {
      mode: "nearest",
      intersect: true,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: "#003f65",
        padding: 14,
        bodyFont: { size: 14 },
        titleFont: { size: 16 },
        mode: "index",
        intersect: false,
        callbacks: {
          label: function (context) {
            return context.dataset.label + ": " + context.parsed.y;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "white",
          font: { size: 12, weight: "bold" },
          maxRotation: 0,
        },
        grid: { color: "rgba(200,255,255,0.07)" },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "white",
          font: { size: 12, weight: "bold" },
        },
        grid: { color: "rgba(200,255,255,0.10)" },
        position: "left",
      },
      y1: {
        beginAtZero: true,
        ticks: {
          color: "rgba(255,255,90,1)",
          font: { size: 12, weight: "bold" },
        },
        grid: { color: "rgba(255,255,90,0.05)" },
        position: "right",
      },
    },
  };
}

// ============================================
// 12. XỬ LÝ CLICK BUTTON
// ============================================
function handleLegendClick(datasetIndex) {
  if (!chartInstance) return;

  const meta = chartInstance.getDatasetMeta(datasetIndex);
  meta.hidden = !meta.hidden;
  chartInstance.update();

  // Update button style
  updateButtonStyles();
}

// ============================================
// 13. CẬP NHẬT STYLE BUTTON
// ============================================
function updateButtonStyles() {
  const buttons = document.querySelectorAll(".legend-btn");
  buttons.forEach((btn, index) => {
    const meta = chartInstance.getDatasetMeta(index);
    if (meta.hidden) {
      btn.style.opacity = "0.4";
    } else {
      btn.style.opacity = "1";
    }
  });
}

// ============================================
// 14. KHỞI TẠO CHART
// ============================================
function initChart() {
  const canvasElement = document.getElementById("loginTaChart");
  if (!canvasElement) return;

  const ctx = canvasElement.getContext("2d");
  const { barGradient1, barGradient2 } = createGradients(ctx);

  // Tạo dữ liệu
  const data = createChartData();
  data.datasets[0].backgroundColor = barGradient1;
  data.datasets[1].backgroundColor = barGradient2;

  // Tạo chart
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: data,
    options: createChartOptions(),
    plugins: [
      createColumn3DPlugin(barGradient1, barGradient2),
      createLineDotsPlugin(),
    ],
  });

  // Thêm event listener cho buttons
  const legendButtons = document.querySelectorAll(".legend-btn");
  legendButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const datasetIndex = parseInt(btn.getAttribute("data-dataset"));
      handleLegendClick(datasetIndex);
    });
  });

  // Update button styles
  updateButtonStyles();

  return chartInstance;
}

// ============================================
// 15. CHẠY KHI TRANG TẢI XONG
// ============================================
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initChart();
  });
} else {
  setTimeout(() => {
    initChart();
  }, 100);
}

// ============================================
// 1. DỮ LIỆU
// ============================================
let visibleIndices = [0, 1, 2, 3, 4];
const allValues = [29, 17, 27, 14, 13];
const allLabels = ["Item 01", "Item 02", "Item 03", "Item 04", "Item 05"];
const allColors = ["#00ff99", "#00ccff", "#66ffff", "#cc66ff", "#ffffff"];

const minRadius = 120;
const maxRadius = 280;
const centerX = 400;
const centerY = 400;

// ============================================
// 2. TÍNH TOÁN DỮ LIỆU MẢNH
// ============================================
function calculateSlices() {
  const visibleValues = visibleIndices.map((i) => allValues[i]);
  const total = visibleValues.reduce((a, b) => a + b, 0);

  return visibleIndices.map((i) => {
    const val = allValues[i];
    const percentage = val / total;
    const radius = minRadius + (maxRadius - minRadius) * percentage;

    return {
      label: allLabels[i],
      value: val,
      color: allColors[i],
      percentage,
      radius,
    };
  });
}

// ============================================
// 3. TÍNH TOẠ ĐỘ MẢNH
// ============================================
function calculateSliceCoordinates(slice, angleStart) {
  const theta = slice.percentage * 360;
  const angleEnd = angleStart + theta;
  const radiansStart = (angleStart * Math.PI) / 180;
  const radiansEnd = (angleEnd * Math.PI) / 180;

  const x1 = centerX + slice.radius * Math.cos(radiansStart);
  const y1 = centerY + slice.radius * Math.sin(radiansStart);
  const x2 = centerX + slice.radius * Math.cos(radiansEnd);
  const y2 = centerY + slice.radius * Math.sin(radiansEnd);
  const largeArc = theta > 180 ? 1 : 0;

  return { x1, y1, x2, y2, largeArc, angleEnd, theta };
}

// ============================================
// 4. TẠO PATH SVG CHO MẢNH
// ============================================
function createSlicePath(slice, coordinates) {
  const { x1, y1, x2, y2, largeArc } = coordinates;

  const d = [
    `M ${centerX} ${centerY}`,
    `L ${x1} ${y1}`,
    `A ${slice.radius} ${slice.radius} 0 ${largeArc} 1 ${x2} ${y2}`,
    `Z`,
  ].join(" ");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.setAttribute("fill", slice.color);
  path.setAttribute("stroke", "#0c1033");
  path.setAttribute("stroke-width", "6");
  path.setAttribute("opacity", "0.85");
  path.setAttribute("filter", "drop-shadow(0 8px 16px rgba(0, 0, 0, 0.6))");

  return path;
}

// ============================================
// 5. TẠO LABEL % CHO MẢNH
// ============================================
function createSliceLabel(slice, angleStart, angleEnd) {
  const midAngle = (angleStart + angleEnd) / 2;
  const radMid = (midAngle * Math.PI) / 180;
  const labelRadius = slice.radius + 50;
  const xText = centerX + labelRadius * Math.cos(radMid);
  const yText = centerY + labelRadius * Math.sin(radMid);

  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("x", xText);
  label.setAttribute("y", yText);
  label.setAttribute("fill", "#fff");
  label.setAttribute("font-size", "18px");
  label.setAttribute("font-weight", "bold");
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("alignment-baseline", "middle");
  label.setAttribute("filter", "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))");
  label.textContent = `${Math.round(slice.percentage * 100)}%`;

  return label;
}

// ============================================
// 6. KHỞI TẠO FILTER BÓ ĐỔ
// ============================================
function initializeShadowFilter(svg) {
  if (svg.querySelector("defs")) return;

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const filter = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "filter"
  );

  filter.setAttribute("id", "shadow");
  filter.setAttribute("x", "-50%");
  filter.setAttribute("y", "-50%");
  filter.setAttribute("width", "200%");
  filter.setAttribute("height", "200%");

  const feGaussianBlur = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "feGaussianBlur"
  );
  feGaussianBlur.setAttribute("in", "SourceGraphic");
  feGaussianBlur.setAttribute("stdDeviation", "3");

  filter.appendChild(feGaussianBlur);
  defs.appendChild(filter);
  svg.appendChild(defs);
}

// ============================================
// 7. VẼ TỪNG MẢNH
// ============================================
function drawSlice(svg, slice, angleStart) {
  const coordinates = calculateSliceCoordinates(slice, angleStart);

  const path = createSlicePath(slice, coordinates);
  svg.appendChild(path);

  const label = createSliceLabel(slice, angleStart, coordinates.angleEnd);
  svg.appendChild(label);

  return coordinates.angleEnd;
}

// ============================================
// 8. VẼ TOÀN BỘ PIE CHART
// ============================================
function drawPie() {
  const svg = document.getElementById("svgPie");
  if (!svg) return;

  svg.innerHTML = "";
  initializeShadowFilter(svg);

  const slices = calculateSlices();

  let angleStart = -90;
  slices.forEach((slice) => {
    angleStart = drawSlice(svg, slice, angleStart);
  });
}

// ============================================
// 9. XỬ LÝ BUTTON CLICK
// ============================================
function handleButtonClick(index) {
  const idx = visibleIndices.indexOf(index);
  if (idx > -1) {
    visibleIndices.splice(idx, 1);
  } else {
    visibleIndices.push(index);
    visibleIndices.sort((a, b) => a - b);
  }

  updateButtonStyles();

  if (visibleIndices.length > 0) {
    drawPie();
  }
}

// ============================================
// 10. CẬP NHẬT STYLE BUTTON
// ============================================
function updateButtonStyles() {
  const buttons = document.querySelectorAll(".bar-btn");
  buttons.forEach((btn) => {
    const index = parseInt(btn.getAttribute("data-index"));
    if (visibleIndices.includes(index)) {
      btn.classList.remove("opacity-40");
    } else {
      btn.classList.add("opacity-40");
    }
  });
}

// ============================================
// 11. KHỞI TẠO EVENTS
// ============================================
function initializeEvents() {
  const buttons = document.querySelectorAll(".bar-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.getAttribute("data-index"));
      handleButtonClick(index);
    });
  });

  window.addEventListener("resize", () => {
    drawPie();
  });

  document.addEventListener("DOMContentLoaded", () => {
    drawPie();
  });
}

// ============================================
// 12. CHẠY CHƯƠNG TRÌNH
// ============================================
initializeEvents();

setupFilter(
  "departmentFilter",
  "departmentChecklistContent",
  "/api/get_department"
);
setupFilter("teamFilter", "teamChecklistContent", "/api/get_team");
setupFilter("statusFilter", "statusChecklistContent", "/api/get_dic_status");

// Hàm Setup filter department
function setupFilter(idInput, idCheckList, urlApi) {
  fetch(urlApi)
    .then((res) => res.json())
    .then((data) => {
      const checkList = document.getElementById(idCheckList);
      checkList.innerHTML = "";
      data.forEach((item) => {
        checkList.innerHTML += `
          <label class="hover:bg-gray-600">
            <input type="checkbox" class="checkItem   " value="${item.id}" />
            ${item.name}
          </label>
        `;
      });

      // Gắn sự kiện cho tất cả checkbox sau khi render
      const input = document.getElementById(idInput);
      const checkboxes = checkList.querySelectorAll("input[type='checkbox']");
      if (userRoleId === "4") {
        // Nếu là departmentFilter thì disable, còn teamFilter thì không
        if (idInput === "departmentFilter") {
          input.disabled = true;
          checkboxes.forEach((cb) => {
            cb.disabled = true;
            // Check đúng lab của user
            if (cb.value == userLabId) {
              cb.checked = true;
              input.value = cb.parentElement.textContent.trim();
            }
          });
        } else {
          // Với teamFilter thì không disable
          input.disabled = false;
          checkboxes.forEach((cb) => {
            cb.disabled = false;
          });
        }
      }

      checkboxes.forEach((cb) => {
        cb.addEventListener("change", function () {
          const selected = Array.from(checkboxes)
            .filter((c) => c.checked)
            .map((c) => c.parentElement.textContent.trim());
          input.value = selected.join(", ");
          setTimeout(() => {
            input.focus();
          }, 100);
        });
      });
    });
}
// Hàm Setup filter department
function setupFilter(idInput, idCheckList, urlApi) {
  fetch(urlApi)
    .then((res) => res.json())
    .then((data) => {
      const checkList = document.getElementById(idCheckList);
      checkList.innerHTML = "";
      data.forEach((item) => {
        checkList.innerHTML += `
          <label class="hover:bg-gray-600">
            <input type="checkbox" class="checkItem   " value="${item.id}" />
            ${item.name}
          </label>
        `;
      });

      // Gắn sự kiện cho tất cả checkbox sau khi render
      const input = document.getElementById(idInput);
      const checkboxes = checkList.querySelectorAll("input[type='checkbox']");
      if (userRoleId === "4") {
        // Nếu là departmentFilter thì disable, còn teamFilter thì không
        if (idInput === "departmentFilter") {
          input.disabled = true;
          checkboxes.forEach((cb) => {
            cb.disabled = true;
            // Check đúng lab của user
            if (cb.value == userLabId) {
              cb.checked = true;
              input.value = cb.parentElement.textContent.trim();
            }
          });
        } else {
          // Với teamFilter thì không disable
          input.disabled = false;
          checkboxes.forEach((cb) => {
            cb.disabled = false;
          });
        }
      }

      checkboxes.forEach((cb) => {
        cb.addEventListener("change", function () {
          const selected = Array.from(checkboxes)
            .filter((c) => c.checked)
            .map((c) => c.parentElement.textContent.trim());
          input.value = selected.join(", ");
          setTimeout(() => {
            input.focus();
          }, 100);
        });
      });
    });
}
// Hàm Setup filter department
function setupFilter(idInput, idCheckList, urlApi) {
  fetch(urlApi)
    .then((res) => res.json())
    .then((data) => {
      const checkList = document.getElementById(idCheckList);
      checkList.innerHTML = "";
      data.forEach((item) => {
        checkList.innerHTML += `
          <label class="hover:bg-gray-600">
            <input type="checkbox" class="checkItem   " value="${item.id}" />
            ${item.name}
          </label>
        `;
      });

      // Gắn sự kiện cho tất cả checkbox sau khi render
      const input = document.getElementById(idInput);
      const checkboxes = checkList.querySelectorAll("input[type='checkbox']");
      if (userRoleId === "4") {
        // Nếu là departmentFilter thì disable, còn teamFilter thì không
        if (idInput === "departmentFilter") {
          input.disabled = true;
          checkboxes.forEach((cb) => {
            cb.disabled = true;
            // Check đúng lab của user
            if (cb.value == userLabId) {
              cb.checked = true;
              input.value = cb.parentElement.textContent.trim();
            }
          });
        } else {
          // Với teamFilter thì không disable
          input.disabled = false;
          checkboxes.forEach((cb) => {
            cb.disabled = false;
          });
        }
      }

      checkboxes.forEach((cb) => {
        cb.addEventListener("change", function () {
          const selected = Array.from(checkboxes)
            .filter((c) => c.checked)
            .map((c) => c.parentElement.textContent.trim());
          input.value = selected.join(", ");
          setTimeout(() => {
            input.focus();
          }, 100);
        });
      });
    });
}

// Hàm mở checklist FIlter
function toggleFilterChecklist(id) {
  const checklist = document.getElementById(id);
  if (checklist.classList.contains("hidden")) {
    checklist.classList.remove("hidden");
  }
}

// bảm bỏ checklist filter khi click ngoài khi onblur input
function closeChecklistOnBlur(id) {
  setTimeout(function () {
    const checklist = document.getElementById(id);
    // Kiểm tra phần tử đang được focus
    if (!checklist.contains(document.activeElement)) {
      checklist.classList.add("hidden");
    }
  }, 100);
}

// hàm lấy giá trị filter
function getFilterValues() {
   const idReFilter = document.getElementById("idReFilter").value;
  const deviceFilter = document.getElementById("deviceFilter").value;
  const requestedByFilter = document.getElementById("requestedByFilter").value;
  const fromDateFilter = document.getElementById("fromDateFilter").value;
  const toDateFilter = document.getElementById("toDateFilter").value;

  // Department
  const departmentChecklistContent = document.getElementById(
    "departmentChecklistContent"
  );
  const departmentCheckboxes = departmentChecklistContent.querySelectorAll(
    "input[type='checkbox']"
  );
  let departmentCheckedValues = Array.from(departmentCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  // Team
  const teamChecklistContent = document.getElementById("teamChecklistContent");
  const teamCheckboxes = teamChecklistContent.querySelectorAll(
    "input[type='checkbox']"
  );
  let teamCheckedValues = Array.from(teamCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  // Status
  const statusChecklistContent = document.getElementById(
    "statusChecklistContent"
  );
  const statusCheckboxes = statusChecklistContent.querySelectorAll(
    "input[type='checkbox']"
  );
  const statusCheckedValues = Array.from(statusCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.parentElement.textContent.trim());

  // Điều chỉnh theo role
  if (userRoleId === "4") {
    // department bị disable => luôn fix theo userLabId
    departmentCheckedValues = [userLabId];
    // team vẫn lấy từ checkbox bình thường
  } else if (userRoleId === "2") {
    // role 2 => fix cả lab và team theo user
    departmentCheckedValues = [userLabId];
    teamCheckedValues = [userTeamId];
  }

  return {
    id: [idReFilter],
    DeviceName: [deviceFilter],
    RequestedBy: [requestedByFilter],
    LabId: departmentCheckedValues,
    TeamId: teamCheckedValues,
    status: statusCheckedValues,
    FromDate: [fromDateFilter],
    ToDate: [toDateFilter],
  };
}
// hàm reset filter ui
function resetFilterUI() {
  // reset các input text
  document.getElementById("idReFilter").value = "";
  document.getElementById("deviceFilter").value = "";
  document.getElementById("requestedByFilter").value = "";
  document.getElementById("fromDateFilter").value = "";
  document.getElementById("toDateFilter").value = "";

  // Department
  const deptInput = document.getElementById("departmentFilter");
  const departmentChecklistContent = document.getElementById(
    "departmentChecklistContent"
  );
  const departmentCheckboxes = departmentChecklistContent.querySelectorAll(
    "input[type='checkbox']"
  );
  departmentCheckboxes.forEach((cb) => (cb.checked = false));
  deptInput.value = "";

  // Team
  const teamInput = document.getElementById("teamFilter");
  const teamChecklistContent = document.getElementById("teamChecklistContent");
  const teamCheckboxes = teamChecklistContent.querySelectorAll(
    "input[type='checkbox']"
  );
  teamCheckboxes.forEach((cb) => (cb.checked = false));
  teamInput.value = "";

  // Status
  document.getElementById("statusFilter").value = "";
  const statusChecklistContent = document.getElementById(
    "statusChecklistContent"
  );
  const statusCheckboxes = statusChecklistContent.querySelectorAll(
    "input[type='checkbox']"
  );
  statusCheckboxes.forEach((cb) => (cb.checked = false));

  // --- Điều chỉnh theo role ---
  if (userRoleId === "4") {
    // department bị disable => luôn fix theo userLabId
    deptInput.disabled = true;
    departmentCheckboxes.forEach((cb) => {
      cb.disabled = true;
      if (cb.value == userLabId) {
        cb.checked = true;
        deptInput.value = cb.parentElement.textContent.trim();
      }
    });
    // team vẫn enable, không ép cứng
    teamInput.disabled = false;
    teamCheckboxes.forEach((cb) => (cb.disabled = false));
  } else if (userRoleId === "2") {
    // role 2 => fix cả lab và team theo user
    deptInput.disabled = true;
    teamInput.disabled = true;
    departmentCheckboxes.forEach((cb) => {
      cb.disabled = true;
      if (cb.value == userLabId) {
        cb.checked = true;
        deptInput.value = cb.parentElement.textContent.trim();
      }
    });
    teamCheckboxes.forEach((cb) => {
      cb.disabled = true;
      if (cb.value == userTeamId) {
        cb.checked = true;
        teamInput.value = cb.parentElement.textContent.trim();
      }
    });
  } else {
    // các role khác => enable bình thường
    deptInput.disabled = false;
    teamInput.disabled = false;
    departmentCheckboxes.forEach((cb) => (cb.disabled = false));
    teamCheckboxes.forEach((cb) => (cb.disabled = false));
  }
}
//xu ly fillter
document.getElementById("applyFilter").addEventListener("click", function () {
  loadTotalCost();
});
document.getElementById("clearFilter").addEventListener("click", function () {
  resetFilterUI();
  loadTotalCost();

});

//xu ly api get
async function loadTotalCost() {
  const filters = getFilterValues(); // lấy filter từ UI nếu có

  const response = await fetch("/historyrepair/device_history", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(filters),
  });

  if (!response.ok) {
    console.error("API lỗi:", response.status);
    return;
  }

  const data = await response.json();
  console.log("Kết quả API:", data);

  // cập nhật trực tiếp
  const totalCostElement = document.getElementById("totalCostDisplay");
  const totalPendingElement = document.getElementById("totalPending");
  const totalRequestElement = document.getElementById("totalRequest")

  if (totalCostElement) {
    // tìm object nào có key "TotalCost"
    const totalObj = data.find((item) => item.TotalCost !== undefined);
    if (totalObj) {
      totalCostElement.textContent = totalObj.TotalCost.toLocaleString();
    }
  }
   if (totalPendingElement) {
    // tìm object nào có key "TotalCost"
    const totalObj = data.find((item) => item.total_pendings !== undefined);
    if (totalObj) {
      totalPendingElement.textContent = totalObj.total_pendings.toLocaleString();
    }
  }
   if (totalRequestElement) {
    // tìm object nào có key "TotalCost"
    const totalObj = data.find((item) => item.total_requests !== undefined);
    if (totalObj) {
      totalRequestElement.textContent = totalObj.total_requests.toLocaleString();
    }
  }
}

// gọi khi trang load
document.addEventListener("DOMContentLoaded", () => {
  loadTotalCost();
});