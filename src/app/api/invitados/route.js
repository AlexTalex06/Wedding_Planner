import { supabaseAdmin as supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(solicitud) {
  const { searchParams } = new URL(solicitud.url)
  const eventoId = searchParams.get('evento_id')

  let consulta = supabase
    .from('wp_invitados')
    .select('*, wp_eventos(nombre_evento)')
    .order('creado_en', { ascending: false })

  if (eventoId) consulta = consulta.eq('evento_id', eventoId)

  const { data, error } = await consulta
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(solicitud) {
  const cuerpo = await solicitud.json()
  const { data, error } = await supabase
    .from('wp_invitados')
    .insert([{
      evento_id: cuerpo.evento_id,
      nombre: cuerpo.nombre,
      telefono: cuerpo.telefono,
      max_acompanantes: cuerpo.max_acompanantes || 0,
      notas: cuerpo.notas
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
    .from('wp_invitados')
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

  const { error } = await supabase.from('wp_invitados').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ mensaje: 'Invitado eliminado' })
}
