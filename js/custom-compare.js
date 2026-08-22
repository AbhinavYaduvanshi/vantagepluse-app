/**
 * VantagePulse AI™ - Custom Multi-Company Comparison & Deep Analysis Engine
 * Multi-company basket, pre-built bundles, dynamic chart switching, feature gap analyzer, ROI calculator, and products inspector.
 */

class CustomComparisonEngine {
  constructor() {
    this.activeBasket = [];
    this.currentChartMode = 'radar'; // 'radar' | 'bar' | 'scatter' | 'stacked'
    this.selectedCategoryFilter = 'all';
    this.init();
  }

  async init() {
    // Default initial basket with 4 top competitors
    const all = await window.companiesDB.getAll();
    this.activeBasket = all.slice(0, 4);
  }

  // --- Basket Management ---
  async addToBasket(companyId) {
    if (this.activeBasket.some(c => c.id === companyId)) {
      window.vantageApp.showToast('Company already in comparison set', 'info');
      return;
    }
    const comp = await window.companiesDB.getById(companyId);
    if (comp) {
      this.activeBasket.push(comp);
      window.vantageApp.showToast(`Added ${comp.name} to comparison basket (${this.activeBasket.length} total)`, 'success');
      this.renderAll();
    }
  }

  removeFromBasket(companyId) {
    this.activeBasket = this.activeBasket.filter(c => c.id !== companyId);
    this.renderAll();
    window.vantageApp.showToast('Removed from comparison basket', 'info');
  }

  clearBasket() {
    this.activeBasket = [];
    this.renderAll();
    window.vantageApp.showToast('Cleared comparison basket', 'info');
  }

  async loadPresetBundle(bundleType) {
    const all = await window.companiesDB.getAll();
    const matchesCat = (c, tags) => {
      const cat = (c.category || c.categoryTag || '').toLowerCase();
      return tags.some(t => cat.includes(t.toLowerCase()));
    };

    if (bundleType === 'ai') {
      this.activeBasket = all.filter(c => matchesCat(c, ['AI', 'GenAI', 'Intelligence'])).slice(0, 5);
      window.vantageApp.showToast('Loaded "Top AI LLM Hubs" comparison set', 'success');
    } else if (bundleType === 'cloud') {
      this.activeBasket = all.filter(c => matchesCat(c, ['Cloud', 'Infra', 'Data', 'DBs', 'Lakehouse'])).slice(0, 5);
      window.vantageApp.showToast('Loaded "Cloud Hyperscalers" comparison set', 'success');
    } else if (bundleType === 'security') {
      this.activeBasket = all.filter(c => matchesCat(c, ['Cybersecurity', 'Security', 'Identity', 'Zero Trust'])).slice(0, 5);
      window.vantageApp.showToast('Loaded "Cybersecurity Titans" comparison set', 'success');
    } else if (bundleType === 'devops') {
      this.activeBasket = all.filter(c => matchesCat(c, ['DevOps', 'Tools', 'Developer'])).slice(0, 5);
      window.vantageApp.showToast('Loaded "Modern DevTools" comparison set', 'success');
    } else if (bundleType === 'fintech') {
      this.activeBasket = all.filter(c => matchesCat(c, ['FinTech', 'Payment', 'Financial'])).slice(0, 5);
      window.vantageApp.showToast('Loaded "Global FinTech" comparison set', 'success');
    }
    this.renderAll();
  }

  // --- Chart Mode Switcher ---
  setChartMode(mode) {
    this.currentChartMode = mode;
    
    // Update button states
    document.querySelectorAll('.chart-mode-btn').forEach(btn => {
      if (btn.getAttribute('data-chart-mode') === mode) {
        btn.classList.add('active');
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-secondary');
      } else {
        btn.classList.remove('active');
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
      }
    });

    this.renderChart();
  }

  // --- Render Orchestrator ---
  renderAll() {
    this.renderBasketChips();
    this.renderChart();
    this.renderFeatureGapAnalysis();
    this.renderProductMatrixTable();
    this.renderROIIndex();
  }

