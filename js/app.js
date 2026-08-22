/**
 * VantagePulse AI™ - Core Application Controller & SaaS Motion Engine
 * Animated headline typewriter, number counters, 1,000+ companies intelligence, and Azure pipelines.
 */

class VantageApp {
  constructor() {
    this.currentView = 'landing';
    this.currentTheme = localStorage.getItem('vantage_theme') || 'midnight';
    this.typewriterWords = [
      'AI Foundation Hubs',
      'Cloud Hyperscalers',
      'Cybersecurity Titans',
      'Modern DevTools',
      'Global FinTech Platforms'
    ];
    this.typewriterIndex = 0;
    this.isDeleting = false;
    this.txt = '';
    this.init();
  }

  async init() {
    // 1. Initialize Databases
    await window.vantageDB.init();
    await window.companiesDB.init();

    // 2. Apply Theme
    this.applyTheme(this.currentTheme);

    // 3. Initialize Auth State
    window.vantageAuth.updateUI();

    // 4. Bind Global Event Listeners
    this.bindEvents();

    // 5. Start SaaS Typewriter Animator
    this.startTypewriter();

    // 6. Initialize ROI Calculator
    this.updateRoiCalculator();

    // 7. Initial View Load: Always default to the Landing Page (Home)
    const hashView = window.location.hash ? window.location.hash.replace('#', '') : null;
    if (hashView && document.getElementById(`view-${hashView}`)) {
      this.switchView(hashView);
    } else {
      this.switchView('landing');
    }
  }

  // --- Strategic Competitive Intelligence ROI Calculator ---
  updateRoiCalculator() {
    const compSlider = document.getElementById('roi-slider-competitors');
    const hoursSlider = document.getElementById('roi-slider-hours');
    const compValEl = document.getElementById('roi-competitors-val');
    const hoursValEl = document.getElementById('roi-hours-val');
    const totalSavingsEl = document.getElementById('roi-total-savings');
    const hoursSavedEl = document.getElementById('roi-hours-saved');

    if (!compSlider || !hoursSlider) return;

    const competitors = parseInt(compSlider.value, 10);
    const monthlyHours = parseInt(hoursSlider.value, 10);

    if (compValEl) compValEl.textContent = `${competitors} Companies`;
    if (hoursValEl) hoursValEl.textContent = `${monthlyHours} Hours / mo`;

    // Calculation: $105/hr market analyst rate * annual hours saved (85% reduction) + competitor intelligence tooling
    const annualHoursSaved = Math.round(monthlyHours * 12 * 0.85);
    const estimatedCostSavings = annualHoursSaved * 105 + (competitors * 450);

    if (totalSavingsEl) {
      totalSavingsEl.textContent = `$${estimatedCostSavings.toLocaleString()}`;
    }
    if (hoursSavedEl) {
      hoursSavedEl.textContent = `${annualHoursSaved.toLocaleString()} hrs`;
    }
  }

