// ==========================================
// AUTENTICACIÓN Y SESIÓN DEL ESPECIALISTA
// ==========================================
const toggleDoctorPin = document.querySelector("#toggle-doctor-pin");
const doctorEmail = document.querySelector("#doctor-email");
let currentDoctorSupabaseAuthenticated = false;

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
    currentDoctorSupabaseAuthenticated = true;

    dashAvatar.textContent = initialsFor(doc.name);
    dashDoctorName.textContent = doc.name;
    dashSpecialty.textContent = doc.specialty;
    dashAvailability.textContent = `Horario asignado: ${doc.availability}`;

    doctorAuthBox.hidden = true;
    doctorDashboard.hidden = false;

    renderDoctorAppointments();
}

async function logoutDoctor() {
    if (currentDoctorSupabaseAuthenticated) {
        try {
            await apiSignOutDoctor();
        } catch (error) {
            window.alert(error.message);
            return;
        }
    }
    currentDoctorSupabaseAuthenticated = false;
    doctorEmail.value = "";
    doctorPin.value = "";
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
        authAlert.textContent = "Por favor ingresa la contraseña de tu cuenta de Supabase Auth.";
        return;
    }

    const email = doctorEmail.value.trim();
    if (!email) {
        authAlert.hidden = false;
        authAlert.textContent = "Por favor ingresa el correo de tu cuenta de Supabase Auth.";
        return;
    }

    const doc = findDoctorByName(docName);
    if (doc) {
        authAlert.hidden = true;
        apiSignInDoctor(email, pin, doc.name)
            .then(() => {
                authAlert.hidden = true;
                loginDoctor(doc);
                doctorEmail.value = "";
                doctorPin.value = "";
            })
            .catch((error) => {
                authAlert.hidden = false;
                authAlert.textContent = error.message;
            });
    }
});

btnDoctorLogout.addEventListener("click", logoutDoctor);
