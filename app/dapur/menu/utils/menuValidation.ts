// utils/menuValidation.ts
import { AllergenKey } from '../constants/allergenData'
import { SchoolProfile } from '../constants/schoolProfiles'
import { DayMenu } from '../types/menu'
import { detectAllergensInText } from './allergenDetection'

export interface ValidationIssue {
  ingredientId: string
  ingredientName: string
  allergens: AllergenKey[]
}

export interface ValidationResult {
  issues: ValidationIssue[]
  hasRisk: boolean
}

export function validateMenuAgainstSchool(
  menu: DayMenu,
  school: SchoolProfile
): ValidationResult {
  const issues: ValidationIssue[] = []
  
  menu.ingredients.forEach((ing) => {
    const base = `${ing.name ?? ""} ${ing.notes ?? ""}`.trim()
    const matched = detectAllergensInText(base)
    const restricted = matched.filter((m) => 
      school.restrictedAllergens.includes(m)
    )
    
    if (restricted.length) {
      issues.push({ 
        ingredientId: ing.id, 
        ingredientName: ing.name, 
        allergens: restricted 
      })
    }
  })
  
  return { issues, hasRisk: issues.length > 0 }
}