  renderBasketChips() {
    const container = document.getElementById('custom-basket-chips');
    if (!container) return;

    if (this.activeBasket.length === 0) {
      container.innerHTML = `
        <div style="font-size: 0.85rem; color: var(--text-muted); padding: 0.5rem 0;">
          No companies selected. Search below or choose a quick bundle to compare!
        </div>
      `;
      return;
    }

    container.innerHTML = this.activeBasket.map(c => `
      <div class="keyphrase-chip" style="border-left: 3px solid ${c.brandColor || '#0ea5e9'}; background: var(--bg-surface-elevated); padding: 0.35rem 0.75rem; display: inline-flex; align-items: center; gap: 0.45rem;">
        ${window.getCompanyLogoHtml ? window.getCompanyLogoHtml(c, 'sm') : ''}
        <strong style="color: var(--text-primary); font-size: 0.85rem;">${c.name}</strong>
        <span class="badge ${c.netSentiment >= 80 ? 'badge-pos' : 'badge-neu'}" style="font-size: 0.7rem;">${c.netSentiment}%</span>
        <button onclick="window.customCompare.removeFromBasket('${c.id}')" style="margin-left: 0.4rem; color: var(--text-muted); font-size: 0.9rem; font-weight: bold; cursor: pointer; background: none; border: none;">✕</button>
      </div>
    `).join('');
  }

  renderChart() {
    const canvasId = 'custom-compare-canvas';
    if (this.activeBasket.length === 0) return;

    if (this.currentChartMode === 'radar') {
      window.vantageCharts.renderRadarChart(canvasId, this.activeBasket);
    } else if (this.currentChartMode === 'bar') {
      window.vantageCharts.renderBarChart(canvasId, this.activeBasket);
    } else if (this.currentChartMode === 'scatter') {
      window.vantageCharts.renderScatterMatrix(canvasId, this.activeBasket);
    } else if (this.currentChartMode === 'stacked') {
      window.vantageCharts.renderStackedSentiment(canvasId, this.activeBasket);
    }
  }

