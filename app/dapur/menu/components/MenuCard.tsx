// app/dapur/menu/components/MenuCard.tsx
import { Calendar, Eye, Upload, X, Edit, Copy, ImageIcon, ShieldAlert, AlertCircle, Check, Flame, Drumstick, Wheat, ShoppingBag } from "lucide-react"
import { DayMenu } from "../types/menu"
import { SchoolProfile } from "../constants/schoolProfiles"
import { validateMenuAgainstSchool } from "../utils/menuValidation"
import { getDayName, getDifficultyConfig } from "../utils/menuHelpers"

interface MenuCardProps {
  menu: DayMenu
  selectedSchool: SchoolProfile
  onViewDetail: (menu: DayMenu) => void
  onProofUpload: (menuId: string, file?: File) => void
  onClearProof: (menuId: string) => void
}

export function MenuCard({ 
  menu, 
  selectedSchool, 
  onViewDetail, 
  onProofUpload, 
  onClearProof 
}: MenuCardProps) {
  const difficultyConfig = getDifficultyConfig(menu.difficulty)
  const validation = validateMenuAgainstSchool(menu, selectedSchool)
  const hasRisk = validation.hasRisk
  const hasProof = !!menu.samplePhotoUrl

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all group
        ${hasRisk ? "border-red-200 hover:border-red-300 hover:shadow-md" : "border-gray-100 hover:shadow-lg hover:border-[#D0B064]"}
      `}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B263A] to-[#2A3749] p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <div>
              <p className="font-bold text-lg">{getDayName(menu.dayNumber)}</p>
              <p className="text-xs text-white/80">{menu.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1
                ${hasProof ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-white/20 text-white border border-white/30"}
              `}
            >
              <ImageIcon className="w-3 h-3" />
              {hasProof ? "Bukti: Sudah" : "Bukti: Belum"}
            </span>
            {hasRisk && (
              <span className="px-2 py-1 bg-red-100/20 rounded-full text-xs font-bold flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-red-700" />
                Risiko Alergi
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Menu Name */}
        <h3 className="font-bold text-gray-900 text-base mb-2 leading-tight min-h-[48px]">{menu.menuName}</h3>
        <p className="text-xs text-gray-600 mb-3">{menu.description}</p>

        {/* Tags */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyConfig.color}`}>
            {difficultyConfig.icon} {difficultyConfig.text}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            {menu.ingredients.length} bahan
          </span>

          {hasRisk ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
              <AlertCircle className="w-3.5 h-3.5" />
              Risiko Alergi
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              Aman
            </span>
          )}
        </div>

        {/* Nutrition Info */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-orange-50 rounded-lg p-2 border border-orange-100 text-center">
            <Flame className="w-4 h-4 text-orange-600 mx-auto mb-1" />
            <p className="text-xs text-orange-600 font-medium">{menu.nutritionInfo.kalori} kcal</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 text-center">
            <Drumstick className="w-4 h-4 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-blue-600 font-medium">{menu.nutritionInfo.protein}g</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 border border-green-100 text-center">
            <Wheat className="w-4 h-4 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-green-600 font-medium">{menu.nutritionInfo.karbohidrat}g</p>
          </div>
        </div>

        {/* Info Detail */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Target:</span>
            <span className="font-semibold text-gray-900">{menu.expectedTrays.toLocaleString()} trays</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Biaya/tray:</span>
            <span className="font-semibold text-gray-900">Rp {menu.estimatedCost.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Waktu masak:</span>
            <span className="font-semibold text-gray-900">
              {menu.cookingStartAt} - {menu.cookingEndAt}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetail(menu)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] transition-colors text-sm font-semibold"
          >
            <Eye className="w-4 h-4" />
            Detail
          </button>
          <label
            htmlFor={`proof-${menu.id}`}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            title="Upload bukti"
          >
            <Upload className="w-4 h-4" />
          </label>
          <input
            id={`proof-${menu.id}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onProofUpload(menu.id, e.target.files?.[0])}
          />
          {menu.samplePhotoUrl ? (
            <button
              onClick={() => onClearProof(menu.id)}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Hapus bukti"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Edit className="w-4 h-4" />
            </button>
          )}
          <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}