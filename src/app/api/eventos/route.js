import { supabaseAdmin as supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('wp_eventos')
    .select('*, wp_invitados(id, confirmado)')
    .order('fecha_evento', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(solicitud) {
  const cuerpo = await solicitud.json()
  const { data, error } = await supabase
    .from('wp_eventos')
    .insert([{
      nombre_evento: cuerpo.nombre_evento,
      tipo_evento: cuerpo.tipo_evento || 'boda',
      fecha_evento: cuerpo.fecha_evento,
      hora_evento: cuerpo.hora_evento,
      ubicacion: cuerpo.ubicacion,
      link_ubicacion: cuerpo.link_ubicacion,
      codigo_vestimenta: cuerpo.codigo_vestimenta,
      descripcion: cuerpo.descripcion,
      max_invitados: cuerpo.max_invitados || 100
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(solicitud) {
  const cuerpo = await solicitud.json()
  const { id, ...datosActualizacion } = cuerpo
  if (!id) return NextResponse.json({ error: 'Se requiere ID' }, { status: 400 })

  const { data, error } = await supabase
    .from('wp_eventos')
    .update({ ...datosActualizacion, actualizado_en: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(solicitud) {
  const { searchParams } = new URL(solicitud.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Se requiere ID' }, { status: 400 })

  const { error } = await supabase.from('wp_eventos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ mensaje: 'Evento eliminado' })
}
