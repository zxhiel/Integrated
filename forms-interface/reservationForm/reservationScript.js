// Check if user is logged in
if (!sessionStorage.getItem("isLoggedIn")) {
    window.location.href = "../login-forms/login.html";
}

const currentUserRole = sessionStorage.getItem("userRole") || "user";
const currentUserEmail = (sessionStorage.getItem("currentUserEmail") || "").toLowerCase();
const RESERVATIONS_KEY = "transientReservation";
const LEGACY_RESERVATIONS_KEY = "Reservations";

// Initialize bookings from localStorage or empty array
let bookings = JSON.parse(localStorage.getItem(RESERVATIONS_KEY) || localStorage.getItem(LEGACY_RESERVATIONS_KEY) || "[]");

// Set min date to today for date picker
document.addEventListener("DOMContentLoaded", function() {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("reservationDate").setAttribute("min", today);

    // Display existing bookings
    displayBookings();

    // Setup event listeners
    document.getElementById("reservationForm").addEventListener("submit", handleReservationSubmit);

    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById("reservationDate").value = tomorrow.toISOString().split("T")[0];
});

// Validate reservation fields before allowing submission.
function validateReservationInputs(data) {
    if (!data.date || !data.time || !data.fullName || !data.email || !data.phone) {
        alert("Please complete all required fields.");
        return false;
    }

    const guestCount = parseInt(data.guests, 10);
    if (Number.isNaN(guestCount) || guestCount < 1 || guestCount > 20) {
        alert("Guest count must be between 1 and 20.");
        return false;
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
    if (!emailValid) {
        alert("Please enter a valid email address.");
        return false;
    }

    const phoneValid = /^09\d{9}$/.test(data.phone);
    if (!phoneValid) {
        alert("Phone must follow 09XXXXXXXXX format.");
        return false;
    }

    const selectedDate = new Date(data.date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
        alert("Reservation date cannot be in the past.");
        return false;
    }

    if (currentUserEmail && data.email.toLowerCase() !== currentUserEmail) {
        alert("Use your signed-in email for reservation.");
        return false;
    }

    return true;
}

// Build and save a reservation record after form submission.
function handleReservationSubmit(e) {
    e.preventDefault();

    // Get form values
    const reservationDate = document.getElementById("reservationDate").value;
    const reservationTime = document.getElementById("reservationTime").value;
    const guests = document.getElementById("guests").value;
    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const phone = document.getElementById("phone").value.trim();

    if (!validateReservationInputs({
        date: reservationDate,
        time: reservationTime,
        guests,
        fullName,
        email,
        phone
    })) {
        return;
    }

    const isAuthenticated = requestBookingAuthentication();
    if (!isAuthenticated) {
        return;
    }

    // Create reservation object
    const reservation = {
        id: Date.now(),
        date: reservationDate,
        time: reservationTime,
        guests: parseInt(guests, 10),
        name: fullName,
        email,
        phone,
        createdBy: currentUserEmail || email,
        status: "confirmed",
        createdAt: new Date().toISOString()
    };

    // Add to bookings array
    bookings.unshift(reservation);

    // Save to localStorage
    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(bookings));

    // Show confirmation message
    showConfirmation(reservation);

    // Update bookings display
    displayBookings();

    // Reset form
    document.getElementById("reservationForm").reset();
    document.getElementById("guests").value = "2";

    // Set date to tomorrow again
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById("reservationDate").value = tomorrow.toISOString().split("T")[0];
}

// Require an extra confirmation step before finalizing the booking.
function requestBookingAuthentication() {
    const proceed = confirm("Authentication required before booking. Reminder: Once booked, there is a cancellation fee of 500 pesos.");

    if (!proceed) {
        alert("Reservation was not completed.");
        return false;
    }

    const authCode = prompt("For authentication, type BOOK to continue.");
    if (authCode !== "BOOK") {
        alert("Authentication failed. Reservation was not completed.");
        return false;
    }

    return true;
}

