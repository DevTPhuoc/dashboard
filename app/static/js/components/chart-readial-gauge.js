function initRadialGauge(id = "gauge-chart", percentage = 10) {
  if (window.gaugeChart) {
    window.gaugeChart.destroy();
  }

  createOverlayNeedle();
  const options = {
    series: [percentage],
    chart: {
      height: 200,
      type: "radialBar",
      offsetY: -10,
      background: "transparent",
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          margin: 0,
          size: "70%",
          background: "transparent",
        },
        track: {
          background: "#232a4d",
          strokeWidth: "67%",
          margin: 0,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            offsetY: 60,
            fontSize: "20px",
            color: "#fff",
            fontWeight: "600",
            formatter: function (val) {
              return val + "%";
            },
          },
        },
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "horizontal",
        shadeIntensity: 0.5,
        gradientToColors: ["#f472b6", "#06b6d4"],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    stroke: {
      lineCap: "round",
    },
    colors: ["#a855f7"],
  };

  gaugeChart = new ApexCharts(document.querySelector(`#${id}`), options);
  gaugeChart.render().then(() => {
    rotateOverlayNeedle(percentage);
  });
}

function createOverlayNeedle() {
  // if already exists, skip
  if (document.getElementById("gauge-needle-overlay")) return;

  const chartDiv = document.querySelector("#gauge-chart");
  if (!chartDiv) return;
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("id", "gauge-needle-overlay");
  svg.setAttribute("width", chartDiv.offsetWidth);
  svg.setAttribute("height", chartDiv.offsetHeight);
  svg.setAttribute("viewBox", "0 0 200 200");
  svg.style.position = "absolute";
  svg.style.left = "50%";
  svg.style.top = "50%";
  svg.style.transform = "translate(-50%, -50%)";
  svg.style.pointerEvents = "none";
  svg.style.zIndex = 10;
  chartDiv.style.position = "relative";
  chartDiv.appendChild(svg);

  // defs
  const defs = document.createElementNS(svgNS, "defs");
  const grad = document.createElementNS(svgNS, "linearGradient");
  grad.setAttribute("id", "needleTipGrad");
  grad.setAttribute("x1", "0%");
  grad.setAttribute("y1", "0%");
  grad.setAttribute("x2", "100%");
  grad.setAttribute("y2", "100%");

  const stop1 = document.createElementNS(svgNS, "stop");
  stop1.setAttribute("offset", "0%");
  stop1.setAttribute("stop-color", "#f472b6");

  const stop2 = document.createElementNS(svgNS, "stop");
  stop2.setAttribute("offset", "100%");
  stop2.setAttribute("stop-color", "#06b6d4");

  grad.appendChild(stop1);
  grad.appendChild(stop2);
  defs.appendChild(grad);
  svg.appendChild(defs);

  // group
  const g = document.createElementNS(svgNS, "g");
  g.setAttribute("id", "gauge-needle-group");
  g.setAttribute("transform", "translate(100 90) rotate(-135)");

  const rect = document.createElementNS(svgNS, "rect");
  rect.setAttribute("x", "-1.5");
  rect.setAttribute("y", "-50");
  rect.setAttribute("width", "3");
  rect.setAttribute("height", "50");
  rect.setAttribute("rx", "1.5");
  rect.setAttribute("fill", "#ffffff");
  rect.setAttribute("opacity", "0.98");
  g.appendChild(rect);

  const poly = document.createElementNS(svgNS, "polygon");
  poly.setAttribute("points", "0,-62 -6,-48 6,-48");
  poly.setAttribute("fill", "url(#needleTipGrad)");
  poly.setAttribute("stroke", "#ffffff");
  g.appendChild(poly);

  const circ = document.createElementNS(svgNS, "circle");
  circ.setAttribute("cx", "0");
  circ.setAttribute("cy", "0");
  circ.setAttribute("r", "7");
  circ.setAttribute("fill", "#0b1220");
  circ.setAttribute("stroke", "url(#needleTipGrad)");
  circ.setAttribute("stroke-width", "1.8");
  g.appendChild(circ);

  svg.appendChild(g);
}

function rotateOverlayNeedle(percentage) {
  let group = document.getElementById("gauge-needle-group");
  if (!group) return;
  const rotation = (percentage / 100) * 270 - 132;
  group.style.transition = "transform 1s cubic-bezier(0.645, 0.045, 0.355, 1)";
  group.setAttribute("transform", `translate(100 90) rotate(${rotation})`);
}
