// Debug script untuk test dashboard data loading
// Jalankan ini di browser console

console.log("=== DASHBOARD DEBUG ===");

// Check localStorage
const token = localStorage.getItem("authToken");
const sekolahId = localStorage.getItem("sekolahId");

console.log("✓ Auth Token:", token ? "EXISTS (" + token.substring(0, 20) + "...)" : "MISSING");
console.log("✓ Sekolah ID:", sekolahId || "MISSING");

if (!token || !sekolahId) {
  console.error("❌ MISSING CREDENTIALS - Dashboard won't load data!");
} else {
  console.log("✅ Credentials OK");
}

// Wait for React to render and check network calls
console.log("\n📡 Monitoring API calls...");
console.log("Check Network tab in DevTools for these endpoints:");
console.log("  1. /api/sekolah/{sekolahId}/siswa");
console.log("  2. /api/sekolah/{sekolahId}/kelas");
console.log("  3. /api/kelas/{kelasId}/absensi");
console.log("  4. /api/sekolah/{sekolahId}/pengiriman");
console.log("  5. /api/kalender-akademik");
console.log("  6. /api/menu-harian/today");

// Check for React logs in console
console.log("\n🔍 Look for console logs starting with:");
console.log("  '🔄 [FETCH] Starting all data fetch...'");
console.log("  '✅ [FETCH] All state updated!'");

console.log("\n=== END DEBUG ===");
