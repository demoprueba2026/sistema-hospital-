-- ========================================================
-- SCRIPT SQL DE CONFIGURACIÓN PARA SUPABASE
-- Hospital Domingo Luciani / Sistema de Citas Médicas
-- ========================================================
-- Instrucciones:
-- 1. Inicia sesión en https://supabase.com y abre tu proyecto.
-- 2. Dirígete a la sección "SQL Editor" en el menú lateral izquierdo.
-- 3. Crea una "New query", pega todo este código y haz clic en "Run".
-- ========================================================

-- 1. Crear la tabla de citas médicas
CREATE TABLE IF NOT EXISTS public.citas (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_email TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    patient_age INTEGER NOT NULL CHECK (patient_age >= 0 AND patient_age <= 120),
    notes TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Confirmada', 'Atendida', 'Cancelada')),
    doctor_notes TEXT DEFAULT '',
    confirmation_email_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.citas
ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ;

-- Comentarios explicativos en las columnas
COMMENT ON TABLE public.citas IS 'Registro de citas médicas de pacientes con doctores especialistas.';
COMMENT ON COLUMN public.citas.id IS 'Identificador único de la cita';
COMMENT ON COLUMN public.citas.code IS 'Código legible de recibo de la cita (ej. HDL-1234)';
COMMENT ON COLUMN public.citas.doctor_name IS 'Nombre del doctor especialista asignado';
COMMENT ON COLUMN public.citas.specialty IS 'Especialidad médica';
COMMENT ON COLUMN public.citas.status IS 'Estado de la cita: Pendiente, Confirmada, Atendida o Cancelada';

-- 2. Habilitar Seguridad a Nivel de Fila (Row Level Security - RLS)
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas previas si ya existían para evitar duplicados
DROP POLICY IF EXISTS "Permitir inserción de citas públicas" ON public.citas;
DROP POLICY IF EXISTS "Permitir consulta de citas" ON public.citas;
DROP POLICY IF EXISTS "Permitir actualización de citas" ON public.citas;
DROP POLICY IF EXISTS "Permitir eliminación de citas" ON public.citas;

-- 4. Crear políticas de acceso RLS
-- Permitir que los pacientes agenden citas desde la página web pública
CREATE POLICY "Permitir inserción de citas públicas"
ON public.citas
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Permitir la lectura de citas (para el portal médico y confirmaciones)
CREATE POLICY "Permitir consulta de citas"
ON public.citas
FOR SELECT
TO anon, authenticated
USING (true);

-- Permitir que los especialistas actualicen el estado y notas médicas de sus citas
CREATE POLICY "Permitir actualización de citas"
ON public.citas
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Permitir eliminar citas si es necesario
CREATE POLICY "Permitir eliminación de citas"
ON public.citas
FOR DELETE
TO anon, authenticated
USING (true);

-- 5. Habilitar Supabase Realtime (para que las citas aparezcan en vivo sin recargar)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'citas'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.citas;
    END IF;
END $$;

-- 6. Crear índices para búsquedas y filtros ultrarrápidos
CREATE INDEX IF NOT EXISTS idx_citas_doctor_name ON public.citas (doctor_name);
CREATE INDEX IF NOT EXISTS idx_citas_date ON public.citas (date);
CREATE INDEX IF NOT EXISTS idx_citas_status ON public.citas (status);
CREATE INDEX IF NOT EXISTS idx_citas_created_at ON public.citas (created_at DESC);

-- 7. Datos de prueba iniciales (opcional, para verificar de inmediato en el portal)
INSERT INTO public.citas (
    id, code, doctor_name, specialty, date, time, patient_name, patient_email, patient_phone, patient_age, notes, status, doctor_notes
)
VALUES 
(
    'cita_demo_1',
    'HDL-7421',
    'Dra. Desiree Rojas',
    'Cardiología',
    CURRENT_DATE + INTERVAL '2 days',
    '09:00 a. m.',
    'Mariana Albornoz',
    'mariana.albornoz@gmail.com',
    '0412-9876543',
    38,
    'Chequeo rutinario por palpitaciones esporádicas y antecedentes de hipertensión familiar.',
    'Pendiente',
    ''
),
(
    'cita_demo_2',
    'HDL-5190',
    'Dr. Miguel Herrera',
    'Cirugía general',
    CURRENT_DATE + INTERVAL '3 days',
    '10:30 a. m.',
    'Roberto Gómez',
    'roberto.gomez@outlook.com',
    '0414-3456789',
    45,
    'Evaluación postoperatoria y revisión de cicatrización en pared abdominal.',
    'Confirmada',
    'Paciente reporta buena evolución inicial sin dolor agudo.'
)
ON CONFLICT (id) DO NOTHING;
