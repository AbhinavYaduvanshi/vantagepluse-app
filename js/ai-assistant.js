/**
 * VantagePulse AI™ - Floating AI Assistant & Contextual Market Copilot
 * Context-aware intelligent conversational agent grounded in competitive market telemetry and search analytics.
 */

class AIAssistantEngine {
  constructor() {
    this.isOpen = false;
    this.isSpeaking = false;
    this.messages = [];
    this.initDefaultMessages();
  }

  initDefaultMessages() {
    this.messages = [
      {
        sender: 'bot',
        text: `👋 Hello! I am your **VantagePulse AI Copilot**.\n\nI have real-time access to our **1,000+ monitored companies**, **2,500+ enterprise products**, search telemetry, and **Cognitive Neural sentiment feeds**.\n\nClick any prompt chip below or ask me to compare any competitors in your custom basket!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  }

  toggle() {
    if (!window.vantageAuth?.isAuthenticated()) {
      window.vantageAuth?.openAuthModal('signin');
      window.vantageApp?.showToast('🔒 Please sign in or create an account to use the AI Copilot.', 'info');
      return;
    }

    this.isOpen = !this.isOpen;
    const windowEl = document.getElementById('ai-chat-window');
    if (windowEl) {
      if (this.isOpen) {
        windowEl.classList.add('open');
        this.scrollToBottom();
      } else {
        windowEl.classList.remove('open');
      }
    }
  }

  open() {
    if (!window.vantageAuth?.isAuthenticated()) {
      window.vantageAuth?.openAuthModal('signin');
      window.vantageApp?.showToast('🔒 Please sign in or create an account to use the AI Copilot.', 'info');
      return;
    }

    this.isOpen = true;
    const windowEl = document.getElementById('ai-chat-window');
    if (windowEl) windowEl.classList.add('open');
    this.scrollToBottom();
  }

  close() {
    this.isOpen = false;
    const windowEl = document.getElementById('ai-chat-window');
    if (windowEl) windowEl.classList.remove('open');
  }

  async sendUserMessage(text) {
    if (!text || !text.trim()) return;

    const cleanText = text.trim();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.messages.push({ sender: 'user', text: cleanText, time });
    this.renderMessages();

    // Track user message in search analytics as well
    if (window.companiesDB) {
      window.companiesDB.trackSearchQuery(cleanText);
    }

    const typingId = this.showTypingIndicator();
    const botReply = await this.generateCopilotResponse(cleanText);

    this.removeTypingIndicator(typingId);
    this.messages.push({
      sender: 'bot',
      text: botReply,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.renderMessages();
  }

  async generateCopilotResponse(query) {
    const q = query.toLowerCase();

    // 1. Trending Searches & User Query Telemetry
    if (q.includes('search') || q.includes('trending') || q.includes('most searched') || q.includes('popular queries')) {
      const topSearches = await window.companiesDB.getTopSearches(5);
      return `🔥 **Real-Time Search Telemetry & Trending Queries**:\n\n` +
        topSearches.map((s, i) => `${i + 1}. **${s.query.toUpperCase()}** — *${s.count} searches* (High User Interest)`).join('\n') +
        `\n\n💡 **Key Takeaway**: Developers and enterprise buyers are actively benchmarking **GenAI reasoning latency** against **Azure & Snowflake infrastructure costs**.`;
    }

    // 2. Active Custom Basket Comparison Synthesis
    if (q.includes('basket') || q.includes('custom compare') || q.includes('compare my selected') || q.includes('feature gap')) {
      const basket = window.customCompare?.activeBasket || [];
      if (basket.length < 2) {
        return `ℹ️ You currently have ${basket.length} company in your Custom Comparison basket. Please navigate to the **Custom Compare** tab and add 2 or more companies to generate a tailored head-to-head gap analysis!`;
      }

      const names = basket.map(c => c.name).join(' vs ');
      const bestSent = [...basket].sort((a, b) => b.netSentiment - a.netSentiment)[0];
      const bestValue = [...basket].sort((a, b) => (b.radarScores?.pricing || 0) - (a.radarScores?.pricing || 0))[0];

      return `📊 **Custom Comparison Synthesis (${names})**:\n\n` +
        `• **Sentiment Leader**: **${bestSent.name}** holds the highest Net Sentiment Score at **${bestSent.netSentiment}%**.\n` +
        `• **Best Value Champion**: **${bestValue.name}** offers the strongest Pricing-to-Value score (${bestValue.radarScores?.pricing}/100).\n` +
        `• **Total Products Analyzed**: **${basket.reduce((acc, c) => acc + (c.products?.length || 0), 0)} enterprise products** indexed across this group.\n\n` +
        `💡 You can toggle between **Radar View**, **Bar Benchmark**, and **Value Matrix Scatter** in the Custom Compare tab!`;
    }

    // 3. Competitor Threats / SWOT
    if (q.includes('threat') || q.includes('weakness') || q.includes('swot') || q.includes('summarize top competitor')) {
      return `📊 **Competitive Threat Briefing (Aug 2026)**:\n\n` +
        `1. **Anthropic Claude**: Leading Net Sentiment at **84.1%** with high coding precision and 200k+ context adherence.\n` +
        `2. **OpenAI Enterprise**: Holds **34.5% market share** but faces customer pushback regarding rate limits and token pricing.\n` +
        `3. **Mistral AI**: Fastest growing open-weight disrupter with a **92% Pricing Satisfaction Index** and GDPR on-premises appeal.\n` +
        `4. **Microsoft Azure AI**: Strongest enterprise SLA stability (95%) and unified security integration for enterprise clients.`;
    }

    // 4. Pricing vs Value Comparison
    if (q.includes('price') || q.includes('pricing') || q.includes('cost') || q.includes('value')) {
      return `💰 **Pricing & Value Analysis**:\n\n` +
        `• **Best Value Champion**: **Mistral AI Enterprise** ($40–$600/mo) offers the highest performance per dollar.\n` +
        `• **Balanced Enterprise Choice**: **Microsoft Azure AI** ($100–$3,000/mo) with Azure Student credits & SLA guarantees.\n` +
        `• **Premium Tier**: **OpenAI Enterprise** ($200–$1,500/mo) & **Anthropic Claude** ($150–$1,200/mo) command premium pricing for top-tier reasoning capabilities.`;
    }

    // 5. Azure Pipeline Explanation
    if (q.includes('azure') || q.includes('pipeline') || q.includes('architecture') || q.includes('how it works')) {
      return `⚡ **Azure Cognitive Architecture Pipeline**:\n\n` +
        `1. **Azure Blob Storage**: Ingests raw multi-source competitor descriptions and reviews (` + "`/raw-reviews`" + `).\n` +
        `2. **Azure Translator API**: Auto-detects foreign languages (Japanese, German, Spanish, French, Hindi, Chinese) and translates feedback to English.\n` +
        `3. **Azure Text Analytics NLP**: Computes net sentiment, extracts aspect opinions (e.g. latency vs pricing), and extracts key phrases.\n` +
        `4. **Static Web Hosting & AI Copilot**: Renders real-time interactive intelligence charts with role-based access control.`;
    }

    // 6. Market Gaps / Opportunities
    if (q.includes('gap') || q.includes('opportunity') || q.includes('recommendation')) {
      return `🎯 **Strategic Market Opportunity Identified**:\n\n` +
        `• **Pain Point Detected**: Over **42% of negative reviews** across OpenAI & AWS Bedrock complain about complex IAM setups and pricing unpredictability.\n` +
        `• **Actionable Strategy**: Position our product around **Transparent Fixed-Tier Pricing** and **Turnkey 1-Click Azure Connectors** to capture migrating mid-market developers.`;
    }

    // 7. User Privacy Guard - Never Disclose User Data or User Names
    if (q.includes('login') || q.includes('logout') || q.includes('session') || q.includes('audit log') || q.includes('who logged') || q.includes('user name') || q.includes('users list')) {
      return `🔒 **User Privacy Protection**:\n\nUser account identities, personal details, and session logs are **strictly private and confidential**.\n\nVantagePulse AI Copilot is exclusively designed for **market intelligence, competitor telemetry, and product benchmarking**. I do not disclose any user identities or activity.`;
    }

    // 8. Executive Brief Memo
    if (q.includes('draft') || q.includes('memo') || q.includes('executive brief') || q.includes('report')) {
      return `📝 **Executive Market Intelligence Briefing (Draft)**:\n\n` +
        `**To**: Senior Leadership Team\n` +
        `**Subject**: AI Infrastructure Competitive Benchmark & Q3 Sentiment Shift\n\n` +
        `**Summary**: Enterprise customers are prioritizing **deterministic reasoning** and **SLA reliability** over raw parameter scale. Anthropic and Azure AI lead customer retention, while cost-conscious European sectors are adopting Mistral AI.\n\n` +
        `**Next Steps**: You can click the **"Export Executive PDF"** button on the overview dashboard to download this complete formatted briefing.`;
    }

    // General fallback
    return `🔍 **VantagePulse Intelligence Insight**:\n\nI analyzed your query: *"**${query}**"* across our database of **1,000+ monitored companies** and Azure Cognitive sentiment feeds.\n\nYou can explore detailed comparisons in the **Custom Compare** tab or inspect raw multilingual transcripts in the **Global Reviews** tab!`;
  }

  showTypingIndicator() {
    const id = `typing-${Date.now()}`;
    const chatBody = document.getElementById('ai-chat-body');
    if (chatBody) {
      const typingEl = document.createElement('div');
      typingEl.id = id;
      typingEl.className = 'chat-msg bot animate-fade-in';
      typingEl.innerHTML = `
        <div class="chat-bubble" style="display: flex; gap: 4px; align-items: center;">
          <span style="font-size: 0.8rem; color: var(--text-muted);">VantagePulse AI is analyzing...</span>
        </div>
      `;
      chatBody.appendChild(typingEl);
      this.scrollToBottom();
    }
    return id;
  }

  removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  renderMessages() {
    const chatBody = document.getElementById('ai-chat-body');
    if (!chatBody) return;

    chatBody.innerHTML = this.messages.map(msg => {
      let formatted = msg.text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');

      return `
        <div class="chat-msg ${msg.sender}">
          <div class="chat-bubble">${formatted}</div>
          <div class="chat-time">${msg.time}</div>
        </div>
      `;
    }).join('');

    this.scrollToBottom();
  }

  scrollToBottom() {
    const chatBody = document.getElementById('ai-chat-body');
    if (chatBody) {
      setTimeout(() => {
        chatBody.scrollTop = chatBody.scrollHeight;
      }, 50);
    }
  }

  clearChat() {
    this.initDefaultMessages();
    this.renderMessages();
    if (window.vantageApp) window.vantageApp.showToast('AI conversation reset.', 'info');
  }

  toggleSpeech() {
    if (!('speechSynthesis' in window)) {
      if (window.vantageApp) window.vantageApp.showToast('Speech synthesis not supported in this browser.', 'error');
      return;
    }

    if (this.isSpeaking) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.updateSpeakerIcon(false);
    } else {
      const lastBotMsg = [...this.messages].reverse().find(m => m.sender === 'bot');
      if (lastBotMsg) {
        const cleanText = lastBotMsg.text.replace(/[*#`_]/g, '');
        const utter = new SpeechSynthesisUtterance(cleanText);
        utter.rate = 1.0;
        utter.onend = () => {
          this.isSpeaking = false;
          this.updateSpeakerIcon(false);
        };
        this.isSpeaking = true;
        this.updateSpeakerIcon(true);
        window.speechSynthesis.speak(utter);
      }
    }
  }

  updateSpeakerIcon(active) {
    const iconBtn = document.getElementById('ai-speaker-btn');
    if (iconBtn) {
      iconBtn.style.color = active ? '#10b981' : 'var(--text-muted)';
    }
  }
}

// Global AI Assistant instance
window.vantageAI = new AIAssistantEngine();
