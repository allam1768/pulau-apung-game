// Student Controller Screen Logic for "Pulau Apung: Jangan Jatuh!"

const socket = io();

let currentRoom = null;
let myName = '';
let myAvatar = '🐰';
let myScore = 0;
let currentChoice = null;

// Screens
const screenJoin = document.getElementById('student-screen-join');
const screenWaiting = document.getElementById('student-screen-waiting');
const screenQuestion = document.getElementById('student-screen-question');
const screenResult = document.getElementById('student-screen-result');
const screenPodium = document.getElementById('student-screen-podium');

// Join Elements
const inputRoomCode = document.getElementById('input-room-code');
const inputStudentName = document.getElementById('input-student-name');
const avatarGridContainer = document.getElementById('avatar-grid-container');
const btnJoinRoom = document.getElementById('btn-join-room');

// Waiting Elements
const waitAvatar = document.getElementById('wait-avatar');
const waitName = document.getElementById('wait-name');
const waitRoomCode = document.getElementById('wait-room-code');

// Question Elements
const qPlayerAvatar = document.getElementById('q-player-avatar');
const qPlayerName = document.getElementById('q-player-name');
const qPlayerScore = document.getElementById('q-player-score');
const selectedChoiceNotice = document.getElementById('selected-choice-notice');
const btnTextA = document.getElementById('btn-text-A');
const btnTextB = document.getElementById('btn-text-B');
const btnTextC = document.getElementById('btn-text-C');
const btnTextD = document.getElementById('btn-text-D');
const islandButtons = [
  document.getElementById('btn-island-A'),
  document.getElementById('btn-island-B'),
  document.getElementById('btn-island-C'),
  document.getElementById('btn-island-D')
];

// Result Elements
const resultBox = document.getElementById('result-box');
const resIcon = document.getElementById('res-icon');
const resTitle = document.getElementById('res-title');
const resPointsBadge = document.getElementById('res-points-badge');
const resExplanation = document.getElementById('res-explanation');

// Podium Elements
const podiumMyName = document.getElementById('podium-my-name');
const podiumMyStars = document.getElementById('podium-my-stars');
const podiumMyRank = document.getElementById('podium-my-rank');

// 1. Auto-fill room from URL parameter (e.g. ?room=1234)
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('room');
  if (roomParam) {
    inputRoomCode.value = roomParam.trim().toUpperCase();
  }
});

// Avatar selection
avatarGridContainer.addEventListener('click', (e) => {
  const target = e.target.closest('.avatar-choice');
  if (!target) return;
  document.querySelectorAll('.avatar-choice').forEach(el => el.classList.remove('active'));
  target.classList.add('active');
  myAvatar = target.getAttribute('data-avatar');
  sounds.playTap();
});

// 2. Join Room Click
btnJoinRoom.addEventListener('click', () => {
  const code = inputRoomCode.value.trim().toUpperCase();
  const name = inputStudentName.value.trim() || 'Siswa Pintar';

  if (!code) {
    alert('Harap masukkan kode PIN Room dari layar depan!');
    inputRoomCode.focus();
    return;
  }

  myName = name;
  sounds.init();

  btnJoinRoom.disabled = true;
  btnJoinRoom.innerText = 'Menghubungkan...';

  socket.emit('join_room', { roomCode: code, name: myName, avatar: myAvatar }, (res) => {
    btnJoinRoom.disabled = false;
    btnJoinRoom.innerText = 'GABUNG MAIN SEKARANG! 🚀';

    if (res && res.success) {
      currentRoom = res.roomCode;
      sounds.playJoin();

      // Show Waiting Screen
      screenJoin.style.display = 'none';
      screenWaiting.style.display = 'flex';

      waitAvatar.innerText = myAvatar;
      waitName.innerText = `Halo, ${myName}!`;
      waitRoomCode.innerText = currentRoom;

      qPlayerAvatar.innerText = myAvatar;
      qPlayerName.innerText = myName;
      qPlayerScore.innerText = '0';
    } else {
      alert(res ? res.message : 'Gagal terhubung ke room!');
    }
  });
});

