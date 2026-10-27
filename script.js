const doctorsBySpecialty = {
    "Cardiología": [
        { name: "Dra. Valentina Rojas", availability: "Lunes y miércoles · 8:00 a. m. – 1:00 p. m." },
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

    const identity = document.createElement("div");
    const name = document.createElement("h4");
    name.className = "doctor-name";
    name.textContent = doctor.name;

    const specialtyLabel = document.createElement("p");
    specialtyLabel.className = "doctor-specialty";
    specialtyLabel.textContent = specialty;

    identity.append(name, specialtyLabel);
    top.append(avatar, identity);

    const availability = document.createElement("div");
    availability.className = "doctor-availability";

    const dot = document.createElement("span");
    dot.className = "availability-dot";
    dot.setAttribute("aria-hidden", "true");

    const schedule = document.createElement("span");
    schedule.textContent = doctor.availability;
    availability.append(dot, schedule);

    card.append(top, availability);
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