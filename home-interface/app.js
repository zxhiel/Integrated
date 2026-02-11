window.addEventListener("load", () => {
  window.scrollTo(0, 0);
});

const menuBtn = document.getElementById("menuBtn");
const mainNav = document.getElementById("mainNav");
const auth = document.querySelector(".auth");

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    mainNav.classList.toggle("open");
    auth.classList.toggle("open");
  });
}

const revealItems = document.querySelectorAll(
  ".top-section, .promo-card, .rooms, .room-card, .location, .map-card, .info-card"
);

revealItems.forEach((item, index) => {
  item.classList.add("reveal");
  item.style.setProperty("--reveal-delay", `${index * 80}ms`);
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

revealItems.forEach((item) => observer.observe(item));
