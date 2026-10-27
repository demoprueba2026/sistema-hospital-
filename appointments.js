// MODAL GOOGLE CALENDAR CONTROLLER
// ==========================================
const appointmentModal = document.querySelector("#appointment-modal");
const modalCloseBtn = document.querySelector("#modal-close-btn");
const modalBtnCancel = document.querySelector("#modal-btn-cancel");
const appointmentForm = document.querySelector("#appointment-form");
const modalSuccessView = document.querySelector("#modal-success-view");
const btnCloseModalDone = document.querySelector("#btn-close-modal-done");
const btnExportIcs = document.querySelector("#btn-export-ics");

const modalDocAvatar = document.querySelector("#modal-doc-avatar");
const modalDoctorName = document.querySelector("#modal-doctor-name");
const modalDocSpecialty = document.querySelector("#modal-doc-specialty");
const modalDocAvailability = document.querySelector("#modal-doc-availability");

const calPrevBtn = document.querySelector("#cal-prev-btn");
const calNextBtn = document.querySelector("#cal-next-btn");
const calMonthTitle = document.querySelector("#cal-month-title");
const calDaysGrid = document.querySelector("#cal-days-grid");
const selectedDateLabel = document.querySelector("#selected-date-label");
const selectedDateInput = document.querySelector("#selected-date-input");
const timeSlotsGrid = document.querySelector("#time-slots-grid");
const selectedTimeInput = document.querySelector("#selected-time-input");
const formAlert = document.querySelector("#form-alert");

let activeDoctor = null;
let activeSpecialty = null;
let calCurrentYear = new Date().getFullYear();
let calCurrentMonth = new Date().getMonth();
let currentSelectedDate = null;
let currentSelectedTime = null;
let lastCreatedAppointment = null;

const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAY_NAMES = [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

function parseDoctorWorkingDays(availabilityText) {
    if (!availabilityText) return [1, 2, 3, 4, 5];
    const text = availabilityText.toLowerCase();
    const days = [];

    if (text.includes("lunes a viernes")) {
        return [1, 2, 3, 4, 5];
    }
    if (text.includes("lunes a jueves")) {
        return [1, 2, 3, 4];
    }
    if (text.includes("lunes")) days.push(1);
    if (text.includes("martes")) days.push(2);
    if (text.includes("miércoles") || text.includes("miercoles")) days.push(3);
    if (text.includes("jueves")) days.push(4);
    if (text.includes("viernes")) days.push(5);
    if (text.includes("sábado") || text.includes("sabado")) days.push(6);
    if (text.includes("domingo")) days.push(0);

    return days.length ? days : [1, 2, 3, 4, 5];
}

function generateDoctorTimeSlots(availabilityText) {
    const text = (availabilityText || "").toLowerCase();
    const isAfternoon = text.includes("1:00 p. m.") || text.includes("2:00 p. m.") || text.includes("tarde") || text.includes("3:00 p. m.");

    if (text.includes("8:00 a. m.") && (text.includes("12:00") || text.includes("1:00"))) {
        return ["08:00 a. m.", "08:30 a. m.", "09:00 a. m.", "09:30 a. m.", "10:00 a. m.", "10:30 a. m.", "11:00 a. m.", "11:30 a. m.", "12:00 p. m."];
    } else if (text.includes("9:00 a. m.")) {
        return ["09:00 a. m.", "09:30 a. m.", "10:00 a. m.", "10:30 a. m.", "11:00 a. m.", "11:30 a. m.", "01:00 p. m.", "01:30 p. m."];
    } else if (text.includes("10:00 a. m.")) {
        return ["10:00 a. m.", "10:30 a. m.", "11:00 a. m.", "11:30 a. m.", "01:00 p. m.", "02:00 p. m.", "03:00 p. m."];
    } else if (isAfternoon) {
        return ["01:00 p. m.", "01:30 p. m.", "02:00 p. m.", "02:30 p. m.", "03:00 p. m.", "03:30 p. m.", "04:00 p. m.", "04:30 p. m."];
    }

    return ["08:30 a. m.", "09:15 a. m.", "10:00 a. m.", "10:45 a. m.", "11:30 a. m.", "02:00 p. m.", "03:00 p. m.", "04:00 p. m."];
}

function openAppointmentModal(doctor, specialty) {
    activeDoctor = doctor;
    activeSpecialty = specialty;

    modalDocAvatar.textContent = initialsFor(doctor.name);
    modalDoctorName.textContent = doctor.name;
    modalDocSpecialty.textContent = specialty;
    modalDocAvailability.textContent = `Atención: ${doctor.availability}`;

    appointmentForm.hidden = false;
    modalSuccessView.hidden = true;
    formAlert.hidden = true;
    formAlert.textContent = "";

    const today = new Date();
    calCurrentYear = today.getFullYear();
    calCurrentMonth = today.getMonth();

    const pad = (n) => String(n).padStart(2, "0");
    const defaultDateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    selectDate(defaultDateStr);

    renderCalendar();

    if (appointmentModal) {
        if (typeof appointmentModal.showModal === "function") {
            appointmentModal.showModal();
        } else {
            appointmentModal.setAttribute("open", "");
        }
    }
}

function closeAppointmentModal() {
    if (appointmentModal) {
        if (typeof appointmentModal.close === "function") {
            appointmentModal.close();
        } else {
            appointmentModal.removeAttribute("open");
        }
    }
    if (appointmentForm) {
        appointmentForm.reset();
    }
}

function renderCalendar() {
    calMonthTitle.textContent = `${MONTH_NAMES[calCurrentMonth]} ${calCurrentYear}`;
    calDaysGrid.innerHTML = "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayIndex = new Date(calCurrentYear, calCurrentMonth, 1).getDay();
    const startOffset = (firstDayIndex + 6) % 7; // Lunes = 0
    const daysInMonth = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calCurrentYear, calCurrentMonth, 0).getDate();

    const doctorWorkingDays = parseDoctorWorkingDays(activeDoctor ? activeDoctor.availability : "");

    // Días de mes anterior
    for (let i = startOffset - 1; i >= 0; i--) {
        const dummy = document.createElement("button");
        dummy.type = "button";
        dummy.className = "gcal-day";
        dummy.disabled = true;
        dummy.textContent = daysInPrevMonth - i;
        calDaysGrid.append(dummy);
    }

    const pad = (n) => String(n).padStart(2, "0");

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(calCurrentYear, calCurrentMonth, day);
        dateObj.setHours(0, 0, 0, 0);

        const dateStr = `${calCurrentYear}-${pad(calCurrentMonth + 1)}-${pad(day)}`;
        const dayOfWeek = dateObj.getDay();

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "gcal-day";
        btn.textContent = day;

        if (dateObj < today) {
            btn.disabled = true;
        }

        if (dateObj.getTime() === today.getTime()) {
            btn.classList.add("today");
        }

        if (doctorWorkingDays.includes(dayOfWeek)) {
            btn.classList.add("doctor-day");
            btn.title = `Día de consulta de ${activeDoctor ? activeDoctor.name : "especialista"}`;
        }

        if (currentSelectedDate === dateStr) {
            btn.classList.add("selected");
        }

        btn.addEventListener("click", () => {
            selectDate(dateStr);
            renderCalendar();
        });

        calDaysGrid.append(btn);
    }
}

