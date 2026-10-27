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

const DOCTOR_SESSION_KEY = "hdl_logged_doctor_name";

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

// Elementos de la barra de estado de Supabase
const supabaseStatusBar = document.querySelector("#supabase-status-bar");
const sbStatusDot = document.querySelector("#sb-status-dot");
const sbStatusText = document.querySelector("#sb-status-text");
const sbConfigToggle = document.querySelector("#sb-config-toggle");
const sbConfigPanel = document.querySelector("#supabase-config-panel");
const sbConfigClose = document.querySelector("#sb-config-close");
const sbUrlInput = document.querySelector("#sb-url-input");
const sbKeyInput = document.querySelector("#sb-key-input");
const sbSaveBtn = document.querySelector("#sb-save-btn");
const sbTestBtn = document.querySelector("#sb-test-btn");
const sbClearBtn = document.querySelector("#sb-clear-btn");
const sbConfigAlert = document.querySelector("#sb-config-alert");

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

async function updateSupabaseStatusUI() {
    if (!sbStatusDot || !sbStatusText) return;
    const creds = getSupabaseCredentials();
    if (!creds.isConfigured) {
        sbStatusDot.style.background = "#e53e3e";
        sbStatusText.textContent = "Supabase no configurado (usando modo local)";
        return;
    }
    sbStatusText.textContent = "Verificando conexión con Supabase…";
    const res = await testSupabaseConnection();
    if (res.connected) {
        sbStatusDot.style.background = "#319795";
        sbStatusText.textContent = "Conectado a Supabase (Sincronización en vivo activa)";
    } else {
        sbStatusDot.style.background = "#dd6b20";
        sbStatusText.textContent = "Sin conexión remota (respaldo local activo)";
    }
}

if (sbConfigToggle) {
    sbConfigToggle.addEventListener("click", () => {
        sbConfigPanel.hidden = !sbConfigPanel.hidden;
        if (!sbConfigPanel.hidden) {
            const creds = getSupabaseCredentials();
            if (sbUrlInput) sbUrlInput.value = creds.url.includes("TU_PROYECTO") ? "" : creds.url;
            if (sbKeyInput) sbKeyInput.value = creds.anonKey.includes("TU_SUPABASE_ANON_KEY") ? "" : creds.anonKey;
        }
    });
}

if (sbConfigClose) {
    sbConfigClose.addEventListener("click", () => { sbConfigPanel.hidden = true; });
}

if (sbSaveBtn) {
    sbSaveBtn.addEventListener("click", async () => {
        const url = sbUrlInput.value.trim();
        const key = sbKeyInput.value.trim();
        if (!url || !key) {
            sbConfigAlert.hidden = false;
            sbConfigAlert.textContent = "Ingresa la URL y la Key de Supabase.";
            return;
        }
        sbConfigAlert.hidden = true;
        saveCustomSupabaseCredentials(url, key);
        await updateSupabaseStatusUI();
        sbConfigPanel.hidden = true;
        if (currentDoctorObj) renderDoctorAppointments();
    });
}

if (sbTestBtn) {
    sbTestBtn.addEventListener("click", async () => {
        const res = await testSupabaseConnection();
        sbConfigAlert.hidden = false;
        sbConfigAlert.textContent = res.message;
        sbConfigAlert.style.background = res.connected ? "#e6f4ef" : "#fde8e8";
        sbConfigAlert.style.color = res.connected ? "#10635c" : "#b02a2a";
    });
}

if (sbClearBtn) {
    sbClearBtn.addEventListener("click", async () => {
        clearCustomSupabaseCredentials();
        if (sbUrlInput) sbUrlInput.value = "";
        if (sbKeyInput) sbKeyInput.value = "";
        sbConfigAlert.hidden = false;
        sbConfigAlert.textContent = "Credenciales borradas.";
        await updateSupabaseStatusUI();
    });
}

// ==========================================
// AUTENTICACIÓN Y SESIÓN DEL ESPECIALISTA
// ==========================================
function checkSession() {
    const loggedDoctorName = sessionStorage.getItem(DOCTOR_SESSION_KEY);
    if (loggedDoctorName) {
        const doc = findDoctorByName(loggedDoctorName);
        if (doc) {
            loginDoctor(doc);
            return;
        }
    }
    showLoginForm();
}

