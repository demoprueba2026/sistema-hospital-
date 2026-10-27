const doctorsBySpecialty = {
    "Cardiología": [
        { name: "Dra. Desiree Rojas", availability: "Lunes y miércoles · 8:00 a. m. – 1:00 p. m." },
        { name: "Dr. Andrés Salazar", availability: "Martes y jueves · 9:00 a. m. – 2:00 p. m." }
    ],
    "Cirugía general": [
        { name: "Dr. Miguel Herrera", availability: "Lunes a viernes · 8:00 a. m. – 12:00 p. m." },
        { name: "Dra. Camila Méndez", availability: "Martes y jueves · 1:00 p. m. – 5:00 p. m." }
    ],
    "Dermatología": [
        { name: "Dra. Sofía Paredes", availability: "Lunes y viernes · 9:00 a. m. – 2:00 p. m." },
        { name: "Dr. Daniel Fuentes", availability: "Miércoles · 10:00 a. m. – 4:00 p. m." }
    ],
    "Ginecología y obstetricia": [
        { name: "Dra. Mariana Castillo", availability: "Lunes a jueves · 8:00 a. m. – 1:00 p. m." },
        { name: "Dra. Gabriela Núñez", availability: "Martes y viernes · 1:00 p. m. – 5:00 p. m." }
    ],
    "Medicina interna": [
        { name: "Dr. Luis Alberto Suárez", availability: "Lunes a viernes · 8:00 a. m. – 12:00 p. m." },
        { name: "Dra. Elena Márquez", availability: "Lunes, miércoles y viernes · 1:00 p. m. – 4:00 p. m." }
    ],
    "Nefrología": [
        { name: "Dr. Ricardo Acosta", availability: "Martes y jueves · 8:00 a. m. – 1:00 p. m." },
        { name: "Dra. Patricia León", availability: "Viernes · 9:00 a. m. – 3:00 p. m." }
    ],
    "Neurología": [
        { name: "Dra. Isabel Molina", availability: "Lunes y miércoles · 9:00 a. m. – 2:00 p. m." },
        { name: "Dr. Javier Torres", availability: "Martes y viernes · 8:00 a. m. – 12:00 p. m." }
    ],
    "Oftalmología": [
        { name: "Dr. Gabriel Romero", availability: "Lunes a jueves · 8:00 a. m. – 12:00 p. m." },
        { name: "Dra. Andrea Silva", availability: "Miércoles y viernes · 1:00 p. m. – 5:00 p. m." }
    ],
    "Pediatría": [
        { name: "Dra. Lucía Fernández", availability: "Lunes a viernes · 8:00 a. m. – 1:00 p. m." },
        { name: "Dr. Samuel Cabrera", availability: "Martes y jueves · 1:00 p. m. – 5:00 p. m." }
    ],
    "Psiquiatría": [
        { name: "Dra. Natalia Vega", availability: "Lunes y jueves · 9:00 a. m. – 2:00 p. m." },
        { name: "Dr. Esteban Gil", availability: "Miércoles y viernes · 10:00 a. m. – 3:00 p. m." }
    ],
    "Traumatología y ortopedia": [
        { name: "Dr. Fernando Blanco", availability: "Lunes, miércoles y viernes · 8:00 a. m. – 1:00 p. m." },
        { name: "Dra. Paula Reyes", availability: "Martes y jueves · 1:00 p. m. – 5:00 p. m." }
    ],
    "Urología": [
        { name: "Dr. Alejandro Díaz", availability: "Martes y jueves · 8:00 a. m. – 1:00 p. m." },
        { name: "Dra. Cristina Ponce", availability: "Viernes · 9:00 a. m. – 2:00 p. m." }
    ]
};

const specialtySelect = document.querySelector("#specialty-select");
const emptyState = document.querySelector("#empty-state");
const doctorResults = document.querySelector("#doctor-results");
const resultsTitle = document.querySelector("#results-title");
const doctorCount = document.querySelector("#doctor-count");
const doctorGrid = document.querySelector("#doctor-grid");
const themeToggle = document.querySelector("#theme-toggle");
const allDoctors = Object.values(doctorsBySpecialty).flat();
const doctorPhotos = [
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=160&h=160&q=80",
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=160&h=160&q=80",
    "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=160&h=160&q=80",
    "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=160&h=160&q=80",
    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=160&h=160&q=80",
    "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?auto=format&fit=crop&w=160&h=160&q=80"
];

