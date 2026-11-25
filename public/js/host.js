// Host (Projector) Screen Logic for "Pulau Apung: Jangan Jatuh!"

const socket = io();

let currentRoomCode = null;
let currentQuestions = [];
let activePackId = 'matematika';
let players = {}; // id -> { id, name, avatar, island, score }
let timerInterval = null;
let remainingSeconds = 15;

// DOM Elements
const roomPinDisplay = document.getElementById('room-pin-display');
const lobbyPinHuge = document.getElementById('lobby-pin-huge');
const qrCodeImg = document.getElementById('qr-code-img');
const joinUrlBox = document.getElementById('join-url-box');
const playerCountEl = document.getElementById('player-count');
const lobbyPlayersList = document.getElementById('lobby-players-list');
const btnStartGame = document.getElementById('btn-start-game');
const selectPack = document.getElementById('select-pack');
const questionCountBadge = document.getElementById('question-count-badge');

const screenLobby = document.getElementById('screen-lobby');
const screenGame = document.getElementById('screen-game');
const screenPodium = document.getElementById('screen-podium');

const timerContainer = document.getElementById('timer-container');
const timerSecondsEl = document.getElementById('timer-seconds');
const btnRevealNow = document.getElementById('btn-reveal-now');
const btnNextQuestion = document.getElementById('btn-next-question');
const btnPlayAgain = document.getElementById('btn-play-again');
const btnSoundToggle = document.getElementById('btn-sound-toggle');

// Modal Elements
const btnManageQuestions = document.getElementById('btn-manage-questions');
const modalQuestions = document.getElementById('modal-questions');
const btnCloseModal = document.getElementById('btn-close-modal');
const modalQuestionsList = document.getElementById('modal-questions-list');
const btnSaveCustomQuestion = document.getElementById('btn-save-custom-question');

// Question Elements
const qCategory = document.getElementById('q-category');
const qText = document.getElementById('q-text');
const qCurrentIndex = document.getElementById('q-current-index');
const qTotalCount = document.getElementById('q-total-count');

const answerA = document.getElementById('answer-A');
const answerB = document.getElementById('answer-B');
const answerC = document.getElementById('answer-C');
const answerD = document.getElementById('answer-D');

const islandA = document.getElementById('island-A');
const islandB = document.getElementById('island-B');
const islandC = document.getElementById('island-C');
const islandD = document.getElementById('island-D');

const bridgeOccupants = document.getElementById('bridge-occupants');
const occupantsA = document.getElementById('occupants-A');
const occupantsB = document.getElementById('occupants-B');
const occupantsC = document.getElementById('occupants-C');
const occupantsD = document.getElementById('occupants-D');

// 1. Initialize Host Session
function initHost() {
  currentQuestions = getQuestionsByPack(activePackId);
  questionCountBadge.innerText = `${currentQuestions.length} Soal`;

  socket.emit('create_room', { questions: currentQuestions, duration: 15 }, (res) => {
    if (res && res.success) {
      currentRoomCode = res.roomCode;
      roomPinDisplay.innerText = currentRoomCode;
      lobbyPinHuge.innerText = currentRoomCode;
      loadServerInfoAndQR(currentRoomCode);
    }
  });
}

// Fetch Server IP and Dynamic QR Code
async function loadServerInfoAndQR(roomCode) {
  try {
    const res = await fetch('/api/server-info');
    const data = await res.json();
    const primaryIP = data.primaryIP || 'localhost';
    const port = data.port || 3000;
    
    // Auto fill room parameter in URL
    const studentUrl = `http://${primaryIP}:${port}/play.html?room=${roomCode}`;
    joinUrlBox.innerHTML = `<strong>${studentUrl}</strong>`;

    // Fetch QR Code for this exact URL
    const qrRes = await fetch(`/api/qr?text=${encodeURIComponent(studentUrl)}`);
    const qrData = await qrRes.json();
    if (qrData.qr) {
      qrCodeImg.src = qrData.qr;
    }
  } catch (err) {
    console.error('Failed to load server info', err);
    joinUrlBox.innerText = `http://localhost:3000/play.html?room=${roomCode}`;
  }
}

// Sound toggle
btnSoundToggle.addEventListener('click', () => {
  const isMuted = sounds.toggleMute();
  btnSoundToggle.innerText = isMuted ? '🔇 Suara: MATI' : '🔊 Suara: AKTIF';
});

// Pack selector changed
selectPack.addEventListener('change', (e) => {
  activePackId = e.target.value;
  currentQuestions = getQuestionsByPack(activePackId);
  questionCountBadge.innerText = `${currentQuestions.length} Soal`;
  if (currentRoomCode) {
    socket.emit('update_questions', { roomCode: currentRoomCode, questions: currentQuestions });
  }
  renderModalQuestionsList();
});

