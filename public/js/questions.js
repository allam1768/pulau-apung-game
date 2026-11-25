// Bank Soal Default untuk Siswa SD Kelas 1–3
// Dilengkapi kategori Matematika, Bahasa Indonesia, dan IPAS

const QUESTION_PACKS = {
  matematika: {
    id: 'matematika',
    title: '🔢 Matematika Ceria (SD 1–3)',
    description: 'Penjumlahan, pengurangan, hitung benda, dan bentuk bangun datar.',
    questions: [
      {
        question: 'Ada 3 apel 🍎🍎🍎 ditambah 2 apel 🍎🍎. Berapa jumlah semua apel?',
        options: {
          A: '4 Apel',
          B: '5 Apel',
          C: '6 Apel',
          D: '7 Apel'
        },
        correct: 'B',
        explanation: '3 + 2 = 5 apel!',
        duration: 15
      },
      {
        question: 'Ibu membeli 8 donat 🍩. Dimakan adik 3 donat. Sisa berapa donat Ibu?',
        options: {
          A: '4 Donat',
          B: '6 Donat',
          C: '5 Donat',
          D: '3 Donat'
        },
        correct: 'C',
        explanation: '8 - 3 = 5 donat tersisa!',
        duration: 15
      },
      {
        question: 'Benda di bawah ini yang berbentuk LINGKARAN adalah ... ?',
        options: {
          A: 'Buku Tulis 📘',
          B: 'Roda Sepeda 🛞',
          C: 'Papan Tulis 🏫',
          D: 'Kotak Pensil ✏️'
        },
        correct: 'B',
        explanation: 'Roda sepeda berbentuk lingkaran bundar!',
        duration: 15
      },
      {
        question: 'Berapa hasil dari 5 + 5 = ... ?',
        options: {
          A: '8',
          B: '9',
          C: '10',
          D: '11'
        },
        correct: 'C',
        explanation: '5 ditambah 5 hasilnya pas 10!',
        duration: 12
      },
      {
        question: 'Angka berapakah yang berada SETELAH angka 7?',
        options: {
          A: '6',
          B: '8',
          C: '9',
          D: '5'
        },
        correct: 'B',
        explanation: 'Urutan angka: 6, 7, lalu 8!',
        duration: 12
      }
    ]
  },

  bahasa: {
    id: 'bahasa',
    title: '📚 Bahasa Indonesia & Kosakata (SD 1–3)',
    description: 'Lawan kata, tebak suara hewan, huruf, dan benda di sekolah.',
    questions: [
      {
        question: 'Gajah itu BESAR 🐘, sedangkan semut itu ... ?',
        options: {
          A: 'Tinggi',
          B: 'Kecil 🐜',
          C: 'Panjang',
          D: 'Berat'
        },
        correct: 'B',
        explanation: 'Lawan kata dari BESAR adalah KECIL!',
        duration: 15
      },
      {
        question: 'Hewan apakah yang bersuara "KUKURUYUK" di pagi hari?',
        options: {
          A: 'Kambing 🐐',
          B: 'Kucing 🐱',
          C: 'Ayam Jago 🐓',
          D: 'Sapi 🐄'
        },
        correct: 'C',
        explanation: 'Ayam jago berkokok kukuruyuk di pagi hari!',
        duration: 15
      },
      {
        question: 'Benda yang kita gunakan untuk MENULIS di buku adalah ... ?',
        options: {
          A: 'Pensil ✏️',
          B: 'Penggaris 📏',
          C: 'Penghapus 🧼',
          D: 'Gunting ✂️'
        },
        correct: 'A',
        explanation: 'Kita menulis menggunakan pensil atau pulpen!',
        duration: 12
      },
      {
        question: 'Lawan kata dari SIANG ☀️ adalah ... ?',
        options: {
          A: 'Sore',
          B: 'Pagi',
          C: 'Malam 🌙',
          D: 'Hujan'
        },
        correct: 'C',
        explanation: 'Lawan dari siang terang adalah malam gelap!',
        duration: 12
      },
      {
        question: 'Huruf vokal pada kata "S-A-P-I" adalah huruf ... ?',
        options: {
          A: 'S dan P',
          B: 'A dan I',
          C: 'P dan I',
          D: 'S dan A'
        },
        correct: 'B',
        explanation: 'Huruf vokal adalah A, I, U, E, O. Pada kata SAPI adalah A dan I!',
        duration: 15
      }
    ]
  },

  ipas: {
    id: 'ipas',
    title: '🌿 IPAS / Alam Cilik (SD 1–3)',
    description: 'Mengenal hewan, panca indra manusia, dan alam sekitar.',
    questions: [
      {
        question: 'Hewan manakah yang hidup di AIR dan bernapas dengan INSANG?',
        options: {
          A: 'Kucing 🐱',
          B: 'Kelinci 🐰',
          C: 'Ikan 🐟',
          D: 'Burung 🐦'
        },
        correct: 'C',
        explanation: 'Ikan hidup di air dan bernapas menggunakan insang!',
        duration: 15
      },
      {
        question: 'Bagian tubuh yang kita gunakan untuk MENDENGAR suara adalah ... ?',
        options: {
          A: 'Mata 👀',
          B: 'Hidung 👃',
          C: 'Telinga 👂',
          D: 'Mulut 👄'
        },
        correct: 'C',
        explanation: 'Telinga berfungsi sebagai indra pendengaran!',
        duration: 12
      },
      {
        question: 'Hewan pemakan rumput di bawah ini adalah ... ?',
        options: {
          A: 'Sapi 🐄',
          B: 'Singa 🦁',
          C: 'Harimau 🐯',
          D: 'Buaya 🐊'
        },
        correct: 'A',
        explanation: 'Sapi suka makan rumput segar!',
        duration: 15
      },
      {
        question: 'Matahari terbit di sebelah ... ?',
        options: {
          A: 'Barat',
          B: 'Utara',
          C: 'Timur 🌅',
          D: 'Selatan'
        },
        correct: 'C',
        explanation: 'Matahari selalu terbit di ufuk Timur!',
        duration: 12
      },
      {
        question: 'Makanan manakah yang paling SEHAT untuk tubuh kita?',
        options: {
          A: 'Permen Manis 🍬',
          B: 'Buah Pisang 🍌',
          C: 'Minuman Soda 🥤',
          D: 'Es Lilin Berwarna 🍭'
        },
        correct: 'B',
        explanation: 'Buah-buahan segar mengandung vitamin yang baik untuk pertumbuhan!',
        duration: 15
      }
    ]
  }
};

// Helper to get active questions with custom support
function getQuestionsByPack(packId) {
  // Check local storage for custom override
  try {
    const custom = localStorage.getItem('custom_questions_' + packId);
    if (custom) {
      return JSON.parse(custom);
    }
  } catch (e) {}

  return QUESTION_PACKS[packId] ? QUESTION_PACKS[packId].questions : QUESTION_PACKS.matematika.questions;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QUESTION_PACKS, getQuestionsByPack };
}
