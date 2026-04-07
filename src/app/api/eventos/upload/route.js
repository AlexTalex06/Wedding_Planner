import { supabaseAdmin as supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(solicitud) {
  try {
    const formData = await solicitud.formData()
    const archivo = formData.get('archivo')
    const eventoId = formData.get('eventoId')

    if (!archivo) {
      return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 })
    }

    const nombreArchivo = `${eventoId}/${Date.now()}-${archivo.name}`
    
    // 1. Subir a Supabase Storage (Bucket: 'eventos')
    const { data: storageData, error: storageError } = await supabase.storage
      .from('eventos')
      .upload(nombreArchivo, archivo, {
        cacheControl: '3600',
        upsert: false
      })

    if (storageError) {
      console.error('Error Storage:', storageError)
      return NextResponse.json({ error: 'Error al subir el archivo a Storage' }, { status: 500 })
    }

    // 2. Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('eventos')
      .getPublicUrl(nombreArchivo)

    // 3. Actualizar la tabla wp_eventos
    if (eventoId) {
      const { error: dbError } = await supabase
        .from('wp_eventos')
        .update({ pdf_url: publicUrl })
        .eq('id', eventoId)

      if (dbError) {
        return NextResponse.json({ error: 'Archivo subido pero falló actualización en base de datos' }, { status: 500 })
      }
    }

    return NextResponse.json({ exito: true, url: publicUrl })

  } catch (error) {
    console.error('Error en upload:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
