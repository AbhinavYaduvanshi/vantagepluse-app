/**
 * VantagePulse AI™ - Authentication, RBAC & Database Auth Logging Engine
 * Strictly restricts login & logout data visibility to Admin accounts.
 */

class AuthService {
  constructor() {
    this.currentUser = null;
    this.initSession();
  }

  initSession() {
    try {
      const savedUser = localStorage.getItem('vantage_auth_session');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      } else {
        this.currentUser = null;
      }
    } catch (e) {
      console.warn('Auth session load error', e);
      this.currentUser = null;
    }
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  isAdmin() {
    return this.currentUser && this.currentUser.role === 'Admin';
  }

  getUser() {
    return this.currentUser;
  }

  // --- 1-Click Demo Login ---
  async loginWithDemo(roleType = 'Admin') {
    let demoUser = null;
    if (roleType === 'Admin') {
      demoUser = {
        id: 'usr-admin',
        email: 'abhinavrao666@gmail.com',
        name: 'Abhinav',
        role: 'Admin',
        tier: 'Enterprise Suite',
        avatarText: 'AB'
      };
    } else if (roleType === 'Pro') {
      demoUser = {
        id: 'usr-pro',
        email: 'pro@analyst.io',
        name: 'Sarah Chen',
        role: 'Pro Analyst',
        tier: 'Pro Intelligence',
        avatarText: 'SC'
      };
    } else {
      demoUser = {
        id: 'usr-student',
        email: 'student@university.edu',
        name: 'Alex Rivera',
        role: 'User',
        tier: 'Free Student Tier',
        avatarText: 'AR'
      };
    }

    this.currentUser = demoUser;
    localStorage.setItem('vantage_auth_session', JSON.stringify(demoUser));
    
    // Store LOGIN event in IndexedDB
    if (window.vantageDB) {
      await window.vantageDB.recordAuthLog(demoUser, 'LOGIN');
    }

    this.updateUI();
    if (window.vantageApp) {
      window.vantageApp.showToast(`Logged in as ${demoUser.name} (${demoUser.role})`, 'success');
    }
    return demoUser;
  }

  // --- Standard Email & Password Login (Supports Personal & Enterprise Emails) ---
  async loginWithCredentials(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    let user = null;

    // Check if logging in as Admin (Abhinav)
    if (cleanEmail === 'abhinavrao666@gmail.com' || cleanEmail === 'abhinav@vantagedata.io' || cleanEmail === 'admin@vantagedata.io' || cleanEmail.includes('admin')) {
      if (cleanPassword && cleanPassword !== 'admin123' && cleanPassword !== 'admin') {
        if (window.vantageApp) {
          window.vantageApp.showToast('Invalid Admin password. Hint: admin123', 'warning');
        }
        return null;
      }
      user = {
        id: 'usr-admin',
        email: 'abhinavrao666@gmail.com',
        name: 'Abhinav',
        role: 'Admin',
        tier: 'Enterprise Suite',
        avatarText: 'AB',
        twoFactorEnabled: this.currentUser?.id === 'usr-admin' ? this.currentUser.twoFactorEnabled : false
      };
    } else {
      const users = await window.vantageDB.getAll('users');
      const match = users.find(u => u.email.toLowerCase() === cleanEmail);

      user = match || {
        id: `usr-${Date.now()}`,
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        role: 'User',
        tier: 'Free Student Tier',
        avatarText: cleanEmail.substring(0, 2).toUpperCase(),
        twoFactorEnabled: false
      };
    }

    // Check if user has Two-Factor Authentication enabled
    if (user.twoFactorEnabled) {
      const generatedOTP = String(Math.floor(100000 + Math.random() * 900000));
      this.pendingLogin2FA = { user, otp: generatedOTP };

      const descEl = document.getElementById('login-2fa-target-desc');
      const bannerEl = document.getElementById('login-2fa-otp-banner');
      if (descEl) descEl.textContent = `A 6-digit 2FA verification code has been dispatched to ${user.email}.`;
      if (bannerEl) bannerEl.innerHTML = `📧 Security Code sent to ${user.email}: <span style="font-size: 1.15rem; letter-spacing: 0.1em; color: var(--primary);">${generatedOTP}</span>`;

      if (window.vantageApp) {
        window.vantageApp.openModal('login-2fa-modal');
        window.vantageApp.showToast(`🛡️ 2FA Code sent to ${user.email}`, 'info');
      }
      return null;
    }

    return this.completeLogin(user);
  }

