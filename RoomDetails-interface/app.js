const menuBtn = document.getElementById("menuBtn");
const mainNav = document.getElementById("mainNav");
const auth = document.querySelector(".auth");

menuBtn.addEventListener("click", () => {
  mainNav.classList.toggle("open");
  auth.classList.toggle("open");
});

document.querySelectorAll(".reserve").forEach((button) => {
  button.addEventListener("click", () => {
    window.alert("Reservation request sent. We'll confirm shortly.");
  });
});
