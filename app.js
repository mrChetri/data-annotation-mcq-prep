/**
 * Data Annotation Using Python - MCQ Examination Application
 * Core Application Logic, State Management, LocalStorage Persistence & Interactive UI
 */

// Global State
const STATE = {
  theme: localStorage.getItem('da_theme') || 'light',
  view: 'dashboard', // dashboard, exam, results, review, memory
  currentTest: null, // { title, mode, questions: [], currentIndex: 0, answers: {}, status: {}, timer: null, timeLeft: 0, isSubmitted: false }
  progress: {
    attempts: {}, // questionId -> { selectedIndex, isCorrect, timestamp, mastered }
    marked: {},   // questionId -> true
    lastSession: null
  },
  timerEnabled: localStorage.getItem('da_timer_enabled') !== 'false',
  timerMinutesPerQuestion: 1.5,
  searchQuery: '',
  activeFilter: 'all'
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadProgress();
  initTheme();
  setupGlobalListeners();
  renderDashboard();
});

// Theme Management
function initTheme() {
  document.documentElement.setAttribute('data-theme', STATE.theme);
  updateThemeIcon();
}

function toggleTheme() {
  STATE.theme = STATE.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('da_theme', STATE.theme);
  document.documentElement.setAttribute('data-theme', STATE.theme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const iconEl = document.getElementById('theme-toggle-icon');
  if (iconEl) {
    iconEl.textContent = STATE.theme === 'light' ? '🌙' : '☀️';
  }
}

// LocalStorage Persistence
function loadProgress() {
  try {
    const saved = localStorage.getItem('da_progress_v1');
    if (saved) {
      STATE.progress = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load progress from localStorage:', e);
  }
}

function saveProgress() {
  try {
    localStorage.setItem('da_progress_v1', JSON.stringify(STATE.progress));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

function resetAllProgress() {
  if (confirm('Are you sure you want to reset all your progress, scores, and test history? This action cannot be undone.')) {
    STATE.progress = {
      attempts: {},
      marked: {},
      lastSession: null
    };
    saveProgress();
    showToast('All progress has been reset.');
    renderDashboard();
  }
}

// View Routing
function switchView(viewName) {
  STATE.view = viewName;
  document.querySelectorAll('.app-view').forEach(el => el.classList.remove('active'));
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.add('active');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Global Event Listeners
function setupGlobalListeners() {
  // Theme Toggle
  document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);

  // Logo / Brand Click -> Dashboard
  document.getElementById('brand-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (STATE.currentTest && !STATE.currentTest.isSubmitted) {
      if (!confirm('Leave the ongoing test? Your current progress in this test will be saved.')) {
        return;
      }
    }
    switchView('dashboard');
    renderDashboard();
  });

  // Modal close handlers
  document.getElementById('concept-modal-close')?.addEventListener('click', closeConceptModal);
  document.getElementById('concept-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'concept-modal-overlay') closeConceptModal();
  });

  document.getElementById('mock-config-close')?.addEventListener('click', closeMockModal);
  document.getElementById('mock-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'mock-modal-overlay') closeMockModal();
  });

  // Keyboard Shortcuts for exam
  window.addEventListener('keydown', handleGlobalKeydown);
}

function handleGlobalKeydown(e) {
  if (STATE.view !== 'exam' || !STATE.currentTest) return;

  // If focus is in input or modal is open, skip
  if (document.querySelector('.modal-overlay.active')) return;

  const key = e.key.toUpperCase();
  if (['A', 'B', 'C', 'D'].includes(key)) {
    const idx = key.charCodeAt(0) - 65;
    selectOption(idx);
  } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    nextQuestion();
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    prevQuestion();
  } else if (e.key === 'Enter') {
    submitAnswer();
  } else if (e.key === 'm' || e.key === 'M') {
    toggleMarkForReview();
  }
}

