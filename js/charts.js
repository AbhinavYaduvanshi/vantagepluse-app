/**
 * VantagePulse AI™ - High-Performance Canvas Charting Engine
 * Expanded Multi-Chart Visualization Suite: Radar, Grouped Bar, Scatter Value Matrix, Stacked Sentiment, Line & Donut charts.
 */

class VantageChartEngine {
  constructor() {
    this.dpr = window.devicePixelRatio || 1;
  }

  setupCanvas(canvas) {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 420;
    const height = rect.height || 280;

    canvas.width = width * this.dpr;
    canvas.height = height * this.dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(this.dpr, this.dpr);
    return { ctx, width, height };
  }

  // ==========================================
  // 1. Multi-Competitor Radar Chart
  // ==========================================
  renderRadarChart(canvasId, competitors = []) {
    const canvas = document.getElementById(canvasId);
    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    const centerX = width / 2;
    const centerY = height / 2 + 5;
    const radius = Math.min(centerX, centerY) - 38;

    const axes = [
      { label: 'Performance', key: 'performance' },
      { label: 'UI / UX', key: 'ux' },
      { label: 'Pricing Value', key: 'pricing' },
      { label: 'Reliability', key: 'reliability' },
      { label: 'Support', key: 'support' },
      { label: 'AI Readiness', key: 'aiReadiness' }
    ];

    const totalAxes = axes.length;
    const angleSlice = (Math.PI * 2) / totalAxes;

    ctx.clearRect(0, 0, width, height);

    // Draw Polygonal Rings
    const rings = 4;
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-subtle').trim() || '#1e293b';
    ctx.lineWidth = 1;

    for (let r = 1; r <= rings; r++) {
      const ringRadius = (radius / rings) * r;
      ctx.beginPath();
      for (let i = 0; i < totalAxes; i++) {
        const angle = i * angleSlice - Math.PI / 2;
        const x = centerX + ringRadius * Math.cos(angle);
        const y = centerY + ringRadius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Spokes & Labels
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#94a3b8';
    ctx.font = '600 11px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < totalAxes; i++) {
      const angle = i * angleSlice - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      const labelDistance = radius + 22;
      const lx = centerX + labelDistance * Math.cos(angle);
      const ly = centerY + labelDistance * Math.sin(angle);
      ctx.fillStyle = textColor;
      ctx.fillText(axes[i].label, lx, ly);
    }

    // Polygons
    const defaultColors = [
      { fill: 'rgba(56, 189, 248, 0.25)', stroke: '#38bdf8' },
      { fill: 'rgba(217, 119, 6, 0.20)', stroke: '#d97706' },
      { fill: 'rgba(16, 185, 129, 0.20)', stroke: '#10b981' },
      { fill: 'rgba(236, 72, 153, 0.20)', stroke: '#ec4899' },
      { fill: 'rgba(139, 92, 246, 0.20)', stroke: '#8b5cf6' }
    ];

    competitors.slice(0, 5).forEach((comp, idx) => {
      const col = defaultColors[idx % defaultColors.length];
      const strokeCol = comp.brandColor || col.stroke;
      const scores = comp.radarScores || { performance: 80, ux: 75, pricing: 70, reliability: 85, support: 80, aiReadiness: 90 };

      ctx.beginPath();
      for (let i = 0; i < totalAxes; i++) {
        const score = scores[axes[i].key] || 75;
        const normalized = (score / 100) * radius;
        const angle = i * angleSlice - Math.PI / 2;
        const px = centerX + normalized * Math.cos(angle);
        const py = centerY + normalized * Math.sin(angle);

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = col.fill;
      ctx.fill();
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Anchor Points
      for (let i = 0; i < totalAxes; i++) {
        const score = scores[axes[i].key] || 75;
        const normalized = (score / 100) * radius;
        const angle = i * angleSlice - Math.PI / 2;
        const px = centerX + normalized * Math.cos(angle);
        const py = centerY + normalized * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = strokeCol;
        ctx.fill();
      }
    });
  }

  // ==========================================
  // 2. Grouped / Diverging Bar Benchmark Chart
  // ==========================================
  renderBarChart(canvasId, competitors = []) {
    const canvas = document.getElementById(canvasId);
    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    const padLeft = 90;
    const padRight = 30;
    const padTop = 20;
    const padBottom = 30;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    ctx.clearRect(0, 0, width, height);

    const items = competitors.slice(0, 6);
    if (items.length === 0) return;

    const rowHeight = chartH / items.length;
    const barH = Math.min(22, rowHeight * 0.55);

    const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#f8fafc';
    const textMuted = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#64748b';
    const borderSubtle = getComputedStyle(document.documentElement).getPropertyValue('--border-subtle').trim() || '#1e293b';

    // Grid lines (0 to 100)
    ctx.font = '500 10px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = textMuted;

    [0, 25, 50, 75, 100].forEach(val => {
      const x = padLeft + (val / 100) * chartW;
      ctx.strokeStyle = borderSubtle;
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, height - padBottom);
      ctx.stroke();
      ctx.fillText(`${val}%`, x, height - padBottom + 14);
    });

    // Draw Bars for each company
    items.forEach((comp, idx) => {
      const y = padTop + idx * rowHeight + (rowHeight - barH) / 2;
      const score = comp.netSentiment || 75;
      const barW = (score / 100) * chartW;

      // Label (Company Name)
      ctx.font = '600 11px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = textPrimary;
      const truncatedName = comp.name.length > 12 ? comp.name.substring(0, 10) + '..' : comp.name;
      ctx.fillText(truncatedName, padLeft - 10, y + barH / 2);

      // Background Track
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(padLeft, y, chartW, barH);

      // Value Bar
      const grad = ctx.createLinearGradient(padLeft, 0, padLeft + barW, 0);
      grad.addColorStop(0, comp.brandColor || '#38bdf8');
      grad.addColorStop(1, '#6366f1');
      ctx.fillStyle = grad;
      ctx.fillRect(padLeft, y, barW, barH);

      // Value label on bar
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 10px Plus Jakarta Sans, sans-serif';
      ctx.fillText(`${score}%`, padLeft + barW + 6, y + barH / 2);
    });
  }

  // ==========================================
  // 3. Scatter / Bubble Value Matrix Chart
  // ==========================================
  renderScatterMatrix(canvasId, competitors = []) {
    const canvas = document.getElementById(canvasId);
    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    const padLeft = 50;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 45;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    ctx.clearRect(0, 0, width, height);

    const textMuted = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#64748b';
    const borderSubtle = getComputedStyle(document.documentElement).getPropertyValue('--border-subtle').trim() || '#1e293b';

    // X Axis: Pricing Value Score (40 to 100)
    // Y Axis: AI Readiness Score (50 to 100)
    ctx.font = '600 11px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = textMuted;
    ctx.textAlign = 'center';
    ctx.fillText('Pricing-to-Value Score →', padLeft + chartW / 2, height - 10);

    ctx.save();
    ctx.translate(14, padTop + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('AI Readiness Score →', 0, 0);
    ctx.restore();

    // Draw Crosshairs & Quadrants
    ctx.strokeStyle = borderSubtle;
    ctx.lineWidth = 1;

    const midX = padLeft + chartW / 2;
    const midY = padTop + chartH / 2;

    ctx.beginPath();
    ctx.moveTo(midX, padTop);
    ctx.lineTo(midX, height - padBottom);
    ctx.moveTo(padLeft, midY);
    ctx.lineTo(width - padRight, midY);
    ctx.stroke();

    // Quadrant Watermarks
    ctx.font = '700 9px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.textAlign = 'right';
    ctx.fillText('LEADERS (High AI, High Value)', width - padRight - 8, padTop + 14);
    ctx.textAlign = 'left';
    ctx.fillText('SPECIALISTS (High AI, Premium)', padLeft + 8, padTop + 14);

    // Render Competitor Bubbles
    competitors.forEach(comp => {
      const pScore = (comp.radarScores?.pricing || 70) - 40; // 0 to 60
      const aiScore = (comp.radarScores?.aiReadiness || 75) - 50; // 0 to 50

      const x = padLeft + (pScore / 60) * chartW;
      const y = padTop + chartH - (aiScore / 50) * chartH;
      const bubbleRadius = Math.max(6, Math.min(18, (comp.marketShare || 5) * 0.45));

      // Glow Bubble
      ctx.beginPath();
      ctx.arc(x, y, bubbleRadius, 0, Math.PI * 2);
      ctx.fillStyle = comp.brandColor || '#38bdf8';
      ctx.globalAlpha = 0.75;
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Bubble Label
      ctx.font = '700 10px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(comp.logoText || comp.name.substring(0, 2), x, y + 3);
    });
  }

  // ==========================================
  // 4. Stacked Sentiment Distribution Bar Chart
  // ==========================================
  renderStackedSentiment(canvasId, competitors = []) {
    const canvas = document.getElementById(canvasId);
    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    const padLeft = 85;
    const padRight = 30;
    const padTop = 25;
    const padBottom = 35;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    ctx.clearRect(0, 0, width, height);

    const items = competitors.slice(0, 6);
    if (items.length === 0) return;

    const rowHeight = chartH / items.length;
    const barH = Math.min(20, rowHeight * 0.55);

    const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#f8fafc';
    const textMuted = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#64748b';

    // Legend at Top
    ctx.font = '600 10px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'left';
    
    // Pos Legend
    ctx.fillStyle = 'hsl(152, 76%, 40%)';
    ctx.fillRect(padLeft, 8, 10, 10);
    ctx.fillStyle = textPrimary;
    ctx.fillText('Positive %', padLeft + 14, 16);

    // Neu Legend
    ctx.fillStyle = 'hsl(43, 96%, 52%)';
    ctx.fillRect(padLeft + 90, 8, 10, 10);
    ctx.fillStyle = textPrimary;
    ctx.fillText('Neutral %', padLeft + 104, 16);

    // Neg Legend
    ctx.fillStyle = 'hsl(0, 84%, 60%)';
    ctx.fillRect(padLeft + 180, 8, 10, 10);
    ctx.fillStyle = textPrimary;
    ctx.fillText('Negative %', padLeft + 194, 16);

    items.forEach((comp, idx) => {
      const y = padTop + idx * rowHeight + (rowHeight - barH) / 2;
      const pos = comp.posSentiment || 70;
      const neu = comp.neuSentiment || 18;
      const neg = comp.negSentiment || 12;

      const posW = (pos / 100) * chartW;
      const neuW = (neu / 100) * chartW;
      const negW = (neg / 100) * chartW;

      // Label
      ctx.font = '600 11px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = textPrimary;
      const truncated = comp.name.length > 11 ? comp.name.substring(0, 9) + '..' : comp.name;
      ctx.fillText(truncated, padLeft - 10, y + barH / 2);

      // Stacked Bar Segments
      ctx.fillStyle = 'hsl(152, 76%, 40%)';
      ctx.fillRect(padLeft, y, posW, barH);

      ctx.fillStyle = 'hsl(43, 96%, 52%)';
      ctx.fillRect(padLeft + posW, y, neuW, barH);

      ctx.fillStyle = 'hsl(0, 84%, 60%)';
      ctx.fillRect(padLeft + posW + neuW, y, negW, barH);
    });
  }

  // ==========================================
  // 5. Sentiment Trajectory Line Chart
  // ==========================================
  renderSentimentTrendChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    const padLeft = 45;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 35;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    ctx.clearRect(0, 0, width, height);

    const quarters = ['Q3 25', 'Q4 25', 'Q1 26', 'Q2 26', 'Q3 26 (Now)'];
    const datasets = [
      { name: 'OpenAI', color: '#10a37f', points: [71, 74, 76, 75, 78.4] },
      { name: 'Claude', color: '#d97706', points: [68, 73, 79, 81, 84.1] },
      { name: 'Azure AI', color: '#0078d4', points: [72, 75, 77, 78, 79.5] }
    ];

    const textMuted = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#64748b';
    const borderSubtle = getComputedStyle(document.documentElement).getPropertyValue('--border-subtle').trim() || '#1e293b';

    ctx.font = '500 11px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = textMuted;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const yLevels = [50, 65, 80, 95];
    yLevels.forEach(val => {
      const y = padTop + chartH - ((val - 50) / 50) * chartH;
      ctx.strokeStyle = borderSubtle;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.fillText(`${val}%`, padLeft - 8, y);
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const stepX = chartW / (quarters.length - 1);
    quarters.forEach((q, i) => {
      const x = padLeft + i * stepX;
      ctx.fillText(q, x, padTop + chartH + 10);
    });

    datasets.forEach(ds => {
      ctx.beginPath();
      const coords = ds.points.map((pt, i) => {
        const x = padLeft + i * stepX;
        const y = padTop + chartH - ((pt - 50) / 50) * chartH;
        return { x, y };
      });

      ctx.moveTo(coords[0].x, coords[0].y);
      for (let i = 1; i < coords.length; i++) {
        const midX = (coords[i - 1].x + coords[i].x) / 2;
        ctx.bezierCurveTo(midX, coords[i - 1].y, midX, coords[i].y, coords[i].x, coords[i].y);
      }
      ctx.strokeStyle = ds.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      coords.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = ds.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    });
  }

  // ==========================================
  // 6. Market Share Donut Chart
  // ==========================================
  renderMarketShareDonut(canvasId, competitors = []) {
    const canvas = document.getElementById(canvasId);
    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const innerRadius = radius * 0.62;

    ctx.clearRect(0, 0, width, height);

    let startAngle = -Math.PI / 2;
    const total = competitors.reduce((acc, c) => acc + (c.marketShare || 10), 0);

    competitors.forEach(comp => {
      const sliceAngle = ((comp.marketShare || 10) / total) * (Math.PI * 2);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = comp.brandColor || '#38bdf8';
      ctx.fill();

      startAngle += sliceAngle;
    });

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#ffffff';
    ctx.font = '800 18px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('100%', centerX, centerY - 6);

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#94a3b8';
    ctx.font = '600 11px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Share of Voice', centerX, centerY + 14);
  }
}

// Global Charts Engine instance
window.vantageCharts = new VantageChartEngine();
