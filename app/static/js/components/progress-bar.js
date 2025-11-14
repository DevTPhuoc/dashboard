// Animate progress bar tăng dần về đúng số % hiển thị
function initProgressBar(className, percent = 80) {
  const progressBar = document.querySelector(className);
  if (progressBar) {
    progressBar.style.width = "0%";
    function animateBar() {
      progressBar.style.transition = "none";
      progressBar.style.width = "0%";
      setTimeout(() => {
        progressBar.style.transition = "width 1.2s ease-out";
        progressBar.style.width = percent + "%";
      }, 50);
    }
    animateBar();
  }
}
