// utils/allergenDetection.ts
import { AllergenKey, ALLERGEN_KEYWORDS } from '../constants/allergenData'

export function detectAllergensInText(text: string): AllergenKey[] {
  const lower = text.toLowerCase()
  const found = new Set<AllergenKey>()
  
  ;(Object.keys(ALLERGEN_KEYWORDS) as AllergenKey[]).forEach((key) => {
    if (ALLERGEN_KEYWORDS[key].some((kw) => lower.includes(kw))) {
      found.add(key)
    }
  })
  
  return Array.from(found)
}

export function findAllergenMatches(
  items: Array<string | { name?: string; notes?: string }>,
  restricted: AllergenKey[],
): AllergenKey[] {
  const keys = new Set<AllergenKey>()
  
  for (const it of items) {
    const text = typeof it === "string" ? it : `${it.name ?? ""} ${it.notes ?? ""}`
    const hits = detectAllergensInText(text)
    hits.forEach((h) => {
      if (restricted.includes(h)) keys.add(h)
    })
  }
  
  return Array.from(keys)
}