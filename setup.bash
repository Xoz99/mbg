#!/bin/bash

echo "🚀 Creating MBG Project Structure..."

# Navigate to project directory
cd mbg-project

# Create app structure
echo "📁 Creating app folders..."

# Auth
mkdir -p app/\(auth\)/login
touch app/\(auth\)/login/page.tsx
touch app/\(auth\)/layout.tsx

# Sekolah
mkdir -p app/\(sekolah\)/{dashboard,siswa,tracking,absensi,feedback}
touch app/\(sekolah\)/dashboard/page.tsx
touch app/\(sekolah\)/siswa/page.tsx
touch app/\(sekolah\)/tracking/page.tsx
touch app/\(sekolah\)/absensi/page.tsx
touch app/\(sekolah\)/feedback/page.tsx
touch app/\(sekolah\)/layout.tsx

# Kementerian
mkdir -p app/\(kementerian\)/{dashboard,peta-dapur,peta-sekolah,monitoring,laporan,anggaran}
touch app/\(kementerian\)/dashboard/page.tsx
touch app/\(kementerian\)/peta-dapur/page.tsx
touch app/\(kementerian\)/peta-sekolah/page.tsx
touch app/\(kementerian\)/monitoring/page.tsx
touch app/\(kementerian\)/laporan/page.tsx
touch app/\(kementerian\)/anggaran/page.tsx
touch app/\(kementerian\)/layout.tsx

# Dapur
mkdir -p app/\(dapur\)/{dashboard,menu,profil,baki,driver,stok,produksi}
touch app/\(dapur\)/dashboard/page.tsx
touch app/\(dapur\)/menu/page.tsx
touch app/\(dapur\)/profil/page.tsx
touch app/\(dapur\)/baki/page.tsx
touch app/\(dapur\)/driver/page.tsx
touch app/\(dapur\)/stok/page.tsx
touch app/\(dapur\)/produksi/page.tsx
touch app/\(dapur\)/layout.tsx

# Create components structure
echo "🎨 Creating components folders..."
mkdir -p components/{ui,sidebar,header,cards}
touch components/sidebar/Sidebar.tsx
touch components/header/Header.tsx
touch components/cards/StatCard.tsx

# Create lib structure
echo "📚 Creating lib folders..."
mkdir -p lib/{store,utils,types}
touch lib/store/authStore.ts
touch lib/utils/auth.ts
touch lib/utils/dummy-data.ts
touch lib/types/index.ts

# Create middleware
echo "🔒 Creating middleware..."
touch middleware.ts

echo "✅ Project structure created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. cd mbg-project"
echo "2. npm install lucide-react recharts zustand"
echo "3. Copy code dari artifacts ke masing-masing file"
echo ""
echo "🎉 Happy coding!"