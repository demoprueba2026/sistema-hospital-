// Envío del formulario (async para Supabase)
if (appointmentForm) {
    appointmentForm.addEventListener("submit", async (e) => {
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

        // Deshabilitar botón mientras guarda
        const saveBtn = document.querySelector("#modal-btn-save");
        const originalHTML = saveBtn ? saveBtn.innerHTML : "";
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = "<span>Guardando…</span>";
        }

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

        // Guardar en Supabase (con fallback automático a localStorage)
        const result = await saveAppointment(appointment);
        lastCreatedAppointment = appointment;

        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalHTML;
        }

        // Mostrar badge de dónde se guardó
        const storageNote = (result && result.savedInSupabase)
            ? "✓ Guardado en Supabase"
            : "⚠ Guardado localmente (Supabase no configurado)";

        document.querySelector("#rec-doctor").textContent = appointment.doctorName;
        document.querySelector("#rec-specialty").textContent = appointment.specialty;
        document.querySelector("#rec-date").textContent = selectedDateLabel.textContent;
        document.querySelector("#rec-time").textContent = appointment.time;
        document.querySelector("#rec-patient").textContent = `${appointment.patientName} (${appointment.patientAge} años)`;
        document.querySelector("#rec-phone").textContent = appointment.patientPhone;
        document.querySelector("#rec-code").textContent = appointment.code;

        // Mostrar nota de almacenamiento en el recibo
        const storageEl = document.querySelector("#rec-storage-note");
        if (storageEl) storageEl.textContent = storageNote;

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