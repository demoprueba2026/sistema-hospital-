const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");

function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    })[character]);
}

module.exports = async function handler(request, response) {
    response.setHeader("Cache-Control", "no-store");

    if (request.method !== "POST") {
        response.setHeader("Allow", "POST");
        return response.status(405).json({ error: "Método no permitido." });
    }

    const {
        SUPABASE_URL,
        SUPABASE_SECRET_KEY,
        SUPABASE_SERVICE_ROLE_KEY,
        GMAIL_USER,
        GMAIL_APP_PASSWORD
    } = process.env;
    const elevatedSupabaseKey = SUPABASE_SECRET_KEY || SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !elevatedSupabaseKey || !GMAIL_USER || !GMAIL_APP_PASSWORD) {
        return response.status(503).json({
            error: "Faltan variables de Supabase o Gmail en Vercel."
        });
    }

    let hasServiceRole = elevatedSupabaseKey.startsWith("sb_secret_");
    const keyParts = elevatedSupabaseKey.split(".");
    if (!hasServiceRole && keyParts.length === 3) {
        try {
            const payload = keyParts[1].replace(/-/g, "+").replace(/_/g, "/");
            hasServiceRole = JSON.parse(Buffer.from(payload, "base64").toString("utf8")).role === "service_role";
        } catch (_error) {
            hasServiceRole = false;
        }
    }
    if (!hasServiceRole) {
        return response.status(503).json({
            error: "SUPABASE_SECRET_KEY debe ser una clave secreta de servidor de Supabase."
        });
    }

    const appointmentId = request.body && request.body.appointmentId;
    if (typeof appointmentId !== "string" || !appointmentId.trim()) {
        return response.status(400).json({ error: "Falta el identificador de la cita." });
    }

    const supabaseUrl = SUPABASE_URL.replace(/\/+$/, "");
    const supabase = createClient(supabaseUrl, elevatedSupabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
    let claimedAt = null;

    try {
        const { data: appointment, error: appointmentError } = await supabase
            .from("citas")
            .select("id,status,patient_name,patient_email,doctor_name,specialty,date,time,code,confirmation_email_sent_at")
            .eq("id", appointmentId)
            .maybeSingle();

        if (appointmentError) {
            throw new Error("No se pudo verificar la cita en Supabase.");
        }
        if (!appointment) {
            return response.status(404).json({ error: "No se encontró la cita." });
        }
        if (appointment.status !== "Confirmada") {
            return response.status(409).json({ error: "La cita todavía no está confirmada." });
        }
        if (!appointment.patient_email) {
            return response.status(400).json({ error: "La cita no tiene un correo de paciente." });
        }

        claimedAt = new Date().toISOString();
        const { data: claimedAppointments, error: claimError } = await supabase
            .from("citas")
            .update({ confirmation_email_sent_at: claimedAt })
            .eq("id", appointmentId)
            .eq("status", "Confirmada")
            .is("confirmation_email_sent_at", null)
            .select("id");

        if (claimError) {
            throw new Error("No se pudo reservar el envío del correo en Supabase.");
        }
        if (claimedAppointments.length === 0) {
            return response.status(200).json({ sent: false, alreadySent: true });
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_APP_PASSWORD.replace(/\s/g, "")
            }
        });

        const date = new Date(`${appointment.date}T12:00:00`).toLocaleDateString("es-VE", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
        const patientName = appointment.patient_name;
        const doctorName = appointment.doctor_name;
        const subject = "Tu cita médica ha sido confirmada";
        const text = [
            `Hola ${patientName},`,
            "",
            "Te confirmamos que tu cita médica ha sido aprobada y ya está reservada.",
            `Especialista: ${doctorName} (${appointment.specialty})`,
            `Fecha: ${date}`,
            `Hora: ${appointment.time}`,
            `Código de la cita: ${appointment.code}`,
            "",
            "Te recomendamos llegar unos minutos antes. Si necesitas hacer algún cambio o tienes alguna pregunta, comunícate directamente con la clínica.",
            "",
            "Gracias por confiar en Clínica Su Salud. ¡Te esperamos!"
        ].join("\n");
        const safePatientName = escapeHtml(patientName);
        const html = `
            <p>Hola ${safePatientName},</p>
            <p>Te confirmamos que tu cita médica ha sido aprobada y ya está reservada.</p>
            <ul>
                <li><strong>Especialista:</strong> ${escapeHtml(doctorName)} (${escapeHtml(appointment.specialty)})</li>
                <li><strong>Fecha:</strong> ${escapeHtml(date)}</li>
                <li><strong>Hora:</strong> ${escapeHtml(appointment.time)}</li>
                <li><strong>Código de la cita:</strong> ${escapeHtml(appointment.code)}</li>
            </ul>
            <p>Te recomendamos llegar unos minutos antes. Si necesitas hacer algún cambio o tienes alguna pregunta, comunícate directamente con la clínica.</p>
            <p>Gracias por confiar en Clínica Su Salud. ¡Te esperamos!</p>
        `;

        await transporter.sendMail({
            from: `"Clínica Su Salud" <${GMAIL_USER}>`,
            to: appointment.patient_email,
            subject,
            text,
            html
        });

        return response.status(200).json({ sent: true });
    } catch (error) {
        if (claimedAt) {
            try {
                const { error: releaseError } = await supabase
                    .from("citas")
                    .update({ confirmation_email_sent_at: null })
                    .eq("id", appointmentId)
                    .eq("confirmation_email_sent_at", claimedAt);
                if (releaseError) {
                    throw releaseError;
                }
            } catch (releaseError) {
                console.error("[Confirmación por correo] No se liberó la reserva:", releaseError);
            }
        }

        console.error("[Confirmación por correo]", error);
        return response.status(502).json({
            error: "La cita quedó confirmada, pero no se pudo enviar el correo. Revisa la configuración de Gmail."
        });
    }
};
