// constants/schoolProfiles.ts
import { AllergenKey } from './allergenData'

export const SCHOOL_PROFILES = [
  {
    id: "school-1",
    name: "SDN Melati 01",
    restrictedAllergens: ["milk", "egg", "peanut", "fish", "seafood", "wheat", "soy"] as AllergenKey[],
    averages: { milk: 8, egg: 12, peanut: 5, seafood: 4, fish: 9, wheat: 6, soy: 4 },
  },
  {
    id: "school-2",
    name: "SMP Harapan 02",
    restrictedAllergens: ["egg", "peanut", "seafood", "fish"] as AllergenKey[],
    averages: { milk: 5, egg: 10, peanut: 7, seafood: 6, fish: 8, wheat: 3, soy: 3 },
  },
  {
    id: "school-3",
    name: "SMA Nusantara 03",
    restrictedAllergens: ["peanut", "seafood", "wheat"] as AllergenKey[],
    averages: { milk: 4, egg: 6, peanut: 9, seafood: 7, fish: 5, wheat: 8, soy: 2 },
  },
] as const

export type SchoolProfile = typeof SCHOOL_PROFILES[number]