function updateTheme(isDark) {
    document.body.dataset.theme = isDark ? "dark" : "light";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", isDark ? "Activar tema claro" : "Activar tema oscuro");
    themeToggle.querySelector(".theme-icon").textContent = isDark ? "☀" : "☾";
    themeToggle.querySelector(".theme-label").textContent = isDark ? "Tema claro" : "Tema oscuro";
    document.querySelector('meta[name="theme-color"]').content = isDark ? "#102321" : "#f7fbfa";
    try {
        localStorage.setItem("hdl-theme", isDark ? "dark" : "light");
    } catch (_) {}
}

const savedTheme = (() => {
    try {
        return localStorage.getItem("hdl-theme");
    } catch (_) {
        return null;
    }
})();

const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
updateTheme(savedTheme !== null ? savedTheme === "dark" : prefersDark);

themeToggle.addEventListener("click", () => {
    const isDark = document.body.dataset.theme !== "dark";
    updateTheme(isDark);
});

Object.keys(doctorsBySpecialty).forEach((specialty) => {
    const option = document.createElement("option");
    option.value = specialty;
    option.textContent = specialty;
    specialtySelect.append(option);
});

function initialsFor(name) {
    return name
        .replace(/^(Dra?\. )/, "")
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

function createDoctorCard(doctor, specialty) {
    const card = document.createElement("article");
    card.className = "doctor-card doctor-card--clickable";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `Agendar cita con ${doctor.name}, ${specialty}`);

    const top = document.createElement("div");
    top.className = "doctor-card-top";

    const avatar = document.createElement("span");
    avatar.className = "doctor-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = initialsFor(doctor.name);

    const photo = document.createElement("img");
    photo.className = "doctor-photo";
    photo.src = doctorPhotos[allDoctors.indexOf(doctor) % doctorPhotos.length];
    photo.alt = "";
    photo.loading = "lazy";
    photo.decoding = "async";
    photo.addEventListener("error", () => {
        photo.hidden = true;
        avatar.hidden = false;
    }, { once: true });
    avatar.hidden = true;

    const identity = document.createElement("div");
    const name = document.createElement("h4");
    name.className = "doctor-name";
    name.textContent = doctor.name;

    const specialtyLabel = document.createElement("p");
    specialtyLabel.className = "doctor-specialty";
    specialtyLabel.textContent = specialty;

    identity.append(name, specialtyLabel);
    top.append(photo, avatar, identity);

    const availability = document.createElement("div");
    availability.className = "doctor-availability";

    const dot = document.createElement("span");
    dot.className = "availability-dot";
    dot.setAttribute("aria-hidden", "true");

    const schedule = document.createElement("span");
    schedule.textContent = doctor.availability;
    availability.append(dot, schedule);

    const cta = document.createElement("div");
    cta.className = "doctor-card-cta";
    cta.innerHTML = `
        <span class="book-badge">📅 Agendar cita</span>
        <span class="book-pill">Pedir hora →</span>
    `;

    card.append(top, availability, cta);

    // Eventos para abrir el modal al tocar la tarjeta
    const handleOpen = () => openAppointmentModal(doctor, specialty);
    card.addEventListener("click", handleOpen);
    card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpen();
        }
    });

    return card;
}

specialtySelect.addEventListener("change", () => {
    const specialty = specialtySelect.value;

    if (!specialty) {
        doctorGrid.replaceChildren();
        doctorResults.hidden = true;
        emptyState.hidden = false;
        return;
    }

    const doctors = doctorsBySpecialty[specialty];
    resultsTitle.textContent = specialty;
    doctorCount.textContent = `${doctors.length} profesionales`;
    doctorGrid.replaceChildren(...doctors.map((doctor) => createDoctorCard(doctor, specialty)));
    emptyState.hidden = true;
    doctorResults.hidden = false;
});

// ==========================================
// ALMACENAMIENTO DE CITAS MÉDICAS (LOCALSTORAGE)
// ==========================================
const APPOINTMENTS_STORAGE_KEY = "hdl_citas_hospital";

