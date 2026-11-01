(function (root) {
  'use strict';

  const classes = [
    { name: 'Equity & MF', color: '#2563eb' },
    { name: 'Bank FDs & Liquid Cash', color: '#7c3aed' },
    { name: 'PPF, PF & NPS', color: '#059669' },
    { name: 'Family / Child Savings & Others', color: '#d97706' }
  ];
  const valueFormatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 5
  });
  let activeModel = null;
  let chartLoadPromise = null;
  let trajectoryChart = null;
  let allocationChart = null;
  let revision = 0;

  function amountInCrores(value) {
    return '₹ ' + (value / 10000000).toFixed(2) + ' Cr';
  }

  function amountInLakhs(value) {
    return '₹ ' + (value / 100000).toFixed(2) + ' L';
  }

  function exactLakhs(value) {
    return '₹ ' + valueFormatter.format(value / 100000) + ' L';
  }

  function assetClass(asset) {
    const name = String(asset.name || '').toLowerCase();
    if (/\b(sukanya|ssy|child|family|education|daughter|son)\b/.test(name)) return 3;
    if (asset.cat === 'Equity') return 0;
    if (asset.cat === 'Fixed income' || asset.cat === 'Cash') return 1;
    if (asset.cat === 'Retirement') return 2;
    return 3;
  }

  function createModel(data) {
    const rows = data.rows;
    const assets = data.assets;
    const retirementIndex = Math.max(0, Math.min(rows.length - 1, data.retirementIndex));
    const retirementRow = rows[retirementIndex];
    const currentRow = rows[0];
    const terminalRow = rows[rows.length - 1];
    const afterRetirementIncome = rows.slice(retirementIndex + 1)
      .map(row => row.chg - row.add);
    const annualIncome = afterRetirementIncome.length
      ? afterRetirementIncome.reduce((sum, value) => sum + value, 0) / afterRetirementIncome.length
      : data.fallbackIncome;
    const allocations = [currentRow, retirementRow, terminalRow].map(row => {
      const values = classes.map(() => 0);
      assets.forEach((asset, index) => {
        values[assetClass(asset)] += row.v[index] || 0;
      });
      return { year: row.year, values: values };
    });

    return {
      rows: rows,
      retirementIndex: retirementIndex,
      allocations: allocations,
      metrics: {
        current: currentRow.tot,
        retirement: retirementRow.tot,
        terminal: terminalRow.tot,
        annualIncome: annualIncome,
        roi: data.blendedRoi,
        currentAge: currentRow.age[0],
        retirementAge: retirementRow.age[0],
        terminalAge: terminalRow.age[0]
      }
    };
  }

  function section(model) {
    activeModel = model;
    const current = model.allocations[0];
    const retirement = model.allocations[1];
    const terminal = model.allocations[2];
    const roi = Number.isFinite(model.metrics.roi)
      ? (model.metrics.roi * 100).toFixed(2) + '% ROI'
      : 'ROI unavailable';

    return `<section class="va" aria-labelledby="va-title">
  <div class="va-heading"><div><p class="va-eyebrow">Visual analytics</p><h2 id="va-title">Your wealth, at a glance</h2></div><p class="va-note">Live estimates from your annual projection</p></div>
  <div class="va-kpis" role="group" aria-label="Executive portfolio metrics">
    <article class="va-kpi va-kpi--blue"><p>Current net worth</p><strong>${amountInCrores(model.metrics.current)}</strong><span>${current.year} · Age ${model.metrics.currentAge}</span></article>
    <article class="va-kpi va-kpi--purple"><p>Corpus at retirement</p><strong>${amountInCrores(model.metrics.retirement)}</strong><span>${retirement.year} · Age ${model.metrics.retirementAge} retired</span></article>
    <article class="va-kpi va-kpi--green"><p>Terminal wealth</p><strong>${amountInCrores(model.metrics.terminal)}</strong><span>${terminal.year} · Age ${model.metrics.terminalAge} horizon</span></article>
    <article class="va-kpi va-kpi--amber"><p>Post-retirement income</p><strong>${amountInLakhs(model.metrics.annualIncome)}<small> / yr</small></strong><span>~${amountInLakhs(model.metrics.annualIncome / 12)} / mo · ${roi}</span></article>
  </div>
  <div class="va-grid">
    <article class="va-panel va-panel--trajectory">
      <div class="va-panel-heading"><div><h3>Net Worth Trajectory &amp; Retirement Milestones</h3><p>${model.rows[0].year}–${terminal.year} · values in ₹ Crores</p></div></div>
      <div class="va-chart va-chart--trajectory"><canvas id="va-trajectory" role="img" aria-label="Projected net worth by year, with retirement highlighted"></canvas></div>
    </article>
    <article class="va-panel va-panel--allocation">
      <div class="va-panel-heading"><div><h3>Asset Allocation</h3><p>Portfolio mix by projection year</p></div>
        <label class="va-year-filter" for="va-allocation-year">Year
          <select id="va-allocation-year" aria-label="Allocation projection year">
            <option value="0">${current.year} · Current</option>
            <option value="1">${retirement.year} · Retirement</option>
            <option value="2">${terminal.year} · Terminal</option>
          </select>
        </label>
      </div>
      <div class="va-chart va-chart--allocation"><canvas id="va-allocation" role="img" aria-label="Doughnut chart of asset allocation"></canvas></div>
      <ul class="va-legend" id="va-allocation-legend" aria-label="Asset allocation values"></ul>
    </article>
  </div>
  <p class="va-error" id="va-chart-error" role="alert" hidden>Interactive charts could not load. Check your connection and reload this report.</p>
</section>`;
  }

  function loadChartJs() {
    if (root.Chart) return Promise.resolve(root.Chart);
    if (chartLoadPromise) return chartLoadPromise;

    chartLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js';
      script.async = true;
      script.onload = () => {
        if (root.Chart) resolve(root.Chart);
        else reject(new Error('Chart.js loaded without exposing its global API.'));
      };
      script.onerror = () => reject(new Error('Unable to load Chart.js 4.4.7 from jsDelivr.'));
      document.head.appendChild(script);
    });
    return chartLoadPromise;
  }

  function chartColors() {
    const styles = getComputedStyle(document.documentElement);
    return {
      text: styles.getPropertyValue('--tx').trim() || '#1b2430',
      muted: styles.getPropertyValue('--mu').trim() || '#64748b',
      border: styles.getPropertyValue('--bd').trim() || '#e2e8f0'
    };
  }

  function renderLegend(model, allocationIndex) {
    const list = document.getElementById('va-allocation-legend');
    const values = model.allocations[allocationIndex].values;
    const total = values.reduce((sum, value) => sum + value, 0);
    list.innerHTML = classes.map((item, index) => {
      const share = total ? (values[index] / total * 100).toFixed(1) : '0.0';
      return `<li><span class="va-legend-label"><i style="--va-swatch:${item.color}"></i>${item.name}</span><b title="${exactLakhs(values[index])}">${amountInLakhs(values[index])}</b><small>${share}%</small></li>`;
    }).join('');
  }

  function createCharts(model, Chart) {
    const colors = chartColors();
    const years = model.rows.map(row => row.year);
    const ages = model.rows.map(row => row.age[0]);
    const retirementIndex = model.retirementIndex;
    const trajectoryCanvas = document.getElementById('va-trajectory');
    const allocationCanvas = document.getElementById('va-allocation');
    const context = trajectoryCanvas.getContext('2d');

    trajectoryChart = new Chart(trajectoryCanvas, {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: 'Net worth',
          data: model.rows.map(row => row.tot / 10000000),
          borderColor: '#2563eb',
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          backgroundColor: chart => {
            const area = chart.chart.chartArea;
            if (!area) return 'rgba(37, 99, 235, 0.14)';
            const gradient = context.createLinearGradient(0, area.top, 0, area.bottom);
            gradient.addColorStop(0, 'rgba(37, 99, 235, 0.24)');
            gradient.addColorStop(1, 'rgba(37, 99, 235, 0.015)');
            return gradient;
          },
          pointRadius: chart => chart.dataIndex === retirementIndex ? 6 : 2,
          pointHoverRadius: chart => chart.dataIndex === retirementIndex ? 8 : 5,
          pointBackgroundColor: chart => chart.dataIndex === retirementIndex ? '#7c3aed' : '#ffffff',
          pointBorderColor: chart => chart.dataIndex === retirementIndex ? '#7c3aed' : '#2563eb',
          pointBorderWidth: chart => chart.dataIndex === retirementIndex ? 3 : 1.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: items => {
                const index = items[0].dataIndex;
                return '1 Apr ' + years[index] + ' · Age ' + ages[index] +
                  (index === retirementIndex ? ' · Retirement milestone' : '');
              },
              label: item => 'Net worth: ₹ ' + item.parsed.y.toFixed(2) + ' Cr'
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.muted, maxTicksLimit: 8, maxRotation: 0 }
          },
          y: {
            beginAtZero: true,
            grid: { color: colors.border },
            ticks: {
              color: colors.muted,
              callback: value => '₹ ' + Number(value).toFixed(1) + ' Cr'
            }
          }
        }
      }
    });

    const centerLabel = {
      id: 'vaCenterLabel',
      afterDraw(chart) {
        const allocationIndex = Number(document.getElementById('va-allocation-year').value);
        const allocation = model.allocations[allocationIndex];
        const total = allocation.values.reduce((sum, value) => sum + value, 0);
        const ctx = chart.ctx;
        const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
        const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colors.muted;
        ctx.font = '500 11px Inter, sans-serif';
        ctx.fillText(String(allocation.year), centerX, centerY - 10);
        ctx.fillStyle = colors.text;
        ctx.font = '700 15px Inter, sans-serif';
        ctx.fillText(amountInCrores(total), centerX, centerY + 11);
        ctx.restore();
      }
    };
    allocationChart = new Chart(allocationCanvas, {
      type: 'doughnut',
      data: {
        labels: classes.map(item => item.name),
        datasets: [{
          data: model.allocations[0].values.slice(),
          backgroundColor: classes.map(item => item.color),
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--card').trim() || '#fff',
          borderWidth: 3,
          hoverOffset: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: item => classes[item.dataIndex].name + ': ' + exactLakhs(item.raw)
            }
          }
        }
      },
      plugins: [centerLabel]
    });

    const yearSelect = document.getElementById('va-allocation-year');
    yearSelect.addEventListener('change', () => {
      const index = Number(yearSelect.value);
      allocationChart.data.datasets[0].data = model.allocations[index].values.slice();
      allocationChart.update();
      renderLegend(model, index);
    });
    renderLegend(model, 0);
  }

  function unmount() {
    revision += 1;
    if (trajectoryChart) trajectoryChart.destroy();
    if (allocationChart) allocationChart.destroy();
    trajectoryChart = null;
    allocationChart = null;
    activeModel = null;
  }

  async function mount() {
    const sectionElement = document.querySelector('.va');
    if (!sectionElement || !activeModel) return;
    const model = activeModel;
    const currentRevision = revision;
    try {
      const Chart = await loadChartJs();
      if (currentRevision !== revision || !sectionElement.isConnected) return;
      createCharts(model, Chart);
    } catch (error) {
      if (currentRevision !== revision || !sectionElement.isConnected) return;
      console.error('Unable to initialize projection charts.', error);
      const errorElement = document.getElementById('va-chart-error');
      if (errorElement) errorElement.hidden = false;
    }
  }

  root.VRAnalytics = {
    createModel: createModel,
    section: section,
    mount: mount,
    unmount: unmount
  };
})(window);
