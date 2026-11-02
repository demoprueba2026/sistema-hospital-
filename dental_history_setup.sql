-- Historiales odontologicos privados por cita.
-- Ejecuta este archivo en Supabase > SQL Editor despues de crear public.citas.
-- Requiere crear una cuenta de Supabase Auth por doctor y asociar cada UUID
-- con el nombre exacto de doctor_name usado en public.citas.

CREATE TABLE IF NOT EXISTS public.doctor_accounts (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_name TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_doctor_accounts_name
    ON public.doctor_accounts (lower(btrim(doctor_name)));

ALTER TABLE public.doctor_accounts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.doctor_accounts FROM PUBLIC, anon;
GRANT SELECT ON public.doctor_accounts TO authenticated;

DROP POLICY IF EXISTS "Doctors can read their own account" ON public.doctor_accounts;
CREATE POLICY "Doctors can read their own account"
    ON public.doctor_accounts
    FOR SELECT
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

CREATE TABLE IF NOT EXISTS public.patient_dental_histories (
    appointment_id TEXT PRIMARY KEY
        REFERENCES public.citas(id) ON DELETE RESTRICT,
    history_data JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(history_data) = 'object'),
    created_by UUID NOT NULL DEFAULT auth.uid()
        REFERENCES auth.users(id),
    updated_by UUID NOT NULL DEFAULT auth.uid()
        REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_dental_histories ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.patient_dental_histories FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.patient_dental_histories TO authenticated;

DROP POLICY IF EXISTS "Assigned doctors can read dental histories" ON public.patient_dental_histories;
CREATE POLICY "Assigned doctors can read dental histories"
    ON public.patient_dental_histories
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.citas AS c
            JOIN public.doctor_accounts AS d
                ON lower(btrim(d.doctor_name)) = lower(btrim(c.doctor_name))
            WHERE c.id = patient_dental_histories.appointment_id
              AND d.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Assigned doctors can create dental histories" ON public.patient_dental_histories;
CREATE POLICY "Assigned doctors can create dental histories"
    ON public.patient_dental_histories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.citas AS c
            JOIN public.doctor_accounts AS d
                ON lower(btrim(d.doctor_name)) = lower(btrim(c.doctor_name))
            WHERE c.id = patient_dental_histories.appointment_id
              AND d.user_id = (SELECT auth.uid())
        )
        AND created_by = (SELECT auth.uid())
        AND updated_by = (SELECT auth.uid())
    );

DROP POLICY IF EXISTS "Assigned doctors can update dental histories" ON public.patient_dental_histories;
CREATE POLICY "Assigned doctors can update dental histories"
    ON public.patient_dental_histories
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.citas AS c
            JOIN public.doctor_accounts AS d
                ON lower(btrim(d.doctor_name)) = lower(btrim(c.doctor_name))
            WHERE c.id = patient_dental_histories.appointment_id
              AND d.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.citas AS c
            JOIN public.doctor_accounts AS d
                ON lower(btrim(d.doctor_name)) = lower(btrim(c.doctor_name))
            WHERE c.id = patient_dental_histories.appointment_id
              AND d.user_id = (SELECT auth.uid())
        )
        AND updated_by = (SELECT auth.uid())
    );

CREATE OR REPLACE FUNCTION public.set_dental_history_audit_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.created_by := OLD.created_by;
    NEW.updated_at := now();
    NEW.updated_by := (SELECT auth.uid());
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_dental_history_audit_fields() FROM PUBLIC;

DROP TRIGGER IF EXISTS set_dental_history_audit_fields
    ON public.patient_dental_histories;
CREATE TRIGGER set_dental_history_audit_fields
    BEFORE UPDATE ON public.patient_dental_histories
    FOR EACH ROW
    EXECUTE FUNCTION public.set_dental_history_audit_fields();

CREATE INDEX IF NOT EXISTS idx_dental_histories_updated_at
    ON public.patient_dental_histories (updated_at DESC);

-- Cuando ya existan las cuentas en Supabase Auth, ejecuta una sentencia
-- por doctor sustituyendo el UUID y el nombre, que debe coincidir con citas.doctor_name:
-- INSERT INTO public.doctor_accounts (user_id, doctor_name)
-- VALUES ('UUID-DE-SUPABASE-AUTH', 'Dr. Nombre Apellido')
-- ON CONFLICT (user_id)
-- DO UPDATE SET doctor_name = EXCLUDED.doctor_name;
