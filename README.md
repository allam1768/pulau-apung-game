# 🏝️ PULAU APUNG: JANGAN JATUH!
**Game Edukasi Multiplayer Real-Time untuk Siswa SD Kelas 1–3**

Game ini dirancang khusus untuk memenuhi ketentuan tugas kelompok media pembelajaran interaktif:
1. **Multiplayer Tanpa Batas Pemain (Unlimited Players):** Seluruh kelas (10, 30, hingga 50+ siswa) dapat bermain secara bersamaan secara real-time.
2. **Koneksi Mudah Berbasis Kode PIN & QR Code:** Siswa cukup scan QR Code menggunakan HP/tablet atau memasukkan 4-digit PIN tanpa perlu download aplikasi apa pun (100% Web-based).
3. **Mudah Dikelola Guru:** Dilengkapi menu **"Kelola Soal Guru"** sehingga guru dapat dengan mudah menyusun materi pembelajaran dan memasukkannya langsung ke dalam game.
4. **Desain Ramah Anak SD:** Tombol besar, warna kontras, karakter hewan lucu, animasi seru (pulau tenggelam, suara byur air), dan sistem poin partisipasi yang mencegah anak merasa sedih saat salah.

---

## 🚀 Cara Menjalankan Game (Sangat Mudah)

1. Buka terminal di folder project:
   ```bash
   cd /home/puutraa/.gemini/antigravity/scratch/pulau-apung-sd
   ```
2. Jalankan server:
   ```bash
   npm start
   ```
3. Buka browser:
   * **Untuk Layar Guru / Proyektor Kelas:** Buka `http://localhost:3000/host.html`
   * **Untuk Layar Siswa (HP / Tablet di WiFi yang sama):** Buka alamat IP yang tertera di layar host (contoh: `http://192.168.1.X:3000/play.html`) atau tinggal scan QR Code!

---

## 🎮 Alur Permainan

1. **Lobby & Gabung:**
   * Guru membuka layar Host di laptop yang disambung proyektor.
   * Di layar proyektor muncul QR Code besar dan 4-Digit PIN.
   * Siswa membuka kamera HP, scan QR, mengetik nama panggilan, dan memilih avatar hewan kesukaan (🐰 Kelinci, 🦁 Singa, 🐱 Kucing, 🐼 Panda, dll).
   * Karakter seluruh siswa langsung muncul di garis start proyektor depan kelas.

2. **Soal & Pemilihan Pulau:**
   * Guru menekan **"Mulai Permainan"**.
   * Soal muncul di proyektor dengan 4 warna pulau:
     * 🔴 **Pulau Merah (A)**
     * 🔵 **Pulau Biru (B)**
     * 🟡 **Pulau Kuning (C)**
     * 🟢 **Pulau Hijau (D)**
   * Di layar HP siswa, hanya muncul 4 tombol warna besar. Saat siswa menyentuh warna yang dipilih, karakter mereka di layar depan langsung melompat ke pulau tersebut secara real-time!

3. **Momen Aksi & Pulau Tenggelam:**
   * Saat timer habis, pulau dengan jawaban yang salah akan **berguncang dan tenggelam ke dalam air** (*BYUUUR! 💦*).
   * Karakter yang berada di pulau yang salah akan terjatuh ke air, sedangkan yang di pulau benar bersorak gembira (*⭐ +Bintang*).
   * **Sistem Ramah Anak:** Anak yang salah tetap mendapatkan **+10 Bintang Partisipasi**, sehingga suasana kelas tetap positif dan ceria.

4. **Podium Juara:**
   * Setelah seluruh soal selesai, muncul kembang api dan **Podium Juara 1, 2, 3**, lengkap dengan tabel peringkat seluruh siswa di kelas.

---

## 👩‍🏫 Panduan Pendampingan Guru (Poin Penilaian Tugas)

Untuk memenuhi ketentuan tugas *"Bantu guru mengubah soal menjadi game dan ajarkan prosesnya"*:
1. Klik tombol **"⚙️ Kelola Soal Guru"** di kanan atas layar Host.
2. Tunjukkan kepada guru bahwa ada 3 paket materi default kurikulum:
   * 🔢 **Matematika Ceria:** Penjumlahan, pengurangan, hitung benda emoji.
   * 📚 **Bahasa Indonesia:** Lawan kata, huruf vokal, tebak suara hewan.
   * 🌿 **IPAS / Alam Cilik:** Panca indra, ciri hewan, makanan sehat.
3. Ajak guru mencoba membuat 1–2 soal sendiri menggunakan formulir di menu tersebut. Rekam momen ini sebagai **bukti video dokumentasi proses pendampingan guru**.

---

## 🧪 Pengujian Teknis
Game ini sudah diuji secara otomatis (End-to-End Test) dengan script simulasi multi-client:
```bash
npm test
```
Hasil: Seluruh alur (Socket.IO rooms, broadcast soal, kalkulasi skor real-time, QR code, Web Audio synth) berjalan 100% tanpa error.
