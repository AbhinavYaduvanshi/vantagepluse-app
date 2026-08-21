/**
 * VantagePulse AI™ - Backend REST API Client & Dual-Mode Synchronizer
 * 
 * Automatically detects whether the backend server (Node.js REST API on http://localhost:3000)
 * is running. If online, routes operations to the backend REST API; otherwise falls back to IndexedDB.
 */

class VantageApiClient {
  constructor() {
    this.baseUrl = window.location.protocol.startsWith('http') 
      ? window.location.origin 
      : 'http://localhost:3000';
    this.isBackendOnline = false;
    this.checkHealth();
  }

  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`, { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        this.isBackendOnline = true;
        console.log(`[API Client] Connected to Backend REST Server (${data.version})`);
        return true;
      }
    } catch (e) {
      this.isBackendOnline = false;
    }
    return false;
  }

  // --- Companies API ---
  async getCompanies(search = '', category = 'all', limit = 50, offset = 0) {
    if (this.isBackendOnline) {
      try {
        const params = new URLSearchParams({ search, category, limit, offset });
        const res = await fetch(`${this.baseUrl}/api/companies?${params}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Backend fetch failed, falling back to local DB', e);
      }
    }
    return null; // Fall back to companiesDB
  }

  async getCompanyById(id) {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/api/companies/${id}`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return null;
  }

  async ingestCompany(companyData) {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/api/companies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companyData)
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return null;
  }

  // --- Reviews API ---
  async getReviews(companyId = null, language = null) {
    if (this.isBackendOnline) {
      try {
        const params = new URLSearchParams();
        if (companyId) params.append('companyId', companyId);
        if (language) params.append('language', language);
        const res = await fetch(`${this.baseUrl}/api/reviews?${params}`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return null;
  }

  async submitReview(reviewData) {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/api/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reviewData)
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return null;
  }

  // --- Azure NLP Proxy API ---
  async analyzeSentiment(text) {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/api/azure/sentiment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return null;
  }

  async translateText(text, toLanguage = 'en') {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/api/azure/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, to: toLanguage })
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return null;
  }

  // --- Azure Blobs API ---
  async getBlobContainers() {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/api/azure/blobs`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return null;
  }

  // --- Auth & Session Telemetry API ---
  async logAuthEvent(user, action = 'LOGIN') {
    if (this.isBackendOnline) {
      try {
        const endpoint = action === 'LOGIN' ? '/api/auth/login' : '/api/auth/logout';
        await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...user, action })
        });
      } catch (e) {}
    }
  }

  async getAuthLogs(role = 'Admin') {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/api/auth/logs?role=${role}`, {
          headers: { 'x-vantage-role': role }
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return null;
  }

  // --- Search Analytics Telemetry ---
  async logSearchQuery(query) {
    if (this.isBackendOnline && query) {
      try {
        await fetch(`${this.baseUrl}/api/analytics/search-log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });
      } catch (e) {}
    }
  }

  async getSearchTrends() {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/api/analytics/search-trends`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return null;
  }
}

// Global API Client
window.vantageApi = new VantageApiClient();
