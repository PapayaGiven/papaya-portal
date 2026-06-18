'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { CreatorLevel, LEVEL_CONFIG } from '@/lib/types'

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function adminLogin(password: string): Promise<{ error?: string }> {
  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: 'Wrong password.' }
  }
  const cookieStore = await cookies()
  cookieStore.set('admin_session', 'valid', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: '/',
    sameSite: 'lax',
  })
  redirect('/admin')
}

export async function adminLogout() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
  redirect('/admin')
}

// ── Creators ──────────────────────────────────────────────────────────────────

export async function updateCreatorGMV(id: string, gmv: number): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  let newLevel: CreatorLevel = 'Initiation'
  if (gmv >= 10000) newLevel = 'Elite'
  else if (gmv >= 1000) newLevel = 'Pro'
  else if (gmv >= 300) newLevel = 'Rising'

  const newTarget = LEVEL_CONFIG[newLevel].target ?? 10000

  const { error } = await supabase
    .from('creators')
    .update({ gmv, level: newLevel, gmv_target: newTarget })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return {}
}

export async function updateCreatorLevel(id: string, level: CreatorLevel): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const newTarget = LEVEL_CONFIG[level].target ?? 10000

  const { error } = await supabase
    .from('creators')
    .update({ level, gmv_target: newTarget })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return {}
}

export async function updateCreatorPersonalGoal(id: string, goal: number): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('creators')
    .update({ personal_gmv_goal: goal })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return {}
}

export async function toggleCreatorActive(id: string, isActive: boolean): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('creators').update({ is_active: isActive }).eq('id', id)
  revalidatePath('/admin')
}

function generateAccessCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const rand = (set: string, n: number) => Array.from({ length: n }, () => set[Math.floor(Math.random() * set.length)]).join('')
  return `${rand(letters, 3)}-${rand('0123456789', 3)}-${rand(letters, 3)}`
}

async function generateUniqueAccessCode(): Promise<string> {
  const supabase = createAdminClient()
  for (let i = 0; i < 10; i++) {
    const code = generateAccessCode()
    const { data } = await supabase.from('creators').select('id').eq('access_code', code).maybeSingle()
    if (!data) return code
  }
  return generateAccessCode()
}

export async function addCreator(name: string, email: string): Promise<{ error?: string; access_code?: string }> {
  const supabase = createAdminClient()

  const access_code = await generateUniqueAccessCode()

  const { error: dbError } = await supabase.from('creators').insert({ name, email, access_code })
  if (dbError) return { error: dbError.message }

  revalidatePath('/admin')
  return { access_code }
}

export async function regenerateAccessCode(id: string): Promise<{ error?: string; access_code?: string }> {
  const supabase = createAdminClient()
  const access_code = await generateUniqueAccessCode()
  const { error } = await supabase.from('creators').update({ access_code }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { access_code }
}

// ── Onboarding (public, rate-limited by server action) ────────────────────────

export async function verifyAccessCode(code: string): Promise<{ error?: string; name?: string; email?: string }> {
  const supabase = createAdminClient()
  const cleaned = code.trim().toUpperCase()
  const { data, error } = await supabase
    .from('creators')
    .select('name, email, has_completed_onboarding')
    .eq('access_code', cleaned)
    .maybeSingle()
  if (error) return { error: error.message }
  if (!data) return { error: 'invalid' }
  if (data.has_completed_onboarding) return { error: 'already_completed' }
  return { name: data.name ?? '', email: data.email ?? '' }
}

export async function completeOnboarding(data: {
  access_code: string
  email: string
  password: string
}): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const cleaned = data.access_code.trim().toUpperCase()

  const { data: creator, error: fetchErr } = await supabase
    .from('creators')
    .select('id, email, has_completed_onboarding')
    .eq('access_code', cleaned)
    .maybeSingle()

  if (fetchErr) return { error: fetchErr.message }
  if (!creator) return { error: 'Código no válido.' }
  if (creator.has_completed_onboarding) return { error: 'Esta cuenta ya fue creada. Inicia sesión.' }

  const email = data.email.trim().toLowerCase()

  const { data: { users } } = await supabase.auth.admin.listUsers()
  const existingAuth = users.find((u) => u.email === email)

  if (existingAuth) {
    const { error: updateErr } = await supabase.auth.admin.updateUserById(existingAuth.id, {
      password: data.password,
      email_confirm: true,
    })
    if (updateErr) return { error: updateErr.message }
  } else {
    const { error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
    })
    if (createErr) return { error: createErr.message }
  }

  const { error: updErr } = await supabase
    .from('creators')
    .update({ email, has_completed_onboarding: true })
    .eq('id', creator.id)

  if (updErr) return { error: updErr.message }

  revalidatePath('/admin')
  return {}
}

