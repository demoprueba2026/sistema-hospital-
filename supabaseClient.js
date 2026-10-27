// ========================================================
// CLIENTE Y ADAPTADOR DE SUPABASE
// Sistema de Citas Médicas
// ========================================================

/**
 * INSTRUCCIONES DE CONFIGURACIÓN:
 * 1. Crea un proyecto gratuito en https://supabase.com
 * 2. En el panel de tu proyecto ve a: Project Settings -> API
 * 3. Copia tu "Project URL" y pégala en DEFAULT_SUPABASE_URL
 * 4. Copia tu "anon / public key" y pégala en DEFAULT_SUPABASE_ANON_KEY
 * (También puedes configurarlas visualmente haciendo clic en el indicador de Supabase del portal)
 */
const DEFAULT_SUPABASE_URL = "https://TU_PROYECTO.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "TU_SUPABASE_ANON_KEY";

const LOCAL_STORAGE_CITAS_KEY = "hdl_citas_hospital";
const STORAGE_SUPABASE_URL_KEY = "hdl_custom_supabase_url";
const STORAGE_SUPABASE_KEY_KEY = "hdl_custom_supabase_anon_key";

// Obtener las credenciales activas (desde archivo o desde localStorage)
function getSupabaseCredentials() {
    const customUrl = localStorage.getItem(STORAGE_SUPABASE_URL_KEY);
    const customKey = localStorage.getItem(STORAGE_SUPABASE_KEY_KEY);

    const url = (customUrl && customUrl.trim()) || DEFAULT_SUPABASE_URL;
    const anonKey = (customKey && customKey.trim()) || DEFAULT_SUPABASE_ANON_KEY;

    const isPlaceholder = (
        !url ||
        url.includes("TU_PROYECTO") ||
        !anonKey ||
        anonKey.includes("TU_SUPABASE_ANON_KEY")
    );

    return {
        url,
        anonKey,
        isConfigured: !isPlaceholder
    };
}

// Inicializar cliente de Supabase
let supabaseClientInstance = null;

function initSupabaseClient() {
    const creds = getSupabaseCredentials();

    if (!window.supabase) {
        console.warn("[Supabase] La librería @supabase/supabase-js no está cargada aún.");
        return null;
    }

    if (!creds.isConfigured) {
        return null;
    }

    try {
        supabaseClientInstance = window.supabase.createClient(creds.url, creds.anonKey, {
            auth: { persistSession: false }
        });
        return supabaseClientInstance;
    } catch (err) {
        console.error("[Supabase] Error al inicializar cliente:", err);
        return null;
    }
}