  bindEvents() {
    document.querySelectorAll('.theme-btn-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const theme = e.currentTarget.getAttribute('data-theme-val');
        this.applyTheme(theme);
      });
    });

    document.querySelectorAll('[data-view-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetView = e.currentTarget.getAttribute('data-view-target');
        this.switchView(targetView);
      });
    });

    const aiInput = document.getElementById('ai-input-field');
    if (aiInput) {
      aiInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = aiInput.value;
          aiInput.value = '';
          window.vantageAI.sendUserMessage(val);
        }
      });
    }

    const searchInput = document.getElementById('search-modal-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        window.vantageSearch.executeSearch(e.target.value);
      });
    }

    const billToggle = document.getElementById('billing-cycle-toggle');
    if (billToggle) {
      billToggle.addEventListener('change', (e) => {
        this.updatePricingCycle(e.target.checked);
      });
    }
  }

  // --- SaaS Hero Dynamic Typewriter Animation ---
  startTypewriter() {
    const el = document.getElementById('hero-typewriter-text');
    if (!el) return;

    const currentWord = this.typewriterWords[this.typewriterIndex % this.typewriterWords.length];

    if (this.isDeleting) {
      this.txt = currentWord.substring(0, this.txt.length - 1);
    } else {
      this.txt = currentWord.substring(0, this.txt.length + 1);
    }

    el.textContent = this.txt;

    let typeSpeed = this.isDeleting ? 40 : 90;

    if (!this.isDeleting && this.txt === currentWord) {
      typeSpeed = 2200; // Pause at end of word
      this.isDeleting = true;
    } else if (this.isDeleting && this.txt === '') {
      this.isDeleting = false;
      this.typewriterIndex++;
      typeSpeed = 400;
    }

    setTimeout(() => this.startTypewriter(), typeSpeed);
  }

  // --- Animated Number Counter Up ---
  animateCountUp(elementId, targetValue, suffix = '', isDecimal = false) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const duration = 1200;
    const start = performance.now();

    const frame = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const easeProgress = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      
      const current = isDecimal 
        ? (easeProgress * targetValue).toFixed(1)
        : Math.floor(easeProgress * targetValue);

      el.textContent = `${current}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = `${targetValue}${suffix}`;
      }
    };

    requestAnimationFrame(frame);
  }

  // --- Theme Controller ---
  applyTheme(themeName) {
    this.currentTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('vantage_theme', themeName);

    const iconMap = { midnight: '🌙', light: '☀️', onyx: '🌌', azure: '🔷' };
    const iconEl = document.getElementById('theme-btn-icon');
    if (iconEl) iconEl.textContent = iconMap[themeName] || '🌙';

    document.querySelectorAll('.theme-btn-option').forEach(btn => {
      if (btn.getAttribute('data-theme-val') === themeName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (this.currentView === 'overview' || this.currentView === 'custom-compare' || this.currentView === 'landing') {
      setTimeout(() => {
        if (this.currentView === 'custom-compare') window.customCompare?.renderChart();
        else if (this.currentView === 'landing') {
          this.renderLandingPreviewChart();
          window.landingAnimation?.render();
        } else {
          this.renderCharts();
        }
      }, 50);
    }
  }

  // --- Router & View Switching ---
  async switchView(viewName) {
    // 1. Strict Admin Guards for Admin Console and Storage views
    if (viewName === 'admin' || viewName === 'blobs') {
      if (!window.vantageAuth.isAdmin()) {
        this.openModal('access-denied-modal');
        return;
      }
    }

    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    document.querySelectorAll('[data-view-target]').forEach(btn => {
      if (btn.getAttribute('data-view-target') === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.add('active');
      this.currentView = viewName;
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (viewName === 'overview') await this.loadOverviewView();
      if (viewName === 'custom-compare') await this.loadCustomCompareView();
      if (viewName === 'matrix') await this.loadMatrixView();
      if (viewName === 'categories') await this.loadCategoryExplorerView();
      if (viewName === 'translator') await this.loadTranslatorView();
      if (viewName === 'blobs') await this.loadBlobsView();
      if (viewName === 'admin') await window.adminService.loadAdminData();
      if (viewName === 'landing') {
        setTimeout(() => {
          this.renderLandingPreviewChart();
          if (window.landingAnimation) {
            window.landingAnimation.resize();
            window.landingAnimation.start();
          }
        }, 80);
      } else {
        if (window.landingAnimation) {
          window.landingAnimation.stop();
        }
      }
    }
  }

  // --- 1. Custom Compare View Loader ---
  async loadCustomCompareView() {
    if (window.customCompare) {
      window.customCompare.renderAll();
      window.customCompare.filterCompanySelector('', 'all');
    }
  }

  // --- 2. Products & Category Explorer View Loader ---
  async loadCategoryExplorerView(selectedCategory = 'all') {
    const grid = document.getElementById('category-products-grid');
    if (!grid) return;

    const res = await window.companiesDB.search('', selectedCategory, 24);
    
    grid.innerHTML = res.companies.map(c => `
      <div class="feature-box">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            ${window.getCompanyLogoHtml ? window.getCompanyLogoHtml(c, 'md') : ''}
            <div>
              <strong style="font-size: 1.05rem; color: var(--text-primary); letter-spacing: -0.01em; display: block;">${c.name}</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${c.categoryTag || c.category}</span>
            </div>
          </div>
          <span class="badge ${c.netSentiment >= 80 ? 'badge-pos' : 'badge-neu'}">${c.netSentiment}% Sent</span>
        </div>
        
        <p style="font-size: 0.84rem; color: var(--text-secondary); margin-bottom: 0.95rem; line-height: 1.55;">${c.description}</p>
        
        <div style="background: var(--bg-input); border-radius: var(--radius-md); padding: 0.75rem 0.9rem; margin-bottom: 1rem; border: 1px solid var(--border-subtle);">
          <div style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.35rem; letter-spacing: 0.05em;">Flagship Products:</div>
          ${(c.products || []).slice(0, 2).map(p => `
            <div style="font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <div style="display: flex; align-items: center; gap: 0.35rem;">
                ${window.getProductLogoHtml ? window.getProductLogoHtml(p, c, 'sm') : ''}
                <span style="color: var(--text-primary); font-weight: 600;">${p.name}</span>
              </div>
              <span style="color: var(--primary); font-family: var(--font-mono); font-weight: 600; font-size: 0.78rem;">${p.pricing}</span>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="window.customCompare.addToBasket('${c.id}'); window.vantageApp.switchView('custom-compare');">
            + Compare
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.customCompare.openProductDetailsModal('${c.id}')">
            Inspect (${(c.products || []).length})
          </button>
        </div>
      </div>
    `).join('');
  }

  filterCategoryExplorer(cat, btnEl) {
    document.querySelectorAll('.category-pill-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    this.loadCategoryExplorerView(cat);
  }

  // --- 3. Overview Dashboard View Loader ---
  async loadOverviewView() {
    // Trigger animated count up numbers
    const totalComps = window.companiesDB ? (await window.companiesDB.count()) || 1299 : 1299;
    this.animateCountUp('kpi-companies-val', totalComps, '+');
    this.animateCountUp('kpi-products-val', 2577, '+');
    this.animateCountUp('kpi-sent-val', 84.6, '%', true);

    this.renderCharts();

    const cloudEl = document.getElementById('overview-keyphrase-cloud');
    if (cloudEl) {
      const topPhrases = [
        { text: 'Reasoning Ability', score: '+96%' },
        { text: 'Azure Blob Integration', score: '+94%' },
        { text: 'Code Generation', score: '+92%' },
        { text: 'Multimodal Latency', score: '+88%' },
        { text: 'Open-Weight Efficiency', score: '+91%' },
        { text: 'Rate Limit Volatility', score: '-65%' },
        { text: 'IAM Setup Overhead', score: '-58%' }
      ];
      cloudEl.innerHTML = topPhrases.map(p => `
        <span class="keyphrase-chip" onclick="window.vantageAI.open(); window.vantageAI.sendUserMessage('Tell me about customer feedback on ${p.text}');">
          ${p.text}
          <span class="chip-score" style="color: ${p.score.startsWith('+') ? 'var(--sentiment-pos)' : 'var(--sentiment-neg)'};">${p.score}</span>
        </span>
      `).join('');
    }
  }

  renderCharts() {
    window.vantageDB.getAll('competitors').then(competitors => {
      window.vantageCharts.renderRadarChart('radar-chart-canvas', competitors);
      window.vantageCharts.renderSentimentTrendChart('sentiment-trend-canvas');
      window.vantageCharts.renderMarketShareDonut('donut-chart-canvas', competitors);
    });
  }

  renderLandingPreviewChart() {
    window.vantageDB.getAll('competitors').then(competitors => {
      window.vantageCharts.renderRadarChart('landing-preview-radar', competitors);
    });
  }

  // --- 4. Anchor Matrix View Loader ---
  async loadMatrixView() {
    const tbody = document.getElementById('matrix-tbody');
    if (!tbody) return;

    const competitors = await window.vantageDB.getAll('competitors');
    tbody.innerHTML = competitors.map(c => `
      <tr>
        <td>
          <div class="competitor-brand-cell">
            ${window.getCompanyLogoHtml ? window.getCompanyLogoHtml(c, 'md') : ''}
            <div>
              <div style="font-weight: 700; color: var(--text-primary);">${c.name}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${c.category}</div>
            </div>
          </div>
        </td>
        <td>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${c.netSentiment}%</div>
          <div class="sentiment-meter-bar" style="width: 100px;">
            <div class="sentiment-segment pos" style="width: ${c.posSentiment}%;"></div>
            <div class="sentiment-segment neu" style="width: ${c.neuSentiment}%;"></div>
            <div class="sentiment-segment neg" style="width: ${c.negSentiment}%;"></div>
          </div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary); font-family: var(--font-mono); font-size: 0.86rem;">${c.monthlyPricing}</div>
        </td>
        <td>
          <span class="badge ${c.radarScores.aiReadiness >= 90 ? 'badge-pos' : 'badge-neu'}">
            Score: ${c.radarScores.aiReadiness}/100
          </span>
        </td>
        <td>
          <ul style="font-size: 0.82rem; color: var(--sentiment-pos); list-style: disc; margin-left: 1rem;">
            ${(c.pros || []).slice(0, 2).map(p => `<li>${p}</li>`).join('')}
          </ul>
        </td>
        <td>
          <ul style="font-size: 0.82rem; color: var(--sentiment-neg); list-style: disc; margin-left: 1rem;">
            ${(c.cons || []).slice(0, 2).map(co => `<li>${co}</li>`).join('')}
          </ul>
        </td>
      </tr>
    `).join('');
  }

  // --- 5. Global Reviews & Translator View Loader ---
  async loadTranslatorView() {
    const listContainer = document.getElementById('translator-reviews-list');
    if (!listContainer) return;

    const reviews = await window.vantageDB.getAll('reviews');
    this.renderReviewsList(reviews);
  }

  renderReviewsList(reviews) {
    const listContainer = document.getElementById('translator-reviews-list');
    if (!listContainer) return;

    listContainer.innerHTML = reviews.map(r => `
      <div class="review-card">
        <div class="review-header">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <strong style="color: var(--text-primary); font-size: 0.95rem;">${r.author}</strong>
            <span style="font-size: 0.82rem; color: var(--text-muted);">${r.company ? `(${r.company})` : ''} • ${r.competitorName}</span>
          </div>
          <div class="review-meta">
            <span class="badge badge-tier">${r.langName || r.lang.toUpperCase()}</span>
            <span class="badge ${r.sentiment === 'positive' ? 'badge-pos' : r.sentiment === 'negative' ? 'badge-neg' : 'badge-neu'}">
              ${r.sentiment.toUpperCase()} (${(r.sentimentScore * 100).toFixed(0)}%)
            </span>
            <span style="color: var(--text-muted); font-size: 0.78rem;">${r.date}</span>
          </div>
        </div>

        <div class="review-body">
          <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.25rem;">Original (${r.langName}):</div>
          <blockquote style="font-style: italic; color: var(--text-primary); border-left: 3px solid var(--border-strong); padding-left: 0.75rem;">
            "${r.sourceText}"
          </blockquote>
        </div>

        <div id="trans-block-${r.id}" class="translation-box" style="${r.isTranslated ? 'display: block;' : 'display: none;'}">
          <div class="translation-box-header">
            <span>⚡ AZURE NEURAL TRANSLATOR (TO ENGLISH)</span>
            <span>Accuracy: 99.4%</span>
          </div>
          <div style="font-size: 0.92rem; color: var(--text-primary); line-height: 1.55;" id="trans-text-${r.id}">
            ${r.translatedText || ''}
          </div>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.75rem;">
          ${(r.aspects || []).map(a => `
            <span class="badge ${a.sentiment === 'positive' ? 'badge-pos' : 'badge-neg'}" style="font-size: 0.72rem;">
              ${a.aspect}: ${a.sentiment === 'positive' ? 'Positive (+' : 'Negative ('}${(a.score * 100).toFixed(0)}%)
            </span>
          `).join('')}
        </div>

        <div style="margin-top: 0.95rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-sm" onclick="window.vantageApp.translateReviewSingle('${r.id}')">
            🌐 ${r.isTranslated ? 'Re-Translate with Azure API' : 'Translate with Azure Translator'}
          </button>
          <button class="btn btn-ghost btn-sm" onclick="window.vantageAI.open(); window.vantageAI.sendUserMessage('Analyze customer review from ${r.author} regarding ${r.competitorName}');">
            🤖 Ask AI About This Review
          </button>
        </div>
      </div>
    `).join('');
  }

  async translateReviewSingle(reviewId) {
    const rev = await window.vantageDB.get('reviews', reviewId);
    if (!rev) return;

    this.showToast('Calling Azure Translator API...', 'info');
    const result = await window.azureEngine.translateText(rev.sourceText, 'en');

    rev.translatedText = result.translatedText;
    rev.isTranslated = true;
    await window.vantageDB.put('reviews', rev);

    const transBlock = document.getElementById(`trans-block-${reviewId}`);
    const transText = document.getElementById(`trans-text-${reviewId}`);
    if (transBlock && transText) {
      transText.textContent = result.translatedText;
      transBlock.style.display = 'block';
    }

    this.showToast(`Translated review by ${rev.author} into English!`, 'success');
  }

  // --- 6. Azure Blob Storage Explorer View Loader ---
  async loadBlobsView() {
    const tbody = document.getElementById('blobs-tbody');
    if (!tbody) return;

    const blobs = await window.vantageDB.getAll('blobs');
    tbody.innerHTML = blobs.map(b => `
      <tr>
        <td>
          <div class="blob-info">
            <span style="font-size: 1.25rem;">📄</span>
            <div>
              <div class="blob-name">${b.name}</div>
              <div class="blob-meta">
                <span>Container: <strong>/${b.container}</strong></span>
                <span>Type: ${b.contentType}</span>
              </div>
            </div>
          </div>
        </td>
        <td>
          <span style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-secondary);">${b.size}</span>
        </td>
        <td>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${new Date(b.lastModified).toLocaleDateString()}</span>
        </td>
        <td>
          <span class="badge badge-azure">${b.status}</span>
        </td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn btn-secondary btn-sm" onclick="window.vantageApp.inspectBlobModal('${b.id}')">
              Inspect Raw JSON
            </button>
            <button class="btn btn-ghost btn-sm" onclick="window.vantageApp.downloadBlobMock('${b.name}')">
              ⬇ Download
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async inspectBlobModal(blobId) {
    const blob = await window.vantageDB.get('blobs', blobId);
    if (!blob) return;

    const modalTitle = document.getElementById('blob-inspect-title');
    const modalCode = document.getElementById('blob-inspect-code');

    if (modalTitle) modalTitle.textContent = `Azure Blob: /${blob.container}/${blob.name}`;
    if (modalCode) {
      modalCode.textContent = blob.rawContent || JSON.stringify(blob, null, 2);
    }

    this.openModal('blob-inspector-modal');
  }

  downloadBlobMock(filename) {
    this.showToast(`Downloaded '${filename}' to local workspace.`, 'success');
  }

  updatePricingCycle(isAnnual) {
    const p1 = document.getElementById('price-starter-val');
    const p2 = document.getElementById('price-pro-val');
    const p3 = document.getElementById('price-ent-val');

    if (isAnnual) {
      if (p1) p1.textContent = '0';
      if (p2) p2.textContent = '49';
      if (p3) p3.textContent = '199';
      document.querySelectorAll('.price-cycle').forEach(el => el.textContent = '/month (billed annually: save 20%)');
    } else {
      if (p1) p1.textContent = '0';
      if (p2) p2.textContent = '59';
      if (p3) p3.textContent = '249';
      document.querySelectorAll('.price-cycle').forEach(el => el.textContent = '/month');
    }
  }

  // --- Subscription Checkout (For Users, Not Admin) ---
  openCheckoutModal(planName, monthlyPrice, annualPrice) {
    // 1. If Admin, show notice - no checkout needed!
    if (window.vantageAuth.isAdmin()) {
      this.showToast('👑 Admin Account (Abhinav): You already possess full unlimited Enterprise Suite access without billing.', 'info');
      return;
    }

    // 2. If not signed in, prompt sign in / sign up
    if (!window.vantageAuth.isAuthenticated()) {
      window.vantageAuth.openAuthModal('signup');
      this.showToast(`Please Sign In or Sign Up to subscribe to ${planName}.`, 'info');
      return;
    }

    // 3. Determine billing cycle
    const isAnnual = document.getElementById('billing-cycle-toggle')?.checked || false;
    const isFree = monthlyPrice === 0;

    let subtotalText = '';
    let totalText = '';
    let cycleLabel = '';

    if (isFree) {
      subtotalText = '$0.00';
      totalText = '$0.00';
      cycleLabel = 'Free Lifetime Access (Azure F0 Tier)';
    } else if (isAnnual) {
      const fullAnnualPrice = annualPrice * 12;
      subtotalText = `$${fullAnnualPrice}.00 ($${annualPrice}/mo)`;
      totalText = `$${fullAnnualPrice}.00`;
      cycleLabel = 'Annual Billing (20% Discount Included)';
    } else {
      subtotalText = `$${monthlyPrice}.00`;
      totalText = `$${monthlyPrice}.00`;
      cycleLabel = 'Monthly Recurring Billing';
    }

    // Populate Checkout Modal
    const planNameEl = document.getElementById('checkout-plan-name');
    const cycleLabelEl = document.getElementById('checkout-cycle-label');
    const planPriceEl = document.getElementById('checkout-plan-price');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total-price');
    const submitBtn = document.getElementById('checkout-submit-btn');

    if (planNameEl) planNameEl.textContent = planName;
    if (cycleLabelEl) cycleLabelEl.textContent = cycleLabel;
    if (planPriceEl) planPriceEl.textContent = isFree ? '$0.00' : (isAnnual ? `$${annualPrice}/mo` : `$${monthlyPrice}/mo`);
    if (subtotalEl) subtotalEl.textContent = subtotalText;
    if (totalEl) totalEl.textContent = totalText;
    if (submitBtn) submitBtn.textContent = isFree ? '🚀 Activate Free Lifetime Tier' : `🔒 Complete Secure Payment (${totalText})`;

    this.activeCheckout = {
      planName,
      monthlyPrice,
      annualPrice,
      isAnnual,
      totalText
    };

    this.openModal('transaction-modal');
  }

  async processPaymentSubmit(event) {
    event.preventDefault();
    if (!this.activeCheckout) return;

    const submitBtn = document.getElementById('checkout-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Processing Secure 256-Bit SSL Payment...';
    }

    setTimeout(async () => {
      const user = window.vantageAuth.getUser();
      if (user) {
        user.tier = this.activeCheckout.planName;
        await window.vantageDB.put('users', user);
        window.vantageAuth.currentUser = user;
        localStorage.setItem('vantage_auth_session', JSON.stringify(user));
        window.vantageAuth.updateUI();

        // Record Audit transaction log
        await window.vantageDB.put('logs', {
          timestamp: new Date().toLocaleString(),
          type: 'SUCCESS',
          service: 'Payment Gateway',
          message: `User ${user.name} (${user.email}) successfully subscribed to ${this.activeCheckout.planName} (${this.activeCheckout.totalText}).`
        });
      }

      if (submitBtn) {
        submitBtn.disabled = false;
      }

      this.closeModal('transaction-modal');
      this.showToast(`🎉 Payment Successful! Your account has been upgraded to ${this.activeCheckout.planName}.`, 'success');
      this.switchView('custom-compare');
    }, 700);
  }

  async exportExecutiveReport() {
    this.showToast('Generating printable Executive Market Intelligence Report...', 'info');
    setTimeout(() => {
      window.print();
    }, 600);
  }

  refreshDashboard() {
    if (this.currentView === 'overview') this.loadOverviewView();
    if (this.currentView === 'custom-compare') this.loadCustomCompareView();
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// Global App instance
window.vantageApp = new VantageApp();

// Close user profile and theme dropdowns when clicking outside
document.addEventListener('click', (e) => {
  const userMenu = document.getElementById('user-dropdown-menu');
  const userTrigger = document.getElementById('user-menu-trigger');
  if (userMenu && userTrigger && !userTrigger.contains(e.target) && !userMenu.contains(e.target)) {
    userMenu.classList.remove('active');
  }
  
  const themeMenu = document.getElementById('theme-dropdown-menu');
  const themeBtn = document.querySelector('.theme-select-btn');
  if (themeMenu && themeBtn && !themeBtn.contains(e.target) && !themeMenu.contains(e.target)) {
    themeMenu.classList.remove('active');
  }
});
