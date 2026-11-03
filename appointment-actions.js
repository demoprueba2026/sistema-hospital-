// Envío del formulario (async para Supabase)
if (appointmentForm) {
    appointmentForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.querySelector("#patient-name").value.trim();
        const email = document.querySelector("#patient-email").value.trim();
        const phone = document.querySelector("#patient-phone").value.trim();
        const age = document.querySelector("#patient-age").value.trim();
        const category = document.querySelector("#appointment-category").value;
        const notesDetail = document.querySelector("#appointment-notes").value.trim();
        const notes = `Tipo de consulta: ${category}\n\nDetalle: ${notesDetail}`;
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
            category,
            patientId: document.querySelector("#patient-id").value.trim(),
            insurance: document.querySelector("#patient-insurance").value,
            notes,
            status: "Pendiente",
            doctorNotes: "",
            createdAt: new Date().toISOString()
        };

        try {
            const result = await saveAppointment(appointment);
            if (!result.success || !result.savedInSupabase) {
                throw new Error("Supabase no confirmó el registro de la cita.");
            }
            lastCreatedAppointment = appointment;

            document.querySelector("#rec-doctor").textContent = appointment.doctorName;
            document.querySelector("#rec-specialty").textContent = appointment.specialty;
            document.querySelector("#rec-date").textContent = selectedDateLabel.textContent;
            document.querySelector("#rec-time").textContent = appointment.time;
            document.querySelector("#rec-category").textContent = appointment.category;
            document.querySelector("#rec-patient").textContent = `${appointment.patientName} (${appointment.patientAge} años)`;
            document.querySelector("#rec-cedula").textContent = appointment.patientId || "No indicado";
            document.querySelector("#rec-phone").textContent = appointment.patientPhone;
            document.querySelector("#rec-code").textContent = appointment.code;

            const storageEl = document.querySelector("#rec-storage-note");
            if (storageEl) storageEl.textContent = "✓ Guardado en Supabase";

            appointmentForm.hidden = true;
            modalSuccessView.hidden = false;
        } catch (error) {
            formAlert.hidden = false;
            formAlert.textContent = `No se pudo guardar la cita en Supabase. ${error.message}`;
            if (error.message.includes("Ese horario acaba de ser reservado")) {
                await renderTimeSlots();
            }
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalHTML;
            }
        }
    });
}
