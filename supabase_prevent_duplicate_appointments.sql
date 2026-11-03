-- Ejecutar en Supabase SQL Editor para activar la regla en una base existente.
-- Si ya hay duplicados activos, primero hay que resolverlos manualmente.
-- Para identificarlos antes de ejecutar esta migración:
-- SELECT lower(btrim(doctor_name)) AS specialist, date, lower(btrim(time)) AS time, COUNT(*)
-- FROM public.citas
-- WHERE status <> 'Cancelada'
-- GROUP BY lower(btrim(doctor_name)), date, lower(btrim(time))
-- HAVING COUNT(*) > 1;
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.citas
        WHERE status <> 'Cancelada'
        GROUP BY lower(btrim(doctor_name)), date, lower(btrim(time))
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Hay citas activas duplicadas. Resuelve los duplicados por especialista, fecha y hora antes de crear el índice.';
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_citas_unique_active_doctor_slot
    ON public.citas (lower(btrim(doctor_name)), date, lower(btrim(time)))
    WHERE status <> 'Cancelada';
