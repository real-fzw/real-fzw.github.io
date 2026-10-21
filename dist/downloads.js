(() => {
  const endpoint = 'https://huggingface.co/api/models/taobao-mnn/MNN-Sana-Edit-V2?expand[]=downloads&expand[]=downloadsAllTime';
  const cacheKey = 'hf-downloads:taobao-mnn/MNN-Sana-Edit-V2:v1';
  const interval = 5 * 60 * 1000;
  const month = document.getElementById('hf-month');
  const total = document.getElementById('hf-total');
  const status = document.getElementById('hf-status');
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
    status.textContent = `${cached ? '上次获取' : '更新于'} ${time.format(data.updatedAt)} · 来源 Hugging Face`;
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
      const response = await fetch(endpoint, { signal: controller.signal, credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const data = { downloads: payload.downloads, downloadsAllTime: payload.downloadsAllTime, updatedAt: Date.now() };
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
})();
