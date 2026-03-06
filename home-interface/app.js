// Reset scroll to top each time the homepage loads.
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

const ROOM_DETAILS_URL = "../RoomDetails-interface/rooms.html";
const LOGIN_URL = "../forms-interface/login-forms/login.html";

// Return true when the current browser session is authenticated.
function isLoggedIn() {
  return sessionStorage.getItem("isLoggedIn") === "true";
}

// Route booking actions to login or room details based on auth state.
function routeToBooking() {
  window.location.href = isLoggedIn() ? ROOM_DETAILS_URL : LOGIN_URL;
}

const loginLink = document.querySelector('.auth a[href*="login.html"]');
const signUpLink = document.querySelector('.auth a[href*="signup.html"]');

if (isLoggedIn() && loginLink) {
  loginLink.textContent = "My Rooms";
  loginLink.href = ROOM_DETAILS_URL;

  if (signUpLink) {
    signUpLink.textContent = "Log out";
    signUpLink.href = "#";
    signUpLink.addEventListener("click", (event) => {
      event.preventDefault();
      sessionStorage.removeItem("isLoggedIn");
      sessionStorage.removeItem("currentUserEmail");
      sessionStorage.removeItem("currentUserName");
      sessionStorage.removeItem("userRole");
      window.location.href = "index.html";
    });
  }
}

document.querySelectorAll(".banner-btn, .btn.reserve, .btn.ghost").forEach((button) => {
  button.addEventListener("click", routeToBooking);
});
