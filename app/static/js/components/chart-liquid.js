// Biểu đồ Tỉ lệ % hoàn thành - ECharts Liquid Fill

function initLiquidFillChart(id, rate) {
  const chartDom = document.getElementById(id);
  if (chartDom) {
    if (echarts.getInstanceByDom(chartDom)) {
      echarts.dispose(chartDom);
    }

    const taLiquidChart = echarts.init(chartDom, null, {
      renderer: "canvas",
    });
    const taLiquidOption = {
      series: [
        {
          type: "liquidFill",
          data: [rate],
          waveAnimation: true,
          animationDuration: 2000,
          animationDurationUpdate: 1000,
          color: [
            {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(31,218,199,1)" },
                { offset: 0.7, color: "rgba(56,189,248,0.95)" },
                { offset: 1, color: "rgba(56,189,248,0.85)" },
              ],
            },
            "rgba(31,218,199,0.95)",
            "rgba(56,189,248,0.9)",
          ],
          shape: "circle",
          backgroundStyle: {
            color: "rgba(15,23,42,0.92)",
          },
          outline: {
            show: true,
            borderDistance: 2,
            itemStyle: {
              borderColor: "#4fd1c5",
              borderWidth: 4,
              shadowBlur: 22,
              shadowColor: "#77d9ff",
            },
          },
          label: {
            show: true,
            position: "inside",
            formatter: function (param) {
              return Math.round(param.value * 100) + "%";
            },
            fontSize: 22,
            verticalAlign: "middle",
            fontWeight: "bold",
            color: "#fff",
            fontFamily: "Inter, Arial, sans-serif",
            shadowColor: "#4fd1c5",
            shadowBlur: 12,
          },
        },
      ],
    };
    taLiquidChart.setOption(taLiquidOption);
  }
}
