'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Creator, Product, Campaign, CreatorLevel, Announcement, LevelRow, RewardRow, Violation, SiteSettings } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import StrategyManager from '@/components/admin/StrategyManager'
import {
  adminLogout,
  addCreator, updateCreatorGMV, updateCreatorLevel, updateCreatorPersonalGoal, toggleCreatorActive, deleteCreator, updateCreatorEliteSettings, resendInvite,
  addProduct, updateProduct, deleteProduct, toggleProductExclusive, toggleProductInitiation,
  addCampaign, updateCampaign, updateCampaignSpots, toggleCampaignStatus, deleteCampaign,
  updateProductRequestStatus,
  addAnnouncement, updateAnnouncement, deleteAnnouncement,
  seedDefaultLevels,
  addReward, deleteReward, confirmRewardReceived,
  updateSettings,
  updateViolationStatus, updateViolationNotes,
} from '@/app/admin/actions'

async function uploadToStorage(bucket: string, file: File): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(fileName, file)
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return publicUrl
}

interface ApplicationRow {
  id: string
  posts_offered: number | null
  live_hours_offered: number | null
  price_offered: number | null
  created_at: string
  creator: { name: string | null; email: string } | null
  campaign: { brand_name: string } | null
}

interface ProductRequestRow {
  id: string
  product_name: string
  brand_name: string
  reason: string | null
  contact_info: string | null
  status: string
  created_at: string
  creator: { name: string | null; email: string } | null
}

interface InitiationSelectionRow {
  creator_id: string
  product_id: string
  product: { name: string } | null
  creator: { name: string | null; email: string } | null
}

interface CreatorRewardRow {
  id: string
  creator_id: string
  reward_id: string
  status: string
  claimed_at: string | null
  creator: { name: string | null; email: string } | null
  reward: { title: string; level_name: string } | null
}

interface ViolationRow extends Violation {
  creator: { name: string | null; email: string } | null
}

interface AdminPanelProps {
  creators: Creator[]
  products: Product[]
  campaigns: Campaign[]
  applications: ApplicationRow[]
  productRequests: ProductRequestRow[]
  initiationSelections: InitiationSelectionRow[]
  announcements: Announcement[]
  levels: LevelRow[]
  rewards: RewardRow[]
  creatorRewards: CreatorRewardRow[]
  settings: SiteSettings | null
  violations: ViolationRow[]
}

const LEVELS: CreatorLevel[] = ['Initiation', 'Rising', 'Pro', 'Elite']
const LEVEL_COLORS: Record<CreatorLevel, string> = {
  Initiation: 'bg-gray-100 text-gray-600',
  Rising: 'bg-pink-100 text-pink-700',
  Pro: 'bg-emerald-100 text-emerald-700',
  Elite: 'bg-amber-100 text-amber-700',
}

const DEFAULT_TAGS = ['viral', 'evergreen', 'seasonal', 'trending', 'new']
const TAG_PALETTE: Record<string, string> = {
  viral: 'bg-orange-100 text-orange-700',
  evergreen: 'bg-emerald-100 text-emerald-700',
  seasonal: 'bg-blue-100 text-blue-700',
  trending: 'bg-purple-100 text-purple-700',
  new: 'bg-pink-100 text-pink-700',
}
function tagColor(tag: string): string {
  return TAG_PALETTE[tag] ?? 'bg-gray-100 text-gray-600'
}