export async function deleteCreator(id: string): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  const { data: creator } = await supabase
    .from('creators')
    .select('email')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('creators').delete().eq('id', id)
  if (error) return { error: error.message }

  if (creator?.email) {
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const authUser = users.find((u) => u.email === creator.email)
    if (authUser) {
      await supabase.auth.admin.deleteUser(authUser.id)
    }
  }

  revalidatePath('/admin')
  return {}
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function addProduct(data: {
  name: string
  commission_rate: number
  conversion_rate: number
  is_exclusive: boolean
  niche: string
  image_url: string | null
  product_link: string | null
  tags: string[]
  showcase_link: string | null
  sample_link: string | null
}): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('products').insert(data)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return {}
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string
    commission_rate: number
    conversion_rate: number
    is_exclusive: boolean
    niche: string
    image_url: string | null
    product_link: string | null
    tags: string[]
    showcase_link: string | null
    sample_link: string | null
  }>
): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('products').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return {}
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('products').delete().eq('id', id)
  revalidatePath('/admin')
}

export async function toggleProductExclusive(id: string, isExclusive: boolean): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('products').update({ is_exclusive: isExclusive }).eq('id', id)
  revalidatePath('/admin')
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

async function syncCampaignProducts(campaignId: string, productIds: string[]) {
  const supabase = createAdminClient()
  await supabase.from('campaign_products').delete().eq('campaign_id', campaignId)
  if (productIds.length > 0) {
    const rows = productIds.map((product_id) => ({ campaign_id: campaignId, product_id }))
    await supabase.from('campaign_products').insert(rows)
  }
}

export async function addCampaign(data: {
  brand_name: string
  description: string
  commission_rate: number
  spots_left: number
  deadline: string
  min_level: CreatorLevel
  status: string
  brand_logo_url: string | null
  product_id: string | null
  product_ids?: string[]
  budget: number | null
  product_link: string | null
  sample_available: boolean
}): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { product_ids, ...insertData } = data
  const { data: inserted, error } = await supabase.from('campaigns').insert(insertData).select('id').single()
  if (error) return { error: error.message }
  if (inserted && product_ids) {
    await syncCampaignProducts(inserted.id, product_ids)
  }
  revalidatePath('/admin')
  return {}
}

export async function updateCampaign(
  id: string,
  data: Partial<{
    brand_name: string
    description: string
    commission_rate: number
    spots_left: number
    deadline: string
    min_level: CreatorLevel
    status: string
    brand_logo_url: string | null
    product_id: string | null
    product_ids: string[]
    budget: number | null
    product_link: string | null
    sample_available: boolean
  }>
): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { product_ids, ...updateData } = data
  const { error } = await supabase.from('campaigns').update(updateData).eq('id', id)
  if (error) return { error: error.message }
  if (product_ids !== undefined) {
    await syncCampaignProducts(id, product_ids)
  }
  revalidatePath('/admin')
  return {}
}

export async function updateCampaignSpots(id: string, spots: number): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('campaigns').update({ spots_left: spots }).eq('id', id)
  revalidatePath('/admin')
}

export async function toggleCampaignStatus(id: string, currentStatus: string): Promise<void> {
  const supabase = createAdminClient()
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
  await supabase.from('campaigns').update({ status: newStatus }).eq('id', id)
  revalidatePath('/admin')
}

export async function deleteCampaign(id: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('campaigns').delete().eq('id', id)
  revalidatePath('/admin')
}

// ── Tasks (kept for data compatibility) ───────────────────────────────────────

export async function assignTask(data: {
  creator_id: string
  product_id: string
  task_name: string
  is_hero: boolean
  date?: string
}): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const taskDate = data.date || new Date().toISOString().split('T')[0]
  const { error } = await supabase.from('tasks').insert({ ...data, date: taskDate })
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return {}
}

export async function bulkAssignTask(data: {
  level: CreatorLevel
  product_id: string
  task_name: string
  is_hero: boolean
}): Promise<{ error?: string; count?: number }> {
  const supabase = createAdminClient()

  const { data: creators, error: creatorError } = await supabase
    .from('creators')
    .select('id')
    .eq('level', data.level)
    .eq('is_active', true)

  if (creatorError) return { error: creatorError.message }
  if (!creators || creators.length === 0)
    return { error: 'No active creators at this level.' }

  const today = new Date().toISOString().split('T')[0]
  const tasks = creators.map((c) => ({
    creator_id: c.id,
    product_id: data.product_id,
    task_name: data.task_name,
    is_hero: data.is_hero,
    date: today,
  }))

  const { error } = await supabase.from('tasks').insert(tasks)
  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { count: tasks.length }
}

// ── Product Requests ──────────────────────────────────────────────────────────

