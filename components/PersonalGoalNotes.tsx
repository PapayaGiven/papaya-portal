'use client'
import { useState, useTransition } from 'react'

export default function PersonalGoalNotes({ initialNotes }: { initialNotes: string | null }) {
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [isPending, startTransition] = useTransition()

  async function save() {
    startTransition(async () => {
      const { updatePersonalGoalNotes } = await import('@/app/dashboard/actions')
      await updatePersonalGoalNotes(notes)
      setEditing(false)
    })
  }

  return (
    <div className="w-full mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-dm-sans text-xs font-semibold text-gray-400 uppercase tracking-widest">Notizen</h4>
        <button onClick={() => editing ? save() : setEditing(true)} className="font-dm-sans text-xs text-brand-green hover:underline">
          {isPending ? 'Speichern...' : editing ? 'Speichern' : 'Bearbeiten'}
        </button>
      </div>
      {editing ? (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Deine Notizen hier..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-dm-sans text-gray-700 focus:outline-none focus:border-brand-green resize-none"
        />
      ) : (
        <div className="font-dm-sans text-sm text-gray-600 whitespace-pre-line min-h-[2rem]">
          {notes || <span className="text-gray-400 italic">Noch keine Notizen</span>}
        </div>
      )}
    </div>
  )
}
