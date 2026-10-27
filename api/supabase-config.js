module.exports = function handler(_request, response) {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    response.setHeader("Cache-Control", "no-store");

    if (!url || !anonKey) {
        return response.status(503).json({
            error: "Faltan las variables SUPABASE_URL y SUPABASE_ANON_KEY en Vercel."
        });
    }

    let keyRole = null;
    const tokenParts = anonKey.split(".");
    if (tokenParts.length === 3) {
        try {
            const payload = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
            keyRole = JSON.parse(Buffer.from(payload, "base64").toString("utf8")).role;
        } catch (_error) {
            keyRole = null;
        }
    }

    if (anonKey.startsWith("sb_secret_") || keyRole === "service_role") {
        return response.status(500).json({
            error: "SUPABASE_ANON_KEY debe ser una clave pública anon/publishable; nunca uses service_role."
        });
    }

    return response.status(200).json({ url, anonKey });
};
