/**
 * VantagePulse AI™ - Protected Admin Console & Azure Quota Manager
 * Strictly restricted to users with the 'Admin' role.
 */

class AdminConsoleService {
  constructor() {}

  async loadAdminData() {
    if (!window.vantageAuth || !window.vantageAuth.isAdmin()) {
      console.warn('Access denied: Admin role required');
      return;
    }

    await this.renderUsersTable();
    await this.renderServicesTable();
    await this.renderQuotaMeters();
    await this.renderAuthActivityTable();
    await this.renderSystemLogs();
    this.loadAzureApiConfig();
  }

  // 1. User Management Table
  async renderUsersTable() {
    const tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;

    const users = await window.vantageDB.getAll('users');
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${u.name}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">${u.email}</div>
        </td>
        <td>
          <select class="form-select" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; width: auto;" onchange="window.adminService.updateUserRole('${u.id}', this.value)">
            <option value="Admin" ${u.role === 'Admin' ? 'selected' : ''}>👑 Admin</option>
            <option value="Pro Analyst" ${u.role === 'Pro Analyst' ? 'selected' : ''}>⚡ Pro Analyst</option>
            <option value="User" ${u.role === 'User' ? 'selected' : ''}>👤 User (Student)</option>
          </select>
        </td>
        <td>
          <span class="badge ${u.tier.includes('Enterprise') ? 'badge-azure' : 'badge-tier'}">${u.tier}</span>
        </td>
        <td>
          <span class="badge ${u.active ? 'badge-pos' : 'badge-neg'}">${u.active ? 'Active' : 'Disabled'}</span>
        </td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="window.adminService.toggleUserStatus('${u.id}')">
            ${u.active ? 'Disable' : 'Enable'}
          </button>
        </td>
      </tr>
    `).join('');
  }

  async updateUserRole(userId, newRole) {
    const user = await window.vantageDB.get('users', userId);
    if (user) {
      user.role = newRole;
      if (newRole === 'Admin') user.tier = 'Enterprise Suite';
      else if (newRole === 'Pro Analyst') user.tier = 'Pro Intelligence';
      else user.tier = 'Free Starter Tier';

      await window.vantageDB.put('users', user);
      await window.vantageDB.put('logs', {
        timestamp: new Date().toLocaleTimeString(),
        type: 'WARNING',
        service: 'RBAC Security',
        message: `Admin modified role of '${user.email}' to [${newRole}].`
      });
      window.vantageApp.showToast(`Updated ${user.name}'s role to ${newRole}`, 'success');
      this.renderUsersTable();
    }
  }

  async toggleUserStatus(userId) {
    const user = await window.vantageDB.get('users', userId);
    if (user) {
      user.active = !user.active;
      await window.vantageDB.put('users', user);
      window.vantageApp.showToast(`User ${user.name} is now ${user.active ? 'Active' : 'Disabled'}`, 'info');
      this.renderUsersTable();
    }
  }

  // 2. Azure Student Quota & Free Tier Meters
  async renderQuotaMeters() {
    const engine = window.azureEngine;
    if (!engine) return;

    // Text Analytics Meter
    const textUsed = engine.quotas.textAnalyticsUsed;
    const textLimit = engine.quotas.textAnalyticsLimit;
    const textPct = Math.min(100, ((textUsed / textLimit) * 100)).toFixed(1);

    const elTextVal = document.getElementById('quota-text-val');
    const elTextBar = document.getElementById('quota-text-bar');
    if (elTextVal) elTextVal.textContent = `${textUsed.toLocaleString()} / ${textLimit.toLocaleString()} records (${textPct}%)`;
    if (elTextBar) elTextBar.style.width = `${textPct}%`;

    // Translator Chars Meter
    const transUsed = engine.quotas.translatorCharsUsed;
    const transLimit = engine.quotas.translatorCharsLimit;
    const transPct = Math.min(100, ((transUsed / transLimit) * 100)).toFixed(1);

    const elTransVal = document.getElementById('quota-trans-val');
    const elTransBar = document.getElementById('quota-trans-bar');
    if (elTransVal) elTransVal.textContent = `${(transUsed / 1000).toFixed(0)}k / ${(transLimit / 1000000).toFixed(0)}M chars (${transPct}%)`;
    if (elTransBar) elTransBar.style.width = `${transPct}%`;

    // Blob Storage Meter
    const blobUsed = engine.quotas.blobStorageMBUsed;
    const blobLimit = engine.quotas.blobStorageMBLimit;
    const blobPct = Math.min(100, ((blobUsed / blobLimit) * 100)).toFixed(1);

    const elBlobVal = document.getElementById('quota-blob-val');
    const elBlobBar = document.getElementById('quota-blob-bar');
    if (elBlobVal) elBlobVal.textContent = `${blobUsed.toFixed(1)} MB / ${blobLimit.toLocaleString()} MB (${blobPct}%)`;
    if (elBlobBar) elBlobBar.style.width = `${blobPct}%`;
  }

  // 3. User Authentication Activity Audit Trail (Admin Restricted)
  async renderAuthActivityTable() {
    const tbody = document.getElementById('admin-auth-logs-tbody');
    if (!tbody) return;

    const authLogs = await window.vantageDB.getAuthLogs();
    if (authLogs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
            No login or logout records logged yet.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = authLogs.slice(0, 15).map(l => `
      <tr>
        <td>
          <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary);">${l.timestamp}</span>
        </td>
        <td>
          <div>
            <strong style="color: var(--text-primary);">${l.name}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${l.email}</div>
          </div>
        </td>
        <td>
          <span class="badge ${l.role === 'Admin' ? 'badge-azure' : 'badge-neu'}">${l.role}</span>
        </td>
        <td>
          <span class="badge ${l.action === 'LOGIN' ? 'badge-pos' : 'badge-neg'}">
            ${l.action === 'LOGIN' ? '🟢 LOGIN' : '🔴 LOGOUT'}
          </span>
        </td>
        <td>
          <span style="font-size: 0.78rem; font-family: var(--font-mono); color: var(--text-muted);">${l.ipAddress}</span>
        </td>
      </tr>
    `).join('');
  }

  // 4. Ingest Competitor Dataset
  async handleNewCompetitorSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('comp-input-name').value;
    const category = document.getElementById('comp-input-category').value;
    const pricing = document.getElementById('comp-input-pricing').value;
    const desc = document.getElementById('comp-input-desc').value;

    const colors = ['#10a37f', '#d97706', '#0078d4', '#6366f1', '#ec4899', '#10b981'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    if (!name || !desc) {
      window.vantageApp.showToast('Please fill out the required competitor fields.', 'error');
      return;
    }

    const newComp = {
      id: `comp-${Date.now()}`,
      name,
      logoText: name.substring(0, 2).toUpperCase(),
      brandColor: color,
      category: category || 'AI Technology',
      marketShare: 4.5,
      netSentiment: 75.0,
      posSentiment: 70,
      neuSentiment: 20,
      negSentiment: 10,
      radarScores: { performance: 80, ux: 75, pricing: 85, reliability: 80, support: 75, aiReadiness: 85 },
      monthlyPricing: pricing || '$100 - $1,000/mo',
      description: desc,
      pros: ['Innovative architecture', 'Competitive pricing'],
      cons: ['New to market ecosystem'],
      azureBlobRef: `azure-blob://raw-reviews/${name.toLowerCase().replace(/\s+/g, '_')}_dataset.json`
    };

    await window.vantageDB.put('competitors', newComp);

    // Also upload a Blob in Azure Blob explorer
    await window.azureEngine.uploadBlob('raw-reviews', `${name.toLowerCase().replace(/\s+/g, '_')}_dataset.json`, [
      { author: 'Analyst Feed', review: desc, sentiment: 'positive' }
    ]);

    window.vantageApp.showToast(`Competitor "${name}" ingested successfully!`, 'success');
    document.getElementById('new-competitor-modal').classList.remove('active');
    
    // Refresh app views
    if (window.vantageApp) {
      window.vantageApp.refreshDashboard();
    }
  }

  // 6. Configured Cloud & AI Services Catalog (Admin Only)
  async renderServicesTable() {
    const tbody = document.getElementById('admin-services-tbody');
    if (!tbody) return;

    const services = await window.vantageDB.getAll('services');
    if (services.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No services registered yet. Click "+ Add New Service" above.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = services.map(s => `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.9rem;">${s.name}</div>
          <div style="font-size: 0.76rem; color: var(--text-muted); max-width: 280px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${s.description || ''}</div>
        </td>
        <td>
          <span class="badge badge-azure">${s.category || 'General'}</span>
        </td>
        <td>
          <strong style="color: var(--text-secondary); font-size: 0.82rem;">${s.provider || 'Azure'}</strong>
        </td>
        <td>
          <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-muted); max-width: 220px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${s.endpoint}">
            ${s.endpoint || 'Internal Engine'}
          </div>
          <div style="font-size: 0.72rem; color: var(--primary);">${s.quota || 'Usage Tracked'}</div>
        </td>
        <td>
          <span class="badge ${s.status === 'Active' ? 'badge-pos' : s.status === 'Maintenance' ? 'badge-neu' : 'badge-neg'}">
            ${s.status === 'Active' ? '🟢 Active' : s.status === 'Maintenance' ? '🟡 Maintenance' : '🔴 Disabled'}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button class="btn btn-ghost btn-sm" title="Toggle Status" onclick="window.adminService.toggleServiceStatus('${s.id}')">
              🔄 Status
            </button>
            <button class="btn btn-ghost btn-sm" style="color: var(--sentiment-neg);" title="Remove Service" onclick="window.adminService.deleteService('${s.id}')">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async handleNewServiceSubmit(event) {
    event.preventDefault();
    if (!window.vantageAuth.isAdmin()) {
      window.vantageApp.showToast('🔒 Access Denied: Only Admin can add or modify services.', 'warning');
      return;
    }

    const name = document.getElementById('service-input-name').value.trim();
    const category = document.getElementById('service-input-category').value.trim();
    const provider = document.getElementById('service-input-provider').value.trim();
    const endpoint = document.getElementById('service-input-endpoint').value.trim();
    const quota = document.getElementById('service-input-quota').value.trim();
    const desc = document.getElementById('service-input-desc').value.trim();

    if (!name) return;

    const newService = {
      id: `srv-${Date.now()}`,
      name,
      category: category || 'AI Model & Pipeline',
      provider: provider || 'Microsoft Azure',
      endpoint: endpoint || 'https://api.azure.com/v1',
      quota: quota || 'Standard Metered',
      status: 'Active',
      description: desc || 'Admin registered cloud service.'
    };

    await window.vantageDB.put('services', newService);

    // Record audit log
    await window.vantageDB.put('logs', {
      timestamp: new Date().toLocaleString(),
      type: 'SUCCESS',
      service: 'Service Catalog',
      message: `Admin (Abhinav) added new service "${name}" (${provider}).`
    });

    window.vantageApp.showToast(`✅ Service "${name}" added to platform catalog!`, 'success');
    window.vantageApp.closeModal('new-service-modal');
    await this.renderServicesTable();
    await this.renderSystemLogs();
  }

  async toggleServiceStatus(serviceId) {
    if (!window.vantageAuth.isAdmin()) return;
    const srv = await window.vantageDB.get('services', serviceId);
    if (srv) {
      if (srv.status === 'Active') srv.status = 'Maintenance';
      else if (srv.status === 'Maintenance') srv.status = 'Disabled';
      else srv.status = 'Active';

      await window.vantageDB.put('services', srv);
      window.vantageApp.showToast(`Service "${srv.name}" set to ${srv.status}`, 'info');
      await this.renderServicesTable();
    }
  }

  async deleteService(serviceId) {
    if (!window.vantageAuth.isAdmin()) return;
    const srv = await window.vantageDB.get('services', serviceId);
    if (srv) {
      await window.vantageDB.delete('services', serviceId);
      window.vantageApp.showToast(`Removed service "${srv.name}"`, 'info');
      await this.renderServicesTable();
    }
  }

  // 7. System Logs
  async renderSystemLogs() {
    const logsContainer = document.getElementById('admin-logs-list');
    if (!logsContainer) return;

    const logs = await window.vantageDB.getAll('logs');
    logsContainer.innerHTML = logs.reverse().slice(0, 8).map(l => `
      <div style="padding: 0.6rem 0.8rem; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); font-family: var(--font-mono); font-size: 0.8rem; margin-bottom: 0.4rem;">
        <span style="color: var(--text-muted);">${l.timestamp}</span>
        <span style="color: ${l.type === 'SUCCESS' ? 'var(--sentiment-pos)' : l.type === 'WARNING' ? 'var(--sentiment-neu)' : 'var(--primary)'}; font-weight: 700; margin: 0 0.5rem;">[${l.type}]</span>
        <strong style="color: var(--text-primary);">${l.service}:</strong>
        <span style="color: var(--text-secondary); margin-left: 0.4rem;">${l.message}</span>
      </div>
    `).join('');
  }

  // 8. Azure API Settings
  loadAzureApiConfig() {
    const engine = window.azureEngine;
    const modeSelect = document.getElementById('azure-mode-select');
    const endpointInput = document.getElementById('azure-text-endpoint');
    const keyInput = document.getElementById('azure-text-key');
    const transKeyInput = document.getElementById('azure-trans-key');

    if (modeSelect) modeSelect.value = engine.mode;
    if (endpointInput) endpointInput.value = engine.textAnalyticsEndpoint;
    if (keyInput) keyInput.value = engine.textAnalyticsKey;
    if (transKeyInput) transKeyInput.value = engine.translatorKey;
  }

  saveAzureApiConfig() {
    const mode = document.getElementById('azure-mode-select').value;
    const endpoint = document.getElementById('azure-text-endpoint').value;
    const key = document.getElementById('azure-text-key').value;
    const transKey = document.getElementById('azure-trans-key').value;

    window.azureEngine.saveConfig({
      mode,
      textAnalyticsEndpoint: endpoint,
      textAnalyticsKey: key,
      translatorKey: transKey
    });

    window.vantageApp.showToast(`Azure configuration updated (${mode === 'live' ? 'Live Azure Mode' : 'Student Smart Simulation'})`, 'success');
  }
}

// Global Admin Service instance
window.adminService = new AdminConsoleService();