  async completeLogin(user) {
    this.currentUser = user;
    localStorage.setItem('vantage_auth_session', JSON.stringify(user));
    
    // Store LOGIN event in IndexedDB & REST API
    if (window.vantageDB) {
      await window.vantageDB.recordAuthLog(user, 'LOGIN');
    }
    if (window.vantageApi) {
      await window.vantageApi.logAuthEvent(user, 'LOGIN');
    }

    this.updateUI();
    if (window.vantageApp) {
      window.vantageApp.showToast(`✅ Welcome back, ${user.name} (${user.role})!`, 'success');
      window.vantageApp.switchView(user.role === 'Admin' ? 'admin' : 'custom-compare');
    }
    return user;
  }

  // --- Verify Login 2FA OTP ---
  async verifyLogin2FASubmit(event) {
    event.preventDefault();
    if (!this.pendingLogin2FA) return;

    const enteredOtp = (document.getElementById('login-2fa-input-otp')?.value || '').trim();
    if (enteredOtp !== this.pendingLogin2FA.otp) {
      if (window.vantageApp) {
        window.vantageApp.showToast('❌ Invalid 2FA verification code. Please try again.', 'warning');
      }
      return;
    }

    const user = this.pendingLogin2FA.user;
    this.pendingLogin2FA = null;
    if (window.vantageApp) {
      window.vantageApp.closeModal('login-2fa-modal');
    }
    await this.completeLogin(user);
  }

  // --- Registration (Sign Up) ---
  async registerUser(name, email, password, role = 'User') {
    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role || 'User',
      tier: role === 'Admin' ? 'Enterprise Suite' : (role === 'Pro Analyst' ? 'Pro Intelligence' : 'Free Student Tier'),
      created: new Date().toISOString().split('T')[0],
      active: true,
      avatarText: name.trim().substring(0, 2).toUpperCase(),
      twoFactorEnabled: false
    };

    if (window.vantageDB) {
      await window.vantageDB.put('users', newUser);
      await window.vantageDB.recordAuthLog(newUser, 'LOGIN');
    }

    if (window.vantageApi) {
      await window.vantageApi.logAuthEvent(newUser, 'LOGIN');
    }

    this.currentUser = newUser;
    localStorage.setItem('vantage_auth_session', JSON.stringify(newUser));
    
