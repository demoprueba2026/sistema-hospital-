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
const emptyStateActions = document.querySelector("#empty-state-actions");
const doctorSkeletonGrid = document.querySelector("#doctor-skeleton-grid");
const nextWeekAvailabilityButton = document.querySelector("#btn-next-week-availability");
const notifyAvailabilityButton = document.querySelector("#btn-notify-availability");
let currentDoctorOpenings = [];
let currentDoctorAvailability = [];
let currentAvailabilityError = false;
let doctorResultsRequestId = 0;
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
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", isDark ? "Activar tema claro" : "Activar tema oscuro");
    themeToggle.querySelector(".theme-icon").textContent = isDark ? "☀" : "☾";
    themeToggle.querySelector(".theme-label").textContent = isDark ? "Tema claro" : "Tema oscuro";
    document.querySelector('meta[name="theme-color"]').content = isDark ? "#102321" : "#f7fbfa";
}

const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
updateTheme(savedTheme ? savedTheme === "dark" : prefersDark);

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
    card.className = "doctor-card";

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
    const opening = currentDoctorOpenings.find((item) => item.doctor.name === doctor.name);
    const nextSlot = document.createElement("span");
    nextSlot.className = "doctor-next-slot";
    nextSlot.textContent = opening
        ? `Próximo cupo: ${opening.label}`
        : currentAvailabilityError
            ? "No se pudo consultar la disponibilidad"
            : "Sin cupos en los próximos 14 días";

    const bookButton = document.createElement("button");
    bookButton.type = "button";
    bookButton.className = "doctor-book-button";
    bookButton.textContent = "Agendar cita";
    bookButton.setAttribute("aria-label", `Agendar cita con ${doctor.name}`);
    bookButton.addEventListener("click", () => openAppointmentModal(doctor, specialty));
    cta.append(nextSlot, bookButton);

    card.append(top, availability, cta);

    return card;
}

function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function isDoctorSlotInFuture(dateValue, timeValue, now = new Date()) {
    const todayValue = localDateString(now);
    if (dateValue !== todayValue) return dateValue > todayValue;

    const match = timeValue.match(/(\d{1,2}):(\d{2})\s*([ap])\.\s*m\./i);
    if (!match) return false;

    let hours = Number(match[1]) % 12;
    if (match[3].toLowerCase() === "p") hours += 12;
    const slotMinutes = hours * 60 + Number(match[2]);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return slotMinutes > currentMinutes;
}

function formatOpeningLabel(date, time) {
    const dateLabel = date.toLocaleDateString("es-VE", {
        weekday: "short",
        day: "numeric",
        month: "short"
    });
    return `${dateLabel} · ${time}`;
}

function getDoctorOpenings(doctors, bookedSlots) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const booked = new Set(bookedSlots.map((slot) => (
        `${slot.doctor_name.trim().toLowerCase()}|${slot.date}|${slot.time.trim().toLowerCase()}`
    )));

    return doctors.map((doctor) => {
        const workingDays = parseDoctorWorkingDays(doctor.availability);
        const slots = generateDoctorTimeSlots(doctor.availability);
        let nextOpening = null;
        let nextWeekOpening = null;
        let hasOpeningThisWeek = false;

        for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
            const date = new Date(today);
            date.setDate(today.getDate() + dayOffset);
            if (!workingDays.includes(date.getDay())) continue;

            const dateValue = localDateString(date);
            const availableTime = slots.find((time) => (
                isDoctorSlotInFuture(dateValue, time) &&
                !booked.has(`${doctor.name.trim().toLowerCase()}|${dateValue}|${time.trim().toLowerCase()}`)
            ));

            if (availableTime) {
                const opening = {
                        doctor,
                        date: dateValue,
                        time: availableTime,
                        label: formatOpeningLabel(date, availableTime)
                };
                if (!nextOpening) {
                    nextOpening = opening;
                }
                if (dayOffset >= 7 && !nextWeekOpening) {
                    nextWeekOpening = opening;
                }
                if (dayOffset < 7) hasOpeningThisWeek = true;
            }
        }

        return { doctor, nextOpening, nextWeekOpening, hasOpeningThisWeek };
    });
}

