function initTaWeekMiniChart(total, completed, pending) {
  if (window.taWeekMiniChart) {
    window.taWeekMiniChart.destroy();
  }

  const options = {
    series: [
      {
        name: "TA Status",
        data: [total, completed, pending],
      },
    ],
    chart: {
      type: "bar",
      height: 100,
      background: "transparent",
      toolbar: {
        show: false,
      },
    },
    colors: ["#3b82f6", "#10b981", "#f59e0b"],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 2,
        dataLabels: {
          position: "center",
        },
        distributed: true,
        barHeight: "80%",
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ["#ffffff"],
        fontSize: "12px",
        fontWeight: "bold",
      },
      formatter: function (val) {
        return val > 0 ? val : "";
      },
    },
    xaxis: {
      categories: ["Total", "Completed", "Pending"],
      labels: {
        show: false,
        style: {
          colors: "#9ca3af",
          fontSize: "11px",
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      min: 0,
      max: total,
    },
    yaxis: {
      labels: {
        style: {
          colors: "#9ca3af",
          fontSize: "11px",
        },
      },
    },
    grid: {
      show: true,
      borderColor: "#374151",
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: false,
        },
      },
    },
    legend: {
      show: false,
    },
    tooltip: {
      enabled: true,
      theme: "dark",
      style: {
        fontSize: "12px",
      },
    },
  };

  taWeekMiniChart = new ApexCharts(
    document.querySelector("#ta-week-mini-chart"),
    options
  );
  taWeekMiniChart.render();
}
