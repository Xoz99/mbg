// app/dapur/menu/components/MenuDetailModal.tsx
import { X, Calendar, ImageIcon, Upload, ChefHat, Clock, TrendingUp, Flame, Drumstick, Apple, Wheat, ShoppingBag, Salad, Info, Users, ShieldAlert, AlertCircle, Check, Send, Edit, Copy, Download } from "lucide-react"
import { DayMenu } from "../types/menu"
import { SchoolProfile } from "../constants/schoolProfiles"
import { validateMenuAgainstSchool } from "../utils/menuValidation"
import { getDayName } from "../utils/menuHelpers"
import { ALLERGEN_LABEL } from "../constants/allergenData"

interface MenuDetailModalProps {
  menu: DayMenu
  selectedSchool: SchoolProfile
  onClose: () => void
  onProofUpload: (menuId: string, file?: File) => void
  onClearProof: (menuId: string) => void
}

export function MenuDetailModal({ 
  menu, 
  selectedSchool, 
  onClose, 
  onProofUpload, 
  onClearProof 
}: MenuDetailModalProps) {
  const validation = validateMenuAgainstSchool(menu, selectedSchool)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex items-center justify-between z-10 rounded-t-2xl">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6" />
              <div>
                <p className="text-sm text-white/80">{menu.date}</p>
                <h3 className="text-xl font-bold">{getDayName(menu.dayNumber)}</h3>
              </div>
              {menu.samplePhotoUrl && (
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  Sample Photo
                </span>
              )}
            </div>
            <h4 className="text-lg font-semibold">{menu.menuName}</h4>
            <p className="text-sm text-white/70 mt-1">{menu.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors ml-4"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Nutrition Grid */}
          <div>
            <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">
              Informasi Gizi per Porsi
            </h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 text-center">
                <Flame className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-900">{menu.nutritionInfo.kalori}</p>
                <p className="text-xs text-orange-600 mt-1">Kalori (kcal)</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
                <Drumstick className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-900">{menu.nutritionInfo.protein}g</p>
                <p className="text-xs text-blue-600 mt-1">Protein</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100 text-center">
                <Apple className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-900">{menu.nutritionInfo.lemak}g</p>
                <p className="text-xs text-yellow-600 mt-1">Lemak</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-center">
                <Wheat className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">{menu.nutritionInfo.karbohidrat}g</p>
                <p className="text-xs text-green-600 mt-1">Karbohidrat</p>
              </div>
            </div>
          </div>

          {/* Production Info */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Info Produksi</h4>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <ChefHat className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Target Trays</p>
                  <p className="font-semibold text-gray-900 text-lg">
                    {menu.expectedTrays.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <Clock className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Waktu Memasak</p>
                  <p className="font-semibold text-gray-900">
                    {menu.cookingStartAt} - {menu.cookingEndAt}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Info Biaya</h4>
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-xs text-purple-600">Biaya per Tray</p>
                  <p className="font-bold text-purple-900 text-lg">
                    Rp {menu.estimatedCost.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-xs text-purple-600">Total Biaya</p>
                  <p className="font-bold text-purple-900 text-lg">
                    Rp {(menu.estimatedCost * menu.expectedTrays).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      Bukti Masak Harian
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-semibold ${
                          menu.samplePhotoUrl
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        {menu.samplePhotoUrl ? "Bukti: Sudah" : "Bukti: Belum"}
                      </span>
                      {menu.documentedBy && (
                        <span className="text-xs text-gray-600">oleh {menu.documentedBy.name}</span>
                      )}
                    </div>

                    {menu.samplePhotoUrl ? (
                      <img
                        src={menu.samplePhotoUrl}
                        alt="Bukti masak harian"
                        className="w-full max-h-64 object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-full h-40 rounded-lg border border-dashed border-gray-300 bg-white flex items-center justify-center text-gray-500 text-sm">
                        Belum ada foto bukti
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor={`proof-detail-${menu.id}`}
                      className="px-4 py-2 rounded-lg bg-[#1B263A] text-white hover:bg-[#2A3749] cursor-pointer text-sm font-semibold text-center"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        {menu.samplePhotoUrl ? "Ganti Foto" : "Upload Bukti"}
                      </span>
                    </label>
                    <input
                      id={`proof-detail-${menu.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onProofUpload(menu.id, e.target.files?.[0])}
                    />

                    {menu.samplePhotoUrl && (
                      <button
                        onClick={() => onClearProof(menu.id)}
                        className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-semibold"
                      >
                        Hapus Bukti
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Validasi Alergi */}
          <div
            className={`${validation.hasRisk ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"} border rounded-xl p-4`}
          >
            <div className="flex items-start gap-3">
              {validation.hasRisk ? (
                <AlertCircle className="w-5 h-5 text-red-700 mt-0.5 flex-shrink-0" />
              ) : (
                <Check className="w-5 h-5 text-emerald-700 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p
                  className={`text-xs font-semibold mb-1 uppercase tracking-wide ${validation.hasRisk ? "text-red-700" : "text-emerald-700"}`}
                >
                  {validation.hasRisk ? "Validasi Alergi: Risiko Ditemukan" : "Validasi Alergi: Aman"}
                </p>
                {validation.hasRisk ? (
                  <ul className="list-disc pl-5 text-sm text-red-900 space-y-1">
                    {validation.issues.map((i) => (
                      <li key={i.ingredientId}>
                        {i.ingredientName}: {i.allergens.map((a) => ALLERGEN_LABEL[a]).join(", ")}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-emerald-900">
                    Tidak ada bahan yang terindikasi alergen untuk profil sekolah terpilih.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bahan-Bahan */}
          <div>
            <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gray-600" />
              Kebutuhan Bahan Baku ({menu.ingredients.length} items)
            </h4>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
              <div className="grid md:grid-cols-2 gap-3">
                {menu.ingredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        {ingredient.photoUrl ? (
                          <ImageIcon className="w-6 h-6 text-blue-600" />
                        ) : (
                          <Salad className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{ingredient.name}</p>
                        {ingredient.notes && <p className="text-xs text-gray-500 mt-0.5">{ingredient.notes}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-900">{ingredient.quantity}</p>
                      {ingredient.photoUrl && (
                        <span className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                          <ImageIcon className="w-3 h-3" />
                          Photo
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Catatan */}
          {menu.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-yellow-700 font-semibold mb-1 uppercase tracking-wide">Catatan Chef</p>
                  <p className="text-sm text-yellow-900">{menu.notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Dokumentasi */}
          {menu.documentedBy && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Didokumentasikan oleh</p>
                  <p className="font-semibold text-gray-900">{menu.documentedBy.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Alergi Info */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-red-700 font-semibold mb-1 uppercase tracking-wide">Risiko Alergi</p>
                <p className="text-sm text-red-900">Perhatikan alergi sekolah {selectedSchool.name}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#D0B064] text-white rounded-xl hover:bg-[#C9A355] transition-all font-bold shadow-md hover:shadow-lg">
              <Send className="w-5 h-5" />
              Submit untuk Approval
            </button>
            <button className="px-5 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all font-bold">
              <Edit className="w-5 h-5" />
            </button>
            <button className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-bold">
              <Copy className="w-5 h-5" />
            </button>
            <button className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-bold">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}