// 2. Socket Event Listeners
socket.on('player_joined', ({ player, totalPlayers }) => {
  players[player.id] = player;
  sounds.playJoin();
  updatePlayerListUI();
});

socket.on('player_left', ({ playerId, totalPlayers }) => {
  delete players[playerId];
  updatePlayerListUI();
  // Remove token from DOM if currently in game
  const token = document.getElementById(`token-${playerId}`);
  if (token) token.remove();
});

function updatePlayerListUI() {
  const playerArr = Object.values(players);
  playerCountEl.innerText = playerArr.length;

  if (playerArr.length === 0) {
    lobbyPlayersList.innerHTML = `<span style="color: #94a3b8; font-style: italic;">Menunggu siswa bergabung...</span>`;
    return;
  }

  lobbyPlayersList.innerHTML = playerArr.map(p => `
    <div class="player-token" style="font-size: 1.05rem; padding: 6px 14px;">
      <span class="avatar-icon">${p.avatar}</span>
      <span>${escapeHtml(p.name)}</span>
    </div>
  `).join('');
}

// Demo Bot Simulation for Testing
const btnAddDemoBot = document.getElementById('btn-add-demo-bot');
const demoBotList = [
  { name: 'Budi (Siswa)', avatar: '🦁' },
  { name: 'Siti (Siswa)', avatar: '🐰' },
  { name: 'Doni (Siswa)', avatar: '🐼' },
  { name: 'Ayu (Siswa)', avatar: '🦊' }
];
let demoBotIndex = 0;

function spawnDemoBot() {
  if (!currentRoomCode) return;
  const bot = demoBotList[demoBotIndex % demoBotList.length];
  demoBotIndex++;

  const botSocket = io();
  botSocket.emit('join_room', { roomCode: currentRoomCode, name: bot.name, avatar: bot.avatar }, (res) => {
    if (res && res.success) {
      // Bot picks island automatically when a question starts
      botSocket.on('new_question', (qData) => {
        setTimeout(() => {
          const choices = ['A', 'B', 'C', 'D'];
          // 70% chance to pick correct or random
          const chosen = Math.random() < 0.6 ? (qData.correct || 'B') : choices[Math.floor(Math.random() * choices.length)];
          botSocket.emit('choose_island', { island: chosen });
        }, 1200 + Math.random() * 2000);
      });
    }
  });
}

if (btnAddDemoBot) {
  btnAddDemoBot.addEventListener('click', () => {
    spawnDemoBot();
  });
}

// 3. Start Game
const btnTopbarStart = document.getElementById('btn-topbar-start');

function triggerStartGame() {
  // If no players, automatically spawn 2 demo students so teacher/user can test directly!
  if (Object.keys(players).length === 0) {
    spawnDemoBot();
    spawnDemoBot();
    setTimeout(() => {
      sounds.playCorrect();
      socket.emit('start_game', { roomCode: currentRoomCode });
    }, 500);
    return;
  }

  sounds.playCorrect();
  socket.emit('start_game', { roomCode: currentRoomCode });
}

btnStartGame.addEventListener('click', triggerStartGame);
if (btnTopbarStart) {
  btnTopbarStart.addEventListener('click', triggerStartGame);
}

// 4. New Question Received
socket.on('new_question', (qData) => {
  screenLobby.style.display = 'none';
  screenPodium.style.display = 'none';
  screenGame.style.display = 'flex';
  timerContainer.style.display = 'flex';
  if (btnTopbarStart) btnTopbarStart.style.display = 'none';

  // Reset Islands and clear any status banners
  document.querySelectorAll('.status-floating-banner').forEach(el => el.remove());
  [islandA, islandB, islandC, islandD].forEach(island => {
    island.classList.remove('sinking', 'survivor');
  });

  // Reset Occupants Containers
  occupantsA.innerHTML = '';
  occupantsB.innerHTML = '';
  occupantsC.innerHTML = '';
  occupantsD.innerHTML = '';

  // Render all active players back onto the center bridge
  bridgeOccupants.innerHTML = '';
  Object.values(players).forEach(p => {
    p.island = null;
    const token = createPlayerToken(p);
    bridgeOccupants.appendChild(token);
  });

  // Populate Question Content
  qCategory.innerText = `KATEGORI: ${qData.category.toUpperCase()}`;
  qText.innerText = qData.question;
  qCurrentIndex.innerText = qData.index + 1;
  qTotalCount.innerText = qData.total;

  answerA.innerText = qData.options.A || '-';
  answerB.innerText = qData.options.B || '-';
  answerC.innerText = qData.options.C || '-';
  answerD.innerText = qData.options.D || '-';

  btnRevealNow.style.display = 'inline-flex';
  btnNextQuestion.style.display = 'none';

  // Start Timer
  startQuestionTimer(qData.duration || 15);
});