async function renderDoctorResults() {
    const requestId = ++doctorResultsRequestId;
    const specialty = specialtySelect.value;
    const emptyTitle = document.querySelector("#empty-state-title");
    const emptyMessage = document.querySelector("#empty-state-message");
    const emptyArrow = emptyState.querySelector(".empty-arrow");

    if (!specialty) {
        doctorGrid.replaceChildren();
        doctorResults.hidden = true;
        doctorSkeletonGrid.hidden = true;
        emptyState.hidden = false;
        emptyStateActions.hidden = true;
        emptyTitle.textContent = "Tu bienestar comienza aquí";
        emptyMessage.textContent = "Elige una especialidad para ver los médicos disponibles en esa área.";
        emptyArrow.hidden = false;
        return;
    }

    const doctors = doctorsBySpecialty[specialty] || [];

    if (doctors.length === 0) {
        doctorGrid.replaceChildren();
        doctorResults.hidden = true;
        doctorSkeletonGrid.hidden = true;
        emptyState.hidden = false;
        emptyStateActions.hidden = true;
        emptyTitle.textContent = "No hay profesionales disponibles";
        emptyMessage.textContent = `No hay profesionales disponibles para ${specialty} en este momento.`;
        emptyArrow.hidden = true;
        return;
    }

    emptyState.hidden = true;
    doctorResults.hidden = true;
    doctorSkeletonGrid.hidden = false;
    doctorSkeletonGrid.setAttribute("aria-busy", "true");

    let bookedSlots = [];
    let availabilityError = null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 13);

    try {
        bookedSlots = await apiGetBookedDoctorSlots(
            doctors.map((doctor) => doctor.name),
            localDateString(today),
            localDateString(endDate)
        );
    } catch (error) {
        availabilityError = error;
    }

    if (requestId !== doctorResultsRequestId || specialtySelect.value !== specialty) return;

    doctorSkeletonGrid.hidden = true;
    doctorSkeletonGrid.removeAttribute("aria-busy");
    resultsTitle.textContent = specialty;
    doctorCount.textContent = `${doctors.length} ${doctors.length === 1 ? "profesional" : "profesionales"}`;
    currentAvailabilityError = Boolean(availabilityError);
    currentDoctorAvailability = availabilityError
        ? []
        : getDoctorOpenings(doctors, bookedSlots);
    currentDoctorOpenings = currentDoctorAvailability
        .map((item) => item.nextOpening)
        .filter(Boolean);
    doctorGrid.replaceChildren(...doctors.map((doctor) => createDoctorCard(doctor, specialty)));
    doctorResults.hidden = false;

    const openingByDoctor = currentDoctorAvailability;
    const hasOpeningThisWeek = openingByDoctor.some((item) => item.hasOpeningThisWeek);
    const hasOpeningNextWeek = openingByDoctor.some((item) => item.nextWeekOpening);

    if (availabilityError || !hasOpeningThisWeek) {
        emptyState.hidden = false;
        emptyArrow.hidden = true;
        emptyStateActions.hidden = availabilityError;
        if (availabilityError) {
            emptyTitle.textContent = "No pudimos consultar los cupos";
            emptyMessage.textContent = "Revisa tu conexión e inténtalo de nuevo. Los horarios se verificarán nuevamente al agendar.";
        } else {
            emptyTitle.textContent = `No hay cupos disponibles esta semana para ${specialty}`;
            emptyMessage.textContent = hasOpeningNextWeek
                ? "Puedes revisar la próxima semana o solicitar que te avisemos desde este dispositivo."
                : "No encontramos horarios libres en los próximos 14 días.";
            nextWeekAvailabilityButton.disabled = !hasOpeningNextWeek;
        }
    } else {
        emptyState.hidden = true;
        emptyStateActions.hidden = true;
    }
}

specialtySelect.addEventListener("change", renderDoctorResults);
nextWeekAvailabilityButton.addEventListener("click", async () => {
    const specialty = specialtySelect.value;
    const nextOpening = currentDoctorAvailability
        .map((item) => item.nextWeekOpening)
        .filter(Boolean)
        .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (!specialty || currentAvailabilityError || !nextOpening) return;

    openAppointmentModal(nextOpening.doctor, specialty);
    const [year, month] = nextOpening.date.split("-").map(Number);
    calCurrentYear = year;
    calCurrentMonth = month - 1;
    selectDate(nextOpening.date);
    renderCalendar();
    setWizardStep(2);
});

notifyAvailabilityButton.addEventListener("click", () => {
    const notifyModal = document.querySelector("#notify-modal");
    document.querySelector("#notify-specialty-input").value = specialtySelect.value;
    document.querySelector("#notify-status").hidden = true;
    notifyModal.showModal();
});

const notifyForm = document.querySelector("#notify-form");
const notifyModal = document.querySelector("#notify-modal");
const notifyStatus = document.querySelector("#notify-status");
const savedAvailabilityAlertsKey = "clinic_availability_alerts";
let availabilityAlertTimer = null;