export async function updateProductRequestStatus(id: string, status: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('product_requests').update({ status }).eq('id', id)
  revalidatePath('/admin')
}

// ── Initiation Products ────────────────────────────────────────────────────────

export async function toggleProductInitiation(id: string, approved: boolean): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('products').update({ approved_for_initiation: approved }).eq('id', id)
  revalidatePath('/admin')
  revalidatePath('/products')
}

// ── Creator Elite Settings ─────────────────────────────────────────────────────

export async function updateCreatorEliteSettings(
  id: string,
  data: {
    whatsapp_number?: string | null
    mastermind_date?: string | null
    account_manager_name?: string | null
    account_manager_whatsapp?: string | null
    booking_link?: string | null
  }
): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('creators').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return {}
}

// ── Strategy ──────────────────────────────────────────────────────────────────

export interface VideoInput {
  video_url: string
  thumbnail_url: string
}

export interface StrategyProductInput {
  product_id: string
  is_external: boolean
  external_product_name: string
  external_brand: string
  external_commission: number | null
  priority: string
  videos_per_day: number | null
  live_hours_per_week: number | null
  gmv_target: number | null
  strategy_note: string
  hashtags: string[]
  is_retainer: boolean
  campaign_id: string | null
  videos: VideoInput[]
  video_focus: string | null
  quick_checklist: string[]
  brief_url: string | null
}

export async function saveStrategy(data: {
  creator_id: string
  month: string
  products: StrategyProductInput[]
}): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  const { data: strategy, error: stratError } = await supabase
    .from('strategies')
    .upsert({ creator_id: data.creator_id, month: data.month }, { onConflict: 'creator_id,month' })
    .select('id')
    .single()

  if (stratError) return { error: stratError.message }

  // Validate every row BEFORE deleting existing products, so a bad row can't
  // leave the strategy empty: each must be either a catalog product (product_id)
  // or an external product with a name.
  for (let i = 0; i < data.products.length; i++) {
    const p = data.products[i]
    if (p.is_external) {
      if (!p.external_product_name.trim()) {
        return { error: `Produkt ${i + 1}: Externes Produkt braucht einen Produktnamen.` }
      }
    } else if (!p.product_id) {
      return { error: `Produkt ${i + 1}: Bitte ein Katalogprodukt auswählen oder auf Extern umstellen.` }
    }
  }

  await supabase.from('strategy_products').delete().eq('strategy_id', strategy.id)

  for (const p of data.products) {
    const isExternal = p.is_external
    const { data: sp, error: spError } = await supabase
      .from('strategy_products')
      .insert({
        strategy_id: strategy.id,
        product_id: isExternal ? null : (p.product_id || null),
        is_external: isExternal,
        external_product_name: isExternal ? p.external_product_name.trim() : null,
        external_brand: isExternal ? (p.external_brand.trim() || null) : null,
        external_commission: isExternal ? p.external_commission : null,
        priority: p.priority,
        videos_per_day: p.videos_per_day,
        live_hours_per_week: p.live_hours_per_week,
        gmv_target: p.gmv_target,
        strategy_note: p.strategy_note,
        hashtags: p.hashtags,
        is_retainer: p.is_retainer,
        campaign_id: p.campaign_id || null,
        video_focus: p.video_focus || null,
        quick_checklist: p.quick_checklist ?? [],
        brief_url: p.brief_url || null,
      })
      .select('id')
      .single()

    if (spError) return { error: spError.message }

    if (p.videos.length > 0) {
      const videos = p.videos
        .filter((v) => v.video_url.trim())
        .map((v) => ({
          strategy_product_id: sp.id,
          video_url: v.video_url,
          thumbnail_url: v.thumbnail_url || null,
        }))
      if (videos.length > 0) {
        const { error: vError } = await supabase.from('strategy_videos').insert(videos)
        if (vError) return { error: vError.message }
      }
    }
  }

  revalidatePath('/admin')
  revalidatePath('/strategy')
  return {}
}

export async function getStrategyForAdmin(
  creatorId: string,
  month: string
): Promise<{ data?: { id: string; products: Record<string, unknown>[] } | null; error?: string }> {
  const supabase = createAdminClient()

  const { data: strategy, error } = await supabase
    .from('strategies')
    .select('id')
    .eq('creator_id', creatorId)
    .eq('month', month)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!strategy) return { data: null }

  const { data: products, error: pError } = await supabase
    .from('strategy_products')
    .select('*, videos:strategy_videos(*)')
    .eq('strategy_id', strategy.id)
    .order('created_at')

  if (pError) return { error: pError.message }

  return { data: { id: strategy.id, products: products ?? [] } }
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSettings() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('site_settings').select('*').single()
  return data
}

