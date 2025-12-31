let questions = [];
let currentQuestion = 0;
let score = 0;
let answered = false;
let timerInterval = null;
let timeRemaining = 20;
let helpUsed = false;

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const helpBtn = document.getElementById("help-btn");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const currentEl = document.getElementById("current");
const progressFill = document.getElementById("progress-fill");
const messageEl = document.getElementById("message");
const timerValue = document.getElementById("timer-value");

function showMessage(text, type = "info") {
  messageEl.textContent = text;
  messageEl.className = 'message ' + type;
  setTimeout(() => {
    messageEl.textContent = '';
    messageEl.className = 'message';
  }, 2500);
}

function shuffleQuestions(arr) {
  // Fisher-Yates shuffle algorithm
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startTimer() {
  timeRemaining = 20;
  timerValue.textContent = timeRemaining;
  timerValue.parentElement.classList.remove('warning');
  
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    timeRemaining--;
    timerValue.textContent = timeRemaining;
    
    if (timeRemaining <= 5) {
      timerValue.parentElement.classList.add('warning');
    }
    
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      if (!answered) {
        answered = true;
        Array.from(optionsEl.children).forEach(b => b.disabled = true);
        showMessage('Temps écoulé !', 'error');
        nextBtn.disabled = false;
      }
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function useHelp() {
  if (helpUsed || answered || currentQuestion >= questions.length) return;
  
  helpUsed = true;
  const correct = questions[currentQuestion].answer;
  
  Array.from(optionsEl.children).forEach(btn => {
    if (btn.textContent === correct) {
      btn.style.background = '#FFD700';
      btn.style.border = '2px solid #FFD700';
    }
  });
  
  showMessage('💡 La bonne réponse est en or', 'info');
  helpBtn.disabled = true;
}

function loadQuestions() {
  fetch('questions.json')
    .then(res => {
      if (!res.ok) throw new Error('Échec du chargement');
      return res.json();
    })
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) throw new Error('Aucune question');
      questions = shuffleQuestions(data);
      currentQuestion = 0;
      score = 0;
      scoreEl.textContent = score;
      helpUsed = false;
      helpBtn.disabled = false;
      updateBestFromStorage();
      renderQuestion();
    })
    .catch(err => {
      console.error(err);
      questionEl.textContent = 'Impossible de charger les questions.';
      optionsEl.innerHTML = '';
      nextBtn.disabled = true;
      showMessage('Erreur de chargement', 'error');
    });
}

function updateBestFromStorage() {
  const best = parseInt(localStorage.getItem('bestScore') || '0', 10);
  bestScoreEl.textContent = best;
}

function renderQuestion() {
  if (currentQuestion >= questions.length) {
    finishQuiz();
    return;
  }
  const q = questions[currentQuestion];
  questionEl.textContent = q.question;
  optionsEl.innerHTML = '';
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.type = 'button';
    btn.setAttribute('role', 'option');
    btn.tabIndex = 0;
    btn.addEventListener('click', () => selectAnswer(btn));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectAnswer(btn); }
    });
    optionsEl.appendChild(btn);
  });
  answered = false;
  nextBtn.disabled = true;
  // Le bouton aide reste désactivé si déjà utilisé
  if (!helpUsed) helpBtn.disabled = false;
  currentEl.textContent = currentQuestion + 1;
  updateProgressBar();
  startTimer();
}

function selectAnswer(btn) {
  if (answered) return;
  answered = true;
  stopTimer();
  const selected = btn.textContent;
  const correct = questions[currentQuestion].answer;
  // disable buttons
  Array.from(optionsEl.children).forEach(b => b.disabled = true);
  if (selected === correct) {
    btn.style.background = '#34A853';
    score++;
    scoreEl.textContent = score;
    showMessage('Bonne réponse !', 'success');
  } else {
    btn.style.background = '#EA4335';
    // highlight correct
    Array.from(optionsEl.children).forEach(b => { if (b.textContent === correct) b.style.background = '#34A853'; });
    showMessage('Mauvaise réponse', 'error');
  }
  nextBtn.disabled = false;
}

function updateProgressBar() {
  const total = Math.max(questions.length, 1);
  const pct = ((currentQuestion) / total) * 100;
  progressFill.style.width = pct + '%';
}

function finishQuiz() {
  stopTimer();
  showMessage('Quiz terminé ! Score final: ' + score, 'info');
  const best = parseInt(localStorage.getItem('bestScore') || '0', 10);
  if (score > best) {
    localStorage.setItem('bestScore', String(score));
    bestScoreEl.textContent = score;
    showMessage('Nouveau record !', 'success');
  }
  nextBtn.disabled = true;
}

nextBtn.addEventListener('click', () => {
  if (!answered) { showMessage('Sélectionnez une réponse avant de continuer', 'error'); return; }
  currentQuestion++;
  if (currentQuestion < questions.length) renderQuestion(); else finishQuiz();
});

restartBtn.addEventListener('click', () => {
  stopTimer();
  loadQuestions();
});

helpBtn.addEventListener('click', () => {
  useHelp();
});

// init
loadQuestions();
