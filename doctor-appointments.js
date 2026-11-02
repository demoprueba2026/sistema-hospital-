// ==========================================
// RENDERIZADO DE CITAS DESDE SUPABASE
// ==========================================
async function renderDoctorAppointments() {
    if (!currentDoctorObj) return;

    let doctorAppointments;
    try {
        doctorAppointments = await apiGetAppointments(currentDoctorObj.name);
    } catch (error) {
        appointmentsContainer.replaceChildren();
        portalEmptyState.hidden = false;
        portalEmptyState.querySelector("h3").textContent = "No se pudieron cargar las citas";
        portalEmptyState.querySelector("p").textContent = error.message;
        return;
    }

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
                <button type="button" class="btn-status-action delete" data-action="delete" title="Eliminar permanentemente el registro de este paciente">🗑 Eliminar paciente</button>
            </div>
        </div>
    `;

    card.querySelectorAll(".btn-status-action").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const nextStatus = btn.getAttribute("data-action");
            await updateAppointmentStatusAsync(appt.id, nextStatus);
        });
    });

    card.querySelector('[data-action="delete"]').addEventListener("click", async () => {
        await deletePatientAppointment(appt.id, appt.patientName);
    });

    return card;
}

async function deletePatientAppointment(appointmentId, patientName) {
    const confirmed = window.confirm(
        `¿Eliminar permanentemente el registro de ${patientName} de Supabase? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    try {
        await apiDeleteAppointment(appointmentId);
        await renderDoctorAppointments();
    } catch (error) {
        window.alert(error.message);
    }
}

async function updateAppointmentStatusAsync(apptId, newStatus) {
    try {
        await apiUpdateAppointmentStatus(apptId, newStatus);
        await renderDoctorAppointments();
    } catch (error) {
        window.alert(error.message);
        return;
    }

    if (newStatus !== "Confirmada") {
        return;
    }

    try {
        const response = await fetch("/api/send-confirmation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appointmentId: apptId })
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "No se pudo enviar el correo de confirmación.");
        }

        if (result.sent) {
            window.alert("La cita fue confirmada y se envió un correo al paciente.");
        } else if (result.alreadySent) {
            window.alert("Ya se había enviado un correo de confirmación para esta cita.");
        }
    } catch (error) {
        window.alert(`La cita quedó confirmada, pero no se pudo enviar el correo: ${error.message}`);
    }
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

    try {
        await apiSaveAppointment(newAppt);
        await renderDoctorAppointments();
    } catch (error) {
        window.alert(error.message);
    }
}

if (btnCreateTestAppt) btnCreateTestAppt.addEventListener("click", createTestAppointmentForDoctor);
if (btnSeedTest) btnSeedTest.addEventListener("click", createTestAppointmentForDoctor);

// Habilitar Realtime para que se actualice solo al haber cambios
apiSubscribeToAppointments(() => {
        if (currentDoctorObj) {
            renderDoctorAppointments();
        }
    }).catch((error) => {
        console.error("[Supabase Realtime] No se pudo establecer la suscripción:", error);
    });

// Inicializar sesión
checkSession();