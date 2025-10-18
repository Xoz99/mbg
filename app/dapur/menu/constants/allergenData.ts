// constants/allergenData.ts
export type AllergenKey = "milk" | "egg" | "peanut" | "seafood" | "fish" | "wheat" | "soy"

export const ALLERGEN_LABEL: Record<AllergenKey, string> = {
  milk: "Susu/Dairy",
  egg: "Telur",
  peanut: "Kacang",
  seafood: "Seafood/Kerang",
  fish: "Ikan",
  wheat: "Gandum/Gluten",
  soy: "Kedelai",
}

export const ALLERGEN_KEYWORDS: Record<AllergenKey, string[]> = {
  milk: ["susu", "dairy", "milk", "keju", "butter", "mentega", "yogurt", "santan"],
  egg: ["telur", "egg"],
  peanut: ["kacang", "peanut", "tanah"],
  seafood: ["udang", "shrimp", "cumi", "squid", "kerang", "seafood", "kepiting", "crab"],
  fish: ["ikan", "tuna", "salmon", "bandeng", "nila", "gurame", "tongkol", "teri", "sarden", "lele"],
  wheat: ["gandum", "wheat", "tepung terigu", "gluten", "terigu", "roti", "mie"],
  soy: ["kedelai", "soy", "kecap", "tauco", "tempe", "tahu"],
}