// --------------------------------------------------------------------------
// 1. DASHBOARD CONTROLLER
// --------------------------------------------------------------------------
function renderDashboard() {
  switchView('dashboard');

  const totalQuestions = QUESTIONS_DATA.length; // 120
  let attemptedCount = 0;
  let correctCount = 0;
  let incorrectCount = 0;

  Object.values(STATE.progress.attempts).forEach(att => {
    if (att.selectedIndex !== undefined) {
      attemptedCount++;
      if (att.isCorrect) correctCount++;
      else incorrectCount++;
    }
  });

  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
  const overallProgress = Math.round((attemptedCount / totalQuestions) * 100);

  // Update Hero Statistics
  document.getElementById('stat-total-chapters').textContent = '8 (6 with MCQs)';
  document.getElementById('stat-total-mcqs').textContent = totalQuestions;
  document.getElementById('stat-attempted').textContent = attemptedCount;
  document.getElementById('stat-accuracy').textContent = `${accuracy}%`;
  document.getElementById('stat-correct').textContent = correctCount;
  document.getElementById('stat-incorrect').textContent = incorrectCount;
  document.getElementById('stat-unanswered').textContent = totalQuestions - attemptedCount;

  // Render Chapters Grid
  const gridEl = document.getElementById('chapters-grid');
  if (!gridEl) return;
  gridEl.innerHTML = '';

  CHAPTERS_METADATA.forEach(ch => {
    const chQuestions = QUESTIONS_DATA.filter(q => q.chapterNumber === ch.chapterNumber);
    const hasMcqs = chQuestions.length > 0;

    let chAttempted = 0;
    let chCorrect = 0;
    let chIncorrect = 0;

    chQuestions.forEach(q => {
      const att = STATE.progress.attempts[q.id];
      if (att && att.selectedIndex !== undefined) {
        chAttempted++;
        if (att.isCorrect) chCorrect++;
        else chIncorrect++;
      }
    });

    const chAccuracy = chAttempted > 0 ? Math.round((chCorrect / chAttempted) * 100) : 0;
    const chProgress = hasMcqs ? Math.round((chAttempted / chQuestions.length) * 100) : 0;

    let priorityClass = 'priority-vhigh';
    if (ch.priority === 'High') priorityClass = 'priority-high';
    if (ch.priority === 'Medium') priorityClass = 'priority-med';

    const card = document.createElement('div');
    card.className = `chapter-card ${hasMcqs ? 'has-mcqs' : 'syllabus-only'}`;

    card.innerHTML = `
      <div class="chapter-card-top">
        <span class="ch-badge">CHAPTER ${ch.chapterNumber}</span>
        <span class="ch-priority-badge ${priorityClass}">${ch.priority.toUpperCase()} PRIORITY</span>
      </div>
      <h3 class="chapter-title">${ch.title}</h3>
      <p class="chapter-desc">${ch.description}</p>
      
      ${hasMcqs ? `
        <div class="chapter-stats-row">
          <span><strong>${chQuestions.length}</strong> Exam MCQs</span>
          <span>Attempted: <strong>${chAttempted}/${chQuestions.length}</strong> (${chProgress}%)</span>
          <span>Accuracy: <strong>${chAccuracy}%</strong></span>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${chProgress === 100 ? 'success' : ''}" style="width: ${chProgress}%"></div>
        </div>
        <div class="chapter-card-actions">
          <button class="btn btn-primary btn-sm" onclick="startTest(${ch.chapterNumber}, 'exam')">
            🎯 Start Test
          </button>
          <button class="btn btn-secondary btn-sm" onclick="startTest(${ch.chapterNumber}, 'practice')">
            💡 Practice Mode
          </button>
          <button class="btn btn-ghost btn-sm" onclick="openMemorySheet(${ch.chapterNumber})">
            📝 Revision Sheet
          </button>
          ${chIncorrect > 0 ? `
            <button class="btn btn-outline-danger btn-sm" onclick="reviewChapterMistakes(${ch.chapterNumber})">
              ⚠️ Review (${chIncorrect})
            </button>
          ` : ''}
        </div>
      ` : `
        <div class="chapter-stats-row">
          <span style="color: var(--text-muted);">📘 Course Theory & Syllabus Notes in prep.md</span>
        </div>
        <div style="font-size: 0.78rem; color: var(--text-muted); background: var(--bg-elevated); padding: 0.6rem; border-radius: var(--radius-sm); margin-bottom: 0.75rem;">
          ${ch.status}
        </div>
        <div class="chapter-card-actions">
          <button class="btn btn-secondary btn-sm" onclick="openSyllabusNotes(${ch.chapterNumber})">
            📖 View Chapter Syllabus Notes
          </button>
        </div>
      `}
    `;

    gridEl.appendChild(card);
  });

  // Enable/disable Review Incorrect Answers button
  const reviewMistakesBtn = document.getElementById('btn-review-mistakes-main');
  if (reviewMistakesBtn) {
    reviewMistakesBtn.disabled = incorrectCount === 0;
    reviewMistakesBtn.title = incorrectCount === 0 ? 'No incorrect answers yet' : `Review ${incorrectCount} incorrect questions`;
  }
}

