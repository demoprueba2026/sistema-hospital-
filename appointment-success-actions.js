const downloadPdfButton = document.querySelector("#btn-download-pdf");
const shareAppointmentButton = document.querySelector("#btn-share-whatsapp");

function escapeCalendarValue(value) {
    return String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/\r?\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
}

function toCalendarTimestamp(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
        "T",
        String(date.getHours()).padStart(2, "0"),
        String(date.getMinutes()).padStart(2, "0"),
        "00"
    ].join("");
}

function getAppointmentDateTimes(appointment) {
    const timeMatch = appointment.time.match(/(\d{1,2}):(\d{2})\s*([ap])\.\s*m\./i);
    if (!timeMatch) {
        throw new Error("No se pudo interpretar la hora de la cita para crear el evento.");
    }

    let hours = Number(timeMatch[1]) % 12;
    if (timeMatch[3].toLowerCase() === "p") hours += 12;
    const [year, month, day] = appointment.date.split("-").map(Number);
    const start = new Date(year, month - 1, day, hours, Number(timeMatch[2]));
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    return { start, end };
}

document.querySelector("#btn-export-ics").addEventListener("click", () => {
    if (!lastCreatedAppointment) return;

    let appointmentDateTimes;
    try {
        appointmentDateTimes = getAppointmentDateTimes(lastCreatedAppointment);
    } catch (error) {
        window.alert(error.message);
        return;
    }

    const appointment = lastCreatedAppointment;
    const content = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Clinica Su Salud//Citas Medicas//ES",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        `UID:${escapeCalendarValue(appointment.id)}@clinicasusalud.com`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
        `DTSTART:${toCalendarTimestamp(appointmentDateTimes.start)}`,
        `DTEND:${toCalendarTimestamp(appointmentDateTimes.end)}`,
        `SUMMARY:${escapeCalendarValue(`Cita médica: ${appointment.specialty} - ${appointment.doctorName}`)}`,
        `DESCRIPTION:${escapeCalendarValue(`${appointment.patientName} · ${appointment.category} · Código ${appointment.code}`)}`,
        `LOCATION:${escapeCalendarValue("Clínica Su Salud, Sede Principal, Consultorio 4B, Caracas")}`,
        "STATUS:TENTATIVE",
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Cita_${appointment.date}.ics`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});

downloadPdfButton.addEventListener("click", () => {
    document.body.classList.add("printing-receipt");
    const clearPrintMode = () => document.body.classList.remove("printing-receipt");
    window.addEventListener("afterprint", clearPrintMode, { once: true });
    window.print();
    window.setTimeout(clearPrintMode, 1000);
});

shareAppointmentButton.addEventListener("click", async () => {
    if (!lastCreatedAppointment) return;
    const appointment = lastCreatedAppointment;
    const summary = [
        "Solicitud de cita médica — Clínica Su Salud",
        `Especialista: ${appointment.doctorName}`,
        `Especialidad: ${appointment.specialty}`,
        `Fecha: ${document.querySelector("#rec-date").textContent}`,
        `Hora: ${appointment.time}`,
        `Tipo: ${appointment.category}`,
        `Código: ${appointment.code}`,
        "La cita queda sujeta a confirmación del especialista."
    ].join("\n");

    if (navigator.share) {
        try {
            await navigator.share({ title: "Detalles de mi cita", text: summary });
        } catch (error) {
            if (error.name !== "AbortError") {
                window.alert(`No se pudo compartir la cita: ${error.message}`);
            }
        }
        return;
    }

    if (!navigator.clipboard) {
        window.alert("Este navegador no permite compartir ni copiar el resumen de la cita.");
        return;
    }
    try {
        await navigator.clipboard.writeText(summary);
        window.alert("Resumen copiado. Ya puedes pegarlo en WhatsApp u otra aplicación.");
    } catch (error) {
        window.alert(`No se pudo copiar el resumen: ${error.message}`);
    }
});
