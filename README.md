# 📹 RSIA MOELIA - Display Education Video Player
## Panduan Penggunaan Aplikasi

---

### 📋 **Deskripsi Aplikasi**

Aplikasi **RSIA MOELIA Display Education** adalah platform video pembelajaran medis yang dirancang khusus untuk menampilkan konten edukasi di layar RSIA MOELIA. Aplikasi ini menggunakan data lokal dan berjalan secara offline tanpa memerlukan koneksi backend.

---

### 🚀 **Cara Menjalankan Aplikasi**


#### **Metode 1: Menggunakan Live Server (VS Code)**
1. Install extension "Live Server" di VS Code
2. Klik kanan pada `index.html`
3. Pilih "Open with Live Server"

#### **Metode 2: Menggunakan Server Lokal Lainnya**
- XAMPP: Letakkan folder di `htdocs`
- Laragon: Letakkan folder di `www`

---

### 🎯 **Fitur Utama**

#### **1. Autoplay Video** ✨
- Video **otomatis diputar** saat aplikasi pertama kali dibuka
- Video berikutnya akan otomatis play saat dipilih
- Mendukung berbagai format: MP4, WebM, OGG

#### **2. Playlist Management** 📋
- **Daftar video** ditampilkan di sisi kanan
- **Click video** untuk beralih
- **Progress indicator** menunjukkan video ke-berapa
- **Active state** highlight video yang sedang diputar

#### **3. Persistent State** 💾
- **Posisi terakhir** video tersimpan otomatis
- **Volume setting** tersimpan
- **Video terakhir** akan dimuat ulang saat reload

#### **4. Keyboard Navigation** ⌨️
- **Spasi**: Play/Pause
- **↑**: Video sebelumnya
- **↓**: Video berikutnya

#### **5. Responsive Design** 📱
- Layout otomatis menyesuaikan ukuran layar
- Optimized untuk desktop dan tablet

---

### 🎨 **Interface Guide**

#### **Header**
- **Logo RSIA MOELIA**: Branding rumah sakit
- **Progress Counter**: "1 dari 2" - menampilkan posisi video saat ini

#### **Video Player (70% layout)**
- **Video Area**: Area hitam untuk video player
- **Controls**: Standard HTML5 video controls
- **Video Info**: Title dan description di bawah video

#### **Playlist (30% layout)**
- **Header Biru**: "Daftar Video" dengan gradient biru
- **Video Items**: List dengan number badge, title, dan duration
- **Active State**: Item yang sedang play memiliki background biru

---

### 📁 **Mengelola Konten Video**

#### **Struktur File**
```
video-playlist-app/
├── data/
│   └── videos.json          # Database video (edit di sini)
├── assets/
│   ├── videos/             # Folder video files
│   └── thumbnails/         # Folder thumbnail (opsional)
├── js/
│   ├── script.js           # Logic utama
│   └── utils.js            # Helper functions
├── css/
│   └── style.css          # Custom styles
└── index.html             # File utama
```

#### **Menambah Video Baru**

1. **Copy video file** ke folder `assets/videos/`

2. **Edit file** `data/videos.json`:
```json
[
  {
    "id": "video-1",
    "title": "Judul Video Edukasi",
    "description": "Deskripsi lengkap video pembelajaran...",
    "src": "assets/videos/nama-file-video.mp4",
    "duration": 1980,
    "thumbnail": "assets/thumbnails/thumbnail.jpg",
    "category": "Patient Care",
    "level": "Beginner",
    "instructor": "Dr. Nama Dokter",
    "tags": ["edukasi", "medis", "patient care"]
  }
]
```

3. **Field yang diperlukan**:
   - `id`: ID unik video
   - `title`: Judul video
   - `description`: Deskripsi
   - `src`: Path ke file video
   - `duration`: Durasi dalam detik
   - `category`: Kategori video
   - `level`: Tingkat kesulitan

---

### 🔧 **Troubleshooting**

#### **Video Tidak Muncul**
✅ **Solusi**:
- Pastikan menjalankan via **web server** (bukan double-click HTML)
- Check file `data/videos.json` format JSON valid
- Check path video di field `src` benar

#### **Video Tidak Bisa Diputar**
✅ **Solusi**:
- Check format video supported (MP4, WebM, OGG)
- Check file video tidak corrupt
- Check path file video benar

#### **Autoplay Tidak Jalan**
✅ **Solusi**:
- Browser modern memblock autoplay, ini normal
- User bisa manual click play button
- Atau enable autoplay di browser settings

#### **Layout Rusak**
✅ **Solusi**:
- Check koneksi internet untuk Tailwind CSS CDN
- Pastikan file `css/style.css` ada
- Clear browser cache dan refresh

---

### ⚙️ **Konfigurasi Advanced**

#### **Mengubah Theme Colors**
Edit di `index.html` bagian Tailwind config:
```javascript
colors: {
    'primary': '#2563eb',        // Biru primary
    'primary-dark': '#1d4ed8',   // Biru gelap
    'medical-blue': '#1e40af',   // Biru medis
}
```

#### **Mengubah Layout Ratio**
Di `index.html`:
```html
<!-- Video Section (70%) -->
<section class="flex-1 lg:flex-[7] bg-black relative">

<!-- Playlist Section (30%) -->
<aside class="flex-1 lg:flex-[3] bg-gradient-to-b...">
```

#### **Custom Styles**
Edit file `css/style.css` untuk styling tambahan.

---

### 📊 **Best Practices**

#### **Video Files**
- **Format**: MP4 untuk kompatibilitas terbaik
- **Resolution**: 1080p atau 720p untuk balance quality/size
- **Compression**: Gunakan H.264 codec
- **Size**: Maksimal 500MB per video

#### **Thumbnails** (Opsional)
- **Format**: JPG/PNG
- **Size**: 300x200px
- **Naming**: Sama dengan video filename

#### **Performance**
- **Preload**: Video di-preload metadata saja
- **Caching**: Browser cache video yang sudah dimuat
- **Storage**: LocalStorage menyimpan state user

---

### 🎉 **Tips & Tricks**

1. **Fullscreen**: Double-click video player untuk fullscreen
2. **Volume**: Setting volume tersimpan otomatis
3. **Keyboard**: Gunakan keyboard shortcuts untuk navigasi cepat
4. **Multiple Videos**: Tambahkan banyak video di `videos.json`
5. **Branding**: Ganti title dan logo sesuai kebutuhan

---

### 📞 **Support**

Jika ada masalah atau butuh bantuan:
1. Check troubleshooting guide di atas
2. Check browser console untuk error messages
3. Pastikan file struktur sesuai panduan
4. Test dengan video sample yang disediakan

---

**Aplikasi ini dirancang untuk kemudahan penggunaan dan maintenance minimal. Enjoy your learning experience! 🎓**