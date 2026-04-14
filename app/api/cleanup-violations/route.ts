import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Find violations older than 30 days that still have screenshots
  const { data: violations, error } = await supabase
    .from('violations')
    .select('id, screenshot_urls')
    .lt('created_at', thirtyDaysAgo.toISOString())
    .not('screenshot_urls', 'eq', '{}')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!violations || violations.length === 0) {
    return NextResponse.json({ cleaned: 0 })
  }

  let totalDeleted = 0

  for (const violation of violations) {
    const urls: string[] = violation.screenshot_urls ?? []

    // Delete each screenshot from storage
    for (const url of urls) {
      try {
        // Extract file path from the full URL
        const match = url.match(/violation-screenshots\/(.+)/)
        if (match) {
          await supabase.storage.from('violation-screenshots').remove([match[1]])
        }
      } catch {
        // Continue even if individual delete fails
      }
    }

    // Clear the screenshot_urls array
    await supabase
      .from('violations')
      .update({ screenshot_urls: [] })
      .eq('id', violation.id)

    totalDeleted++
  }

  return NextResponse.json({ cleaned: totalDeleted })
}
