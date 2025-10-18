// app/dapur/menu/components/AddMenuModal.tsx
import { useState, useMemo } from "react"
import { X, AlertCircle, Check } from "lucide-react"
import { DayMenu } from "../types/menu"
import { SCHOOL_PROFILES, SchoolProfile } from "../constants/schoolProfiles"
import { AllergenKey, ALLERGEN_LABEL } from "../constants/allergenData"
import { validateMenuAgainstSchool } from "../utils/menuValidation"
import { getDayName, getDayNumberFromDate } from "../utils/menuHelpers"
import { detectAllergensInText } from "../utils/allergenDetection"
import { createDailyMenu, mapFrontendMenuToApi } from "../utils/menuApi"

interface AddMenuModalProps {
  selectedSchoolId: string
  menuPlanningId: string
  onClose: () => void
  onSave: (menu: DayMenu) => void
}

export function AddMenuModal({ selectedSchoolId, menuPlanningId, onClose, onSave }: AddMenuModalProps) {
  const [newMenu, setNewMenu] = useState<any>({
    schoolId: selectedSchoolId,
    date: "",
    dayNumber: 1,
    menuName: "",
    description: "",
    estimatedCost: 0,
    expectedTrays: 0,
    cookingStartAt: "06:00",
    cookingEndAt: "08:00",
    difficulty: "EASY",
    nutritionInfo: {
      kalori: 0,
      protein: 0,
      lemak: 0,
      karbohidrat: 0
    },
    ingredients: [{ id: String(Date.now()), name: "", notes: "" }],
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedSchoolForNew = useMemo(
    () => SCHOOL_PROFILES.find((s) => s.id === newMenu.schoolId) || SCHOOL_PROFILES[0],
    [newMenu.schoolId],
  )

  const newMenuValidation = useMemo(() => {
    return validateMenuAgainstSchool(newMenu as DayMenu, selectedSchoolForNew)
  }, [newMenu, selectedSchoolForNew])

  const handleSave = async () => {
    if (newMenuValidation.hasRisk) return

    setIsSaving(true)
    setError(null)

    try {
      // Prepare API request data
      const apiData = {
        tanggal: newMenu.date,
        namaMenu: newMenu.menuName,
        deskripsi: newMenu.description,
        waktuMulaiMasak: newMenu.cookingStartAt,
        waktuSelesaiMasak: newMenu.cookingEndAt,
        kalori: newMenu.nutritionInfo.kalori || 0,
        protein: newMenu.nutritionInfo.protein || 0,
        lemak: newMenu.nutritionInfo.lemak || 0,
        karbohidrat: newMenu.nutritionInfo.karbohidrat || 0,
        estimasiBiaya: newMenu.estimatedCost || 0,
        targetBaki: newMenu.expectedTrays || 0,
        tingkatKesulitan: newMenu.difficulty === 'EASY' ? 'MUDAH' : 
                          newMenu.difficulty === 'MEDIUM' ? 'SEDANG' : 'SULIT',
        catatan: newMenu.notes || '',
        bahanBaku: newMenu.ingredients.map((ing: any) => ({
          nama: ing.name,
          kuantitas: ing.quantity || '',
          catatan: ing.notes || '',
        })),
      }

      // Call API
      const response = await createDailyMenu(menuPlanningId, apiData)

      if (response.success) {
        // Map response to frontend format
        const daily: DayMenu = {
          id: response.data.id,
          date: response.data.tanggal,
          dayNumber: getDayNumberFromDate(response.data.tanggal),
          menuName: response.data.namaMenu,
          description: response.data.deskripsi || '',
          cookingStartAt: response.data.waktuMulaiMasak,
          cookingEndAt: response.data.waktuSelesaiMasak,
          samplePhotoUrl: null,
          documentedBy: null,
          nutritionInfo: {
            kalori: response.data.kalori || 0,
            protein: response.data.protein || 0,
            lemak: response.data.lemak || 0,
            karbohidrat: response.data.karbohidrat || 0,
          },
          estimatedCost: response.data.estimasiBiaya || 0,
          expectedTrays: response.data.targetBaki || 0,
          difficulty: response.data.tingkatKesulitan === 'MUDAH' ? 'EASY' :
                      response.data.tingkatKesulitan === 'SEDANG' ? 'MEDIUM' : 'HARD',
          ingredients: (response.data.bahanBaku || []).map((bahan: any) => ({
            id: bahan.id,
            name: bahan.nama,
            quantity: bahan.kuantitas,
            photoUrl: null,
            notes: bahan.catatan || '',
          })),
          notes: response.data.catatan || '',
        }

        onSave(daily)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create menu')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-[#1B263A] to-[#2A3749] text-white px-6 py-5 flex items-center justify-between z-10 rounded-t-2xl">
          <h3 className="text-lg font-bold">Tambah Menu</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg" disabled={isSaving}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
            Flow: pilih sekolah dulu. Sistem akan memblokir penyimpanan bila bahan mengandung alergen yang dibatasi
            oleh sekolah tersebut.
          </div>

          {/* Sekolah */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Sekolah</label>
              <select
                value={newMenu.schoolId}
                onChange={(e) => setNewMenu((p: any) => ({ ...p, schoolId: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-800"
                disabled={isSaving}
              >
                {SCHOOL_PROFILES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                {(selectedSchoolForNew.restrictedAllergens as AllergenKey[]).map((al) => (
                  <span
                    key={al}
                    className="px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-semibold border border-red-200"
                  >
                    {ALLERGEN_LABEL[al]} • {selectedSchoolForNew.averages[al]}%
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={newMenu.date}
                  onChange={(e) =>
                    setNewMenu((p: any) => ({
                      ...p,
                      date: e.target.value,
                      dayNumber: getDayNumberFromDate(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-800"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Hari</label>
                <div className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-800">
                  {getDayName(newMenu.dayNumber) || "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Informasi Menu */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Menu</label>
              <input
                value={newMenu.menuName}
                onChange={(e) => setNewMenu((p: any) => ({ ...p, menuName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-800"
                placeholder="Contoh: Nasi Putih + Ayam Bakar"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Deskripsi</label>
              <input
                value={newMenu.description}
                onChange={(e) => setNewMenu((p: any) => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-800"
                placeholder="Deskripsi singkat"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Informasi Gizi */}
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Kalori (kcal)</label>
              <input
                type="number"
                value={newMenu.nutritionInfo.kalori}
                onChange={(e) => setNewMenu((p: any) => ({ 
                  ...p, 
                  nutritionInfo: { ...p.nutritionInfo, kalori: Number(e.target.value || 0) }
                }))}
                className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-800"
                min={0}
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Protein (g)</label>
              <input
                type="number"
                value={newMenu.nutritionInfo.protein}
                onChange={(e) => setNewMenu((p: any) => ({ 
                  ...p, 
                  nutritionInfo: { ...p.nutritionInfo, protein: Number(e.target.value || 0) }
                }))}
                className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-800"
                min={0}
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Lemak (g)</label>
              <input
                type="number"
                value={newMenu.nutritionInfo.lemak}
                onChange={(e) => setNewMenu((p: any) => ({ 
                  ...p, 
                  nutritionInfo: { ...p.nutritionInfo, lemak: Number(e.target.value || 0) }
                }))}
                className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-800"
                min={0}
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Karbohidrat (g)</label>
              <input
                type="number"
                value={newMenu.nutritionInfo.karbohidrat}
                onChange={(e) => setNewMenu((p: any) => ({ 
                  ...p, 
                  nutritionInfo: { ...p.nutritionInfo, karbohidrat: Number(e.target.value || 0) }
                }))}
                className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-800"
                min={0}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Biaya per Tray (Rp)</label>
              <input
                type="number"
                value={newMenu.estimatedCost}
                onChange={(e) => setNewMenu((p: any) => ({ ...p, estimatedCost: Number(e.target.value || 0) }))}
                className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-800"
                min={0}
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Target Trays</label>
              <input
                type="number"
                value={newMenu.expectedTrays}
                onChange={(e) => setNewMenu((p: any) => ({ ...p, expectedTrays: Number(e.target.value || 0) }))}
                className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-800"
                min={0}
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tingkat Kesulitan</label>
              <select
                value={newMenu.difficulty}
                onChange={(e) => setNewMenu((p: any) => ({ ...p, difficulty: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-800"
                disabled={isSaving}
              >
                <option value="EASY">Mudah</option>
                <option value="MEDIUM">Sedang</option>
                <option value="HARD">Sulit</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mulai</label>
                <input
                  type="time"
                  value={newMenu.cookingStartAt}
                  onChange={(e) => setNewMenu((p: any) => ({ ...p, cookingStartAt: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-800"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Selesai</label>
                <input
                  type="time"
                  value={newMenu.cookingEndAt}
                  onChange={(e) => setNewMenu((p: any) => ({ ...p, cookingEndAt: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-800"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* Validasi Alergi */}
          <div
            className={`border rounded-xl p-4 ${newMenuValidation.hasRisk ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}
          >
            <div className="flex items-start gap-3">
              {newMenuValidation.hasRisk ? (
                <AlertCircle className="w-5 h-5 text-red-700 mt-0.5" />
              ) : (
                <Check className="w-5 h-5 text-emerald-700 mt-0.5" />
              )}
              <div>
                <p
                  className={`text-xs font-semibold mb-1 uppercase tracking-wide ${newMenuValidation.hasRisk ? "text-red-700" : "text-emerald-700"}`}
                >
                  {newMenuValidation.hasRisk ? "Risiko Alergi Ditemukan" : "Aman dari Alergen Terlarang"}
                </p>
                {newMenuValidation.hasRisk ? (
                  <ul className="list-disc pl-5 text-sm text-red-900 space-y-1">
                    {newMenuValidation.issues.map((i) => (
                      <li key={i.ingredientId}>
                        {i.ingredientName || "(tanpa nama)"}: {i.allergens.map((a) => ALLERGEN_LABEL[a]).join(", ")}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-emerald-900">
                    Tidak ada bahan yang memicu alergen terlarang untuk sekolah terpilih.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bahan */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-800">Bahan</label>
              <button
                type="button"
                onClick={() =>
                  setNewMenu((p: any) => ({
                    ...p,
                    ingredients: [
                      ...p.ingredients,
                      { id: String(Date.now() + Math.random()), name: "", notes: "" },
                    ],
                  }))
                }
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                disabled={isSaving}
              >
                Tambah Baris
              </button>
            </div>
            <div className="space-y-2">
              {newMenu.ingredients.map((ing: any, idx: number) => {
                const found = detectAllergensInText(`${ing.name || ""} ${ing.notes || ""}`)
                const restricted = found.filter((m) => selectedSchoolForNew.restrictedAllergens.includes(m as any))
                const isRisk = restricted.length > 0
                return (
                  <div
                    key={ing.id}
                    className={`grid md:grid-cols-12 gap-2 p-2 rounded-lg border ${isRisk ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}
                  >
                    <input
                      className="md:col-span-5 px-3 py-2 rounded-md bg-white"
                      placeholder="Nama bahan"
                      value={ing.name}
                      onChange={(e) => {
                        const val = e.target.value
                        setNewMenu((p: any) => {
                          const arr = [...p.ingredients]
                          arr[idx] = { ...arr[idx], name: val }
                          return { ...p, ingredients: arr }
                        })
                      }}
                      disabled={isSaving}
                    />
                    <input
                      className="md:col-span-5 px-3 py-2 rounded-md bg-white"
                      placeholder="Catatan/Detail (opsional)"
                      value={ing.notes}
                      onChange={(e) => {
                        const val = e.target.value
                        setNewMenu((p: any) => {
                          const arr = [...p.ingredients]
                          arr[idx] = { ...arr[idx], notes: val }
                          return { ...p, ingredients: arr }
                        })
                      }}
                      disabled={isSaving}
                    />
                    <div className="md:col-span-2 flex items-center justify-end gap-2">
                      {isRisk && (
                        <span className="px-2 py-1 rounded-md bg-red-100 text-red-700 text-xs font-semibold border border-red-200">
                          {restricted.map((a) => ALLERGEN_LABEL[a as AllergenKey]).join(", ")}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setNewMenu((p: any) => ({
                            ...p,
                            ingredients: p.ingredients.filter((_: any, i: number) => i !== idx),
                          }))
                        }
                        className="px-2 py-1 rounded-md bg-white border text-gray-700 hover:bg-gray-50 text-xs"
                        disabled={isSaving}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
              disabled={isSaving}
            >
              Batal
            </button>
            <button
              disabled={
                !newMenu.schoolId ||
                !newMenu.date ||
                !newMenu.menuName ||
                newMenu.ingredients.length === 0 ||
                newMenuValidation.hasRisk ||
                isSaving
              }
              onClick={handleSave}
              className={`px-5 py-2.5 rounded-lg font-semibold text-white ${
                newMenuValidation.hasRisk || isSaving ? "bg-gray-400 cursor-not-allowed" : "bg-[#1B263A] hover:bg-[#2A3749]"
              }`}
            >
              {isSaving ? "Menyimpan..." : "Simpan Menu"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}