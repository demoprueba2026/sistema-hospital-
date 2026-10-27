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
}

const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
updateTheme(prefersDark);

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
// ALMAsCENAMIENTO REMOTO DE CITAS MÉDICAS EN SUPABASE
// ==========================================

function saveAppointment(appointment) {
    return apiSaveAppointment(appointment);
}

// ==========================================
