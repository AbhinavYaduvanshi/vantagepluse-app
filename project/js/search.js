/**
 * VantagePulse AI™ - Global Search Engine & Search Telemetry Tracker
 * Instant indexing across 1,000+ Companies, Products, Reviews, and Azure Blobs with Ctrl+K shortcut and Trending Telemetry.
 */

class GlobalSearchService {
  constructor() {
    this.isOpen = false;
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.open();
      }
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  async open() {
    if (!window.vantageAuth?.isAuthenticated()) {
      window.vantageAuth?.openAuthModal('signin');
      window.vantageApp?.showToast('🔒 Please sign in or create an account to search our 1,000+ companies index.', 'info');
      return;
    }

    this.isOpen = true;
    const modal = document.getElementById('search-modal');
    const input = document.getElementById('search-modal-input');
    if (modal) {
      modal.classList.add('active');
      if (input) {
        input.value = '';
        input.focus();
      }
      await this.renderTrendingChips();
      this.executeSearch('');
    }
  }

  close() {
    this.isOpen = false;
    const modal = document.getElementById('search-modal');
    if (modal) modal.classList.remove('active');
  }

  async renderTrendingChips() {
    const container = document.getElementById('search-trending-chips');
    if (!container) return;

    const topSearches = await window.companiesDB.getTopSearches(6);
    container.innerHTML = topSearches.map(s => `
      <span class="keyphrase-chip" style="font-size: 0.75rem; padding: 0.2rem 0.5rem;" onclick="document.getElementById('search-modal-input').value='${s.query}'; window.vantageSearch.executeSearch('${s.query}');">
        🔥 ${s.query}
      </span>
    `).join('');
  }

  async executeSearch(query) {
    const resultsContainer = document.getElementById('search-results-list');
    if (!resultsContainer) return;

    const q = (query || '').toLowerCase().trim();

    // Track search telemetry in DB if query length >= 2
    if (q.length >= 2) {
      window.companiesDB.trackSearchQuery(q);
    }

    // Search 1,000+ companies database
    const companiesResult = await window.companiesDB.search(q, 'all', 12);
    const reviews = await window.vantageDB.getAll('reviews');
    const blobs = await window.vantageDB.getAll('blobs');

    const matchedReviews = reviews.filter(r => 
      !q || r.author.toLowerCase().includes(q) || (r.company && r.company.toLowerCase().includes(q)) || 
      (r.translatedText && r.translatedText.toLowerCase().includes(q)) || r.competitorName.toLowerCase().includes(q)
    );

    const matchedBlobs = blobs.filter(b => 
      !q || b.name.toLowerCase().includes(q) || b.container.toLowerCase().includes(q)
    );

    let html = '';

    // 1. Matched Companies Category
    if (companiesResult.companies.length > 0) {
      html += `<div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin: 0.5rem 0 0.25rem;">Companies & Products (${companiesResult.total} Total)</div>`;
      companiesResult.companies.forEach(comp => {
        html += `
          <div class="search-result-item" onclick="window.customCompare.addToBasket('${comp.id}'); window.vantageApp.switchView('custom-compare'); window.vantageSearch.close();" style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); background: var(--bg-surface-elevated); margin-bottom: 0.4rem; cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              ${window.getCompanyLogoHtml ? window.getCompanyLogoHtml(comp, 'sm') : ''}
              <div>
                <strong style="color: var(--text-primary); font-size: 0.9rem;">${comp.name}</strong>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${comp.categoryTag || comp.category} • Sent: ${comp.netSentiment}% • ${(comp.products || []).length} Products</div>
              </div>
            </div>
            <div style="display: flex; gap: 0.4rem;">
              <span class="badge badge-azure" style="font-size: 0.7rem;">+ Add to Compare</span>
            </div>
          </div>
        `;
      });
    }

    // 2. Multilingual Customer Reviews Category
    if (matchedReviews.length > 0) {
      html += `<div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin: 1rem 0 0.25rem;">Customer Reviews & Feedback (${matchedReviews.length})</div>`;
      matchedReviews.slice(0, 3).forEach(rev => {
        html += `
          <div class="search-result-item" onclick="window.vantageApp.switchView('translator'); window.vantageSearch.close();" style="padding: 0.65rem 0.85rem; border-radius: var(--radius-md); background: var(--bg-surface-elevated); margin-bottom: 0.4rem; cursor: pointer;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
              <strong style="font-size: 0.85rem; color: var(--text-primary);">${rev.author} (${rev.company || rev.competitorName})</strong>
              <span class="badge ${rev.sentiment === 'positive' ? 'badge-pos' : 'badge-neu'}" style="font-size: 0.7rem;">${rev.langName || rev.lang.toUpperCase()}</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${rev.translatedText || rev.sourceText}
            </div>
          </div>
        `;
      });
    }

    // 3. Azure Blob Files Category
    if (matchedBlobs.length > 0) {
      html += `<div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin: 1rem 0 0.25rem;">Azure Blob Storage Files (${matchedBlobs.length})</div>`;
      matchedBlobs.forEach(blob => {
        html += `
          <div class="search-result-item" onclick="window.vantageApp.switchView('blobs'); window.vantageSearch.close();" style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); background: var(--bg-surface-elevated); margin-bottom: 0.4rem; cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: var(--azure-blob);">📦</span>
              <div>
                <div style="font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-primary); font-weight: 600;">${blob.name}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Container: /${blob.container} • ${blob.size}</div>
              </div>
            </div>
            <span class="badge badge-azure" style="font-size: 0.7rem;">Inspect Blob</span>
          </div>
        `;
      });
    }

    if (!html) {
      html = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔍</div>
          <div>No matching records found across 1,000+ companies for "<strong>${query}</strong>"</div>
        </div>
      `;
    }

    resultsContainer.innerHTML = html;
  }
}

// Global Search instance
window.vantageSearch = new GlobalSearchService();
