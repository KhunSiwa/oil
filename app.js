/* ==========================================
   SMART LUBRICATION MONITORING - LOGIC & STATS
   ========================================== */

// 1. GLOBAL STATE DEFINITIONS
const state = {
  theme: 'dark',
  currentView: 'dashboard',
  currentFactory: 'tx-plant',
  selectedMachineId: 'pump-4', // Default to Pump 4 (the critical machine)
  twinAnimationActive: true,
  alertCount: 3,
  
  // Settings & Thresholds
  thresholds: {
    temp: 80,
    moisture: 250,
    metal: 25
  },
  
  // Static Historical Data for Charts
  timeLabels24h: Array.from({ length: 24 }, (_, i) => `${(i + 12) % 24}:00`),
  
  // Machine Registry & Telemetry Data
  machines: {
    'pump-1': {
      id: 'pump-1',
      name: 'Hydraulic Press #1',
      uid: 'LUB-PRESS-001',
      zone: 'Zone A - Press Shop',
      criticality: 'Class 2 (Standard Duty)',
      oilType: 'Mobil DTE 25 Ultra',
      lastOilChange: 'May 10, 2026',
      status: 'normal',
      health: 98,
      baseSensors: { temp: 48.5, pressure: 4.2, flow: 15.2, level: 91.0, moisture: 120, viscosity: 322, metal: 6.8, leak: false },
      sensors: {},
      history: { temp: [], pressure: [], flow: [] }
    },
    'pump-2': {
      id: 'pump-2',
      name: 'Hydraulic Press #2',
      uid: 'LUB-PRESS-002',
      zone: 'Zone A - Press Shop',
      criticality: 'Class 2 (Standard Duty)',
      oilType: 'Mobil DTE 25 Ultra',
      lastOilChange: 'May 14, 2026',
      status: 'normal',
      health: 95,
      baseSensors: { temp: 51.2, pressure: 4.0, flow: 14.8, level: 88.5, moisture: 145, viscosity: 318, metal: 9.2, leak: false },
      sensors: {},
      history: { temp: [], pressure: [], flow: [] }
    },
    'pump-3': {
      id: 'pump-3',
      name: 'Cooling Pump #1',
      uid: 'LUB-COOL-001',
      zone: 'Zone A - Press Shop',
      criticality: 'Class 3 (Light Duty)',
      oilType: 'Castrol Hyspin AWH-M 46',
      lastOilChange: 'June 01, 2026',
      status: 'normal',
      health: 96,
      baseSensors: { temp: 42.0, pressure: 3.5, flow: 18.1, level: 93.0, moisture: 95, viscosity: 45.8, metal: 3.4, leak: false },
      sensors: {},
      history: { temp: [], pressure: [], flow: [] }
    },
    'pump-4': {
      id: 'pump-4',
      name: 'Main Feed Pump #4',
      uid: 'LUB-PUMP-004',
      zone: 'Zone A - Press Shop',
      criticality: 'Class 1 (High Duty)',
      oilType: 'Shell Omala S4 WE 320',
      lastOilChange: 'April 12, 2026',
      status: 'critical',
      health: 42,
      baseSensors: { temp: 84.2, pressure: 4.8, flow: 12.5, level: 82.0, moisture: 340, viscosity: 288, metal: 42.5, leak: true },
      sensors: {},
      history: { temp: [], pressure: [], flow: [] }
    },
    'turb-1': {
      id: 'turb-1',
      name: 'Steam Turbine #12',
      uid: 'LUB-TURB-012',
      zone: 'Zone B - Assembly Loop',
      criticality: 'Class 1 (High Duty)',
      oilType: 'Shell Turbo T 68',
      lastOilChange: 'Jan 20, 2026',
      status: 'normal',
      health: 91,
      baseSensors: { temp: 58.4, pressure: 5.1, flow: 22.4, level: 95.0, moisture: 82, viscosity: 67.2, metal: 12.1, leak: false },
      sensors: {},
      history: { temp: [], pressure: [], flow: [] }
    },
    'turb-2': {
      id: 'turb-2',
      name: 'Reciprocating Comp. #3',
      uid: 'LUB-COMP-003',
      zone: 'Zone B - Assembly Loop',
      criticality: 'Class 2 (Standard Duty)',
      oilType: 'Mobil Rarus SHC 1026',
      lastOilChange: 'March 18, 2026',
      status: 'warning',
      health: 74,
      baseSensors: { temp: 72.5, pressure: 3.1, flow: 9.8, level: 74.0, moisture: 280, viscosity: 308, metal: 18.2, leak: false },
      sensors: {},
      history: { temp: [], pressure: [], flow: [] }
    },
    'gear-1': {
      id: 'gear-1',
      name: 'Heavy Gearbox #9',
      uid: 'LUB-GEAR-009',
      zone: 'Zone B - Assembly Loop',
      criticality: 'Class 1 (High Duty)',
      oilType: 'Shell Omala S4 WE 320',
      lastOilChange: 'Feb 15, 2026',
      status: 'normal',
      health: 91,
      baseSensors: { temp: 56.1, pressure: 2.8, flow: 8.5, level: 86.0, moisture: 130, viscosity: 324, metal: 11.5, leak: false },
      sensors: {},
      history: { temp: [], pressure: [], flow: [] }
    },
    'gear-2': {
      id: 'gear-2',
      name: 'Draft Fan #2',
      uid: 'LUB-FAN-002',
      zone: 'Zone B - Assembly Loop',
      criticality: 'Class 3 (Light Duty)',
      oilType: 'Castrol Alphasyn HG 220',
      lastOilChange: 'June 24, 2026',
      status: 'normal',
      health: 94,
      baseSensors: { temp: 46.8, pressure: 2.2, flow: 10.4, level: 89.2, moisture: 115, viscosity: 218, metal: 5.2, leak: false },
      sensors: {},
      history: { temp: [], pressure: [], flow: [] }
    }
  },
  
  // Alerts registry
  alerts: [
    { id: 1, type: 'critical', machine: 'Main Feed Pump #4', msg: 'Lubricant metal particle density (42.5 ppm) exceeds limit class ISO 21/19/16.', time: '11:50:10' },
    { id: 2, type: 'critical', machine: 'Main Feed Pump #4', msg: 'Lubrication casing leak sensor reporting outer moisture/viscous trace.', time: '11:48:22' },
    { id: 3, type: 'warning', machine: 'Reciprocating Comp. #3', msg: 'Moisture content rising (280 ppm). Risk of ester hydrolysis.', time: '11:36:15' },
    { id: 4, type: 'info', machine: 'Steam Turbine #12', msg: 'Scheduled preventative desiccant replacement planned for Aug 17.', time: '10:14:00' },
    { id: 5, type: 'info', machine: 'Heavy Gearbox #9', msg: 'Automated oil sample analysis verified. Lab sample LAB-5712-1 matched.', time: '09:20:45' }
  ]
};

// 2. CHART INSTANCES HOLDER
const charts = {
  telemetry: null,
  consumption: null,
  downtime: null,
  rul: null,
  savings: null,
  qualityTrend: null,
  spectral: null
};

