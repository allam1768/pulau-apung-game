const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const path = require('path');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

app.use(express.json());
// Disable caching so updates are seen instantly in browser
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { etag: false, maxAge: 0 }));

// Helper to get local network IP
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const k in interfaces) {
    for (const addr of interfaces[k]) {
      if (addr.family === 'IPv4' && !addr.internal) {
        // Prioritize physical WiFi or Ethernet over virtual docker bridges
        const isVirtual = k.startsWith('docker') || k.startsWith('br-') || k.startsWith('veth');
        addresses.push({ iface: k, ip: addr.address, isVirtual });
      }
    }
  }
  // Sort real interfaces first
  addresses.sort((a, b) => (a.isVirtual === b.isVirtual ? 0 : a.isVirtual ? 1 : -1));
  return addresses;
}

// API to get local network info and QR code
app.get('/api/server-info', async (req, res) => {
  const ips = getLocalIPs();
  const primaryIP = ips.length > 0 ? ips[0].ip : 'localhost';
  const port = PORT;
  const joinUrl = `http://${primaryIP}:${port}/play.html`;

  try {
    const qrDataUrl = await QRCode.toDataURL(joinUrl, {
      width: 280,
      margin: 1,
      color: { dark: '#1e293b', light: '#ffffff' }
    });
    res.json({
      ips,
      primaryIP,
      port,
      joinUrl,
      qrDataUrl
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR' });
  }
});

// Dynamic QR generator for specific room URL
app.get('/api/qr', async (req, res) => {
  const text = req.query.text || '';
  if (!text) return res.status(400).send('No text provided');
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 280,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
    res.json({ qr: dataUrl });
  } catch (err) {
    res.status(500).json({ error: 'QR Error' });
  }
});

/* =========================================================
   GAME STATE MANAGEMENT (Socket.IO)
   Rooms storage structure:
   rooms[roomCode] = {
     code: '8821',
     hostSocketId: '...',
     state: 'LOBBY' | 'QUESTION' | 'REVEAL' | 'GAMEOVER',
     questions: [...],
     currentQuestionIndex: 0,
     questionStartTime: 0,
     questionDuration: 15,
     players: {
       socketId: {
         id: socketId,
         name: 'Budi',
         avatar: '🦁',
         island: null, // 'A', 'B', 'C', 'D'
         answeredAt: 0,
         score: 0,
         lastScoreAdded: 0,
         survived: null
       }
     }
   }
========================================================= */

const rooms = {};

function generateRoomCode() {
  let code;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms[code]);
  return code;
}

