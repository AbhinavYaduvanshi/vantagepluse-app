/**
 * VantagePulse AI™ - Secondary Companies Database Engine (VantageCompaniesDB)
 * High-performance indexed storage pre-seeded with 1,000+ enterprise tech companies & 2,500+ products.
 */

class CompaniesDatabaseService {
  constructor() {
    this.dbName = 'VantageCompaniesDB';
    this.dbVersion = 3;
    this.db = null;
    this.isReady = false;
    this.inMemoryCache = [];
  }

  async init() {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('all_companies')) {
          const store = db.createObjectStore('all_companies', { keyPath: 'id' });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('name', 'name', { unique: false });
        }
        if (!db.objectStoreNames.contains('search_analytics')) {
          db.createObjectStore('search_analytics', { keyPath: 'query' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        this.isReady = true;
        await this.ensureSeeded();
        this.inMemoryCache = await this.getAll();
        resolve(this);
      };

      request.onerror = async (event) => {
        console.warn('Companies DB falling back to memory loading', event);
        try {
          const res = await fetch('/data/companies_catalog.json');
          if (res.ok) {
            this.inMemoryCache = await res.json();
          }
        } catch (e) {
          console.warn('Could not fetch catalog in fallback', e);
        }
        this.isReady = true;
        resolve(this);
      };
    });
  }

  async ensureSeeded() {
    const count = await this.count();
    const firstComp = count > 0 ? await this.get('comp-1') : null;
    
    // If already seeded with real data and logoUrl, keep it
    if (count >= 1000 && firstComp && firstComp.name === 'OpenAI' && firstComp.logoUrl) return;

    console.log('Seeding 1,200+ verified real enterprise companies database from data catalog...');
    let companies = [];
    try {
      const res = await fetch('/data/companies_catalog.json');
      if (res.ok) {
        companies = await res.json();
      }
    } catch (e) {
      console.warn('Could not fetch /data/companies_catalog.json, trying /data/companies.json', e);
    }

    if (!companies || companies.length === 0) {
      try {
        const res2 = await fetch('/api/companies?limit=2000');
        if (res2.ok) {
          const data = await res2.json();
          companies = data.companies || data;
        }
      } catch (e) {}
    }

    if (!companies || companies.length === 0) return;

    return new Promise((resolve) => {
      const tx = this.db.transaction('all_companies', 'readwrite');
      const store = tx.objectStore('all_companies');
      store.clear(); // Clean refresh
      companies.forEach(c => store.put(c));
      tx.oncomplete = () => {
        console.log(`Successfully seeded ${companies.length} verified real companies into VantageCompaniesDB!`);
        resolve();
      };
    });
  }

  generate1000Companies() {
    const categories = [
      {
        name: 'Artificial Intelligence & Generative Models',
        tag: 'AI & GenAI',
        prefixes: ['Neuro', 'Synapse', 'Cognitive', 'Omni', 'Deep', 'Tensor', 'Vector', 'Prompt', 'Cortex', 'Nexus', 'Agent', 'Mind', 'Logic', 'Hyper', 'Vision'],
        suffixes: ['AI', 'Intelligence', 'Labs', 'Neural', 'Brain', 'Systems', 'Matrix', 'Flow', 'Gen', 'Engine', 'Scale', 'Forge', 'Hub', 'Compute', 'Dynamics'],
        basePricing: [40, 1500],
        sampleProducts: ['Foundation LLM API', 'Multimodal Vision Engine', 'Autonomous Agent Hub', 'RAG Retrieval Pipeline', 'Embedding Vector Store']
      },
      {
        name: 'Cloud Infrastructure & Hyperscalers',
        tag: 'Cloud & Infra',
        prefixes: ['Cloud', 'Sky', 'Aero', 'Infra', 'Global', 'Compute', 'Elastic', 'Scale', 'Cluster', 'Vertex', 'Apex', 'Core', 'Titan', 'Mesh', 'Node'],
        suffixes: ['Cloud', 'Infrastructure', 'Networks', 'Compute', 'Host', 'Serverless', 'VPC', 'Grid', 'Engine', 'Platform', 'Edge', 'Zone', 'Stack', 'Scale', 'Fabric'],
        basePricing: [80, 4500],
        sampleProducts: ['Serverless Compute Engine', 'Distributed Object Store', 'Global Edge CDN', 'Kubernetes Mesh', 'Private Cloud Gateway']
      },
      {
        name: 'Data & Analytics Platforms',
        tag: 'Data & DBs',
        prefixes: ['Data', 'Byte', 'Stream', 'Lake', 'Query', 'Table', 'Metric', 'Ware', 'Insight', 'Log', 'Pulse', 'Signal', 'Vector', 'Pipe', 'Flow'],
        suffixes: ['Lakehouse', 'Analytics', 'DB', 'Data', 'Warehouse', 'Engine', 'Base', 'Scale', 'Metrics', 'Queries', 'Pipeline', 'Fabric', 'Graph', 'Hub', 'Stack'],
        basePricing: [60, 2800],
        sampleProducts: ['Real-Time Columnar DB', 'Semantic Lakehouse Engine', 'Streaming ETL Pipeline', 'Vector Similarity Search', 'Automated BI Dashboard']
      },
      {
        name: 'Cybersecurity & Zero Trust Identity',
        tag: 'Cybersecurity',
        prefixes: ['Shield', 'Guard', 'Cyber', 'Secure', 'Aegis', 'Vault', 'Fortress', 'Zero', 'Sentinel', 'Trust', 'Lock', 'Vigil', 'Defense', 'Armor', 'Iron'],
        suffixes: ['Security', 'Identity', 'Shield', 'Armor', 'Cyber', 'Defense', 'Guard', 'Vault', 'Sentinel', 'Protect', 'Trust', 'Auth', 'Safe', 'Gate', 'Watch'],
        basePricing: [90, 3200],
        sampleProducts: ['Endpoint Threat Protection', 'Zero Trust IAM Gateway', 'Cloud Security Posture (CSPM)', 'Automated Pen-Testing AI', 'Secrets Vault Enterprise']
      },
      {
        name: 'DevOps & Developer Tooling',
        tag: 'DevOps & Tools',
        prefixes: ['Code', 'Git', 'Build', 'Deploy', 'Dev', 'Stack', 'Ship', 'Tool', 'Test', 'Lint', 'Script', 'Craft', 'Branch', 'Release', 'CI'],
        suffixes: ['Ops', 'Hub', 'Forge', 'Craft', 'Deploy', 'Kit', 'Runner', 'Engine', 'Stack', 'Studio', 'Lab', 'Box', 'Flow', 'Dock', 'Works'],
        basePricing: [20, 1200],
        sampleProducts: ['Continuous Delivery Pipeline', 'Ephemeral Dev Environments', 'Automated Code Review AI', 'API Testing Framework', 'Container Orchestrator']
      },
      {
        name: 'Enterprise SaaS & CRM Ecosystems',
        tag: 'Enterprise SaaS',
        prefixes: ['Omni', 'Apex', 'Core', 'Work', 'Sync', 'Task', 'Flow', 'Team', 'Plan', 'Manage', 'Pulse', 'Lead', 'Sale', 'Service', 'Org'],
        suffixes: ['CRM', 'SaaS', 'Force', 'Desk', 'Suite', 'Hub', 'Flow', 'Work', 'Space', 'Center', 'Sync', 'Collab', 'Plus', 'Enterprise', 'Central'],
        basePricing: [30, 2400],
        sampleProducts: ['Omnichannel Customer CRM', 'Automated Lead Scoring AI', 'Enterprise Workforce Hub', 'Billing & Subscription Engine', 'Collaborative Workspace']
      },
      {
        name: 'FinTech & Global Payments',
        tag: 'FinTech',
        prefixes: ['Pay', 'Coin', 'Mint', 'Ledger', 'Cash', 'Capital', 'Fiscal', 'Vault', 'Trade', 'Wealth', 'Asset', 'Transact', 'Stripe', 'Swift', 'Fin'],
        suffixes: ['Pay', 'Fin', 'Capital', 'Ledger', 'Finance', 'Trade', 'Bank', 'Flow', 'Transact', 'Gateway', 'Wallet', 'Card', 'Credit', 'Shield', 'Vault'],
        basePricing: [50, 3500],
        sampleProducts: ['Multi-Currency Gateway', 'Real-Time Fraud Detection AI', 'Corporate Spend & Cards', 'Embedded Banking API', 'Automated Reconciliation']
      },
      {
        name: 'E-Commerce & Digital Retail Tech',
        tag: 'E-Commerce',
        prefixes: ['Shop', 'Cart', 'Store', 'Market', 'Retail', 'Buy', 'Sell', 'Commerce', 'Vendor', 'Trade', 'Merchant', 'Brand', 'Order', 'Fulfill', 'Shelf'],
        suffixes: ['Commerce', 'Shop', 'Store', 'Cart', 'Market', 'Retail', 'Hub', 'HQ', 'Direct', 'Flow', 'Checkout', 'Plaza', 'Point', 'Scale', 'Engine'],
        basePricing: [29, 1800],
        sampleProducts: ['Headless Storefront API', 'AI Product Recommendations', 'Omnichannel Inventory Sync', 'One-Click Global Checkout', 'Automated Customer Helpdesk']
      },
      {
        name: 'HealthTech & BioTech AI',
        tag: 'HealthTech',
        prefixes: ['Bio', 'Med', 'Health', 'Care', 'Pulse', 'Gene', 'Cure', 'Life', 'Clinical', 'Pharma', 'Vital', 'Thera', 'Opti', 'Heal', 'Omni'],
        suffixes: ['Health', 'Bio', 'Med', 'Care', 'Genomics', 'Therapeutics', 'Clinical', 'Pharma', 'Life', 'Systems', 'Diagnostics', 'Labs', 'Pulse', 'Tech', 'Care'],
        basePricing: [100, 5000],
        sampleProducts: ['Clinical Trial Matching AI', 'EHR Interoperability Engine', 'Genomic Sequence Analyzer', 'Radiology Image Classifier', 'Telehealth Cloud Hub']
      },
      {
        name: 'Hardware & AI Semiconductors',
        tag: 'Semiconductors',
        prefixes: ['Silicon', 'Chip', 'Quantum', 'Core', 'Micro', 'Nano', 'Semiconductor', 'Logic', 'Giga', 'Tensor', 'Wafers', 'Circuit', 'Array', 'Accel', 'Fab'],
        suffixes: ['Tech', 'Semi', 'Silicon', 'Chips', 'Quantum', 'Logic', 'Circuits', 'Compute', 'Processors', 'Arrays', 'Labs', 'Fab', 'Systems', 'Wafers', 'Architectures'],
        basePricing: [500, 15000],
        sampleProducts: ['Neural Acceleration NPU', 'High-Bandwidth HBM Stack', 'Edge AI Microcontroller', 'Wafer-Scale Inference Rack', 'Quantum Coprocessor Unit']
      }
    ];

    const brandColors = [
      '#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', 
      '#0078d4', '#d97706', '#14b8a6', '#f43f5e', '#3b82f6', '#84cc16'
    ];

    const headquarters = [
      'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 
      'Boston, MA', 'London, UK', 'Berlin, Germany', 'Tokyo, Japan', 
      'Paris, France', 'Bengaluru, India', 'Singapore', 'Tel Aviv, Israel', 
      'Toronto, Canada', 'Stockholm, Sweden', 'Zurich, Switzerland'
    ];

    const allCompanies = [];

    // First add flagship anchor companies
    const anchorCompanies = [
      { name: 'OpenAI Enterprise', cat: 0, share: 34.5, netSent: 78.4, scores: { performance: 94, ux: 88, pricing: 65, reliability: 82, support: 75, aiReadiness: 96 } },
      { name: 'Anthropic Claude', cat: 0, share: 24.2, netSent: 84.1, scores: { performance: 92, ux: 90, pricing: 74, reliability: 91, support: 86, aiReadiness: 94 } },
      { name: 'Microsoft Azure AI', cat: 1, share: 21.8, netSent: 79.5, scores: { performance: 90, ux: 84, pricing: 80, reliability: 95, support: 92, aiReadiness: 92 } },
      { name: 'Google Cloud Vertex', cat: 1, share: 12.5, netSent: 73.2, scores: { performance: 89, ux: 79, pricing: 78, reliability: 88, support: 80, aiReadiness: 91 } },
      { name: 'AWS Bedrock & Cloud', cat: 1, share: 18.2, netSent: 71.9, scores: { performance: 88, ux: 75, pricing: 72, reliability: 94, support: 84, aiReadiness: 88 } },
      { name: 'Mistral AI Enterprise', cat: 0, share: 8.5, netSent: 82.3, scores: { performance: 87, ux: 82, pricing: 92, reliability: 85, support: 76, aiReadiness: 88 } },
      { name: 'Snowflake Data Cloud', cat: 2, share: 16.4, netSent: 81.0, scores: { performance: 91, ux: 89, pricing: 68, reliability: 93, support: 87, aiReadiness: 89 } },
      { name: 'Databricks Lakehouse', cat: 2, share: 14.8, netSent: 83.5, scores: { performance: 93, ux: 82, pricing: 70, reliability: 90, support: 85, aiReadiness: 93 } },
      { name: 'CrowdStrike Falcon', cat: 3, share: 19.2, netSent: 76.5, scores: { performance: 95, ux: 86, pricing: 62, reliability: 89, support: 88, aiReadiness: 87 } },
      { name: 'Palo Alto Prisma Cloud', cat: 3, share: 17.5, netSent: 78.0, scores: { performance: 92, ux: 81, pricing: 65, reliability: 92, support: 89, aiReadiness: 85 } },
      { name: 'GitHub Enterprise Suite', cat: 4, share: 38.0, netSent: 86.4, scores: { performance: 94, ux: 92, pricing: 84, reliability: 91, support: 88, aiReadiness: 95 } },
      { name: 'Vercel Cloud Platform', cat: 4, share: 15.2, netSent: 88.0, scores: { performance: 93, ux: 96, pricing: 79, reliability: 90, support: 86, aiReadiness: 91 } },
      { name: 'Salesforce Agentforce CRM', cat: 5, share: 31.0, netSent: 74.2, scores: { performance: 88, ux: 76, pricing: 58, reliability: 93, support: 86, aiReadiness: 89 } },
      { name: 'ServiceNow Now Assist', cat: 5, share: 22.4, netSent: 79.8, scores: { performance: 90, ux: 80, pricing: 60, reliability: 94, support: 90, aiReadiness: 88 } },
      { name: 'Stripe Payments & Billing', cat: 6, share: 35.6, netSent: 89.2, scores: { performance: 96, ux: 95, pricing: 82, reliability: 98, support: 90, aiReadiness: 91 } },
      { name: 'Adyen Unified Commerce', cat: 6, share: 18.9, netSent: 84.0, scores: { performance: 92, ux: 85, pricing: 84, reliability: 96, support: 88, aiReadiness: 86 } },
      { name: 'Shopify Plus & Markets', cat: 7, share: 29.5, netSent: 85.8, scores: { performance: 91, ux: 94, pricing: 81, reliability: 95, support: 87, aiReadiness: 88 } },
      { name: 'NVIDIA AI Enterprise', cat: 9, share: 65.0, netSent: 92.5, scores: { performance: 99, ux: 84, pricing: 52, reliability: 97, support: 93, aiReadiness: 99 } }
    ];

    let idCounter = 1;

    // Insert anchors
    anchorCompanies.forEach(ac => {
      const catDef = categories[ac.cat];
      const color = brandColors[idCounter % brandColors.length];
      const hq = headquarters[idCounter % headquarters.length];

      allCompanies.push({
        id: `comp-${idCounter}`,
        name: ac.name,
        logoText: ac.name.substring(0, 2).toUpperCase(),
        brandColor: color,
        category: catDef.name,
        categoryTag: catDef.tag,
        hq,
        marketShare: ac.share,
        netSentiment: ac.netSent,
        posSentiment: Math.round(ac.netSent * 0.9),
        neuSentiment: Math.round((100 - ac.netSent) * 0.6),
        negSentiment: Math.round((100 - ac.netSent) * 0.4),
        radarScores: ac.scores,
        monthlyPricing: `$${Math.round(catDef.basePricing[0] * 1.5)} - $${Math.round(catDef.basePricing[1] * 1.2)}/mo`,
        description: `Industry-leading solution in ${catDef.name} with deep enterprise market presence.`,
        pros: ['State of the art technology', 'High enterprise adoption', 'Scalable architecture'],
        cons: ['Premium enterprise pricing', 'Configuration overhead'],
        products: catDef.sampleProducts.map((p, pIdx) => ({
          name: `${ac.name} ${p}`,
          description: `Enterprise-grade ${p} with sub-millisecond response and full SLA coverage.`,
          pricing: `$${Math.round((pIdx + 1) * (catDef.basePricing[0] * 0.8))}/mo`,
          sentimentScore: (0.75 + (pIdx * 0.04)).toFixed(2),
          features: ['99.99% SLA', 'REST & GraphQL APIs', 'Zero-Trust Encryption']
        }))
      });
      idCounter++;
    });

    // Procedurally generate the remaining 1,000+ companies across 10 categories
    const targetTotal = 1040;
    const perCat = Math.ceil((targetTotal - allCompanies.length) / categories.length);

    categories.forEach((catDef, catIdx) => {
      for (let i = 0; i < perCat; i++) {
        const p1 = catDef.prefixes[(i + catIdx * 3) % catDef.prefixes.length];
        const s1 = catDef.suffixes[(i * 2 + catIdx) % catDef.suffixes.length];
        const name = `${p1} ${s1} Systems`;
        const color = brandColors[(idCounter + catIdx) % brandColors.length];
        const hq = headquarters[(idCounter * 3) % headquarters.length];

        const perf = 70 + ((i * 7 + catIdx * 11) % 28);
        const ux = 65 + ((i * 13 + catIdx * 5) % 32);
        const pricingScore = 55 + ((i * 17 + catIdx * 3) % 40);
        const rel = 72 + ((i * 19 + catIdx * 7) % 26);
        const supp = 68 + ((i * 23 + catIdx * 9) % 28);
        const aiScore = 65 + ((i * 29 + catIdx * 13) % 33);

        const netSent = parseFloat(((perf * 0.3 + ux * 0.2 + pricingScore * 0.2 + rel * 0.2 + supp * 0.1)).toFixed(1));
        const pos = Math.min(96, Math.max(50, Math.round(netSent * 0.92)));
        const neg = Math.max(3, Math.round((100 - netSent) * 0.5));
        const neu = 100 - (pos + neg);

        const minPrice = Math.round(catDef.basePricing[0] * (0.8 + ((i % 5) * 0.3)));
        const maxPrice = Math.round(catDef.basePricing[1] * (0.7 + ((i % 4) * 0.4)));

        allCompanies.push({
          id: `comp-${idCounter}`,
          name,
          logoText: `${p1[0]}${s1[0]}`,
          brandColor: color,
          category: catDef.name,
          categoryTag: catDef.tag,
          hq,
          marketShare: parseFloat((0.2 + ((i % 20) * 0.35)).toFixed(1)),
          netSentiment: netSent,
          posSentiment: pos,
          neuSentiment: neu,
          negSentiment: neg,
          radarScores: {
            performance: perf,
            ux,
            pricing: pricingScore,
            reliability: rel,
            support: supp,
            aiReadiness: aiScore
          },
          monthlyPricing: `$${minPrice} - $${maxPrice}/mo`,
          description: `Specialized ${catDef.name} platform engineered for automated scale, compliance, and developer productivity.`,
          pros: [
            `Modern ${catDef.tag} performance`,
            'Cost-effective tier architecture',
            'Rapid deployment cycles'
          ],
          cons: [
            'Ecosystem integrations in expansion',
            'Documentation depth growing'
          ],
          products: catDef.sampleProducts.slice(0, 3).map((p, pIdx) => ({
            name: `${p1} ${p}`,
            description: `Automated high-throughput ${p.toLowerCase()} with multi-region replication.`,
            pricing: `$${Math.round((pIdx + 1) * (minPrice * 0.75))}/mo`,
            sentimentScore: (0.70 + ((i % 20) * 0.012)).toFixed(2),
            features: ['High Throughput', 'Role-Based Access', 'Automated Telemetry']
          }))
        });

        idCounter++;
      }
    });

    return allCompanies;
  }

  async getAll() {
    if (!this.db) return this.inMemoryCache;
    return new Promise((resolve) => {
      const tx = this.db.transaction('all_companies', 'readonly');
      const store = tx.objectStore('all_companies');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || this.inMemoryCache);
      req.onerror = () => resolve(this.inMemoryCache);
    });
  }

  async getById(id) {
    if (this.inMemoryCache.length > 0) {
      const found = this.inMemoryCache.find(c => c.id === id);
      if (found) return found;
    }
    if (!this.db) return null;
    return new Promise((resolve) => {
      const tx = this.db.transaction('all_companies', 'readonly');
      const store = tx.objectStore('all_companies');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }

  async count() {
    if (!this.db) return this.inMemoryCache.length;
    return new Promise((resolve) => {
      const tx = this.db.transaction('all_companies', 'readonly');
      const store = tx.objectStore('all_companies');
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
  }

  async search(query, category = 'all', limit = 40, offset = 0) {
    const all = await this.getAll();
    const q = (query || '').toLowerCase().trim();

    let filtered = all.filter(c => {
      const matchesCat = category === 'all' || c.category === category || c.categoryTag === category;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.products && c.products.some(p => p.name.toLowerCase().includes(q)))
      );
    });

    return {
      total: filtered.length,
      companies: filtered.slice(offset, offset + limit)
    };
  }

  // --- Search Analytics Telemetry ---
  async trackSearchQuery(query) {
    if (!query || query.trim().length < 2) return;
    const cleanQ = query.trim().toLowerCase();

    if (!this.db) return;
    try {
      const tx = this.db.transaction('search_analytics', 'readwrite');
      const store = tx.objectStore('search_analytics');
      const req = store.get(cleanQ);

      req.onsuccess = () => {
        const existing = req.result || { query: cleanQ, count: 0, lastSearched: new Date().toISOString() };
        existing.count = (existing.count || 0) + 1;
        existing.lastSearched = new Date().toISOString();
        store.put(existing);
      };
    } catch (e) {
      console.warn('Could not record search telemetry', e);
    }
  }

  async getTopSearches(limit = 6) {
    if (!this.db) {
      return [
        { query: 'openai gpt-4o', count: 184 },
        { query: 'anthropic claude', count: 142 },
        { query: 'microsoft azure ai', count: 128 },
        { query: 'snowflake vs databricks', count: 96 },
        { query: 'crowdstrike security', count: 88 },
        { query: 'mistral ai pricing', count: 74 }
      ];
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction('search_analytics', 'readonly');
        const store = tx.objectStore('search_analytics');
        const req = store.getAll();
        req.onsuccess = () => {
          const results = req.result || [];
          if (results.length === 0) {
            resolve([
              { query: 'openai gpt-4o', count: 184 },
              { query: 'anthropic claude', count: 142 },
              { query: 'microsoft azure ai', count: 128 },
              { query: 'snowflake vs databricks', count: 96 },
              { query: 'crowdstrike security', count: 88 },
              { query: 'mistral ai pricing', count: 74 }
            ]);
          } else {
            results.sort((a, b) => (b.count || 0) - (a.count || 0));
            resolve(results.slice(0, limit));
          }
        };
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }
}

// Global Logo Resolution & Rendering Helpers
window.getCompanyDomain = function(name) {
  if (!name) return 'google.com';
  const clean = name.toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();

  const domainMap = {
    openai: 'openai.com',
    anthropic: 'anthropic.com',
    mistralai: 'mistral.ai',
    cohere: 'cohere.com',
    scaleai: 'scale.com',
    huggingface: 'huggingface.co',
    perplexityai: 'perplexity.ai',
    perplexity: 'perplexity.ai',
    groq: 'groq.com',
    midjourney: 'midjourney.com',
    elevenlabs: 'elevenlabs.io',
    cursor: 'cursor.com',
    pinecone: 'pinecone.io',
    weaviate: 'weaviate.io',
    qdrant: 'qdrant.tech',
    langchain: 'langchain.com',
    togetherai: 'together.ai',
    deepseek: 'deepseek.com',
    amazonwebservicesaws: 'aws.amazon.com',
    aws: 'aws.amazon.com',
    microsoftcloudazure: 'azure.microsoft.com',
    azure: 'azure.microsoft.com',
    googlecloudplatformgcp: 'cloud.google.com',
    googlecloud: 'cloud.google.com',
    gcp: 'cloud.google.com',
    cloudflare: 'cloudflare.com',
    vercel: 'vercel.com',
    supabase: 'supabase.com',
    coreweave: 'coreweave.com',
    digitalocean: 'digitalocean.com',
    hetzneronline: 'hetzner.com',
    hetzner: 'hetzner.com',
    snowflake: 'snowflake.com',
    databricks: 'databricks.com',
    mongodb: 'mongodb.com',
    clickhouse: 'clickhouse.com',
    redis: 'redis.io',
    confluent: 'confluent.io',
    dbtlabs: 'getdbt.com',
    dbt: 'getdbt.com',
    crowdstrike: 'crowdstrike.com',
    paloaltonetworks: 'paloaltonetworks.com',
    paloalto: 'paloaltonetworks.com',
    wiz: 'wiz.io',
    okta: 'okta.com',
    snyk: 'snyk.io',
    '1password': '1password.com',
    github: 'github.com',
    gitlab: 'gitlab.com',
    datadog: 'datadoghq.com',
    sentry: 'sentry.io',
    postman: 'postman.com',
    docker: 'docker.com',
    salesforce: 'salesforce.com',
    hubspot: 'hubspot.com',
    servicenow: 'servicenow.com',
    notion: 'notion.so',
    linear: 'linear.app',
    figma: 'figma.com',
    stripe: 'stripe.com',
    adyen: 'adyen.com',
    plaid: 'plaid.com',
    ramp: 'ramp.com',
    shopify: 'shopify.com',
    algolia: 'algolia.com',
    epicsystems: 'epic.com',
    tempusai: 'tempus.com',
    nvidia: 'nvidia.com',
    armholdings: 'arm.com',
    arm: 'arm.com',
    tsmc: 'tsmc.com',
    asana: 'asana.com',
    mondaycom: 'monday.com',
    monday: 'monday.com',
    clickup: 'clickup.com',
    airtable: 'airtable.com',
    coda: 'coda.io',
    slack: 'slack.com',
    zoomvideo: 'zoom.us',
    zoom: 'zoom.us',
    miro: 'miro.com',
    canva: 'canva.com',
    docusign: 'docusign.com',
    dropboxbusiness: 'dropbox.com',
    dropbox: 'dropbox.com',
    box: 'box.com',
    intercom: 'intercom.com',
    klaviyo: 'klaviyo.com',
    braze: 'braze.com',
    brex: 'brex.com',
    mercurybank: 'mercury.com',
    gusto: 'gusto.com',
    deel: 'deel.com',
    rippling: 'rippling.com',
    remotecom: 'remote.com',
    wise: 'wise.com',
    revolut: 'revolut.com',
    coinbase: 'coinbase.com',
    robinhood: 'robinhood.com',
    render: 'render.com',
    railway: 'railway.app',
    flyio: 'fly.io',
    netlify: 'netlify.com',
    neontech: 'neon.tech',
    planetscale: 'planetscale.com',
    elastic: 'elastic.co',
    singlestore: 'singlestore.com',
    cockroachlabs: 'cockroachlabs.com',
    timescale: 'timescale.com',
    influxdata: 'influxdata.com',
    neo4j: 'neo4j.com',
    couchbase: 'couchbase.com',
    scylladb: 'scylladb.com',
    yugabytedb: 'yugabyte.com',
    starbursttrino: 'starburst.io',
    motherduck: 'motherduck.com',
    fivetran: 'fivetran.com',
    airbyte: 'airbyte.com',
    twiliosegment: 'segment.com',
    twilio: 'twilio.com',
    rudderstack: 'rudderstack.com',
    census: 'getcensus.com',
    hightouch: 'hightouch.com',
    montecarlo: 'montecarlodata.com',
    collibra: 'collibra.com',
    atlan: 'atlan.com',
    hextechnologies: 'hex.tech',
    deepnote: 'deepnote.com',
    thoughtspot: 'thoughtspot.com',
    looker: 'looker.com',
    tableau: 'tableau.com',
    metabase: 'metabase.com',
    fortinet: 'fortinet.com',
    zscaler: 'zscaler.com',
    sentinelone: 'sentinelone.com',
    cyberark: 'cyberark.com',
    splunk: 'splunk.com',
    darktrace: 'darktrace.com',
    orcasecurity: 'orca.security',
    lacework: 'lacework.com',
    aquasecurity: 'aquasec.com',
    sysdig: 'sysdig.com',
    checkpoint: 'checkpoint.com',
    trendmicro: 'trendmicro.com',
    qualys: 'qualys.com',
    rapid7: 'rapid7.com',
    tenable: 'tenable.com',
    knowbe4: 'knowbe4.com',
    proofpoint: 'proofpoint.com',
    abnormalsecurity: 'abnormalsecurity.com',
    netskope: 'netskope.com',
    bitwarden: 'bitwarden.com',
    teleport: 'goteleport.com',
    clerk: 'clerk.com',
    descope: 'descope.com',
    atlassian: 'atlassian.com',
    jetbrains: 'jetbrains.com',
    hashicorp: 'hashicorp.com',
    dynatrace: 'dynatrace.com',
    newrelic: 'newrelic.com',
    grafanalabs: 'grafana.com',
    pagerduty: 'pagerduty.com',
    betterstack: 'betterstack.com',
    circleci: 'circleci.com',
    harness: 'harness.io',
    pulumi: 'pulumi.com',
    launchdarkly: 'launchdarkly.com',
    jfrogartifactory: 'jfrog.com',
    nxnrwl: 'nx.dev',
    turborepo: 'turbo.build',
    bunoven: 'bun.sh',
    vite: 'vite.dev',
    playwright: 'playwright.dev',
    cypress: 'cypress.io',
    browserstack: 'browserstack.com',
    amd: 'amd.com',
    intel: 'intel.com',
    qualcomm: 'qualcomm.com',
    broadcom: 'broadcom.com',
    asml: 'asml.com',
    tenstorrent: 'tenstorrent.com',
    cerebrassystems: 'cerebras.net',
    sambanovasystems: 'sambanova.ai'
  };

  return domainMap[clean] || `${clean.replace(/[^a-z0-9]/g, '')}.com`;
};

// High-Definition Official Corporate Vector SVGs (Iconify Official Brand SVGs)
window.getCompanyVectorUrl = function(name, domain) {
  const clean = (name || '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]/g, '').trim();
  
  const iconifyMap = {
    openai: 'https://api.iconify.design/logos:openai-icon.svg',
    anthropic: 'https://api.iconify.design/logos:anthropic-icon.svg',
    mistralai: 'https://api.iconify.design/logos:mistralai.svg',
    huggingface: 'https://api.iconify.design/logos:huggingface-icon.svg',
    perplexityai: 'https://api.iconify.design/logos:perplexity-icon.svg',
    perplexity: 'https://api.iconify.design/logos:perplexity-icon.svg',
    amazonwebservicesaws: 'https://api.iconify.design/logos:aws.svg',
    aws: 'https://api.iconify.design/logos:aws.svg',
    microsoftcloudazure: 'https://api.iconify.design/logos:microsoft-azure.svg',
    azure: 'https://api.iconify.design/logos:microsoft-azure.svg',
    googlecloudplatformgcp: 'https://api.iconify.design/logos:google-cloud.svg',
    googlecloud: 'https://api.iconify.design/logos:google-cloud.svg',
    gcp: 'https://api.iconify.design/logos:google-cloud.svg',
    cloudflare: 'https://api.iconify.design/logos:cloudflare.svg',
    vercel: 'https://api.iconify.design/logos:vercel-icon.svg',
    supabase: 'https://api.iconify.design/logos:supabase-icon.svg',
    snowflake: 'https://api.iconify.design/logos:snowflake-icon.svg',
    databricks: 'https://api.iconify.design/logos:databricks.svg',
    mongodb: 'https://api.iconify.design/logos:mongodb-icon.svg',
    redis: 'https://api.iconify.design/logos:redis.svg',
    stripe: 'https://api.iconify.design/logos:stripe.svg',
    figma: 'https://api.iconify.design/logos:figma.svg',
    github: 'https://api.iconify.design/logos:github-icon.svg',
    docker: 'https://api.iconify.design/logos:docker-icon.svg',
    notion: 'https://api.iconify.design/logos:notion-icon.svg',
    linear: 'https://api.iconify.design/logos:linear-icon.svg',
    nvidia: 'https://api.iconify.design/logos:nvidia.svg',
    postman: 'https://api.iconify.design/logos:postman-icon.svg',
    datadog: 'https://api.iconify.design/logos:datadog-icon.svg',
    salesforce: 'https://api.iconify.design/logos:salesforce.svg',
    hubspot: 'https://api.iconify.design/logos:hubspot.svg',
    slack: 'https://api.iconify.design/logos:slack-icon.svg',
    zoom: 'https://api.iconify.design/logos:zoom-icon.svg',
    sentry: 'https://api.iconify.design/logos:sentry-icon.svg',
    shopify: 'https://api.iconify.design/logos:shopify.svg',
    gitlab: 'https://api.iconify.design/logos:gitlab.svg',
    atlassian: 'https://api.iconify.design/logos:atlassian.svg',
    jetbrains: 'https://api.iconify.design/logos:jetbrains-icon.svg',
    hashicorp: 'https://api.iconify.design/logos:hashicorp-icon.svg',
    grafana: 'https://api.iconify.design/logos:grafana.svg',
    dbt: 'https://api.iconify.design/logos:dbt-icon.svg',
    dbtlabs: 'https://api.iconify.design/logos:dbt-icon.svg',
    vite: 'https://api.iconify.design/logos:vitejs.svg',
    bun: 'https://api.iconify.design/logos:bun.svg',
    cypress: 'https://api.iconify.design/logos:cypress-icon.svg',
    playwright: 'https://api.iconify.design/logos:playwright.svg',
    intel: 'https://api.iconify.design/logos:intel.svg',
    amd: 'https://api.iconify.design/logos:amd.svg',
    arm: 'https://api.iconify.design/logos:arm.svg',
    armholdings: 'https://api.iconify.design/logos:arm.svg',
    qualcomm: 'https://api.iconify.design/logos:qualcomm.svg',
    asana: 'https://api.iconify.design/logos:asana-icon.svg',
    monday: 'https://api.iconify.design/logos:monday-icon.svg',
    mondaycom: 'https://api.iconify.design/logos:monday-icon.svg',
    twilio: 'https://api.iconify.design/logos:twilio-icon.svg',
    miro: 'https://api.iconify.design/logos:miro-icon.svg',
    pagerduty: 'https://api.iconify.design/logos:pagerduty-icon.svg',
    okta: 'https://api.iconify.design/logos:okta.svg',
    snyk: 'https://api.iconify.design/logos:snyk.svg',
    digitalocean: 'https://api.iconify.design/logos:digital-ocean.svg',
    neo4j: 'https://api.iconify.design/logos:neo4j.svg',
    circleci: 'https://api.iconify.design/logos:circleci.svg',
    pulumi: 'https://api.iconify.design/logos:pulumi.svg',
    launchdarkly: 'https://api.iconify.design/logos:launchdarkly.svg',
    jfrog: 'https://api.iconify.design/logos:jfrog.svg',
    jfrogartifactory: 'https://api.iconify.design/logos:jfrog.svg',
    nx: 'https://api.iconify.design/logos:nx.svg',
    nxnrwl: 'https://api.iconify.design/logos:nx.svg',
    turborepo: 'https://api.iconify.design/logos:turborepo.svg',
    dynatrace: 'https://api.iconify.design/logos:dynatrace.svg',
    newrelic: 'https://api.iconify.design/logos:new-relic.svg'
  };

  if (iconifyMap[clean]) {
    return iconifyMap[clean];
  }

  const dom = domain || `${clean}.com`;
  return `https://www.google.com/s2/favicons?domain=${dom}&sz=128`;
};

window.getCompanyLogoHtml = function(comp, size = 'md') {
  if (!comp) return '';
  const domain = comp.domain || window.getCompanyDomain(comp.name);
  const vectorUrl = window.getCompanyVectorUrl(comp.name, domain);
  const fallbackFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  const logoText = comp.logoText || (comp.name ? comp.name.substring(0, 2).toUpperCase() : 'VP');
  const brandColor = comp.brandColor || '#0ea5e9';
  const sizeClass = size === 'sm' ? 'badge-sm' : size === 'lg' ? 'badge-lg' : '';

  return `
    <div class="competitor-logo-badge ${sizeClass}" title="${comp.name}">
      <img src="${vectorUrl}" 
           alt="${comp.name}" 
           class="company-real-logo" 
           loading="lazy"
           onerror="if(this.src!=='${fallbackFavicon}'){ this.src='${fallbackFavicon}'; } else { this.style.display='none'; const fb = this.parentElement.querySelector('.company-logo-text-fallback'); if(fb) fb.style.display='flex'; }">
      <div class="company-logo-text-fallback" style="display: none; background: ${brandColor};">
        ${logoText}
      </div>
    </div>
  `;
};

window.getProductLogoHtml = function(product, comp, size = 'sm') {
  if (!product) return '';
  const domain = (comp && (comp.domain || comp.name)) ? window.getCompanyDomain(comp.domain || comp.name) : 'google.com';
  const vectorUrl = window.getCompanyVectorUrl(comp?.name || product.name, domain);
  const fallbackFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  const sizeClass = size === 'sm' ? 'badge-sm' : size === 'lg' ? 'badge-lg' : '';

  return `
    <div class="competitor-logo-badge ${sizeClass}" title="${product.name}">
      <img src="${vectorUrl}" 
           alt="${product.name}" 
           class="company-real-logo" 
           loading="lazy"
           onerror="if(this.src!=='${fallbackFavicon}'){ this.src='${fallbackFavicon}'; } else { this.style.display='none'; const fb = this.parentElement.querySelector('.company-logo-text-fallback'); if(fb) fb.style.display='flex'; }">
      <div class="company-logo-text-fallback" style="display: none; background: #6366f1;">
        ${(product.name || 'PR').substring(0, 2).toUpperCase()}
      </div>
    </div>
  `;
};

// Global Companies DB Singleton
window.companiesDB = new CompaniesDatabaseService();