export async function updateSettings(data: {
  calls_per_month_initiation: number
  calls_per_month_rising: number
  calls_per_month_pro: number
  calls_per_month_elite: number
  booking_link_pro: string | null
  booking_link_elite: string | null
  google_sheets_url: string | null
  booking_link_initiation: string | null
  booking_link_foundation: string | null
}): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  // Upsert the single settings row
  const { error } = await supabase.from('site_settings').upsert({ id: 'default', ...data }, { onConflict: 'id' })
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return {}
}

// ── Announcements ─────────────────────────────────────────────────────────────

export async function addAnnouncement(data: {
  title: string
  message: string
  display_type: 'banner' | 'popup'
}): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('announcements').insert({ ...data, is_active: true })
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return {}
}

export async function updateAnnouncement(
  id: string,
  data: Partial<{ title: string; message: string; display_type: string; is_active: boolean }>
): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('announcements').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return {}
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('announcements').delete().eq('id', id)
  revalidatePath('/admin')
  revalidatePath('/dashboard')
}

// ── Levels ────────────────────────────────────────────────────────────────────

export async function updateLevel(
  id: string,
  data: Partial<{ emoji: string; color: string; includes: string[] }>
): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('levels').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/progress')
  return {}
}

export async function seedDefaultLevels(): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const defaults = [
    { name: 'Initiation', emoji: '🌱', min_gmv: 0, max_gmv: 299, color: '#9CA3AF', includes: ['Community Zugang', 'Basis Produktkatalog', 'Dashboard'], sort_order: 0 },
    { name: 'Rising', emoji: '🌸', min_gmv: 300, max_gmv: 999, color: '#F4A7C3', includes: ['Alles von Initiation', 'Kampagnen freigeschaltet', 'Ranking freigeschaltet'], sort_order: 1 },
    { name: 'Pro', emoji: '💚', min_gmv: 1000, max_gmv: 9999, color: '#1B5E3B', includes: ['Alles von Rising', '1:1 Calls', 'Account Manager', 'Hashtags & Beispielvideos'], sort_order: 2 },
    { name: 'Elite', emoji: '👑', min_gmv: 10000, max_gmv: null, color: '#F59E0B', includes: ['Alles von Pro', 'Partnership', 'Premium-Boni', 'Mastermind Events'], sort_order: 3 },
  ]
  const { error } = await supabase.from('levels').upsert(defaults, { onConflict: 'name' })
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return {}
}

// ── Rewards ───────────────────────────────────────────────────────────────────

export async function addReward(data: {
  level_name: string
  title: string
  description: string
  emoji: string
  cta_type: string | null
  cta_url: string | null
  sort_order: number
}): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('rewards').insert(data)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/rewards')
  return {}
}

export async function updateReward(
  id: string,
  data: Partial<{ title: string; description: string; emoji: string; cta_type: string | null; cta_url: string | null; sort_order: number }>
): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('rewards').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/rewards')
  return {}
}

export async function deleteReward(id: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('rewards').delete().eq('id', id)
  revalidatePath('/admin')
  revalidatePath('/rewards')
}

export async function confirmRewardReceived(creatorRewardId: string): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('creator_rewards').update({ status: 'received' }).eq('id', creatorRewardId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return {}
}

// ── Violations ────────────────────────────────────────────────────────────────

export async function updateViolationStatus(id: string, status: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('violations').update({ status }).eq('id', id)
  revalidatePath('/admin')
}

export async function updateViolationNotes(id: string, admin_notes: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('violations').update({ admin_notes }).eq('id', id)
  revalidatePath('/admin')
}

// ── Papaya Picks ──────────────────────────────────────────────────────────────

type PapayaPickInput = {
  product_name: string
  brand_name?: string | null
  niche?: string | null
  commission_rate?: number | null
  product_link?: string | null
  sample_link?: string | null
  product_image_url?: string | null
  units_sold_this_week?: number
  growth_percentage?: number
  affiliates_count?: number
  videos_count?: number
  why_its_a_pick?: string | null
  example_video_url?: string | null
  min_level?: 'Initiation' | 'Rising' | 'Pro' | 'Elite'
  is_active?: boolean
  expires_at?: string | null
}

export async function addPapayaPick(input: PapayaPickInput): Promise<{ error?: string }> {
  if (!input.product_name?.trim()) return { error: 'Product name required' }
  const supabase = createAdminClient()
  const { error } = await supabase.from('papaya_picks').insert(input)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/papaya-picks')
  return {}
}

export async function updatePapayaPick(id: string, patch: Partial<PapayaPickInput>): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('papaya_picks').update(patch).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/papaya-picks')
  return {}
}

export async function deletePapayaPick(id: string): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('papaya_picks').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/papaya-picks')
  return {}
}
