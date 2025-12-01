(() => {
  const el = (id) => document.getElementById(id);
  const mainText = el('mainText');
  const preview = el('preview');
  const charCount = el('charCount');
  const wordCount = el('wordCount');
  const lineCount = el('lineCount');
  const copyBtn = el('copyBtn');
  const downloadBtn = el('downloadBtn');
  const autoPreview = el('autoPreview');
  const preserveLeading = el('preserveLeading');
  const undoBtn = el('undoBtn');
  const clearBtn = el('clearBtn');

  let history = [];
  function pushHistory(text) {
    history.push(text);
    if (history.length > 50) history.shift();
    undoBtn.disabled = history.length <= 1;
  }

  function updateStatsAndPreview() {
    const txt = mainText.value;
    charCount.textContent = txt.length;
    wordCount.textContent = countWords(txt);
    lineCount.textContent = (txt.length ? txt.split(/\r\n|\r|\n/).length : 0);

    if (autoPreview.checked) {
      setPreview(txt);
    }
  }

  function setPreview(txt){
    if (!preserveLeading.checked) {
      preview.textContent = txt.trim();
    } else {
      preview.textContent = txt;
    }
  }

  function countWords(text) {
    if (!text) return 0;
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }

  function applyTransform(fn){
    const before = mainText.value;
    pushHistory(before);
    const after = fn(before);
    mainText.value = after;
    setPreview(after);
    updateStatsAndPreview();
  }

  const actions = {
    'trim': s => s.trim(),
    'remove-extra-spaces': s => s.replace(/[ \t]+/g, ' ').replace(/ +\n/g, '\n').replace(/\n +/g, '\n').trim(),
    'compact-newlines': s => s.replace(/\n{2,}/g, '\n\n'),
    'uppercase': s => s.toUpperCase(),
    'lowercase': s => s.toLowerCase(),
    'titlecase': s => s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()),
    'sentencecase': s => {
      return s.toLowerCase().replace(/(^\s*\w|[\.!\?]\s*\w)/g, c => c.toUpperCase());
    },
    'snakecase': s => s.trim().replace(/\s+/g, '_').replace(/[^\w_]+/g, '').toLowerCase(),
    'kebabcase': s => s.trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').toLowerCase(),
    'capitalize': s => s.replace(/\b\w/g, c => c.toUpperCase()),
    'remove-punctuation': s => s.replace(/[!"#\$%&'\(\)\*\+,\-\.\/:;<=>\?@\[\]\\\^_`{\|}~]/g,''),
    'strip-non-ascii': s => s.replace(/[^\x00-\x7F]/g,''),
    'remove-empty-lines': s => s.split(/\r\n|\r|\n/).filter(line=>line.trim()!=='').join('\n')
  };

  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      if (actions[action]) {
        applyTransform(actions[action]);
      }
    });
  });

  mainText.addEventListener('input', () => {
    pushHistory(mainText.value);
    updateStatsAndPreview();
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(mainText.value);
      copyBtn.textContent = 'Copied ✓';
      setTimeout(()=> copyBtn.textContent = 'Copy', 1200);
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = mainText.value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      copyBtn.textContent = 'Copied ✓';
      setTimeout(()=> copyBtn.textContent = 'Copy', 1200);
    }
  });

  downloadBtn.addEventListener('click', () => {
    const txt = mainText.value;
    const blob = new Blob([txt], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'textformatter.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url), 500);
  });

  undoBtn.addEventListener('click', () => {
    if (history.length <= 1) return;
    history.pop();
    const prev = history[history.length-1] || '';
    mainText.value = prev;
    setPreview(prev);
    updateStatsAndPreview();
    undoBtn.disabled = history.length <= 1;
  });

  clearBtn.addEventListener('click', () => {
    pushHistory(mainText.value);
    mainText.value = '';
    preview.textContent = '';
    updateStatsAndPreview();
  });

  pushHistory('');
  updateStatsAndPreview();
  window.MicroTools = { actions, applyTransform, updateStatsAndPreview };
})();