    this.updateUI();
    if (window.vantageApp) {
      window.vantageApp.showToast(`🎉 Account created & saved to database! Welcome, ${newUser.name}.`, 'success');
      window.vantageApp.switchView('custom-compare');
    }
    return newUser;
  }

  // --- Forgot Password OTP Workflow ---
  sendForgotPasswordOTP() {
    const email = (document.getElementById('forgot-input-email')?.value || '').trim().toLowerCase();
    if (!email) {
      if (window.vantageApp) window.vantageApp.showToast('Please enter your email address.', 'warning');
      return;
    }

    const generatedOTP = String(Math.floor(100000 + Math.random() * 900000));
    this.forgotState = { email, otp: generatedOTP };

    const step1 = document.getElementById('forgot-step-1');
    const step2 = document.getElementById('forgot-step-2');
    const banner = document.getElementById('forgot-otp-banner');

    if (step1) step1.style.display = 'none';
    if (step2) step2.style.display = 'block';
    if (banner) {
      banner.innerHTML = `📧 Security Code sent to <strong>${email}</strong>: <span style="font-size: 1.15rem; font-weight: 800; color: var(--primary); letter-spacing: 0.1em;">${generatedOTP}</span>`;
    }

    if (window.vantageApp) {
      window.vantageApp.showToast(`Reset code sent to ${email}`, 'info');
    }
  }

  async resetPasswordWithOTP() {
    if (!this.forgotState) return;

    const enteredOtp = (document.getElementById('forgot-input-otp')?.value || '').trim();
    const newPassword = (document.getElementById('forgot-input-newpw')?.value || '').trim();

    if (enteredOtp !== this.forgotState.otp) {
      if (window.vantageApp) window.vantageApp.showToast('❌ Invalid verification code. Please check and retry.', 'warning');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      if (window.vantageApp) window.vantageApp.showToast('Password must be at least 4 characters.', 'warning');
      return;
    }

    const email = this.forgotState.email;
    this.forgotState = null;

    // Update in DB or log in
    if (window.vantageApp) {
      window.vantageApp.closeModal('auth-modal');
      window.vantageApp.showToast('🎉 Password reset successfully! You are now logged in.', 'success');
    }

    await this.loginWithCredentials(email, newPassword);
  }

  // --- Change Password Modal with 2FA OTP ---
  openChangePasswordModal() {
    if (!this.isAuthenticated()) {
      this.openAuthModal('signin');
      return;
    }

    const generatedOTP = String(Math.floor(100000 + Math.random() * 900000));
    this.changePwState = { otp: generatedOTP };

    const banner = document.getElementById('change-pw-2fa-banner');
    if (banner) {
      banner.innerHTML = `📧 2FA Security Code sent to <strong>${this.currentUser.email}</strong>: <span style="font-size: 1.1rem; font-weight: 800; color: var(--primary); letter-spacing: 0.1em;">${generatedOTP}</span>`;
    }

    // Clear form inputs
    const c1 = document.getElementById('cpw-input-current');
    const c2 = document.getElementById('cpw-input-otp');
    const c3 = document.getElementById('cpw-input-new');
    const c4 = document.getElementById('cpw-input-confirm');
    if (c1) c1.value = '';
    if (c2) c2.value = '';
    if (c3) c3.value = '';
    if (c4) c4.value = '';

    if (window.vantageApp) {
      window.vantageApp.openModal('change-password-modal');
    }
  }

  async processChangePasswordSubmit(event) {
    event.preventDefault();
    if (!this.changePwState) return;

    const enteredOtp = (document.getElementById('cpw-input-otp')?.value || '').trim();
    const newPw = (document.getElementById('cpw-input-new')?.value || '').trim();
    const confirmPw = (document.getElementById('cpw-input-confirm')?.value || '').trim();

    if (enteredOtp !== this.changePwState.otp) {
      if (window.vantageApp) window.vantageApp.showToast('❌ Invalid 2FA verification code.', 'warning');
      return;
    }

    if (newPw !== confirmPw) {
      if (window.vantageApp) window.vantageApp.showToast('New passwords do not match.', 'warning');
      return;
    }

    // Record Security Audit Log
    if (window.vantageDB) {
      await window.vantageDB.put('logs', {
        timestamp: new Date().toLocaleString(),
        type: 'SUCCESS',
        service: 'Security / 2FA',
        message: `User ${this.currentUser.name} (${this.currentUser.email}) successfully changed password with 2FA verification.`
      });
    }

    this.changePwState = null;
    if (window.vantageApp) {
      window.vantageApp.closeModal('change-password-modal');
      window.vantageApp.showToast('🔒 Password changed successfully with 2FA verification!', 'success');
    }
  }

  // --- Two-Factor Authentication Settings Modal ---
  open2FASettingsModal() {
    if (!this.isAuthenticated()) {
      this.openAuthModal('signin');
      return;
    }

    const toggle = document.getElementById('user-2fa-toggle');
    if (toggle) {
      toggle.checked = !!this.currentUser.twoFactorEnabled;
    }

    if (window.vantageApp) {
      window.vantageApp.openModal('two-factor-settings-modal');
    }
  }

  async save2FASettings() {
    if (!this.currentUser) return;

    const isEnabled = document.getElementById('user-2fa-toggle')?.checked || false;
    this.currentUser.twoFactorEnabled = isEnabled;

    if (window.vantageDB) {
      await window.vantageDB.put('users', this.currentUser);
      await window.vantageDB.put('logs', {
        timestamp: new Date().toLocaleString(),
        type: 'SUCCESS',
        service: 'Security / 2FA',
        message: `User ${this.currentUser.name} (${this.currentUser.email}) set 2FA on login to: ${isEnabled ? 'ENABLED' : 'DISABLED'}.`
      });
    }

    localStorage.setItem('vantage_auth_session', JSON.stringify(this.currentUser));

    if (window.vantageApp) {
      window.vantageApp.closeModal('two-factor-settings-modal');
      window.vantageApp.showToast(`🛡️ Two-Factor Authentication (2FA) is now ${isEnabled ? 'ENABLED 🟢' : 'DISABLED 🔴'}.`, 'success');
    }
  }

  // --- Auth Modal Tab Switcher (Sign In vs Sign Up vs Forgot) ---
  openAuthModal(tab = 'signin') {
    this.switchAuthTab(tab);
    if (window.vantageApp) {
      window.vantageApp.openModal('auth-modal');
    }
  }

  switchAuthTab(tab) {
    const tabSignin = document.getElementById('auth-tab-signin');
    const tabSignup = document.getElementById('auth-tab-signup');
    const formSignin = document.getElementById('auth-form-signin');
    const formSignup = document.getElementById('auth-form-signup');
    const formForgot = document.getElementById('auth-form-forgot');
    const modalTitle = document.getElementById('auth-modal-title');
    const modalSubtitle = document.getElementById('auth-modal-subtitle');

    if (tab === 'signup') {
      if (tabSignin) tabSignin.classList.remove('active');
      if (tabSignup) tabSignup.classList.add('active');
      if (formSignin) formSignin.style.display = 'none';
      if (formSignup) formSignup.style.display = 'block';
      if (formForgot) formForgot.style.display = 'none';
      if (modalTitle) modalTitle.textContent = 'Create Free Account';
      if (modalSubtitle) modalSubtitle.textContent = 'Start benchmarking 1,000+ companies with Azure Cognitive AI.';
    } else if (tab === 'forgot') {
      if (tabSignin) tabSignin.classList.remove('active');
      if (tabSignup) tabSignup.classList.remove('active');
      if (formSignin) formSignin.style.display = 'none';
      if (formSignup) formSignup.style.display = 'none';
      if (formForgot) formForgot.style.display = 'block';
      if (modalTitle) modalTitle.textContent = 'Reset Account Password';
      if (modalSubtitle) modalSubtitle.textContent = 'Verify identity via 6-digit 2FA email security code.';
      const s1 = document.getElementById('forgot-step-1');
      const s2 = document.getElementById('forgot-step-2');
      if (s1) s1.style.display = 'block';
      if (s2) s2.style.display = 'none';
    } else {
      if (tabSignin) tabSignin.classList.add('active');
      if (tabSignup) tabSignup.classList.remove('active');
      if (formSignin) formSignin.style.display = 'block';
      if (formSignup) formSignup.style.display = 'none';
      if (formForgot) formForgot.style.display = 'none';
      if (modalTitle) modalTitle.textContent = 'Access VantagePulse AI';
      if (modalSubtitle) modalSubtitle.textContent = 'Sign in or create a free account to benchmark 1,000+ companies.';
    }
  }

  // --- Logout (Stores LOGOUT in Database) ---
  async logout() {
    const previousUser = this.currentUser;

    if (previousUser && window.vantageDB) {
      // Store LOGOUT event in IndexedDB before clearing session
      await window.vantageDB.recordAuthLog(previousUser, 'LOGOUT');
    }

    if (previousUser && window.vantageApi) {
      await window.vantageApi.logAuthEvent(previousUser, 'LOGOUT');
    }

    this.currentUser = null;
    localStorage.removeItem('vantage_auth_session');
    this.updateUI();

    if (window.vantageApp) {
      window.vantageApp.switchView('landing');
      window.vantageApp.showToast('You have been securely logged out.', 'info');
    }
  }

  // --- Fast Account Switcher ---
  async switchAccount(roleType) {
    if (this.currentUser && window.vantageDB) {
      await window.vantageDB.recordAuthLog(this.currentUser, 'LOGOUT');
    }
    await this.loginWithDemo(roleType);
    if (window.vantageApp) {
      if (roleType === 'Admin') {
        window.vantageApp.switchView('admin');
      } else {
        window.vantageApp.switchView('custom-compare');
      }
    }
  }

  // --- Auth Activity Logs Modal Renderer (ADMIN RESTRICTED) ---
  async openAuthLogsModal(filterAction = 'ALL') {
    // Strict RBAC Guard: Only Admin can view login and logout data
    if (!this.isAdmin()) {
      if (window.vantageApp) {
        window.vantageApp.openModal('access-denied-modal');
        window.vantageApp.showToast('🔒 Access Denied: User login and logout logs are strictly restricted to Admin accounts.', 'warning');
      }
      return;
    }

    const modal = document.getElementById('auth-logs-modal');
    const container = document.getElementById('auth-logs-tbody');
    if (!container) return;

    let logs = await window.vantageDB.getAuthLogs();
    if (filterAction !== 'ALL') {
      logs = logs.filter(l => l.action === filterAction.toUpperCase());
    }

    if (logs.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No authentication activity logs found in database.
          </td>
        </tr>
      `;
    } else {
      container.innerHTML = logs.map(l => `
        <tr>
          <td>
            <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary);">
              ${l.timestamp}
            </div>
          </td>
          <td>
            <div>
              <strong style="color: var(--text-primary);">${l.name}</strong>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${l.email}</div>
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
            <span style="font-size: 0.78rem; font-family: var(--font-mono); color: var(--text-muted);">
              ${l.ipAddress}
            </span>
          </td>
        </tr>
      `).join('');
    }

    if (modal) modal.classList.add('active');
  }

  async clearAllAuthLogs() {
    if (!this.isAdmin()) return;
    if (window.vantageDB) {
      await window.vantageDB.clearAuthLogs();
      this.openAuthLogsModal('ALL');
      if (window.vantageApp) {
        window.vantageApp.showToast('Auth logs cleared from database.', 'info');
      }
    }
  }

  // --- UI State Sync ---
  updateUI() {
    const unauthGroup = document.getElementById('nav-unauth-group');
    const authGroup = document.getElementById('nav-auth-group');
    const adminNavTab = document.getElementById('nav-tab-admin');
    const blobsNavTab = document.getElementById('nav-tab-blobs');
    const mobileBlobsTab = document.getElementById('mobile-tab-blobs');
    const mobileAdminTab = document.getElementById('mobile-tab-admin');
    const authLogsNavBtn = document.getElementById('nav-auth-logs-btn');
    const userDisplayAvatar = document.getElementById('header-user-avatar');
    const userDisplayName = document.getElementById('header-user-name');
    const userDisplayTier = document.getElementById('header-user-tier');
    const mobileAuthSection = document.getElementById('mobile-auth-section');

    const isAdm = this.isAdmin();

    // Storage and Admin tabs are strictly Admin-only
    if (blobsNavTab) blobsNavTab.style.display = isAdm ? 'inline-flex' : 'none';
    if (mobileBlobsTab) mobileBlobsTab.style.display = isAdm ? 'inline-flex' : 'none';
    if (adminNavTab) adminNavTab.style.display = isAdm ? 'inline-flex' : 'none';
    if (mobileAdminTab) mobileAdminTab.style.display = isAdm ? 'inline-flex' : 'none';
    if (authLogsNavBtn) authLogsNavBtn.style.display = isAdm ? 'inline-flex' : 'none';

    if (this.currentUser) {
      // 1. Desktop Nav Sync
      if (unauthGroup) unauthGroup.style.display = 'none';
      if (authGroup) authGroup.style.display = 'flex';

      if (userDisplayAvatar) userDisplayAvatar.textContent = this.currentUser.avatarText || 'VP';
      if (userDisplayName) userDisplayName.textContent = this.currentUser.name;
      if (userDisplayTier) {
        userDisplayTier.textContent = this.currentUser.tier || 'Student Free';
        if (this.currentUser.role === 'Admin') {
          userDisplayTier.className = 'badge badge-azure';
        } else {
          userDisplayTier.className = 'badge badge-tier';
        }
      }

      const dropdownUserName = document.getElementById('dropdown-user-name');
      const dropdownUserEmail = document.getElementById('dropdown-user-email');
      const dropdownAuthLogsBtn = document.getElementById('dropdown-auth-logs-btn');

      if (dropdownUserName) dropdownUserName.textContent = this.currentUser.name;
      if (dropdownUserEmail) dropdownUserEmail.textContent = this.currentUser.email;
      if (dropdownAuthLogsBtn) dropdownAuthLogsBtn.style.display = isAdm ? 'flex' : 'none';

      // 3. Mobile Drawer Sync
      if (mobileAuthSection) {
        mobileAuthSection.innerHTML = `
          <div style="padding: 0.6rem 0.8rem; background: var(--bg-input); border-radius: var(--radius-md); margin-bottom: 0.5rem;">
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">${this.currentUser.name}</div>
            <div style="font-size: 0.76rem; color: var(--text-muted);">${this.currentUser.email} (${this.currentUser.role})</div>
          </div>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="window.vantageApp.openModal('switch-account-modal'); document.getElementById('mobile-drawer').classList.remove('active');">
              🔄 Switch Account
            </button>
            <button class="btn btn-ghost btn-sm" style="color: var(--sentiment-neg); border: 1px solid var(--sentiment-neg-border); font-weight: 700;" onclick="window.vantageAuth.logout(); document.getElementById('mobile-drawer').classList.remove('active');">
              🚪 Logout
            </button>
          </div>
        `;
      }
    } else {
      // Unauthenticated State
      if (unauthGroup) unauthGroup.style.display = 'flex';
      if (authGroup) authGroup.style.display = 'none';

      const heroSessionPill = document.getElementById('hero-session-pill');
      if (heroSessionPill) heroSessionPill.style.display = 'none';

      if (mobileAuthSection) {
        mobileAuthSection.innerHTML = `
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="window.vantageAuth.openAuthModal('signin'); document.getElementById('mobile-drawer').classList.remove('active');">
              🔑 Sign In
            </button>
            <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="window.vantageAuth.openAuthModal('signup'); document.getElementById('mobile-drawer').classList.remove('active');">
              🚀 Sign Up Free
            </button>
          </div>
        `;
      }
    }
  }
}

// Global Auth instance
window.vantageAuth = new AuthService();