// Initialize sensor values and history arrays for smooth chart plotting
function initSensorSimulators() {
  Object.keys(state.machines).forEach(key => {
    const m = state.machines[key];
    m.sensors = { ...m.baseSensors };
    
    // Generate historical baseline charts data (24h back)
    for (let i = 0; i < 24; i++) {
      const variance = (Math.random() - 0.5) * 2;
      m.history.temp.push(m.baseSensors.temp + variance);
      m.history.pressure.push(m.baseSensors.pressure + (Math.random() - 0.5) * 0.4);
      m.history.flow.push(m.baseSensors.flow + (Math.random() - 0.5) * 1.5);
    }
  });
}

// Tick Simulation: fluctuate values slightly
function runSensorSimulations() {
  Object.keys(state.machines).forEach(key => {
    const m = state.machines[key];
    
    // Pump #4 fluctuates in degraded critical state, other machines fluctuate in normal states
    const factor = m.id === 'pump-4' ? 1.5 : 0.4;
    m.sensors.temp += (Math.random() - 0.5) * factor;
    m.sensors.pressure += (Math.random() - 0.5) * 0.1;
    m.sensors.flow += (Math.random() - 0.5) * 0.2;
    
    // Clamp levels
    if (m.sensors.temp < 10) m.sensors.temp = 10;
    if (m.sensors.pressure < 0) m.sensors.pressure = 0;
    if (m.sensors.flow < 0) m.sensors.flow = 0;

    // Shift arrays and append current sensor readings
    m.history.temp.shift();
    m.history.temp.push(m.sensors.temp);
    m.history.pressure.shift();
    m.history.pressure.push(m.sensors.pressure);
    m.history.flow.shift();
    m.history.flow.push(m.sensors.flow);
  });

  // Check safety thresholds for notifications
  checkThresholds();
}

function checkThresholds() {
  // Read current thresholds from state
  const activeMachine = state.machines[state.selectedMachineId];
  if (activeMachine.sensors.temp > state.thresholds.temp && activeMachine.status !== 'critical') {
    pushAlert('critical', activeMachine.name, `Temperature anomaly! Lubricant temp is currently ${activeMachine.sensors.temp.toFixed(1)}°C (Limit: ${state.thresholds.temp}°C)`);
  }
}

function pushAlert(type, machine, msg) {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  const newAlert = {
    id: Date.now(),
    type,
    machine,
    msg,
    time: timeStr
  };
  state.alerts.unshift(newAlert);
  state.alertCount++;
  
  // Update view UI counters & notification bell
  updateAlertBadges();
  renderAlertsTimeline();
  showToast(type, machine, msg);
}