function getStoredAppointments() {
    try {
        const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
        if (!raw) {
            // Citas iniciales de demostración
            const seed = [
                {
                    id: "cita_seed_1",
                    code: "HDL-4821",
                    doctorName: "Dra. Desiree Rojas",
                    specialty: "Cardiología",
                    date: "2026-10-29",
                    time: "09:00 a. m.",
                    patientName: "Mariana Albornoz",
                    patientEmail: "mariana.albornoz@gmail.com",
                    patientPhone: "0412-9876543",
                    patientAge: 38,
                    notes: "Chequeo por palpitaciones esporádicas y antecedentes de hipertensión familiar.",
                    status: "Pendiente",
                    doctorNotes: "",
                    createdAt: new Date().toISOString()
                },
                {
                    id: "cita_seed_2",
                    code: "HDL-3190",
                    doctorName: "Dr. Miguel Herrera",
                    specialty: "Cirugía general",
                    date: "2026-10-30",
                    time: "10:30 a. m.",
                    patientName: "Roberto Gómez",
                    patientEmail: "roberto.gomez@outlook.com",
                    patientPhone: "0414-3456789",
                    patientAge: 45,
                    notes: "Evaluación postoperatoria y revisión de cicatrización en pared abdominal.",
                    status: "Confirmada",
                    doctorNotes: "Paciente reporta buena evolución inicial.",
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(seed));
            return seed;
        }
        return JSON.parse(raw);
    } catch (_) {
        return [];
    }
}

function saveAppointment(appointment) {
    const list = getStoredAppointments();
    list.unshift(appointment);
    try {
        localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
        console.error("Error al guardar cita en localStorage:", e);
    }
}

// Inicializar almacenamiento
getStoredAppointments();

// ==========================================
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

// Envío del formulario
if (appointmentForm) {
    appointmentForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.querySelector("#patient-name").value.trim();
        const email = document.querySelector("#patient-email").value.trim();
        const phone = document.querySelector("#patient-phone").value.trim();
        const age = document.querySelector("#patient-age").value.trim();
        const notes = document.querySelector("#appointment-notes").value.trim();
        const date = selectedDateInput.value;
        const time = selectedTimeInput.value;

        if (!name || !email || !phone || !age || !notes) {
            formAlert.hidden = false;
            formAlert.textContent = "Por favor completa todos los campos requeridos (*).";
            return;
        }

        if (!date || !time) {
            formAlert.hidden = false;
            formAlert.textContent = "Por favor selecciona una fecha y una hora en el calendario.";
            return;
        }

        formAlert.hidden = true;

        const code = `HDL-${Math.floor(1000 + Math.random() * 9000)}`;

        const appointment = {
            id: `cita_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            code,
            doctorName: activeDoctor ? activeDoctor.name : "Especialista",
            specialty: activeSpecialty || "Medicina General",
            date,
            time,
            patientName: name,
            patientEmail: email,
            patientPhone: phone,
            patientAge: parseInt(age, 10),
            notes,
            status: "Pendiente",
            doctorNotes: "",
            createdAt: new Date().toISOString()
        };

        saveAppointment(appointment);
        lastCreatedAppointment = appointment;

        document.querySelector("#rec-doctor").textContent = appointment.doctorName;
        document.querySelector("#rec-specialty").textContent = appointment.specialty;
        document.querySelector("#rec-date").textContent = selectedDateLabel.textContent;
        document.querySelector("#rec-time").textContent = appointment.time;
        document.querySelector("#rec-patient").textContent = `${appointment.patientName} (${appointment.patientAge} años)`;
        document.querySelector("#rec-phone").textContent = appointment.patientPhone;
        document.querySelector("#rec-code").textContent = appointment.code;

        appointmentForm.hidden = true;
        modalSuccessView.hidden = false;
    });
}

// Descargar .ics para Google Calendar
if (btnExportIcs) {
    btnExportIcs.addEventListener("click", () => {
        if (!lastCreatedAppointment) return;

        const appt = lastCreatedAppointment;
        const dateParts = appt.date.split("-");
        const y = dateParts[0];
        const m = String(dateParts[1]).padStart(2, "0");
        const d = String(dateParts[2]).padStart(2, "0");

        const icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Clinica Su Salud//Citas Medicas//ES",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "BEGIN:VEVENT",
            `UID:${appt.id}@clinicasusalud.com`,
            `DTSTAMP:${y}${m}${d}T120000Z`,
            `DTSTART:${y}${m}${d}T090000`,
            `DTEND:${y}${m}${d}T100000`,
            `SUMMARY:Cita Médica: ${appt.specialty} - ${appt.doctorName}`,
            `DESCRIPTION:Cita médica para ${appt.patientName}. Motivo: ${appt.notes}. Código: ${appt.code}`,
            `LOCATION:Clinica Su Salud, Caracas`,
            "STATUS:CONFIRMED",
            "END:VEVENT",
            "END:VCALENDAR"
        ].join("\r\n");

        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Cita_${appt.doctorName.replace(/[^a-zA-Z0-9]/g, "_")}_${appt.date}.ics`;
        document.body.append(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });
}