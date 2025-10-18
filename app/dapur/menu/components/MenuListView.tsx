// app/dapur/menu/components/MenuListView.tsx
import { Eye, Upload, X, Edit, ImageIcon, AlertCircle, Check, ShoppingBag } from "lucide-react"
import { DayMenu } from "../types/menu"
import { SchoolProfile } from "../constants/schoolProfiles"
import { validateMenuAgainstSchool } from "../utils/menuValidation"
import { getDayName, getDifficultyConfig } from "../utils/menuHelpers"

interface MenuListViewProps {
  menus: DayMenu[]
  selectedSchool: SchoolProfile
  onViewDetail: (menu: DayMenu) => void
  onProofUpload: (menuId: string, file?: File) => void
  onClearProof: (menuId: string) => void
}

export function MenuListView({ 
  menus, 
  selectedSchool, 
  onViewDetail, 
  onProofUpload, 
  onClearProof 
}: MenuListViewProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Hari/Tanggal
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Menu</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Tingkat
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Target
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Bahan
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Biaya/Tray
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {menus.map((menu) => {
              const difficultyConfig = getDifficultyConfig(menu.difficulty)
              const validation = validateMenuAgainstSchool(menu, selectedSchool)
              const hasRisk = validation.hasRisk
              const hasProof = !!menu.samplePhotoUrl

              return (
                <tr key={menu.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-gray-900">{getDayName(menu.dayNumber)}</p>
                      <p className="text-xs text-gray-500">{menu.date}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm font-semibold text-gray-900">{menu.menuName}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs text-gray-500">🔥 {menu.nutritionInfo.kalori} kcal</span>
                        <span className="text-xs text-gray-500">🍗 {menu.nutritionInfo.protein}g</span>
                        {hasRisk ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200 text-xs font-semibold">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Risiko Alergi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                            <Check className="w-3.5 h-3.5" />
                            Aman
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-semibold ${
                            hasProof
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          {hasProof ? "Bukti: Sudah" : "Bukti: Belum"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyConfig.color}`}>
                      {difficultyConfig.icon} {difficultyConfig.text}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">{menu.expectedTrays.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">trays</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                      <ShoppingBag className="w-3 h-3" />
                      {menu.ingredients.length}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">Rp {menu.estimatedCost.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      Total: Rp {((menu.estimatedCost * menu.expectedTrays) / 1000000).toFixed(1)}jt
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewDetail(menu)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B263A] text-white rounded-lg hover:bg-[#2A3749] transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        Detail
                      </button>

                      <label
                        htmlFor={`proof-list-${menu.id}`}
                        className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                        title="Upload bukti"
                      >
                        <Upload className="w-4 h-4" />
                      </label>
                      <input
                        id={`proof-list-${menu.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onProofUpload(menu.id, e.target.files?.[0])}
                      />

                      {menu.samplePhotoUrl && (
                        <button
                          onClick={() => onClearProof(menu.id)}
                          className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          title="Hapus bukti"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}

                      <button className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}