function showToast(type, machine, msg) {
  const container = document.body;
  const toast = document.createElement('div');
  toast.className = `noti-item unread ${type === 'critical' ? 'critical' : 'warning'}`;
  toast.style.position = 'fixed';
  toast.style.bottom = '80px';
  toast.style.right = '24px';
  toast.style.width = '320px';
  toast.style.backgroundColor = 'var(--bg-secondary)';
  toast.style.border = '1px solid var(--border-color)';
  toast.style.borderRadius = '10px';
  toast.style.boxShadow = 'var(--shadow-card)';
  toast.style.padding = '12px 16px';
  toast.style.display = 'flex';
  toast.style.gap = '12px';
  toast.style.zIndex = '999';
  toast.style.animation = 'slide-in 0.3s ease forwards';

  toast.innerHTML = `
    <div class="noti-icon"><i data-lucide="alert-triangle"></i></div>
    <div class="noti-info" style="flex-grow:1;">
      <p style="font-size:12px; margin:0;"><strong>${machine}:</strong> ${msg}</p>
    </div>
  `;
  container.appendChild(toast);
  lucide.createIcons({ attrs: { 'stroke-width': 2 } });
  
  setTimeout(() => {
    toast.style.animation = 'fade-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// 3. UI RENDER AND UPDATES
function updateAlertBadges() {
  const badges = document.querySelectorAll('.alert-badge-count');
  badges.forEach(b => {
    b.textContent = state.alertCount;
  });
  
  const pulseIndicator = document.querySelector('.pulse-indicator');
  if (pulseIndicator) {
    pulseIndicator.style.display = state.alertCount > 0 ? 'block' : 'none';
  }
}

// Render dynamic clocks
function startClock() {
  const clockTime = document.getElementById('clock-time');
  const clockDate = document.getElementById('clock-date');
  
  function updateTime() {
    const now = new Date();
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const dateOptions = { month: 'short', day: '2-digit', year: 'numeric' };
    
    if (clockTime) clockTime.textContent = now.toLocaleTimeString('en-US', timeOptions);
    if (clockDate) clockDate.textContent = now.toLocaleDateString('en-US', dateOptions);
  }
  
  updateTime();
  setInterval(updateTime, 1000);
}

// Render Alerts View timeline
function renderAlertsTimeline() {
  const timeline = document.getElementById('alerts-full-timeline');
  if (!timeline) return;

  timeline.innerHTML = '';
  
  state.alerts.forEach(alert => {
    const item = document.createElement('div');
    item.className = `timeline-item ${alert.type}`;
    item.innerHTML = `
      <div class="timeline-marker"></div>
      <span class="timeline-time">${alert.time}</span>
      <div class="timeline-content">
        <h4>${alert.machine}</h4>
        <p>${alert.msg}</p>
      </div>
    `;
    timeline.appendChild(item);
  });
}

// Render Notification dropdown panel
function renderNotificationsDropdown() {
  const container = document.getElementById('noti-list-container');
  if (!container) return;
  
  container.innerHTML = '';
  state.alerts.slice(0, 4).forEach(alert => {
    const item = document.createElement('li');
    item.className = `noti-item unread ${alert.type}`;
    item.innerHTML = `
      <div class="noti-icon"><i data-lucide="${alert.type === 'critical' ? 'alert-triangle' : 'alert-circle'}"></i></div>
      <div class="noti-info">
        <p class="noti-desc"><strong>${alert.machine}:</strong> ${alert.msg}</p>
        <span class="noti-time">${alert.time}</span>
      </div>
    `;
    container.appendChild(item);
  });
  lucide.createIcons();
}

// Update KPI cards on home dashboard
function updateKPICards() {
  // Aggregate KPIs
  const totalMachines = Object.keys(state.machines).length;
  const activeMachines = Object.values(state.machines).filter(m => m.sensors.flow > 1.0).length;
  
  // Calculate average oil health
  const avgHealth = Math.round(Object.values(state.machines).reduce((acc, curr) => acc + curr.health, 0) / totalMachines);
  
  // Calculate average temperature
  const avgTemp = (Object.values(state.machines).reduce((acc, curr) => acc + curr.sensors.temp, 0) / totalMachines).toFixed(1);
  
  // Select DOM targets
  const domTotal = document.getElementById('kpi-total-machines');
  const domActive = document.getElementById('kpi-active-machines');
  const domHealth = document.getElementById('kpi-oil-health');
  const domTemp = document.getElementById('kpi-avg-temp');
  
  if (domTotal) domTotal.textContent = totalMachines;
  if (domActive) domActive.textContent = activeMachines;
  if (domHealth) domHealth.textContent = `${avgHealth}%`;
  if (domTemp) domTemp.textContent = `${avgTemp}°C`;

  // Update current active card focus diagnostics info
  const m = state.machines[state.selectedMachineId];
  const domFocusName = document.getElementById('focus-machine-name');
  const domFocusRUL = document.getElementById('focus-rul-days');
  const domFocusScore = document.getElementById('focus-health-score');
  const domFocusFill = document.getElementById('focus-health-fill');
  const domFocusRec = document.getElementById('focus-ai-rec-text');
  
  if (domFocusName) domFocusName.textContent = m.name;
  if (domFocusRUL) {
    const days = m.id === 'pump-4' ? '6 Days' : m.id === 'turb-2' ? '18 Days' : '60 Days';
    domFocusRUL.textContent = days;
    domFocusRUL.className = m.id === 'pump-4' ? 'ai-metric-val highlight-danger' : m.id === 'turb-2' ? 'ai-metric-val text-warning' : 'ai-metric-val text-success';
  }
  if (domFocusScore) {
    domFocusScore.textContent = `${m.health}%`;
    domFocusScore.style.color = m.health < 50 ? 'var(--status-red)' : m.health < 80 ? 'var(--status-yellow)' : 'var(--status-green)';
  }
  if (domFocusFill) {
    domFocusFill.style.width = `${m.health}%`;
    domFocusFill.style.backgroundColor = m.health < 50 ? 'var(--status-red)' : m.health < 80 ? 'var(--status-yellow)' : 'var(--status-green)';
  }
  if (domFocusRec) {
    domFocusRec.textContent = getRecommendationText(m.id, m.sensors.temp, m.sensors.viscosity, m.sensors.moisture);
  }
}

function getRecommendationText(id, temp, visc, moisture) {
  if (id === 'pump-4') {
    return `"Possible contamination detected. Metal particle density (42 ppm) is increasing. Lubrication quality is decreasing. Replace filter within 6 days to avoid bearings friction damage."`;
  } else if (id === 'turb-2') {
    return `"Moisture concentration warning (280 ppm). desiccant breather saturation reached 90%. Replace desiccant filter cartridge within 12 days to prevent oil hydrolysis."`;
  } else {
    return `"All lubricant parameters within normal bounds. Baseline wear models indicate stable operational degradation. Next routine check in 28 days."`;
  }
}

// 4. GAUGES RENDERING & THRESHOLD TRANSITIONS
function updateGauges() {
  const m = state.machines[state.selectedMachineId];
  if (!m) return;
  
  // Active Machine Names
  const monitorActiveName = document.getElementById('monitor-active-machine');
  if (monitorActiveName) monitorActiveName.textContent = m.name;

  // Temperature Gauge
  updateRadialGauge('g-temp', m.sensors.temp, 100, '°C', { warn: 70, crit: state.thresholds.temp });
  
  // Pressure Gauge
  updateRadialGauge('g-pressure', m.sensors.pressure, 8, 'bar', { warn: 5.5, crit: 6.5, minWarn: 2.2, minCrit: 1.8 });
  
  // Flow Rate
  updateRadialGauge('g-flow', m.sensors.flow, 25, 'L/m', { warn: 18, crit: 22, minWarn: 8, minCrit: 6 });
  
  // Oil Level
  updateRadialGauge('g-level', m.sensors.level, 100, '%', { minWarn: 40, minCrit: 20 });
  
  // Oil Quality Index
  updateRadialGauge('g-oqi', m.sensors.oqi, 100, 'OQI', { minWarn: 70, minCrit: 50 });
  
  // Moisture
  updateRadialGauge('g-moisture', m.sensors.moisture, 500, 'ppm', { warn: 200, crit: state.thresholds.moisture });
  
  // Viscosity
  updateRadialGauge('g-viscosity', m.sensors.viscosity, 400, 'cSt', { warn: 352, crit: 368, minWarn: 288, minCrit: 272 });
  
  // Metal Particle
  updateRadialGauge('g-metal', m.sensors.metal, 60, 'ppm', { warn: 15, crit: state.thresholds.metal });
  
  // Leak Indicator status
  const leakIndicator = document.getElementById('g-leak-indicator');
  const leakText = document.getElementById('g-leak-text');
  if (leakIndicator && leakText) {
    if (m.sensors.leak) {
      leakIndicator.className = 'leak-indicator-ring status-critical';
      leakText.textContent = 'LEAK DETECTED';
    } else {
      leakIndicator.className = 'leak-indicator-ring status-normal';
      leakText.textContent = 'SYSTEM SEALED';
    }
  }

  // Sync HUD items on the digital twin overlay
  const twinTemp = document.getElementById('twin-hud-temp');
  const twinVisc = document.getElementById('twin-hud-visc');
  const twinFlow = document.getElementById('twin-hud-flow');
  const twinBadge = document.getElementById('twin-hud-status-badge');
  const twinModelName = document.getElementById('twin-model-name');
  
  if (twinTemp) twinTemp.textContent = `${m.sensors.temp.toFixed(1)}°C`;
  if (twinVisc) twinVisc.textContent = `${m.sensors.viscosity.toFixed(0)} cSt`;
  if (twinFlow) twinFlow.textContent = `${m.sensors.flow.toFixed(1)} L/m`;
  if (twinModelName) twinModelName.textContent = `${m.name} Gearbox`;
  
  if (twinBadge) {
    if (m.status === 'critical') {
      twinBadge.className = 'hud-status status-danger pulse';
      twinBadge.textContent = 'TELEMETRY DEGRADED';
    } else if (m.status === 'warning') {
      twinBadge.className = 'hud-status status-warning';
      twinBadge.textContent = 'WARNING TRIGGERED';
      twinBadge.style.backgroundColor = 'rgba(245,158,11,0.2)';
      twinBadge.style.color = 'var(--status-yellow)';
      twinBadge.style.border = '1px solid var(--status-yellow)';
    } else {
      twinBadge.className = 'hud-status';
      twinBadge.textContent = 'SYSTEM OPERATIONAL';
      twinBadge.style.backgroundColor = 'rgba(16,185,129,0.2)';
      twinBadge.style.color = 'var(--status-green)';
      twinBadge.style.border = '1px solid var(--status-green)';
    }
  }

  // Update ping colors based on variables
  const pingTemp = document.getElementById('hotspot-ping-temp');
  const pingVisc = document.getElementById('hotspot-ping-visc');
  const pingFlow = document.getElementById('hotspot-ping-flow');
  
  if (pingTemp) pingTemp.className = `hotspot-ping ${getAlertClass(m.sensors.temp, { warn: 70, crit: state.thresholds.temp })}`;
  if (pingVisc) pingVisc.className = `hotspot-ping ${getAlertClass(m.sensors.viscosity, { warn: 352, crit: 368, minWarn: 288, minCrit: 272 })}`;
  if (pingFlow) pingFlow.className = `hotspot-ping ${getAlertClass(m.sensors.flow, { warn: 18, crit: 22, minWarn: 8, minCrit: 6 })}`;
}

function getAlertClass(val, thresholds) {
  if (thresholds.crit && val >= thresholds.crit) return 'red';
  if (thresholds.minCrit && val <= thresholds.minCrit) return 'red';
  if (thresholds.warn && val >= thresholds.warn) return 'yellow';
  if (thresholds.minWarn && val <= thresholds.minWarn) return 'yellow';
  return 'green';
}

function updateRadialGauge(idPrefix, val, max, unit, thresholds) {
  const valCircle = document.getElementById(`${idPrefix}-circle`);
  const valText = document.getElementById(`${idPrefix}-val`);
  const statusBadge = document.getElementById(`${idPrefix}-status`);
  
  if (!valCircle || !valText) return;
  
  // Calculate percentage
  let percentage = (val / max);
  if (percentage > 1) percentage = 1;
  if (percentage < 0) percentage = 0;
  
  // Circumference of radius 45 is 282.74
  const strokeDashoffset = 283 * (1 - percentage);
  valCircle.style.strokeDashoffset = strokeDashoffset;
  
  // Update numeric readout
  valText.textContent = val.toFixed(1);
  
  // Determine state class & label
  let status = 'normal';
  let badgeLabel = 'Normal';
  let color = 'var(--status-green)';
  
  if (thresholds.crit && val >= thresholds.crit) {
    status = 'critical';
    badgeLabel = 'Critical';
    color = 'var(--status-red)';
  } else if (thresholds.minCrit && val <= thresholds.minCrit) {
    status = 'critical';
    badgeLabel = 'Critical';
    color = 'var(--status-red)';
  } else if (thresholds.warn && val >= thresholds.warn) {
    status = 'warning';
    badgeLabel = 'Warning';
    color = 'var(--status-yellow)';
  } else if (thresholds.minWarn && val <= thresholds.minWarn) {
    status = 'warning';
    badgeLabel = 'Warning';
    color = 'var(--status-yellow)';
  }
  
  // Apply visual colors
  valCircle.style.stroke = color;
  
  if (statusBadge) {
    statusBadge.textContent = badgeLabel;
    statusBadge.className = `gauge-status-badge ${status}`;
  }
}

// 5. CHART HANDLERS & CHART.JS CONFIGS
function initCharts() {
  // Set theme properties
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(11, 31, 58, 0.05)';
  const textColor = isDark ? '#9CA3AF' : '#4B5563';

  // Config common options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Inter', size: 10 } } },
      y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Inter', size: 10 } } }
    }
  };

  // Chart 1: Real-time telemetry line
  const m = state.machines[state.selectedMachineId];
  const ctxTelemetry = document.getElementById('dashboard-telemetry-chart');
  if (ctxTelemetry) {
    charts.telemetry = new Chart(ctxTelemetry, {
      type: 'line',
      data: {
        labels: state.timeLabels24h,
        datasets: [{
          data: m.history.temp,
          borderColor: '#2563EB',
          borderWidth: 2,
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 0
        }]
      },
      options: commonOptions
    });
  }

  // Chart 2: Oil Consumption Area
  const ctxCons = document.getElementById('dashboard-consumption-chart');
  if (ctxCons) {
    charts.consumption = new Chart(ctxCons, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        datasets: [{
          data: [280, 240, 310, 290, 420, 360, 390, 410],
          borderColor: '#F5B301',
          borderWidth: 2,
          backgroundColor: 'rgba(245, 179, 1, 0.05)',
          fill: true,
          tension: 0.2
        }]
      },
      options: commonOptions
    });
  }

  // Chart 3: Downtime analysis weekly
  const ctxDown = document.getElementById('dashboard-downtime-chart');
  if (ctxDown) {
    charts.downtime = new Chart(ctxDown, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          data: [12, 18, 0, 45, 18, 0, 0],
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderRadius: 4
        }]
      },
      options: commonOptions
    });
  }

  // Chart 4: TensorFlow RUL Projection Curve
  const ctxRul = document.getElementById('ai-rul-projection-chart');
  if (ctxRul) {
    charts.rul = new Chart(ctxRul, {
      type: 'line',
      data: {
        labels: ['Day -14', 'Day -12', 'Day -10', 'Day -8', 'Day -6', 'Day -4', 'Day -2', 'Today'],
        datasets: [
          {
            label: 'Actual Health Index',
            data: [90, 85, 78, 68, 55, 48, 44, 42],
            borderColor: '#EF4444',
            borderWidth: 3,
            backgroundColor: 'transparent',
            tension: 0.1
          },
          {
            label: 'AI Predict Vector',
            data: [90, 85, 78, 69, 58, 49, 41, 38, 25, 12, 0],
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderDash: [5, 5],
            borderWidth: 1.5,
            backgroundColor: 'transparent'
          }
        ]
      },
      options: {
        ...commonOptions,
        plugins: { legend: { display: true, labels: { color: textColor, font: { family: 'Inter', size: 10 } } } }
      }
    });
  }

  // Chart 5: Savings Chart
  const ctxSavings = document.getElementById('predictive-savings-chart');
  if (ctxSavings) {
    charts.savings = new Chart(ctxSavings, {
      type: 'bar',
      data: {
        labels: ['Unscheduled Fixes', 'Smart PM Schedule'],
        datasets: [{
          data: [142000, 38000],
          backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(16, 185, 129, 0.8)'],
          borderRadius: 6
        }]
      },
      options: {
        ...commonOptions,
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor } }
        }
      }
    });
  }

  // Chart 6: Chemical Quality Contaminants Trend
  const ctxQual = document.getElementById('spectroscopic-contaminants-chart');
  if (ctxQual) {
    charts.qualityTrend = new Chart(ctxQual, {
      type: 'line',
      data: {
        labels: ['Jul 22', 'Jul 24', 'Jul 26', 'Jul 28', 'Jul 30', 'Aug 01', 'Aug 03', 'Aug 05'],
        datasets: [
          {
            label: 'Iron (Fe) ppm',
            data: [12, 14, 18, 24, 30, 36, 40, 42],
            borderColor: '#EF4444',
            borderWidth: 2,
            tension: 0.2
          },
          {
            label: 'Copper (Cu) ppm',
            data: [4, 5, 5, 8, 9, 12, 14, 15],
            borderColor: '#F59E0B',
            borderWidth: 2,
            tension: 0.2
          },
          {
            label: 'Lead (Pb) ppm',
            data: [1, 2, 2, 3, 3, 5, 5, 6],
            borderColor: '#2563EB',
            borderWidth: 2,
            tension: 0.2
          }
        ]
      },
      options: {
        ...commonOptions,
        plugins: { legend: { display: true, labels: { color: textColor, font: { family: 'Inter', size: 10 } } } }
      }
    });
  }

  // Chart 7: Real-Time Spectral Wave
  const ctxSpec = document.getElementById('spectral-trend-chart');
  if (ctxSpec) {
    charts.spectral = new Chart(ctxSpec, {
      type: 'line',
      data: {
        labels: Array.from({ length: 40 }, (_, i) => i),
        datasets: [{
          data: Array.from({ length: 40 }, (_, i) => Math.sin(i * 0.4) * 5 + Math.random()),
          borderColor: '#10B981',
          borderWidth: 1.5,
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          fill: true,
          tension: 0.4,
          pointRadius: 0
        }]
      },
      options: {
        ...commonOptions,
        scales: {
          x: { display: false },
          y: { grid: { color: gridColor }, ticks: { color: textColor } }
        }
      }
    });
  }
}

