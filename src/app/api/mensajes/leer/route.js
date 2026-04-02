import { supabaseAdmin as supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { conversacion_id } = await req.json()

    if (!conversacion_id) {
      return NextResponse.json({ error: 'Falta conversacion_id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('wp_mensajes')
      .update({ leido: true })
      .eq('conversacion_id', conversacion_id)
      .eq('remitente', 'usuario')
      .eq('leido', false)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
