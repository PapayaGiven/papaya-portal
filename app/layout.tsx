import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Papaya Social Club — Deutschland',
  description: 'Die #1 Creator Community auf TikTok Shop',
  manifest: '/manifest.json',
  icons: {
    icon: 'https://cgimvsmnfmpzpkakiguo.supabase.co/storage/v1/object/public/PSC%20LOGOS/Sun_green.png',
    apple: 'https://cgimvsmnfmpzpkakiguo.supabase.co/storage/v1/object/public/PSC%20LOGOS/Sun_green.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Papaya DE',
  },
  other: {
    'theme-color': '#1B5E3B',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-dm-sans antialiased bg-brand-light-pink min-h-screen pb-20 md:pb-0">
        {children}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `
        }} />
      </body>
    </html>
  )
}