function showLoginForm() {
    currentDoctorObj = null;
    doctorAuthBox.hidden = false;
    doctorDashboard.hidden = true;
    populateDoctorSelect();
}

function loginDoctor(doc) {
    currentDoctorObj = doc;
    sessionStorage.setItem(DOCTOR_SESSION_KEY, doc.name);

    dashAvatar.textContent = initialsFor(doc.name);
    dashDoctorName.textContent = doc.name;
    dashSpecialty.textContent = doc.specialty;
    dashAvailability.textContent = `Horario asignado: ${doc.availability}`;

    doctorAuthBox.hidden = true;
    doctorDashboard.hidden = false;

    renderDoctorAppointments();
}

function logoutDoctor() {
    sessionStorage.removeItem(DOCTOR_SESSION_KEY);
    showLoginForm();
}

doctorLoginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const docName = doctorSelect.value;
    const pin = doctorPin.value.trim();

    if (!docName) {
        authAlert.hidden = false;
        authAlert.textContent = "Por favor selecciona tu nombre de especialista.";
        return;
    }

    if (!pin) {
        authAlert.hidden = false;
        authAlert.textContent = "Por favor ingresa tu clave de acceso médico.";
        return;
    }

    authAlert.hidden = true;
    const doc = findDoctorByName(docName);
    if (doc) {
        loginDoctor(doc);
    }
});

btnDoctorLogout.addEventListener("click", logoutDoctor);

// ==========================================
// RENDERIZADO DE CITAS DESDE SUPABASE
// ==========================================
async function renderDoctorAppointments() {
    if (!currentDoctorObj) return;

    // Consulta DIRECTAMENTE a Supabase (filtrando por el doctor actual para seguridad)
    const doctorAppointments = await apiGetAppointments(currentDoctorObj.name);

    const todayStr = new Date().toISOString().split("T")[0];
    const totalCount = doctorAppointments.length;
    const todayCount = doctorAppointments.filter((a) => a.date === todayStr).length;
    const pendingCount = doctorAppointments.filter((a) => a.status === "Pendiente").length;
    const confirmedCount = doctorAppointments.filter((a) => a.status === "Confirmada").length;
    const attendedCount = doctorAppointments.filter((a) => a.status === "Atendida").length;
    const cancelledCount = doctorAppointments.filter((a) => a.status === "Cancelada").length;

    statTotal.textContent = totalCount;
    statToday.textContent = todayCount;
    statPending.textContent = pendingCount;
    statAttended.textContent = attendedCount;

    countAll.textContent = totalCount;
    countPending.textContent = pendingCount;
    countConfirmed.textContent = confirmedCount;
    countAttended.textContent = attendedCount;
    countCancelled.textContent = cancelledCount;

    let filtered = doctorAppointments;

    if (activeStatusFilter !== "all") {
        filtered = filtered.filter((a) => a.status === activeStatusFilter);
    }

    if (activeSearchQuery) {
        const query = activeSearchQuery.toLowerCase();
        filtered = filtered.filter((a) => (
            a.patientName.toLowerCase().includes(query) ||
            a.patientPhone.toLowerCase().includes(query) ||
            a.patientEmail.toLowerCase().includes(query) ||
            a.notes.toLowerCase().includes(query) ||
            (a.code && a.code.toLowerCase().includes(query))
        ));
    }

    appointmentsContainer.innerHTML = "";

    if (filtered.length === 0) {
        portalEmptyState.hidden = false;
        return;
    }

    portalEmptyState.hidden = true;

    filtered.forEach((appt) => {
        const card = createAppointmentCard(appt);
        appointmentsContainer.append(card);
    });
}

