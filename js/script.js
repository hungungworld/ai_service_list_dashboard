// AI Pick · 상황별 추천 / 곡선 캐러셀 / 필터·검색 / 같은 분야 비교
// 데이터는 js/services.js 의 services, tips 를 사용합니다.
(function () {
  'use strict';

  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const byId = new Map(services.map((s) => [s.id, s]));

  // ---------------------------------------------------------
  // 상황 목록
  // picks: 그 상황에 어울리는 서비스 번호 (앞에 있을수록 우선)
  // keys : 입력창 문장에서 이 상황을 알아채는 단어
  // ---------------------------------------------------------
  const SITUATIONS = [
    { id: 'research', emoji: '🔎', label: '과제·레포트 자료 조사', short: '자료 조사에 강함',
      picks: [8, 10, 11, 9, 13, 12, 26],
      keys: ['자료', '조사', '레포트', '리포트', '보고서', '과제', '검색', '출처', '리서치', '참고문헌', '선행연구', '논문'] },
    { id: 'fact', emoji: '✅', label: '팩트 체크·근거 찾기', short: '근거 확인에 좋음',
      picks: [8, 12, 10, 11],
      keys: ['팩트', '사실', '뉴스', '근거', '검증', '과학적', '맞는지', '진짜'] },
    { id: 'study', emoji: '📚', label: '시험 공부·강의 복습', short: '공부·복습용',
      picks: [9, 24, 23, 10],
      keys: ['시험', '공부', '복습', '강의', '요약', '수업', '교재', '암기', '퀴즈'] },
    { id: 'present', emoji: '📊', label: '발표 자료·PPT 만들기', short: '발표 자료 제작',
      picks: [31, 30, 15, 26, 24],
      keys: ['발표', 'ppt', '피피티', '슬라이드', '프레젠테이션', '피티'] },
    { id: 'image', emoji: '🎨', label: '이미지·로고·포스터', short: '이미지 제작',
      picks: [20, 21, 22, 18],
      keys: ['이미지', '그림', '로고', '포스터', '일러스트', '사진', '굿즈', '썸네일', '카드뉴스', '배너', '홍보물'] },
    { id: 'videoGen', emoji: '🎬', label: 'AI로 영상 만들기', short: 'AI 영상 생성',
      picks: [1, 2, 4, 3],
      keys: ['영상 만들', '영상을 만들', '영상 생성', '동영상 생성', '광고 영상', '클립', 'ai 영상', '홍보 영상'] },
    { id: 'videoEdit', emoji: '✂️', label: '영상 편집·자막', short: '영상 편집·자막',
      picks: [4, 3, 34],
      keys: ['편집', '자막', '컷', '유튜브', '숏폼', '쇼츠', '릴스', '브이로그', '영상'] },
    { id: 'web', emoji: '🖥️', label: '웹사이트·앱 화면 디자인', short: '화면 디자인',
      picks: [14, 15, 16, 19, 17, 18],
      keys: ['웹사이트', '홈페이지', '사이트', 'ui', 'ux', '화면', '디자인', '시안', '프로토타입', '포트폴리오', '랜딩'] },
    { id: 'code', emoji: '💻', label: '코딩·바이브 코딩', short: '코딩 도우미',
      picks: [29, 28, 16],
      keys: ['코딩', '코드', '개발', '프로그래밍', '앱 만들', '바이브', '버그', '풀스택', '프로그램'] },
    { id: 'automation', emoji: '🔁', label: '반복 업무 자동화', short: '업무 자동화',
      picks: [5, 6, 7],
      keys: ['자동화', '반복', '업무', '시트', '챗봇', '워크플로', '귀찮', '매일'] },
    { id: 'meeting', emoji: '🎙️', label: '회의록·녹음 정리', short: '회의 기록',
      picks: [23, 24, 25],
      keys: ['회의', '녹음', '회의록', '인터뷰', '받아적', '전사', '미팅', '기록', '녹취'] },
    { id: 'translate', emoji: '🌏', label: '번역·외국어', short: '번역',
      picks: [32, 33, 25],
      keys: ['번역', '영어', '외국어', '해외', '일본어', '중국어', '원서', '영문'] },
    { id: 'voice', emoji: '🗣️', label: '내레이션·더빙', short: 'AI 목소리',
      picks: [34, 4],
      keys: ['내레이션', '나레이션', '더빙', '목소리', '음성', 'tts', '오디오북', '성우'] },
    { id: 'dashboard', emoji: '📈', label: '대시보드·시각화', short: '시각화',
      picks: [27, 26, 30],
      keys: ['대시보드', '시각화', '차트', '그래프', '데이터'] },
  ];
  const SIT = Object.fromEntries(SITUATIONS.map((s) => [s.id, s]));

  // 상황 카드 색 (위쪽 밝은 색 → 아래쪽 진한 색)
  const SIT_COLORS = {
    research: ['#8fb8f0', '#3157a8'], fact: ['#9ee0c0', '#23805c'], study: ['#f7c873', '#b8661a'],
    present: ['#f5a97f', '#c94a2f'], image: ['#f39bc0', '#a8346c'], videoGen: ['#b6a2f2', '#5b3fb8'],
    videoEdit: ['#ff9f80', '#c73c27'], web: ['#8fd4e8', '#1f6f8f'], code: ['#8b95a3', '#262c35'],
    automation: ['#c3dd7a', '#4f7a18'], meeting: ['#e6b48a', '#87502d'], translate: ['#86c9b8', '#256760'],
    voice: ['#f2a0a0', '#a3364a'], dashboard: ['#a8b4f5', '#3644a8'],
  };

  // 입력 문장에서 조건까지 알아채는 단어
  const TOGGLE_KEYS = {
    free: ['무료', '공짜', '돈 없', '돈이 없', '결제 없이', '예산', '학생'],
    easy: ['처음', '초보', '입문', '쉬운', '쉽게', '잘 몰라', '몰라서', '모르'],
  };
  const CMP_MAX = 6; // 한 번에 비교할 수 있는 최대 개수 (분야별 최대 서비스 수)
  const TOGGLE_NAMES = { free: '무료만', easy: '초보 모드' };

  const state = {
    sits: new Set(),
    toggles: { free: false, easy: false },
    text: '',
    cat: '전체',
    query: '',
  };

  // ---------------------------------------------------------
  // 공통 도우미
  // ---------------------------------------------------------
  const baseName = (s) => s.name.replace(/\s*\(.*\)\s*/, '').trim();
  const priceClass = (t) => (t === '무료' ? 'free' : t === '유료' ? 'paid' : 'mixed');
  const priceBadge = (s) => `<span class="badge badge--${priceClass(s.priceType)}">${esc(s.priceType)}</span>`;
  const linkBtn = (s, cls = 'btn--accent') =>
    `<a class="btn ${cls}" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">바로가기 <span aria-hidden="true">↗</span><span class="sr-only">(새 탭에서 열림)</span></a>`;

  function passes(s) {
    if (state.toggles.free && s.priceType === '유료') return false;
    return true;
  }

  // ---------------------------------------------------------
  // 숫자 요약
  // ---------------------------------------------------------
  // 분야 순서: 자료·문서 → 이미지·영상·음성 → 화면·코딩·자동화 → 에이전트
  const CATEGORY_ORDER = [
    '리서치·검색', '회의록·기록', '시각화·PPT',
    '이미지 생성·편집', '동영상 생성·편집', '음성·번역',
    '웹·UI/UX 디자인', '바이브 코딩', '자동화',
    '범용 AI 에이전트',
  ];
  const catRank = (c) => (CATEGORY_ORDER.includes(c) ? CATEGORY_ORDER.indexOf(c) : CATEGORY_ORDER.length);
  // 목록에 없는 새 분야는 맨 뒤에 붙음
  const categories = [...new Set(services.map((s) => s.category))].sort((a, b) => catRank(a) - catRank(b));

  $('#badge-text').textContent = `AI 서비스 ${services.length}개 · ${SITUATIONS.length}가지 상황`;

  // ---------------------------------------------------------
  // 조건 토글
  // ---------------------------------------------------------
  const toggleBtns = [...document.querySelectorAll('[data-toggle]')];

  function syncToggles() {
    toggleBtns.forEach((b) => b.setAttribute('aria-pressed', String(state.toggles[b.dataset.toggle])));
  }

  toggleBtns.forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.toggle;
    state.toggles[k] = !state.toggles[k];
    syncToggles();
    renderRec();
    renderList();
  }));

  // ---------------------------------------------------------
  // 상황 카드: 곡선 캐러셀
  // 카드는 원통 안쪽에 붙은 것처럼 바깥쪽일수록 크게, 가운데를 향해 기울어짐.
  // 항상 저절로 천천히 흐르고, 마우스를 올리거나 키보드로 고르면 잠깐 멈춤.
  // ---------------------------------------------------------
  const arc = $('#arc');
  arc.innerHTML = SITUATIONS.map((s) => {
    const [c1, c2] = SIT_COLORS[s.id];
    return `<button type="button" class="sit-card" data-sit="${s.id}" aria-pressed="false" style="--c1:${c1};--c2:${c2}">
      <span class="sit-card__check" aria-hidden="true">✓</span>
      <span class="sit-card__emoji" aria-hidden="true">${s.emoji}</span>
      <span><span class="sit-card__label">${esc(s.label)}</span><span class="sit-card__count">추천 AI ${s.picks.length}개</span></span>
    </button>`;
  }).join('');
  const cards = [...arc.querySelectorAll('.sit-card')];
  const carousel = { offset: 0, target: null, hover: false, focus: false, drag: null, dragged: false, last: 0, visible: true };

  const spacing = () => cards[0].offsetWidth + 22;
  const total = () => spacing() * cards.length;

  function layoutArc() {
    const sp = spacing();
    const tot = sp * cards.length;
    const half = arc.clientWidth / 2 || 1;
    cards.forEach((c, i) => {
      let x = (((i * sp - carousel.offset) % tot) + tot) % tot;
      if (x > tot / 2) x -= tot;
      const d = Math.max(-1.5, Math.min(1.5, x / half));
      c.style.transform = `translateX(${x.toFixed(1)}px) translateZ(${(Math.abs(d) * 80).toFixed(1)}px) rotateY(${(-d * 26).toFixed(2)}deg)`;
      c.style.zIndex = String(Math.round(Math.abs(d) * 10));
    });
  }

  // 카드 i를 가운데로 (가장 가까운 방향으로)
  function centerCard(i) {
    const tot = total();
    const base = i * spacing();
    carousel.target = base + tot * Math.round((carousel.offset - base) / tot);
    if (reduceMotion.matches) { carousel.offset = carousel.target; carousel.target = null; layoutArc(); }
  }

  function tick(t) {
    const dt = Math.min(50, t - (carousel.last || t));
    carousel.last = t;
    if (carousel.visible) {
      if (carousel.target !== null) {
        carousel.offset += (carousel.target - carousel.offset) * 0.14;
        if (Math.abs(carousel.target - carousel.offset) < 0.5) { carousel.offset = carousel.target; carousel.target = null; }
      } else if (!carousel.hover && !carousel.focus && !carousel.drag) {
        carousel.offset += dt * 0.035;
      }
      layoutArc();
    }
    requestAnimationFrame(tick);
  }

  // 화면 밖이면 계산 쉬기
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { carousel.visible = en.isIntersecting; }).observe(arc);
  }

  arc.addEventListener('mouseenter', () => { carousel.hover = true; });
  arc.addEventListener('mouseleave', () => { carousel.hover = false; });
  arc.addEventListener('focusin', (e) => {
    carousel.focus = true;
    const i = cards.indexOf(e.target.closest('.sit-card'));
    if (i > -1) centerCard(i);
  });
  arc.addEventListener('focusout', (e) => {
    if (!arc.contains(e.relatedTarget)) carousel.focus = false;
  });

  // 끌어서 넘기기 (조금이라도 끌었으면 클릭으로 치지 않음)
  arc.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    carousel.drag = { x: e.clientX, offset: carousel.offset, id: e.pointerId };
    carousel.dragged = false;
    carousel.target = null;
  });
  arc.addEventListener('pointermove', (e) => {
    const d = carousel.drag;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!carousel.dragged && Math.abs(dx) > 6) {
      carousel.dragged = true;
      arc.classList.add('is-dragging');
      arc.setPointerCapture(d.id);
    }
    if (carousel.dragged) carousel.offset = d.offset - dx;
  });
  const endDrag = () => {
    carousel.drag = null;
    arc.classList.remove('is-dragging');
  };
  arc.addEventListener('pointerup', endDrag);
  arc.addEventListener('pointercancel', endDrag);
  arc.addEventListener('click', (e) => {
    if (carousel.dragged) { e.stopPropagation(); e.preventDefault(); carousel.dragged = false; }
  }, true);

  layoutArc();
  requestAnimationFrame(tick);
  window.addEventListener('resize', layoutArc);

  // ---------------------------------------------------------
  // 상황 입력 칸: 문장 입력 + 카드 선택을 한 곳에
  // 카드로 고른 상황(manual)과 문장에서 알아챈 상황(auto)이 모두 입력 칸 안에 태그로 담김
  // ---------------------------------------------------------
  const askInput = $('#ask-input');
  const tokenWrap = $('#ask-tokens');
  const clearBtn = $('#ask-clear');
  const pick = { manual: new Set(), auto: new Set(), dismissed: new Set() };

  // 카드로 고른 순서 → 문장에서 알아챈 순서
  const pickedIds = () => [...pick.manual, ...[...pick.auto].filter((id) => !pick.manual.has(id))];

  function readSituation(text) {
    const t = text.toLowerCase().replace(/\s+/g, ' ');
    const found = SITUATIONS.filter((s) => s.keys.some((k) => t.includes(k))).map((s) => s.id);
    // '영상'만 있으면 편집으로, '만들/생성'이 함께 있으면 생성까지
    if (found.includes('videoEdit') && /만들|생성/.test(t) && !found.includes('videoGen')) found.push('videoGen');
    const toggles = Object.keys(TOGGLE_KEYS).filter((k) => TOGGLE_KEYS[k].some((w) => t.includes(w)));
    return { found, toggles };
  }

  function syncChips() {
    const ids = pickedIds();
    state.sits = new Set(ids);
    cards.forEach((c) => c.setAttribute('aria-pressed', String(state.sits.has(c.dataset.sit))));
    tokenWrap.innerHTML = ids.map((id) => {
      const auto = !pick.manual.has(id);
      return `<li class="token${auto ? ' token--auto' : ''}">
        <span aria-hidden="true">${SIT[id].emoji}</span>${esc(SIT[id].label)}
        <button type="button" data-untoken="${id}" aria-label="${esc(SIT[id].label)} 빼기">×</button></li>`;
    }).join('');
    clearBtn.hidden = !ids.length && !askInput.value;
    askInput.placeholder = ids.length
      ? '더 적거나 아래 카드를 눌러 추가해요'
      : '예: 내일 발표인데 PPT가 하나도 없어요';
  }

  // 상황 하나 넣기/빼기 (카드·태그 공용)
  function toggleSituation(id) {
    if (state.sits.has(id)) {
      pick.manual.delete(id);
      if (pick.auto.has(id)) { pick.auto.delete(id); pick.dismissed.add(id); }
    } else {
      pick.manual.add(id);
      pick.dismissed.delete(id);
    }
    syncChips();
    renderRec();
  }

  arc.addEventListener('click', (e) => {
    const c = e.target.closest('[data-sit]');
    if (c) toggleSituation(c.dataset.sit);
  });

  tokenWrap.addEventListener('click', (e) => {
    const b = e.target.closest('[data-untoken]');
    if (!b) return;
    toggleSituation(b.dataset.untoken);
    askInput.focus();
  });

  // 적는 동안 바로 상황을 알아채서 태그로 보여 줌
  let typingTimer = null;
  askInput.addEventListener('input', () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      const text = askInput.value.trim();
      if (!text) pick.dismissed.clear();
      const before = pickedIds().join();
      pick.auto = new Set(readSituation(text).found.filter((id) => !pick.dismissed.has(id)));
      syncChips();
      if (pickedIds().join() !== before) renderRec();
    }, 200);
  });

  // 빈 칸에서 지우기 키를 누르면 마지막 태그 빼기
  askInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Backspace' || askInput.value || !state.sits.size) return;
    const ids = pickedIds();
    toggleSituation(ids[ids.length - 1]);
  });

  clearBtn.addEventListener('click', () => {
    pick.manual.clear();
    pick.auto.clear();
    pick.dismissed.clear();
    askInput.value = '';
    state.text = '';
    syncChips();
    renderRec();
    askInput.focus();
  });

  $('#ask-form').addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(typingTimer);
    const text = askInput.value.trim();
    if (!text && !pick.manual.size) { askInput.focus(); return; }

    const { found, toggles } = readSituation(text);
    pick.auto = new Set(found.filter((id) => !pick.dismissed.has(id)));
    state.text = text;
    toggles.forEach((k) => { state.toggles[k] = true; });
    syncChips();
    syncToggles();
    renderRec();
    renderList();

    const rec = $('#rec');
    rec.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    rec.focus({ preventScroll: true });
  });

  // ---------------------------------------------------------
  // 추천 점수 계산
  // ---------------------------------------------------------
  function textScore(s, text) {
    const words = text.toLowerCase().split(/[\s,.!?~·]+/).filter((w) => w.length >= 2);
    const hay = `${s.name} ${s.category} ${s.desc} ${s.use}`.toLowerCase();
    return Math.min(words.filter((w) => hay.includes(w)).length * 2, 6);
  }

  function recommend() {
    const scored = [];
    services.forEach((s) => {
      if (!passes(s)) return;
      let score = 0;
      const why = [];
      state.sits.forEach((id) => {
        const i = SIT[id].picks.indexOf(s.id);
        if (i > -1) { score += 12 - i * 1.5; why.push(SIT[id].short); }
      });
      // 문장에서 상황을 못 알아챘을 때만 단어 일치로 보충
      if (state.text && !state.sits.size) {
        const ts = textScore(s, state.text);
        if (ts && !why.length) why.push('적어 준 상황과 용도가 비슷함');
        score += ts;
      }
      if (score <= 0) return;

      if (state.toggles.easy) {
        if (s.level === '쉬움') { score += 4; why.push('초보도 쉬움'); }
        else if (s.level === '어려움') score -= 5;
      }
      if (s.priceType === '무료') why.push('무료');
      else if (s.priceType === '무료+유료') why.push('무료로 시작 가능');
      scored.push({ s, score, why });
    });

    scored.sort((a, b) => b.score - a.score);
    // 같은 서비스(Canva 등)가 분야별로 여러 번 들어 있으면 하나만
    const seen = new Set();
    return scored.filter(({ s }) => {
      const k = baseName(s);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function tipsFor(list) {
    const names = list.map(({ s }) => baseName(s));
    const cats = list.map(({ s }) => s.category);
    return tips
      .map((t) => ({
        t,
        hit: names.filter((n) => t.text.includes(n)).length * 2 + (cats.some((c) => c.startsWith(t.field)) ? 1 : 0),
      }))
      .filter((x) => x.hit > 0)
      .sort((a, b) => b.hit - a.hit)
      .slice(0, 3)
      .map((x) => x.t);
  }

  // ---------------------------------------------------------
  // 추천 결과 그리기
  // ---------------------------------------------------------
  function renderRec() {
    const body = $('#rec-body');
    const summary = $('#rec-summary');
    const onToggles = Object.keys(state.toggles).filter((k) => state.toggles[k]).map((k) => TOGGLE_NAMES[k]);

    if (!state.sits.size && !state.text) {
      summary.textContent = '상황을 고르면 여기에 딱 맞는 AI 3개를 골라 드려요.';
      body.innerHTML = `
        <div class="rec-empty">
          <p>위 입력 칸에 지금 상황을 적거나, 상황 카드를 눌러 담아 주세요.</p>
          <a class="btn btn--ink btn--sm" href="#ask-input">상황 입력하러 가기</a>
        </div>`;
      return;
    }

    const list = recommend();
    const sitText = [...state.sits].map((id) => `‘${SIT[id].label}’`).join(', ');
    const cond = onToggles.length ? ` · 조건: ${onToggles.join(', ')}` : '';

    if (!list.length) {
      summary.innerHTML = state.sits.size
        ? `<b>${esc(sitText)}</b>${esc(cond)}`
        : `“${esc(state.text)}”`;
      body.innerHTML = `
        <div class="rec-empty">
          <p>${state.sits.size
            ? '조건에 맞는 서비스가 없어요. 위 조건에서 <b>무료만</b>을 꺼 보세요.'
            : '이 문장에서는 상황을 잘 알아채지 못했어요. 위 상황 카드에서 가장 가까운 것을 눌러 담아 주세요.'}</p>
        </div>`;
      return;
    }

    summary.innerHTML = state.sits.size
      ? `<b>${esc(sitText)}</b> 상황에 맞춰 골랐어요${esc(cond)}`
      : `“${esc(state.text)}”에 맞춰 골랐어요${esc(cond)}`;

    const top = list.slice(0, 3);
    const more = list.slice(3, 9);
    const tips = tipsFor(top);

    body.innerHTML = `
      <ol class="rec-top">
        ${top.map(({ s, why }, i) => `
          <li class="pick">
            <span class="pick__rank" aria-label="${i + 1}위">0${i + 1}</span>
            <p class="pick__cat">${esc(s.category)}</p>
            <h3 class="pick__name">${esc(s.name)}</h3>
            <p class="pick__desc">${esc(s.desc)}</p>
            <p class="pick__use"><b>이럴 때:</b> ${esc(s.use)}</p>
            <ul class="tags" aria-label="추천 이유">${why.slice(0, 4).map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
            <div class="actions">
              <button type="button" class="btn btn--line btn--sm" data-detail="${s.id}">자세히 보기</button>
              ${linkBtn(s, 'btn--accent btn--sm')}
            </div>
          </li>`).join('')}
      </ol>
      ${more.length ? `
        <div class="rec-more">
          <h3>이것도 같이 보면 좋아요</h3>
          <div class="rec-more__list">${more.map(({ s }) =>
            `<button type="button" class="chip" data-detail="${s.id}">${esc(s.name)} <span class="badge badge--${priceClass(s.priceType)}">${esc(s.priceType)}</span></button>`).join('')}
          </div>
        </div>` : ''}
      ${tips.length ? `
        <aside class="tips" aria-label="사용 팁">
          <h3>알아두면 좋은 팁</h3>
          <ul>${tips.map((t) => `<li>${esc(t.text)}</li>`).join('')}</ul>
        </aside>` : ''}`;
  }

  // ---------------------------------------------------------
  // 전체 리스트: 분야 필터 + 검색
  // ---------------------------------------------------------
  const filterWrap = $('#filters');
  filterWrap.innerHTML = ['전체', ...categories].map((c) => {
    const n = c === '전체' ? services.length : services.filter((s) => s.category === c).length;
    return `<button type="button" class="chip" data-cat="${esc(c)}" aria-pressed="${c === '전체'}">${esc(c)} <small>${n}</small></button>`;
  }).join('');

  filterWrap.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    state.cat = b.dataset.cat;
    filterWrap.querySelectorAll('[data-cat]').forEach((x) =>
      x.setAttribute('aria-pressed', String(x.dataset.cat === state.cat)));
    renderList();
  });

  $('#search').addEventListener('input', (e) => {
    state.query = e.target.value.trim().toLowerCase();
    renderList();
  });

  function renderList() {
    const q = state.query;
    const list = services.filter((s) =>
      passes(s) &&
      (state.cat === '전체' || s.category === state.cat) &&
      (!q || `${s.name} ${s.category} ${s.desc} ${s.use}`.toLowerCase().includes(q)))
      .sort((a, b) => catRank(a.category) - catRank(b.category) || a.id - b.id);

    const onToggles = state.toggles.free ? [TOGGLE_NAMES.free] : [];
    $('#list-count').textContent =
      `${services.length}개 중 ${list.length}개 표시` + (onToggles.length ? ` (조건: ${onToggles.join(', ')})` : '');

    // 분야 하나를 골랐으면 '이 분야 한눈에 비교' 버튼 보이기
    const sameCat = services.filter((s) => s.category === state.cat);
    const catBtn = $('#btn-compare-cat');
    catBtn.hidden = state.cat === '전체' || sameCat.length < 2;
    catBtn.textContent = `이 분야 ${Math.min(sameCat.length, CMP_MAX)}개 한눈에 비교`;

    $('#grid').innerHTML = list.length ? list.map((s) => `
      <article class="svc">
        <div class="svc__top"><span class="svc__cat">${esc(s.category)}</span>${cmpBtn(s)}</div>
        <h3 class="svc__name">${esc(s.name)}</h3>
        <p class="svc__desc">${esc(s.desc)}</p>
        <p class="svc__meta">
          ${priceBadge(s)}
          <span>난이도 ${esc(s.level)}</span>
        </p>
        <div class="actions">
          <button type="button" class="btn btn--line" data-detail="${s.id}">자세히</button>
          ${linkBtn(s, 'btn--ink')}
        </div>
      </article>`).join('')
      : '<p class="empty">검색 결과가 없어요. 다른 단어로 찾아보거나 분야를 ‘전체’로 바꿔 보세요.</p>';
  }

  // ---------------------------------------------------------
  // 상세 팝업
  // ---------------------------------------------------------
  const dlg = $('#detail');
  const ul = (arr) => `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;

  function openDetail(id, kicker) {
    const s = byId.get(Number(id));
    if (!s) return;
    $('#detail-body').innerHTML = `
      <p class="m-kicker">${esc(kicker || s.category)}</p>
      <h2 class="m-title" id="detail-name">${esc(s.name)}</h2>
      <p class="m-desc">${esc(s.desc)}</p>
      <div class="m-badges">
        ${priceBadge(s)}
        <span class="badge badge--mixed">난이도 ${esc(s.level)}</span>
      </div>
      <section class="m-sec"><h3>추천 용도</h3><p>${esc(s.use)}</p></section>
      <section class="m-sec"><h3>요금</h3>${ul(s.price)}</section>
      ${s.pros.length ? `<section class="m-sec"><h3>장점</h3>${ul(s.pros)}</section>` : ''}
      ${s.cons.length ? `<section class="m-sec"><h3>아쉬운 점</h3>${ul(s.cons)}</section>` : ''}
      ${s.note ? `<section class="m-sec"><h3>참고</h3><p class="m-note">${esc(s.note)}</p></section>` : ''}
      <div class="actions">${linkBtn(s)}${cmpBtn(s, true)}<button type="button" class="btn btn--line" data-close>닫기</button></div>`;
    $('#detail-body').scrollTop = 0;
    if (!dlg.open) dlg.showModal();
  }

  document.addEventListener('click', (e) => {
    const d = e.target.closest('[data-detail]');
    if (d) openDetail(d.dataset.detail);
  });
  $('#detail-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
  });

  // ---------------------------------------------------------
  // 같은 분야 비교
  // 카드의 '비교 담기'로 2~6개를 모은 뒤, 표로 나란히 비교
  // ---------------------------------------------------------
  const cmp = { ids: [], pending: null };
  const tray = $('#cmp-tray');
  const cmpDlg = $('#compare');
  const LEVEL_RANK = { '쉬움': 0, '보통': 1, '어려움': 2 };
  const PRICE_RANK = { '무료': 0, '무료+유료': 1, '유료': 2 };

  function cmpBtn(s, big) {
    const on = cmp.ids.includes(s.id);
    return `<button type="button" class="${big ? 'btn btn--line' : 'cmp-toggle'}" data-compare="${s.id}" aria-pressed="${on}"
      aria-label="${esc(s.name)} 비교함에 ${on ? '담김 (누르면 빼기)' : '담기'}">${on ? '✓ 비교 담김' : '＋ 비교'}</button>`;
  }

  // 버튼을 새로 그리지 않고 상태만 바꿔서 키보드 포커스를 유지
  function syncCmpButtons() {
    document.querySelectorAll('[data-compare]').forEach((b) => {
      const s = byId.get(Number(b.dataset.compare));
      const on = cmp.ids.includes(s.id);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', `${s.name} 비교함에 ${on ? '담김 (누르면 빼기)' : '담기'}`);
      b.textContent = on ? '✓ 비교 담김' : '＋ 비교';
    });
  }

  function cmpCategory() {
    return cmp.ids.length ? byId.get(cmp.ids[0]).category : null;
  }

  function renderTray(message) {
    const cat = cmpCategory();
    document.body.classList.toggle('has-tray', cmp.ids.length > 0 || !!cmp.pending);
    tray.hidden = !cmp.ids.length && !cmp.pending;

    if (cmp.pending) {
      const p = byId.get(cmp.pending);
      tray.innerHTML = `
        <p class="tray__msg" role="status">비교는 같은 분야끼리만 할 수 있어요.
          <b>${esc(cat)}</b> 비교함을 비우고 <b>${esc(p.category)}</b>의 ${esc(p.name)}부터 새로 담을까요?</p>
        <div class="tray__btns">
          <button type="button" class="btn btn--accent btn--sm" data-tray="replace">새로 담기</button>
          <button type="button" class="btn btn--line btn--sm" data-tray="cancel">그대로 두기</button>
        </div>`;
      tray.querySelector('[data-tray="replace"]').focus();
      return;
    }
    if (!cmp.ids.length) { tray.innerHTML = ''; return; }

    const enough = cmp.ids.length >= 2;
    tray.innerHTML = `
      <div class="tray__info">
        <p class="tray__title"><b>${esc(cat)}</b> 비교함 ${cmp.ids.length}/${CMP_MAX}</p>
        <p class="tray__hint" role="status">${esc(message || (enough ? '준비됐어요! 비교하기를 눌러 보세요.' : '같은 분야에서 1개 이상 더 담아 주세요.'))}</p>
      </div>
      <ul class="tray__list">${cmp.ids.map((id) => {
        const s = byId.get(id);
        return `<li><span>${esc(s.name)}</span><button type="button" data-tray-remove="${id}" aria-label="${esc(s.name)} 비교함에서 빼기">×</button></li>`;
      }).join('')}</ul>
      <div class="tray__btns">
        <button type="button" class="btn btn--accent btn--sm" data-tray="open" ${enough ? '' : 'disabled'}>비교하기</button>
        <button type="button" class="btn btn--line btn--sm" data-tray="clear">비우기</button>
      </div>`;
  }

  function addToCompare(id) {
    const s = byId.get(id);
    if (cmp.ids.includes(id)) {
      cmp.ids = cmp.ids.filter((x) => x !== id);
      renderTray(`${s.name}을(를) 뺐어요.`);
    } else if (cmp.ids.length && cmpCategory() !== s.category) {
      cmp.pending = id;
      if (dlg.open) dlg.close(); // 팝업 뒤에 가려지지 않게
      renderTray();
    } else if (cmp.ids.length >= CMP_MAX) {
      renderTray(`한 번에 ${CMP_MAX}개까지 비교할 수 있어요.`);
    } else {
      cmp.ids.push(id);
      renderTray(`${s.name}을(를) 담았어요.`);
    }
    syncCmpButtons();
  }

  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-compare]');
    if (c) { addToCompare(Number(c.dataset.compare)); return; }

    const r = e.target.closest('[data-tray-remove]');
    if (r) { addToCompare(Number(r.dataset.trayRemove)); return; }

    const t = e.target.closest('[data-tray]');
    if (!t) return;
    const act = t.dataset.tray;
    if (act === 'replace') { cmp.ids = [cmp.pending]; cmp.pending = null; renderTray('새 분야로 담았어요.'); }
    if (act === 'cancel') { cmp.pending = null; renderTray(); }
    if (act === 'clear') { cmp.ids = []; renderTray(); }
    if (act === 'open') openCompare();
    syncCmpButtons();
  });

  $('#btn-compare-cat').addEventListener('click', () => {
    cmp.ids = services.filter((s) => s.category === state.cat).slice(0, CMP_MAX).map((s) => s.id);
    cmp.pending = null;
    renderTray();
    syncCmpButtons();
    openCompare();
  });

  // 가장 좋은 값을 가진 서비스 (모두 같으면 없음)
  function bestOf(list, rank) {
    const vals = list.map(rank);
    const min = Math.min(...vals);
    if (vals.every((v) => v === min)) return [];
    return list.filter((s, i) => vals[i] === min);
  }

  const names = (arr) => arr.map((s) => s.name).join(', ');

  // 요금 줄을 '무료로 되는 것'과 '유료 요금'으로 나누기
  const PRICE_HEADER = /^(무료\+유료|유료 전용|무료|유료 \(무료 플랜 미포함\))$/;
  const IS_FREE_LINE = /^무료|\(무료\)|basic 무료|: 무료(?!의)|매월 \d+분 무료|^클라우드/i;
  const IS_PAID_LINE = /[$€₩]|\d원|유료|상위|할인|결제|Pro|Plus|Team|Max|Ultra|Business|Enterprise|Organization/;

  function splitPrice(s) {
    const lines = s.price.filter((p) => !PRICE_HEADER.test(p));
    if (s.priceType === '무료') return { free: lines, paid: ['(조사 자료에 없음)'] };
    if (s.priceType === '유료') return { free: ['무료 플랜 없음'], paid: lines.filter((p) => !/무료 체험 불가/.test(p)) };
    const free = [];
    const paid = [];
    lines.forEach((p) => {
      if (/^무료\+유료/.test(p)) paid.push(p.replace(/^무료\+유료\s*/, '').replace(/^\((.*)\)$/, '$1'));
      else if (IS_FREE_LINE.test(p)) free.push(p);
      else if (IS_PAID_LINE.test(p)) paid.push(p);
      else free.push(p);
    });
    if (!free.length) free.push('무료 플랜 있음 (세부 내용은 공식 사이트 확인)');
    if (!paid.length) paid.push('(조사 자료에 없음)');
    return { free, paid };
  }

  function openCompare() {
    const list = cmp.ids.map((id) => byId.get(id));
    if (list.length < 2) return;
    const cat = list[0].category;

    const easiest = bestOf(list, (s) => LEVEL_RANK[s.level]);
    const freest = bestOf(list, (s) => PRICE_RANK[s.priceType]);
    const paidOnly = list.filter((s) => s.priceType === '유료');

    // 한눈에 결론
    const verdicts = [];
    if (easiest.length) verdicts.push(['처음 써 본다면', `${names(easiest)} (난이도 ${easiest[0].level})`]);
    if (freest.length) verdicts.push(['돈 들이지 않고 시작하려면', `${names(freest)} (${freest[0].priceType})`]);
    if (paidOnly.length) verdicts.push(['결제가 꼭 필요한 것', `${names(paidOnly)} — 무료 플랜이 없어요`]);
    if (!verdicts.length) verdicts.push(['기본 조건', '난이도와 요금 형태가 비슷해요. 아래 ‘이럴 때 고르세요’와 장단점으로 골라 보세요.']);

    // 같은 분야 사용 팁
    const catTips = tips.filter((t) =>
      list.some((s) => t.text.includes(baseName(s))) || cat.startsWith(t.field));

    // 표의 한 줄: 값이 모두 같으면 '모두 같음', 다르면 '차이 있음'
    const mark = (s, winners) => (winners.includes(s) ? ' <span class="best">★ 가장 유리</span>' : '');
    const row = (label, cell, { same, note } = {}) => `
      <tr>
        <th scope="row">${label}${same === undefined ? '' : same
          ? '<span class="row-tag">모두 같음</span>' : '<span class="row-tag row-tag--diff">차이 있음</span>'}${note ? `<small>${note}</small>` : ''}</th>
        ${list.map((s) => `<td>${cell(s)}</td>`).join('')}
      </tr>`;
    const allSame = (fn) => new Set(list.map(fn)).size === 1;
    const listOrDash = (arr) => (arr.length ? ul(arr) : '<p class="dim">—</p>');

    $('#compare-body').innerHTML = `
      <p class="m-kicker">${esc(cat)} · ${list.length}개 비교</p>
      <h2 class="m-title" id="compare-title">무엇이 다르고, 뭐가 더 좋을까?</h2>

      <section class="verdict" aria-label="한눈에 결론">
        <h3>한눈에 결론</h3>
        <dl>${verdicts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      </section>

      <div class="pick-cards">
        ${list.map((s) => `
          <article class="pick-card">
            <h3>${esc(s.name)}</h3>
            <p class="pick-card__use"><b>이럴 때 고르세요</b>${esc(s.use)}</p>
            ${s.pros[0] ? `<p class="pick-card__pro"><b>강점</b>${esc(s.pros[0])}</p>` : ''}
            ${s.cons[0] ? `<p class="pick-card__con"><b>주의</b>${esc(s.cons[0])}</p>` : ''}
          </article>`).join('')}
      </div>

      <div class="cmp-table-wrap" tabindex="0" role="region" aria-label="비교표 (옆으로 스크롤)">
        <table class="cmp-table" style="--cols:${list.length}">
          <thead>
            <tr>
              <td></td>
              ${list.map((s) => `
                <th scope="col">
                  <span class="cmp-name">${esc(s.name)}</span>
                  ${linkBtn(s)}
                </th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${row('한 줄 소개', (s) => esc(s.desc))}
            ${row('요금 형태', (s) => priceBadge(s) + mark(s, freest), { same: allSame((s) => s.priceType) })}
            ${row('난이도', (s) => `<b>${esc(s.level)}</b>` + mark(s, easiest), { same: allSame((s) => s.level) })}
            ${row('무료로 되는 것', (s) => listOrDash(splitPrice(s).free))}
            ${row('유료 요금', (s) => listOrDash(splitPrice(s).paid), { note: '부가세·환율에 따라 달라요' })}
            ${row('장점', (s) => listOrDash(s.pros))}
            ${row('아쉬운 점', (s) => listOrDash(s.cons))}
          </tbody>
        </table>
      </div>

      ${catTips.length ? `
        <aside class="tips" aria-label="사용 팁">
          <h3>알아두면 좋은 팁</h3>
          <ul>${catTips.map((t) => `<li>${esc(t.text)}</li>`).join('')}</ul>
        </aside>` : ''}

      <div class="actions"><button type="button" class="btn btn--line" data-close>닫기</button></div>`;

    $('#compare-body').scrollTop = 0;
    if (dlg.open) dlg.close();
    if (!cmpDlg.open) cmpDlg.showModal();
  }

  $('#compare-close').addEventListener('click', () => cmpDlg.close());
  cmpDlg.addEventListener('click', (e) => {
    if (e.target === cmpDlg || e.target.closest('[data-close]')) cmpDlg.close();
  });

  // ---------------------------------------------------------
  // 맨 위로
  // ---------------------------------------------------------
  $('#btn-top').addEventListener('click', (e) => {
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    $('#ask-input').focus({ preventScroll: true });
  });

  // ---------------------------------------------------------
  // 밤 모드: 저장된 선택이 없으면 시스템 설정을 따름
  // ---------------------------------------------------------
  const nightBtn = $('#btn-night');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  function setNight(on, save) {
    document.documentElement.dataset.theme = on ? 'dark' : 'light';
    nightBtn.setAttribute('aria-pressed', String(on));
    if (save) { try { localStorage.setItem('ai-pick-theme', on ? 'dark' : 'light'); } catch (err) { /* 저장 불가 환경 */ } }
  }
  nightBtn.addEventListener('click', () => setNight(nightBtn.getAttribute('aria-pressed') !== 'true', true));
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('ai-pick-theme'); } catch (err) { /* 무시 */ }
  setNight(savedTheme ? savedTheme === 'dark' : systemDark.matches, false);

  // ---------------------------------------------------------
  // 첫 화면
  // ---------------------------------------------------------
  syncToggles();
  syncChips();
  renderRec();
  renderList();
})();
