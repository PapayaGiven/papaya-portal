import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminPanel from '@/components/admin/AdminPanel'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin_session')

  if (adminSession?.value !== 'valid') {
    return <AdminLogin />
  }

  const supabase = createAdminClient()

  const [
    creatorsRes,
    productsRes,
    campaignsRes,
    applicationsRes,
    productRequestsRes,
    initiationSelectionsRes,
    announcementsRes,
    levelsRes,
    rewardsRes,
    creatorRewardsRes,
    settingsRes,
    violationsRes,
    papayaPicksRes,
  ] = await Promise.all([
    supabase
      .from('creators')
      .select('*')
      .order('gmv', { ascending: false }),
    supabase
      .from('products')
      .select('*')
      .order('commission_rate', { ascending: false }),
    supabase
      .from('campaigns')
      .select('*, campaign_products(product_id)')
      .order('created_at', { ascending: false }),
    supabase
      .from('campaign_applications')
      .select('*, creator:creators(name, email), campaign:campaigns(brand_name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('product_requests')
      .select('*, creator:creators(name, email)')
      .order('created_at', { ascending: false }),
    supabase
      .from('creator_initiation_products')
      .select('creator_id, product_id, product:products(name), creator:creators(name, email)')
      .order('selected_at', { ascending: false }),
    supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('levels')
      .select('*')
      .order('sort_order'),
    supabase
      .from('rewards')
      .select('*')
      .order('sort_order'),
    supabase
      .from('creator_rewards')
      .select('*, creator:creators(name, email), reward:rewards(title, level_name)')
      .order('claimed_at', { ascending: false }),
    supabase
      .from('site_settings')
      .select('*')
      .single(),
    supabase
      .from('violations')
      .select('*, creator:creators(name, email)')
      .order('created_at', { ascending: false }),
    supabase
      .from('papaya_picks')
      .select('*')
      .order('papaya_pick_score', { ascending: false }),
  ])

  return (
    <AdminPanel
      creators={creatorsRes.data ?? []}
      products={productsRes.data ?? []}
      campaigns={campaignsRes.data ?? []}
      applications={applicationsRes.data ?? []}
      productRequests={productRequestsRes.data ?? []}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initiationSelections={(initiationSelectionsRes.data ?? []) as any}
      announcements={announcementsRes.data ?? []}
      levels={levelsRes.data ?? []}
      rewards={rewardsRes.data ?? []}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      creatorRewards={(creatorRewardsRes.data ?? []) as any}
      settings={settingsRes.data ?? null}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      violations={(violationsRes.data ?? []) as any}
      papayaPicks={papayaPicksRes.data ?? []}
    />
  )
}
