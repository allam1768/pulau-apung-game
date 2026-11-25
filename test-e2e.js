const { io } = require('socket.io-client');
const { QUESTION_PACKS } = require('./public/js/questions.js');

const SERVER_URL = 'http://localhost:3000';

async function runTest() {
  console.log('--- STARTING E2E TEST: PULAU APUNG ---');

  // 1. Connect Host
  const hostSocket = io(SERVER_URL);
  await new Promise(r => hostSocket.on('connect', r));
  console.log('✅ Host connected to server');

  // 2. Create Room
  const testQuestions = QUESTION_PACKS.matematika.questions.slice(0, 2); // 2 questions for quick test
  const roomData = await new Promise(resolve => {
    hostSocket.emit('create_room', { questions: testQuestions, duration: 5 }, resolve);
  });
  console.log('✅ Room created with Code:', roomData.roomCode);
  const roomCode = roomData.roomCode;

  // 3. Connect 3 Students
  const s1 = io(SERVER_URL);
  const s2 = io(SERVER_URL);
  const s3 = io(SERVER_URL);

  await Promise.all([
    new Promise(r => s1.on('connect', r)),
    new Promise(r => s2.on('connect', r)),
    new Promise(r => s3.on('connect', r))
  ]);
  console.log('✅ 3 Student sockets connected');

  // Join Room
  const [j1, j2, j3] = await Promise.all([
    new Promise(r => s1.emit('join_room', { roomCode, name: 'Budi', avatar: '🦁' }, r)),
    new Promise(r => s2.emit('join_room', { roomCode, name: 'Siti', avatar: '🐰' }, r)),
    new Promise(r => s3.emit('join_room', { roomCode, name: 'Doni', avatar: '🐼' }, r))
  ]);

  if (!j1.success || !j2.success || !j3.success) {
    throw new Error('Join room failed');
  }
  console.log('✅ All 3 students successfully joined room');

  // 4. Start Game
  const questionPromise = new Promise(resolve => {
    s1.once('new_question', q => resolve(q));
  });

  hostSocket.emit('start_game', { roomCode });
  const q1 = await questionPromise;
  console.log('✅ Question 1 received by student:', q1.question);
  console.log('   Options:', q1.options);

  // 5. Students pick islands (Q1 correct answer is 'B')
  s1.emit('choose_island', { island: 'B' }); // Correct
  s2.emit('choose_island', { island: 'B' }); // Correct
  s3.emit('choose_island', { island: 'A' }); // Wrong

  await new Promise(r => setTimeout(r, 200));

  // 6. Host reveals answer
  const resultsPromise = Promise.all([
    new Promise(r => s1.once('round_result', r)),
    new Promise(r => s2.once('round_result', r)),
    new Promise(r => s3.once('round_result', r)),
    new Promise(r => hostSocket.once('round_revealed', r))
  ]);
  hostSocket.emit('reveal_answer', { roomCode });
  const [res1, res2, res3, hostRev] = await resultsPromise;

  console.log('✅ Round 1 Results:');
  console.log(`   - Budi (Chose B): isCorrect = ${res1.isCorrect}, points = ${res1.pointsAdded}`);
  console.log(`   - Siti (Chose B): isCorrect = ${res2.isCorrect}, points = ${res2.pointsAdded}`);
  console.log(`   - Doni (Chose A): isCorrect = ${res3.isCorrect}, points = ${res3.pointsAdded}`);

  if (!res1.isCorrect || !res2.isCorrect || res3.isCorrect) {
    throw new Error('Scoring verification failed!');
  }
  if (res3.pointsAdded !== 10) {
    throw new Error('Participation bonus verification failed!');
  }

  // 7. Next Question -> Game Over (since we have 2 questions)
  const q2Promise = new Promise(resolve => s1.once('new_question', resolve));
  hostSocket.emit('next_question', { roomCode });
  const q2 = await q2Promise;
  console.log('✅ Question 2 received:', q2.question);

  // Reveal Q2
  const hostRev2 = new Promise(r => hostSocket.once('round_revealed', r));
  hostSocket.emit('reveal_answer', { roomCode });
  await hostRev2;

  // Next Question triggers Game Over
  const gameOverPromise = new Promise(resolve => s1.once('game_over', resolve));
  hostSocket.emit('next_question', { roomCode });
  const finalOver = await gameOverPromise;

  console.log('✅ Game Over successfully triggered!');
  console.log('   Podium Top 1:', finalOver.leaderboard[0].name, 'Score:', finalOver.leaderboard[0].score);
  console.log('   Podium Top 2:', finalOver.leaderboard[1].name, 'Score:', finalOver.leaderboard[1].score);
  console.log('   Podium Top 3:', finalOver.leaderboard[2].name, 'Score:', finalOver.leaderboard[2].score);

  // Clean up
  hostSocket.disconnect();
  s1.disconnect();
  s2.disconnect();
  s3.disconnect();

  console.log('🎉 ALL TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}

runTest().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
