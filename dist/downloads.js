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
    const en = document.documentElement.lang === 'en';
    element.textContent = new Intl.NumberFormat(en ? 'en-US' : 'zh-CN').format(total);
    element.title = en ? 'MNN-Pocket series + MNN-Sana-Edit-V2; repository download counts, not unique users. Includes cached values when a refresh fails.' : 'MNN-Pocket 全系列与 MNN-Sana-Edit-V2 的累计下载次数合计，非去重用户数；刷新失败时包含上次缓存值。';
  }
  document.addEventListener('languagechange', renderCombined);
  for (const project of projects) {
  const { endpoint, cacheKey } = project;
  const interval = 5 * 60 * 1000;
  const month = document.getElementById(`${project.prefix}-month`);
  const total = document.getElementById(`${project.prefix}-total`);
  const status = document.getElementById(`${project.prefix}-status`);
  if (!month || !total || !status) continue;
  const english = () => document.documentElement.lang === 'en';
  let previous = null;
  let unavailable = false;
  let lastCached = false;
  let pending = false;
  let lastAttempt = 0;

  const valid = (data) => data && Number.isSafeInteger(data.downloads) && data.downloads >= 0
    && Number.isSafeInteger(data.downloadsAllTime) && data.downloadsAllTime >= 0
    && Number.isFinite(data.updatedAt) && data.updatedAt > 0;

  function render(data, cached) {
    totals.set(project.prefix, data.downloadsAllTime);
    renderCombined();
    lastCached = cached;
    const en = english();
    const number = new Intl.NumberFormat(en ? 'en-US' : 'zh-CN');
    const time = new Intl.DateTimeFormat(en ? 'en-US' : 'zh-CN', { dateStyle: 'short', timeStyle: 'short' });
    month.textContent = number.format(data.downloads);
    total.textContent = number.format(data.downloadsAllTime);
    const label = en ? (cached ? 'Last retrieved' : 'Updated') : (cached ? '上次获取' : '更新于');
    const count = project.series && data.count ? (en ? ` · ${data.count} model repositories` : ` · ${data.count} 个模型仓库`) : '';
    status.textContent = `${label} ${time.format(data.updatedAt)} · ${en ? 'Source: Hugging Face' : '来源 Hugging Face'}${count}${unavailable ? (en ? ' · Unable to refresh' : ' · 暂时无法刷新') : ''}`;
  }

  function renderEmpty() {
    status.textContent = unavailable
      ? (english() ? 'Statistics are temporarily unavailable. Visit the model on Hugging Face using the link above.' : '暂时无法获取统计，可点击模型名称查看 Hugging Face。')
      : (english() ? 'Loading download statistics…' : '正在获取下载统计…');
  }
  renderEmpty();
  document.addEventListener('languagechange', () => {
    if (previous) render(previous, lastCached);
    else renderEmpty();
  });

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