// --------------------------------------------------------------------------
// 2. TEST & PRACTICE ENGINE
// --------------------------------------------------------------------------
function startTest(target, mode = 'exam', customQuestions = null) {
  let testTitle = '';
  let questions = [];

  if (customQuestions) {
    questions = [...customQuestions];
    testTitle = customQuestions.title || 'Custom Examination';
  } else if (target === 'mock') {
    testTitle = 'Full Mock Examination (All 120 MCQs)';
    questions = [...QUESTIONS_DATA];
  } else if (target === 'mock-random') {
    testTitle = 'Full Mock Examination (Randomized Order)';
    questions = [...QUESTIONS_DATA].sort(() => Math.random() - 0.5);
  } else if (typeof target === 'number') {
    const chMeta = CHAPTERS_METADATA.find(c => c.chapterNumber === target);
    testTitle = `Chapter ${target}: ${chMeta ? chMeta.title : ''}`;
    questions = QUESTIONS_DATA.filter(q => q.chapterNumber === target);
  }

  if (!questions || questions.length === 0) {
    showToast('No MCQs available for this selection.');
    return;
  }

  // Set up Current Test in STATE
  STATE.currentTest = {
    title: testTitle,
    mode: mode, // 'exam' or 'practice'
    questions: questions,
    currentIndex: 0,
    answers: {},       // questionId -> selectedIndex
    submitted: {},     // questionId -> boolean
    isSubmitted: false,
    startTime: Date.now(),
    timer: null,
    totalTimeSeconds: questions.length * 90, // 1.5 min per question
    timeLeftSeconds: questions.length * 90
  };

  // Preload any already answered questions from state if practice mode
  questions.forEach(q => {
    const existing = STATE.progress.attempts[q.id];
    if (existing && existing.selectedIndex !== undefined) {
      STATE.currentTest.answers[q.id] = existing.selectedIndex;
      // In practice mode, show feedback immediately for answered ones
      if (mode === 'practice') {
        STATE.currentTest.submitted[q.id] = true;
      }
    }
  });

  // Start Timer if in exam mode
  startExamTimer();

  // Save last opened
  STATE.progress.lastSession = {
    target: target,
    mode: mode,
    index: 0
  };
  saveProgress();

  // Switch to Examination View
  switchView('exam');
  renderExamUI();
}

