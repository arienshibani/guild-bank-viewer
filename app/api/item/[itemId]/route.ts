import { type NextRequest, NextResponse } from "next/server"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params

  console.log(`[API] Fetching item data for itemId: ${itemId}`)

  try {
    // Fetch from Wowhead's tooltip API
    const response = await fetch(`https://nether.wowhead.com/tooltip/item/${itemId}?json`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GuildBankViewer/1.0)",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    console.log(`[API] Wowhead response status: ${response.status}`)

    if (!response.ok) {
      console.error(`[API] Wowhead API error: ${response.status} ${response.statusText}`)
      return NextResponse.json({ error: "Failed to fetch item data" }, { status: response.status })
    }

    const data = await response.json()
    console.log(`[API] Raw Wowhead data for item ${itemId}:`, JSON.stringify(data, null, 2))

    // Parse the tooltip data to extract structured information
    const parsedData = parseWowheadTooltip(data)
    console.log(`[API] Parsed data for item ${itemId}:`, JSON.stringify(parsedData, null, 2))

    return NextResponse.json(parsedData)
  } catch (error) {
    console.error(`[API] Error fetching item data for ${itemId}:`, error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function parseWowheadTooltip(data: Record<string, unknown>) {
  console.log(`[PARSE] Parsing Wowhead data:`, data)

  // Extract basic info
  const name = data.name || "Unknown Item"
  const quality = data.quality || 0
  const level = data.level || null
  const classs = data.class || null
  const subclass = data.subclass || null
  const icon = data.icon || null
  const iconName = data.icon || null

  console.log(`[PARSE] Extracted fields:`, {
    name,
    quality,
    level,
    classs,
    subclass,
    icon,
    iconName
  })

  // Extract description (tooltip text)
  const description = data.tooltip || null

  // Extract stats from tooltip
  const stats = extractStats(typeof data.tooltip === 'string' ? data.tooltip : '')

  // Extract sale price
  const salePrice = extractSalePrice(typeof data.tooltip === 'string' ? data.tooltip : '')

  // Extract item type/category
  const category = extractCategory(typeof data.tooltip === 'string' ? data.tooltip : '', typeof classs === 'string' ? classs : '', typeof subclass === 'string' ? subclass : '')

  return {
    name,
    quality,
    level,
    classs,
    subclass,
    icon,
    iconName,
    description,
    stats,
    salePrice,
    category,
    rawData: data // Keep raw data for debugging
  }
}

function extractStats(tooltip: string): string[] {
  if (!tooltip) return []

  const stats: string[] = []
  const lines = tooltip.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    // Look for stat lines (usually contain + or - followed by numbers)
    if (trimmed.match(/^[+-]\d+/) || trimmed.match(/^\d+\s+(Stamina|Strength|Agility|Intellect|Spirit|Armor|Damage|Healing)/i)) {
      stats.push(trimmed)
    }
  }

  return stats
}

function extractSalePrice(tooltip: string): { gold: number; silver: number; copper: number } | null {
  if (!tooltip) return null

  // Look for "Sells for" or "Buy Price" patterns
  const priceMatch = tooltip.match(/(?:Sells for|Buy Price):\s*(\d+)\s*g\s*(\d+)\s*s\s*(\d+)\s*c/i)
  if (priceMatch) {
    return {
      gold: parseInt(priceMatch[1]) || 0,
      silver: parseInt(priceMatch[2]) || 0,
      copper: parseInt(priceMatch[3]) || 0
    }
  }

  // Try alternative patterns
  const altMatch = tooltip.match(/(\d+)\s*g\s*(\d+)\s*s\s*(\d+)\s*c/i)
  if (altMatch) {
    return {
      gold: parseInt(altMatch[1]) || 0,
      silver: parseInt(altMatch[2]) || 0,
      copper: parseInt(altMatch[3]) || 0
    }
  }

  return null
}

function extractCategory(tooltip: string, classs: string, subclass: string): string {
  if (classs && subclass) {
    return `${classs} - ${subclass}`
  }
  if (classs) {
    return classs
  }
  if (subclass) {
    return subclass
  }

  // Try to extract from tooltip
  if (tooltip) {
    const lines = tooltip.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.match(/^(Weapon|Armor|Consumable|Container|Projectile|Quiver|Recipe|Miscellaneous)/i)) {
        return trimmed
      }
    }
  }

  return "Miscellaneous"
}
