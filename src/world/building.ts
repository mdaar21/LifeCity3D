import type { CatalogItem, Placement } from '../lib/types'

export interface DraftPlacement {
  inventoryId: string
  placementId?: string
  expectedVersion?: number
  item: CatalogItem
  x: number
  z: number
  rotation: number
}

export function footprint(item: CatalogItem, rotation: number): [number, number] {
  return rotation % 180 === 0
    ? [item.footprint_x, item.footprint_z]
    : [item.footprint_z, item.footprint_x]
}

export function placementIssue(draft: DraftPlacement, placements: Placement[], catalog: CatalogItem[], size: number): 'bounds' | 'collision' | null {
  const [width, depth] = footprint(draft.item, draft.rotation)
  if (!Number.isInteger(draft.x) || !Number.isInteger(draft.z) || draft.x < 0 || draft.z < 0 || draft.x + width > size || draft.z + depth > size) return 'bounds'
  for (const placed of placements) {
    if (placed.id === draft.placementId) continue
    const item = catalog.find(entry => entry.id === placed.catalog_id)
    if (!item) return 'collision'
    const [otherWidth, otherDepth] = footprint(item, placed.rotation)
    if (draft.x < placed.x + otherWidth && draft.x + width > placed.x && draft.z < placed.z + otherDepth && draft.z + depth > placed.z) return 'collision'
  }
  return null
}

export function isHouse(item: CatalogItem): boolean {
  return !item.is_furniture && /house|villa|palace/.test(item.model + item.id)
}
