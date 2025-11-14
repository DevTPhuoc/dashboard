function initLoginTaChart(
  id,
  labelHours,
  labelLogin,
  dataLogin,
  labelTa,
  dataTa
) {
  if (window.hourlyChartInstance) {
    window.hourlyChartInstance.destroy();
  }

  let hourlyCtx = document.getElementById(id).getContext("2d");
  window.hourlyChartInstance = new Chart(hourlyCtx, {
    type: "line",
    data: {
      labels: labelHours,
      datasets: [
        {
          label: labelLogin,
          data: dataLogin,
          borderColor: "#22d3ee",
          backgroundColor: "rgba(34, 211, 238, 0.15)",
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: "#22d3ee",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          borderWidth: 4,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: "#22d3ee",
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 3,
        },
        {
          label: labelTa,
          data: dataTa,
          borderColor: "#7c3aed",
          backgroundColor: "rgba(124, 58, 237, 0.15)",
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: "#7c3aed",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          borderWidth: 4,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: "#7c3aed",
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 3,
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
            pointStyle: "circle",
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
      elements: {
        point: {
          hoverRadius: 8,
        },
      },
    },
  });

  // Auto tooltip animation mỗi xxx giây cho từng mốc
  let currentIndex = 0;
  setInterval(() => {
    if (!hourlyChartInstance) return;
    const totalPoints = hourlyChartInstance.data.labels.length;
    hourlyChartInstance.setActiveElements([
      { datasetIndex: 0, index: currentIndex },
      { datasetIndex: 1, index: currentIndex },
    ]);
    hourlyChartInstance.tooltip.setActiveElements(
      [
        { datasetIndex: 0, index: currentIndex },
        { datasetIndex: 1, index: currentIndex },
      ],
      { x: 0, y: 0 }
    );
    hourlyChartInstance.update("active");
    currentIndex = (currentIndex + 1) % totalPoints;
  }, 7000);
}
