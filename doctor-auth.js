// ==========================================
// AUTENTICACIÓN Y SESIÓN DEL ESPECIALISTA
// ==========================================
const toggleDoctorPin = document.querySelector("#toggle-doctor-pin");

function checkSession() {
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

    dashAvatar.textContent = initialsFor(doc.name);
    dashDoctorName.textContent = doc.name;
    dashSpecialty.textContent = doc.specialty;
    dashAvailability.textContent = `Horario asignado: ${doc.availability}`;

    doctorAuthBox.hidden = true;
    doctorDashboard.hidden = false;

    renderDoctorAppointments();
}

function logoutDoctor() {
    showLoginForm();
}

toggleDoctorPin.addEventListener("click", () => {
    const showPassword = doctorPin.type === "password";
    doctorPin.type = showPassword ? "text" : "password";
    toggleDoctorPin.textContent = showPassword ? "Ocultar" : "Mostrar";
    toggleDoctorPin.setAttribute("aria-label", showPassword ? "Ocultar clave de acceso" : "Mostrar clave de acceso");
    toggleDoctorPin.setAttribute("aria-pressed", String(showPassword));
});

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
