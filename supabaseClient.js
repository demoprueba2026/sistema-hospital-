// Cliente y adaptador de Supabase para el sistema de citas.

const DEFAULT_SUPABASE_URL = "https://TU_PROYECTO.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "TU_SUPABASE_ANON_KEY";

let deploymentCredentials = null;
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
    const credentials = deploymentCredentials || {
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
        isConfigured: !isPlaceholder
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

async function apiDeleteAppointment(appointmentId) {
    const client = await getSupabaseClient();
    const { data, error } = await client
        .from("citas")
        .delete()
        .eq("id", appointmentId)
        .select("id");

    if (error) {
        throw new Error(`No se pudo eliminar el paciente de Supabase: ${error.message}`);
    }
    if (!data || data.length === 0) {
        throw new Error("Supabase no eliminó el registro. Verifica los permisos de la tabla.");
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

async function apiSignInDoctor(email, password, doctorName) {
    const client = await getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
        throw new Error(`No se pudo iniciar sesión con Supabase Auth: ${error.message}`);
    }
    if (!data.user) {
        throw new Error("Supabase Auth no devolvió un usuario para esta sesión.");
    }

    const { data: account, error: accountError } = await client
        .from("doctor_accounts")
        .select("doctor_name")
        .eq("user_id", data.user.id)
        .maybeSingle();

    if (accountError) {
        const { error: signOutError } = await client.auth.signOut();
        if (signOutError) {
            throw new Error(`No se pudo verificar el doctor (${accountError.message}) ni cerrar la sesión (${signOutError.message}).`);
        }
        throw new Error(`No se pudo verificar la cuenta del especialista: ${accountError.message}`);
    }

    const normalizeName = (name) => name.trim().toLowerCase();
    if (!account || normalizeName(account.doctor_name) !== normalizeName(doctorName)) {
        const { error: signOutError } = await client.auth.signOut();
        if (signOutError) {
            throw new Error(`La cuenta no está asignada a este especialista y no se pudo cerrar la sesión: ${signOutError.message}`);
        }
        throw new Error("La cuenta de Supabase Auth no está asignada al especialista seleccionado.");
    }
}

async function apiSignOutDoctor() {
    const client = await getSupabaseClient();
    const { error } = await client.auth.signOut();
    if (error) {
        throw new Error(`No se pudo cerrar la sesión de Supabase: ${error.message}`);
    }
}

async function getAuthenticatedDoctorClient() {
    const client = await getSupabaseClient();
    const { data, error } = await client.auth.getUser();
    if (error) {
        throw new Error(`No se pudo verificar la sesión de Supabase: ${error.message}`);
    }
    if (!data.user) {
        throw new Error("No hay una sesión autenticada de Supabase.");
    }
    return client;
}

async function apiGetDentalHistory(appointmentId) {
    const client = await getAuthenticatedDoctorClient();
    const { data, error } = await client
        .from("patient_dental_histories")
        .select("history_data")
        .eq("appointment_id", appointmentId)
        .maybeSingle();

    if (error) {
        throw new Error(`No se pudo cargar el historial odontológico: ${error.message}`);
    }
    return data ? data.history_data : null;
}

async function apiSaveDentalHistory(appointmentId, historyData) {
    const client = await getAuthenticatedDoctorClient();
    const { error } = await client
        .from("patient_dental_histories")
        .upsert(
            { appointment_id: appointmentId, history_data: historyData },
            { onConflict: "appointment_id" }
        );

    if (error) {
        throw new Error(`No se pudo guardar el historial odontológico: ${error.message}`);
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