// Update charts with new machine statistics
function updateChartDatasets() {
  const m = state.machines[state.selectedMachineId];
  if (!m) return;
  
  if (charts.telemetry) {
    // Check active tab filter
    const activeTab = document.querySelector('.chart-tab.active');
    const param = activeTab ? activeTab.getAttribute('data-chart-param') : 'temp';
    
    let dataset = m.history.temp;
    let label = 'Temperature (°C)';
    let color = '#2563EB';
    
    if (param === 'press') {
      dataset = m.history.pressure;
      label = 'Pressure (bar)';
      color = '#10B981';
    } else if (param === 'flow') {
      dataset = m.history.flow;
      label = 'Flow Rate (L/min)';
      color = '#F5B301';
    }
    
    charts.telemetry.data.datasets[0].data = dataset;
    charts.telemetry.data.datasets[0].borderColor = color;
    charts.telemetry.data.datasets[0].label = label;
    charts.telemetry.update();
  }

  // Update RUL curve values
  if (charts.rul) {
    if (m.id === 'pump-4') {
      charts.rul.data.datasets[0].data = [90, 85, 78, 68, 55, 48, 44, 42];
      charts.rul.data.datasets[1].data = [90, 85, 78, 69, 58, 49, 41, 38, 25, 12, 0];
      charts.rul.data.datasets[0].borderColor = '#EF4444';
    } else if (m.id === 'turb-2') {
      charts.rul.data.datasets[0].data = [95, 92, 90, 88, 84, 80, 76, 74];
      charts.rul.data.datasets[1].data = [95, 92, 90, 88, 85, 81, 77, 73, 62, 51, 40, 28, 15, 0];
      charts.rul.data.datasets[0].borderColor = '#F59E0B';
    } else {
      charts.rul.data.datasets[0].data = [98, 98, 97, 98, 97, 98, 98, 98];
      charts.rul.data.datasets[1].data = [98, 98, 97, 98, 97, 98, 98, 98, 97, 98, 97, 97];
      charts.rul.data.datasets[0].borderColor = '#10B981';
    }
    charts.rul.update();
  }

  // Update Quality Chemicals
  if (charts.qualityTrend) {
    if (m.id === 'pump-4') {
      charts.qualityTrend.data.datasets[0].data = [12, 14, 18, 24, 30, 36, 40, 42]; // Iron
      charts.qualityTrend.data.datasets[1].data = [4, 5, 5, 8, 9, 12, 14, 15]; // Copper
      charts.qualityTrend.data.datasets[2].data = [1, 2, 2, 3, 3, 5, 5, 6]; // Lead
    } else if (m.id === 'turb-2') {
      charts.qualityTrend.data.datasets[0].data = [8, 9, 11, 12, 14, 15, 17, 18];
      charts.qualityTrend.data.datasets[1].data = [2, 2, 3, 3, 4, 4, 5, 5];
      charts.qualityTrend.data.datasets[2].data = [0, 0, 1, 1, 1, 2, 2, 2];
    } else {
      charts.qualityTrend.data.datasets[0].data = [4, 4, 5, 5, 6, 6, 6, 6];
      charts.qualityTrend.data.datasets[1].data = [1, 1, 1, 2, 2, 2, 2, 2];
      charts.qualityTrend.data.datasets[2].data = [0, 0, 0, 0, 0, 0, 0, 0];
    }
    charts.qualityTrend.update();
  }
}

