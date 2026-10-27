// Cliente y adaptador de Supabase para el sistema de citas.

const DEFAULT_SUPABASE_URL = "https://TU_PROYECTO.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "TU_SUPABASE_ANON_KEY";

let deploymentCredentials = null;
let runtimeCredentials = null;
let deploymentConfigError = null;
let supabaseClientInstance = null;

const supabaseCredentialsReady = fetch("/api/supabase-config", { cache: "no-store" })
    .then(async (response) => {
        const config = await response.json();
        if (!response.ok) {
            throw new Error(config.error || `Error HTTP ${response.status}`);
        }
        if (!config.url || !config.anonKey) {
            throw new Error("La configuración de Supabase en Vercel está incompleta.");
        }
        deploymentCredentials = { url: config.url, anonKey: config.anonKey };
    })
    .catch((error) => {
        deploymentConfigError = error;
    });

function getSupabaseCredentials() {
    const credentials = runtimeCredentials || deploymentCredentials || {
        url: DEFAULT_SUPABASE_URL,
        anonKey: DEFAULT_SUPABASE_ANON_KEY
    };
    const isPlaceholder = (
        !credentials.url ||
        credentials.url.includes("TU_PROYECTO") ||
        !credentials.anonKey ||
        credentials.anonKey.includes("TU_SUPABASE_ANON_KEY")
    );

    return {
        ...credentials,
        isConfigured: !isPlaceholder,
        configError: deploymentConfigError
    };
}

function initSupabaseClient() {
    const credentials = getSupabaseCredentials();
    if (!window.supabase) {
        throw new Error("La librería de Supabase no se cargó.");
    }
    if (!credentials.isConfigured) {
        throw new Error(
            credentials.configError
                ? `No se pudo cargar la configuración de Supabase: ${credentials.configError.message}`
                : "Configura SUPABASE_URL y SUPABASE_ANON_KEY en Vercel."
        );
    }
    if (!supabaseClientInstance) {
        supabaseClientInstance = window.supabase.createClient(credentials.url, credentials.anonKey, {
            auth: { persistSession: false }
        });
    }
    return supabaseClientInstance;
}

async function getSupabaseClient() {
    await supabaseCredentialsReady;
    return initSupabaseClient();
}

function mapAppointmentToDb(appointment) {
    return {
        id: appointment.id,
        code: appointment.code,
        doctor_name: appointment.doctorName,
        specialty: appointment.specialty,
        date: appointment.date,
        time: appointment.time,
        patient_name: appointment.patientName,
        patient_email: appointment.patientEmail,
        patient_phone: appointment.patientPhone,
        patient_age: parseInt(appointment.patientAge, 10) || 0,
        notes: appointment.notes || "",
        status: appointment.status || "Pendiente",
        doctor_notes: appointment.doctorNotes || ""
    };
}

function mapAppointmentFromDb(row) {
    return {
        id: row.id,
        code: row.code,
        doctorName: row.doctor_name,
        specialty: row.specialty,
        date: typeof row.date === "string" ? row.date.split("T")[0] : row.date,
        time: row.time,
        patientName: row.patient_name,
        patientEmail: row.patient_email,
        patientPhone: row.patient_phone,
        patientAge: row.patient_age,
        notes: row.notes,
        status: row.status,
        doctorNotes: row.doctor_notes || "",
        createdAt: row.created_at
    };
}

async function apiGetAppointments(doctorName = null) {
    const client = await getSupabaseClient();
    let query = client
        .from("citas")
        .select("*")
        .order("date", { ascending: true })
        .order("time", { ascending: true });

    if (doctorName) {
        query = query.ilike("doctor_name", doctorName.trim());
    }

    const { data, error } = await query;
    if (error) {
        throw new Error(`No se pudieron leer las citas de Supabase: ${error.message}`);
    }
    return data.map(mapAppointmentFromDb);
}

async function apiSaveAppointment(appointment) {
    const client = await getSupabaseClient();
    const { error } = await client
        .from("citas")
        .insert([mapAppointmentToDb(appointment)]);

    if (error) {
        throw new Error(`No se pudo guardar la cita en Supabase: ${error.message}`);
    }

    return { success: true, savedInSupabase: true, appointment };
}

async function apiUpdateAppointmentStatus(appointmentId, newStatus) {
    const client = await getSupabaseClient();
    const { error } = await client
        .from("citas")
        .update({ status: newStatus })
        .eq("id", appointmentId);

    if (error) {
        throw new Error(`No se pudo actualizar la cita en Supabase: ${error.message}`);
    }
}

async function apiUpdateDoctorNotes(appointmentId, doctorNotes) {
    const client = await getSupabaseClient();
    const { error } = await client
        .from("citas")
        .update({ doctor_notes: doctorNotes })
        .eq("id", appointmentId);

    if (error) {
        throw new Error(`No se pudieron guardar las notas en Supabase: ${error.message}`);
    }
}

async function apiSubscribeToAppointments(onChangesCallback) {
    const client = await getSupabaseClient();
    return client
        .channel("citas_realtime_channel")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "citas" },
            (payload) => {
                if (typeof onChangesCallback === "function") {
                    onChangesCallback(payload);
                }
            }
        )
        .subscribe((status, error) => {
            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                console.error("[Supabase Realtime] No se pudo establecer la suscripción:", error || status);
            }
        });
}

async function testSupabaseConnection() {
    try {
        const client = await getSupabaseClient();
        const { count, error } = await client
            .from("citas")
            .select("*", { count: "exact", head: true });

        if (error) {
            return {
                connected: false,
                message: `Error de Supabase: ${error.message}. Verifica la tabla y sus políticas.`
            };
        }
        return {
            connected: true,
            message: `Conexión exitosa con Supabase. Tabla 'citas' lista (${count || 0} registros).`
        };
    } catch (error) {
        return { connected: false, message: error.message };
    }
}

function saveCustomSupabaseCredentials(url, anonKey) {
    runtimeCredentials = { url: url.trim(), anonKey: anonKey.trim() };
    supabaseClientInstance = null;
    return initSupabaseClient();
}

function clearCustomSupabaseCredentials() {
    runtimeCredentials = null;
    supabaseClientInstance = null;
}
