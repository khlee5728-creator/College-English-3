/* ============================================
   SLIDES.JS - Core Slide Navigation Engine
   Practical English 3
   ============================================ */

class SlidePresentation {
  constructor() {
    this.slides = Array.from(document.querySelectorAll('.slide'));
    this.currentIndex = 0;
    this.total = this.slides.length;
    this.isOverview = false;

    if (this.total === 0) return;

    this.init();
  }

  init() {
    // Restore from URL hash
    this.restoreFromHash();

    // Show initial slide
    this.showSlide(this.currentIndex);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Button navigation
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    if (btnPrev) btnPrev.addEventListener('click', () => this.prev());
    if (btnNext) btnNext.addEventListener('click', () => this.next());

    // Fullscreen button
    const btnFs = document.getElementById('btn-fullscreen');
    if (btnFs) btnFs.addEventListener('click', () => this.toggleFullscreen());

    // Click on slides in overview mode
    this.slides.forEach((slide, i) => {
      slide.addEventListener('click', () => {
        if (this.isOverview) {
          this.isOverview = false;
          document.getElementById('presentation').classList.remove('overview-mode');
          this.showSlide(i);
        }
      });
    });

    // Touch/swipe support
    this.initTouch();

    // Show keyboard hint briefly
    this.showKeyboardHint();
  }

  handleKeydown(e) {
    // Don't navigate when typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      if (e.key === 'Escape') e.target.blur();
      return;
    }

    switch (e.key) {
      case 'ArrowRight':
      case ' ':
      case 'PageDown':
        e.preventDefault();
        this.next();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        this.prev();
        break;
      case 'Home':
        e.preventDefault();
        this.goTo(0);
        break;
      case 'End':
        e.preventDefault();
        this.goTo(this.total - 1);
        break;
      case 'Escape':
        e.preventDefault();
        this.toggleOverview();
        break;
      case 'f':
      case 'F':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          this.toggleFullscreen();
        }
        break;
      case 't':
      case 'T':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          this.toggleTimer();
        }
        break;
      case 'p':
      case 'P':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          window.print();
        }
        break;
    }
  }

  showSlide(index) {
    if (index < 0 || index >= this.total) return;

    this.slides.forEach(s => s.classList.remove('active'));
    this.slides[index].classList.add('active');
    this.currentIndex = index;

    // Update counter
    const counter = document.getElementById('slide-counter');
    if (counter) counter.textContent = `${index + 1} / ${this.total}`;

    // Update progress bar
    const fill = document.getElementById('progress-fill');
    if (fill) {
      const pct = ((index + 1) / this.total) * 100;
      fill.style.width = pct + '%';
    }

    // Update URL hash
    history.replaceState(null, '', `#slide-${index + 1}`);

    // Update button states
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    if (btnPrev) btnPrev.disabled = (index === 0);
    if (btnNext) btnNext.disabled = (index === this.total - 1);

    // Scroll to top of slide
    window.scrollTo(0, 0);
  }

  next() {
    if (!this.isOverview && this.currentIndex < this.total - 1) {
      this.showSlide(this.currentIndex + 1);
    }
  }

  prev() {
    if (!this.isOverview && this.currentIndex > 0) {
      this.showSlide(this.currentIndex - 1);
    }
  }

  goTo(index) {
    if (index >= 0 && index < this.total) {
      this.showSlide(index);
    }
  }

  restoreFromHash() {
    const match = window.location.hash.match(/slide-(\d+)/);
    if (match) {
      const idx = parseInt(match[1]) - 1;
      this.currentIndex = Math.max(0, Math.min(idx, this.total - 1));
    }
  }

  toggleOverview() {
    this.isOverview = !this.isOverview;
    const pres = document.getElementById('presentation');
    if (pres) {
      pres.classList.toggle('overview-mode', this.isOverview);
    }
    if (!this.isOverview) {
      this.showSlide(this.currentIndex);
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  toggleTimer() {
    const timer = document.getElementById('class-timer');
    if (timer) timer.classList.toggle('hidden');
  }

  initTouch() {
    let startX = 0;
    let startY = 0;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;

      // Only swipe if horizontal movement is greater than vertical
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) this.next();
        else this.prev();
      }
    }, { passive: true });
  }

  showKeyboardHint() {
    const hint = document.getElementById('keyboard-hint');
    if (!hint) return;
    hint.classList.add('visible');
    setTimeout(() => hint.classList.remove('visible'), 4000);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.presentation = new SlidePresentation();
});
