// ==========================================
// PORTAL DE MÉDICOS ESPECIALISTAS - JAVASCRIPT (CON SUPABASE)
// ==========================================

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

// Elementos DOM
const themeToggle = document.querySelector("#theme-toggle");
const doctorAuthBox = document.querySelector("#doctor-auth-box");
const doctorDashboard = document.querySelector("#doctor-dashboard");
const doctorLoginForm = document.querySelector("#doctor-login-form");
const doctorSelect = document.querySelector("#doctor-select");
const doctorPin = document.querySelector("#doctor-pin");
const authAlert = document.querySelector("#auth-alert");

const dashAvatar = document.querySelector("#dash-avatar");
const dashDoctorName = document.querySelector("#dash-doctor-name");
const dashSpecialty = document.querySelector("#dash-specialty");
const dashAvailability = document.querySelector("#dash-availability");
const btnDoctorLogout = document.querySelector("#btn-doctor-logout");
const btnCreateTestAppt = document.querySelector("#btn-create-test-appt");
const btnSeedTest = document.querySelector("#btn-seed-empty");

const statTotal = document.querySelector("#stat-total");
const statToday = document.querySelector("#stat-today");
const statPending = document.querySelector("#stat-pending");
const statAttended = document.querySelector("#stat-attended");

const countAll = document.querySelector("#count-all");
const countPending = document.querySelector("#count-pending");
const countConfirmed = document.querySelector("#count-confirmed");
const countAttended = document.querySelector("#count-attended");
const countCancelled = document.querySelector("#count-cancelled");

const filterSearch = document.querySelector("#filter-search");
const filterPills = document.querySelectorAll(".filter-pill");
const appointmentsContainer = document.querySelector("#appointments-container");
const portalEmptyState = document.querySelector("#portal-empty-state");

let currentDoctorObj = null;
let activeStatusFilter = "all";
let activeSearchQuery = "";

// ==========================================
// TEMA OSCURO / CLARO
// ==========================================
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

// ==========================================
// UTILIDADES Y SUPABASE STATUS BAR
// ==========================================
function initialsFor(name) {
    return name
        .replace(/^(Dra?\. )/, "")
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

function findDoctorByName(name) {
    for (const [specialty, docs] of Object.entries(doctorsBySpecialty)) {
        const found = docs.find((d) => d.name.toLowerCase() === name.toLowerCase());
        if (found) {
            return { ...found, specialty };
        }
    }
    return null;
}

function populateDoctorSelect() {
    doctorSelect.innerHTML = '<option value="">-- Elige tu nombre y especialidad --</option>';
    Object.entries(doctorsBySpecialty).forEach(([specialty, docs]) => {
        const optgroup = document.createElement("optgroup");
        optgroup.label = specialty;
        docs.forEach((doc) => {
            const opt = document.createElement("option");
            opt.value = doc.name;
            opt.textContent = `${doc.name} (${specialty})`;
            optgroup.append(opt);
        });
        doctorSelect.append(optgroup);
    });
}