function createAppointmentCard(appt) {
    const card = document.createElement("article");
    card.className = "portal-card";

    const parts = (appt.date || "").split("-");
    let formattedDate = appt.date;
    if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        formattedDate = d.toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
        formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    }

    const cleanPhone = (appt.patientPhone || "").replace(/[^0-9+]/g, "");

    card.innerHTML = `
        <div class="portal-card-top">
            <div class="patient-main-info">
                <h3>${appt.patientName}</h3>
                <div class="patient-meta-tags">
                    <span class="meta-tag">🎂 ${appt.patientAge || "?"} años</span>
                    <span class="meta-tag">🔖 Código: ${appt.code || "S/C"}</span>
                </div>
            </div>
            <div class="appt-datetime-pill">
                <span>📅 ${formattedDate}</span>
                <span>⏰ ${appt.time}</span>
            </div>
        </div>

        <div class="patient-contact-row">
            <span><strong>Contacto:</strong></span>
            <a class="contact-link" href="tel:${cleanPhone}" title="Llamar directamente">📞 ${appt.patientPhone}</a>
            <a class="contact-link" href="https://wa.me/${cleanPhone.replace('+', '')}" target="_blank" rel="noopener" title="Escribir por WhatsApp">💬 WhatsApp</a>
            <a class="contact-link" href="mailto:${appt.patientEmail}" title="Enviar correo">✉️ ${appt.patientEmail}</a>
        </div>

        <div class="patient-notes-box">
            <strong>Motivo de la consulta reportado por el paciente:</strong>
            <p>${appt.notes || "Sin motivo especificado."}</p>
        </div>

        <div class="portal-card-footer">
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:13.5px; color:#5b7771; font-weight:700;">Estado de la cita:</span>
                <span class="status-badge ${appt.status}">${appt.status}</span>
            </div>

            <div class="doctor-actions-row">
                <span style="font-size:13px; color:#607c77; margin-right:4px;">Cambiar estado:</span>
                <button type="button" class="btn-status-action confirm" data-action="Confirmada" title="Confirmar esta cita">✓ Confirmar</button>
                <button type="button" class="btn-status-action attend" data-action="Atendida" title="Marcar como atendida en consulta">🩺 Atendida</button>
                <button type="button" class="btn-status-action cancel" data-action="Cancelada" title="Cancelar esta cita">✕ Cancelar</button>
            </div>
        </div>
    `;

    card.querySelectorAll(".btn-status-action").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const nextStatus = btn.getAttribute("data-action");
            await updateAppointmentStatusAsync(appt.id, nextStatus);
        });
    });

    return card;
}

async function updateAppointmentStatusAsync(apptId, newStatus) {
    await apiUpdateAppointmentStatus(apptId, newStatus);
    await renderDoctorAppointments();
}

// Filtros y búsqueda
filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
        filterPills.forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        activeStatusFilter = pill.getAttribute("data-filter");
        renderDoctorAppointments();
    });
});

filterSearch.addEventListener("input", (e) => {
    activeSearchQuery = e.target.value.trim();
    renderDoctorAppointments();
});

// Crear cita de prueba rápida sincronizada en Supabase
async function createTestAppointmentForDoctor() {
    if (!currentDoctorObj) return;

    const names = ["Gabriel Benítez", "Ana María Colmenares", "José Gregorio Rivas", "Daniela Uzcátegui"];
    const reasons = [
        "Control rutinario semestral y chequeo general preventivo.",
        "Molestias persistentes desde hace dos semanas, solicita evaluación especializada.",
        "Seguimiento de tratamiento farmacológico y renovación de récipe médico.",
        "Dolor moderado que aumenta con la actividad física, requiere diagnóstico clínico."
    ];

    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
    const randomAge = Math.floor(22 + Math.random() * 45);
    const code = `HDL-${Math.floor(1000 + Math.random() * 9000)}`;

    const today = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    const newAppt = {
        id: `cita_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        code,
        doctorName: currentDoctorObj.name,
        specialty: currentDoctorObj.specialty,
        date: dateStr,
        time: "10:00 a. m.",
        patientName: randomName,
        patientEmail: `${randomName.toLowerCase().replace(/\s+/g, ".")}@correo.com`,
        patientPhone: `0414-${Math.floor(1000000 + Math.random() * 9000000)}`,
        patientAge: randomAge,
        notes: randomReason,
        status: "Pendiente",
        doctorNotes: "",
        createdAt: new Date().toISOString()
    };

    await apiSaveAppointment(newAppt);
    await renderDoctorAppointments();
}

if (btnCreateTestAppt) btnCreateTestAppt.addEventListener("click", createTestAppointmentForDoctor);
if (btnSeedTest) btnSeedTest.addEventListener("click", createTestAppointmentForDoctor);

// Habilitar Realtime para que se actualice solo al haber cambios
try {
    apiSubscribeToAppointments(() => {
        if (currentDoctorObj) {
            renderDoctorAppointments();
        }
    });
} catch (_) {}

// Inicializar estado y sesión
updateSupabaseStatusUI();
checkSession();