io.on('connection', (socket) => {
  // 1. Host creates a room
  socket.on('create_room', (data, callback) => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      code: roomCode,
      hostSocketId: socket.id,
      state: 'LOBBY',
      questions: data.questions || [],
      currentQuestionIndex: 0,
      questionStartTime: 0,
      questionDuration: data.duration || 15,
      players: {}
    };

    socket.join(roomCode);
    console.log(`[Host] Created room ${roomCode}`);
    if (callback) callback({ success: true, roomCode });
  });

  // 2. Student joins a room
  socket.on('join_room', ({ roomCode, name, avatar }, callback) => {
    const cleanCode = (roomCode || '').trim().toUpperCase();
    const room = rooms[cleanCode];

    if (!room) {
      if (callback) callback({ success: false, message: 'Kode room tidak ditemukan!' });
      return;
    }

    // Check if player already exists in room
    const playerId = socket.id;
    const cleanName = (name || 'Siswa').trim().substring(0, 15);
    const chosenAvatar = avatar || '🐰';

    room.players[playerId] = {
      id: playerId,
      name: cleanName,
      avatar: chosenAvatar,
      island: null,
      answeredAt: 0,
      score: 0,
      lastScoreAdded: 0,
      survived: null
    };

    socket.join(cleanCode);
    socket.roomCode = cleanCode;

    console.log(`[Join] ${cleanName} (${chosenAvatar}) joined room ${cleanCode}`);

    // Notify Host of new player
    io.to(room.hostSocketId).emit('player_joined', {
      player: room.players[playerId],
      totalPlayers: Object.keys(room.players).length
    });

    if (callback) {
      callback({
        success: true,
        roomCode: cleanCode,
        player: room.players[playerId],
        gameState: room.state
      });
    }
  });

  // 3. Host starts game
  socket.on('start_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.hostSocketId !== socket.id) return;

    room.currentQuestionIndex = 0;
    // Reset all player scores
    Object.values(room.players).forEach(p => {
      p.score = 0;
      p.island = null;
      p.survived = null;
      p.lastScoreAdded = 0;
    });

    sendQuestion(room);
  });

  // 4. Host next question
  socket.on('next_question', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.hostSocketId !== socket.id) return;

    room.currentQuestionIndex++;
    if (room.currentQuestionIndex >= room.questions.length) {
      // Game Over
      room.state = 'GAMEOVER';
      const leaderboard = Object.values(room.players).sort((a, b) => b.score - a.score);
      io.to(room.code).emit('game_over', { leaderboard });
    } else {
      sendQuestion(room);
    }
  });

  // Function to broadcast a question
  function sendQuestion(room) {
    room.state = 'QUESTION';
    const q = room.questions[room.currentQuestionIndex];
    room.questionStartTime = Date.now();
    room.questionDuration = q.duration || room.questionDuration || 15;

    // Reset player choices for this round
    Object.values(room.players).forEach(p => {
      p.island = null;
      p.answeredAt = 0;
      p.survived = null;
      p.lastScoreAdded = 0;
    });

    // Send question with options (without revealing the correct answer to players)
    const publicQuestion = {
      index: room.currentQuestionIndex,
      total: room.questions.length,
      category: q.category || 'Pendidikan',
      question: q.question,
      image: q.image || '',
      options: q.options, // ['A. ...', 'B. ...', 'C. ...', 'D. ...']
      duration: room.questionDuration
    };

    io.to(room.code).emit('new_question', publicQuestion);
  }

  // 5. Student picks an island
  socket.on('choose_island', ({ island }) => {
    const roomCode = socket.roomCode;
    const room = rooms[roomCode];
    if (!room || room.state !== 'QUESTION') return;

    const player = room.players[socket.id];
    if (!player) return;

    // island is 'A', 'B', 'C', or 'D'
    player.island = island;
    player.answeredAt = Date.now();

    // Broadcast movement to host so host renders avatar walking to the island
    io.to(room.hostSocketId).emit('player_moved', {
      playerId: player.id,
      name: player.name,
      avatar: player.avatar,
      island: island
    });

    // Acknowledge back to player
    socket.emit('choice_confirmed', { island });
  });

  // 6. Host reveals answer (Timer finished or teacher clicked reveal)
  socket.on('reveal_answer', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.hostSocketId !== socket.id || room.state !== 'QUESTION') return;

    room.state = 'REVEAL';
    const currentQ = room.questions[room.currentQuestionIndex];
    const correctAnswer = currentQ.correct; // 'A', 'B', 'C', or 'D'

    const results = [];

    Object.values(room.players).forEach(p => {
      const isCorrect = p.island === correctAnswer;
      let points = 0;

      if (isCorrect) {
        // Base score 100 + speed bonus up to 50
        const timeTakenSec = Math.max(0, (p.answeredAt - room.questionStartTime) / 1000);
        const speedRatio = Math.max(0, 1 - (timeTakenSec / room.questionDuration));
        const speedBonus = Math.round(speedRatio * 50);
        points = 100 + speedBonus;
        p.survived = true;
      } else {
        // Participation stars (+10 points) so kids in SD 1-3 don't feel discouraged
        points = 10;
        p.survived = false;
      }

      p.lastScoreAdded = points;
      p.score += points;

      results.push({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        island: p.island,
        isCorrect,
        pointsAdded: points,
        totalScore: p.score
      });

      // Notify individual player of their survival result
      io.to(p.id).emit('round_result', {
        isCorrect,
        correctIsland: correctAnswer,
        chosenIsland: p.island,
        explanation: currentQ.explanation || '',
        pointsAdded: points,
        totalScore: p.score
      });
    });

    // Notify Host of full round breakdown to animate sinking and splashes
    io.to(room.hostSocketId).emit('round_revealed', {
      correctIsland: correctAnswer,
      explanation: currentQ.explanation || '',
      results
    });
  });

  // 7. Update questions during session (Teacher adds/edits question pack)
  socket.on('update_questions', ({ roomCode, questions }) => {
    const room = rooms[roomCode];
    if (!room || room.hostSocketId !== socket.id) return;
    room.questions = questions;
    socket.emit('questions_updated', { count: questions.length });
  });

  // 8. Player disconnects
  socket.on('disconnect', () => {
    const roomCode = socket.roomCode;
    if (roomCode && rooms[roomCode]) {
      const room = rooms[roomCode];
      const player = room.players[socket.id];
      if (player) {
        delete room.players[socket.id];
        io.to(room.hostSocketId).emit('player_left', {
          playerId: socket.id,
          name: player.name,
          totalPlayers: Object.keys(room.players).length
        });
        console.log(`[Leave] ${player.name} left room ${roomCode}`);
      }
      return;
    }

    // Check if host disconnected
    for (const code in rooms) {
      if (rooms[code].hostSocketId === socket.id) {
        io.to(code).emit('host_disconnected', { message: 'Guru telah menutup ruangan permainan.' });
        delete rooms[code];
        console.log(`[Host Closed] Room ${code} closed`);
        break;
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  console.log(`===================================================`);
  console.log(`🏝️  PULAU APUNG: JANGAN JATUH! - GAME EDUKASI SD 🏝️`);
  console.log(`===================================================`);
  console.log(`Server aktif di Port: ${PORT}`);
  console.log(`Buka di Laptop Guru (Host): http://localhost:${PORT}/host.html`);
  if (ips.length > 0) {
    console.log(`Alamat HP Siswa di WiFi:   http://${ips[0].ip}:${PORT}/play.html`);
  }
  console.log(`Halaman Utama:              http://localhost:${PORT}/`);
  console.log(`===================================================`);
});