// 3. New Question Starts
socket.on('new_question', (qData) => {
  currentChoice = null;

  screenWaiting.style.display = 'none';
  screenResult.style.display = 'none';
  screenPodium.style.display = 'none';
  screenQuestion.style.display = 'flex';

  // Reset button states
  islandButtons.forEach(btn => btn.classList.remove('selected'));
  selectedChoiceNotice.innerText = 'Sentuh salah satu warna pulau di bawah!';
  selectedChoiceNotice.style.color = '#64748b';

  // Fill Option labels
  btnTextA.innerText = qData.options.A || 'Pilihan A';
  btnTextB.innerText = qData.options.B || 'Pilihan B';
  btnTextC.innerText = qData.options.C || 'Pilihan C';
  btnTextD.innerText = qData.options.D || 'Pilihan D';

  qPlayerScore.innerText = myScore;
  sounds.playTap();
});

// 4. Student Taps an Island Button
islandButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const island = btn.getAttribute('data-island');
    currentChoice = island;

    // Visual selection feedback
    islandButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    const islandNames = {
      A: 'Pulau Merah 🔴',
      B: 'Pulau Biru 🔵',
      C: 'Pulau Kuning 🟡',
      D: 'Pulau Hijau 🟢'
    };

    selectedChoiceNotice.innerHTML = `Pilihanmu: <strong>${islandNames[island]}</strong>! Lihat karaktermu melompat di layar depan!`;
    selectedChoiceNotice.style.color = '#0284c7';

    // Play tap sound and slight haptic feedback
    sounds.playTap();
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Emit movement to server
    socket.emit('choose_island', { island });
  });
});

// 5. Round Result Feedback
socket.on('round_result', (result) => {
  screenQuestion.style.display = 'none';
  screenResult.style.display = 'flex';

  myScore = result.totalScore;
  qPlayerScore.innerText = myScore;

  const islandNames = {
    A: 'Pulau Merah 🔴',
    B: 'Pulau Biru 🔵',
    C: 'Pulau Kuning 🟡',
    D: 'Pulau Hijau 🟢'
  };

  const correctName = islandNames[result.correctIsland] || result.correctIsland;

  if (result.isCorrect) {
    sounds.playCorrect();
    resIcon.innerText = '⭐';
    resTitle.innerText = 'HORE! KAMU SELAMAT!';
    resTitle.style.color = '#059669';
    resPointsBadge.innerText = `+${result.pointsAdded} Bintang!`;
    resPointsBadge.style.color = '#d97706';
    resultBox.style.borderColor = '#34d399';
    resultBox.style.borderWidth = '4px';
  } else {
    sounds.playFall();
    resIcon.innerText = '💦';
    resTitle.innerText = 'BYUUUR! KECEBUR AIR!';
    resTitle.style.color = '#0284c7';
    resPointsBadge.innerText = `+${result.pointsAdded} Bintang Partisipasi! 💪`;
    resPointsBadge.style.color = '#0284c7';
    resultBox.style.borderColor = '#60a5fa';
    resultBox.style.borderWidth = '4px';
  }

  resExplanation.innerHTML = `
    <div><strong>Jawaban Benar:</strong> ${correctName}</div>
    ${result.explanation ? `<div style="margin-top: 4px; font-size: 0.9rem; color: #475569;">${result.explanation}</div>` : ''}
  `;
});

// 6. Game Over Screen
socket.on('game_over', ({ leaderboard }) => {
  screenQuestion.style.display = 'none';
  screenResult.style.display = 'none';
  screenPodium.style.display = 'flex';

  podiumMyName.innerText = myName;
  podiumMyStars.innerText = `⭐ ${myScore}`;

  // Find user rank
  const myIndex = leaderboard.findIndex(p => p.id === socket.id);
  const myRank = myIndex !== -1 ? myIndex + 1 : 1;
  const total = leaderboard.length || 1;

  if (myRank === 1) {
    podiumMyRank.innerText = `🥇 Juara 1 dari ${total} Siswa! Luar Biasa!`;
  } else if (myRank === 2) {
    podiumMyRank.innerText = `🥈 Juara 2 dari ${total} Siswa! Hebat!`;
  } else if (myRank === 3) {
    podiumMyRank.innerText = `🥉 Juara 3 dari ${total} Siswa! Mantap!`;
  } else {
    podiumMyRank.innerText = `Peringkat #${myRank} dari ${total} Siswa! Hebat sekali! ⭐`;
  }

  sounds.playFanfare();
});

// Host Disconnect
socket.on('host_disconnected', ({ message }) => {
  alert(message || 'Guru telah menutup sesi ruangan.');
  window.location.reload();
});