function startExamTimer() {
  if (STATE.currentTest.timer) {
    clearInterval(STATE.currentTest.timer);
    STATE.currentTest.timer = null;
  }

  const timerEl = document.getElementById('exam-timer');
  if (!STATE.timerEnabled) {
    if (timerEl) timerEl.style.display = 'none';
    return;
  }

  if (timerEl) timerEl.style.display = 'inline-flex';
  updateTimerDisplay();

  STATE.currentTest.timer = setInterval(() => {
    STATE.currentTest.timeLeftSeconds--;
    updateTimerDisplay();

    if (STATE.currentTest.timeLeftSeconds <= 0) {
      clearInterval(STATE.currentTest.timer);
      STATE.currentTest.timer = null;
      showToast('⏰ Time is up! Submitting examination automatically.');
      finishTest(true);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const timerVal = document.getElementById('timer-value');
  const timerBox = document.getElementById('exam-timer');
  if (!timerVal) return;

  const secs = STATE.currentTest.timeLeftSeconds;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  timerVal.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  if (secs <= 180) { // 3 minutes left
    timerBox?.classList.add('warning');
  } else {
    timerBox?.classList.remove('warning');
  }
}

function renderExamUI() {
  const test = STATE.currentTest;
  if (!test) return;

  const currentQ = test.questions[test.currentIndex];
  const qId = currentQ.id;

  // Header updates
  document.getElementById('exam-title').textContent = test.title;
  const modeBadge = document.getElementById('exam-mode-badge');
  modeBadge.textContent = test.mode === 'practice' ? '💡 Practice Mode' : '🎯 Exam Mode';
  modeBadge.className = `mode-badge ${test.mode === 'practice' ? 'practice' : ''}`;

  // Progress update
  const total = test.questions.length;
  const curNum = test.currentIndex + 1;
  document.getElementById('exam-q-progress-text').textContent = `Question ${curNum} of ${total}`;
  const pct = Math.round((curNum / total) * 100);
  document.getElementById('exam-progress-bar').style.width = `${pct}%`;

  // Question Info
  document.getElementById('q-num-tag').textContent = `Q${currentQ.questionNumber} (Ch ${currentQ.chapterNumber})`;
  document.getElementById('q-topic-tag').textContent = currentQ.topic || currentQ.chapterTitle;
  document.getElementById('q-topic-tag').title = currentQ.topic;
  document.getElementById('q-text').textContent = currentQ.question;

  // Render 4 Options
  const optionsStack = document.getElementById('options-stack');
  optionsStack.innerHTML = '';

  const selectedAnswer = test.answers[qId];
  const isSubmitted = test.submitted[qId] || (test.mode === 'practice' && selectedAnswer !== undefined);

  const letters = ['A', 'B', 'C', 'D'];
  currentQ.options.forEach((optText, optIdx) => {
    const optCard = document.createElement('div');
    optCard.tabIndex = 0;
    optCard.className = 'option-card';
    optCard.setAttribute('role', 'radio');
    optCard.setAttribute('aria-checked', selectedAnswer === optIdx);

    if (selectedAnswer === optIdx) {
      optCard.classList.add('selected');
    }

    if (isSubmitted) {
      optCard.classList.add('disabled');
      if (optIdx === currentQ.correctAnswer) {
        optCard.classList.add('correct');
      } else if (selectedAnswer === optIdx) {
        optCard.classList.add('incorrect');
      }
    }

    optCard.innerHTML = `
      <div class="option-key">${letters[optIdx]}</div>
      <div class="option-text">${optText}</div>
    `;

    optCard.addEventListener('click', () => {
      if (!isSubmitted) {
        selectOption(optIdx);
      }
    });

    optCard.addEventListener('keydown', (e) => {
      if ((e.key === ' ' || e.key === 'Enter') && !isSubmitted) {
        e.preventDefault();
        selectOption(optIdx);
      }
    });

    optionsStack.appendChild(optCard);
  });

  // Feedback Box
  const feedbackBox = document.getElementById('feedback-box');
  const submitBtn = document.getElementById('btn-submit-answer');
  const clearBtn = document.getElementById('btn-clear-answer');

  if (isSubmitted && selectedAnswer !== undefined) {
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    feedbackBox.className = `feedback-box ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackBox.style.display = 'block';

    const statusIcon = isCorrect ? '✅' : '❌';
    const statusText = isCorrect ? 'Correct Answer!' : 'Incorrect Answer';

    feedbackBox.innerHTML = `
      <div class="feedback-status">
        <span>${statusIcon}</span>
        <span>${statusText}</span>
        <span style="font-weight: 500; font-size: 0.85rem; margin-left: auto;">Correct: <strong>Option ${letters[currentQ.correctAnswer]}</strong></span>
      </div>
      <div class="feedback-explanation">
        <strong>Why?</strong> ${currentQ.explanation}
      </div>
      <div class="feedback-actions">
        <button class="btn btn-secondary btn-sm" onclick="openConceptModal('${currentQ.id}')">
          🔍 Inspect Concept & Exam Notes
        </button>
      </div>
    `;

    submitBtn.style.display = 'none';
    clearBtn.style.display = 'none';
  } else {
    feedbackBox.style.display = 'none';
    submitBtn.style.display = 'inline-flex';
    clearBtn.style.display = 'inline-flex';
    submitBtn.disabled = selectedAnswer === undefined;
  }

  // Navigation Buttons
  document.getElementById('btn-prev-q').disabled = test.currentIndex === 0;
  const isLast = test.currentIndex === test.questions.length - 1;
  const nextBtn = document.getElementById('btn-next-q');
  nextBtn.innerHTML = isLast ? 'Finish Test 🏁' : 'Next Question ➡️';

  // Mark for review button
  const markBtn = document.getElementById('btn-mark-review');
  const isMarked = !!STATE.progress.marked[qId];
  markBtn.innerHTML = isMarked ? '★ Marked' : '☆ Mark for Review';
  markBtn.className = `btn btn-sm ${isMarked ? 'btn-primary' : 'btn-secondary'}`;

  // Render Palette
  renderPalette();
}

function selectOption(optionIndex) {
  const test = STATE.currentTest;
  if (!test) return;

  const currentQ = test.questions[test.currentIndex];
  const qId = currentQ.id;

  if (test.submitted[qId]) return;

  test.answers[qId] = optionIndex;

  // In Practice mode, auto-submit immediately so user gets feedback without extra click
  if (test.mode === 'practice') {
    submitAnswer();
  } else {
    renderExamUI();
  }
}

function clearAnswer() {
  const test = STATE.currentTest;
  if (!test) return;

  const currentQ = test.questions[test.currentIndex];
  const qId = currentQ.id;

  if (test.submitted[qId]) return;

  delete test.answers[qId];
  renderExamUI();
}

function submitAnswer() {
  const test = STATE.currentTest;
  if (!test) return;

  const currentQ = test.questions[test.currentIndex];
  const qId = currentQ.id;
  const selectedIdx = test.answers[qId];

  if (selectedIdx === undefined) {
    showToast('Please select an option before submitting.');
    return;
  }

  test.submitted[qId] = true;
  const isCorrect = selectedIdx === currentQ.correctAnswer;

  // Save to persistent progress
  STATE.progress.attempts[qId] = {
    selectedIndex: selectedIdx,
    isCorrect: isCorrect,
    timestamp: Date.now()
  };
  saveProgress();

  renderExamUI();
}

function nextQuestion() {
  const test = STATE.currentTest;
  if (!test) return;

  const isLast = test.currentIndex === test.questions.length - 1;
  if (isLast) {
    finishTest();
  } else {
    test.currentIndex++;
    renderExamUI();
  }
}

function prevQuestion() {
  const test = STATE.currentTest;
  if (!test || test.currentIndex === 0) return;
  test.currentIndex--;
  renderExamUI();
}

function jumpToQuestion(index) {
  const test = STATE.currentTest;
  if (!test || index < 0 || index >= test.questions.length) return;
  test.currentIndex = index;
  renderExamUI();
}

function toggleMarkForReview() {
  const test = STATE.currentTest;
  if (!test) return;

  const currentQ = test.questions[test.currentIndex];
  const qId = currentQ.id;

  if (STATE.progress.marked[qId]) {
    delete STATE.progress.marked[qId];
    showToast('Unmarked question.');
  } else {
    STATE.progress.marked[qId] = true;
    showToast('Question marked for review.');
  }
  saveProgress();
  renderExamUI();
}

// --------------------------------------------------------------------------
// 3. QUESTION PALETTE
// --------------------------------------------------------------------------
function renderPalette() {
  const paletteGrid = document.getElementById('palette-grid');
  if (!paletteGrid || !STATE.currentTest) return;

  paletteGrid.innerHTML = '';
  const test = STATE.currentTest;

  test.questions.forEach((q, idx) => {
    const qId = q.id;
    const btn = document.createElement('button');
    btn.className = 'palette-btn';
    btn.textContent = idx + 1;
    btn.title = `Question ${idx + 1}: ${q.question.slice(0, 40)}...`;

    if (idx === test.currentIndex) {
      btn.classList.add('current');
    }

    const isMarked = !!STATE.progress.marked[qId];
    if (isMarked) {
      btn.classList.add('marked');
    }

    const selectedIdx = test.answers[qId];
    const isSubmitted = test.submitted[qId] || (test.mode === 'practice' && selectedIdx !== undefined);

    if (isSubmitted && selectedIdx !== undefined) {
      if (selectedIdx === q.correctAnswer) {
        btn.classList.add('correct');
      } else {
        btn.classList.add('incorrect');
      }
    } else if (selectedIdx !== undefined) {
      btn.classList.add('answered');
    } else {
      btn.classList.add('unanswered');
    }

    btn.addEventListener('click', () => {
      jumpToQuestion(idx);
      if (window.innerWidth <= 1024) {
        document.querySelector('.exam-sidebar')?.classList.remove('mobile-visible');
      }
    });
    paletteGrid.appendChild(btn);
  });
}

function toggleMobilePalette() {
  const sidebar = document.querySelector('.exam-sidebar');
  if (sidebar) {
    sidebar.classList.toggle('mobile-visible');
  }
}

// --------------------------------------------------------------------------
// 4. TEST COMPLETION & RESULTS
// --------------------------------------------------------------------------
function finishTest(autoSubmit = false) {
  const test = STATE.currentTest;
  if (!test) return;

  const total = test.questions.length;
  let answeredCount = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  test.questions.forEach(q => {
    const selectedIdx = test.answers[q.id];
    if (selectedIdx !== undefined) {
      answeredCount++;
      const isCorrect = selectedIdx === q.correctAnswer;
      if (isCorrect) correctCount++;
      else incorrectCount++;

      // Make sure it is saved
      STATE.progress.attempts[q.id] = {
        selectedIndex: selectedIdx,
        isCorrect: isCorrect,
        timestamp: Date.now()
      };
    } else {
      unansweredCount++;
    }
  });

  saveProgress();

  if (!autoSubmit && unansweredCount > 0) {
    if (!confirm(`You have ${unansweredCount} unanswered questions out of ${total}. Do you really want to finish and submit the examination?`)) {
      return;
    }
  }

  // Clear timer
  if (test.timer) {
    clearInterval(test.timer);
    test.timer = null;
  }
  test.isSubmitted = true;

  renderResults(test, total, correctCount, incorrectCount, unansweredCount);
}

function renderResults(test, total, correct, incorrect, unanswered) {
  switchView('results');

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const timeTakenSec = test.totalTimeSeconds - test.timeLeftSeconds;
  const mins = Math.floor(timeTakenSec / 60);
  const secs = timeTakenSec % 60;
  const timeStr = `${mins}m ${secs}s`;

  document.getElementById('res-test-title').textContent = test.title;
  document.getElementById('res-score-number').textContent = `${correct}/${total}`;
  document.getElementById('res-score-pct').textContent = `${accuracy}% Score`;

  document.getElementById('res-correct').textContent = correct;
  document.getElementById('res-incorrect').textContent = incorrect;
  document.getElementById('res-unanswered').textContent = unanswered;
  document.getElementById('res-time').textContent = STATE.timerEnabled ? timeStr : 'Timer Disabled';

  const celebrationEl = document.getElementById('res-celebration');
  const messageEl = document.getElementById('res-message');

  if (accuracy >= 80) {
    celebrationEl.textContent = '🎉 🏆';
    messageEl.textContent = 'Outstanding Performance! You have a solid grasp of these data annotation concepts for tomorrow\'s exam.';
  } else if (accuracy >= 60) {
    celebrationEl.textContent = '👍 ✨';
    messageEl.textContent = 'Good Job! You passed the baseline, but reviewing your incorrect answers will help secure higher marks.';
  } else {
    celebrationEl.textContent = '📚 💪';
    messageEl.textContent = 'Needs Review. Focus on the concept explanations and memory revision sheets before retaking the test.';
  }

  // Configure review mistakes button
  const reviewMistakesBtn = document.getElementById('res-btn-review-mistakes');
  if (reviewMistakesBtn) {
    reviewMistakesBtn.disabled = incorrect === 0;
    reviewMistakesBtn.onclick = () => reviewCurrentTestMistakes();
  }
}

// --------------------------------------------------------------------------
// 5. REVIEW INCORRECT ANSWERS
// --------------------------------------------------------------------------
function reviewAllMistakes() {
  const incorrectQuestions = QUESTIONS_DATA.filter(q => {
    const att = STATE.progress.attempts[q.id];
    return att && att.selectedIndex !== undefined && !att.isCorrect;
  });

  if (incorrectQuestions.length === 0) {
    showToast('Great job! You have no incorrect answers to review.');
    return;
  }

  renderMistakesView('All Incorrect Answers Across Question Bank', incorrectQuestions);
}

function reviewChapterMistakes(chapterNumber) {
  const incorrectQuestions = QUESTIONS_DATA.filter(q => {
    if (q.chapterNumber !== chapterNumber) return false;
    const att = STATE.progress.attempts[q.id];
    return att && att.selectedIndex !== undefined && !att.isCorrect;
  });

  if (incorrectQuestions.length === 0) {
    showToast(`No mistakes found in Chapter ${chapterNumber}!`);
    return;
  }

  renderMistakesView(`Chapter ${chapterNumber} Mistake Review`, incorrectQuestions);
}

function reviewCurrentTestMistakes() {
  const test = STATE.currentTest;
  if (!test) return;

  const mistakes = test.questions.filter(q => {
    const sel = test.answers[q.id];
    return sel !== undefined && sel !== q.correctAnswer;
  });

  if (mistakes.length === 0) {
    showToast('No mistakes to review in this test!');
    return;
  }

  renderMistakesView(`Mistakes in ${test.title}`, mistakes);
}

function renderMistakesView(title, questions) {
  switchView('review');

  document.getElementById('review-title').textContent = title;
  document.getElementById('review-subtitle').textContent = `${questions.length} questions need reinforcement.`;

  const listEl = document.getElementById('review-list');
  listEl.innerHTML = '';

  const letters = ['A', 'B', 'C', 'D'];

  questions.forEach((q, idx) => {
    const att = STATE.progress.attempts[q.id] || {};
    const selectedIdx = att.selectedIndex;

    const card = document.createElement('div');
    card.className = 'review-item-card';

    card.innerHTML = `
      <div class="review-item-header">
        <span class="question-num-tag">Q${idx + 1} (${q.id.toUpperCase()}) — Ch ${q.chapterNumber}</span>
        <span class="question-topic-tag">${q.topic}</span>
      </div>
      <div class="question-text" style="font-size: 1.05rem;">${q.question}</div>

      <div class="review-answers-box">
        <div class="review-ans-row">
          <span style="font-weight: 700; color: var(--error);">Your Answer:</span>
          <span>${selectedIdx !== undefined ? `${letters[selectedIdx]}. ${q.options[selectedIdx]}` : 'Unanswered'}</span>
        </div>
        <div class="review-ans-row">
          <span style="font-weight: 700; color: var(--success);">Correct Answer:</span>
          <span>${letters[q.correctAnswer]}. ${q.options[q.correctAnswer]}</span>
        </div>
      </div>

      <div class="feedback-explanation" style="margin-bottom: 1rem;">
        <strong>Explanation:</strong> ${q.explanation}
      </div>

      <div class="feedback-actions">
        <button class="btn btn-secondary btn-sm" onclick="openConceptModal('${q.id}')">
          🔍 Inspect Concept
        </button>
        <button class="btn btn-primary btn-sm" onclick="retestSingleQuestion('${q.id}')">
          🔁 Try Again
        </button>
        <button class="btn btn-ghost btn-sm" onclick="markAsMastered('${q.id}')">
          ✓ Mark as Mastered
        </button>
      </div>
    `;

    listEl.appendChild(card);
  });
}

function markAsMastered(questionId) {
  if (STATE.progress.attempts[questionId]) {
    STATE.progress.attempts[questionId].isCorrect = true;
    saveProgress();
    showToast('Marked question as Mastered!');
    reviewAllMistakes();
  }
}

function retestSingleQuestion(questionId) {
  const q = QUESTIONS_DATA.find(item => item.id === questionId);
  if (!q) return;

  const custom = [q];
  custom.title = `Retest: ${q.id.toUpperCase()}`;
  startTest('custom', 'practice', custom);
}

function retestAllMistakes() {
  const incorrectQuestions = QUESTIONS_DATA.filter(q => {
    const att = STATE.progress.attempts[q.id];
    return att && att.selectedIndex !== undefined && !att.isCorrect;
  });

  if (incorrectQuestions.length === 0) {
    showToast('No incorrect questions to retest!');
    return;
  }

  const testList = [...incorrectQuestions];
  testList.title = `Mistakes Retest (${testList.length} Questions)`;
  startTest('custom', 'exam', testList);
}

// --------------------------------------------------------------------------
// 6. SEARCH & FILTER / QUESTION BROWSER
// --------------------------------------------------------------------------
function openQuestionBrowser() {
  switchView('browser');
  filterQuestions();
}

function filterQuestions() {
  const query = (document.getElementById('browser-search-input')?.value || '').toLowerCase().trim();
  const filterType = document.getElementById('browser-filter-select')?.value || 'all';
  const chapterFilter = document.getElementById('browser-chapter-select')?.value || 'all';

  const listEl = document.getElementById('browser-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  const filtered = QUESTIONS_DATA.filter(q => {
    // Chapter filter
    if (chapterFilter !== 'all' && q.chapterNumber !== parseInt(chapterFilter)) {
      return false;
    }

    // Status filter
    const att = STATE.progress.attempts[q.id];
    const isMarked = !!STATE.progress.marked[q.id];

    if (filterType === 'correct' && (!att || !att.isCorrect)) return false;
    if (filterType === 'incorrect' && (!att || att.isCorrect || att.selectedIndex === undefined)) return false;
    if (filterType === 'unanswered' && att && att.selectedIndex !== undefined) return false;
    if (filterType === 'marked' && !isMarked) return false;

    // Search query
    if (query) {
      const matchText = (q.question + ' ' + q.topic + ' ' + q.explanation + ' ' + q.concept + ' ' + q.options.join(' ')).toLowerCase();
      if (!matchText.includes(query)) return false;
    }

    return true;
  });

  document.getElementById('browser-results-count').textContent = `Showing ${filtered.length} of ${QUESTIONS_DATA.length} MCQs`;

  const letters = ['A', 'B', 'C', 'D'];

  filtered.forEach((q, idx) => {
    const att = STATE.progress.attempts[q.id];
    const card = document.createElement('div');
    card.className = 'review-item-card';

    card.innerHTML = `
      <div class="review-item-header">
        <span class="question-num-tag">${q.id.toUpperCase()} — Chapter ${q.chapterNumber}</span>
        <span class="question-topic-tag">${q.topic}</span>
        ${att ? (att.isCorrect ? '<span class="text-success font-mono">✓ Passed</span>' : '<span class="text-error font-mono">✗ Incorrect</span>') : '<span class="text-warning font-mono">○ Not attempted</span>'}
      </div>
      <div class="question-text" style="font-size: 1.05rem;">${q.question}</div>
      <div class="options-stack" style="margin-bottom: 0.75rem;">
        ${q.options.map((opt, oIdx) => `
          <div style="font-size: 0.88rem; padding: 0.35rem 0.5rem; ${oIdx === q.correctAnswer ? 'color: var(--success); font-weight: 700;' : 'color: var(--text-secondary);'}">
            ${letters[oIdx]}. ${opt} ${oIdx === q.correctAnswer ? ' (Correct Answer)' : ''}
          </div>
        `).join('')}
      </div>
      <div class="feedback-actions">
        <button class="btn btn-secondary btn-sm" onclick="openConceptModal('${q.id}')">
          🔍 View Concept & Notes
        </button>
        <button class="btn btn-primary btn-sm" onclick="retestSingleQuestion('${q.id}')">
          🎯 Practice This Question
        </button>
      </div>
    `;

    listEl.appendChild(card);
  });
}

// --------------------------------------------------------------------------
// 7. CONCEPT INSPECTION MODAL
// --------------------------------------------------------------------------
function openConceptModal(questionId) {
  const q = QUESTIONS_DATA.find(item => item.id === questionId);
  if (!q) return;

  const modalOverlay = document.getElementById('concept-modal-overlay');
  const titleEl = document.getElementById('concept-modal-title');
  const bodyEl = document.getElementById('concept-modal-body');

  titleEl.innerHTML = `🔍 Concept Inspection: <span style="color: var(--primary);">${q.topic}</span>`;

  const letters = ['A', 'B', 'C', 'D'];

  bodyEl.innerHTML = `
    <div style="margin-bottom: 1rem;">
      <span class="question-num-tag">Chapter ${q.chapterNumber}: ${q.chapterTitle}</span>
    </div>

    <h4>Question Context</h4>
    <p style="font-weight: 600; margin-bottom: 0.5rem;">${q.question}</p>
    <p style="color: var(--success); font-weight: 700; margin-bottom: 1rem;">
      ✓ Correct Option: ${letters[q.correctAnswer]}. ${q.options[q.correctAnswer]}
    </p>

    <h4>Why this answer is correct (Source prep.md)</h4>
    <p>${q.explanation}</p>

    <h4>Detailed Concept & Syllabus Notes</h4>
    <div class="concept-box-quote">${q.concept || q.explanation}</div>

    <h4>Key Exam Tip</h4>
    <p style="font-size: 0.88rem; color: var(--text-secondary);">
      In NIELIT exams, recognize key terminology associations (e.g., WAV = uncompressed, MFCC = audio feature extraction, VAD = voice presence detection, DER = diarization error rate, LiDAR = 3D point cloud).
    </p>
  `;

  modalOverlay.classList.add('active');
}

function closeConceptModal() {
  document.getElementById('concept-modal-overlay')?.classList.remove('active');
}

// --------------------------------------------------------------------------
// 8. MEMORY REVISION SHEETS MODAL
// --------------------------------------------------------------------------
function openMemorySheet(chapterNumber) {
  const sheet = MEMORY_SHEETS[chapterNumber];
  if (!sheet) {
    showToast(`No revision sheet available for Chapter ${chapterNumber}.`);
    return;
  }

  const modalOverlay = document.getElementById('concept-modal-overlay');
  const titleEl = document.getElementById('concept-modal-title');
  const bodyEl = document.getElementById('concept-modal-body');

  titleEl.innerHTML = `📝 ${sheet.title}`;

  bodyEl.innerHTML = `
    <div class="concept-box-quote" style="white-space: pre-wrap; font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.6;">
${sheet.content}
    </div>
  `;

  modalOverlay.classList.add('active');
}

function openSyllabusNotes(chapterNumber) {
  const meta = CHAPTERS_METADATA.find(c => c.chapterNumber === chapterNumber);
  if (!meta) return;

  const modalOverlay = document.getElementById('concept-modal-overlay');
  const titleEl = document.getElementById('concept-modal-title');
  const bodyEl = document.getElementById('concept-modal-body');

  titleEl.innerHTML = `📖 Syllabus & Theory Notes: Chapter ${chapterNumber}`;

  bodyEl.innerHTML = `
    <h4>${meta.title}</h4>
    <p><strong>Priority Level:</strong> ${meta.priority} Priority</p>
    <p><strong>Overview:</strong> ${meta.description}</p>
    
    <div class="concept-box-quote" style="margin-top: 1rem;">
<strong>Exam Study Tip from prep.md:</strong>
Remember: Chapter 1 concentrates on Python fundamentals (variables, mutable vs immutable lists, slicing, loops, Pandas head/csv).
Chapter 2 focuses on AI/ML/DL hierarchy, Supervised vs Unsupervised learning, preprocessing (normalization, missing values, variance), and AI ethics/GDPR.
Chapters 3, 4, and 5 cover core Annotation, NER schemas (BILOU), bounding boxes, polygons, and tracking.
Full conceptual question banks are embedded in Chapters 6, 7, and 8 (40 MCQs each, 120 total).
    </div>
  `;

  modalOverlay.classList.add('active');
}

// --------------------------------------------------------------------------
// 9. MOCK TEST CONFIG MODAL
// --------------------------------------------------------------------------
function openMockConfigModal() {
  document.getElementById('mock-modal-overlay')?.classList.add('active');
}

function closeMockModal() {
  document.getElementById('mock-modal-overlay')?.classList.remove('active');
}

function executeMockStart() {
  const selectedRadio = document.querySelector('input[name="mock-option"]:checked')?.value || 'full-all';
  closeMockModal();

  if (selectedRadio === 'full-all') {
    startTest('mock', 'exam');
  } else if (selectedRadio === 'full-random') {
    startTest('mock-random', 'exam');
  } else if (selectedRadio === 'quick-20') {
    const shuffled = [...QUESTIONS_DATA].sort(() => Math.random() - 0.5).slice(0, 20);
    shuffled.title = 'Quick 20-Question Rapid Test';
    startTest('custom', 'exam', shuffled);
  } else if (selectedRadio === 'ch3') {
    startTest(3, 'exam');
  } else if (selectedRadio === 'ch4') {
    startTest(4, 'exam');
  } else if (selectedRadio === 'ch5') {
    startTest(5, 'exam');
  } else if (selectedRadio === 'ch6') {
    startTest(6, 'exam');
  } else if (selectedRadio === 'ch7') {
    startTest(7, 'exam');
  } else if (selectedRadio === 'ch8') {
    startTest(8, 'exam');
  } else if (selectedRadio === 'incorrect-only') {
    retestAllMistakes();
  }
}

// --------------------------------------------------------------------------
// 10. TOAST NOTIFICATION UTILITY
// --------------------------------------------------------------------------
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>ℹ️</span><span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
