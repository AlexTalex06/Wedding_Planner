import { supabaseAdmin as supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(solicitud) {
  const { searchParams } = new URL(solicitud.url)
  const fecha = searchParams.get('fecha')

  let consulta = supabase
    .from('wp_citas')
    .select('*, wp_prospectos(nombre, telefono, correo)')
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true })

  if (fecha) consulta = consulta.eq('fecha', fecha)

  const { data, error } = await consulta
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(solicitud) {
  const cuerpo = await solicitud.json()
  const { data, error } = await supabase
    .from('wp_citas')
    .insert([{
      prospecto_id: cuerpo.prospecto_id,
      fecha: cuerpo.fecha,
      hora: cuerpo.hora,
      tipo: cuerpo.tipo || 'presencial',
      estado: cuerpo.estado || 'pendiente',
      notas: cuerpo.notas
    }])
    .select('*, wp_prospectos(nombre, telefono, correo)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(solicitud) {
  const cuerpo = await solicitud.json()
  const { id, ...datosActualizacion } = cuerpo
  if (!id) return NextResponse.json({ error: 'Se requiere ID' }, { status: 400 })

  const { data, error } = await supabase
    .from('wp_citas')
    .update(datosActualizacion)
    .eq('id', id)
    .select('*, wp_prospectos(nombre, telefono, correo)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(solicitud) {
  const { searchParams } = new URL(solicitud.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Se requiere ID' }, { status: 400 })

  const { error } = await supabase.from('wp_citas').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ mensaje: 'Cita eliminada' })
}
