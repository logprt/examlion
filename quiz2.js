const rawText = document.querySelector(".quiz").innerText.trim();
const lines = rawText.split("\n").filter(l => l.includes("|"));
const questions = lines.map(line => {
  const parts = line.split("|").map(x => x.trim());
  return {
    question: parts[0],
    options: parts.slice(1, 5),
    correct: parseInt(parts[5]),
    importance: parseInt(parts[6])
  };
});

// Show Loading Screen
document.getElementById("quiz-root").innerHTML = `
  <div class="uk-container uk-text-center" style="padding: 100px 0;">
    <h3><span uk-spinner="ratio: 2"></span><br>Loading Quiz...</h3>
  </div>
`;

// Wait 3 seconds before starting quiz
setTimeout(() => {
  // Inject layout
  document.getElementById("quiz-root").innerHTML = `
    <div class="uk-container">
      <div class="quiz-wrapper uk-child-width-expand uk-grid-small" uk-grid>
        <div class="uk-width-3-4@m uk-first-column quiz-box-1">
          <div class="quiz-container uk-card uk-card-default uk-card-body">
            <div class="timer-box hide-after">
              <div class="tbl"><i>Q</i> <b id="currentQuestionText">Q1 of ${questions.length}</b></div> 
              <div class="tbr">⏰ <span id="countdownTimer">00:00</span></div>
            </div>
            <div class="progress-container hide-after"><div class="progress-bar" id="progressBar"></div></div>
            <div id="quizPanel"></div>
          </div>
        </div>
        <div class="uk-width-1-4@m uk-grid-margin uk-first-column quiz-box-2">
          <div class="uk-card uk-card-default uk-card-body nav-box-card">
            <div class="nav-box" id="navBox"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Finish Modal -->
    <div id="finish-modal" uk-modal>
      <div class="uk-modal-dialog uk-modal-body">
        <h2 class="uk-modal-title">Finish Quiz?</h2>
        <p>Are you sure you want to submit the test?</p>
        <p class="uk-text-right">
          <button class="uk-button uk-button-default uk-modal-close" type="button">No</button>
          <button class="uk-button uk-button-primary" onclick="confirmFinish()">Yes, Submit</button>
        </p>
      </div>
    </div>

    <!-- Time's Up Modal -->
    <div id="timesup-modal" uk-modal>
      <div class="uk-modal-dialog uk-modal-body">
        <h2 class="uk-modal-title">⏰ Time's Up!</h2>
        <p>Submitting your test ...</p>
      </div>
    </div>
  `;

  // Define quiz variables AFTER layout is injected
  let currentIndex = 0;
  let userAnswers = Array(questions.length).fill(null);
  const container = document.getElementById("quizPanel");
  const navBox = document.getElementById("navBox");

  function renderNavButtons() {
    navBox.innerHTML = "";
    questions.forEach((_, i) => {
      const btn = document.createElement("button");
      btn.textContent = i + 1;
      btn.onclick = () => goToQuestion(i);
      btn.id = "nav-btn-" + i;
      navBox.appendChild(btn);
    });
    highlightActiveNav();
  }

  function highlightActiveNav() {
    questions.forEach((_, i) => {
      const btn = document.getElementById("nav-btn-" + i);
      if (btn) btn.classList.remove("active");
    });
    const activeBtn = document.getElementById("nav-btn-" + currentIndex);
    if (activeBtn) activeBtn.classList.add("active");
  }

  function renderQuestion() {
    const q = questions[currentIndex];
    const qText = document.getElementById("currentQuestionText");
    if (qText) qText.textContent = `${currentIndex + 1} of ${questions.length}`;
    const savedAnswer = userAnswers[currentIndex];

    container.innerHTML = `
      <div class="question"><div>${q.question}</div></div>
      <div class="options">
        ${q.options.map((opt, i) => {
          const selected = savedAnswer === (i + 1);
          const correct = q.correct === (i + 1);
          const disabled = savedAnswer !== null ? "disabled" : "";
          const className = savedAnswer
            ? (selected ? (correct ? "correct" : "wrong") : (correct ? "correct" : ""))
            : "";
          return `<button class="${className}" ${disabled} onclick="checkAnswer(this, ${i + 1})">${opt}</button>`;
        }).join("")}
      </div>
      <div class="nav-btn-bar">
        ${currentIndex > 0 ? `<button class="prev-btn" onclick="prevQuestion()">Previous</button>` : ``}
        ${currentIndex < questions.length - 1 ? `<button class="next-btn" onclick="nextQuestion()">Next</button>` : ``}
        <button class="finish-btn" onclick="UIkit.modal('#finish-modal').show()">Finish</button>
      </div>
    `;
    highlightActiveNav();
  }

  function checkAnswer(button, selected) {
    const q = questions[currentIndex];
    const buttons = container.querySelectorAll(".options button");
    buttons.forEach(btn => btn.disabled = true);
    userAnswers[currentIndex] = selected;
    if (selected === q.correct) {
      button.classList.add("correct");
    } else {
      button.classList.add("wrong");
      buttons[q.correct - 1].classList.add("correct");
    }
  }

  function nextQuestion() {
    if (currentIndex + 1 < questions.length) {
      currentIndex++;
      renderQuestion();
    }
  }

  function prevQuestion() {
    if (currentIndex > 0) {
      currentIndex--;
      renderQuestion();
    }
  }

  function goToQuestion(index) {
    currentIndex = index;
    renderQuestion();
  }

  function finishQuiz() {
    clearInterval(timerInterval);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 10);

    document.querySelectorAll(".hide-after").forEach(el => el.style.display = "none");
    document.querySelector(".quiz-box-2").style.display = "none";
    document.querySelector(".quiz-box-1").style.width = "100%";

    container.innerHTML = `<div class="result-screen"><h2><b uk-spinner></b> Loading result ...</h2></div>`;

    setTimeout(() => {
      let total = questions.length;
      let correct = 0;
      let attempted = 0;

      userAnswers.forEach((ans, i) => {
        if (ans !== null) {
          attempted++;
          if (ans === questions[i].correct) correct++;
        }
      });

      container.innerHTML = `
        <div class="result-screen">
          <div class="rt">
            <h5><b>🏆</b> Your Scorecard ...</h5>
            <table class="uk-table rtt">
              <tr>
                <td>
                  <h6>${correct * marksPerQuestion + (attempted - correct) * negativeMarking} / ${total * marksPerQuestion}</h6>    
                </td>
                <td>
                  <p>Test Duration <b>${totalTime} Mins</b></p>
                  <p>Total Marks <b>${total * marksPerQuestion}</b></p>
                  <p>Your Marks <b>${correct * marksPerQuestion + (attempted - correct) * negativeMarking}</b></p>
                  <p>Total Questions <b>${total}</b></p>
                  <p>Marks Per Question <b>${marksPerQuestion}</b></p>
                  <p>Negative Marking <b>${negativeMarking}</b></p>
                  <p>Total Attempted <b>${attempted}</b></p>
                  <p>Not Attempted <b>${total - attempted}</b></p>
                  <p>Correct <b>${correct}</b></p>
                  <p>Incorrect <b>${attempted - correct}</b></p>
                </td>
              </tr>
            </table>
            <button onclick="location.reload()">✓ Restart Quiz</button>
          </div>
        </div>
      `;
    }, 1500);
  }

  function confirmFinish() {
    UIkit.modal('#finish-modal').hide();
    finishQuiz();
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  let timerSeconds = totalTime * 60;
  let timerInterval;

  function startTimer() {
    timerInterval = setInterval(() => {
      timerSeconds--;
      const timerBox = document.getElementById("countdownTimer");
      if (timerBox) timerBox.innerHTML = formatTime(timerSeconds);
      const progressBar = document.getElementById("progressBar");
      if (progressBar) {
        let percentage = (timerSeconds / (totalTime * 60)) * 100;
        progressBar.style.width = percentage + "%";
      }

      if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        UIkit.modal("#timesup-modal").show();
        setTimeout(() => {
          UIkit.modal("#timesup-modal").hide();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          finishQuiz();
        }, 2000);
      }
    }, 1000);
  }

  // Start quiz now
  renderNavButtons();
  renderQuestion();
  startTimer();

  // Expose globally
  window.checkAnswer = checkAnswer;
  window.nextQuestion = nextQuestion;
  window.prevQuestion = prevQuestion;
  window.finishQuiz = finishQuiz;
  window.confirmFinish = confirmFinish;

}, 3000);
