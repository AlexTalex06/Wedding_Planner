'use client'

import './globals.css'
import BarraLateral from '@/componentes/BarraLateral'
import BarraSuperior from '@/componentes/BarraSuperior'
import { usePathname } from 'next/navigation'

export default function LayoutRaiz({ children }) {
  const rutaActual = usePathname()
  const esLogin = rutaActual === '/login'

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
