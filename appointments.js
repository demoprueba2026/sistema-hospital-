// MODAL GOOGLE CALENDAR CONTROLLER
// ==========================================
const appointmentModal = document.querySelector("#appointment-modal");
const modalCloseBtn = document.querySelector("#modal-close-btn");
const modalBtnCancel = document.querySelector("#modal-btn-cancel");
const appointmentForm = document.querySelector("#appointment-form");
const modalSuccessView = document.querySelector("#modal-success-view");
const btnCloseModalDone = document.querySelector("#btn-close-modal-done");

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
const timeSlotsMessage = document.querySelector("#time-slots-message");

let activeDoctor = null;
let activeSpecialty = null;
let calCurrentYear = new Date().getFullYear();
let calCurrentMonth = new Date().getMonth();
let currentSelectedDate = null;
let currentSelectedTime = null;
let lastCreatedAppointment = null;
let timeSlotsRequestId = 0;
let currentWizardStep = 1;

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

function setWizardStep(step) {
    if (!Number.isInteger(step) || step < 1 || step > 4) return;

    currentWizardStep = step;
    document.querySelectorAll(".wizard-pane").forEach((pane, index) => {
        const isActive = index + 1 === step;
        pane.hidden = !isActive;
        pane.classList.toggle("active", isActive);
    });
    document.querySelectorAll(".wizard-step").forEach((tab) => {
        const isActive = Number(tab.dataset.step) === step;
        tab.classList.toggle("active", isActive);
        if (isActive) {
            tab.setAttribute("aria-current", "step");
        } else {
            tab.removeAttribute("aria-current");
        }
    });
    if (step === 4) updateAppointmentSummary();
}

function showStepAlert(step, message) {
    const alert = document.querySelector(`#step-${step}-alert`);
    if (!alert) return;
    alert.hidden = false;
    alert.textContent = message;
}

function clearStepAlert(step) {
    const alert = document.querySelector(`#step-${step}-alert`);
    if (!alert) return;
    alert.hidden = true;
    alert.textContent = "";
}

function validatePatientDetails() {
    const requiredFields = [
        document.querySelector("#patient-name"),
        document.querySelector("#patient-email"),
        document.querySelector("#patient-phone"),
        document.querySelector("#patient-age"),
        document.querySelector("#appointment-category"),
        document.querySelector("#appointment-notes")
    ];
    const invalidField = requiredFields.find((field) => !field.value.trim() || !field.checkValidity());
    if (invalidField) {
        invalidField.focus();
        showStepAlert(3, invalidField.validationMessage || "Completa los datos requeridos para continuar.");
        return false;
    }

    clearStepAlert(3);
    return true;
}

