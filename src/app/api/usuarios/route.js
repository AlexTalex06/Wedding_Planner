import { supabaseAdmin as supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Mapear solo los datos públicos necesarios para la UI
    const listaUsuarios = users.map(u => ({
      id: u.id,
      email: u.email,
      nombre: u.user_metadata?.full_name || u.user_metadata?.name || 'Usuario',
      rol: u.user_metadata?.role || 'Planner',
      creado_en: u.created_at,
      ultimo_login: u.last_sign_in_at
    }))

    return NextResponse.json(listaUsuarios)
  } catch (e) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(solicitud) {
  try {
    const { nombre, email, password, rol } = await solicitud.json()

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // Crear usuario manualmente vía Admin SDK
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmación manual: ya está verificado
      user_metadata: {
        full_name: nombre,
        role: rol || 'Planner'
      }
    })

    if (error) {
      console.error('Error creando usuario:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ exito: true, user: data.user }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(solicitud) {
  try {
    const { searchParams } = new URL(solicitud.url)
    const id = searchParams.get('id')
    
    if (!id) return NextResponse.json({ error: 'Se requiere ID' }, { status: 400 })

    const { error } = await supabase.auth.admin.deleteUser(id)
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ mensaje: 'Usuario eliminado' })
  } catch (e) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