  // --- Analysis Tool 1: Feature Gap Analyzer ---
  renderFeatureGapAnalysis() {
    const container = document.getElementById('feature-gap-container');
    if (!container) return;

    if (this.activeBasket.length < 2) {
      container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem;">Select at least 2 companies to generate automated Feature Gap benchmarks.</div>`;
      return;
    }

    const vectors = [
      { key: 'performance', label: 'Raw Performance' },
      { key: 'ux', label: 'User Experience & Developer UI' },
      { key: 'pricing', label: 'Pricing-to-Value ROI' },
      { key: 'reliability', label: 'Enterprise SLA & Uptime' },
      { key: 'aiReadiness', label: 'AI Architecture Readiness' }
    ];

    container.innerHTML = vectors.map(v => {
      // Find top scorer
      let best = this.activeBasket[0];
      this.activeBasket.forEach(c => {
        if ((c.radarScores?.[v.key] || 0) > (best.radarScores?.[v.key] || 0)) {
          best = c;
        }
      });

      return `
        <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.9rem; margin-bottom: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <strong style="color: var(--text-primary); font-size: 0.92rem;">${v.label}</strong>
            <span class="badge badge-azure" style="display: inline-flex; align-items: center; gap: 0.35rem;">
              ${window.getCompanyLogoHtml ? window.getCompanyLogoHtml(best, 'sm') : ''}
              Benchmark Winner: ${best.name} (${best.radarScores?.[v.key] || 0}/100)
            </span>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            ${this.activeBasket.map(c => `
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem;">
                <span style="color: var(--text-secondary); width: 140px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; display: inline-flex; align-items: center; gap: 0.35rem;">
                  ${window.getCompanyLogoHtml ? window.getCompanyLogoHtml(c, 'sm') : ''}
                  ${c.name}
                </span>
                <div style="flex: 1; margin: 0 1rem; background: var(--border-strong); height: 6px; border-radius: 3px; overflow: hidden;">
                  <div style="background: ${c.id === best.id ? 'var(--primary)' : 'var(--text-muted)'}; height: 100%; width: ${c.radarScores?.[v.key] || 0}%;"></div>
                </div>
                <span style="font-family: var(--font-mono); font-weight: 700; color: var(--text-primary); width: 45px; text-align: right;">
                  ${c.radarScores?.[v.key] || 0}
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Analysis Tool 2: Pricing ROI Index ---
  renderROIIndex() {
    const container = document.getElementById('roi-index-container');
    if (!container) return;

    if (this.activeBasket.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = this.activeBasket.map(c => {
      const avgScore = ((c.radarScores.performance + c.radarScores.ux + c.radarScores.pricing + c.radarScores.reliability + c.radarScores.aiReadiness) / 5).toFixed(1);
      const roiCategory = c.radarScores.pricing >= 80 ? 'Exceptional ROI' : c.radarScores.pricing >= 65 ? 'Balanced Enterprise' : 'Premium Tier';

      return `
        <div style="padding: 0.75rem 1rem; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 700; color: var(--text-primary); font-size: 0.9rem;">${c.name}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">Pricing: ${c.monthlyPricing} • Capability Avg: ${avgScore}/100</div>
          </div>
          <span class="badge ${roiCategory.includes('Exceptional') ? 'badge-pos' : 'badge-azure'}">
            ${roiCategory}
          </span>
        </div>
      `;
    }).join('');
  }

  // --- Product Matrix Table ---
  renderProductMatrixTable() {
    const tbody = document.getElementById('custom-matrix-tbody');
    if (!tbody) return;

    if (this.activeBasket.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No companies selected</td></tr>`;
      return;
    }

    tbody.innerHTML = this.activeBasket.map(c => `
      <tr>
        <td>
          <div class="competitor-brand-cell">
            ${window.getCompanyLogoHtml ? window.getCompanyLogoHtml(c, 'md') : ''}
            <div>
              <div style="font-weight: 700; color: var(--text-primary);">${c.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${c.category} • ${c.hq}</div>
            </div>
          </div>
        </td>
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${c.netSentiment}%</div>
          <div class="sentiment-meter-bar" style="width: 90px;">
            <div class="sentiment-segment pos" style="width: ${c.posSentiment}%;"></div>
            <div class="sentiment-segment neu" style="width: ${c.neuSentiment}%;"></div>
            <div class="sentiment-segment neg" style="width: ${c.negSentiment}%;"></div>
          </div>
        </td>
        <td>
          <span style="font-weight: 600; color: var(--text-primary);">${c.monthlyPricing}</span>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 0.3rem;">
            ${(c.products || []).slice(0, 2).map(p => `
              <div style="font-size: 0.8rem; display: flex; align-items: center; gap: 0.35rem;">
                ${window.getProductLogoHtml ? window.getProductLogoHtml(p, c, 'sm') : ''}
                <strong style="color: var(--text-primary);">${p.name}</strong>: 
                <span style="color: var(--text-muted);">${p.pricing}</span>
              </div>
            `).join('')}
          </div>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="window.customCompare.openProductDetailsModal('${c.id}')">
            📦 Inspect All ${(c.products || []).length} Products
          </button>
        </td>
      </tr>
    `).join('');
  }

  // --- Product Details Drawer / Modal ---
  async openProductDetailsModal(companyId) {
    const comp = await window.companiesDB.getById(companyId);
    if (!comp) return;

    const modalTitle = document.getElementById('products-modal-title');
    const modalList = document.getElementById('products-modal-list');

    if (modalTitle) {
      modalTitle.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          ${window.getCompanyLogoHtml ? window.getCompanyLogoHtml(comp, 'md') : ''}
          <span>${comp.name} - Complete Product Catalog (${(comp.products || []).length} Products)</span>
        </div>
      `;
    }
    if (modalList) {
      modalList.innerHTML = (comp.products || []).map(p => `
        <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.2rem; margin-bottom: 0.85rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <div style="display: flex; align-items: center; gap: 0.55rem;">
              ${window.getProductLogoHtml ? window.getProductLogoHtml(p, comp, 'sm') : ''}
              <strong style="font-size: 1.05rem; color: var(--text-primary);">${p.name}</strong>
            </div>
            <span class="badge badge-pos">Satisfaction: ${(parseFloat(p.sentimentScore || p.rating ? (p.rating / 5) : 0.85) * 100).toFixed(0)}%</span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.6rem;">${p.description}</div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-family: var(--font-mono); font-weight: 700; color: var(--primary); font-size: 0.9rem;">Pricing: ${p.pricing}</span>
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
              ${(p.features || []).map(f => `<span class="badge badge-azure" style="font-size: 0.7rem;">${f}</span>`).join('')}
            </div>
          </div>
        </div>
      `).join('');
    }

    window.vantageApp.openModal('company-products-modal');
  }

  // --- Live Search Auto-Filter ---
  async filterCompanySelector(query, category) {
    const container = document.getElementById('company-selector-results');
    if (!container) return;

    const res = await window.companiesDB.search(query, category, 18);
    container.innerHTML = res.companies.map(c => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.55rem 0.85rem; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); margin-bottom: 0.35rem;">
        <div style="display: flex; align-items: center; gap: 0.65rem;">
          ${window.getCompanyLogoHtml ? window.getCompanyLogoHtml(c, 'sm') : ''}
          <div>
            <div style="font-weight: 700; color: var(--text-primary); font-size: 0.88rem;">${c.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${c.categoryTag || c.category} • Sent: ${c.netSentiment}%</div>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="window.customCompare.addToBasket('${c.id}')">
          + Add
        </button>
      </div>
    `).join('');
  }

  // --- Custom File Upload Parser (JSON / CSV / TXT) ---
  async handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const banner = document.getElementById('upload-status-banner');
    const bannerText = document.getElementById('upload-status-text');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target.result;
        let parsedCompanies = [];

        if (file.name.endsWith('.json')) {
          const json = JSON.parse(content);
          if (Array.isArray(json)) {
            parsedCompanies = json;
          } else if (typeof json === 'object') {
            parsedCompanies = [json];
          }
        } else if (file.name.endsWith('.csv')) {
          // Parse CSV
          const lines = content.split('\n').filter(l => l.trim());
          if (lines.length > 1) {
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
              if (cols.length >= 2 && cols[0]) {
                const compObj = {
                  name: cols[0],
                  category: cols[1] || 'Enterprise AI & LLM Platforms',
                  marketShare: parseFloat(cols[2]) || 3.5,
                  netSentiment: parseFloat(cols[3]) || 80,
                  monthlyPricing: cols[4] || '$100 - $1,000/mo',
                  description: cols[5] || 'Custom uploaded competitor.'
                };
                parsedCompanies.push(compObj);
              }
            }
          }
        } else {
          // Parse TXT as simple company specification
          const nameMatch = content.match(/Company Name:\s*([^\n]+)/i) || content.match(/Name:\s*([^\n]+)/i);
          const name = nameMatch ? nameMatch[1].trim() : file.name.replace(/\.[^/.]+$/, "");
          parsedCompanies.push({
            name,
            category: 'Enterprise AI & LLM Platforms',
            marketShare: 4.5,
            netSentiment: 82,
            monthlyPricing: '$120 - $1,500/mo',
            description: content.substring(0, 180)
          });
        }

        if (parsedCompanies.length === 0) {
          throw new Error('No valid company entries found in the uploaded file.');
        }

        let addedCount = 0;
        for (const raw of parsedCompanies) {
          const compName = raw.name || 'Custom Ingested Company';
          const newComp = {
            id: `comp-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: compName,
            logoText: compName.substring(0, 2).toUpperCase(),
            brandColor: raw.brandColor || '#38bdf8',
            category: raw.category || 'Enterprise AI & LLM Platforms',
            categoryTag: raw.category || 'AI & GenAI',
            marketShare: parseFloat(raw.marketShare) || 4.2,
            netSentiment: parseFloat(raw.netSentiment) || 82,
            posSentiment: 75,
            neuSentiment: 15,
            negSentiment: 10,
            radarScores: raw.radarScores || {
              performance: Math.floor(75 + Math.random() * 20),
              ux: Math.floor(70 + Math.random() * 25),
              pricing: Math.floor(65 + Math.random() * 30),
              reliability: Math.floor(78 + Math.random() * 18),
              support: Math.floor(70 + Math.random() * 25),
              aiReadiness: Math.floor(80 + Math.random() * 18)
            },
            monthlyPricing: raw.monthlyPricing || '$100 - $1,200/mo',
            description: raw.description || `Custom uploaded intelligence dataset for ${compName}.`,
            pros: raw.pros || ['Custom validated architecture', 'Specialized enterprise integration'],
            cons: raw.cons || ['Under continuous evaluation'],
            products: raw.products || [
              {
                id: `p-cust-${Date.now()}-1`,
                name: `${compName} Enterprise Suite`,
                pricing: raw.monthlyPricing ? raw.monthlyPricing.split(' - ')[0] + '/mo' : '$100/mo',
                description: `Flagship product from uploaded dataset.`,
                rating: 4.6,
                features: ['Custom API', 'High SLA', 'Telemetry Pipeline']
              }
            ]
          };

          // Save to local database
          await window.companiesDB.addCompany(newComp);

          // Sync with backend if available
          if (window.vantageApi) {
            await window.vantageApi.ingestCompany(newComp);
          }

          // Add to active basket
          if (!this.activeBasket.some(c => c.name.toLowerCase() === compName.toLowerCase())) {
            this.activeBasket.push(newComp);
            addedCount++;
          }
        }

        this.renderAll();

        if (banner && bannerText) {
          banner.style.display = 'flex';
          bannerText.textContent = `✅ Successfully ingested ${parsedCompanies.length} company dataset (${addedCount} added to active comparison basket)!`;
        }

        if (window.vantageApp) {
          window.vantageApp.showToast(`Ingested ${parsedCompanies.length} company dataset into comparison basket!`, 'success');
        }

      } catch (err) {
        console.error('File parse error', err);
        if (banner && bannerText) {
          banner.style.display = 'flex';
          banner.style.background = 'var(--sentiment-neg-bg)';
          banner.style.borderColor = 'var(--sentiment-neg-border)';
          banner.style.color = 'var(--sentiment-neg)';
          bannerText.textContent = `❌ Upload Failed: ${err.message}`;
        }
        if (window.vantageApp) {
          window.vantageApp.showToast(`Error parsing file: ${err.message}`, 'warning');
        }
      } finally {
        event.target.value = '';
      }
    };

    reader.readAsText(file);
  }

  // --- Sample File Template Downloader ---
  downloadTemplate(format = 'json') {
    let content = '';
    let filename = '';
    let mime = '';

    if (format === 'json') {
      filename = 'vantagepulse_custom_company_template.json';
      mime = 'application/json';
      content = JSON.stringify([
        {
          name: "OmniMatrix AI",
          category: "Enterprise AI & LLM Platforms",
          marketShare: 8.5,
          netSentiment: 86.4,
          monthlyPricing: "$150 - $1,200/mo",
          description: "Autonomous agent execution platform with built-in Azure Cognitive integrations.",
          pros: ["Sub-20ms latency", "Enterprise SAML SSO"],
          cons: ["High memory footprint during batch inference"],
          radarScores: {
            performance: 92,
            ux: 88,
            pricing: 79,
            reliability: 91,
            support: 84,
            aiReadiness: 95
          },
          products: [
            {
              name: "OmniMatrix Core Cloud",
              pricing: "$150/mo",
              description: "Autonomous reasoning engine with streaming API.",
              features: ["Real-time NLP", "99.9% Uptime", "Zero-data retention"]
            }
          ]
        }
      ], null, 2);
    } else {
      filename = 'vantagepulse_custom_company_template.csv';
      mime = 'text/csv';
      content = `Company Name,Category,Market Share (%),Net Sentiment (%),Monthly Pricing,Description\n` +
        `"OmniMatrix AI","Enterprise AI & LLM Platforms",8.5,86.4,"$150 - $1,200/mo","Autonomous reasoning agent platform with Azure connectors"\n` +
        `"HyperScale Cloud","Cloud & AI Infrastructure",12.2,81.0,"$200 - $2,500/mo","High-throughput distributed compute platform"`;
    }

    const blob = new Blob([content], { type: mime });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (window.vantageApp) {
      window.vantageApp.showToast(`Downloaded sample ${format.toUpperCase()} template!`, 'info');
    }
  }
}

// Global Custom Compare instance
window.customCompare = new CustomComparisonEngine();

