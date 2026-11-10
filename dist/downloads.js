(() => {
  const projects = [
    { prefix: 'hf', endpoint: 'https://huggingface.co/api/models/taobao-mnn/MNN-Sana-Edit-V2?expand[]=downloads&expand[]=downloadsAllTime', cacheKey: 'hf-downloads:taobao-mnn/MNN-Sana-Edit-V2:v1' },
    { prefix: 'pocket', endpoint: 'https://huggingface.co/api/models?author=taobao-mnn&search=MNN-Pocket&limit=100&expand[]=downloads&expand[]=downloadsAllTime', cacheKey: 'hf-downloads:taobao-mnn/MNN-Pocket-series:v1', series: true }
  ];
  const totals = new Map();
  function renderCombined() {
    const element = document.getElementById('downloads-combined');
    if (!element || totals.size !== projects.length) return;
    const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
    if (!Number.isSafeInteger(total)) return;
    element.textContent = new Intl.NumberFormat('en-US').format(total);
    element.title = 'MNN-Pocket series + MNN-Sana-Edit-V2; repository download counts, not unique users. Includes cached values when a refresh fails.';
  }
  for (const project of projects) {
  const { endpoint, cacheKey } = project;
  const interval = 5 * 60 * 1000;
  const month = document.getElementById(`${project.prefix}-month`);
  const total = document.getElementById(`${project.prefix}-total`);
  const status = document.getElementById(`${project.prefix}-status`);
  if (!month || !total || !status) continue;
  let previous = null;
  let unavailable = false;
  let pending = false;
  let lastAttempt = 0;

  const valid = (data) => data && Number.isSafeInteger(data.downloads) && data.downloads >= 0
    && Number.isSafeInteger(data.downloadsAllTime) && data.downloadsAllTime >= 0
    && Number.isFinite(data.updatedAt) && data.updatedAt > 0;

  function render(data, cached) {
    totals.set(project.prefix, data.downloadsAllTime);
    renderCombined();
    const number = new Intl.NumberFormat('en-US');
    const time = new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' });
    month.textContent = number.format(data.downloads);
    total.textContent = number.format(data.downloadsAllTime);
    const label = cached ? 'Last retrieved' : 'Updated';
    const count = project.series && data.count ? ` · ${data.count} model repositories` : '';
    status.textContent = `${label} ${time.format(data.updatedAt)} · Source: Hugging Face${count}${unavailable ? ' · Unable to refresh' : ''}`;
  }

  function renderEmpty() {
    status.textContent = unavailable
      ? 'Statistics are temporarily unavailable. Visit the model on Hugging Face using the link above.'
      : 'Loading download statistics…';
  }
  renderEmpty();

  try {
    const saved = JSON.parse(localStorage.getItem(cacheKey));
    if (valid(saved)) { previous = saved; render(saved, true); }
  } catch { /* Storage may be unavailable; live stats still work. */ }

  async function refresh() {
    if (pending || document.hidden) return;
    pending = true;
    lastAttempt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      let next = endpoint;
      const models = new Map();
      let payload;
      while (next) {
        const response = await fetch(next, { signal: controller.signal, credentials: 'omit' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        payload = await response.json();
        if (!project.series) break;
        if (!Array.isArray(payload)) throw new Error('Invalid model list');
        for (const model of payload) {
          if (/^taobao-mnn\/MNN-Pocket(?:-|$)/i.test(model.id || '')) models.set(model.id, model);
        }
        next = (response.headers.get('Link') || '').match(/<([^>]+)>;\s*rel="next"/)?.[1];
        if (next && new URL(next).origin !== 'https://huggingface.co') throw new Error('Unexpected pagination URL');
      }
      let data;
      if (project.series) {
        if (!models.size) throw new Error('Empty model series');
        data = { downloads: 0, downloadsAllTime: 0, count: models.size, updatedAt: Date.now() };
        for (const model of models.values()) {
          if (!valid({ ...model, updatedAt: data.updatedAt })) throw new Error('Incomplete series metrics');
          data.downloads += model.downloads;
          data.downloadsAllTime += model.downloadsAllTime;
        }
      } else {
        data = { downloads: payload.downloads, downloadsAllTime: payload.downloadsAllTime, updatedAt: Date.now() };
      }
      if (!valid(data)) throw new Error('Missing download metrics');
      previous = data;
      unavailable = false;
      render(data, false);
      try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch { /* Cache is optional. */ }
    } catch {
      unavailable = true;
      if (previous) {
        render(previous, true);
      } else {
        renderEmpty();
      }
    } finally {
      clearTimeout(timeout);
      pending = false;
    }
  }

  refresh();
  setInterval(refresh, interval);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Date.now() - lastAttempt >= interval) refresh();
  });
  }
})();
