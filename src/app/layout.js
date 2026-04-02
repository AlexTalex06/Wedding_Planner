'use client'

import './globals.css'
import BarraLateral from '@/componentes/BarraLateral'
import BarraSuperior from '@/componentes/BarraSuperior'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LayoutRaiz({ children }) {
  const rutaActual = usePathname()
  const router = useRouter()
  const esLogin = rutaActual === '/login'
  const [authCargado, setAuthCargado] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session && !esLogin) {
        router.push('/login')
      } else {
        setAuthCargado(true)
      }
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        if (!esLogin) router.push('/login')
      } else {
        setAuthCargado(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [esLogin, router])

  return (
    <html lang="es">
      <head>
        <title>The Modern Concierge | Gestión de Eventos</title>
        <meta name="description" content="Plataforma CRM exclusiva para la organización integral de bodas y eventos de lujo" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,100..900;1,100..900&family=Manrope:wght@200..800&display=swap" rel="stylesheet" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[var(--surface)] text-[var(--on-surface)]">
        {esLogin ? (
          <main>{children}</main>
        ) : (
          <>
            <BarraLateral />
            <main className="md:ml-64 min-h-screen pb-20 md:pb-0">
              <BarraSuperior />
              {children}
            </main>
          </>
        )}
      </body>
    </html>
  )
}
