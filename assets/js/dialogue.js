/* ============================================
   DIALOGUE.JS — 말풍선 + TTS 대화 애니메이션
   Practical English 3

   사용법: 대화문을 담은 컨테이너에 data-dialogue 를 붙입니다.
     <div class="panel" data-dialogue>
       <p><strong>Isabel:</strong> Oh, I'm really sorry.</p>
       <p><strong>Nico:</strong> I'm fine.</p>
     </div>
   - ▶ 재생: 말풍선이 한 줄씩 나타나며 화자별 목소리(Web Speech API)로 읽음
   - 역할 선택: 그 화자의 대사에서 멈춤 → 학생이 말한 뒤 ▶ 로 계속
   - 말풍선 클릭: 그 줄만 다시 듣기 / 속도 0.8× · 1× / 전체 보기
   - 슬라이드를 넘기거나 탭을 숨기면 자동 정지
   - 인쇄: 원래 텍스트(.dlg-print)만 출력
   ============================================ */
(function () {
  'use strict';

  var boxes = document.querySelectorAll('[data-dialogue]');
  if (!boxes.length) return;

  var TTS = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  var voices = [];
  function loadVoices() {
    if (!TTS) return;
    var all = window.speechSynthesis.getVoices() || [];
    voices = all.filter(function (v) { return /^en[-_]/i.test(v.lang) || v.lang === 'en'; });
    // 자연스러운 음성(온라인/Neural) 우선
    voices.sort(function (a, b) {
      var sa = /natural|online|neural|premium|enhanced/i.test(a.name) ? 0 : 1;
      var sb = /natural|online|neural|premium|enhanced/i.test(b.name) ? 0 : 1;
      return sa - sb;
    });
  }
  loadVoices();
  if (TTS && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  var FEMALE = /female|woman|zira|aria|jenny|samantha|karen|moira|tessa|victoria|susan|hazel|libby|sonia|emma|ava|allison|natasha|linda|heather|catherine|fiona|kate|olivia|michelle|sara|clara|ana\b|amy|joanna|salli|kimberly|ivy|nicole|raveena|emily|abbi|bella|maisie|mia|ashley|cora|elizabeth|jane|nancy|monica|molly|aria/i;
  var MALE = /\bmale|\bman\b|david|guy|mark|daniel|george|ryan|thomas|james|richard|alex\b|fred|\btom\b|william|christopher|eric|brian|andrew|liam|connor|oliver|matthew|joey|justin|brandon|roger|steffan|christopher|aaron|arthur|ethan|noah|jason|kevin|ollie|neil|alfie|prabhat|william/i;

  // 화자 순서(A, B, C)에 따라 목소리·피치 배정
  function voiceFor(idx) {
    var v = null, pitch = 1;
    if (voices.length) {
      var fem = voices.filter(function (x) { return FEMALE.test(x.name) && !/\bmale\b/i.test(x.name.replace(/female/i, '')); });
      var mal = voices.filter(function (x) { return MALE.test(x.name) && !FEMALE.test(x.name); });
      var pool = [fem[0] || voices[0], mal[0] || voices[1] || voices[0], voices[2] || mal[1] || fem[1] || voices[0]];
      v = pool[idx % 3] || voices[0];
    }
    // 같은 목소리를 나눠 쓰면 피치로 구분
    if (idx === 0) pitch = 1.05; else if (idx === 1) pitch = 0.9; else pitch = 1.0;
    return { voice: v, pitch: pitch };
  }

  function words(t) { return (t.match(/\S+/g) || []).length; }

  function initDialogue(box) {
    var lines = [], speakers = [];
    Array.prototype.forEach.call(box.querySelectorAll('p'), function (p) {
      var strong = p.querySelector('strong');
      if (!strong || !/:\s*$/.test(strong.textContent)) return;
      var name = strong.textContent.replace(/:\s*$/, '').trim();
      var clone = p.cloneNode(true);
      clone.removeChild(clone.querySelector('strong'));
      var html = clone.innerHTML.replace(/^(\s|&nbsp;)+/, '');
      var text = clone.textContent.replace(/\s+/g, ' ').trim();
      if (speakers.indexOf(name) < 0) speakers.push(name);
      lines.push({ name: name, html: html, text: text, idx: speakers.indexOf(name) });
    });
    if (lines.length < 2) return;

    // 원본은 인쇄용으로 보존
    var printCopy = document.createElement('div');
    printCopy.className = 'dlg-print';
    while (box.firstChild) printCopy.appendChild(box.firstChild);
    box.classList.add('dlg');

    // ---- 컨트롤 ----
    var ctrl = document.createElement('div');
    ctrl.className = 'dlg-controls';
    ctrl.innerHTML =
      '<button type="button" class="dlg-btn dlg-play">&#9654; 재생</button>' +
      '<button type="button" class="dlg-btn dlg-restart" title="처음부터">&#8635;</button>' +
      '<button type="button" class="dlg-btn dlg-speed" title="속도">1.0&times;</button>' +
      '<label class="dlg-role">역할 <select><option value="">듣기만</option>' +
        speakers.map(function (s) { return '<option value="' + s.replace(/"/g, '&quot;') + '">' + s + ' 역할</option>'; }).join('') +
      '</select></label>' +
      '<button type="button" class="dlg-btn dlg-showall">전체 보기</button>' +
      '<span class="dlg-status"></span>';
    box.appendChild(ctrl);

    // ---- 말풍선 ----
    var chat = document.createElement('div');
    chat.className = 'dlg-chat';
    var sides = ['a', 'b', 'c'];
    lines.forEach(function (ln, i) {
      var b = document.createElement('div');
      b.className = 'dlg-bubble dlg-side-' + sides[ln.idx % 3];
      b.setAttribute('data-i', i);
      b.innerHTML =
        '<span class="dlg-avatar" aria-hidden="true">' + ln.name.charAt(0) + '</span>' +
        '<div class="dlg-body" title="클릭: 이 줄 다시 듣기">' +
          '<span class="dlg-name">' + ln.name + '</span>' +
          '<div class="dlg-text">' + ln.html + '</div>' +
        '</div>';
      chat.appendChild(b);
    });
    box.appendChild(chat);
    box.appendChild(printCopy);

    var btnPlay = ctrl.querySelector('.dlg-play');
    var btnRestart = ctrl.querySelector('.dlg-restart');
    var btnSpeed = ctrl.querySelector('.dlg-speed');
    var btnAll = ctrl.querySelector('.dlg-showall');
    var selRole = ctrl.querySelector('select');
    var status = ctrl.querySelector('.dlg-status');
    var bubbles = chat.querySelectorAll('.dlg-bubble');

    var cur = 0, playing = false, rate = 1, role = '', token = 0;

    function setStatus(t) { status.textContent = t || ''; }
    function setPlayBtn() { btnPlay.innerHTML = playing ? '&#10074;&#10074; 일시정지' : (cur > 0 && cur < lines.length ? '&#9654; 계속' : '&#9654; 재생'); }
    function clearMarks() {
      Array.prototype.forEach.call(bubbles, function (b) { b.classList.remove('is-current', 'is-you'); });
    }
    function reveal(i) {
      var b = bubbles[i];
      if (!b.classList.contains('is-shown')) b.classList.add('is-shown');
      try { b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
      return b;
    }
    function cancelSpeech() { if (TTS) { try { window.speechSynthesis.cancel(); } catch (e) {} } }

    // 한 줄 읽기 (끝나면 done). TTS 가 없거나 onend 가 안 오면 타이머로 진행.
    function speak(ln, done) {
      var finished = false, my = ++token;
      function fin() { if (finished || my !== token) return; finished = true; done(); }
      var ms = Math.max(1500, words(ln.text) * 450 / rate + 1200);
      if (!TTS) { setTimeout(fin, ms); return; }
      cancelSpeech();
      var u = new SpeechSynthesisUtterance(ln.text);
      var vf = voiceFor(ln.idx);
      if (vf.voice) u.voice = vf.voice;
      u.lang = 'en-US'; u.rate = rate; u.pitch = vf.pitch;
      u.onend = fin; u.onerror = fin;
      setTimeout(fin, ms + 4000);            // 안전장치
      try { window.speechSynthesis.speak(u); } catch (e) { setTimeout(fin, ms); }
    }

    function step() {
      if (!playing) return;
      if (cur >= lines.length) {
        playing = false; clearMarks(); setPlayBtn();
        setStatus('끝 · ↺ 로 다시');
        return;
      }
      var ln = lines[cur];
      clearMarks();
      var b = reveal(cur);
      if (role && ln.name === role) {
        // 학생 차례: 소리 없이 멈춤
        b.classList.add('is-you');
        playing = false; cur += 1; setPlayBtn();
        setStatus('🎤 ' + role + ' 차례 — 말한 뒤 ▶ 계속');
        return;
      }
      b.classList.add('is-current');
      setStatus((cur + 1) + ' / ' + lines.length);
      speak(ln, function () {
        if (!playing) return;
        cur += 1;
        setTimeout(step, 350);
      });
    }

    function play() { if (playing) return; if (cur >= lines.length) restart(); playing = true; setPlayBtn(); step(); }
    function pause() { playing = false; token++; cancelSpeech(); setPlayBtn(); if (cur < lines.length) setStatus('일시정지'); }
    function restart() {
      pause(); cur = 0; clearMarks();
      Array.prototype.forEach.call(bubbles, function (b) { b.classList.remove('is-shown'); });
      setStatus(''); setPlayBtn();
    }

    btnPlay.addEventListener('click', function () { playing ? pause() : play(); });
    btnRestart.addEventListener('click', restart);
    btnSpeed.addEventListener('click', function () {
      rate = (rate === 1) ? 0.8 : 1; btnSpeed.innerHTML = rate.toFixed(1) + '&times;';
    });
    selRole.addEventListener('change', function () { role = selRole.value; if (playing) pause(); });
    btnAll.addEventListener('click', function () {
      pause(); clearMarks();
      Array.prototype.forEach.call(bubbles, function (b) { b.classList.add('is-shown'); });
      cur = lines.length; setPlayBtn(); setStatus('');
    });
    // 말풍선 클릭: 그 줄만 다시 듣기
    chat.addEventListener('click', function (e) {
      var b = e.target.closest('.dlg-bubble');
      if (!b || !b.classList.contains('is-shown')) return;
      var i = parseInt(b.getAttribute('data-i'), 10);
      var wasPlaying = playing; pause(); clearMarks(); b.classList.add('is-current');
      speak(lines[i], function () { b.classList.remove('is-current'); if (wasPlaying) { /* 수동 재생 후엔 대기 */ } });
    });
    // 위젯 안에서 Space 는 슬라이드 넘김이 아니라 버튼 동작
    box.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Spacebar') e.stopPropagation(); }, true);

    // 슬라이드를 떠나거나 탭을 숨기면 정지
    var slide = box.closest('.slide');
    if (slide && window.MutationObserver) {
      new MutationObserver(function () { if (!slide.classList.contains('active') && playing) pause(); })
        .observe(slide, { attributes: true, attributeFilter: ['class'] });
    }
    // 내비게이션 입력 자체에서도 정지 (키보드·버튼·오버뷰)
    var NAV_KEYS = { ArrowRight: 1, ArrowLeft: 1, PageDown: 1, PageUp: 1, Home: 1, End: 1, Escape: 1 };
    document.addEventListener('keydown', function (e) {
      if (playing && NAV_KEYS[e.key] && !box.contains(e.target)) pause();
    }, true);
    document.addEventListener('click', function (e) {
      if (playing && e.target.closest && e.target.closest('#slide-nav, #btn-prev, #btn-next, #btn-home')) pause();
    }, true);
    document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
    setPlayBtn();
  }

  Array.prototype.forEach.call(boxes, initDialogue);
})();