function updateAppointmentSummary() {
    const values = {
        "sum-doctor": activeDoctor ? activeDoctor.name : "",
        "sum-specialty": activeSpecialty || "",
        "sum-date": selectedDateLabel.textContent,
        "sum-time": selectedTimeInput.value,
        "sum-category": document.querySelector("#appointment-category").value,
        "sum-notes": document.querySelector("#appointment-notes").value.trim(),
        "sum-patient": document.querySelector("#patient-name").value.trim(),
        "sum-cedula": document.querySelector("#patient-id").value.trim() || "No indicado",
        "sum-age": `${document.querySelector("#patient-age").value} años`,
        "sum-phone": document.querySelector("#patient-phone").value.trim(),
        "sum-insurance": `${document.querySelector("#patient-insurance").value} (por confirmar)`
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function openAppointmentModal(doctor, specialty) {
    activeDoctor = doctor;
    activeSpecialty = specialty;
    appointmentForm.reset();
    setWizardStep(1);

    modalDocAvatar.textContent = initialsFor(doctor.name);
    modalDoctorName.textContent = doctor.name;
    modalDocSpecialty.textContent = specialty;
    modalDocAvailability.textContent = `Atención: ${doctor.availability}`;
    document.querySelector("#step-doctor-avatar").textContent = initialsFor(doctor.name);
    document.querySelector("#step-doctor-name").textContent = doctor.name;
    document.querySelector("#step-doctor-spec").textContent = specialty;
    document.querySelector("#step-doctor-schedule").textContent = doctor.availability;
    const opening = currentDoctorOpenings && currentDoctorOpenings.find((item) => item.doctor.name === doctor.name);
    document.querySelector("#step-doctor-next-slot").textContent = opening
        ? `Próximo cupo: ${opening.label}`
        : currentAvailabilityError
            ? "No se pudo consultar la disponibilidad; verifica los horarios antes de confirmar"
            : "La disponibilidad se comprobará al seleccionar una fecha";

    appointmentForm.hidden = false;
    modalSuccessView.hidden = true;
    formAlert.hidden = true;
    formAlert.textContent = "";

    const today = new Date();
    const workingDays = parseDoctorWorkingDays(doctor.availability);
    while (!workingDays.includes(today.getDay())) {
        today.setDate(today.getDate() + 1);
    }
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
    setWizardStep(1);
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

        const isWorkingDay = doctorWorkingDays.includes(dayOfWeek);
        if (dateObj < today || !isWorkingDay) {
            btn.disabled = true;
        }

        if (dateObj.getTime() === today.getTime()) {
            btn.classList.add("today");
        }

        if (isWorkingDay) {
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

async function renderTimeSlots() {
    const requestId = ++timeSlotsRequestId;
    timeSlotsGrid.replaceChildren();
    const slots = generateDoctorTimeSlots(activeDoctor ? activeDoctor.availability : "");
    const previouslySelectedTime = currentSelectedTime;
    currentSelectedTime = null;
    selectedTimeInput.value = "";
    timeSlotsMessage.textContent = "Consultando horarios disponibles...";

    slots.forEach((slot) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "time-slot-btn";
        btn.disabled = true;
        btn.textContent = slot;
        timeSlotsGrid.append(btn);
    });

    let bookedTimes;
    try {
        bookedTimes = await apiGetBookedAppointmentTimes(activeDoctor.name, currentSelectedDate);
    } catch (error) {
        if (requestId !== timeSlotsRequestId) return;
        timeSlotsMessage.textContent = `${error.message}. No es posible confirmar una cita hasta verificar la disponibilidad.`;
        return;
    }

    if (requestId !== timeSlotsRequestId) return;

    const bookedSlots = new Set(bookedTimes.map((time) => time.trim().toLocaleLowerCase("es")));
    const availableSlots = [];
    timeSlotsGrid.querySelectorAll(".time-slot-btn").forEach((btn) => {
        const isBooked = bookedSlots.has(btn.textContent.trim().toLocaleLowerCase("es"));
        const isPast = !isDoctorSlotInFuture(currentSelectedDate, btn.textContent);
        btn.disabled = isBooked || isPast;
        if (isBooked) {
            btn.classList.add("is-booked");
            btn.title = "Este horario ya está reservado";
            btn.setAttribute("aria-label", `${btn.textContent}, ocupado`);
        } else if (isPast) {
            btn.classList.add("is-past");
            btn.title = "Esta hora ya pasó";
            btn.setAttribute("aria-label", `${btn.textContent}, hora pasada`);
        } else {
            availableSlots.push(btn.textContent);
            btn.addEventListener("click", () => {
                currentSelectedTime = btn.textContent;
                selectedTimeInput.value = currentSelectedTime;
                timeSlotsGrid.querySelectorAll(".time-slot-btn").forEach((slotButton) => {
                    slotButton.classList.toggle("selected", slotButton === btn);
                });
            });
        }
    });

    const selectedSlot = availableSlots.includes(previouslySelectedTime)
        ? previouslySelectedTime
        : availableSlots[0];
    if (selectedSlot) {
        currentSelectedTime = selectedSlot;
        selectedTimeInput.value = selectedSlot;
        timeSlotsGrid.querySelectorAll(".time-slot-btn").forEach((btn) => {
            btn.classList.toggle("selected", btn.textContent === selectedSlot);
        });
        timeSlotsMessage.textContent = "Los horarios ocupados aparecen deshabilitados.";
    } else {
        timeSlotsMessage.textContent = "No hay horarios disponibles para esta fecha. Selecciona otro día.";
    }
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

document.querySelector("#btn-goto-step-2").addEventListener("click", () => setWizardStep(2));
document.querySelector("#btn-back-to-step-1").addEventListener("click", () => setWizardStep(1));
document.querySelector("#btn-goto-step-3").addEventListener("click", () => {
    if (!currentSelectedDate || !selectedTimeInput.value) {
        showStepAlert(2, "Selecciona un día disponible y un horario antes de continuar.");
        return;
    }
    clearStepAlert(2);
    setWizardStep(3);
});
document.querySelector("#btn-back-to-step-2").addEventListener("click", () => setWizardStep(2));
document.querySelector("#btn-goto-step-4").addEventListener("click", () => {
    if (validatePatientDetails()) setWizardStep(4);
});
document.querySelector("#btn-back-to-step-3").addEventListener("click", () => setWizardStep(3));
document.querySelectorAll(".wizard-step").forEach((tab) => {
    tab.addEventListener("click", () => {
        const requestedStep = Number(tab.dataset.step);
        if (requestedStep < currentWizardStep) setWizardStep(requestedStep);
    });
});

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