function createPlayerToken(player) {
  const token = document.createElement('div');
  token.id = `token-${player.id}`;
  token.className = 'player-token';
  token.innerHTML = `<span class="avatar-icon">${player.avatar}</span><span>${escapeHtml(player.name)}</span>`;
  return token;
}

// Timer Handler
function startQuestionTimer(duration) {
  clearInterval(timerInterval);
  remainingSeconds = duration;
  timerSecondsEl.innerText = remainingSeconds;
  timerContainer.classList.remove('hurry');

  timerInterval = setInterval(() => {
    remainingSeconds--;
    timerSecondsEl.innerText = remainingSeconds;

    if (remainingSeconds <= 5 && remainingSeconds > 0) {
      timerContainer.classList.add('hurry');
      sounds.playTick();
    }

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      triggerRevealAnswer();
    }
  }, 1000);
}

// 5. Player Moves to an Island in Real-Time
socket.on('player_moved', ({ playerId, name, avatar, island }) => {
  sounds.playTap();
  if (players[playerId]) {
    players[playerId].island = island;
  }

  let token = document.getElementById(`token-${playerId}`);
  if (!token) {
    token = createPlayerToken({ id: playerId, name, avatar });
  }

  // Move token into designated island
  const targetOccupants = document.getElementById(`occupants-${island}`);
  if (targetOccupants) {
    targetOccupants.appendChild(token);
  }
});

// 6. Reveal Answer Button
btnRevealNow.addEventListener('click', () => {
  triggerRevealAnswer();
});

function triggerRevealAnswer() {
  clearInterval(timerInterval);
  timerContainer.style.display = 'none';
  socket.emit('reveal_answer', { roomCode: currentRoomCode });
}

// 7. Round Revealed by Server
socket.on('round_revealed', ({ correctIsland, explanation, results }) => {
  btnRevealNow.style.display = 'none';
  btnNextQuestion.style.display = 'inline-flex';

  // Update players score in local state
  results.forEach(res => {
    if (players[res.id]) {
      players[res.id].score = res.totalScore;
    }
  });

  // Animate Islands: Correct one glows, wrong ones sink into water!
  const islandMap = { A: islandA, B: islandB, C: islandC, D: islandD };

  // Play splash sound & animation
  sounds.playSplash();

  for (const key in islandMap) {
    const el = islandMap[key];
    if (key === correctIsland) {
      el.classList.add('survivor');
      const badge = document.createElement('div');
      badge.className = 'status-floating-banner survivor-banner';
      badge.innerText = 'PULAU INI AMAN & BENAR';
      el.appendChild(badge);
    } else {
      el.classList.add('sinking');
      // Character avatars plunge into water!
      const tokens = el.querySelectorAll('.player-token');
      tokens.forEach(tok => {
        tok.classList.add('splashing-in-water');
      });
    }
  }

  // Play fanfare / correct audio
  setTimeout(() => {
    sounds.playCorrect();
  }, 350);
});

// 8. Next Question Button
btnNextQuestion.addEventListener('click', () => {
  socket.emit('next_question', { roomCode: currentRoomCode });
});

// 9. Game Over / Podium Screen
socket.on('game_over', ({ leaderboard }) => {
  screenGame.style.display = 'none';
  timerContainer.style.display = 'none';
  screenPodium.style.display = 'flex';

  sounds.playFanfare();

  // Render Top 3 Podium
  const podiumContainer = document.getElementById('podium-boxes');
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  podiumContainer.innerHTML = `
    <!-- Juara 2 -->
    ${top2 ? `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="font-size: 2.2rem; margin-bottom: 4px;">${top2.avatar}</div>
        <div style="font-weight: 800; color: #0f172a; font-size: 1.1rem;">${escapeHtml(top2.name)}</div>
        <div style="font-weight: 700; color: #64748b; font-size: 0.95rem; margin-bottom: 6px;">⭐ ${top2.score}</div>
        <div style="background: #94a3b8; width: 130px; height: 110px; border-radius: 16px 16px 0 0; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: white; font-weight: 900; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
          🥈 2
        </div>
      </div>
    ` : ''}

    <!-- Juara 1 -->
    ${top1 ? `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="font-size: 1.8rem; margin-bottom: -6px;">👑</div>
        <div style="font-size: 2.8rem; margin-bottom: 4px;">${top1.avatar}</div>
        <div style="font-weight: 900; color: #b45309; font-size: 1.3rem;">${escapeHtml(top1.name)}</div>
        <div style="font-weight: 800; color: #d97706; font-size: 1.1rem; margin-bottom: 6px;">⭐ ${top1.score}</div>
        <div style="background: linear-gradient(180deg, #facc15 0%, #ca8a04 100%); width: 150px; height: 160px; border-radius: 20px 20px 0 0; display: flex; align-items: center; justify-content: center; font-size: 2.8rem; color: white; font-weight: 900; box-shadow: 0 6px 16px rgba(0,0,0,0.25);">
          🥇 1
        </div>
      </div>
    ` : ''}

    <!-- Juara 3 -->
    ${top3 ? `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="font-size: 2.2rem; margin-bottom: 4px;">${top3.avatar}</div>
        <div style="font-weight: 800; color: #0f172a; font-size: 1.1rem;">${escapeHtml(top3.name)}</div>
        <div style="font-weight: 700; color: #64748b; font-size: 0.95rem; margin-bottom: 6px;">⭐ ${top3.score}</div>
        <div style="background: #b45309; width: 130px; height: 80px; border-radius: 16px 16px 0 0; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: white; font-weight: 900; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
          🥉 3
        </div>
      </div>
    ` : ''}
  `;

  // Render Full Leaderboard
  const fullListEl = document.getElementById('full-leaderboard-list');
  fullListEl.innerHTML = leaderboard.map((p, idx) => `
    <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 8px 16px; border-radius: 12px; font-weight: 800;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: #64748b; width: 24px;">#${idx + 1}</span>
        <span style="font-size: 1.3rem;">${p.avatar}</span>
        <span>${escapeHtml(p.name)}</span>
      </div>
      <div style="color: #d97706;">⭐ ${p.score} Bintang</div>
    </div>
  `).join('');
});

