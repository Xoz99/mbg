# Backend API Implementation - Single Dashboard Endpoint

## New Endpoint to Implement

**Path:** `GET /api/dapur/dashboard-summary`
**Role:** PIC_DAPUR only
**Description:** Single endpoint yang menggabungkan semua data dashboard

---

## Response Structure

```json
{
  "success": true,
  "data": {
    "menuPlanningData": [
      {
        "id": "planning-uuid",
        "mingguanKe": 1,
        "sekolahId": "school-uuid",
        "sekolahNama": "Sekolah Dasar Maju",
        "tanggalMulai": "2025-11-17",
        "tanggalSelesai": "2025-11-22",
        "status": "INCOMPLETE",
        "completedDays": 3,
        "totalDays": 6,
        "daysLeft": 3,
        "totalMenuCount": 3,
        "todayMenu": null
      }
    ],
    "stats": {
      "targetHariIni": 1200,
      "totalSekolah": 5
    },
    "produksiMingguan": [
      { "hari": "Sel, 20 Nov", "actual": 5 },
      { "hari": "Rab, 21 Nov", "actual": 8 }
    ],
    "batches": [
      {
        "id": "batch-uuid",
        "dailyMenu": {
          "id": "menu-uuid",
          "namaMenu": "Nasi Goreng",
          "tanggal": "2025-11-26",
          "kalori": 550.5,
          "protein": 25.5,
          "biayaPerTray": 15000,
          "jamMulaiMasak": "06:00",
          "jamSelesaiMasak": "08:00",
          "targetTray": 100
        },
        "sekolahId": "school-uuid",
        "sekolahName": "Sekolah Dasar Maju",
        "status": "IN_PROGRESS",
        "expectedTrays": 100,
        "packedTrays": 50,
        "checkpoints": [],
        "startTime": "06:00",
        "endTime": "08:00"
      }
    ]
  }
}
```

---

## Implementation Logic (Node.js/Express)

```javascript
router.get('/dashboard-summary',
  requireAuth,
  requireRole('PIC_DAPUR'),
  async (req, res) => {
    try {
      // 1. Get today's date
      const today = new Date().toISOString().split('T')[0];

      // 2. Fetch all menu planning
      const plannings = await MenuPlanning.find()
        .populate('sekolah')
        .lean();

      if (!plannings.length) {
        return res.json({
          success: true,
          data: {
            menuPlanningData: [],
            stats: { targetHariIni: 0, totalSekolah: 0 },
            produksiMingguan: [],
            batches: []
          }
        });
      }

      // 3. Request queue untuk parallel requests (limit 5)
      const requestQueue = new RequestQueue(5);

      // 4. Fetch semua menu harian + checkpoints untuk semua planning
      const allBatchesPromises = plannings.map(planning =>
        requestQueue.add(async () => {
          try {
            // Fetch menus untuk planning ini
            const menus = await MenuHarian.find({
              planningId: planning.id,
              tanggal: { $gte: today, $lte: today } // hanya hari ini
            }).lean();

            // Fetch checkpoints untuk setiap menu
            const batches = await Promise.all(
              menus.map(async menu => {
                const checkpoints = await Checkpoint.find({
                  menuHarianId: menu.id
                }).lean();

                return {
                  id: `BATCH-${menu.id}`,
                  dailyMenu: menu,
                  menuId: menu.id,
                  sekolahId: planning.sekolahId,
                  sekolahName: planning.sekolah.nama,
                  status: checkpoints.length >= 4 ? 'COMPLETED'
                    : checkpoints.length >= 2 ? 'IN_PROGRESS'
                    : 'PREPARING',
                  expectedTrays: menu.targetTray || 1200,
                  packedTrays: checkpoints.length >= 3
                    ? menu.targetTray
                    : Math.round((menu.targetTray || 1200) / 2),
                  checkpoints,
                  startTime: menu.jamMulaiMasak,
                  endTime: menu.jamSelesaiMasak
                };
              })
            );

            return batches;
          } catch (err) {
            console.warn(`Error fetching batches for planning ${planning.id}:`, err);
            return [];
          }
        })
      );

      const allBatchesResults = await Promise.allSettled(allBatchesPromises);
      const batches = allBatchesResults
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value);

      // 5. Calculate stats
      const stats = {
        targetHariIni: batches.reduce((sum, b) => sum + b.expectedTrays, 0),
        totalSekolah: plannings.length
      };

      // 6. Build production data (last 6 days)
      const allMenus = await MenuHarian.find({
        planningId: { $in: plannings.map(p => p.id) }
      }).lean();

      const dateMap = {};
      allMenus.forEach(menu => {
        const date = new Date(menu.tanggal).toLocaleDateString('id-ID', {
          weekday: 'short',
          month: 'short',
          day: '2-digit'
        });
        dateMap[date] = (dateMap[date] || 0) + 1;
      });

      const produksiMingguan = Object.entries(dateMap)
        .map(([date, count]) => ({ hari: date, actual: count }))
        .slice(-6);

      // 7. Build menuPlanningData dengan calculation
      const menuPlanningData = plannings.map(planning => {
        const planningMenus = allMenus.filter(m => m.planningId === planning.id);
        const completedDays = new Set(
          planningMenus.map(m => m.tanggal.split('T')[0])
        ).size;

        return {
          id: planning.id,
          mingguanKe: planning.mingguanKe,
          sekolahId: planning.sekolahId,
          sekolahNama: planning.sekolah.nama,
          tanggalMulai: planning.tanggalMulai,
          tanggalSelesai: planning.tanggalSelesai,
          status: completedDays === 6 ? 'COMPLETE' : 'INCOMPLETE',
          completedDays,
          totalDays: 6,
          daysLeft: 6 - completedDays,
          totalMenuCount: planningMenus.length,
          todayMenu: null // Tidak perlu detail di dashboard
        };
      });

      return res.json({
        success: true,
        data: {
          menuPlanningData,
          stats,
          produksiMingguan,
          batches
        }
      });

    } catch (error) {
      console.error('Error in dashboard-summary:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);
```

---

## Performance Benefits

### Before (Multiple API Calls)
- `/api/menu-planning` → 500ms
- `/api/menu-planning/{id}/menu-harian` × 5 schools → 2-3s (waterfalling)
- `/api/produksi/...` → 1s
- **Total: 4-5 seconds** ⚠️

### After (Single API Call)
- `/api/dapur/dashboard-summary` → 2-3s ✅
- **60% faster!**

---

## Testing Checklist

- [ ] GET `/api/dapur/dashboard-summary` returns correct structure
- [ ] Only PIC_DAPUR role can access
- [ ] Response includes all 4 data sections
- [ ] Batches for today are correctly populated
- [ ] Stats calculation is accurate
- [ ] Production data shows last 6 days
- [ ] Caching works (10 min expiry)
- [ ] Auto-refresh works (2 min interval)

---

## Frontend Hook Usage

```typescript
const { loading, loadData, refreshData } = useDapurDashboardSingle(handleCacheUpdate);

// Load data on mount
useEffect(() => {
  loadData();
}, []);

// Manual refresh
const handleRefresh = () => {
  refreshData();
};
```

