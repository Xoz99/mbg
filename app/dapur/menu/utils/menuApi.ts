// app/dapur/menu/utils/menuApi.ts

const API_BASE_URL = 'http://202.155.95.183:3000';

// ========== HELPER FUNCTIONS ==========

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mbg_token');
};

const getUserData = () => {
  if (typeof window === 'undefined') return null;
  const userData = localStorage.getItem('mbg_user');
  if (!userData) return null;
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
};

const getDapurId = (): string => {
  const user = getUserData();
  return user?.dapurId || user?.dapur?.id || user?.id || '';
};

const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// ========== API FUNCTIONS ==========

// 0. Create Weekly Menu Planning (NEW!)
export const createWeeklyMenuPlanning = async (data: {
  mingguanKe: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  sekolahId: string;
}) => {
  const dapurId = getDapurId();
  if (!dapurId) throw new Error('Dapur ID tidak ditemukan');
  
  const response = await fetch(`${API_BASE_URL}/api/dapur/${dapurId}/menu-planning`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Failed to create menu planning');
  }

  return await response.json();
};

// 1. Get Weekly Menu Planning
export const getWeeklyMenuPlanning = async (params?: {
  mingguanKe?: number;
}) => {
  const dapurId = getDapurId();
  if (!dapurId) throw new Error('Dapur ID tidak ditemukan');
  
  const queryParams = new URLSearchParams();
  if (params?.mingguanKe) {
    queryParams.append('mingguanKe', String(params.mingguanKe));
  }
  
  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/api/dapur/${dapurId}/menu-planning${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Failed to fetch menu planning');
  }

  return await response.json();
};

// 2. Create Daily Menu
export const createDailyMenu = async (menuPlanningId: string, data: {
  tanggal: string;
  namaMenu: string;
  deskripsi?: string;
  waktuMulaiMasak: string;
  waktuSelesaiMasak: string;
  kalori?: number;
  protein?: number;
  lemak?: number;
  karbohidrat?: number;
  estimasiBiaya: number;
  targetBaki: number;
  tingkatKesulitan: 'MUDAH' | 'SEDANG' | 'SULIT';
  catatan?: string;
  bahanBaku: Array<{
    nama: string;
    kuantitas?: string;
    catatan?: string;
  }>;
}) => {
  const dapurId = getDapurId();
  if (!dapurId) throw new Error('Dapur ID tidak ditemukan');
  
  const response = await fetch(`${API_BASE_URL}/api/dapur/${dapurId}/menu-planning/${menuPlanningId}/daily-menu`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Failed to create daily menu');
  }

  return await response.json();
};

