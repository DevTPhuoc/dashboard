// Counter animation cho số liệu
function animateCounter(id, number, duration = 1200) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = Math.floor(start + (number - start) * progress);
    el.textContent = value;
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = number;
    }
  }

  requestAnimationFrame(update);
}