// 6. CANVAS DIGITAL TWIN SYSTEM (PUMP LUBRICATION LOOP ANIMATION)
function initDigitalTwin() {
  const canvas = document.getElementById('digital-twin-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // Set resolution scale
  function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
  
  window.addEventListener('resize', resize);
  resize();

  // Particle emitter array
  const particles = [];
  
  // Populate starting particles
  for (let i = 0; i < 50; i++) {
    particles.push({
      progress: Math.random(),
      size: Math.random() * 2 + 1.5,
      speed: 0.002
    });
  }

  let gearAngle = 0;

  function drawLoop() {
    if (!state.twinAnimationActive) return;
    
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    // Draw Grid Backdrop
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    const gridSpacing = 20;
    for (let x = 0; x < w; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const m = state.machines[state.selectedMachineId];

    // Dynamic scale variables
    const r1 = 0.13 * h;
    const r2 = 0.09 * h;
    const cx1 = 0.34 * w;
    const cy1 = 0.48 * h;
    const cx2 = cx1 + r1 + r2 - 4;
    const cy2 = cy1;

    // Define relative loop points passing dynamically through components
    const loopPoints = [
      { x: 0.18 * w, y: 0.68 * h },   // 1. Reservoir bottom exit
      { x: 0.32 * w, y: 0.68 * h },   // 2. Entering pump from bottom
      { x: 0.32 * w, y: 0.48 * h },   // 3. Pump inlet (left)
      { x: 0.44 * w, y: 0.48 * h },   // 4. Pump outlet (right)
      { x: 0.54 * w, y: 0.48 * h },   // 5. Filter inlet (left)
      { x: 0.64 * w, y: 0.48 * h },   // 6. Filter outlet (right)
      { x: 0.74 * w, y: 0.48 * h },   // 7. Bearing cell inlet (left)
      { x: 0.74 * w, y: 0.38 * h },   // 8. Spray nozzle
      { x: 0.86 * w, y: 0.38 * h },   // 9. Right turn
      { x: 0.86 * w, y: 0.78 * h },   // 10. Return tray drainage corner
      { x: 0.18 * w, y: 0.78 * h }    // 11. Return line back to reservoir bottom
    ];

    // ==================================================
    // 1. DRAW OIL SUMP & RESERVOIR (LEFT)
    // ==================================================
    ctx.fillStyle = 'rgba(15, 32, 59, 0.4)';
    ctx.strokeStyle = '#2B3C54';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(0.08 * w, 0.35 * h, 0.14 * w, 0.5 * h, 8);
    ctx.fill();
    ctx.stroke();

    // Oil fluid inside reservoir
    const fillPercent = m.sensors.level / 100;
    const tankHeight = 0.5 * h;
    const oilHeight = tankHeight * fillPercent;
    const oilTop = 0.35 * h + tankHeight - oilHeight;
    
    let oilColor = 'rgba(245, 179, 1, 0.25)'; // Amber/Gold
    if (m.status === 'critical') oilColor = 'rgba(239, 68, 68, 0.35)'; // Red
    else if (m.status === 'warning') oilColor = 'rgba(245, 158, 11, 0.3)'; // Orange
    
    ctx.fillStyle = oilColor;
    ctx.beginPath();
    ctx.roundRect(0.08 * w, oilTop, 0.14 * w, oilHeight, 8);
    ctx.fill();

    // Level markers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '9px var(--font-mono)';
    ctx.textAlign = 'left';
    ctx.fillText('MAX', 0.09 * w, 0.4 * h);
    ctx.fillText('MIN', 0.09 * w, 0.8 * h);
    
    // Tank Breather Cap
    ctx.fillStyle = '#1F2E43';
    ctx.beginPath();
    ctx.rect(0.13 * w, 0.31 * h, 0.04 * w, 0.04 * h);
    ctx.fill();
    ctx.stroke();

    // ==================================================
    // 2. DRAW MAIN CIRCULATION PUMP (CENTER-LEFT)
    // ==================================================
    ctx.fillStyle = 'rgba(15, 32, 59, 0.3)';
    ctx.strokeStyle = '#2B3C54';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(0.27 * w, 0.3 * h, 0.2 * w, 0.4 * h, 12);
    ctx.fill();
    ctx.stroke();
    
    // Draw rotating Gears inside Pump
    const rotationSpeed = (m.sensors.flow / 25) * 0.08;
    gearAngle += rotationSpeed;
    drawGear(ctx, cx1, cy1, r1, 12, gearAngle, '#2563EB');
    drawGear(ctx, cx2, cy2, r2, 9, -gearAngle * 1.33 + 0.2, '#10B981');

    // ==================================================
    // 3. DRAW INLINE OIL FILTER (CENTER-RIGHT)
    // ==================================================
    ctx.fillStyle = 'rgba(15, 32, 59, 0.3)';
    ctx.strokeStyle = '#2B3C54';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(0.53 * w, 0.3 * h, 0.12 * w, 0.4 * h, 10);
    ctx.fill();
    ctx.stroke();

    // Filter cartridge element
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(0.55 * w, 0.34 * h, 0.08 * w, 0.32 * h, 4);
    ctx.fill();
    ctx.stroke();

    // Cartridge folds
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let fy = 0; fy < 0.32 * h; fy += 8) {
      ctx.beginPath();
      ctx.moveTo(0.55 * w, 0.34 * h + fy);
      ctx.lineTo(0.63 * w, 0.34 * h + fy);
      ctx.stroke();
    }

    // ==================================================
    // 4. DRAW LUBRICATED BEARING CELL (RIGHT)
    // ==================================================
    ctx.fillStyle = 'rgba(15, 32, 59, 0.3)';
    ctx.strokeStyle = '#2B3C54';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(0.71 * w, 0.3 * h, 0.18 * w, 0.5 * h, 12);
    ctx.fill();
    ctx.stroke();

    // Rotating Bearing assembly
    ctx.save();
    ctx.translate(0.8 * w, 0.52 * h);
    ctx.rotate(gearAngle * 0.7);
    
    // Outer race ring
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 0.11 * h, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner shaft ring
    ctx.fillStyle = '#1F2E43';
    ctx.beginPath();
    ctx.arc(0, 0, 0.05 * h, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Rolling balls
    ctx.fillStyle = '#E5E7EB';
    const numBalls = 6;
    for (let bi = 0; bi < numBalls; bi++) {
      const theta = (bi / numBalls) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(theta) * 0.08 * h, Math.sin(theta) * 0.08 * h, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Drainage Drip Tray
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.strokeStyle = '#2B3C54';
    ctx.beginPath();
    ctx.rect(0.73 * w, 0.72 * h, 0.14 * w, 0.04 * h);
    ctx.fill();
    ctx.stroke();

    // ==================================================
    // 5. DRAW HOLLOW STEEL PIPELINES (LOOP)
    // ==================================================
    // Outer steel pipe border
    ctx.strokeStyle = '#1E2E42';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(loopPoints[0].x, loopPoints[0].y);
    for (let i = 1; i < loopPoints.length; i++) {
      ctx.lineTo(loopPoints[i].x, loopPoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner passage (hollow core)
    ctx.strokeStyle = '#050B16';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Fluid flow color based on machine status
    ctx.strokeStyle = oilColor;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Hot spot visualization on pump casing if temp > 70
    if (m.sensors.temp > 70) {
      const gradient = ctx.createRadialGradient(cx1, cy1, 10, cx1, cy1, 0.12 * w);
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx1, cy1, 0.12 * w, 0, Math.PI * 2);
      ctx.fill();
    }

    // ==================================================
    // 6. ANIMATE FLUID PARTICLES
    // ==================================================
    particles.forEach(p => {
      p.speed = (m.sensors.flow / 25) * 0.008 + 0.001;
      p.progress += p.speed;
      if (p.progress > 1) p.progress = 0;
      
      const pos = getPointAlongLoop(loopPoints, p.progress);
      
      ctx.fillStyle = m.status === 'critical' ? 'var(--status-red)' : 'var(--color-gold)';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // ==================================================
    // 7. COMPONENT LEGEND TEXT LABELS
    // ==================================================
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = 'bold 9px var(--font-sans)';
    ctx.textAlign = 'center';
    
    ctx.fillText('OIL SUMP & RESERVOIR', 0.15 * w, 0.31 * h);
    ctx.fillText('MAIN FEED PUMP', 0.37 * w, 0.27 * h);
    ctx.fillText('INLINE OIL FILTER', 0.59 * w, 0.27 * h);
    ctx.fillText('LUBRICATED BEARING CELL', 0.8 * w, 0.27 * h);

    requestAnimationFrame(drawLoop);
  }

  requestAnimationFrame(drawLoop);
}

function drawGear(ctx, cx, cy, r, teeth, angle, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fill();

  // Draw teeth
  for (let i = 0; i < teeth; i++) {
    ctx.rotate((Math.PI * 2) / teeth);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(-6, -r - 6, 12, 10);
    ctx.fill();
  }

  // Draw central shaft hole
  ctx.fillStyle = '#050B16';
  ctx.beginPath();
  ctx.arc(0, 0, r / 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  ctx.restore();
}

function getPointAlongLoop(points, progress) {
  // Total length of closed loop
  let totalLength = 0;
  const segments = [];
  
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];
    const dx = next.x - points[i].x;
    const dy = next.y - points[i].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segments.push({ from: points[i], to: next, len });
    totalLength += len;
  }
  
  let targetLen = progress * totalLength;
  let currentLen = 0;
  
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (currentLen + s.len >= targetLen) {
      const segmentProgress = (targetLen - currentLen) / s.len;
      return {
        x: s.from.x + (s.to.x - s.from.x) * segmentProgress,
        y: s.from.y + (s.to.y - s.from.y) * segmentProgress
      };
    }
    currentLen += s.len;
  }
  
  return points[0];
}

// 7. EVENT ACTION HANDLERS
function setupDOMListeners() {
  
  // Navigation switcher
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view');
      switchView(view);
      
      // Update sidebar visual active state
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Telemetry chart options
  const chartTabs = document.querySelectorAll('.chart-tab');
  chartTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      chartTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      updateChartDatasets();
    });
  });

  // Dark/Light Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const target = current === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', target);
      document.documentElement.style.colorScheme = target;
      localStorage.setItem('theme', target);
      state.theme = target;
      
      // Re-initialize chart options/colors to match new theme
      if (charts.telemetry) {
        charts.telemetry.destroy();
        charts.consumption.destroy();
        charts.downtime.destroy();
        charts.rul.destroy();
        charts.savings.destroy();
        charts.qualityTrend.destroy();
        charts.spectral.destroy();
        initCharts();
      }
    });
  }

  // Factory map nodes click listener
  const nodes = document.querySelectorAll('.machine-node');
  nodes.forEach(node => {
    node.addEventListener('click', () => {
      const mid = node.getAttribute('data-machine-id');
      state.selectedMachineId = mid;
      
      // Highlight active node in SVG
      nodes.forEach(n => n.classList.remove('active'));
      node.classList.add('active');
      
      // Update gauges and details page
      updateGauges();
      updateChartDatasets();
      
      // Open inspector overlay
      showInspector(mid);
    });
  });

  // Mini map node click teleports to monitoring or digital twin view
  const inspectMonitorRedirect = document.getElementById('inspect-monitoring-redirect');
  if (inspectMonitorRedirect) {
    inspectMonitorRedirect.addEventListener('click', () => {
      switchView('monitoring');
      highlightSidebarItem('monitoring');
    });
  }

  const inspectTwinRedirect = document.getElementById('inspect-twin-redirect');
  if (inspectTwinRedirect) {
    inspectTwinRedirect.addEventListener('click', () => {
      // Focus on the digital twin section at the bottom
      const twinSection = document.querySelector('.digital-twin-container');
      if (twinSection) {
        twinSection.scrollIntoView({ behavior: 'smooth' });
        twinSection.style.border = '2px solid var(--color-royal)';
        setTimeout(() => {
          twinSection.style.border = '1px solid var(--border-color)';
        }, 1500);
      }
    });
  }

  const closeInspectorBtn = document.getElementById('close-inspector-btn');
  if (closeInspectorBtn) {
    closeInspectorBtn.addEventListener('click', () => {
      document.getElementById('node-inspector').classList.remove('show');
    });
  }

  // Double click map mounts for detailed view pane
  const miniMapMount = document.getElementById('mini-factory-map');
  const fullMapMount = document.getElementById('full-map-mount');
  if (miniMapMount && fullMapMount) {
    // Clone map to full view
    const svgMap = document.getElementById('factory-svg');
    const clone = svgMap.cloneNode(true);
    clone.id = 'factory-svg-full';
    fullMapMount.appendChild(clone);
    
    // Add click listeners to full map nodes
    const fullNodes = clone.querySelectorAll('.machine-node');
    fullNodes.forEach(node => {
      node.addEventListener('click', () => {
        const mid = node.getAttribute('data-machine-id');
        state.selectedMachineId = mid;
        fullNodes.forEach(n => n.classList.remove('active'));
        node.classList.add('active');
        showInspector(mid);
      });
    });
  }

  // Report Generator button animation
  const generateReportBtn = document.getElementById('generate-report-btn');
  const reportProgressContainer = document.getElementById('report-progress-container');
  const reportProgressFill = document.getElementById('report-progress-fill');
  const reportStatusMessage = document.getElementById('report-status-message');

  if (generateReportBtn && reportProgressContainer && reportProgressFill && reportStatusMessage) {
    generateReportBtn.addEventListener('click', () => {
      generateReportBtn.disabled = true;
      reportProgressContainer.classList.remove('hide');
      reportStatusMessage.textContent = 'Contacting database ledger...';
      reportProgressFill.style.width = '0%';
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        reportProgressFill.style.width = `${progress}%`;
        
        if (progress === 40) {
          reportStatusMessage.textContent = 'Ingesting ESP32 time-series data...';
        } else if (progress === 70) {
          reportStatusMessage.textContent = 'Formulating TensorFlow diagnostics...';
        } else if (progress >= 100) {
          clearInterval(interval);
          generateReportBtn.disabled = false;
          reportStatusMessage.textContent = 'LUB-AUDIT-2026-AUG.pdf successfully created!';
          
          setTimeout(() => {
            reportProgressContainer.classList.add('hide');
            reportStatusMessage.textContent = '';
          }, 3000);
        }
      }, 300);
    });
  }

  // Settings page threshold sliders
  const tempSlider = document.getElementById('thresh-temp');
  const tempLabel = document.getElementById('val-thresh-temp');
  if (tempSlider && tempLabel) {
    tempSlider.addEventListener('input', () => {
      tempLabel.textContent = `${tempSlider.value}°C`;
      state.thresholds.temp = parseInt(tempSlider.value);
    });
  }

  const moistureSlider = document.getElementById('thresh-moisture');
  const moistureLabel = document.getElementById('val-thresh-moisture');
  if (moistureSlider && moistureLabel) {
    moistureSlider.addEventListener('input', () => {
      moistureLabel.textContent = `${moistureSlider.value} ppm`;
      state.thresholds.moisture = parseInt(moistureSlider.value);
    });
  }

  const saveThresholdBtn = document.getElementById('save-thresholds-btn');
  if (saveThresholdBtn) {
    saveThresholdBtn.addEventListener('click', () => {
      pushAlert('info', 'System Gateways', 'Safety thresholds successfully deployed to ESP32 node cluster.');
    });
  }

  // Notification bell popover trigger
  const notiBell = document.getElementById('noti-bell-trigger');
  const notiDropdown = document.getElementById('noti-dropdown-panel');
  if (notiBell && notiDropdown) {
    notiBell.addEventListener('click', (e) => {
      e.stopPropagation();
      notiDropdown.classList.toggle('show');
    });
    
    document.addEventListener('click', () => {
      notiDropdown.classList.remove('show');
    });
  }

  const clearNotiBtn = document.getElementById('clear-noti-btn');
  if (clearNotiBtn) {
    clearNotiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.alertCount = 0;
      state.alerts = [];
      updateAlertBadges();
      renderNotificationsDropdown();
      renderAlertsTimeline();
    });
  }

  // Traceability database search
  const traceSearchBtn = document.getElementById('trace-search-btn');
  const traceBatchInput = document.getElementById('trace-batch');
  const traceLedgerBody = document.getElementById('trace-ledger-body');
  
  if (traceSearchBtn && traceLedgerBody) {
    traceSearchBtn.addEventListener('click', () => {
      const q = traceBatchInput.value.toLowerCase().trim();
      if (!q) {
        // Reset list
        renderTraceLedger();
        return;
      }
      
      const filtered = [
        { batch: 'LUB-2026-A8', date: 'Aug 03, 2026', unit: 'Main Feed Pump #4', op: 'M. Scholz', brand: 'Shell Omala S4 WE 320', lab: 'LAB-5829-4', verify: true }
      ].filter(r => r.batch.toLowerCase().includes(q) || r.unit.toLowerCase().includes(q) || r.op.toLowerCase().includes(q));
      
      traceLedgerBody.innerHTML = '';
      if (filtered.length === 0) {
        traceLedgerBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No audit trails found in the ledger database matching query.</td></tr>`;
      } else {
        filtered.forEach(r => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${r.batch}</strong></td>
            <td>${r.date}</td>
            <td>${r.unit}</td>
            <td>${r.op}</td>
            <td>${r.brand}</td>
            <td>${r.lab}</td>
            <td><span class="badge badge-success"><i data-lucide="check-circle" style="width:12px; height:12px; display:inline-block; margin-right:4px;"></i> Verified</span></td>
          `;
          traceLedgerBody.appendChild(tr);
        });
        lucide.createIcons();
      }
    });
  }

  // Toggle simulation twin flow button
  const toggleTwinBtn = document.getElementById('toggle-twin-anim-btn');
  if (toggleTwinBtn) {
    toggleTwinBtn.addEventListener('click', () => {
      state.twinAnimationActive = !state.twinAnimationActive;
      if (state.twinAnimationActive) {
        toggleTwinBtn.innerHTML = '<i data-lucide="pause" style="width: 12px; height: 12px;"></i> Pause Simulation';
        initDigitalTwin(); // Restart loop
      } else {
        toggleTwinBtn.innerHTML = '<i data-lucide="play" style="width: 12px; height: 12px;"></i> Resume Simulation';
      }
      lucide.createIcons();
    });
  }
}

