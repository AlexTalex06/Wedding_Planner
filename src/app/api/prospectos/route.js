import { supabaseAdmin as supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(solicitud) {
  const { searchParams } = new URL(solicitud.url)
  const estado = searchParams.get('estado')
  const busqueda = searchParams.get('busqueda')

  let consulta = supabase
    .from('wp_prospectos')
    .select('*')
    .order('creado_en', { ascending: false })

  if (estado && estado !== 'todos') consulta = consulta.eq('estado', estado)
  if (busqueda) consulta = consulta.or(`nombre.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%,correo.ilike.%${busqueda}%`)

  const { data, error } = await consulta
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(solicitud) {
  const cuerpo = await solicitud.json()
  const { data, error } = await supabase
    .from('wp_prospectos')
    .insert([{
      nombre: cuerpo.nombre,
      correo: cuerpo.correo,
      telefono: cuerpo.telefono,
      tipo_evento: cuerpo.tipo_evento,
      fecha_evento_aprox: cuerpo.fecha_evento_aprox,
      estado: cuerpo.estado || 'nuevo',
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
    .from('wp_prospectos')
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

  const { error } = await supabase.from('wp_prospectos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ mensaje: 'Prospecto eliminado' })
}
