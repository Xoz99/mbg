// types/menu.ts
export interface MenuIngredient {
    id: string
    name: string
    quantity?: string
    photoUrl?: string | null
    notes?: string
  }
  
  export interface DayMenu {
    id: string
    date: string
    dayNumber: number
    menuName: string
    description?: string
    cookingStartAt: string
    cookingEndAt: string
    samplePhotoUrl: string | null
    documentedBy: { id: string; name: string } | null
    nutritionInfo: { 
      kalori: number
      protein: number
      lemak: number
      karbohidrat: number 
    }
    estimatedCost: number
    expectedTrays: number
    difficulty: "EASY" | "MEDIUM" | "HARD"
    ingredients: MenuIngredient[]
    notes?: string
  }
  
  export interface WeeklyMenu {
    id: string
    weekNumber: number
    year: number
    startDate: string
    endDate: string
    kitchenId: string
    createdBy: { id: string; name: string }
    status: "APPROVED" | "PENDING" | "DRAFT" | "REJECTED"
    approvedBy?: string
    approvedAt?: string
    notes: string
    dailyMenus: DayMenu[]
  }