// Mapeos bidireccionales entre camelCase de JavaScript y snake_case de Postgres
function mapAppointmentToDb(appt) {
    return {
        id: appt.id,
        code: appt.code,
        doctor_name: appt.doctorName,
        specialty: appt.specialty,
        date: appt.date,
        time: appt.time,
        patient_name: appt.patientName,
        patient_email: appt.patientEmail,
        patient_phone: appt.patientPhone,
        patient_age: parseInt(appt.patientAge, 10) || 0,
        notes: appt.notes || "",
        status: appt.status || "Pendiente",
        doctor_notes: appt.doctorNotes || ""
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

// ==========================================
// MÉTODOS DE LA API DE CITAS
// ==========================================

/**
 * Consulta las citas. Si se proporciona doctorName, filtra estrictamente por ese doctor.
 * Intenta primero en Supabase. Si falla o no está configurado, usa localStorage como respaldo.
 */
async function apiGetAppointments(doctorName = null) {
    const client = supabaseClientInstance || initSupabaseClient();

    if (client) {
        try {
            let query = client
                .from("citas")
                .select("*")
                .order("date", { ascending: true })
                .order("time", { ascending: true });

            if (doctorName) {
                // Filtro estricto por nombre de doctor para privacidad médica
                query = query.ilike("doctor_name", doctorName.trim());
            }

            const { data, error } = await query;

            if (!error && Array.isArray(data)) {
                const mapped = data.map(mapAppointmentFromDb);

                // Sincronizar copia en localStorage como caché de respaldo
                try {
                    const localList = getLocalAppointments();
                    mapped.forEach((appt) => {
                        const idx = localList.findIndex((item) => item.id === appt.id);
                        if (idx >= 0) {
                            localList[idx] = appt;
                        } else {
                            localList.unshift(appt);
                        }
                    });
                    localStorage.setItem(LOCAL_STORAGE_CITAS_KEY, JSON.stringify(localList));
                } catch (_) {}

                return mapped;
            } else if (error) {
                console.warn("[Supabase] Error al consultar citas, usando respaldo local:", error.message);
            }
        } catch (err) {
            console.warn("[Supabase] Falló la conexión remota, usando respaldo local:", err);
        }
    }

    // Respaldo en localStorage
    const local = getLocalAppointments();
    if (doctorName) {
        return local.filter(
            (a) => a.doctorName.toLowerCase().trim() === doctorName.toLowerCase().trim()
        );
    }
    return local;
}

/**
 * Guarda una nueva cita médica en Supabase y en localStorage.
 */
async function apiSaveAppointment(appointment) {
    const client = supabaseClientInstance || initSupabaseClient();
    let savedInSupabase = false;

    // 1. Guardar en Supabase si está disponible
    if (client) {
        try {
            const dbPayload = mapAppointmentToDb(appointment);
            const { data, error } = await client
                .from("citas")
                .insert([dbPayload])
                .select();

            if (!error) {
                savedInSupabase = true;
                console.log("[Supabase] Cita guardada con éxito en la base de datos:", appointment.id);
            } else {
                console.error("[Supabase] Error al insertar en la tabla citas:", error);
            }
        } catch (err) {
            console.error("[Supabase] Excepción al guardar cita:", err);
        }
    }

    // 2. Guardar en localStorage como respaldo local garantizado
    const local = getLocalAppointments();
    const existingIndex = local.findIndex((a) => a.id === appointment.id);
    if (existingIndex >= 0) {
        local[existingIndex] = appointment;
    } else {
        local.unshift(appointment);
    }
    try {
        localStorage.setItem(LOCAL_STORAGE_CITAS_KEY, JSON.stringify(local));
    } catch (_) {}

    return {
        success: true,
        savedInSupabase,
        appointment
    };
}

/**
 * Actualiza el estado de una cita (Pendiente, Confirmada, Atendida, Cancelada).
 */
async function apiUpdateAppointmentStatus(appointmentId, newStatus) {
    const client = supabaseClientInstance || initSupabaseClient();

    if (client) {
        try {
            const { error } = await client
                .from("citas")
                .update({ status: newStatus })
                .eq("id", appointmentId);

            if (error) {
                console.error("[Supabase] Error al actualizar estado:", error);
            } else {
                console.log(`[Supabase] Estado de cita ${appointmentId} actualizado a ${newStatus}`);
            }
        } catch (err) {
            console.error("[Supabase] Excepción al actualizar estado:", err);
        }
    }

    // Actualizar también en localStorage
    const local = getLocalAppointments();
    const target = local.find((a) => a.id === appointmentId);
    if (target) {
        target.status = newStatus;
        try {
            localStorage.setItem(LOCAL_STORAGE_CITAS_KEY, JSON.stringify(local));
        } catch (_) {}
    }
}

/**
 * Actualiza las notas médicas privadas del doctor en una cita.
 */
async function apiUpdateDoctorNotes(appointmentId, doctorNotes) {
    const client = supabaseClientInstance || initSupabaseClient();

    if (client) {
        try {
            const { error } = await client
                .from("citas")
                .update({ doctor_notes: doctorNotes })
                .eq("id", appointmentId);

            if (error) {
                console.error("[Supabase] Error actualizando notas del doctor:", error);
            }
        } catch (err) {
            console.error("[Supabase] Excepción:", err);
        }
    }

    const local = getLocalAppointments();
    const target = local.find((a) => a.id === appointmentId);
    if (target) {
        target.doctorNotes = doctorNotes;
        try {
            localStorage.setItem(LOCAL_STORAGE_CITAS_KEY, JSON.stringify(local));
        } catch (_) {}
    }
}

/**
 * Suscripción en tiempo real a cambios en la tabla citas.
 */
function apiSubscribeToAppointments(onChangesCallback) {
    const client = supabaseClientInstance || initSupabaseClient();
    if (!client || typeof client.channel !== "function") return null;

    try {
        const channel = client
            .channel("citas_realtime_channel")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "citas" },
                (payload) => {
                    console.log("[Supabase Realtime] Evento recibido:", payload.eventType);
                    if (typeof onChangesCallback === "function") {
                        onChangesCallback(payload);
                    }
                }
            )
            .subscribe();

        return channel;
    } catch (err) {
        console.warn("[Supabase Realtime] No se pudo conectar a Realtime:", err);
        return null;
    }
}

/**
 * Comprueba el estado de la conexión con Supabase.
 */
async function testSupabaseConnection() {
    const creds = getSupabaseCredentials();
    if (!creds.isConfigured) {
        return {
            connected: false,
            message: "Supabase no está configurado aún. Agrega tu SUPABASE_URL y SUPABASE_ANON_KEY."
        };
    }

    const client = supabaseClientInstance || initSupabaseClient();
    if (!client) {
        return {
            connected: false,
            message: "No se pudo inicializar la librería de Supabase."
        };
    }

    try {
        const { count, error } = await client
            .from("citas")
            .select("*", { count: "exact", head: true });

        if (error) {
            return {
                connected: false,
                message: `Error de conexión: ${error.message}. Verifica que hayas ejecutado el script SQL en Supabase.`
            };
        }

        return {
            connected: true,
            message: `Conexión exitosa con Supabase. Tabla 'citas' lista (${count || 0} registros encontrados).`
        };
    } catch (err) {
        return {
            connected: false,
            message: `Error al conectar: ${err.message || err}`
        };
    }
}

/**
 * Guarda credenciales personalizadas desde la interfaz si el usuario las ingresa.
 */
function saveCustomSupabaseCredentials(url, anonKey) {
    if (url) localStorage.setItem(STORAGE_SUPABASE_URL_KEY, url.trim());
    if (anonKey) localStorage.setItem(STORAGE_SUPABASE_KEY_KEY, anonKey.trim());
    supabaseClientInstance = null;
    return initSupabaseClient();
}

function clearCustomSupabaseCredentials() {
    localStorage.removeItem(STORAGE_SUPABASE_URL_KEY);
    localStorage.removeItem(STORAGE_SUPABASE_KEY_KEY);
    supabaseClientInstance = null;
}

// Respaldo local
function getLocalAppointments() {
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_CITAS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (_) {
        return [];
    }
}

// Inicializar cliente al cargar el script si la librería está disponible
if (typeof window !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSupabaseClient);
    } else {
        initSupabaseClient();
    }
}

