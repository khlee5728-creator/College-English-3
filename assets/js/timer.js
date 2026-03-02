/* ============================================
   TIMER.JS - Break Timer & Class Timer
   Practical English 3
   ============================================ */

class BreakTimer {
  constructor() {
    this.timers = document.querySelectorAll('.timer-display');
    this.initAll();
  }

  initAll() {
    this.timers.forEach(timerEl => {
      const minutes = parseInt(timerEl.dataset.minutes) || 10;
      const btn = timerEl.closest('.slide')?.querySelector('.btn-timer');

      let totalSeconds = minutes * 60;
      let interval = null;
      let running = false;

      const update = () => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

        if (totalSeconds <= 60) {
          timerEl.classList.add('warning');
        }

        if (totalSeconds <= 0) {
          clearInterval(interval);
          running = false;
          timerEl.textContent = "Time's up!";
          timerEl.classList.add('warning');
          if (btn) btn.textContent = 'Reset';
        }
      };

      // Initialize display
      update();

      // Click timer to start/pause
      timerEl.addEventListener('click', () => {
        if (totalSeconds <= 0) {
          // Reset
          totalSeconds = minutes * 60;
          timerEl.classList.remove('warning');
          update();
          return;
        }

        if (running) {
          clearInterval(interval);
          running = false;
        } else {
          interval = setInterval(() => {
            totalSeconds--;
            update();
          }, 1000);
          running = true;
        }
      });

      // Button control (if exists)
      if (btn) {
        btn.addEventListener('click', () => {
          if (totalSeconds <= 0 || !running) {
            totalSeconds = minutes * 60;
            timerEl.classList.remove('warning');
            update();
            if (!running) {
              interval = setInterval(() => {
                totalSeconds--;
                update();
              }, 1000);
              running = true;
            }
          } else {
            clearInterval(interval);
            running = false;
          }
        });
      }
    });
  }
}

// Global class timer (top right)
class ClassTimer {
  constructor() {
    this.el = document.getElementById('class-timer');
    if (!this.el) return;

    this.seconds = 0;
    this.running = false;
    this.interval = null;

    this.el.addEventListener('click', () => this.toggle());
    this.update();
  }

  toggle() {
    if (this.running) {
      clearInterval(this.interval);
      this.running = false;
    } else {
      this.interval = setInterval(() => {
        this.seconds++;
        this.update();
      }, 1000);
      this.running = true;
    }
  }

  update() {
    const h = Math.floor(this.seconds / 3600);
    const m = Math.floor((this.seconds % 3600) / 60);
    const s = this.seconds % 60;
    if (h > 0) {
      this.el.textContent = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else {
      this.el.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new BreakTimer();
  new ClassTimer();
});
