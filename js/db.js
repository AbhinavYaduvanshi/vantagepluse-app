/**
 * VantagePulse AI™ - Client-side Persistent Database Engine
 * Zero-cost persistent storage using IndexedDB with LocalStorage fallback.
 */

class DatabaseService {
  constructor() {
    this.dbName = 'VantagePulseDB';
    this.dbVersion = 2;
    this.db = null;
    this.isReady = false;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Stores
        if (!db.objectStoreNames.contains('competitors')) {
          db.createObjectStore('competitors', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('reviews')) {
          db.createObjectStore('reviews', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('blobs')) {
          db.createObjectStore('blobs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('logs')) {
          db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('auth_logs')) {
          db.createObjectStore('auth_logs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('services')) {
          db.createObjectStore('services', { keyPath: 'id' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        this.isReady = true;
        await this.seedInitialData();
        resolve(this);
      };

      request.onerror = (event) => {
        console.warn('IndexedDB error, falling back to LocalStorage', event);
        this.isReady = true;
        this.seedLocalStorage();
        resolve(this);
      };
    });
  }

  // --- Auth Activity Logging to Database ---
  async recordAuthLog(user, action = 'LOGIN') {
    if (!user) return;
    const logEntry = {
      id: `auth_log_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      userId: user.id || 'usr-guest',
      name: user.name || 'Anonymous User',
      email: user.email || 'guest@vantagedata.io',
      role: user.role || 'User',
      tier: user.tier || 'Free Student Tier',
      action: action.toUpperCase(), // 'LOGIN' or 'LOGOUT'
      timestamp: new Date().toLocaleString(),
      isoTime: new Date().toISOString(),
      ipAddress: '192.168.1.104 (Azure East US)',
      userAgent: navigator.userAgent ? navigator.userAgent.substring(0, 48) + '...' : 'Desktop Web',
      status: 'SUCCESS'
    };

    await this.put('auth_logs', logEntry);

    // Also add to general system logs
    await this.put('logs', {
      timestamp: new Date().toLocaleTimeString(),
      type: action === 'LOGIN' ? 'INFO' : 'WARN',
      service: 'Auth Service',
      message: `User '${logEntry.email}' performed [${logEntry.action}] (Role: ${logEntry.role}).`
    });

    return logEntry;
  }

  async getAuthLogs() {
    const logs = await this.getAll('auth_logs');
    return logs.sort((a, b) => new Date(b.isoTime || 0) - new Date(a.isoTime || 0));
  }

  async clearAuthLogs() {
    if (!this.db) return;
    const tx = this.db.transaction('auth_logs', 'readwrite');
    const store = tx.objectStore('auth_logs');
    store.clear();
  }

  // --- Seed Data Definition ---
  async seedInitialData() {
    const competitorsCount = await this.count('competitors');
    if (competitorsCount > 0) return; // Already seeded

    console.log('Seeding initial market intelligence data...');

    // 1. Competitors
    const initialCompetitors = [
      {
        id: 'comp-1',
        name: 'OpenAI Enterprise',
        logoText: 'OA',
        brandColor: '#10a37f',
        category: 'Foundation Models & APIs',
        marketShare: 34.5,
        netSentiment: 78.4,
        posSentiment: 74,
        neuSentiment: 15,
        negSentiment: 11,
        radarScores: { performance: 94, ux: 88, pricing: 65, reliability: 82, support: 75, aiReadiness: 96 },
        monthlyPricing: '$200 - $1,500/mo',
        description: 'Leader in general purpose generative LLMs (GPT-4o, o1, o3) with high developer mindshare.',
        pros: ['State of the art reasoning', 'Broad ecosystem integration', 'Fast multimodal latency'],
        cons: ['Higher enterprise token pricing', 'Rate limit volatility during peak surges'],
        azureBlobRef: 'azure-blob://raw-reviews/openai_enterprise_2026.json'
      },
      {
        id: 'comp-2',
        name: 'Anthropic Claude',
        logoText: 'AC',
        brandColor: '#d97706',
        category: 'Safety & Enterprise LLM',
        marketShare: 24.2,
        netSentiment: 84.1,
        posSentiment: 82,
        neuSentiment: 12,
        negSentiment: 6,
        radarScores: { performance: 92, ux: 90, pricing: 74, reliability: 91, support: 86, aiReadiness: 94 },
        monthlyPricing: '$150 - $1,200/mo',
        description: 'Known for large 200k+ context windows, Artifacts UI, and deep constitutional AI alignment.',
        pros: ['Superior code generation & reasoning', '200k+ token context window', 'High safety compliance'],
        cons: ['Fewer turnkey cloud connector integrations compared to Hyperscalers'],
        azureBlobRef: 'azure-blob://raw-reviews/anthropic_claude_2026.json'
      },
      {
        id: 'comp-3',
        name: 'Microsoft Azure AI',
        logoText: 'MS',
        brandColor: '#0078d4',
        category: 'Enterprise Cloud AI Hub',
        marketShare: 21.8,
        netSentiment: 79.5,
        posSentiment: 76,
        neuSentiment: 16,
        negSentiment: 8,
        radarScores: { performance: 90, ux: 84, pricing: 80, reliability: 95, support: 92, aiReadiness: 92 },
        monthlyPricing: '$100 - $3,000/mo',
        description: 'Comprehensive enterprise AI ecosystem combining OpenAI models, Azure Text Analytics, and Translator.',
        pros: ['Robust SLA & enterprise security', 'Native Azure Blob Storage integration', 'Student & Startup credits'],
        cons: ['Azure portal setup learning curve for beginners'],
        azureBlobRef: 'azure-blob://raw-reviews/microsoft_azure_ai_2026.json'
      },
      {
        id: 'comp-4',
        name: 'Google Cloud Vertex AI',
        logoText: 'GV',
        brandColor: '#4285f4',
        category: 'Multimodal Cloud Platform',
        marketShare: 12.5,
        netSentiment: 73.2,
        posSentiment: 70,
        neuSentiment: 18,
        negSentiment: 12,
        radarScores: { performance: 89, ux: 79, pricing: 78, reliability: 88, support: 80, aiReadiness: 91 },
        monthlyPricing: '$80 - $2,500/mo',
        description: 'Full-stack ML and Gemini model studio with deep Google Workspace connectivity.',
        pros: ['1M+ multimodal context processing', 'Seamless BigQuery analytics connection'],
        cons: ['Console navigation complexity'],
        azureBlobRef: 'azure-blob://raw-reviews/google_vertex_2026.json'
      },
      {
        id: 'comp-5',
        name: 'AWS Bedrock',
        logoText: 'AW',
        brandColor: '#ff9900',
        category: 'Multi-Model Serverless Hub',
        marketShare: 5.2,
        netSentiment: 68.9,
        posSentiment: 64,
        neuSentiment: 21,
        negSentiment: 15,
        radarScores: { performance: 85, ux: 72, pricing: 70, reliability: 93, support: 84, aiReadiness: 86 },
        monthlyPricing: '$120 - $2,800/mo',
        description: 'Managed multi-model marketplace allowing developers to access models via unified IAM.',
        pros: ['Existing AWS VPC integration', 'Private link data guardrails'],
        cons: ['Model availability regional fragmentation', 'Complex permission policies'],
        azureBlobRef: 'azure-blob://raw-reviews/aws_bedrock_2026.json'
      },
      {
        id: 'comp-6',
        name: 'Mistral AI Enterprise',
        logoText: 'MI',
        brandColor: '#f43f5e',
        category: 'Open-Weight & Sovereign AI',
        marketShare: 1.8,
        netSentiment: 81.3,
        posSentiment: 79,
        neuSentiment: 14,
        negSentiment: 7,
        radarScores: { performance: 87, ux: 82, pricing: 92, reliability: 85, support: 76, aiReadiness: 88 },
        monthlyPricing: '$40 - $600/mo',
        description: 'European AI champion offering lean, open-weight and high-efficiency commercial models.',
        pros: ['Unmatched cost-to-performance ratio', 'European data sovereignty & GDPR hosting'],
        cons: ['Smaller turnkey SaaS tooling catalog'],
        azureBlobRef: 'azure-blob://raw-reviews/mistral_ai_2026.json'
      }
    ];

    for (const comp of initialCompetitors) {
      await this.put('competitors', comp);
    }

    // 2. Multilingual Customer Reviews (JP, DE, ES, FR, ZH, HI, EN)
    const initialReviews = [
      {
        id: 'rev-1',
        competitorId: 'comp-1',
        competitorName: 'OpenAI Enterprise',
        author: 'Kenji Takahashi',
        company: 'Tokyo FinTech Corp',
        lang: 'ja',
        langName: 'Japanese',
        sourceText: '推論能力とAPIの応答速度は素晴らしいです。しかし、大規模バッチ処理時のコストとレート制限が課題です。',
        translatedText: 'The reasoning ability and API response speed are wonderful. However, the cost and rate limits during large batch processing remain a challenge.',
        isTranslated: true,
        sentiment: 'positive',
        sentimentScore: 0.74,
        aspects: [
          { aspect: 'Reasoning Ability', sentiment: 'positive', score: 0.95 },
          { aspect: 'API Latency', sentiment: 'positive', score: 0.90 },
          { aspect: 'Cost & Rate Limits', sentiment: 'negative', score: -0.65 }
        ],
        keyPhrases: ['推論能力', 'API応答速度', '大規模バッチ処理', 'レート制限'],
        date: '2026-08-12',
        rating: 4.5
      },
      {
        id: 'rev-2',
        competitorId: 'comp-2',
        competitorName: 'Anthropic Claude',
        author: 'Maximilian Schmidt',
        company: 'Berlin AutoTech GmbH',
        lang: 'de',
        langName: 'German',
        sourceText: 'Claude 3.5 Sonnet hat unsere Code-Review-Pipeline revolutioniert. Die Genauigkeit und die Sicherheitsrichtlinien sind erstklassig.',
        translatedText: 'Claude 3.5 Sonnet has revolutionized our code review pipeline. The accuracy and safety compliance policies are first-class.',
        isTranslated: true,
        sentiment: 'positive',
        sentimentScore: 0.91,
        aspects: [
          { aspect: 'Code Review Accuracy', sentiment: 'positive', score: 0.98 },
          { aspect: 'Safety Policies', sentiment: 'positive', score: 0.92 }
        ],
        keyPhrases: ['Code-Review-Pipeline', 'Genauigkeit', 'Sicherheitsrichtlinien'],
        date: '2026-08-14',
        rating: 5.0
      },
      {
        id: 'rev-3',
        competitorId: 'comp-3',
        competitorName: 'Microsoft Azure AI',
        author: 'Elena Morales',
        company: 'Madrid Cloud Logistics',
        lang: 'es',
        langName: 'Spanish',
        sourceText: 'La integración con Azure Blob Storage y Text Analytics es sumamente fluida. El SLA empresarial y la seguridad son insuperables.',
        translatedText: 'Integration with Azure Blob Storage and Text Analytics is extremely seamless. The enterprise SLA and security are unbeatable.',
        isTranslated: true,
        sentiment: 'positive',
        sentimentScore: 0.88,
        aspects: [
          { aspect: 'Azure Blob Integration', sentiment: 'positive', score: 0.96 },
          { aspect: 'Enterprise SLA & Security', sentiment: 'positive', score: 0.94 }
        ],
        keyPhrases: ['Azure Blob Storage', 'Text Analytics', 'SLA empresarial', 'Seguridad'],
        date: '2026-08-10',
        rating: 4.8
      },
      {
        id: 'rev-4',
        competitorId: 'comp-4',
        competitorName: 'Google Cloud Vertex AI',
        author: 'Camille Dubois',
        company: 'Paris Retail Analytics',
        lang: 'fr',
        langName: 'French',
        sourceText: 'La fenêtre de contexte multimodal est impressionnante, mais la console Vertex AI est parfois confuse pour les analystes non techniques.',
        translatedText: 'The multimodal context window is impressive, but the Vertex AI console is sometimes confusing for non-technical analysts.',
        isTranslated: true,
        sentiment: 'neutral',
        sentimentScore: 0.42,
        aspects: [
          { aspect: 'Multimodal Context', sentiment: 'positive', score: 0.88 },
          { aspect: 'Console Usability', sentiment: 'negative', score: -0.55 }
        ],
        keyPhrases: ['contexte multimodal', 'console Vertex AI', 'analystes non techniques'],
        date: '2026-08-09',
        rating: 3.5
      },
      {
        id: 'rev-5',
        competitorId: 'comp-5',
        competitorName: 'AWS Bedrock',
        author: 'Wei Zhang',
        company: 'Shanghai Cloud Systems',
        lang: 'zh',
        langName: 'Chinese',
        sourceText: 'Bedrock统一了多个模型的访问，但不同区域的模型可用性存在延迟，且IAM权限配置相对繁琐。',
        translatedText: 'Bedrock unifies access to multiple models, but model availability across regions has delays, and IAM permission setup is cumbersome.',
        isTranslated: true,
        sentiment: 'neutral',
        sentimentScore: 0.35,
        aspects: [
          { aspect: 'Unified Model Access', sentiment: 'positive', score: 0.78 },
          { aspect: 'Regional Availability', sentiment: 'negative', score: -0.62 },
          { aspect: 'IAM Setup', sentiment: 'negative', score: -0.70 }
        ],
        keyPhrases: ['模型访问', '区域可用性', 'IAM权限配置'],
        date: '2026-08-08',
        rating: 3.2
      },
      {
        id: 'rev-6',
        competitorId: 'comp-6',
        competitorName: 'Mistral AI Enterprise',
        author: 'Aarav Patel',
        company: 'Bengaluru AI Labs',
        lang: 'hi',
        langName: 'Hindi',
        sourceText: 'मिस्ट्रल का लागत-से-प्रदर्शन अनुपात वास्तव में उत्कृष्ट है। हमारी ऑन-प्रिमाइसेस तैनाती बिना किसी रुकावट के काम कर रही है।',
        translatedText: 'Mistral\'s cost-to-performance ratio is truly outstanding. Our on-premises deployment is working without any hiccups.',
        isTranslated: true,
        sentiment: 'positive',
        sentimentScore: 0.93,
        aspects: [
          { aspect: 'Cost-Performance Ratio', sentiment: 'positive', score: 0.98 },
          { aspect: 'On-Premises Deployment', sentiment: 'positive', score: 0.92 }
        ],
        keyPhrases: ['लागत-से-प्रदर्शन अनुपात', 'ऑन-प्रिमाइसेस तैनाती', 'उत्कृष्ट'],
        date: '2026-08-15',
        rating: 5.0
      },
      {
        id: 'rev-7',
        competitorId: 'comp-1',
        competitorName: 'OpenAI Enterprise',
        author: 'Sarah Jenkins',
        company: 'Austin DevHub Inc',
        lang: 'en',
        langName: 'English',
        sourceText: 'The tool calling and structured JSON output in GPT-4o are very reliable. However, the pricing tier changes caught us off guard last quarter.',
        translatedText: 'The tool calling and structured JSON output in GPT-4o are very reliable. However, the pricing tier changes caught us off guard last quarter.',
        isTranslated: false,
        sentiment: 'neutral',
        sentimentScore: 0.55,
        aspects: [
          { aspect: 'Tool Calling & JSON Output', sentiment: 'positive', score: 0.92 },
          { aspect: 'Pricing Stability', sentiment: 'negative', score: -0.68 }
        ],
        keyPhrases: ['tool calling', 'structured JSON output', 'pricing tier changes'],
        date: '2026-08-05',
        rating: 4.0
      }
    ];

    for (const rev of initialReviews) {
      await this.put('reviews', rev);
    }

    // 3. Azure Blob Storage Mock Data Objects
    const initialBlobs = [
      {
        id: 'blob-1',
        container: 'raw-reviews',
        name: 'market_intel_raw_feed_2026_q3.json',
        size: '1.42 MB',
        sizeBytes: 1488972,
        contentType: 'application/json',
        lastModified: '2026-08-16T18:30:00Z',
        etag: '"0x8DC61F0A80C9"',
        url: 'https://vantagepulse.blob.core.windows.net/raw-reviews/market_intel_raw_feed_2026_q3.json',
        recordsCount: 540,
        status: 'Processed'
      },
      {
        id: 'blob-2',
        container: 'translated-transcripts',
        name: 'global_competitor_translated_jp_de_es.json',
        size: '890 KB',
        sizeBytes: 911360,
        contentType: 'application/json',
        lastModified: '2026-08-16T19:15:00Z',
        etag: '"0x8DC61F24BC11"',
        url: 'https://vantagepulse.blob.core.windows.net/translated-transcripts/global_competitor_translated_jp_de_es.json',
        recordsCount: 320,
        status: 'Translated'
      },
      {
        id: 'blob-3',
        container: 'text-analytics-results',
        name: 'aspect_sentiment_mining_scores.json',
        size: '640 KB',
        sizeBytes: 655360,
        contentType: 'application/json',
        lastModified: '2026-08-16T19:45:00Z',
        etag: '"0x8DC61F37402B"',
        url: 'https://vantagepulse.blob.core.windows.net/text-analytics-results/aspect_sentiment_mining_scores.json',
        recordsCount: 1250,
        status: 'Analyzed'
      },
      {
        id: 'blob-4',
        container: 'exports',
        name: 'executive_market_briefing_aug2026.pdf',
        size: '2.15 MB',
        sizeBytes: 2254438,
        contentType: 'application/pdf',
        lastModified: '2026-08-16T20:00:00Z',
        etag: '"0x8DC61F4E9981"',
        url: 'https://vantagepulse.blob.core.windows.net/exports/executive_market_briefing_aug2026.pdf',
        recordsCount: 1,
        status: 'Ready'
      }
    ];

    for (const blob of initialBlobs) {
      await this.put('blobs', blob);
    }

    // 4. Initial Users & RBAC
    const initialUsers = [
      {
        id: 'usr-admin',
        email: 'abhinavrao666@gmail.com',
        name: 'Abhinav (Admin)',
        role: 'Admin',
        tier: 'Enterprise Suite',
        created: '2026-01-10',
        active: true,
        azureCreditsRemaining: '$98.50 (Azure Student Free)'
      },
      {
        id: 'usr-pro',
        email: 'pro@analyst.io',
        name: 'Sarah Chen (Senior Analyst)',
        role: 'Pro Analyst',
        tier: 'Pro Intelligence',
        created: '2026-04-18',
        active: true,
        azureCreditsRemaining: 'Standard Tier'
      },
      {
        id: 'usr-student',
        email: 'student@university.edu',
        name: 'Alex Rivera (Research Student)',
        role: 'User',
        tier: 'Free Student Tier',
        created: '2026-07-02',
        active: true,
        azureCreditsRemaining: '$100.00 (Azure Student Free)'
      }
    ];

    for (const u of initialUsers) {
      await this.put('users', u);
    }

    // 5. System Logs
    const initialLogs = [
      { timestamp: '2026-08-16 19:45:10', type: 'INFO', service: 'Azure Blob Storage', message: 'Mounted container /raw-reviews successfully.' },
      { timestamp: '2026-08-16 19:48:22', type: 'SUCCESS', service: 'Azure Translator', message: 'Translated 18 Japanese & German reviews to English.' },
      { timestamp: '2026-08-16 19:50:04', type: 'SUCCESS', service: 'Azure Text Analytics', message: 'Extracted aspect sentiments and 42 key phrases from Q3 feedback.' },
      { timestamp: '2026-08-16 20:00:15', type: 'INFO', service: 'AI Copilot Engine', message: 'VantagePulse AI assistant initialized with market context memory.' }
    ];

    for (const log of initialLogs) {
      await this.put('logs', log);
    }

    // 6. Configured Cloud & AI Services Catalog (Admin Editable)
    const existingServices = await this.getAll('services');
    if (existingServices.length === 0) {
      const initialServices = [
        {
          id: 'srv-1',
          name: 'Azure Text Analytics (NLP)',
          category: 'NLP & Text Analytics',
          provider: 'Microsoft Azure',
          endpoint: 'https://vantagepulse-text.cognitiveservices.azure.com/',
          quota: '5,000 records / mo (Free F0)',
          status: 'Active',
          description: 'Multi-aspect sentiment classification, opinion mining, and key phrase extraction.'
        },
        {
          id: 'srv-2',
          name: 'Azure Translator API',
          category: 'Language Translation',
          provider: 'Microsoft Azure',
          endpoint: 'https://api.cognitive.microsofttranslator.com/',
          quota: '2,000,000 chars / mo (Free F0)',
          status: 'Active',
          description: 'Real-time multi-language translation for JP, DE, ES, FR, ZH, HI customer reviews.'
        },
        {
          id: 'srv-3',
          name: 'Azure Blob Storage (LRS)',
          category: 'Cloud Storage & Lakehouse',
          provider: 'Microsoft Azure',
          endpoint: 'https://vantagepulsestorage.blob.core.windows.net/',
          quota: '5 GB Allocation (Free F0)',
          status: 'Active',
          description: 'Object storage for raw transcripts, normalized feeds, and competitor specification JSONs.'
        },
        {
          id: 'srv-4',
          name: 'Conversational AI Copilot Engine',
          category: 'Generative AI & Synthesis',
          provider: 'Azure OpenAI / Copilot Hub',
          endpoint: 'https://vantagepulse-ai.openai.azure.com/',
          quota: 'High Throughput Enterprise',
          status: 'Active',
          description: 'Context-grounded autonomous AI agent for real-time market synthesis and SWOT analysis.'
        },
        {
          id: 'srv-5',
          name: 'Competitor Feed Scraper & RSS Ingestor',
          category: 'Data Ingestion Pipeline',
          provider: 'Custom Automated Worker',
          endpoint: 'http://localhost:3000/api/companies',
          quota: 'Scheduled Hourly Batch',
          status: 'Active',
          description: 'Autonomous background telemetry crawler indexing 1,000+ enterprise software companies.'
        }
      ];

      for (const srv of initialServices) {
        await this.put('services', srv);
      }
    }
  }

  // --- IndexedDB Helper CRUD Methods ---
  async get(storeName, key) {
    if (!this.db) return JSON.parse(localStorage.getItem(`${this.dbName}_${storeName}_${key}`) || 'null');
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(storeName) {
    if (!this.db) {
      const items = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(`${this.dbName}_${storeName}_`)) {
          items.push(JSON.parse(localStorage.getItem(k)));
        }
      }
      return items;
    }
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async put(storeName, item) {
    if (!this.db) {
      localStorage.setItem(`${this.dbName}_${storeName}_${item.id || item.key}`, JSON.stringify(item));
      return item;
    }
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName, key) {
    if (!this.db) {
      localStorage.removeItem(`${this.dbName}_${storeName}_${key}`);
      return true;
    }
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async count(storeName) {
    if (!this.db) return (await this.getAll(storeName)).length;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}

// Global DB Singleton instance
window.vantageDB = new DatabaseService();
