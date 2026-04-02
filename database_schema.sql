-- ============================================
-- Wedding Planner - Esquema de Base de Datos
-- Versión: 1.0
-- ============================================

-- 1. TABLA DE EVENTOS (Bodas / Eventos)
CREATE TABLE IF NOT EXISTS wp_eventos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_evento TEXT NOT NULL,
  tipo_evento TEXT DEFAULT 'boda' CHECK (tipo_evento IN ('boda','xv_anos','bautizo','comunion','corporativo','otro')),
  fecha_evento DATE,
  hora_evento TIME,
  ubicacion TEXT,
  link_ubicacion TEXT,
  codigo_vestimenta TEXT,
  descripcion TEXT,
  max_invitados INTEGER DEFAULT 100,
  imagen_url TEXT,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE INVITADOS (RSVP)
CREATE TABLE IF NOT EXISTS wp_invitados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID REFERENCES wp_eventos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  telefono TEXT,
  confirmado BOOLEAN DEFAULT NULL,
  num_acompanantes INTEGER DEFAULT 0,
  max_acompanantes INTEGER DEFAULT 0,
  notas TEXT,
  fecha_confirmacion TIMESTAMPTZ,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE PROSPECTOS (Leads / Clientes Potenciales)
CREATE TABLE IF NOT EXISTS wp_prospectos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT,
  correo TEXT,
  tipo_evento TEXT,
  fecha_evento_aprox TEXT,
  presupuesto TEXT,
  num_invitados_aprox TEXT,
  estado TEXT DEFAULT 'nuevo' CHECK (estado IN ('nuevo','en_proceso','contactado','agendado','cerrado')),
  lead_score TEXT,
  categoria_urgencia TEXT,
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE CITAS
CREATE TABLE IF NOT EXISTS wp_citas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prospecto_id UUID REFERENCES wp_prospectos(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  tipo TEXT DEFAULT 'presencial' CHECK (tipo IN ('presencial','online','llamada')),
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmada','cancelada','completada')),
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA DE CONVERSACIONES (INBOX)
CREATE TABLE IF NOT EXISTS wp_conversaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prospecto_id UUID REFERENCES wp_prospectos(id) ON DELETE SET NULL,
  invitado_id UUID REFERENCES wp_invitados(id) ON DELETE SET NULL,
  plataforma TEXT NOT NULL CHECK (plataforma IN ('whatsapp', 'messenger', 'instagram')),
  id_plataforma TEXT NOT NULL,
  tipo_contacto TEXT DEFAULT 'desconocido' CHECK (tipo_contacto IN ('invitado','lead','desconocido')),
  asignado_a_humano BOOLEAN DEFAULT false,
  estado TEXT DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),
  ultimo_mensaje TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plataforma, id_plataforma)
);

-- 6. TABLA DE MENSAJES
CREATE TABLE IF NOT EXISTS wp_mensajes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversacion_id UUID REFERENCES wp_conversaciones(id) ON DELETE CASCADE,
  remitente TEXT NOT NULL CHECK (remitente IN ('usuario', 'bot', 'humano')),
  contenido TEXT,
  tipo TEXT DEFAULT 'texto' CHECK (tipo IN ('texto', 'imagen', 'audio', 'documento')),
  url_archivo TEXT,
  leido BOOLEAN DEFAULT false,
  id_mensaje_meta TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA DE CONFIGURACIÓN DEL BOT
CREATE TABLE IF NOT EXISTS wp_configuracion_bot (
  id INT PRIMARY KEY DEFAULT 1,
  nombre_agente TEXT DEFAULT 'Evelyn',
  system_prompt TEXT NOT NULL,
  modelo TEXT DEFAULT 'gpt-4o',
  temperatura DECIMAL(3,2) DEFAULT 0.7,
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT wp_check_single_row CHECK (id = 1)
);

-- ============================================
-- SEGURIDAD (RLS) Y POLÍTICAS
-- ============================================
ALTER TABLE wp_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE wp_invitados ENABLE ROW LEVEL SECURITY;
ALTER TABLE wp_prospectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE wp_citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE wp_conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE wp_mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wp_configuracion_bot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo wp_eventos" ON wp_eventos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo wp_invitados" ON wp_invitados FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo wp_prospectos" ON wp_prospectos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo wp_citas" ON wp_citas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo wp_conversaciones" ON wp_conversaciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo wp_mensajes" ON wp_mensajes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo wp_config" ON wp_configuracion_bot FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- DATOS INICIALES
-- ============================================
INSERT INTO wp_configuracion_bot (id, nombre_agente, system_prompt, modelo, temperatura) 
VALUES (
  1, 
  'Evelyn', 
  'Eres Evelyn, asistente virtual de una empresa de organización de bodas y eventos...', 
  'gpt-4o',
  0.7
) ON CONFLICT (id) DO NOTHING;

-- Evento de ejemplo
INSERT INTO wp_eventos (nombre_evento, tipo_evento, fecha_evento, hora_evento, ubicacion, link_ubicacion, codigo_vestimenta, descripcion)
VALUES (
  'Boda Ana & Carlos',
  'boda',
  '2026-06-15',
  '17:00',
  'Hacienda Los Laureles, Colima',
  'https://maps.google.com/?q=Hacienda+Los+Laureles+Colima',
  'Formal / Etiqueta. Colores sugeridos: tonos pastel. Evitar blanco.',
  'Ceremonia religiosa a las 5pm seguida de recepción.'
) ON CONFLICT DO NOTHING;