function Feedback({ msg }: { msg: string | null }) {
  if (!msg) return null
  const isError = msg.startsWith('Error')
  return (
    <p className={`text-sm font-dm-sans mt-2 px-3 py-2 rounded-lg ${isError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
      {msg}
    </p>
  )
}

// ── Creators Tab ──────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CreatorsTab({ creators, products: _products }: { creators: Creator[]; products: Product[] }) {
  const [editingGMV, setEditingGMV] = useState<{ id: string; value: string } | null>(null)
  const [editingGoal, setEditingGoal] = useState<{ id: string; value: string } | null>(null)
  const [expandedElite, setExpandedElite] = useState<string | null>(null)
  const [eliteForm, setEliteForm] = useState<{ whatsapp_number: string; mastermind_date: string; account_manager_name: string; account_manager_whatsapp: string; booking_link: string }>({ whatsapp_number: '', mastermind_date: '', account_manager_name: '', account_manager_whatsapp: '', booking_link: '' })
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', email: '' })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openElite(c: Creator) {
    setExpandedElite(c.id)
    setEliteForm({
      whatsapp_number: c.whatsapp_number ?? '',
      mastermind_date: c.mastermind_date ? c.mastermind_date.slice(0, 16) : '',
      account_manager_name: c.account_manager_name ?? '',
      account_manager_whatsapp: c.account_manager_whatsapp ?? '',
      booking_link: c.booking_link ?? '',
    })
  }

  function fb(msg: string) {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 4000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-dm-sans font-bold text-lg text-brand-black">Creators</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="font-dm-sans text-sm font-semibold bg-brand-green text-white px-4 py-2 rounded-xl hover:bg-brand-green/90 transition"
        >
          {showAdd ? 'Cancel' : '+ Invite creator'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-brand-light-pink border border-brand-pink/20 rounded-2xl p-5 mb-5">
          <h3 className="font-dm-sans font-semibold text-sm text-brand-black mb-3">Invite new creator</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Name"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              className="input-field"
            />
            <input
              type="email"
              placeholder="Email"
              value={addForm.email}
              onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
              className="input-field"
            />
          </div>
          <button
            disabled={isPending || !addForm.email}
            onClick={() => startTransition(async () => {
              const r = await addCreator(addForm.name, addForm.email)
              if (r.error) fb(`Error: ${r.error}`)
              else { fb('Creator invited!'); setAddForm({ name: '', email: '' }); setShowAdd(false) }
            })}
            className="mt-3 font-dm-sans text-sm font-semibold bg-brand-green text-white px-5 py-2.5 rounded-xl hover:bg-brand-green/90 transition disabled:opacity-50"
          >
            {isPending ? 'Sending...' : 'Send invitation'}
          </button>
        </div>
      )}

      <Feedback msg={feedback} />

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-sm font-dm-sans">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Name', 'Email', 'Level', 'GMV', 'Personal Goal', 'Status', 'Actions', 'Settings'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {creators.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No creators yet.</td></tr>
            )}
            {creators.map((c) => (
              <>
              <tr key={c.id} className="bg-white hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-brand-black whitespace-nowrap">{c.name || '–'}</td>
                <td className="px-4 py-3 text-gray-500">{c.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={c.level}
                    disabled={isPending}
                    onChange={(e) => startTransition(async () => {
                      await updateCreatorLevel(c.id, e.target.value as CreatorLevel)
                      fb('Level updated')
                    })}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer ${LEVEL_COLORS[c.level]}`}
                  >
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {editingGMV?.id === c.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">$</span>
                      <input
                        type="number"
                        value={editingGMV.value}
                        onChange={(e) => setEditingGMV({ id: c.id, value: e.target.value })}
                        className="w-20 px-2 py-1 text-sm border border-brand-pink rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-pink"
                        autoFocus
                      />
                      <button
                        onClick={() => startTransition(async () => {
                          const r = await updateCreatorGMV(c.id, parseFloat(editingGMV.value))
                          if (r.error) fb(`Error: ${r.error}`)
                          else fb('GMV saved')
                          setEditingGMV(null)
                        })}
                        className="text-xs bg-brand-green text-white px-2 py-1 rounded-lg hover:bg-brand-green/90"
                      >✓</button>
                      <button onClick={() => setEditingGMV(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingGMV({ id: c.id, value: String(c.gmv) })}
                      className="font-semibold text-brand-green hover:underline"
                    >
                      ${c.gmv.toLocaleString('en-US')}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingGoal?.id === c.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">$</span>
                      <input
                        type="number"
                        value={editingGoal.value}
                        onChange={(e) => setEditingGoal({ id: c.id, value: e.target.value })}
                        className="w-20 px-2 py-1 text-sm border border-brand-pink rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-pink"
                        autoFocus
                      />
                      <button
                        onClick={() => startTransition(async () => {
                          const r = await updateCreatorPersonalGoal(c.id, parseFloat(editingGoal.value) || 0)
                          if (r.error) fb(`Error: ${r.error}`)
                          else fb('Personal goal saved')
                          setEditingGoal(null)
                        })}
                        className="text-xs bg-brand-green text-white px-2 py-1 rounded-lg hover:bg-brand-green/90"
                      >✓</button>
                      <button onClick={() => setEditingGoal(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingGoal({ id: c.id, value: String(c.personal_gmv_goal ?? 0) })}
                      className="text-brand-black hover:underline hover:text-brand-green"
                    >
                      {c.personal_gmv_goal > 0 ? `$${Number(c.personal_gmv_goal).toLocaleString('en-US')}` : <span className="text-gray-400 text-xs">Set goal</span>}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      disabled={isPending}
                      onClick={() => startTransition(async () => {
                        await toggleCreatorActive(c.id, !c.is_active)
                        fb(`Creator ${c.is_active ? 'deactivated' : 'activated'}`)
                      })}
                      className="text-xs text-gray-500 hover:text-brand-green transition px-2 py-1 rounded-lg hover:bg-gray-100"
                    >
                      {c.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => startTransition(async () => {
                        const r = await resendInvite(c.email)
                        if (r.error) fb(`Error: ${r.error}`)
                        else fb('Invite sent!')
                      })}
                      className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition"
                    >
                      Resend invite
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => {
                        if (confirm(`Delete "${c.name || c.email}"? This cannot be undone.`)) {
                          startTransition(async () => {
                            const r = await deleteCreator(c.id)
                            if (r.error) fb(`Error: ${r.error}`)
                            else fb('Creator deleted')
                          })
                        }
                      }}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => expandedElite === c.id ? setExpandedElite(null) : openElite(c)}
                    className="text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full transition"
                  >
                    {expandedElite === c.id ? 'Close' : 'Settings'}
                  </button>
                </td>
              </tr>
              {expandedElite === c.id && (
                <tr key={`${c.id}-elite`} className="bg-amber-50/50">
                  <td colSpan={8} className="px-6 py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">WhatsApp (creator)</p>
                        <input
                          placeholder="+49..."
                          value={eliteForm.whatsapp_number}
                          onChange={(e) => setEliteForm((f) => ({ ...f, whatsapp_number: e.target.value }))}
                          className="input-field text-xs"
                        />
                      </div>
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Mastermind date</p>
                        <input
                          type="datetime-local"
                          value={eliteForm.mastermind_date}
                          onChange={(e) => setEliteForm((f) => ({ ...f, mastermind_date: e.target.value }))}
                          className="input-field text-xs"
                        />
                      </div>
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Account manager name</p>
                        <input
                          placeholder="Name"
                          value={eliteForm.account_manager_name}
                          onChange={(e) => setEliteForm((f) => ({ ...f, account_manager_name: e.target.value }))}
                          className="input-field text-xs"
                        />
                      </div>
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Manager WhatsApp</p>
                        <input
                          placeholder="+49..."
                          value={eliteForm.account_manager_whatsapp}
                          onChange={(e) => setEliteForm((f) => ({ ...f, account_manager_whatsapp: e.target.value }))}
                          className="input-field text-xs"
                        />
                      </div>
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Booking link</p>
                        <input
                          placeholder="https://calendar..."
                          value={eliteForm.booking_link}
                          onChange={(e) => setEliteForm((f) => ({ ...f, booking_link: e.target.value }))}
                          className="input-field text-xs"
                        />
                      </div>
                    </div>
                    <button
                      disabled={isPending}
                      onClick={() => startTransition(async () => {
                        const r = await updateCreatorEliteSettings(c.id, {
                          whatsapp_number: eliteForm.whatsapp_number || null,
                          mastermind_date: eliteForm.mastermind_date || null,
                          account_manager_name: eliteForm.account_manager_name || null,
                          account_manager_whatsapp: eliteForm.account_manager_whatsapp || null,
                          booking_link: eliteForm.booking_link || null,
                        })
                        if (r.error) fb(`Error: ${r.error}`)
                        else { fb('Settings saved'); setExpandedElite(null) }
                      })}
                      className="font-dm-sans text-xs font-semibold bg-brand-green text-white px-4 py-2 rounded-xl hover:bg-brand-green/90 transition disabled:opacity-50"
                    >
                      {isPending ? 'Saving...' : 'Save settings'}
                    </button>
                  </td>
                </tr>
              )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Products Tab ──────────────────────────────────────────────────────────────
function ProductsTab({ products }: { products: Product[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [availableTags, setAvailableTags] = useState<string[]>(DEFAULT_TAGS)
  const [newTag, setNewTag] = useState('')
  const [form, setForm] = useState({
    name: '', commission_rate: '', conversion_rate: '', niche: '',
    is_exclusive: false, image_url: '', product_link: '', tags: [] as string[],
  })
  const [editForm, setEditForm] = useState<Partial<{
    name: string; commission_rate: number; conversion_rate: number
    niche: string; is_exclusive: boolean; image_url: string | null; product_link: string | null; tags: string[]
  }>>({})
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)

  function fb(msg: string) { setFeedback(msg); setTimeout(() => setFeedback(null), 4000) }

  function toggleTag(tag: string, current: string[], setter: (tags: string[]) => void) {
    setter(current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag])
  }

  function addCustomTag() {
    const t = newTag.trim().toLowerCase()
    if (t && !availableTags.includes(t)) {
      setAvailableTags((prev) => [...prev, t])
      setNewTag('')
    }
  }

  async function handleImageUpload(file: File, target: 'add' | 'edit') {
    setUploading(true)
    try {
      const url = await uploadToStorage('product-images', file)
      if (target === 'add') setForm((f) => ({ ...f, image_url: url }))
      else setEditForm((f) => ({ ...f, image_url: url }))
    } catch (err) {
      fb(`Error: ${err instanceof Error ? err.message : 'Upload failed'}`)
    }
    setUploading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-dm-sans font-bold text-lg text-brand-black">Products</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="font-dm-sans text-sm font-semibold bg-brand-green text-white px-4 py-2 rounded-xl hover:bg-brand-green/90 transition">
          {showAdd ? 'Cancel' : '+ Add product'}
        </button>
      </div>

      {/* Manage Tags */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-5">
        <h3 className="font-dm-sans font-semibold text-sm text-brand-black mb-2">Manage tags</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {availableTags.map((tag) => (
            <span key={tag} className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${tagColor(tag)}`}>
              {tag}
              {!DEFAULT_TAGS.includes(tag) && (
                <button
                  onClick={() => setAvailableTags((t) => t.filter((x) => x !== tag))}
                  className="opacity-60 hover:opacity-100 ml-0.5 leading-none"
                  aria-label={`Remove ${tag}`}
                >×</button>
              )}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add new tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag() } }}
            className="input-field flex-1 max-w-xs"
          />
          <button
            onClick={addCustomTag}
            className="font-dm-sans text-sm font-semibold bg-brand-black text-white px-4 py-2 rounded-xl hover:bg-brand-black/80 transition"
          >
            + Add
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-brand-light-pink border border-brand-pink/20 rounded-2xl p-5 mb-5">
          <h3 className="font-dm-sans font-semibold text-sm mb-3 text-brand-black">New product</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field col-span-2 sm:col-span-1" />
            <input placeholder="Commission %" type="number" value={form.commission_rate} onChange={(e) => setForm((f) => ({ ...f, commission_rate: e.target.value }))} className="input-field" />
            <input placeholder="Conversion %" type="number" value={form.conversion_rate} onChange={(e) => setForm((f) => ({ ...f, conversion_rate: e.target.value }))} className="input-field" />
            <input placeholder="Niche (e.g. Beauty)" value={form.niche} onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))} className="input-field" />
            <div>
              <label className="font-dm-sans text-xs font-semibold text-gray-500 mb-1 block">Product Image</label>
              <input type="file" accept="image/*" disabled={uploading} onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'add') }} className="input-field w-full text-xs" />
            </div>
            <input placeholder="Product link" value={form.product_link} onChange={(e) => setForm((f) => ({ ...f, product_link: e.target.value }))} className="input-field" />
            <label className="flex items-center gap-2 font-dm-sans text-sm text-gray-700">
              <input type="checkbox" checked={form.is_exclusive} onChange={(e) => setForm((f) => ({ ...f, is_exclusive: e.target.checked }))} className="rounded" />
              Exclusive
            </label>
          </div>
          {form.image_url && (
            <div className="mt-3">
              <p className="font-dm-sans text-xs text-gray-400 mb-1">Preview:</p>
              <img src={form.image_url} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-gray-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
          )}
          <div className="mt-3">
            <p className="font-dm-sans text-xs font-medium text-gray-600 mb-2">Tags:</p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag, form.tags, (tags) => setForm((f) => ({ ...f, tags })))}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border transition ${form.tags.includes(tag) ? `${tagColor(tag)} border-current` : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <button
            disabled={isPending || !form.name || uploading}
            onClick={() => startTransition(async () => {
              const r = await addProduct({
                name: form.name,
                commission_rate: parseFloat(form.commission_rate) || 0,
                conversion_rate: parseFloat(form.conversion_rate) || 0,
                is_exclusive: form.is_exclusive,
                niche: form.niche,
                image_url: form.image_url || null,
                product_link: form.product_link || null,
                tags: form.tags,
              })
              if (r.error) fb(`Error: ${r.error}`)
              else {
                fb('Product added')
                setForm({ name: '', commission_rate: '', conversion_rate: '', niche: '', is_exclusive: false, image_url: '', product_link: '', tags: [] })
                setShowAdd(false)
              }
            })}
            className="mt-4 font-dm-sans text-sm font-semibold bg-brand-green text-white px-5 py-2.5 rounded-xl hover:bg-brand-green/90 transition disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}

      <Feedback msg={feedback} />

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-sm font-dm-sans">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Image', 'Name', 'Commission', 'Niche', 'Tags', 'Exclusive', 'Initiation', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No products yet.</td></tr>
            )}
            {products.map((p) => (
              <>
              <tr key={p.id} className="bg-white hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-gray-100" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs">–</div>
                  }
                </td>
                <td className="px-4 py-3 font-medium text-brand-black">
                  <div>
                    <p>{p.name}</p>
                    {p.product_link && (
                      <a href={p.product_link} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-green hover:underline">Link →</a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-brand-pink">{p.commission_rate}%</td>
                <td className="px-4 py-3">
                  {p.niche && <span className="bg-brand-light-pink text-brand-green text-xs font-medium px-2 py-0.5 rounded-full">{p.niche}</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(p.tags ?? []).map((tag) => (
                      <span key={tag} className={`text-xs font-medium px-2 py-0.5 rounded-full ${tagColor(tag)}`}>{tag}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    disabled={isPending}
                    onClick={() => startTransition(async () => { await toggleProductExclusive(p.id, !p.is_exclusive); fb('Saved') })}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full transition ${p.is_exclusive ? 'bg-brand-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {p.is_exclusive ? 'Exclusive' : 'Standard'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    disabled={isPending}
                    onClick={() => startTransition(async () => { await toggleProductInitiation(p.id, !p.approved_for_initiation); fb('Saved') })}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full transition ${p.approved_for_initiation ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {p.approved_for_initiation ? 'Approved' : 'Off'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => {
                      if (editingId === p.id) { setEditingId(null); setEditForm({}) }
                      else {
                        setEditingId(p.id)
                        setEditForm({
                          name: p.name,
                          commission_rate: p.commission_rate ?? 0,
                          conversion_rate: p.conversion_rate ?? 0,
                          niche: p.niche ?? '',
                          is_exclusive: p.is_exclusive,
                          image_url: p.image_url ?? '',
                          product_link: p.product_link ?? '',
                          tags: p.tags ?? [],
                        })
                      }
                    }} className="text-xs text-gray-500 hover:text-brand-green px-2 py-1 rounded-lg hover:bg-gray-100 transition">
                      {editingId === p.id ? 'Cancel' : 'Edit'}
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => { if (confirm(`Delete "${p.name}"?`)) startTransition(async () => { await deleteProduct(p.id); fb('Deleted') }) }}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition"
                    >Delete</button>
                  </div>
                </td>
              </tr>
              {editingId === p.id && (
                <tr key={`${p.id}-edit`} className="bg-brand-light-pink/50">
                  <td colSpan={8} className="px-6 py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Name</p>
                        <input value={editForm.name ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="input-field w-full" />
                      </div>
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Commission %</p>
                        <input type="number" value={editForm.commission_rate ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, commission_rate: parseFloat(e.target.value) || 0 }))} className="input-field w-full" />
                      </div>
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Conversion %</p>
                        <input type="number" value={editForm.conversion_rate ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, conversion_rate: parseFloat(e.target.value) || 0 }))} className="input-field w-full" />
                      </div>
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Niche</p>
                        <input value={editForm.niche ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, niche: e.target.value }))} className="input-field w-full" />
                      </div>
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Product Image</p>
                        <input type="file" accept="image/*" disabled={uploading} onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'edit') }} className="input-field w-full text-xs" />
                        {editForm.image_url && (
                          <img src={editForm.image_url as string} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-gray-200 mt-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        )}
                      </div>
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Product Link</p>
                        <div className="flex gap-1">
                          <input value={editForm.product_link ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, product_link: e.target.value }))} className="input-field w-full" />
                          {editForm.product_link && (
                            <a href={editForm.product_link as string} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 px-2 py-1 rounded-lg whitespace-nowrap self-center transition">Test link</a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="font-dm-sans text-xs font-medium text-gray-600 mb-2">Tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {availableTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag, (editForm.tags as string[]) ?? [], (tags) => setEditForm((f) => ({ ...f, tags })))}
                            className={`text-xs font-medium px-2.5 py-1 rounded-full border transition ${((editForm.tags as string[]) ?? []).includes(tag) ? `${tagColor(tag)} border-current` : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      disabled={isPending || uploading}
                      onClick={() => startTransition(async () => {
                        const payload = { ...editForm, image_url: (editForm.image_url as string) || null, product_link: (editForm.product_link as string) || null }
                        await updateProduct(p.id, payload)
                        fb('Updated'); setEditingId(null); setEditForm({})
                      })}
                      className="mt-3 font-dm-sans text-xs font-semibold bg-brand-green text-white px-4 py-2 rounded-xl hover:bg-brand-green/90 transition disabled:opacity-50"
                    >
                      {isPending ? 'Saving...' : 'Save changes'}
                    </button>
                  </td>
                </tr>
              )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Campaigns Tab ─────────────────────────────────────────────────────────────
function CampaignsTab({ campaigns, products }: { campaigns: Campaign[]; products: Product[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingSpots, setEditingSpots] = useState<{ id: string; value: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const emptyForm = {
    brand_name: '', description: '', commission_rate: '', spots_left: '',
    deadline: '', min_level: 'Initiation' as CreatorLevel, status: 'active',
    brand_logo_url: '', product_id: '', budget: '', product_link: '', sample_available: false,
  }
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function fb(msg: string) { setFeedback(msg); setTimeout(() => setFeedback(null), 4000) }

  async function handleLogoUpload(file: File, target: 'add' | 'edit') {
    setUploading(true)
    try {
      const url = await uploadToStorage('campaign-assets', file)
      if (target === 'add') setForm((f) => ({ ...f, brand_logo_url: url }))
      else setEditForm((f) => ({ ...f, brand_logo_url: url }))
    } catch (err) {
      fb(`Error: ${err instanceof Error ? err.message : 'Upload failed'}`)
    }
    setUploading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-dm-sans font-bold text-lg text-brand-black">Campaigns</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="font-dm-sans text-sm font-semibold bg-brand-green text-white px-4 py-2 rounded-xl hover:bg-brand-green/90 transition">
          {showAdd ? 'Cancel' : '+ Add campaign'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-brand-light-pink border border-brand-pink/20 rounded-2xl p-5 mb-5">
          <h3 className="font-dm-sans font-semibold text-sm mb-3 text-brand-black">New campaign</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Brand name" value={form.brand_name} onChange={(e) => setForm((f) => ({ ...f, brand_name: e.target.value }))} className="input-field" />
            <input placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field" />
            <input placeholder="Commission %" type="number" value={form.commission_rate} onChange={(e) => setForm((f) => ({ ...f, commission_rate: e.target.value }))} className="input-field" />
            <input placeholder="Spots available" type="number" value={form.spots_left} onChange={(e) => setForm((f) => ({ ...f, spots_left: e.target.value }))} className="input-field" />
            <input placeholder="Deadline" type="datetime-local" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} className="input-field" />
            <select value={form.min_level} onChange={(e) => setForm((f) => ({ ...f, min_level: e.target.value as CreatorLevel }))} className="input-field">
              {LEVELS.map((l) => <option key={l} value={l}>from {l}</option>)}
            </select>
            <div>
              <label className="font-dm-sans text-xs font-semibold text-gray-500 mb-1 block">Brand Logo</label>
              <input type="file" accept="image/*" disabled={uploading} onChange={(e) => { if (e.target.files?.[0]) handleLogoUpload(e.target.files[0], 'add') }} className="input-field w-full text-xs" />
            </div>
            <select value={form.product_id} onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))} className="input-field">
              <option value="">Link product (optional)</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input placeholder="Budget ($)" type="number" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} className="input-field" />
            <input placeholder="Product link (showcase)" value={form.product_link} onChange={(e) => setForm((f) => ({ ...f, product_link: e.target.value }))} className="input-field" />
            <label className="flex items-center gap-2 font-dm-sans text-sm text-gray-700 sm:col-span-2">
              <input type="checkbox" checked={form.sample_available} onChange={(e) => setForm((f) => ({ ...f, sample_available: e.target.checked }))} className="rounded" />
              Sample available
            </label>
          </div>
          {form.brand_logo_url && (
            <div className="mt-3">
              <p className="font-dm-sans text-xs text-gray-400 mb-1">Logo preview:</p>
              <img src={form.brand_logo_url} alt="Logo" className="h-10 object-contain rounded border border-gray-200 bg-white px-2 py-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
          )}
          <button
            disabled={isPending || !form.brand_name || uploading}
            onClick={() => startTransition(async () => {
              const r = await addCampaign({
                brand_name: form.brand_name,
                description: form.description,
                commission_rate: parseFloat(form.commission_rate) || 0,
                spots_left: parseInt(form.spots_left) || 0,
                deadline: form.deadline,
                min_level: form.min_level,
                status: 'active',
                brand_logo_url: form.brand_logo_url || null,
                product_id: form.product_id || null,
                budget: parseFloat(form.budget) || null,
                product_link: form.product_link || null,
                sample_available: form.sample_available,
              })
              if (r.error) fb(`Error: ${r.error}`)
              else {
                fb('Campaign created')
                setForm(emptyForm)
                setShowAdd(false)
              }
            })}
            className="mt-3 font-dm-sans text-sm font-semibold bg-brand-green text-white px-5 py-2.5 rounded-xl hover:bg-brand-green/90 transition disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Launch campaign'}
          </button>
        </div>
      )}

      <Feedback msg={feedback} />

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-sm font-dm-sans">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Logo', 'Brand', 'Commission', 'Spots', 'Budget', 'Deadline', 'Min Level', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {campaigns.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No campaigns yet.</td></tr>
            )}
            {campaigns.map((c) => (
              <>
              <tr key={c.id} className="bg-white hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  {c.brand_logo_url
                    ? <img src={c.brand_logo_url} alt={c.brand_name} className="h-8 w-12 object-contain rounded border border-gray-100 bg-white p-0.5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    : <div className="h-8 w-12 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs">–</div>
                  }
                </td>
                <td className="px-4 py-3 font-medium text-brand-black whitespace-nowrap">
                  <Link href={`/campaigns/${c.id}`} className="hover:text-brand-green hover:underline">{c.brand_name}</Link>
                </td>
                <td className="px-4 py-3 font-bold text-brand-pink">{c.commission_rate}%</td>
                <td className="px-4 py-3">
                  {editingSpots?.id === c.id ? (
                    <div className="flex items-center gap-1.5">
                      <input type="number" value={editingSpots.value} onChange={(e) => setEditingSpots({ id: c.id, value: e.target.value })} className="w-16 px-2 py-1 text-sm border border-brand-pink rounded-lg focus:outline-none" autoFocus />
                      <button onClick={() => startTransition(async () => { await updateCampaignSpots(c.id, parseInt(editingSpots.value)); fb('Spots updated'); setEditingSpots(null) })} className="text-xs bg-brand-green text-white px-2 py-1 rounded-lg">✓</button>
                      <button onClick={() => setEditingSpots(null)} className="text-xs text-gray-400">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingSpots({ id: c.id, value: String(c.spots_left ?? 0) })} className={`font-semibold hover:underline ${(c.spots_left ?? 0) <= 3 ? 'text-orange-600' : 'text-gray-700'}`}>
                      {c.spots_left ?? '–'}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {c.budget ? `$${c.budget.toLocaleString('en-US')}` : '–'}
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                  {c.deadline ? new Date(c.deadline).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '–'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[c.min_level] || 'bg-gray-100 text-gray-600'}`}>
                    from {c.min_level}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                      {c.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                    {c.sample_available && (
                      <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Sample</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (editingId === c.id) { setEditingId(null) }
                        else {
                          setEditingId(c.id)
                          setEditForm({
                            brand_name: c.brand_name,
                            description: c.description ?? '',
                            commission_rate: String(c.commission_rate ?? ''),
                            spots_left: String(c.spots_left ?? ''),
                            deadline: c.deadline ? c.deadline.slice(0, 16) : '',
                            min_level: c.min_level,
                            status: c.status,
                            brand_logo_url: c.brand_logo_url ?? '',
                            product_id: c.product_id ?? '',
                            budget: c.budget ? String(c.budget) : '',
                            product_link: c.product_link ?? '',
                            sample_available: c.sample_available,
                          })
                        }
                      }}
                      className="text-xs text-gray-500 hover:text-brand-green px-2 py-1 rounded-lg hover:bg-gray-100 transition"
                    >
                      {editingId === c.id ? 'Cancel' : 'Edit'}
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => startTransition(async () => { await toggleCampaignStatus(c.id, c.status); fb(`Campaign ${c.status === 'active' ? 'deactivated' : 'activated'}`) })}
                      className="text-xs text-gray-500 hover:text-brand-green px-2 py-1 rounded-lg hover:bg-gray-100 transition"
                    >
                      {c.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => {
                        if (confirm(`Delete campaign "${c.brand_name}"?`)) {
                          startTransition(async () => { await deleteCampaign(c.id); fb('Campaign deleted') })
                        }
                      }}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              {editingId === c.id && (
                <tr key={`${c.id}-edit`} className="bg-brand-light-pink/50">
                  <td colSpan={9} className="px-6 py-4">
                    <h4 className="font-dm-sans font-semibold text-sm text-brand-black mb-3">Edit campaign</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Brand name</p>
                        <input value={editForm.brand_name} onChange={(e) => setEditForm((f) => ({ ...f, brand_name: e.target.value }))} className="input-field w-full" />
                      </div>
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Description</p>
                        <input value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className="input-field w-full" />
                      </div>
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Commission %</p>
                        <input type="number" value={editForm.commission_rate} onChange={(e) => setEditForm((f) => ({ ...f, commission_rate: e.target.value }))} className="input-field w-full" />
                      </div>
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Spots left</p>
                        <input type="number" value={editForm.spots_left} onChange={(e) => setEditForm((f) => ({ ...f, spots_left: e.target.value }))} className="input-field w-full" />
                      </div>
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Deadline</p>
                        <input type="datetime-local" value={editForm.deadline} onChange={(e) => setEditForm((f) => ({ ...f, deadline: e.target.value }))} className="input-field w-full" />
                      </div>
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Min level</p>
                        <select value={editForm.min_level} onChange={(e) => setEditForm((f) => ({ ...f, min_level: e.target.value as CreatorLevel }))} className="input-field w-full">
                          {LEVELS.map((l) => <option key={l} value={l}>from {l}</option>)}
                        </select>
                      </div>
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Status</p>
                        <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} className="input-field w-full">
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Brand Logo</p>
                        <input type="file" accept="image/*" disabled={uploading} onChange={(e) => { if (e.target.files?.[0]) handleLogoUpload(e.target.files[0], 'edit') }} className="input-field w-full text-xs" />
                        {editForm.brand_logo_url && (
                          <img src={editForm.brand_logo_url} alt="Logo" className="h-8 object-contain rounded border border-gray-200 bg-white px-2 py-0.5 mt-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        )}
                      </div>
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Linked product</p>
                        <select value={editForm.product_id} onChange={(e) => setEditForm((f) => ({ ...f, product_id: e.target.value }))} className="input-field w-full">
                          <option value="">None</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Budget ($)</p>
                        <input type="number" value={editForm.budget} onChange={(e) => setEditForm((f) => ({ ...f, budget: e.target.value }))} className="input-field w-full" />
                      </div>
                      <div>
                        <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Product link</p>
                        <div className="flex gap-1">
                          <input value={editForm.product_link} onChange={(e) => setEditForm((f) => ({ ...f, product_link: e.target.value }))} className="input-field w-full" />
                          {editForm.product_link && (
                            <a href={editForm.product_link} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 px-2 py-1 rounded-lg whitespace-nowrap self-center transition">Test</a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-2 font-dm-sans text-sm text-gray-700">
                          <input type="checkbox" checked={editForm.sample_available} onChange={(e) => setEditForm((f) => ({ ...f, sample_available: e.target.checked }))} className="rounded" />
                          Sample available
                        </label>
                      </div>
                    </div>
                    <button
                      disabled={isPending || !editForm.brand_name || uploading}
                      onClick={() => startTransition(async () => {
                        const r = await updateCampaign(c.id, {
                          brand_name: editForm.brand_name,
                          description: editForm.description,
                          commission_rate: parseFloat(editForm.commission_rate) || 0,
                          spots_left: parseInt(editForm.spots_left) || 0,
                          deadline: editForm.deadline,
                          min_level: editForm.min_level,
                          status: editForm.status,
                          brand_logo_url: editForm.brand_logo_url || null,
                          product_id: editForm.product_id || null,
                          budget: parseFloat(editForm.budget) || null,
                          product_link: editForm.product_link || null,
                          sample_available: editForm.sample_available,
                        })
                        if (r.error) fb(`Error: ${r.error}`)
                        else { fb('Campaign updated'); setEditingId(null) }
                      })}
                      className="mt-3 font-dm-sans text-xs font-semibold bg-brand-green text-white px-4 py-2 rounded-xl hover:bg-brand-green/90 transition disabled:opacity-50"
                    >
                      {isPending ? 'Saving...' : 'Save changes'}
                    </button>
                  </td>
                </tr>
              )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Applications Tab ──────────────────────────────────────────────────────────
function ApplicationsTab({ applications }: { applications: ApplicationRow[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-dm-sans font-bold text-lg text-brand-black">Campaign Applications</h2>
        <span className="font-dm-sans text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {applications.length} total
        </span>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-sm font-dm-sans">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Creator', 'Campaign', 'Posts', 'Live hours', 'Offer ($)', 'Date'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {applications.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No applications yet.</td></tr>
            )}
            {applications.map((a) => (
              <tr key={a.id} className="bg-white hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-brand-black whitespace-nowrap">
                  {a.creator?.name || a.creator?.email || '–'}
                  {a.creator?.email && a.creator?.name && (
                    <p className="text-xs text-gray-400 font-normal">{a.creator.email}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{a.campaign?.brand_name || '–'}</td>
                <td className="px-4 py-3 text-center"><span className="font-semibold text-brand-black">{a.posts_offered ?? '–'}</span></td>
                <td className="px-4 py-3 text-center"><span className="font-semibold text-brand-black">{a.live_hours_offered ?? '–'}h</span></td>
                <td className="px-4 py-3">
                  <span className="font-bold text-brand-green">
                    {a.price_offered != null ? `$${Number(a.price_offered).toLocaleString('en-US')}` : '–'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(a.created_at).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Product Requests Tab ──────────────────────────────────────────────────────
function RequestsTab({ productRequests }: { productRequests: ProductRequestRow[] }) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)

  function fb(msg: string) { setFeedback(msg); setTimeout(() => setFeedback(null), 4000) }

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    contacted: 'bg-blue-50 text-blue-700',
    done: 'bg-emerald-50 text-emerald-700',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-dm-sans font-bold text-lg text-brand-black">Product Requests</h2>
        <span className="font-dm-sans text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {productRequests.length} total
        </span>
      </div>

      <Feedback msg={feedback} />

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-sm font-dm-sans">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Creator', 'Product', 'Brand', 'Reason', 'Contact', 'Date', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {productRequests.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No product requests yet.</td></tr>
            )}
            {productRequests.map((r) => (
              <tr key={r.id} className="bg-white hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-brand-black whitespace-nowrap">
                  {r.creator?.name || r.creator?.email || '–'}
                  {r.creator?.email && r.creator?.name && (
                    <p className="text-xs text-gray-400 font-normal">{r.creator.email}</p>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-brand-black">{r.product_name}</td>
                <td className="px-4 py-3 text-gray-600">{r.brand_name}</td>
                <td className="px-4 py-3 text-gray-500 max-w-xs">
                  <p className="truncate">{r.reason || '–'}</p>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{r.contact_info || '–'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(r.created_at).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={r.status}
                    disabled={isPending}
                    onChange={(e) => startTransition(async () => {
                      await updateProductRequestStatus(r.id, e.target.value)
                      fb('Status updated')
                    })}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="done">Done</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Announcements Tab ─────────────────────────────────────────────────────────
function AnnouncementsTab({ announcements }: { announcements: Announcement[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', display_type: 'banner' as 'banner' | 'popup' })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function fb(msg: string) { setFeedback(msg); setTimeout(() => setFeedback(null), 4000) }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-dm-sans font-bold text-lg text-brand-black">Announcements</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="font-dm-sans text-sm font-semibold bg-brand-green text-white px-4 py-2 rounded-xl hover:bg-brand-green/90 transition">
          {showAdd ? 'Cancel' : '+ Add announcement'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-brand-light-pink border border-brand-pink/20 rounded-2xl p-5 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input-field" />
            <select value={form.display_type} onChange={(e) => setForm((f) => ({ ...f, display_type: e.target.value as 'banner' | 'popup' }))} className="input-field">
              <option value="banner">Banner</option>
              <option value="popup">Popup</option>
            </select>
            <textarea placeholder="Message" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} className="input-field sm:col-span-2 resize-none" rows={3} />
          </div>
          <button
            disabled={isPending || !form.title || !form.message}
            onClick={() => startTransition(async () => {
              const r = await addAnnouncement(form)
              if (r.error) fb(`Error: ${r.error}`)
              else { fb('Announcement created'); setForm({ title: '', message: '', display_type: 'banner' }); setShowAdd(false) }
            })}
            className="mt-3 font-dm-sans text-sm font-semibold bg-brand-green text-white px-5 py-2.5 rounded-xl hover:bg-brand-green/90 transition disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Create'}
          </button>
        </div>
      )}

      <Feedback msg={feedback} />

      <div className="space-y-3">
        {announcements.length === 0 && <p className="font-dm-sans text-sm text-gray-400 py-8 text-center">No announcements yet.</p>}
        {announcements.map((a) => (
          <div key={a.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-dm-sans font-semibold text-sm text-brand-black">{a.title}</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.display_type === 'popup' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {a.display_type}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                  {a.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="font-dm-sans text-xs text-gray-500">{a.message}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                disabled={isPending}
                onClick={() => startTransition(async () => {
                  await updateAnnouncement(a.id, { is_active: !a.is_active })
                  fb(a.is_active ? 'Deactivated' : 'Activated')
                })}
                className="text-xs text-gray-500 hover:text-brand-green px-2 py-1 rounded-lg hover:bg-gray-100 transition"
              >
                {a.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                disabled={isPending}
                onClick={() => { if (confirm('Delete announcement?')) startTransition(async () => { await deleteAnnouncement(a.id); fb('Deleted') }) }}
                className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition"
              >Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({ settings }: { settings: SiteSettings | null }) {
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    calls_per_month_initiation: settings?.calls_per_month_initiation ?? 0,
    calls_per_month_rising: settings?.calls_per_month_rising ?? 0,
    calls_per_month_pro: settings?.calls_per_month_pro ?? 2,
    calls_per_month_elite: settings?.calls_per_month_elite ?? 4,
    booking_link_pro: settings?.booking_link_pro ?? '',
    booking_link_elite: settings?.booking_link_elite ?? 'https://calendar.app.google/bW5ZsKF9wbDrLVF6A',
  })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function fb(msg: string) { setFeedback(msg); setTimeout(() => setFeedback(null), 4000) }

  const hackUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/hack`
    : '/hack'

  function copyHackUrl() {
    navigator.clipboard.writeText(hackUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-dm-sans font-bold text-lg text-brand-black mb-4">General Settings</h2>

        <div className="bg-brand-light-pink border border-brand-pink/20 rounded-2xl p-5 mb-6">
          <h3 className="font-dm-sans font-semibold text-sm text-brand-black mb-1">Hack Portal URL</h3>
          <p className="font-dm-sans text-xs text-gray-500 mb-3">
            Share this public link to give free preview access to potential creators.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-700 truncate">
              {hackUrl}
            </code>
            <button
              onClick={copyHackUrl}
              className="font-dm-sans text-sm font-semibold bg-brand-black text-white px-4 py-2.5 rounded-xl hover:bg-brand-black/80 transition shrink-0"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <a
            href="/hack"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 font-dm-sans text-xs text-brand-green hover:underline"
          >
            Open Hack Portal →
          </a>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="font-dm-sans font-semibold text-sm text-brand-black mb-3">1:1 Call Settings</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div>
              <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Calls/month Initiation</p>
              <input type="number" value={form.calls_per_month_initiation} onChange={(e) => setForm((f) => ({ ...f, calls_per_month_initiation: parseInt(e.target.value) || 0 }))} className="input-field w-full" />
            </div>
            <div>
              <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Calls/month Rising</p>
              <input type="number" value={form.calls_per_month_rising} onChange={(e) => setForm((f) => ({ ...f, calls_per_month_rising: parseInt(e.target.value) || 0 }))} className="input-field w-full" />
            </div>
            <div>
              <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Calls/month Pro</p>
              <input type="number" value={form.calls_per_month_pro} onChange={(e) => setForm((f) => ({ ...f, calls_per_month_pro: parseInt(e.target.value) || 0 }))} className="input-field w-full" />
            </div>
            <div>
              <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Calls/month Elite</p>
              <input type="number" value={form.calls_per_month_elite} onChange={(e) => setForm((f) => ({ ...f, calls_per_month_elite: parseInt(e.target.value) || 0 }))} className="input-field w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Default booking link (Pro)</p>
              <input value={form.booking_link_pro} onChange={(e) => setForm((f) => ({ ...f, booking_link_pro: e.target.value }))} placeholder="https://calendar..." className="input-field w-full" />
            </div>
            <div>
              <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Default booking link (Elite)</p>
              <input value={form.booking_link_elite} onChange={(e) => setForm((f) => ({ ...f, booking_link_elite: e.target.value }))} placeholder="https://calendar..." className="input-field w-full" />
            </div>
          </div>
          <Feedback msg={feedback} />
          <button
            disabled={isPending}
            onClick={() => startTransition(async () => {
              const r = await updateSettings({
                ...form,
                booking_link_pro: form.booking_link_pro || null,
                booking_link_elite: form.booking_link_elite || null,
              })
              if (r.error) fb(`Error: ${r.error}`)
              else fb('Settings saved')
            })}
            className="mt-3 font-dm-sans text-sm font-semibold bg-brand-green text-white px-5 py-2.5 rounded-xl hover:bg-brand-green/90 transition disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Initiation Selections Tab ──────────────────────────────────────────────────
function InitiationTab({ selections }: { selections: InitiationSelectionRow[] }) {
  const grouped = selections.reduce<Record<string, InitiationSelectionRow[]>>((acc, s) => {
    const key = s.creator?.email ?? s.creator_id
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-dm-sans font-bold text-lg text-brand-black">Initiation Product Selections</h2>
        <span className="font-dm-sans text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {Object.keys(grouped).length} creators
        </span>
      </div>
      {Object.keys(grouped).length === 0 ? (
        <p className="font-dm-sans text-sm text-gray-400 py-8 text-center">No selections yet.</p>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([email, rows]) => (
            <div key={email} className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
              <p className="font-dm-sans font-semibold text-sm text-brand-black mb-2">
                {rows[0]?.creator?.name || email}
                <span className="font-normal text-gray-400 ml-2 text-xs">{email}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {rows.map((r) => (
                  <span key={r.product_id} className="font-dm-sans text-xs font-medium bg-brand-light-pink text-brand-green px-3 py-1 rounded-full border border-brand-pink/20">
                    {r.product?.name ?? r.product_id}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Levels Tab ────────────────────────────────────────────────────────────────
function LevelsTab({ levels }: { levels: LevelRow[] }) {
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function fb(msg: string) { setFeedback(msg); setTimeout(() => setFeedback(null), 4000) }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-dm-sans font-bold text-lg text-brand-black">Levels</h2>
        <button
          disabled={isPending}
          onClick={() => startTransition(async () => {
            const r = await seedDefaultLevels()
            if (r.error) fb(`Error: ${r.error}`)
            else fb('Default levels seeded')
          })}
          className="font-dm-sans text-sm font-semibold bg-brand-black text-white px-4 py-2 rounded-xl hover:bg-brand-black/80 transition disabled:opacity-50"
        >
          Seed defaults
        </button>
      </div>
      <Feedback msg={feedback} />
      <div className="space-y-3">
        {levels.length === 0 && <p className="font-dm-sans text-sm text-gray-400 py-8 text-center">No levels configured. Click &quot;Seed defaults&quot; to create them.</p>}
        {levels.map((l) => (
          <div key={l.id} className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{l.emoji}</span>
              <div>
                <h3 className="font-dm-sans font-semibold text-sm text-brand-black">{l.name}</h3>
                <p className="font-dm-sans text-xs text-gray-400">${l.min_gmv.toLocaleString()} – {l.max_gmv ? `$${l.max_gmv.toLocaleString()}` : '∞'}</p>
              </div>
              <span className="ml-auto w-4 h-4 rounded-full" style={{ backgroundColor: l.color }} />
            </div>
            <div className="flex flex-wrap gap-1">
              {l.includes.map((inc, i) => (
                <span key={i} className="font-dm-sans text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">{inc}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Rewards Tab ───────────────────────────────────────────────────────────────
function RewardsTab({ rewards, creatorRewards }: { rewards: RewardRow[]; creatorRewards: CreatorRewardRow[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ level_name: 'Initiation', title: '', description: '', emoji: '', cta_type: '', cta_url: '', sort_order: '0' })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function fb(msg: string) { setFeedback(msg); setTimeout(() => setFeedback(null), 4000) }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-dm-sans font-bold text-lg text-brand-black">Rewards</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="font-dm-sans text-sm font-semibold bg-brand-green text-white px-4 py-2 rounded-xl hover:bg-brand-green/90 transition">
          {showAdd ? 'Cancel' : '+ Add reward'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-brand-light-pink border border-brand-pink/20 rounded-2xl p-5 mb-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <select value={form.level_name} onChange={(e) => setForm((f) => ({ ...f, level_name: e.target.value }))} className="input-field">
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input-field" />
            <input placeholder="Emoji" value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} className="input-field" />
            <input placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field col-span-2" />
            <select value={form.cta_type} onChange={(e) => setForm((f) => ({ ...f, cta_type: e.target.value }))} className="input-field">
              <option value="">No CTA</option>
              <option value="claim">Claim</option>
              <option value="link">Link</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="form">Form (address)</option>
            </select>
            <input placeholder="CTA URL" value={form.cta_url} onChange={(e) => setForm((f) => ({ ...f, cta_url: e.target.value }))} className="input-field" />
            <input placeholder="Sort order" type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} className="input-field" />
          </div>
          <button
            disabled={isPending || !form.title}
            onClick={() => startTransition(async () => {
              const r = await addReward({
                level_name: form.level_name,
                title: form.title,
                description: form.description,
                emoji: form.emoji,
                cta_type: form.cta_type || null,
                cta_url: form.cta_url || null,
                sort_order: parseInt(form.sort_order) || 0,
              })
              if (r.error) fb(`Error: ${r.error}`)
              else { fb('Reward added'); setForm({ level_name: 'Initiation', title: '', description: '', emoji: '', cta_type: '', cta_url: '', sort_order: '0' }); setShowAdd(false) }
            })}
            className="mt-3 font-dm-sans text-sm font-semibold bg-brand-green text-white px-5 py-2.5 rounded-xl hover:bg-brand-green/90 transition disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Add reward'}
          </button>
        </div>
      )}

      <Feedback msg={feedback} />

      <div className="space-y-3 mb-8">
        {rewards.length === 0 && <p className="font-dm-sans text-sm text-gray-400 py-8 text-center">No rewards configured yet.</p>}
        {LEVELS.map((level) => {
          const levelRewards = rewards.filter((r) => r.level_name === level)
          if (levelRewards.length === 0) return null
          return (
            <div key={level} className="bg-white border border-gray-100 rounded-2xl p-4">
              <h3 className="font-dm-sans font-semibold text-sm text-brand-black mb-2">{level}</h3>
              <div className="space-y-2">
                {levelRewards.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                    <span className="text-lg">{r.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-dm-sans text-sm font-medium text-brand-black">{r.title}</p>
                      <p className="font-dm-sans text-xs text-gray-500 truncate">{r.description}</p>
                    </div>
                    <button
                      disabled={isPending}
                      onClick={() => { if (confirm(`Delete "${r.title}"?`)) startTransition(async () => { await deleteReward(r.id); fb('Deleted') }) }}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition shrink-0"
                    >Delete</button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Creator reward claims */}
      {creatorRewards.length > 0 && (
        <div>
          <h3 className="font-dm-sans font-bold text-sm text-brand-black mb-3">Claimed Rewards</h3>
          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-sm font-dm-sans">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Creator', 'Reward', 'Level', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {creatorRewards.map((cr) => (
                  <tr key={cr.id} className="bg-white hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium">{cr.creator?.name || cr.creator?.email || '–'}</td>
                    <td className="px-4 py-3">{cr.reward?.title || '–'}</td>
                    <td className="px-4 py-3 text-xs">{cr.reward?.level_name || '–'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cr.status === 'received' ? 'bg-emerald-50 text-emerald-700' : cr.status === 'claimed' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                        {cr.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{cr.claimed_at ? new Date(cr.claimed_at).toLocaleDateString('en-US') : '–'}</td>
                    <td className="px-4 py-3">
                      {cr.status === 'claimed' && (
                        <button
                          disabled={isPending}
                          onClick={() => startTransition(async () => {
                            const r = await confirmRewardReceived(cr.id)
                            if (r.error) fb(`Error: ${r.error}`)
                            else fb('Confirmed as received')
                          })}
                          className="text-xs font-semibold text-brand-green hover:underline"
                        >
                          Confirm received
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Violations Tab ────────────────────────────────────────────────────────────
function ViolationsTab({ violations }: { violations: ViolationRow[] }) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<{ id: string; value: string } | null>(null)

  function fb(msg: string) { setFeedback(msg); setTimeout(() => setFeedback(null), 4000) }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-dm-sans font-bold text-lg text-brand-black">Violations</h2>
        <span className="font-dm-sans text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {violations.length} total
        </span>
      </div>
      <Feedback msg={feedback} />
      <div className="space-y-4">
        {violations.length === 0 && <p className="font-dm-sans text-sm text-gray-400 py-8 text-center">No violations reported yet.</p>}
        {violations.map((v) => (
          <div key={v.id} className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="font-dm-sans font-semibold text-sm text-brand-black">{v.creator?.name || v.creator?.email || '–'}</p>
                <p className="font-dm-sans text-xs text-gray-400">{new Date(v.created_at).toLocaleDateString('en-US')}</p>
              </div>
              <select
                value={v.status}
                disabled={isPending}
                onChange={(e) => startTransition(async () => { await updateViolationStatus(v.id, e.target.value); fb('Status updated') })}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer ${v.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : v.status === 'reviewing' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}
              >
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <p className="font-dm-sans text-sm text-gray-700 mb-3">{v.description}</p>
            {v.screenshot_urls && v.screenshot_urls.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {v.screenshot_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`Screenshot ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:border-brand-pink transition" />
                  </a>
                ))}
              </div>
            )}
            <div>
              <p className="font-dm-sans text-xs font-semibold text-gray-500 mb-1">Admin Notes</p>
              {editingNotes?.id === v.id ? (
                <div className="flex gap-2">
                  <textarea
                    value={editingNotes.value}
                    onChange={(e) => setEditingNotes({ id: v.id, value: e.target.value })}
                    className="input-field flex-1 resize-none"
                    rows={2}
                  />
                  <button
                    onClick={() => startTransition(async () => { await updateViolationNotes(v.id, editingNotes.value); fb('Notes saved'); setEditingNotes(null) })}
                    className="text-xs bg-brand-green text-white px-3 py-1 rounded-lg self-start"
                  >Save</button>
                </div>
              ) : (
                <p
                  onClick={() => setEditingNotes({ id: v.id, value: v.admin_notes ?? '' })}
                  className="font-dm-sans text-sm text-gray-500 cursor-pointer hover:text-brand-green"
                >
                  {v.admin_notes || 'Click to add notes...'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Admin Panel ──────────────────────────────────────────────────────────
type Tab = 'creators' | 'announcements' | 'applications' | 'requests' | 'campaigns' | 'products' | 'strategy' | 'initiation' | 'levels' | 'rewards' | 'settings' | 'violations'

export default function AdminPanel({ creators, products, campaigns, applications, productRequests, initiationSelections, announcements, levels, rewards, creatorRewards, settings, violations }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('creators')
  const [isPending, startTransition] = useTransition()

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'creators', label: 'Creators', count: creators.length },
    { id: 'announcements', label: 'Announcements', count: announcements.filter((a) => a.is_active).length },
    { id: 'applications', label: 'Applications', count: applications.length },
    { id: 'requests', label: 'Requests', count: productRequests.filter((r) => r.status === 'pending').length },
    { id: 'campaigns', label: 'Campaigns', count: campaigns.length },
    { id: 'products', label: 'Products', count: products.length },
    { id: 'strategy', label: 'Strategy' },
    { id: 'initiation', label: 'Initiation', count: initiationSelections.filter((s, i, arr) => arr.findIndex((x) => x.creator_id === s.creator_id) === i).length },
    { id: 'levels', label: 'Levels' },
    { id: 'rewards', label: 'Rewards', count: rewards.length },
    { id: 'settings', label: 'Settings' },
    { id: 'violations', label: 'Violations', count: violations.filter((v) => v.status === 'pending').length },
  ]

  return (
    <div className="min-h-screen bg-brand-black">
      {/* Header */}
      <div className="bg-brand-black border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image
                src="https://cgimvsmnfmpzpkakiguo.supabase.co/storage/v1/object/public/PSC%20LOGOS/Long_green.png"
                alt="Papaya Social Club"
                width={120}
                height={32}
              />
              <p className="font-playfair text-lg text-white leading-none">Admin Panel</p>
              <span className="font-dm-sans text-xs font-semibold text-white px-2.5 py-1 rounded-full" style={{ backgroundColor: '#1B5E3B' }}>🇩🇪 Deutschland</span>
            </div>
            <div className="flex items-center gap-3">
              <a href="/" className="font-dm-sans text-sm text-white/40 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/5">
                ← View app
              </a>
              <button
                disabled={isPending}
                onClick={() => startTransition(async () => { await adminLogout() })}
                className="font-dm-sans text-sm font-semibold text-brand-black bg-brand-pink hover:bg-brand-pink/90 px-4 py-2 rounded-xl transition disabled:opacity-50"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-brand-black border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 font-dm-sans text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-pink text-white'
                    : 'border-transparent text-white/40 hover:text-white/70'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${activeTab === tab.id ? 'bg-brand-pink text-brand-black' : 'bg-white/10 text-white/40'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {activeTab === 'creators' && <CreatorsTab creators={creators} products={products} />}
          {activeTab === 'announcements' && <AnnouncementsTab announcements={announcements} />}
          {activeTab === 'applications' && <ApplicationsTab applications={applications} />}
          {activeTab === 'requests' && <RequestsTab productRequests={productRequests} />}
          {activeTab === 'campaigns' && <CampaignsTab campaigns={campaigns} products={products} />}
          {activeTab === 'products' && <ProductsTab products={products} />}
          {activeTab === 'strategy' && <StrategyManager creators={creators} products={products} campaigns={campaigns} />}
          {activeTab === 'initiation' && <InitiationTab selections={initiationSelections} />}
          {activeTab === 'levels' && <LevelsTab levels={levels} />}
          {activeTab === 'rewards' && <RewardsTab rewards={rewards} creatorRewards={creatorRewards} />}
          {activeTab === 'settings' && <SettingsTab settings={settings} />}
          {activeTab === 'violations' && <ViolationsTab violations={violations} />}
        </div>
      </div>
    </div>
  )
}
