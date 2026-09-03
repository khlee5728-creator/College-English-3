/* ============================================
   TRACKING.JS — 학습 활동 기록 (Supabase)
   Practical English 3

   설정: 아래 CONFIG 의 SUPABASE_URL / SUPABASE_ANON_KEY / SEMESTER 를 채우세요.
   비어 있으면 아무 동작도 하지 않습니다 (강의 페이지는 그대로 정상 작동).
   세팅 방법: supabase/README.md
   ============================================ */
(function () {
  'use strict';

  var CONFIG = {
    SUPABASE_URL: 'https://ctozlnhywicspifxdwsx.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0b3psbmh5d2ljc3BpZnhkd3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MDQ1NjAsImV4cCI6MjEwMzk4MDU2MH0.vOIvmN6_rsZIFL5roFlB1xqO88tRgkXVm5DJ_WWcXGM',
    SEMESTER: '2026-2'       // 학기 식별자 (대시보드에서 학기별 조회)
  };

  // ---- 사전 체크 ----
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) return;
  if (!window.supabase || !window.supabase.createClient) {
    console.warn('[tracking] Supabase SDK 가 로드되지 않았습니다.');
    return;
  }
  var weekMatch = location.pathname.match(/week(\d{1,2})/i);
  if (!weekMatch) return;                          // 강의 페이지가 아니면 종료
  var WEEK = parseInt(weekMatch[1], 10);

  var ITEM_SEL = '.fill-blank-item, .transform-item, .quiz-item, .reading-question-item';
  if (!document.querySelector(ITEM_SEL)) return;   // 연습 문제 없는 페이지면 종료

  // data-qid 누락 경고 — 새 문항 추가 시 고정 ID 부여를 잊지 않도록 (브라우저 콘솔 F12 에서 확인)
  var missingQid = Array.prototype.filter.call(document.querySelectorAll(ITEM_SEL), function (el) {
    return !(el.dataset && el.dataset.qid);
  });
  if (missingQid.length) {
    console.warn('[tracking] data-qid 없는 문항 ' + missingQid.length + '개 → 위치 기반 ID로 대체됨 ' +
      '(슬라이드를 삽입하면 ID가 바뀔 수 있음). 각 문항 태그에 data-qid="w' + pad2(WEEK) + '-qNN" 을 추가하세요.', missingQid);
  }

  var sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

  // ---- 로컬 상태 ----
  var LS_STUDENT = 'pe3_student_id';
  var LS_DEVICE  = 'pe3_device_id';
  var LS_ATTEMPT = 'pe3_attempts:' + CONFIG.SEMESTER;

  function getDeviceId() {
    var id = localStorage.getItem(LS_DEVICE);
    if (!id) {
      id = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'd-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(LS_DEVICE, id);
    }
    return id;
  }
  var deviceId  = getDeviceId();
  var studentId = (localStorage.getItem(LS_STUDENT) || '').trim();

  function loadAttempts() {
    try { return JSON.parse(localStorage.getItem(LS_ATTEMPT) || '{}'); } catch (e) { return {}; }
  }
  function bumpAttempt(qid) {
    var a = loadAttempts();
    a[qid] = (a[qid] || 0) + 1;
    localStorage.setItem(LS_ATTEMPT, JSON.stringify(a));
    return a[qid];
  }

  // ---- 문항 ID: data-qid (예: w05-q12 — 모든 문항에 부여됨, 슬라이드 위치와 무관) 우선
  //      없을 때만 위치 기반 w05-s11-q2 (주차-슬라이드-문항) 로 대체 ----
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function buildQuestionId(item) {
    if (item.dataset && item.dataset.qid) return item.dataset.qid;
    var slide  = item.closest('.slide');
    var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
    var sIdx   = slide ? slides.indexOf(slide) + 1 : 0;
    var inSlide = slide ? Array.prototype.slice.call(slide.querySelectorAll(ITEM_SEL)) : [];
    var qIdx   = inSlide.indexOf(item) + 1;
    return 'w' + pad2(WEEK) + '-s' + pad2(sIdx) + '-q' + qIdx;
  }
  function snippet(item) {
    var clone = item.cloneNode(true);
    clone.querySelectorAll('input, button, select, textarea, .feedback, .quiz-feedback, .answer-reveal')
         .forEach(function (el) { el.remove(); });
    var t = (clone.textContent || '').replace(/\s+/g, ' ').trim();
    return t.length > 80 ? t.slice(0, 77) + '…' : t;
  }

  // ---- 활동 전송 ----
  function record(detail) {
    if (!studentId || !detail || !detail.item) return;
    var item = detail.item;
    var qid  = buildQuestionId(item);
    var payload = {
      student_id:    studentId,
      device_id:     deviceId,
      semester:      CONFIG.SEMESTER,
      week:          WEEK,
      question_id:   qid,
      question_text: snippet(item),
      correct:       !!detail.correct,
      attempt_no:    bumpAttempt(qid),
      user_answer:   (detail.answer == null ? '' : String(detail.answer)).slice(0, 500)
    };
    sb.from('activities').insert(payload).then(function (res) {
      if (res.error) console.warn('[tracking] 저장 실패:', res.error.message);
      else flashBadge();
    });
  }
  document.addEventListener('answer-checked', function (e) { record(e.detail); });

  // ---- UI: 우상단 상태 배지 ----
  var badge = null;
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function renderBadge() {
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'pe3-track-badge';
      document.body.appendChild(badge);
    }
    if (studentId) {
      badge.innerHTML = '<span class="dot"></span>학번 <b>' + escapeHtml(studentId) +
        '</b> · 기록 중 <a href="#" data-act="change">변경</a>';
      badge.classList.remove('off');
    } else {
      badge.innerHTML = '<span class="dot"></span>학번 미입력 · 기록 안 됨 <a href="#" data-act="change">입력</a>';
      badge.classList.add('off');
    }
  }
  function flashBadge() {
    if (!badge) return;
    badge.classList.add('flash');
    setTimeout(function () { badge.classList.remove('flash'); }, 600);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('#pe3-track-badge a[data-act="change"]');
    if (a) { e.preventDefault(); openModal(); }
  });

  // ---- UI: 학번 입력 모달 ----
  var modal = null;
  function openModal() {
    if (modal) {
      modal.classList.add('open');
      modal.querySelector('input').value = studentId || '';
      setTimeout(function () { modal.querySelector('input').focus(); }, 50);
      return;
    }
    modal = document.createElement('div');
    modal.id = 'pe3-track-modal';
    modal.innerHTML =
      '<div class="box">' +
        '<h3>학번을 입력해 주세요</h3>' +
        '<p class="desc">연습 문제 풀이 활동(문항 · 정오 · 시각)이 학번과 함께 기록되어 ' +
        '<b>수업 참여 확인 및 강의 개선 자료</b>로 활용됩니다. 이름은 수집하지 않습니다.<br>' +
        '이 브라우저에 한 번만 저장되며, 우상단 배지에서 언제든 바꿀 수 있습니다.</p>' +
        '<input type="text" inputmode="numeric" autocomplete="off" placeholder="예: 20261234" maxlength="20">' +
        '<div class="err"></div>' +
        '<div class="btns">' +
          '<button type="button" class="skip">나중에</button>' +
          '<button type="button" class="ok">확인</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    var input = modal.querySelector('input');
    var err   = modal.querySelector('.err');
    input.value = studentId || '';

    function submit() {
      var v = input.value.trim();
      if (!/^[A-Za-z0-9-]{4,20}$/.test(v)) {
        err.textContent = '학번 형식을 확인해 주세요 (4~20자, 영문·숫자).';
        return;
      }
      studentId = v;
      localStorage.setItem(LS_STUDENT, v);
      err.textContent = '';
      modal.classList.remove('open');
      renderBadge();
    }
    modal.querySelector('.ok').addEventListener('click', submit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    modal.querySelector('.skip').addEventListener('click', function () {
      modal.classList.remove('open');
      renderBadge();
    });
    modal.classList.add('open');
    setTimeout(function () { input.focus(); }, 50);
  }

  // ---- 스타일 ----
  var style = document.createElement('style');
  style.textContent =
    '#pe3-track-badge{position:fixed;top:var(--space-lg,1rem);right:var(--space-lg,1rem);z-index:996;' +
      'background:rgba(255,255,255,.92);border:1px solid rgba(0,0,0,.08);border-radius:999px;' +
      'padding:4px 12px;font-size:.78rem;color:#374151;box-shadow:0 1px 4px rgba(0,0,0,.08);' +
      'backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);font-family:var(--font-ko,sans-serif);' +
      'display:flex;align-items:center;gap:6px;transition:box-shadow .2s;white-space:nowrap}' +
    '#pe3-track-badge .dot{width:8px;height:8px;border-radius:50%;background:#10b981;display:inline-block;flex-shrink:0}' +
    '#pe3-track-badge.off .dot{background:#f59e0b}' +
    '#pe3-track-badge.flash{box-shadow:0 0 0 4px rgba(16,185,129,.35)}' +
    '#pe3-track-badge a{color:#2a6496;text-decoration:none;margin-left:4px}' +
    '#pe3-track-badge a:hover{text-decoration:underline}' +
    '#pe3-track-modal{position:fixed;inset:0;z-index:1001;background:rgba(0,0,0,.45);display:none;' +
      'align-items:center;justify-content:center;padding:1rem}' +
    '#pe3-track-modal.open{display:flex}' +
    '#pe3-track-modal .box{background:#fff;border-radius:14px;padding:1.6rem 1.6rem 1.2rem;max-width:440px;width:100%;' +
      'box-shadow:0 20px 50px rgba(0,0,0,.25);font-family:var(--font-ko,sans-serif)}' +
    '#pe3-track-modal h3{margin:0 0 .6rem;font-size:1.15rem;color:#1a5276}' +
    '#pe3-track-modal .desc{margin:0 0 1rem;font-size:.88rem;line-height:1.6;color:#4b5563}' +
    '#pe3-track-modal input{width:100%;box-sizing:border-box;padding:.7rem .9rem;font-size:1.1rem;' +
      'border:2px solid #d1d5db;border-radius:8px;letter-spacing:.05em}' +
    '#pe3-track-modal input:focus{outline:none;border-color:#2a6496}' +
    '#pe3-track-modal .err{color:#dc2626;font-size:.8rem;min-height:1.2em;margin:.4rem 0 .6rem}' +
    '#pe3-track-modal .btns{display:flex;gap:.6rem;justify-content:flex-end}' +
    '#pe3-track-modal button{padding:.55rem 1.1rem;border-radius:8px;border:0;cursor:pointer;font-size:.9rem;font-family:inherit}' +
    '#pe3-track-modal .ok{background:#2a6496;color:#fff;font-weight:600}' +
    '#pe3-track-modal .skip{background:#f3f4f6;color:#6b7280}' +
    '@media print{#pe3-track-badge,#pe3-track-modal{display:none!important}}';
  document.head.appendChild(style);

  // ---- 초기화 ----
  renderBadge();
  if (!studentId) openModal();
})();