// Play Again
btnPlayAgain.addEventListener('click', () => {
  screenPodium.style.display = 'none';
  screenLobby.style.display = 'flex';
  if (btnTopbarStart) btnTopbarStart.style.display = 'inline-flex';
});

// ================= QUESTION MANAGEMENT MODAL =================
btnManageQuestions.addEventListener('click', () => {
  renderModalQuestionsList();
  modalQuestions.style.display = 'flex';
});

btnCloseModal.addEventListener('click', () => {
  modalQuestions.style.display = 'none';
});

function renderModalQuestionsList() {
  modalQuestionsList.innerHTML = currentQuestions.map((q, idx) => `
    <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; font-size: 0.95rem;">
      <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px;">
        ${idx + 1}. ${escapeHtml(q.question)}
      </div>
      <div style="font-size: 0.85rem; color: #64748b; display: flex; gap: 12px; flex-wrap: wrap;">
        <span>🔴 A: ${escapeHtml(q.options.A)}</span>
        <span>🔵 B: ${escapeHtml(q.options.B)}</span>
        <span>🟡 C: ${escapeHtml(q.options.C)}</span>
        <span>🟢 D: ${escapeHtml(q.options.D)}</span>
      </div>
      <div style="margin-top: 4px; font-size: 0.85rem; font-weight: 800; color: #059669;">
        Kunci Benar: Pulau ${q.correct} (${q.duration || 15} detik)
      </div>
    </div>
  `).join('');
}

btnSaveCustomQuestion.addEventListener('click', () => {
  const qTextVal = document.getElementById('input-q-text').value.trim();
  const optAVal = document.getElementById('input-opt-a').value.trim();
  const optBVal = document.getElementById('input-opt-b').value.trim();
  const optCVal = document.getElementById('input-opt-c').value.trim();
  const optDVal = document.getElementById('input-opt-d').value.trim();
  const correctVal = document.getElementById('input-q-correct').value;
  const durationVal = parseInt(document.getElementById('input-q-duration').value, 10) || 15;

  if (!qTextVal || !optAVal || !optBVal || !optCVal || !optDVal) {
    alert('Harap isi pertanyaan dan semua 4 pilihan jawaban!');
    return;
  }

  const newQ = {
    category: 'Materi Guru',
    question: qTextVal,
    options: {
      A: optAVal,
      B: optBVal,
      C: optCVal,
      D: optDVal
    },
    correct: correctVal,
    explanation: `Jawaban benar adalah Pulau ${correctVal}: ${[optAVal, optBVal, optCVal, optDVal][['A','B','C','D'].indexOf(correctVal)]}`,
    duration: durationVal
  };

  currentQuestions.push(newQ);
  questionCountBadge.innerText = `${currentQuestions.length} Soal`;

  // Save to LocalStorage
  try {
    localStorage.setItem('custom_questions_' + activePackId, JSON.stringify(currentQuestions));
  } catch (e) {}

  // Update server room
  if (currentRoomCode) {
    socket.emit('update_questions', { roomCode: currentRoomCode, questions: currentQuestions });
  }

  alert('Soal berhasil ditambahkan!');
  document.getElementById('input-q-text').value = '';
  document.getElementById('input-opt-a').value = '';
  document.getElementById('input-opt-b').value = '';
  document.getElementById('input-opt-c').value = '';
  document.getElementById('input-opt-d').value = '';

  renderModalQuestionsList();
});

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Start Host on Load
window.addEventListener('DOMContentLoaded', () => {
  initHost();
});
