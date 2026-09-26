# ⚡ Jadwal Kilat & Rest Guard AI

Aplikasi produktivitas cerdas berbasis web yang dirancang khusus untuk mengatasi hambatan malas menyusun jadwal, mencegah kelelahan (*burnout*), serta membantu pengguna tetap disiplin melalui sistem adaptif dan ramah psikologis.

---

## 🌐 Tautan Akses & Pengujian Dewan Juri (Live Demo)

Bagi dewan juri yang ingin langsung menguji aplikasi tanpa proses instalasi di komputer:

- **Link Utama (GitHub Pages):**  
  👉 **[https://imonthetrack.github.io/make-schedule-with-AIv3/](https://imonthetrack.github.io/make-schedule-with-AIv3/)**
- **Link Cadangan (Google Cloud Run):**  
  👉 **[https://ais-pre-gzo3icrfvdr4z5a7lc42do-622745663415.asia-southeast1.run.app](https://ais-pre-gzo3icrfvdr4z5a7lc42do-622745663415.asia-southeast1.run.app)**

---

## 💻 Cara Menjalankan Aplikasi dari Berkas ZIP (Lokal)

Aplikasi ini dibangun menggunakan arsitektur modern **React + Vite + TypeScript**. Mengingat protokol keamanan browser modern (CORS policy) membatasi eksekusi modul langsung dari `file:///`, berikut opsi mudah menjalankannya di komputer lokal:

### Cara 1: Buka File Panduan Cepat (Tanpa Terminal)
1. Buka file **`Buka-Aplikasi.html`** di dalam folder ini dengan cara klik dua kali.
2. File ini akan menampilkan portal navigasi lengkap serta tombol langsung menuju versi aplikasi.

### Cara 2: Jalankan Otomatis via `start-app.bat` (Windows 1-Klik)
1. Klik dua kali file **`start-app.bat`** di folder ini.
2. Skrip akan otomatis mendeteksi lingkungan komputer, menyiapkan server lokal, dan langsung membuka peramban di `http://localhost:3000`.

### Cara 3: Menjalankan Manual via Terminal / Command Prompt
Pastikan Node.js (v18+) terpasang di komputer Anda, lalu jalankan:
```bash
# 1. Pasang dependensi
npm install

# 2. Jalankan server pengembangan
npm run dev
```
Setelah server berjalan, buka peramban dan akses alamat:  
**`http://localhost:3000`**

---

## 🌟 Fitur Utama & Inovasi Aplikasi

1. **Preset Kilat 1-Klik:**  
   Menyediakan template jadwal harian instan untuk Ujian, Sesi Koding, Freelance, dan Istirahat Total agar pengguna tidak perlu pusing memikirkan jadwal dari nol.
2. **Fitur Shift Jadwal (+15m / -15m):**  
   Solusi psikologis anti-gagal saat kegiatan sebelumnya molor atau selesai lebih cepat. Seluruh rangkaian jadwal dapat digeser serentak hanya dengan satu ketukan.
3. **Rest Guard & Web Audio Synthesizer Alarm:**  
   Timer istirahat aktif dengan generator suara sintetis murni (Web Audio API) yang bebas lisensi, tidak memerlukan unduhan file MP3 eksternal, dan dapat berbunyi bahkan saat offline.
4. **Daily Streak & Level Disiplin:**  
   Gamifikasi pelacak kedisiplinan harian untuk menjaga konsistensi dan motivasi pengguna.
5. **Dukungan Progressive Web App (PWA) & Offline-First:**  
   Dapat diinstal langsung ke homescreen ponsel (Android/iOS) atau desktop (Windows/Mac) dan dapat digunakan tanpa koneksi internet.

---

## 🛠️ Stack Teknologi

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Build Tool:** Vite
- **Icons:** Lucide React
- **Audio:** Native Web Audio API (Sine/Triangle Wave Oscillator)
- **Deployment:** GitHub Pages (Static CI/CD) & Google Cloud Run (Containerized Service)
