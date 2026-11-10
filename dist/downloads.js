(() => {
  const projects = [
    { prefix: 'hf', endpoint: 'https://huggingface.co/api/models/taobao-mnn/MNN-Sana-Edit-V2?expand[]=downloads&expand[]=downloadsAllTime', cacheKey: 'hf-downloads:taobao-mnn/MNN-Sana-Edit-V2:v1' },
    { prefix: 'pocket', endpoint: 'https://huggingface.co/api/models?author=taobao-mnn&search=MNN-Pocket&limit=100&expand[]=downloads&expand[]=downloadsAllTime', cacheKey: 'hf-downloads:taobao-mnn/MNN-Pocket-series:v1', series: true }
  ];
  for (const project of projects) {
  const { endpoint, cacheKey } = project;
  const interval = 5 * 60 * 1000;
  const month = document.getElementById(`${project.prefix}-month`);
  const total = document.getElementById(`${project.prefix}-total`);
  const status = document.getElementById(`${project.prefix}-status`);
  if (!month || !total || !status) continue;
  const number = new Intl.NumberFormat('zh-CN');
  const time = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' });
  let previous = null;
  let pending = false;
  let lastAttempt = 0;

  const valid = (data) => data && Number.isSafeInteger(data.downloads) && data.downloads >= 0
    && Number.isSafeInteger(data.downloadsAllTime) && data.downloadsAllTime >= 0
    && Number.isFinite(data.updatedAt) && data.updatedAt > 0;

  function render(data, cached) {
    month.textContent = number.format(data.downloads);
    total.textContent = number.format(data.downloadsAllTime);
    status.textContent = `${cached ? '上次获取' : '更新于'} ${time.format(data.updatedAt)} · 来源 Hugging Face${project.series && data.count ? ` · ${data.count} 个模型仓库` : ''}`;
  }

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
      render(data, false);
      try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch { /* Cache is optional. */ }
    } catch {
      if (previous) {
        render(previous, true);
        status.textContent += ' · 暂时无法刷新';
      } else {
        status.textContent = '暂时无法获取统计，可点击模型名称查看 Hugging Face。';
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