function readAvailabilityAlerts() {
    try {
        const alerts = JSON.parse(localStorage.getItem(savedAvailabilityAlertsKey) || "[]");
        if (!Array.isArray(alerts)) {
            throw new Error("La lista de alertas guardada no tiene un formato válido.");
        }
        return alerts.map((alert) => {
            if (typeof alert === "string") {
                return { specialty: alert, observedBookedSlots: null };
            }
            if (
                !alert ||
                typeof alert.specialty !== "string" ||
                (alert.observedBookedSlots !== null &&
                    (!Array.isArray(alert.observedBookedSlots) ||
                        alert.observedBookedSlots.some((slot) => typeof slot !== "string")))
            ) {
                throw new Error("La lista de alertas guardada no tiene un formato válido.");
            }
            return alert;
        });
    } catch (error) {
        throw new Error(`No se pudieron leer tus alertas guardadas: ${error.message}`);
    }
}

async function checkAvailabilityAlerts() {
    let alerts;
    try {
        alerts = readAvailabilityAlerts();
    } catch (error) {
        notifyStatus.hidden = false;
        notifyStatus.textContent = error.message;
        return;
    }
    if (alerts.length === 0) return;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 13);

    try {
        const upcomingBookings = await apiGetBookedDoctorSlots(
            alerts.flatMap((specialty) => (doctorsBySpecialty[specialty] || []).map((doctor) => doctor.name)),
            localDateString(start),
            localDateString(end)
        );

        const readyAlerts = [];
        const refreshedAlerts = alerts.filter((alert) => {
            const doctors = doctorsBySpecialty[alert.specialty];
            if (!doctors) {
                throw new Error(`La especialidad guardada "${alert.specialty}" ya no está disponible.`);
            }
            const doctorNames = new Set(doctors.map((doctor) => doctor.name.trim().toLowerCase()));
            const bookedSlots = upcomingBookings
                .filter((slot) => doctorNames.has(slot.doctor_name.trim().toLowerCase()))
                .map((slot) => (
                    `${slot.doctor_name.trim().toLowerCase()}|${slot.date}|${slot.time.trim().toLowerCase()}`
                ));
            const bookedNow = new Set(bookedSlots);
            const newlyAvailable = alert.observedBookedSlots &&
                alert.observedBookedSlots.some((slotKey) => {
                    const [, date] = slotKey.split("|");
                    return date >= localDateString(start) && !bookedNow.has(slotKey);
                });
            if (newlyAvailable) {
                readyAlerts.push(alert.specialty);
                return false;
            }
            alert.observedBookedSlots = bookedSlots;
            return true;
        });
        localStorage.setItem(savedAvailabilityAlertsKey, JSON.stringify(refreshedAlerts));
        if (readyAlerts.length === 0) return;

        readyAlerts.forEach((specialty) => {
            new Notification("Hay nuevos horarios disponibles", {
                body: `Se liberó un horario para ${specialty}. Abre la página para elegirlo.`,
                tag: `clinic-availability-${specialty}`
            });
        });
    } catch (error) {
        console.error("No se pudieron comprobar las alertas de disponibilidad:", error);
    }
}

function startAvailabilityAlertChecks() {
    if (availabilityAlertTimer) return;
    checkAvailabilityAlerts();
    availabilityAlertTimer = window.setInterval(checkAvailabilityAlerts, 5 * 60 * 1000);
}

notifyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const specialty = document.querySelector("#notify-specialty-input").value;
    if (!doctorsBySpecialty[specialty]) {
        notifyStatus.hidden = false;
        notifyStatus.textContent = "Selecciona una especialidad válida para activar la alerta.";
        return;
    }
    if (!("Notification" in window)) {
        notifyStatus.hidden = false;
        notifyStatus.textContent = "Este navegador no admite notificaciones. Puedes revisar los horarios desde la página.";
        return;
    }

    const permission = Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();
    if (permission !== "granted") {
        notifyStatus.hidden = false;
        notifyStatus.textContent = "No se concedió permiso para mostrar alertas en este navegador.";
        return;
    }

    try {
        const alerts = readAvailabilityAlerts();
        if (!alerts.some((alert) => alert.specialty === specialty)) {
            alerts.push({ specialty, observedBookedSlots: null });
            localStorage.setItem(savedAvailabilityAlertsKey, JSON.stringify(alerts));
        }
    } catch (error) {
        notifyStatus.hidden = false;
        notifyStatus.textContent = error.message;
        return;
    }

    notifyStatus.hidden = false;
    notifyStatus.textContent = "Alerta activada en este navegador. Mantén esta página abierta para recibir el aviso.";
    startAvailabilityAlertChecks();
});

if ("Notification" in window && Notification.permission === "granted") {
    startAvailabilityAlertChecks();
}

document.querySelector("#notify-modal-close").addEventListener("click", () => notifyModal.close());
document.querySelector("#btn-cancel-notify").addEventListener("click", () => notifyModal.close());

// ==========================================
// ALMAsCENAMIENTO REMOTO DE CITAS MÉDICAS EN SUPABASE
// ==========================================

function saveAppointment(appointment) {
    return apiSaveAppointment(appointment);
}

// ==========================================
