(() => {
  const root = document.getElementById('attribute-flow-09');
  const svg = root.querySelector('.af-map');
  const detail = root.querySelector('[data-detail]');
  const status = root.querySelector('[data-status]');
  const count = root.querySelector('[data-count]');
  const playButton = root.querySelector('[data-action="play"]');
  const playLabel = root.querySelector('[data-play-label]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = {
    direct: [
      { name: 'Parent → N.i · rule at P', edges: ['pi'], i: 10, s: '?', status: 'Direct dependency' },
      { name: 'L.val + R.val → N.i · rule at P', edges: ['li', 'ri'], i: 10, s: '?', status: 'Sibling context' },
      { name: 'C₁.val + C₂.val → N.s · rule at N', edges: ['c1s', 'c2s'], i: '?', s: 10, status: 'Child results' },
      { name: 'N.i → N.s · N.s = N.i + 5', edges: ['is'], done: ['pi'], i: 10, s: 15, beforeI: 10, status: 'Same node: allowed' }
    ],
    proxy: [
      { name: 'Child → N.sₕ · helper defined at N', edges: ['c1s'], i: '?', s: 4, status: 'Child → inherited · 1 / 2', helper: 's' },
      { name: 'N.sₕ → N.i · rule defined at P', edges: ['si'], done: ['c1s'], i: 4, s: 4, beforeS: 4, status: 'Child → inherited · 2 / 2', helper: 's' },
      { name: 'Parent → N.iₕ · helper defined at P', edges: ['pi'], i: 10, s: '?', status: 'Parent → synthesized · 1 / 2', helper: 'i' },
      { name: 'N.iₕ → N.s · rule defined at N', edges: ['is'], done: ['pi'], i: 10, s: 10, beforeI: 10, status: 'Parent → synthesized · 2 / 2', helper: 'i' },
      { name: 'Sibling → N.iₕ · helper defined at P', edges: ['li'], i: 7, s: '?', status: 'Sibling → synthesized · 1 / 2', helper: 'i' },
      { name: 'N.iₕ → N.s · rule defined at N', edges: ['is'], done: ['li'], i: 7, s: 7, beforeI: 7, status: 'Sibling → synthesized · 2 / 2', helper: 'i' }
    ],
    cycle: [
      { name: 'N.i ← N.s · N.i waits for N.s', edges: ['si'], i: '?', s: '?', status: 'Unresolved dependency' },
      { name: 'N.i ← N.s and N.s ← N.i · no topological order', edges: ['is', 'si'], i: '?', s: '?', status: 'Cycle: no first value' }
    ]
  };
  let state = { mode: 'direct', step: 0, progress: 0, playing: false };
  let frameId = 0;
  let lastTime = 0;
  let dwell = 0;
  let width = 0;
  let activePaths = [];
  let tokenGroup = null;
  const questions = [
    {
      title: 'Legal rules and cycles',
      premise: 'P → L N R; N → C. L.v, R.v and C.v are independent synthesized inputs. At N, i is inherited; h and s are synthesized.',
      question: 'Which rule set is both locally legal and acyclic? Each “at” identifies the production carrying that rule.',
      options: [
        'At N: N.i = C.v; N.s = N.i.',
        'At N: N.h = C.v; at P: N.i = N.h + R.v; at N: N.s = N.i + C.v.',
        'At N: N.h = C.v; at P: N.i = N.s; at N: N.s = N.i + C.v.',
        'At P: N.i = L.v; at N: N.s = N.i + R.v.'
      ],
      correct: 1,
      hints: [
        'Check two separate conditions: which production defines N.i, and whether any prerequisite chain returns to its starting attribute.',
        'A synthesized helper can carry C.v to a rule at P. A rule at N still cannot read R.v directly.'
      ],
      explanation: 'B is legal: C.v → N.h → N.i → N.s, with independent R.v also feeding N.i. A defines an inherited attribute at the wrong production and reads a child directly. C has N.i ↔ N.s. D reads a sibling directly from N’s production.'
    },
    {
      title: 'Count valid evaluation orders',
      premise: 'P → L N R; N → C. All v inputs are already available. N.a, N.b and N.c are inherited; N.x and N.y are synthesized.',
      code: 'At N: N.x = C.v; N.y = N.a + N.b\nAt P: N.a = N.x + L.v; N.b = R.v; N.c = N.x + N.b',
      question: 'How many total orders of {N.x, N.a, N.b, N.c, N.y} evaluate each attribute exactly once after all its prerequisites?',
      options: ['6', '10', '12', '8'],
      correct: 3,
      hints: [
        'Ignore the inherited/synthesized labels while counting. Draw only dependencies between the five listed attributes.',
        'Only x and b can be first. Count the orders beginning with x separately from those beginning with b.'
      ],
      explanation: 'D: 8 orders. The edges are x → a, x → c, b → c, a → y, b → y. Starting with x permits 5 orders; starting with b permits 3. A fixed “all inherited first” schedule would miss the required x → a dependency.'
    },
    {
      title: 'Can helpers repair a cycle?',
      premise: 'P → L N R; N → C. N.i and N.hᵢ are inherited; N.s and N.hₛ are synthesized. No initial values are supplied.',
      code: 'At N: N.hₛ = N.i + 1; N.s = N.i + 1\nAt P: N.hᵢ = N.hₛ; N.i = N.hᵢ',
      question: 'These helpers replace the original rules N.i = N.s and N.s = N.i + 1. Which conclusion is correct?',
      options: [
        'The new rules are locally legal, but N.i → N.hₛ → N.hᵢ → N.i still prevents ordinary dependency-order evaluation.',
        'The new rules are legal and acyclic because each individual edge is permitted.',
        'The new rules are illegal because an inherited attribute can never use a synthesized attribute at N itself.',
        'A valid order is hₛ, hᵢ, i, s because helpers must be evaluated before ordinary attributes.'
      ],
      correct: 0,
      hints: [
        'A helper changes the length of a dependency path. Does it provide a value that can be computed first?',
        'Start at N.i and follow the arrows to hₛ and then hᵢ. Where does the next arrow go?'
      ],
      explanation: 'A. Each rule uses attributes available at its associated production. But the chain i → hₛ → hᵢ → i is a directed cycle. Inserting copies into a cycle cannot supply a first evaluable value.'
    },
    {
      title: 'Where proxy equivalence stops',
      premise: 'Keep the parse tree fixed. Use pure S-attributed rules only, with no inherited attributes, globals, tree pointers or hidden external inputs. N’s entire subtree and its leaf values stay identical while sibling L.v changes.',
      question: 'Can adding only synthesized helpers inside N’s subtree make N.s depend nontrivially on the changing L.v?',
      options: [
        'Yes. “N itself” allows a new helper at N to read any value reachable in the tree.',
        'Yes. P can synthesize L.v and N can read that parent attribute directly.',
        'No. Synthesized-only computation in N’s fixed subtree cannot distinguish the two values of L.v.',
        'Yes. Evaluating L before N supplies the missing dependency without changing any rule.'
      ],
      correct: 2,
      hints: [
        'Which legal edge would carry the changed sibling value into N’s subtree under these restrictions?',
        'Compare two evaluations with identical inputs inside N. Scheduling alone does not create a new input.'
      ],
      explanation: 'C. Every value synthesized inside N depends recursively on inputs in that subtree. Those inputs did not change. The parent/sibling → inherited helper → synthesized proxy requires an inherited attribute, which this question excludes.'
    },
    {
      title: 'General SDD versus L-attributed',
      premise: 'P → L N R; N → C. N.i is inherited; N.h and N.s are synthesized. C.v and R.v are independent synthesized inputs.',
      code: 'At N: N.h = C.v; N.s = N.i\nAt P: N.i = N.h + R.v',
      question: 'Which is the strongest correct classification of this definition?',
      options: [
        'It is illegal in every SDD because N.i reads a synthesized helper at N.',
        'It is L-attributed because a same-node helper makes every sibling dependency permissible.',
        'It is S-attributed because its final output N.s is synthesized.',
        'It is legal and acyclic as a general SDD, but it is not L-attributed because N.i depends on right sibling R.'
      ],
      correct: 3,
      hints: [
        'The general local dependency rule and the L-attributed restriction are different checks.',
        'In P → L N R, which sibling is to the right of N? L-attributed inheritance cannot read that sibling’s attribute.'
      ],
      explanation: 'D. The graph C.v → N.h → N.i → N.s, plus R.v → N.i, is acyclic. The dependency on right sibling R violates the L-attributed restriction. The presence of N.i also rules out S-attributed classification.'
    }
  ];
  let quiz = { index: 0, records: questions.map(() => ({ selection: null, first: null, attempts: 0, done: false, revealed: false })) };

  function restore(snapshot) {
    const saved = snapshot && snapshot.privateContent;
    if (!saved || saved.version !== 1 || !scenes[saved.mode]) return;
    state.mode = saved.mode;
    state.step = Math.max(0, Math.min(scenes[state.mode].length - 1, Math.trunc(saved.step) || 0));
    state.progress = saved.completed ? 1 : 0;
    state.playing = false;
    if (saved.quiz && Array.isArray(saved.quiz.records) && saved.quiz.records.length === questions.length) {
      quiz.index = Math.max(0, Math.min(questions.length - 1, Math.trunc(saved.quiz.index) || 0));
      quiz.records = saved.quiz.records.map(record => ({
        selection: Number.isInteger(record.selection) && record.selection >= 0 && record.selection < 4 ? record.selection : null,
        first: Number.isInteger(record.first) && record.first >= 0 && record.first < 4 ? record.first : null,
        attempts: Math.max(0, Math.min(3, Math.trunc(record.attempts) || 0)),
        done: Boolean(record.done), revealed: Boolean(record.revealed)
      }));
    }
  }

  function remember() {
    const snapshot = {
      modelContent: { view: state.mode, dependency: scenes[state.mode][state.step].name,
        quiz: { question: quiz.index + 1, firstAttemptCorrect: quiz.records.filter((record, index) => record.first === questions[index].correct).length,
          answered: quiz.records.filter(record => record.first !== null).length } },
      privateContent: { version: 1, mode: state.mode, step: state.step, completed: state.progress === 1, quiz }
    };
    try { localStorage.setItem('attribute-flow:v1', JSON.stringify(snapshot)); } catch {}
  }

  function escapeText(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function text(x, y, value, classes = '', anchor = 'middle') {
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${classes}" dominant-baseline="middle">${escapeText(value)}</text>`;
  }

  function externalNode(x, y, nodeWidth, label, value) {
    return `<g><rect class="af-node" x="${x - nodeWidth / 2}" y="${y - 29}" width="${nodeWidth}" height="58" rx="10"/>${text(x, y - 10, label, 'af-medium')}${text(x, y + 12, value, 'af-secondary af-mono')}</g>`;
  }

  function route(id, d, category, strength) {
    return `<path data-route="${id}" class="af-dependency af-${category} af-route-${strength}" d="${d}" marker-end="url(#af-arrow-${category})"/>`;
  }

  function draw() {
    width = Math.max(280, svg.getBoundingClientRect().width);
    const small = width < 520;
    const height = small ? 454 : 358;
    const cx = width / 2;
    const pY = 38;
    const nY = small ? 269 : 196;
    const childY = small ? 411 : 323;
    const siblingY = small ? 144 : nY;
    const siblingW = small ? 86 : 108;
    const siblingL = small ? 48 : 64;
    const siblingR = width - siblingL;
    const nW = small ? 226 : 244;
    const offset = small ? 57 : 64;
    const attrW = small ? 76 : 82;
    const ix = cx - offset;
    const sx = cx + offset;
    const c1 = cx - (small ? 64 : 77);
    const c2 = cx + (small ? 64 : 77);
    const scene = scenes[state.mode][state.step];
    const complete = state.progress >= 1;
    const iValue = complete ? scene.i : (scene.beforeI ?? '?');
    const sValue = complete ? scene.s : (scene.beforeS ?? '?');
    const iName = scene.helper === 'i' ? 'N.iₕ' : 'N.i';
    const sName = scene.helper === 's' ? 'N.sₕ' : 'N.s';
    const cycle = state.mode === 'cycle';
    const ghostIds = state.mode === 'direct' ? ['pi', 'li', 'ri', 'c1s', 'c2s', 'is'] : cycle ? ['is', 'si'] : ['pi', 'li', 'c1s', 'is', 'si'];
    const curves = {
      pi: `M ${cx - 22} ${pY + 29} C ${cx - 22} ${pY + 67}, ${ix} ${nY - 86}, ${ix} ${nY - 24}`,
      li: small
        ? `M ${siblingL + 6} ${siblingY + 29} C ${siblingL + 6} ${nY - 29}, ${ix - 55} ${nY}, ${ix - attrW / 2} ${nY}`
        : `M ${siblingL + siblingW / 2} ${nY} L ${ix - attrW / 2} ${nY}`,
      ri: small
        ? `M ${siblingR - 10} ${siblingY + 29} C ${siblingR - 10} ${nY + 86}, ${ix} ${nY + 90}, ${ix} ${nY + 24}`
        : `M ${siblingR - siblingW / 2} ${nY + 16} C ${siblingR - siblingW / 2 - 15} ${nY + 94}, ${ix} ${nY + 99}, ${ix} ${nY + 24}`,
      c1s: `M ${c1 + 22} ${childY - 29} C ${c1 + 22} ${childY - 57}, ${sx - 8} ${nY + 60}, ${sx - 8} ${nY + 24}`,
      c2s: `M ${c2} ${childY - 29} C ${c2} ${childY - 63}, ${sx + 12} ${nY + 63}, ${sx + 12} ${nY + 24}`,
      is: `M ${ix + attrW / 2 + 2} ${nY} L ${sx - attrW / 2 - 3} ${nY}`,
      si: `M ${sx} ${nY - 24} C ${sx} ${nY - 51}, ${ix} ${nY - 51}, ${ix} ${nY - 24}`
    };
    const routeMarkup = ghostIds.map(id => {
      const active = scene.edges.includes(id);
      const done = (scene.done || []).includes(id);
      const category = cycle && active ? 'error' : ['pi', 'li', 'ri', 'si'].includes(id) ? 'i' : 's';
      return route(id, curves[id], category, active ? 'active' : done ? 'done' : 'ghost');
    }).join('');
    const sourceP = state.mode === 'direct' && state.step !== 0 && state.step !== 3 ? 'P.ctx' : 'P.ctx = 10';
    const sourceL = 'L.val = 7';
    const sourceR = state.mode === 'direct' && state.step === 1 ? 'R.val = 3' : 'R.val';
    const sourceC1 = 'val = 4';
    const sourceC2 = state.mode === 'direct' && state.step === 2 ? 'val = 6' : 'val';
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('height', height);
    svg.innerHTML = `<title id="af-title">${escapeText(scene.status)}</title>
      <desc id="af-description">${escapeText(scene.name)}. Inherited attributes are defined by rules at P, the parent. Synthesized attributes are defined by rules at N. The arrows show prerequisites, not mandatory traversal directions.</desc>
      <defs>
        <marker id="af-arrow-i" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M 0 0 L 7 3.5 L 0 7 Z" fill="var(--viz-series-1)"/></marker>
        <marker id="af-arrow-s" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M 0 0 L 7 3.5 L 0 7 Z" fill="var(--viz-series-2)"/></marker>
        <marker id="af-arrow-error" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M 0 0 L 7 3.5 L 0 7 Z" fill="var(--destructive)"/></marker>
      </defs>
      <g aria-hidden="true">
        <path class="af-tree" d="M ${cx} ${pY + 29} L ${cx} ${nY - 68} M ${cx - 52} ${pY + 29} L ${siblingL} ${siblingY - 29} M ${cx + 52} ${pY + 29} L ${siblingR} ${siblingY - 29} M ${cx - 28} ${nY + 72} L ${c1} ${childY - 29} M ${cx + 28} ${nY + 72} L ${c2} ${childY - 29}"/>
        <rect class="af-focus-node" x="${cx - nW / 2}" y="${nY - 68}" width="${nW}" height="140" rx="16"/>
        ${text(cx, nY - 55, 'N itself', 'af-medium')}
        <g class="af-i"><rect class="af-attr ${complete && scene.i !== '?' ? 'af-slot-active' : 'af-slot'}" x="${ix - attrW / 2}" y="${nY - 24}" width="${attrW}" height="48" rx="6"/></g>
        <g class="af-s"><rect class="af-attr ${complete && scene.s !== '?' ? 'af-slot-active' : 'af-slot'}" x="${sx - attrW / 2}" y="${nY - 24}" width="${attrW}" height="48" rx="6"/></g>
        ${text(ix, nY - 14, iName, 'af-mono af-medium')}${text(ix, nY + 1, 'inherited', 'af-secondary')}${text(ix, nY + 16, iValue, 'af-mono af-medium')}
        ${text(sx, nY - 14, sName, 'af-mono af-medium')}${text(sx, nY + 1, 'synthesized', 'af-secondary')}${text(sx, nY + 16, sValue, 'af-mono af-medium')}
        ${externalNode(cx, pY, 144, 'Parent P', sourceP)}
        ${externalNode(siblingL, siblingY, siblingW, 'Sibling L', sourceL)}
        ${externalNode(siblingR, siblingY, siblingW, 'Sibling R', sourceR)}
        ${externalNode(c1, childY, 96, 'Child C₁', sourceC1)}
        ${externalNode(c2, childY, 96, 'Child C₂', sourceC2)}
        ${routeMarkup}
        <g data-tokens></g>
      </g>`;
    const fontBase = parseFloat(getComputedStyle(root).fontSize) || 14;
    svg.style.fontSize = Math.max(11, fontBase * .82) + 'px';
    activePaths = scene.edges.map(id => svg.querySelector(`[data-route="${id}"]`));
    tokenGroup = svg.querySelector('[data-tokens]');
    detail.textContent = scene.name;
    status.textContent = scene.status;
    status.classList.toggle('text-destructive', cycle);
    count.textContent = `${state.step + 1} / ${scenes[state.mode].length}`;
    root.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode)));
    playLabel.textContent = state.playing ? 'Pause' : 'Play';
    playButton.setAttribute('aria-label', state.playing ? 'Pause animation' : 'Play animation');
    paintTokens();
  }

  function paintTokens() {
    if (!tokenGroup) return;
    if (state.progress <= 0 || state.progress >= 1 || reducedMotion.matches) {
      tokenGroup.innerHTML = '';
      return;
    }
    const scene = scenes[state.mode][state.step];
    tokenGroup.innerHTML = activePaths.map((path, index) => {
      const progress = state.mode === 'cycle' ? Math.min(.68, state.progress * 1.2) : state.progress;
      const point = path.getPointAtLength(path.getTotalLength() * progress);
      const inherited = ['pi', 'li', 'ri', 'si'].includes(scene.edges[index]);
      const category = state.mode === 'cycle' ? 'error' : inherited ? 'i' : 's';
      return inherited
        ? `<rect class="af-token af-${category}" x="${point.x - 4.5}" y="${point.y - 4.5}" width="9" height="9" rx="1"/>`
        : `<circle class="af-token af-${category}" cx="${point.x}" cy="${point.y}" r="5"/>`;
    }).join('');
  }

  function stop() {
    state.playing = false;
    cancelAnimationFrame(frameId);
    lastTime = 0;
  }

  function renderQuiz() {
    const item = questions[quiz.index];
    const record = quiz.records[quiz.index];
    const letters = ['A', 'B', 'C', 'D'];
    root.querySelector('[data-quiz-body]').innerHTML =
      `<h3>${quiz.index + 1} / ${questions.length} · ${escapeText(item.title)}</h3>
      <div class="af-quiz-premise text-small">${escapeText(item.premise)}</div>
      ${item.code ? `<pre class="af-question-code"><code>${escapeText(item.code)}</code></pre>` : ''}
      <div class="af-quiz-question">${escapeText(item.question)}</div>
      <div class="af-options" role="radiogroup" aria-label="Answer choices">${item.options.map((option, index) =>
        `<label class="form-check"><input class="form-check-input" type="radio" name="af-question-${quiz.index}" value="${index}" ${record.selection === index ? 'checked' : ''} ${record.done ? 'disabled' : ''}><span class="form-check-label">${letters[index]}. ${escapeText(option)}</span></label>`
      ).join('')}</div>`;
    const feedback = root.querySelector('[data-quiz-feedback]');
    feedback.textContent = record.done
      ? `${record.revealed ? 'Answer revealed.' : 'Correct.'} ${item.explanation}`
      : record.attempts > 0 ? `Not yet. ${item.hints[Math.min(record.attempts - 1, 1)]}` : '';
    root.querySelector('[data-quiz-check]').disabled = record.done;
    const next = root.querySelector('[data-quiz-next]');
    next.disabled = !record.done;
    next.textContent = quiz.index === questions.length - 1 ? 'Review from Q1' : 'Next';
    const answered = quiz.records.filter(item => item.first !== null).length;
    const correct = quiz.records.filter((item, index) => item.first === questions[index].correct).length;
    root.querySelector('[data-quiz-score]').textContent = `First attempt: ${correct} / ${answered}`;
    root.querySelectorAll('.af-options input').forEach(input => input.addEventListener('change', () => {
      record.selection = Number(input.value); remember();
    }));
  }

  root.querySelector('[data-quiz-check]').addEventListener('click', () => {
    const record = quiz.records[quiz.index];
    if (record.selection === null) {
      root.querySelector('[data-quiz-feedback]').textContent = 'Select one answer first.';
      return;
    }
    if (record.done) return;
    if (record.first === null) record.first = record.selection;
    record.attempts += 1;
    if (record.selection === questions[quiz.index].correct) record.done = true;
    else if (record.attempts >= 3) { record.done = true; record.revealed = true; }
    renderQuiz(); remember();
  });
  root.querySelector('[data-quiz-next]').addEventListener('click', () => {
    if (!quiz.records[quiz.index].done) return;
    quiz.index = (quiz.index + 1) % questions.length;
    renderQuiz(); remember();
  });

  function animate(now) {
    if (!state.playing || !root.isConnected) return;
    const delta = lastTime ? Math.min(100, now - lastTime) : 0;
    lastTime = now;
    if (state.progress < 1) {
      state.progress = Math.min(1, state.progress + delta / (reducedMotion.matches ? 300 : 1300));
      paintTokens();
      if (state.progress === 1) { draw(); remember(); }
    } else {
      dwell += delta;
      if (dwell >= 900) {
        dwell = 0;
        if (state.step === scenes[state.mode].length - 1) {
          stop(); draw(); remember(); return;
        }
        state.step += 1;
        state.progress = 0;
        draw();
      }
    }
    frameId = requestAnimationFrame(animate);
  }

  playButton.addEventListener('click', () => {
    if (state.playing) { stop(); draw(); remember(); return; }
    if (state.progress === 1 && state.step === scenes[state.mode].length - 1) { state.step = 0; state.progress = 0; }
    state.playing = true;
    lastTime = 0;
    dwell = 0;
    draw(); remember();
    frameId = requestAnimationFrame(animate);
  });
  root.querySelector('[data-action="step"]').addEventListener('click', () => {
    stop();
    if (state.progress < 1) state.progress = 1;
    else if (state.step < scenes[state.mode].length - 1) { state.step += 1; state.progress = 1; }
    draw(); remember();
  });
  root.querySelector('[data-action="reset"]').addEventListener('click', () => {
    stop(); state.step = 0; state.progress = 0; dwell = 0; draw(); remember();
  });
  root.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    stop(); state.mode = button.dataset.mode; state.step = 0; state.progress = 0; dwell = 0; draw(); remember();
  }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.playing) { stop(); draw(); remember(); }
  });
  root.querySelector('[data-quiz-restart]').addEventListener('click', () => {
    quiz = { index: 0, records: questions.map(() => ({ selection: null, first: null, attempts: 0, done: false, revealed: false })) };
    renderQuiz(); remember();
  });
  reducedMotion.addEventListener('change', () => draw());
  const observer = new ResizeObserver(() => {
    if (Math.abs(svg.getBoundingClientRect().width - width) > 1) draw();
  });
  observer.observe(root.querySelector('.af-explorer'));
  try { restore(JSON.parse(localStorage.getItem('attribute-flow:v1'))); } catch {}
  draw();
  renderQuiz();
})();
