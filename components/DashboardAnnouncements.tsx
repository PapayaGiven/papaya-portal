'use client'
import { useState, useEffect } from 'react'
import { Announcement } from '@/lib/types'

export default function DashboardAnnouncements({ announcements }: { announcements: Announcement[] }) {
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([])
  const [popupToShow, setPopupToShow] = useState<Announcement | null>(null)

  useEffect(() => {
    // Check for popups that haven't been shown yet
    const popups = announcements.filter((a) => a.display_type === 'popup')
    for (const popup of popups) {
      const key = `announcement_seen_${popup.id}`
      if (!localStorage.getItem(key)) {
        setPopupToShow(popup)
        localStorage.setItem(key, 'true')
        break
      }
    }
  }, [announcements])

  const banners = announcements.filter(
    (a) => a.display_type === 'banner' && !dismissedBanners.includes(a.id)
  )

  return (
    <>
      {/* Banners */}
      {banners.map((b) => (
        <div key={b.id} className="bg-brand-green text-white px-4 py-3 flex items-center justify-between gap-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between w-full">
            <div>
              <span className="font-dm-sans font-semibold text-sm">{b.title}</span>
              <span className="font-dm-sans text-sm ml-2 opacity-90">{b.message}</span>
            </div>
            <button
              onClick={() => setDismissedBanners((prev) => [...prev, b.id])}
              className="text-white/70 hover:text-white shrink-0 ml-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}

      {/* Popup */}
      {popupToShow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPopupToShow(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
            <h2 className="font-playfair text-2xl text-brand-black mb-3">{popupToShow.title}</h2>
            <p className="font-dm-sans text-sm text-gray-600 mb-6">{popupToShow.message}</p>
            <button
              onClick={() => setPopupToShow(null)}
              className="w-full py-3 rounded-xl font-dm-sans font-semibold text-sm text-white bg-brand-green hover:bg-brand-green/90 transition"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}
    </>
  )
}