// Render the reservation summary and temporary confirmation banner.
function showConfirmation(reservation) {
    // Update summary
    const summaryDetails = document.getElementById("summaryDetails");
    const options = { year: "numeric", month: "long", day: "numeric" };
    const formattedDate = new Date(reservation.date).toLocaleDateString("en-US", options);

    summaryDetails.innerHTML = `
        <div class="summary-item">
            <strong>Name:</strong> ${reservation.name}
        </div>
        <div class="summary-item">
            <strong>Date:</strong> ${formattedDate}
        </div>
        <div class="summary-item">
            <strong>Time:</strong> ${formatTime(reservation.time)}
        </div>
        <div class="summary-item">
            <strong>Guests:</strong> ${reservation.guests}
        </div>
        <div class="summary-item">
            <strong>Email:</strong> ${reservation.email}
        </div>
        <div class="summary-item">
            <strong>Phone:</strong> ${reservation.phone}
        </div>
        <div class="summary-item">
            <strong>Reservation ID:</strong> ${reservation.id}
        </div>
    `;

    // Show summary and confirmation message
    document.getElementById("reservationSummary").style.display = "block";
    document.getElementById("confirmationMessage").style.display = "block";

    // Hide confirmation message after 5 seconds
    setTimeout(() => {
        document.getElementById("confirmationMessage").style.display = "none";
    }, 5000);
}

// Return whether the current user can view or cancel this booking.
function canManageBooking(booking) {
    if (currentUserRole === "admin") {
        return true;
    }
    const owner = (booking.createdBy || booking.email || "").toLowerCase();
    return owner && owner === currentUserEmail;
}

// Render the booking list visible to the signed-in user role.
function displayBookings() {
    const bookingsList = document.getElementById("bookingsList");

    if (bookingsList && bookingsList.dataset.mode === "amenities") {
        return;
    }
    const noBookingsMessage = document.getElementById("noBookingsMessage");

    // Clear current list
    bookingsList.innerHTML = "";

    const sortedBookings = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const visibleBookings = currentUserRole === "admin"
        ? sortedBookings
        : sortedBookings.filter((booking) => canManageBooking(booking));

    if (visibleBookings.length === 0) {
        const messageClone = noBookingsMessage.cloneNode(true);
        messageClone.style.display = "block";
        bookingsList.appendChild(messageClone);
        return;
    }

    // Add each booking to the list
    visibleBookings.forEach((booking) => {
        const bookingCard = document.createElement("div");
        bookingCard.className = "booking-card";

        const options = { year: "numeric", month: "short", day: "numeric" };
        const formattedDate = new Date(booking.date).toLocaleDateString("en-US", options);
        const formattedTime = formatTime(booking.time);
        const canCancel = canManageBooking(booking);

        bookingCard.innerHTML = `
            <h3>${booking.name}</h3>
            <p><i class="fas fa-calendar-alt"></i> <strong>Date:</strong> ${formattedDate}</p>
            <p><i class="fas fa-clock"></i> <strong>Time:</strong> ${formattedTime}</p>
            <p><i class="fas fa-users"></i> <strong>Guests:</strong> ${booking.guests}</p>
            <p><i class="fas fa-envelope"></i> <strong>Email:</strong> ${booking.email}</p>
            <p><i class="fas fa-phone"></i> <strong>Phone:</strong> ${booking.phone}</p>
            <div class="status-badge status-${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</div>
            ${canCancel ? `<button class="btn cancel-btn" style="margin-top: 15px; padding: 8px; font-size: 0.9rem;" data-id="${booking.id}">
                <i class="fas fa-times"></i> Cancel Reservation
            </button>` : ""}
        `;

        bookingsList.appendChild(bookingCard);
    });

    // Add event listeners to cancel buttons
    document.querySelectorAll(".cancel-btn").forEach((button) => {
        button.addEventListener("click", function() {
            const id = parseInt(this.getAttribute("data-id"), 10);
            cancelReservation(id);
        });
    });
}

// Cancel a reservation by id after permission and user confirmation checks.
function cancelReservation(id) {
    const target = bookings.find((booking) => booking.id === id);
    if (!target) {
        alert("Reservation not found.");
        return;
    }

    if (!canManageBooking(target)) {
        alert("You do not have permission to cancel this reservation.");
        return;
    }

    if (confirm("Are you sure you want to cancel this reservation?, Cancelling the Reservation may lead to a Payment of 500")) {
        // Remove booking with the given ID
        bookings = bookings.filter((booking) => booking.id !== id);

        // Update localStorage
        localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(bookings));

        // Update display
        displayBookings();

        // Show cancellation message
        alert("Reservation has been cancelled.");
    }
}

// Convert 24-hour time values into 12-hour AM/PM format.
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// Clear session data and return the user to the login page.
function logout() {
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("currentUserEmail");
    sessionStorage.removeItem("currentUserName");
    sessionStorage.removeItem("userRole");
    window.location.href = "../login-forms/login.html";
}
