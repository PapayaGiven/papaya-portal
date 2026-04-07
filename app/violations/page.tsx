'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { submitViolation } from './actions'

async function uploadScreenshot(file: File): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('violation-screenshots').upload(fileName, file)
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('violation-screenshots').getPublicUrl(fileName)
  return publicUrl
}

export default function ViolationsPage() {
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).slice(0, 5 - files.length)
    setFiles((prev) => [...prev, ...selected].slice(0, 5))
    selected.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setPreviews((prev) => [...prev, ev.target?.result as string].slice(0, 5))
      }
      reader.readAsDataURL(file)
    })
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (!description.trim()) return

    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of files) {
        const url = await uploadScreenshot(file)
        urls.push(url)
      }

      startTransition(async () => {
        const result = await submitViolation(description, urls)
        if (result.error) {
          setFeedback(result.error)
        } else {
          setSubmitted(true)
        }
        setUploading(false)
      })
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Upload fehlgeschlagen')
      setUploading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-brand-light-pink flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-brand-pink/20 p-10 text-center max-w-md w-full">
          <p className="text-4xl mb-4">✓</p>
          <h2 className="font-playfair text-2xl text-brand-black mb-2">Verstoß gemeldet</h2>
          <p className="font-dm-sans text-sm text-gray-500 mb-6">
            Vielen Dank für deine Meldung. Unser Team wird sie prüfen und sich bei dir melden.
          </p>
          <a
            href="/dashboard"
            className="inline-block font-dm-sans text-sm font-semibold bg-brand-green text-white px-6 py-3 rounded-xl hover:bg-brand-green/90 transition"
          >
            Zurück zum Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-light-pink">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="font-playfair text-4xl text-brand-black mb-2">Verstoß melden</h1>
          <p className="font-dm-sans text-sm text-gray-500">
            Wenn du eine ungerechtfertigte Verletzung auf TikTok erhalten hast, kannst du sie hier melden. Unser Team wird sie prüfen und dir helfen.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-brand-pink/20 p-6 space-y-5">
          <div>
            <label className="block font-dm-sans text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Beschreibe den Verstoß und warum du glaubst, dass er nicht korrekt ist *
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibe hier den Verstoß..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-dm-sans text-gray-700 focus:outline-none focus:border-brand-green resize-none"
            />
          </div>

          <div>
            <label className="block font-dm-sans text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Screenshots (max. 5)
            </label>
            {files.length < 5 && (
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="block w-full text-sm font-dm-sans text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-green/10 file:text-brand-green hover:file:bg-brand-green/20"
              />
            )}
            {previews.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt={`Screenshot ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {feedback && (
            <p className="text-sm font-dm-sans bg-red-50 text-red-600 px-3 py-2 rounded-lg">{feedback}</p>
          )}

          <button
            disabled={isPending || uploading || !description.trim()}
            onClick={handleSubmit}
            className="w-full font-dm-sans text-sm font-semibold bg-brand-green text-white py-3 rounded-xl hover:bg-brand-green/90 transition disabled:opacity-50"
          >
            {uploading ? 'Hochladen...' : isPending ? 'Senden...' : 'Melden'}
          </button>
        </div>
      </div>
    </div>
  )
}
