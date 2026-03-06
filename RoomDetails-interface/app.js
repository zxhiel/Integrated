const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
if (!isLoggedIn) {
  window.location.href = "../forms-interface/login-forms/login.html";
}

const modal = document.getElementById("roomModal");
const modalTitle = document.getElementById("modalTitle");
const modalHero = modal.querySelector(".modal-hero");
const modalThumbs = modal.querySelectorAll(".modal-thumbs img");
const bookBtn = modal.querySelector(".book-btn");
const RESERVATION_FORM_URL = "../forms-interface/reservationForm/reservation.html";
const RESERVATIONS_KEY = "transientReservation";
const LEGACY_RESERVATIONS_KEY = "Reservations";

const tabs = document.querySelectorAll(".tab");
const browseCards = document.getElementById("browseCards");
const browseDetails = document.getElementById("browseDetails");
const myReservationsSection = document.getElementById("myReservationsSection");
const reservationList = document.getElementById("reservationList");

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || "N/A";
  }
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatTime(value) {
  if (!value || !value.includes(":")) {
    return value || "N/A";
  }
  const [hours, minutes] = value.split(":");
  const hour = Number.parseInt(hours, 10);
  if (Number.isNaN(hour)) {
    return value;
  }
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function formatStatusLabel(status) {
  const value = (status || "confirmed").toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Render saved reservations for the signed-in user inside the My Reservations tab.
function renderMyReservations() {
  const currentUserEmail = (sessionStorage.getItem("currentUserEmail") || "").toLowerCase();
  const currentUserRole = sessionStorage.getItem("userRole") || "user";
  const stored = JSON.parse(localStorage.getItem(RESERVATIONS_KEY) || localStorage.getItem(LEGACY_RESERVATIONS_KEY) || "[]");

  const visibleReservations = currentUserRole === "admin"
    ? stored
    : stored.filter((item) => (item.createdBy || item.email || "").toLowerCase() === currentUserEmail);

  if (!visibleReservations.length) {
    reservationList.innerHTML = `
      <article class="reservation-empty">
        <h3>No reservations yet</h3>
        <p>Complete the reservation form and your saved data will appear here.</p>
      </article>
    `;
    return;
  }

  reservationList.innerHTML = visibleReservations
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map((item) => {
      const status = (item.status || "confirmed").toLowerCase();
      return `
        <article class="reservation-card">
          <div class="reservation-head">
            <h3>${item.name || "Guest"}</h3>
            <span class="reservation-status ${status}">${formatStatusLabel(item.status)}</span>
          </div>
          <div class="reservation-meta">
            <div class="reservation-row"><span class="reservation-label">Date</span><span class="reservation-value">${formatDate(item.date)}</span></div>
            <div class="reservation-row"><span class="reservation-label">Time</span><span class="reservation-value">${formatTime(item.time)}</span></div>
            <div class="reservation-row"><span class="reservation-label">Guests</span><span class="reservation-value">${item.guests || "N/A"}</span></div>
            <div class="reservation-row"><span class="reservation-label">Email</span><span class="reservation-value">${item.email || "N/A"}</span></div>
            <div class="reservation-row"><span class="reservation-label">Phone</span><span class="reservation-value">${item.phone || "N/A"}</span></div>
          </div>
          <button class="reservation-cancel" type="button" data-id="${item.id}">Cancel reservation</button>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".reservation-cancel").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number.parseInt(button.dataset.id || "", 10);
      cancelReservationById(id);
    });
  });
}

function cancelReservationById(id) {
  if (Number.isNaN(id)) {
    return;
  }

  const stored = JSON.parse(localStorage.getItem(RESERVATIONS_KEY) || localStorage.getItem(LEGACY_RESERVATIONS_KEY) || "[]");
  const target = stored.find((item) => Number(item.id) === id);

  if (!target) {
    return;
  }

  if ((target.status || "").toLowerCase() === "cancelled") {
    alert("This reservation is already cancelled.");
    return;
  }

  const shouldTerminate = confirm("Do you want to cancel this reservation?");
  if (!shouldTerminate) {
    return;
  }

  const updated = stored.map((item) => Number(item.id) === id
    ? { ...item, status: "cancelled", cancelledAt: new Date().toISOString() }
    : item
  );

  localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(updated));
  if (localStorage.getItem(LEGACY_RESERVATIONS_KEY)) {
    localStorage.setItem(LEGACY_RESERVATIONS_KEY, JSON.stringify(updated));
  }

  renderMyReservations();
}

function switchTab(mode) {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === mode;
    tab.classList.toggle("active", isActive);
  });

  const showReservations = mode === "reservations";
  browseCards.classList.toggle("hidden", showReservations);
  browseDetails.classList.toggle("hidden", showReservations);
  myReservationsSection.classList.toggle("hidden", !showReservations);

  if (showReservations) {
    renderMyReservations();
  }
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab));
});

if (bookBtn) {
  // Send the user to the reservation form and carry the selected room name.
  bookBtn.addEventListener("click", () => {
    sessionStorage.setItem("selectedRoomName", modalTitle.textContent || "Studio Unit");
    window.location.href = RESERVATION_FORM_URL;
  });
}

// Open the room modal with details from the selected room card.
document.querySelectorAll(".cta").forEach((button) => {
  button.addEventListener("click", () => {
    const room = button.dataset.room || "Studio Unit";
    const hero = button.dataset.hero || "images/studio-1.jpg";
    modalTitle.textContent = room;
    modalHero.src = hero;
    modalThumbs[0].src = hero;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  });
});

// Close the modal when the user clicks the backdrop or close control.
modal.addEventListener("click", (event) => {
  if (event.target.dataset.close === "true") {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
});
