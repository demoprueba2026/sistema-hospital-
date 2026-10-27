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