function renderTraceLedger() {
  const traceLedgerBody = document.getElementById('trace-ledger-body');
  if (!traceLedgerBody) return;
  traceLedgerBody.innerHTML = `
    <tr>
      <td><strong>LUB-2026-A8</strong></td>
      <td>Aug 03, 2026</td>
      <td>Main Feed Pump #4</td>
      <td>M. Scholz</td>
      <td>Shell Omala S4 WE 320</td>
      <td>LAB-5829-4</td>
      <td><span class="badge badge-success"><i data-lucide="check-circle" style="width:12px; height:12px; display:inline-block; margin-right:4px;"></i> Verified</span></td>
    </tr>
    <tr>
      <td><strong>LUB-2026-A7</strong></td>
      <td>Jul 28, 2026</td>
      <td>Steam Turbine #12</td>
      <td>A. Vance</td>
      <td>Mobil SHC 626</td>
      <td>LAB-5712-1</td>
      <td><span class="badge badge-success"><i data-lucide="check-circle" style="width:12px; height:12px; display:inline-block; margin-right:4px;"></i> Verified</span></td>
    </tr>
  `;
  lucide.createIcons();
}

function showInspector(mid) {
  const m = state.machines[mid];
  if (!m) return;

  const inspector = document.getElementById('node-inspector');
  const inspectIcon = document.getElementById('inspect-machine-icon-state');
  const inspectName = document.getElementById('inspect-name');
  const inspectUid = document.getElementById('inspect-uid');
  const inspectStatus = document.getElementById('inspect-status-text');
  const inspectLoc = document.getElementById('inspect-location');
  const inspectCrit = document.getElementById('inspect-criticality');
  const inspectOil = document.getElementById('inspect-oil-type');
  const inspectLast = document.getElementById('inspect-last-oil-change');
  
  const inspectTemp = document.getElementById('inspect-temp');
  const inspectVisc = document.getElementById('inspect-viscosity');
  const inspectIso = document.getElementById('inspect-iso');
  const inspectHealth = document.getElementById('inspect-health');
  
  if (inspector) inspector.classList.add('show');
  if (inspectName) inspectName.textContent = m.name;
  if (inspectUid) inspectUid.textContent = `UUID: ${m.uid}`;
  
  if (inspectStatus) {
    inspectStatus.textContent = m.status.toUpperCase();
    inspectStatus.className = `status-tag ${m.status}`;
  }
  
  if (inspectIcon) {
    inspectIcon.className = `machine-icon-wrapper ${m.status === 'critical' ? 'red' : m.status === 'warning' ? 'yellow' : 'green'}`;
  }

  if (inspectLoc) inspectLoc.textContent = m.zone;
  if (inspectCrit) {
    inspectCrit.textContent = m.criticality;
    inspectCrit.className = m.status === 'critical' ? 'val highlight-danger' : 'val';
  }
  
  if (inspectOil) inspectOil.textContent = m.oilType;
  if (inspectLast) inspectLast.textContent = m.lastOilChange;

  // Telemetry details
  if (inspectTemp) inspectTemp.textContent = `${m.sensors.temp.toFixed(1)}°C`;
  if (inspectVisc) inspectVisc.textContent = `${m.sensors.viscosity.toFixed(0)} cSt`;
  if (inspectIso) inspectIso.textContent = m.id === 'pump-4' ? '21/19/16' : m.id === 'turb-2' ? '19/17/14' : '17/14/11';
  
  if (inspectHealth) {
    inspectHealth.textContent = `${m.health}%`;
    inspectHealth.className = `mini-tel-val ${m.health < 50 ? 'highlight-danger' : m.health < 80 ? 'text-warning' : 'text-success'}`;
  }
}

