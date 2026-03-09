/* ============================================
   INTERACTIVE.JS - Quiz, Vocab, Activity Logic
   Practical English 3
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Sentence Analysis Legend (auto-inject) ----
  document.querySelectorAll('section.slide').forEach(section => {
    if (!section.querySelector('.sentence-analysis')) return;
    section.querySelectorAll('.analysis-legend').forEach(el => el.remove());
    const legend = document.createElement('div');
    legend.className = 'analysis-legend';
    legend.innerHTML = [
      ['s', 'Subject (주어)'],
      ['v', 'Verb (동사)'],
      ['o', 'Object (목적어)'],
      ['c', 'Complement (보어)'],
      ['m', 'Modifier (수식어)']
    ].map(([cls, label]) =>
      `<span><span class="dot dot-${cls}"></span> ${label}</span>`
    ).join('');
    section.appendChild(legend);
    // Add extra bottom padding so fixed legend doesn't cover content
    section.style.paddingBottom = 'calc(var(--space-3xl) + 50px)';
  });

  // ---- Vocabulary Card Flip ----
  document.querySelectorAll('.vocab-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });
  });

  // ---- Fill in the Blank ----
  document.querySelectorAll('.btn-check').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.fill-blank-item');
      if (!item) return;

      const input = item.querySelector('.fill-blank-input');
      const feedback = item.querySelector('.feedback');
      if (!input || !feedback) return;

      const answer = input.dataset.answer.toLowerCase().trim();
      const answers = answer.split('|'); // Support multiple correct answers with |
      const userAnswer = input.value.toLowerCase().trim();

      if (answers.includes(userAnswer)) {
        input.classList.remove('incorrect');
        input.classList.add('correct');
        feedback.textContent = 'Correct!';
        feedback.className = 'feedback correct';
      } else {
        input.classList.remove('correct');
        input.classList.add('incorrect');
        feedback.textContent = `Try again! (Answer: ${answers[0]})`;
        feedback.className = 'feedback incorrect';
      }
    });
  });

  // Allow Enter key to check answer
  document.querySelectorAll('.fill-blank-input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const btn = input.closest('.fill-blank-item').querySelector('.btn-check');
        if (btn) btn.click();
      }
    });
  });

  // ---- Multiple Choice Quiz ----
  document.querySelectorAll('.quiz-item').forEach(item => {
    const correctValue = item.dataset.correct;
    const options = item.querySelectorAll('.quiz-option');
    const feedback = item.querySelector('.quiz-feedback');

    options.forEach(option => {
      option.addEventListener('click', () => {
        // Prevent re-answering
        if (item.classList.contains('answered')) return;
        item.classList.add('answered');

        const value = option.dataset.value;

        options.forEach(opt => {
          opt.style.pointerEvents = 'none';
          if (opt.dataset.value === correctValue) {
            opt.classList.add('correct');
          }
        });

        if (value === correctValue) {
          option.classList.add('correct');
          if (feedback) {
            feedback.textContent = 'Correct!';
            feedback.style.color = '#27ae60';
          }
        } else {
          option.classList.add('incorrect');
          if (feedback) {
            feedback.textContent = 'Incorrect. The correct answer is highlighted.';
            feedback.style.color = '#e74c3c';
          }
        }
      });
    });
  });

  // ---- Reveal Answer Buttons ----
  document.querySelectorAll('.btn-reveal').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.nextElementSibling || btn.closest('.fill-blank-item')?.querySelector('.answer-reveal');
      if (target && target.classList.contains('answer-reveal')) {
        target.classList.toggle('visible');
        btn.textContent = target.classList.contains('visible') ? 'Hide Answer' : 'Show Answer';
      }
    });
  });

  // ---- Reset Buttons ----
  document.querySelectorAll('.btn-reset').forEach(btn => {
    btn.addEventListener('click', () => {
      const container = btn.closest('.slide');
      if (!container) return;

      // Reset fill-in-blank
      container.querySelectorAll('.fill-blank-input').forEach(input => {
        input.value = '';
        input.classList.remove('correct', 'incorrect');
      });
      container.querySelectorAll('.feedback').forEach(fb => {
        fb.textContent = '';
        fb.className = 'feedback';
      });

      // Reset quiz
      container.querySelectorAll('.quiz-item').forEach(item => {
        item.classList.remove('answered');
        item.querySelectorAll('.quiz-option').forEach(opt => {
          opt.classList.remove('correct', 'incorrect', 'selected');
          opt.style.pointerEvents = '';
        });
        const fb = item.querySelector('.quiz-feedback');
        if (fb) fb.textContent = '';
      });

      // Reset vocab cards
      container.querySelectorAll('.vocab-card').forEach(card => {
        card.classList.remove('flipped');
      });

      // Hide answers
      container.querySelectorAll('.answer-reveal').forEach(ar => {
        ar.classList.remove('visible');
      });
    });
  });

  // ---- Flip All Vocab Cards ----
  document.querySelectorAll('.btn-flip-all').forEach(btn => {
    btn.addEventListener('click', () => {
      const container = btn.closest('.slide');
      if (!container) return;
      const cards = container.querySelectorAll('.vocab-card');
      const allFlipped = Array.from(cards).every(c => c.classList.contains('flipped'));
      cards.forEach(card => {
        if (allFlipped) card.classList.remove('flipped');
        else card.classList.add('flipped');
      });
    });
  });

  // ---- True/False Questions ----
  document.querySelectorAll('.reading-question-item').forEach(item => {
    const correctValue = item.dataset.correct;
    const options = item.querySelectorAll('.tf-option');
    const feedback = item.querySelector('.quiz-feedback');

    options.forEach(option => {
      option.addEventListener('click', () => {
        if (item.classList.contains('answered')) return;
        item.classList.add('answered');

        const value = option.dataset.value;
        options.forEach(opt => {
          opt.style.pointerEvents = 'none';
          if (opt.dataset.value === correctValue) opt.classList.add('correct');
        });

        if (value === correctValue) {
          if (feedback) { feedback.textContent = 'Correct!'; feedback.style.color = '#27ae60'; }
        } else {
          option.classList.add('incorrect');
          if (feedback) { feedback.textContent = 'Incorrect.'; feedback.style.color = '#e74c3c'; }
        }
      });
    });
  });

  // ---- Sentence Transformation ----
  document.querySelectorAll('.transform-item .btn-check').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.transform-item');
      if (!item) return;
      const input = item.querySelector('.transform-input');
      const feedback = item.querySelector('.feedback');
      if (!input || !feedback) return;

      const answers = input.dataset.answer.toLowerCase().split('|').map(a => a.trim());
      const userAnswer = input.value.toLowerCase().trim();

      if (answers.includes(userAnswer)) {
        input.classList.remove('incorrect');
        input.classList.add('correct');
        feedback.textContent = 'Correct!';
        feedback.className = 'feedback correct';
      } else {
        input.classList.remove('correct');
        input.classList.add('incorrect');
        feedback.textContent = `Answer: ${answers[0]}`;
        feedback.className = 'feedback incorrect';
      }
    });
  });

  // Allow Enter key for transform inputs
  document.querySelectorAll('.transform-input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const btn = input.closest('.transform-item').querySelector('.btn-check');
        if (btn) btn.click();
      }
    });
  });

});
