(() => {
  const entries = [];
  function translate(selector, values) {
    document.querySelectorAll(selector).forEach((element, i) => {
      if (values[i] !== undefined) entries.push({ element, zh: element.innerHTML, en: values[i] });
    });
  }
  translate('nav a', ['About', 'Research', 'Experience', 'Publications', 'Open Source']);
  document.querySelectorAll('.section h2').forEach(element => entries.push({ element, zh: element.innerHTML, en: element.firstChild.textContent.trim() }));
  translate('.profile h1', ['Zhewei Fang']);
  translate('.profile .name-en', ['方喆炜']);
  translate('.profile .role', ["Master’s Student · Hangzhou Dianzi University"]);
  translate('.profile .location', ['On-device LLM Post-training · Unified Multimodal Models']);
  translate('#about p', [
    'I am Zhewei Fang, a master’s student in Computer Science and Technology at Hangzhou Dianzi University.',
    'I have received the National Scholarship, the Outstanding Graduate of Zhejiang Province award, and an Outstanding Graduation Thesis award.'
  ]);
  translate('#research p', [
    'My research focuses on large language model post-training, unified multimodal models, agentic reinforcement learning, and multimodal understanding and generation.',
    'My other research interests include pattern recognition, image quality assessment, and multimodal affect recognition.'
  ]);
  translate('.experience-item h3', ['Alibaba Group (Taobao) · Meta Team']);
  translate('.experience-item .subtitle', ['Algorithm Research Intern · 2025–2026']);
  translate('.experience-item li', [
    'Contributed extensively to the MNN-Pocket post-training pipeline, including data, SFT, RL, MOPD, quantization, evaluation, and on-device deployment.',
    'Built an SFT Loop Engine with failure analysis, synthetic data generation, and iterative training, improving average performance across 11 tasks by 7.46 percentage points.',
    'Contributed to multi-teacher distillation and QAT, compressing a 302.8M-parameter model to 166 MB. MNN open-source models accumulated over 6K downloads.',
    'Led Imp-o 1B–3B training and Sana-Turbo on-device acceleration, and advanced device–cloud agentic RL experiments.'
  ]);
  translate('#open-source .author-badge', ['Primary Developer', 'Primary Developer']);
  translate('#open-source .model-repo', ['On-device Small Models · Post-training &amp; Deployment', 'taobao-mnn · Hugging Face']);
  translate('#open-source .model-description', [
    'As a primary developer, contributed extensively to data construction, SFT, RL, multi-teacher distillation, quantization, and evaluation to bring models to on-device deployment with MNN.',
    'Led the on-device development and optimization of MNN-Sana-Edit-V2, including model adaptation, inference acceleration, and open-source delivery with MNN.'
  ]);
  translate('#open-source .paper-links a', ['Model Collection']);
  translate('.download-counts dt', ['Series Downloads · Last 30 Days', 'Series Downloads · All Time', 'Downloads · Last 30 Days', 'Downloads · All Time']);
  translate('.download-scope', ['Total download counts across all MNN-Pocket model repositories published by taobao-mnn.']);
  translate('#work .paper-badges > span:first-child', ['IEEE TPAMI · Accepted', 'PREPRINT · 2026', 'IEEE TIM · Published']);
  translate('#work .author-badge', ['Sole First Author', 'Co-first Author', 'First Author']);
  translate('#work .work-item > div > p:not(.paper-authors)', [
    'Introduces <strong>personality-domain information</strong> with cross-domain multitask learning and audiovisual fusion to better model depression-related emotional cues.',
    'Trains on-device small models to learn <strong>when to consult cloud models and internalize their guidance</strong>. Self-evolving RL, consultation cold start, and consultation-aware RL improve long-horizon task success while reducing cloud calls.',
    'Combines <strong>local and global statistical features</strong> to characterize virtual-view synthesis distortions and predict image quality without a reference image.'
  ]);
  translate('.paper-figure figcaption', ['Concept Illustration', 'Collaboration Overview · Figure 1', 'Concept Illustration']);
  translate('.compact-list li', [
    'National Scholarship (2023)',
    'Huawei ICT Competition · Global Second Prize / National First Prize (2023)',
    'CCF YOCSEF Academic Showcase · National Second Prize (2024)',
    'China International “Internet+” College Students Innovation and Entrepreneurship Competition · National Silver Award (2024)'
  ]);
  translate('#contact p', [
    'For research discussions, projects, or open-source collaboration, feel free to reach out via WeChat or <a href="mailto:fzw_18268300430@163.com">email</a>.',
    'WeChat: <span class="wechat-id">fzwreal0430</span>'
  ]);
  const images = [...document.querySelectorAll('img')].map((element, i) => ({ element, zh: element.alt, en: [
    'Illustrated portrait of Zhewei Fang',
    'Personality information guides depression prediction through shared video representations',
    'Sibyl selectively consults a cloud model during on-device task execution',
    'Local and global statistics are fused for no-reference image quality prediction'
  ][i] || element.alt }));
  const button = document.getElementById('language-toggle');
  function apply(language) {
    const en = language === 'en';
    document.documentElement.lang = en ? 'en' : 'zh-CN';
    for (const entry of entries) entry.element.innerHTML = en ? entry.en : entry.zh;
    for (const entry of images) entry.element.alt = en ? entry.en : entry.zh;
    document.title = en ? 'Zhewei Fang — Personal Homepage' : 'Zhewei Fang — 个人主页';
    document.querySelector('meta[name="description"]').content = en ? 'Zhewei Fang: research, publications, and open-source work on on-device language models and multimodal learning.' : 'Zhewei Fang 的个人主页，记录项目、学习与日常。';
    document.querySelector('nav').setAttribute('aria-label', en ? 'Main navigation' : '主导航');
    button.textContent = en ? '中文' : 'EN';
    button.setAttribute('aria-label', en ? '切换到中文' : 'Switch to English');
    document.dispatchEvent(new Event('languagechange'));
  }
  button.addEventListener('click', () => {
    const language = document.documentElement.lang === 'en' ? 'zh' : 'en';
    const url = new URL(location.href);
    if (language === 'en') url.searchParams.set('lang', 'en');
    else url.searchParams.delete('lang');
    history.replaceState(null, '', url);
    apply(language);
  });
  apply(new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'zh');
})();