function switchView(viewId) {
  const panes = document.querySelectorAll('.view-pane');
  panes.forEach(pane => {
    pane.classList.remove('active');
  });
  
  const targetPane = document.getElementById(`view-${viewId}`);
  if (targetPane) {
    targetPane.classList.add('active');
    state.currentView = viewId;
  }
  
  // Refresh spectral inline charts if switching to oil monitoring
  if (viewId === 'monitoring' && charts.spectral) {
    charts.spectral.update();
  }
}

function highlightSidebarItem(viewId) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(n => {
    n.classList.remove('active');
    if (n.getAttribute('data-view') === viewId) {
      n.classList.add('active');
    }
  });
}

// 8. APP BOOTSTRAP
function init() {
  initSensorSimulators();
  startClock();
  setupDOMListeners();
  
  // Wait for DOM to mount libraries completely
  setTimeout(() => {
    lucide.createIcons({ attrs: { 'stroke-width': 2 } });
    initCharts();
    initDigitalTwin();
    renderAlertsTimeline();
    renderNotificationsDropdown();
    
    // Start active real-time loop updates (every 1 second)
    setInterval(() => {
      runSensorSimulations();
      updateKPICards();
      updateGauges();
      
      // Shift real-time wave graph on monitoring page
      if (charts.spectral) {
        charts.spectral.data.datasets[0].data.shift();
        charts.spectral.data.datasets[0].data.push(Math.sin(Date.now() * 0.002) * 5 + Math.random() * 2);
        charts.spectral.update('none');
      }
    }, 1000);
    
  }, 100);
}

// Kick off
init();
