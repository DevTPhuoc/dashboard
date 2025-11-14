function initTypistCheckerLogoutChart(
  id,
  labelTypistCheckerLogoutHours,
  labelLogout,
  dataLogout,
  labelTypist,
  dataTypist,
  labelChecker,
  dataChecker
) {
  if (window.staffChartInstance) {
    window.staffChartInstance.destroy();
  }

  const staffCtx = document.getElementById(id).getContext("2d");
  window.staffChartInstance = new Chart(staffCtx, {
    type: "bar",
    data: {
      labels: labelTypistCheckerLogoutHours,
      datasets: [
        {
          label: labelLogout,
          type: "line",
          data: dataLogout,
          backgroundColor: "rgba(139, 92, 246, 0.2)",
          borderColor: "#8b5cf6",
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: "#fbbf24",
          pointBorderColor: "#1f2937",
          pointBorderWidth: 3,
          tension: 0.3,
          fill: true,
        },
        {
          label: labelTypist,
          data: dataTypist,
          backgroundColor: "rgba(31, 218, 199, 0.8)",
          borderColor: "rgb(31, 218, 199)",

          borderWidth: 2,
          borderRadius: 1,
        },
        {
          label: labelChecker,
          data: dataChecker,
          backgroundColor: "rgba(255, 71, 133, 0.8)",
          borderColor: "rgb(255, 71, 133)",
          borderWidth: 2,
          borderRadius: 1,
        },
      ],
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
          position: "top",
          labels: {
            color: "#e5e7eb",
            font: { size: 8, weight: "bold" },
            usePointStyle: true,
            padding: 15,
          },
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          titleColor: "#e5e7eb",
          bodyColor: "#e5e7eb",
          borderColor: "#22d3ee",
          borderWidth: 2,
          cornerRadius: 12,
          displayColors: true,
          titleFont: { size: 13, weight: "bold" },
          bodyFont: { size: 12 },
          padding: 10,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(255, 255, 255, 0.08)",
            drawBorder: false,
          },
          ticks: {
            color: "#94a3b8",
            font: { size: 11, weight: "bold" },
            padding: 6,
          },
          border: { display: false },
        },
        x: {
          grid: {
            color: "rgba(255, 255, 255, 0.08)",
            drawBorder: false,
          },
          ticks: {
            color: "#94a3b8",
            font: { size: 11, weight: "bold" },
            padding: 6,
          },
          border: { display: false },
        },
      },
      interaction: {
        intersect: false,
        mode: "index",
      },
    },
  });

  // Auto tooltip animation mỗi xx giây cho từng mốc
  let staffCurrentIndex = 0;
  setInterval(() => {
    if (!staffChartInstance) return;
    const totalPoints = staffChartInstance.data.labels.length;
    staffChartInstance.setActiveElements([
      { datasetIndex: 0, index: staffCurrentIndex },
      { datasetIndex: 1, index: staffCurrentIndex },
      { datasetIndex: 2, index: staffCurrentIndex },
    ]);
    staffChartInstance.tooltip.setActiveElements(
      [
        { datasetIndex: 0, index: staffCurrentIndex },
        { datasetIndex: 1, index: staffCurrentIndex },
        { datasetIndex: 2, index: staffCurrentIndex },
      ],
      { x: 0, y: 0 }
    );
    staffChartInstance.update("active");
    staffCurrentIndex = (staffCurrentIndex + 1) % totalPoints;
  }, 7000);
}