function selectDate(dateStr) {
    currentSelectedDate = dateStr;
    selectedDateInput.value = dateStr;

    const parts = dateStr.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);

    const dayName = DAY_NAMES[dateObj.getDay()];
    const monthName = MONTH_NAMES[m];
    selectedDateLabel.textContent = `${dayName}, ${d} de ${monthName} de ${y}`;

    renderTimeSlots();
}

function renderTimeSlots() {
    timeSlotsGrid.innerHTML = "";
    const slots = generateDoctorTimeSlots(activeDoctor ? activeDoctor.availability : "");

    if (!currentSelectedTime || !slots.includes(currentSelectedTime)) {
        currentSelectedTime = slots[0];
    }
    selectedTimeInput.value = currentSelectedTime;

    slots.forEach((slot) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "time-slot-btn";
        if (slot === currentSelectedTime) {
            btn.classList.add("selected");
        }
        btn.textContent = slot;

        btn.addEventListener("click", () => {
            currentSelectedTime = slot;
            selectedTimeInput.value = slot;
            timeSlotsGrid.querySelectorAll(".time-slot-btn").forEach((b) => b.classList.remove("selected"));
            btn.classList.add("selected");
        });

        timeSlotsGrid.append(btn);
    });
}

// Navegación del Mini Calendario
if (calPrevBtn && calNextBtn) {
    calPrevBtn.addEventListener("click", () => {
        calCurrentMonth--;
        if (calCurrentMonth < 0) {
            calCurrentMonth = 11;
            calCurrentYear--;
        }
        renderCalendar();
    });

    calNextBtn.addEventListener("click", () => {
        calCurrentMonth++;
        if (calCurrentMonth > 11) {
            calCurrentMonth = 0;
            calCurrentYear++;
        }
        renderCalendar();
    });
}

// Cierre del modal
if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeAppointmentModal);
if (modalBtnCancel) modalBtnCancel.addEventListener("click", closeAppointmentModal);
if (btnCloseModalDone) btnCloseModalDone.addEventListener("click", closeAppointmentModal);

if (appointmentModal) {
    appointmentModal.addEventListener("click", (e) => {
        const rect = appointmentModal.getBoundingClientRect();
        const isInDialog = (
            rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
            closeAppointmentModal();
        }
    });
}

