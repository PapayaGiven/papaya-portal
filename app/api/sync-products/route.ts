import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = createAdminClient()

  // Get the Google Sheets URL from settings
  const { data: settings } = await supabase
    .from('site_settings')
    .select('google_sheets_url')
    .single()

  if (!settings?.google_sheets_url) {
    return NextResponse.json({ error: 'No Google Sheets URL configured' }, { status: 400 })
  }

  try {
    // Fetch CSV from the Google Sheets published URL
    const res = await fetch(settings.google_sheets_url)
    if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.statusText}`)
    const csv = await res.text()

    const lines = csv.split('\n').filter((l) => l.trim())
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV has no data rows' }, { status: 400 })
    }

    // Parse header
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const nameIdx = headers.indexOf('name')
    const commissionIdx = headers.indexOf('commission_rate')
    const nicheIdx = headers.indexOf('niche')
    const showcaseIdx = headers.indexOf('showcase_link')
    const sampleIdx = headers.indexOf('sample_link')
    const exclusiveIdx = headers.indexOf('is_exclusive')

    if (nameIdx === -1) {
      return NextResponse.json({ error: 'CSV must have a "name" column' }, { status: 400 })
    }

    let upserted = 0

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim())
      const name = cols[nameIdx]
      if (!name) continue

      const product: Record<string, unknown> = { name }

      if (commissionIdx !== -1 && cols[commissionIdx]) {
        product.commission_rate = parseFloat(cols[commissionIdx]) || null
      }
      if (nicheIdx !== -1 && cols[nicheIdx]) {
        product.niche = cols[nicheIdx] || null
      }
      if (showcaseIdx !== -1 && cols[showcaseIdx]) {
        product.showcase_link = cols[showcaseIdx] || null
      }
      if (sampleIdx !== -1 && cols[sampleIdx]) {
        product.sample_link = cols[sampleIdx] || null
      }
      if (exclusiveIdx !== -1 && cols[exclusiveIdx]) {
        product.is_exclusive = cols[exclusiveIdx].toLowerCase() === 'true'
      }

      const { error } = await supabase
        .from('products')
        .upsert(product, { onConflict: 'name' })

      if (!error) upserted++
    }

    // Update last_synced_at
    await supabase
      .from('site_settings')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', 'default')

    return NextResponse.json({ success: true, upserted })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