// 3. Update Daily Menu
export const updateDailyMenu = async (
  menuPlanningId: string,
  dailyMenuId: string,
  data: Partial<{
    namaMenu: string;
    deskripsi: string;
    waktuMulaiMasak: string;
    waktuSelesaiMasak: string;
    kalori: number;
    protein: number;
    lemak: number;
    karbohidrat: number;
    estimasiBiaya: number;
    targetBaki: number;
    tingkatKesulitan: string;
    catatan: string;
  }>
) => {
  const dapurId = getDapurId();
  if (!dapurId) throw new Error('Dapur ID tidak ditemukan');
  
  const response = await fetch(`${API_BASE_URL}/api/dapur/${dapurId}/menu-planning/${menuPlanningId}/daily-menu/${dailyMenuId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Failed to update daily menu');
  }

  return await response.json();
};

// 4. Delete Daily Menu
export const deleteDailyMenu = async (menuPlanningId: string, dailyMenuId: string) => {
  const dapurId = getDapurId();
  if (!dapurId) throw new Error('Dapur ID tidak ditemukan');
  
  const response = await fetch(`${API_BASE_URL}/api/dapur/${dapurId}/menu-planning/${menuPlanningId}/daily-menu/${dailyMenuId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Failed to delete daily menu');
  }

  return await response.json();
};

// 5. Upload Proof Photo
export const uploadProofPhoto = async (dailyMenuId: string, file: File) => {
  const dapurId = getDapurId();
  const token = getAuthToken();
  if (!dapurId) throw new Error('Dapur ID tidak ditemukan');
  
  const formData = new FormData();
  formData.append('foto', file);
  
  const response = await fetch(`${API_BASE_URL}/api/dapur/${dapurId}/daily-menu/${dailyMenuId}/upload-bukti`, {
    method: 'POST',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Failed to upload proof photo');
  }

  return await response.json();
};

// 6. Delete Proof Photo
export const deleteProofPhoto = async (dailyMenuId: string) => {
  const dapurId = getDapurId();
  if (!dapurId) throw new Error('Dapur ID tidak ditemukan');
  
  const response = await fetch(`${API_BASE_URL}/api/dapur/${dapurId}/daily-menu/${dailyMenuId}/bukti`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Failed to delete proof photo');
  }

  return await response.json();
};

// 7. Add Ingredient
export const addIngredientToMenu = async (
  menuPlanningId: string,
  dailyMenuId: string,
  data: {
    nama: string;
    kuantitas?: string;
    catatan?: string;
  }
) => {
  const dapurId = getDapurId();
  if (!dapurId) throw new Error('Dapur ID tidak ditemukan');
  
  const response = await fetch(`${API_BASE_URL}/api/dapur/${dapurId}/menu-planning/${menuPlanningId}/daily-menu/${dailyMenuId}/bahan-baku`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Failed to add ingredient');
  }

  return await response.json();
};

// 8. Update Ingredient
export const updateIngredient = async (
  menuPlanningId: string,
  dailyMenuId: string,
  bahanBakuId: string,
  data: Partial<{
    nama: string;
    kuantitas: string;
    catatan: string;
  }>
) => {
  const dapurId = getDapurId();
  if (!dapurId) throw new Error('Dapur ID tidak ditemukan');
  
  const response = await fetch(`${API_BASE_URL}/api/dapur/${dapurId}/menu-planning/${menuPlanningId}/daily-menu/${dailyMenuId}/bahan-baku/${bahanBakuId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Failed to update ingredient');
  }

  return await response.json();
};

// 9. Delete Ingredient
export const deleteIngredient = async (
  menuPlanningId: string,
  dailyMenuId: string,
  bahanBakuId: string
) => {
  const dapurId = getDapurId();
  if (!dapurId) throw new Error('Dapur ID tidak ditemukan');
  
  const response = await fetch(`${API_BASE_URL}/api/dapur/${dapurId}/menu-planning/${menuPlanningId}/daily-menu/${dailyMenuId}/bahan-baku/${bahanBakuId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Failed to delete ingredient');
  }

  return await response.json();
};

// ========== MAPPING FUNCTIONS ==========

export const mapApiMenuToFrontend = (apiMenu: any) => {
  return {
    id: apiMenu.id,
    date: apiMenu.tanggal,
    dayNumber: new Date(apiMenu.tanggal).getDay() || 7,
    menuName: apiMenu.namaMenu,
    description: apiMenu.deskripsi || '',
    cookingStartAt: apiMenu.waktuMulaiMasak,
    cookingEndAt: apiMenu.waktuSelesaiMasak,
    samplePhotoUrl: apiMenu.fotoSampleUrl || null,
    documentedBy: apiMenu.dokumentasiOleh ? {
      id: apiMenu.dokumentasiOleh.id,
      name: apiMenu.dokumentasiOleh.nama
    } : null,
    nutritionInfo: {
      kalori: apiMenu.kalori || 0,
      protein: apiMenu.protein || 0,
      lemak: apiMenu.lemak || 0,
      karbohidrat: apiMenu.karbohidrat || 0,
    },
    estimatedCost: apiMenu.estimasiBiaya,
    expectedTrays: apiMenu.targetBaki,
    difficulty: apiMenu.tingkatKesulitan === 'MUDAH' ? 'EASY' : 
                apiMenu.tingkatKesulitan === 'SEDANG' ? 'MEDIUM' : 'HARD',
    ingredients: (apiMenu.bahanBaku || []).map((bahan: any) => ({
      id: bahan.id,
      name: bahan.nama,
      quantity: bahan.kuantitas,
      photoUrl: bahan.fotoUrl || null,
      notes: bahan.catatan || '',
    })),
    notes: apiMenu.catatan || '',
  };
};

export const mapFrontendMenuToApi = (menu: any) => {
  return {
    tanggal: menu.date,
    namaMenu: menu.menuName,
    deskripsi: menu.description,
    waktuMulaiMasak: menu.cookingStartAt,
    waktuSelesaiMasak: menu.cookingEndAt,
    kalori: menu.nutritionInfo?.kalori || 0,
    protein: menu.nutritionInfo?.protein || 0,
    lemak: menu.nutritionInfo?.lemak || 0,
    karbohidrat: menu.nutritionInfo?.karbohidrat || 0,
    estimasiBiaya: menu.estimatedCost,
    targetBaki: menu.expectedTrays,
    tingkatKesulitan: menu.difficulty === 'EASY' ? 'MUDAH' : 
                      menu.difficulty === 'MEDIUM' ? 'SEDANG' : 'SULIT',
    catatan: menu.notes || '',
    bahanBaku: (menu.ingredients || []).map((ing: any) => ({
      nama: ing.name,
      kuantitas: ing.quantity,
      catatan: ing.notes,
    })),
  };
};