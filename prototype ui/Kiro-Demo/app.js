// ── Navigation ──────────────────────────────────────────────
const screens = ['dashboard','map','tasks','alerts','checkin'];

function navigate(id) {
  screens.forEach(s => {
    document.getElementById('screen-' + s).classList.remove('active');
  });
  document.getElementById('screen-' + id).classList.add('active');
  document.getElementById('phone').scrollTop = 0;
  // update nav highlights
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.screen === id);
  });
}

// ── Header HTML ──────────────────────────────────────────────
function header(alertTarget) {
  return `
  <div class="app-header">
    <div class="logo-box"><i class="fas fa-city" style="color:#fff;font-size:20px"></i></div>
    <div class="brand">
      <div class="name">Civic</div>
      <div class="sub">Coordination Platform</div>
    </div>
    <div class="header-right">
      <div class="bell-btn" onclick="navigate('alerts')">
        <i class="fas fa-bell"></i>
        <span class="bell-dot"></span>
      </div>
      <div class="avatar" onclick="navigate('checkin')">
        <i class="fas fa-user"></i>
      </div>
    </div>
  </div>`;
}

// ── Bottom Nav HTML ──────────────────────────────────────────
function bottomNav(active) {
  const items = [
    { id:'dashboard', icon:'fa-home',          label:'Home'     },
    { id:'map',       icon:'fa-map-marker-alt', label:'Map'      },
    { id:'tasks',     icon:'fa-list',           label:'Tasks'    },
    { id:'alerts',    icon:'fa-bell',           label:'Alerts'   },
    { id:'checkin',   icon:'fa-qrcode',         label:'Check-In' },
  ];
  return `<div class="bottom-nav">` +
    items.map(i => `
      <div class="nav-item ${i.id===active?'active':''}" data-screen="${i.id}" onclick="navigate('${i.id}')">
        <i class="fas ${i.icon}"></i>
        <span>${i.label}</span>
      </div>`).join('') +
  `</div>`;
}

// ── Screen 1: Active Event Dashboard ────────────────────────
function renderDashboard() {
  document.getElementById('screen-dashboard').innerHTML = `
  ${header('alerts')}
  <div class="screen-content">

    <!-- Live event header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="font-size:12px;font-weight:700;color:#8285f4">● Live Now</div>
        <h2 style="font-size:22px;font-weight:700;color:#fff;margin-top:4px">March for Climate Justice</h2>
        <div style="font-size:12px;color:#a1a3f7;margin-top:4px">
          <i class="fas fa-location-arrow" style="font-size:10px"></i> City Hall Plaza — Staging Area B
        </div>
      </div>
      <div class="stat-box" style="min-width:60px">
        <i class="fas fa-users" style="color:#818cf8;font-size:18px"></i>
        <div style="font-size:18px;font-weight:700;color:#fff">847</div>
        <div style="font-size:9px;color:#a1a3f7">LIVE</div>
      </div>
    </div>

    <!-- Role badges -->
    <div class="card" style="display:flex;justify-content:space-around;align-items:center;padding:12px 8px">
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <span class="badge badge-blue"><i class="fas fa-shield-alt"></i> 24</span>
        <span style="font-size:10px;color:#a3a3a3">Marshals</span>
      </div>
      <div style="width:1px;height:36px;background:#404040"></div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <span class="badge badge-green"><i class="fas fa-briefcase-medical"></i> 8</span>
        <span style="font-size:10px;color:#a3a3a3">Medics</span>
      </div>
      <div style="width:1px;height:36px;background:#404040"></div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <span class="badge badge-orange"><i class="fas fa-eye"></i> 12</span>
        <span style="font-size:10px;color:#a3a3a3">Legal Obs.</span>
      </div>
    </div>

    <!-- Action buttons -->
    <button class="btn btn-indigo" style="height:56px;width:100%;font-size:16px" onclick="navigate('alerts')">
      <i class="fas fa-bullhorn" style="margin-right:8px"></i> Broadcast Alert
    </button>
    <div style="display:flex;gap:10px">
      <button class="btn btn-blue" style="flex:1;height:52px" onclick="navigate('map')">
        <i class="fas fa-map-marker-alt" style="margin-right:6px"></i> View Map
      </button>
      <button class="btn btn-purple" style="flex:1;height:52px" onclick="navigate('tasks')">
        <i class="fas fa-list" style="margin-right:6px"></i> Tasks
      </button>
    </div>

    <!-- Event Timeline -->
    <div class="card">
      <div style="font-size:10px;font-weight:700;color:#a3a3a3;margin-bottom:12px">Event Timeline</div>
      <div class="timeline">
        <div class="tl-step">
          <div class="tl-dot" style="background:#6366f1"><i class="fas fa-flag" style="color:#fff;font-size:10px"></i></div>
          <span style="font-size:10px;font-weight:700;color:#6366f1">Staging</span>
        </div>
        <div class="tl-line" style="background:#6366f1"></div>
        <div class="tl-step">
          <div class="tl-dot" style="background:#6366f1;border:2px solid #a5b4fc">
            <i class="fas fa-walking" style="color:#fff;font-size:10px"></i>
          </div>
          <span style="font-size:10px;font-weight:700;color:#a5b4fc">March</span>
        </div>
        <div class="tl-line" style="background:#404040"></div>
        <div class="tl-step">
          <div class="tl-dot" style="background:#404040"><i class="fas fa-bullhorn" style="color:#737373;font-size:10px"></i></div>
          <span style="font-size:10px;color:#737373">Rally</span>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div style="font-size:10px;font-weight:700;color:#a3a3a3">Recent Activity</div>
    ${[
      { bg:'#1e3a5f', icon:'fa-arrow-alt-circle-right', ic:'#38bdf8', title:'Marshal R. Dominguez checked in', sub:'Section C — 2 min ago' },
      { bg:'#1a3d2e', icon:'fa-check-circle',           ic:'#34d399', title:'First aid station confirmed ready', sub:'Medic T. Nakamura — 5 min ago' },
      { bg:'#3b2a1a', icon:'fa-clipboard-check',        ic:'#fb923c', title:'Route sweep completed — all clear', sub:'Legal Obs. K. Patel — 8 min ago' },
      { bg:'#2d1a4e', icon:'fa-bullhorn',               ic:'#c084fc', title:'March phase initiated by organizer', sub:'Coord. M. Alvarez — 12 min ago' },
    ].map(a => `
    <div class="feed-item">
      <div class="feed-icon" style="background:${a.bg}">
        <i class="fas ${a.icon}" style="color:${a.ic};font-size:12px"></i>
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;color:#fff">${a.title}</div>
        <div style="font-size:10px;color:#737373;margin-top:2px">${a.sub}</div>
      </div>
    </div>`).join('')}

  </div>
  ${bottomNav('dashboard')}`;
}

// ── Screen 2: Live Event Map ─────────────────────────────────
function renderMap() {
  document.getElementById('screen-map').innerHTML = `
  ${header()}
  <div class="screen-content">

    <!-- Live bar + emergency -->
    <div style="display:flex;gap:8px;align-items:center">
      <div style="flex:1;background:#1a2744;border:1px solid #2a3a5c;border-radius:12px;padding:8px 12px;display:flex;align-items:center;gap:8px">
        <span style="width:8px;height:8px;background:#22c55e;border-radius:50%;display:inline-block"></span>
        <span style="font-size:12px;font-weight:700;color:#fff">LIVE</span>
        <span style="color:#c1c2f9">·</span>
        <span style="font-size:14px;font-weight:700;color:#fff">1,247</span>
        <span style="font-size:12px;color:#a3a3a3">participants</span>
      </div>
      <button class="btn btn-yellow" style="padding:8px 14px;border-radius:12px;font-size:13px" onclick="navigate('alerts')">
        EMERGENCY
      </button>
    </div>

    <!-- Map area -->
    <div class="map-area" style="position:relative">
      <!-- Grid lines to simulate a map -->
      <svg width="100%" height="100%" style="position:absolute;top:0;left:0;opacity:.15">
        <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6366f1" stroke-width="0.5"/>
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
        <!-- Route line -->
        <polyline points="40,280 100,220 180,180 260,160 330,120" stroke="#6366f1" stroke-width="3" fill="none" stroke-dasharray="8,4" opacity="1"/>
      </svg>

      <!-- Current focus overlay -->
      <div style="position:absolute;top:12px;left:12px;background:rgba(10,22,40,.9);border:1px solid #2a3a5c;border-radius:12px;padding:8px 12px">
        <div style="font-size:10px;color:#a3a3a3">CURRENT FOCUS</div>
        <div style="font-size:12px;font-weight:700;color:#fff;margin-top:2px">
          <i class="fas fa-route" style="color:#6366f1;margin-right:4px"></i>Market St → City Hall
        </div>
      </div>

      <!-- Legend overlay -->
      <div style="position:absolute;top:12px;right:12px;background:rgba(10,22,40,.9);border:1px solid #2a3a5c;border-radius:12px;padding:8px 12px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <span style="width:10px;height:10px;background:#3b82f6;border-radius:50%;display:inline-block"></span>
          <span style="font-size:10px;color:#d4d4d4">Marshals (18)</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <span style="width:10px;height:10px;background:#22c55e;border-radius:50%;display:inline-block"></span>
          <span style="font-size:10px;color:#d4d4d4">Medics (7)</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="width:10px;height:10px;background:#f97316;border-radius:50%;display:inline-block"></span>
          <span style="font-size:10px;color:#d4d4d4">Legal (5)</span>
        </div>
      </div>

      <!-- Map markers -->
      <div class="map-marker" style="position:absolute;left:40px;top:180px">
        <div class="dot" style="background:#3b82f6;border-color:#60a5fa"><i class="fas fa-shield-alt" style="color:#fff;font-size:12px"></i></div>
        <span class="label">M-04</span>
      </div>
      <div class="map-marker" style="position:absolute;left:160px;top:240px">
        <div class="dot" style="background:#22c55e;border-color:#4ade80"><i class="fas fa-briefcase-medical" style="color:#fff;font-size:12px"></i></div>
        <span class="label">MED-2</span>
      </div>
      <div class="map-marker" style="position:absolute;left:270px;top:210px">
        <div class="dot" style="background:#f97316;border-color:#fb923c"><i class="fas fa-balance-scale" style="color:#fff;font-size:12px"></i></div>
        <span class="label">LO-3</span>
      </div>
      <div class="map-marker" style="position:absolute;left:30px;top:290px">
        <div class="dot" style="background:#6366f1;border-color:#a1a3f7"><i class="fas fa-flag" style="color:#fff;font-size:12px"></i></div>
        <span class="label">Staging</span>
      </div>
      <div class="map-marker" style="position:absolute;left:155px;top:270px">
        <div class="dot" style="background:#10b981;border-color:#6ee7b7"><i class="fas fa-clinic-medical" style="color:#fff;font-size:12px"></i></div>
        <span class="label">First Aid</span>
      </div>
      <div class="map-marker" style="position:absolute;left:285px;top:250px">
        <div class="dot" style="background:#f59e0b;border-color:#fbbf24"><i class="fas fa-gavel" style="color:#fff;font-size:12px"></i></div>
        <span class="label">Legal</span>
      </div>

      <!-- Report FAB -->
      <div onclick="navigate('alerts')" style="position:absolute;right:12px;bottom:12px;width:52px;height:52px;background:#6366f1;border:2px solid #a1a3f7;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer">
        <i class="fas fa-plus" style="color:#fff;font-size:18px"></i>
      </div>
    </div>

    <!-- Stats row -->
    <div style="display:flex;gap:10px">
      <div style="flex:1;background:#1a2744;border:1px solid #2a3a5c;border-radius:12px;padding:12px">
        <div style="font-size:10px;color:#a3a3a3">ACTIVE ZONES</div>
        <div style="font-size:14px;font-weight:700;color:#fff;margin-top:4px">3 <span style="font-size:10px;color:#a3a3a3">of 5 zones</span></div>
        <div style="display:flex;gap:4px;margin-top:8px">
          ${[1,1,1,0,0].map(a=>`<div style="width:18px;height:8px;background:${a?'#22c55e':'#404040'};border-radius:4px"></div>`).join('')}
        </div>
      </div>
      <div style="flex:1;background:#1a2744;border:1px solid #2a3a5c;border-radius:12px;padding:12px">
        <div style="font-size:10px;color:#a3a3a3">DENSITY</div>
        <div style="font-size:14px;font-weight:700;color:#fff;margin-top:4px">High <span style="font-size:10px;color:#f59e0b">· Sector B</span></div>
        <div style="display:flex;gap:4px;margin-top:8px">
          ${[1,1,1,1,0].map(a=>`<div style="width:18px;height:8px;background:${a?'#f59e0b':'#404040'};border-radius:4px"></div>`).join('')}
        </div>
      </div>
      <div onclick="navigate('tasks')" style="width:60px;background:#1a2744;border:1px solid #2a3a5c;border-radius:12px;padding:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer">
        <i class="fas fa-list" style="color:#6366f1;font-size:18px"></i>
        <span style="font-size:10px;font-weight:700;color:#c1c2f9">Tasks</span>
      </div>
    </div>

  </div>
  ${bottomNav('map')}`;
}

// ── Screen 3: Role-Based Task List ───────────────────────────
function renderTasks() {
  const tasks = [
    { title:'Verify barricade placement', desc:'Confirm all barricades at 5th & Main are positioned per the route plan.', due:'Due 10:00 AM', priority:'High', priorityColor:'#737373', status:'Completed', statusColor:'#34d399', done:true, active:false },
    { title:'Radio check with HQ', desc:'Confirm two-way comms with coordination hub before march begins.', due:'Due 10:15 AM', priority:'Medium', priorityColor:'#737373', status:'Completed', statusColor:'#34d399', done:true, active:false },
    { title:'Brief volunteer team', desc:'Walk through de-escalation protocols with Section A volunteers.', due:'Due 10:30 AM', priority:'High', priorityColor:'#737373', status:'Completed', statusColor:'#34d399', done:true, active:false },
    { title:'Monitor intersection at 5th & Main', desc:'Ensure pedestrian flow remains orderly. Report any vehicle encroachment immediately.', due:'Due 11:00 AM', priority:'Urgent', priorityColor:'#f43f5e', status:'In Progress', statusColor:'#38bdf8', done:false, active:true, note:'Coordinator note: Police presence reported nearby. Stay alert and document.' },
    { title:'Check crowd density every 15 min', desc:'Use the headcount tool in-app to estimate density at Section A. Flag if over 4 people/m².', due:'Next at 11:15 AM', priority:'Recurring', priorityColor:'#737373', status:'Pending', statusColor:'#fbbf24', done:false, active:false },
  ];

  document.getElementById('screen-tasks').innerHTML = `
  ${header()}
  <div class="screen-content">

    <!-- Role header -->
    <div class="card card-indigo">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:44px;height:44px;background:#6366f1;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <i class="fas fa-shield-alt" style="color:#fff;font-size:18px"></i>
        </div>
        <div>
          <div style="font-size:18px;font-weight:700;color:#fff">Marshal — Section A</div>
          <div style="font-size:12px;color:#a1a3f7">Downtown March for Climate Justice</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <span class="badge badge-indigo"><i class="fas fa-users"></i> 342 Live</span>
        <span class="badge badge-indigo"><i class="fas fa-clock"></i> Phase: March</span>
      </div>
    </div>

    <!-- Progress -->
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:12px;font-weight:700;color:#a3a3a3">YOUR TASKS</span>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:12px;color:#a1a3f7">3 of 5 done</span>
        <div class="progress-track" style="width:60px">
          <div class="progress-fill" style="width:60%"></div>
        </div>
      </div>
    </div>

    <!-- Task items -->
    ${tasks.map(t => `
    <div class="task-item ${t.active?'active-task':''}">
      <div style="display:flex;align-items:flex-start;gap:10px">
        <div style="width:24px;height:24px;border-radius:6px;background:${t.done?'#6366f1':'#262626'};border:1px solid ${t.done?'transparent':'#525252'};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">
          ${t.done?'<i class="fas fa-check" style="color:#fff;font-size:11px"></i>':''}
        </div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="font-size:14px;font-weight:700;color:#fff;flex:1;margin-right:8px">${t.title}</div>
            <span style="font-size:10px;font-weight:700;color:${t.statusColor};white-space:nowrap">${t.status}</span>
          </div>
          <div style="font-size:12px;color:${t.done?'#a3a3a3':'#d4d4d4'};margin-top:6px">${t.desc}</div>
          <div style="display:flex;gap:12px;margin-top:8px;align-items:center">
            <span style="font-size:10px;color:${t.active?'#f59e0b':'#737373'}">
              <i class="fas fa-clock" style="margin-right:3px"></i>${t.due}
            </span>
            <span style="font-size:10px;color:${t.priorityColor}">
              <i class="fas fa-flag" style="margin-right:3px"></i>${t.priority}
            </span>
          </div>
          ${t.note?`<div style="background:#1a2744;border-radius:12px;padding:8px 12px;margin-top:10px;font-size:10px;color:#c1c2f9">
            <i class="fas fa-comment-dots" style="color:#a1a3f7;margin-right:4px"></i>${t.note}
          </div>`:''}
        </div>
      </div>
    </div>`).join('')}

    <!-- Quick nav -->
    <div style="display:flex;justify-content:space-around;padding:8px 0">
      <span onclick="navigate('dashboard')" style="font-size:14px;font-weight:700;color:#fff;cursor:pointer">
        <i class="fas fa-tachometer-alt" style="color:#8285f4;margin-right:4px"></i>Dashboard
      </span>
      <span onclick="navigate('map')" style="font-size:14px;font-weight:700;color:#fff;cursor:pointer">
        <i class="fas fa-map-marker-alt" style="color:#8285f4;margin-right:4px"></i>Map
      </span>
      <span onclick="navigate('alerts')" style="font-size:14px;font-weight:700;color:#fff;cursor:pointer">
        <i class="fas fa-exclamation-triangle" style="color:#fff;margin-right:4px"></i>Alert
      </span>
    </div>

  </div>
  ${bottomNav('tasks')}`;
}

// ── Screen 4: Safety Alert & Incident Reporting ──────────────
function renderAlerts() {
  document.getElementById('screen-alerts').innerHTML = `
  ${header()}
  <div class="screen-content">

    <!-- Active alert banner -->
    <div class="alert-banner">
      <div style="width:42px;height:42px;background:#f59e0b;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i class="fas fa-exclamation-triangle" style="color:#0a1628;font-size:18px"></i>
      </div>
      <div>
        <div style="font-size:14px;font-weight:700;color:#f59e0b">ACTIVE ALERT — Route Change</div>
        <div style="font-size:12px;color:#fbbf24;margin-top:4px">March diverted at 7th & Elm due to construction. Follow marshals to alternate path via 8th St.</div>
      </div>
    </div>

    <!-- Organizer broadcast -->
    <div class="broadcast-card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="width:28px;height:28px;background:#6366f1;border-radius:50%;display:flex;align-items:center;justify-content:center">
          <i class="fas fa-bullhorn" style="color:#fff;font-size:12px"></i>
        </div>
        <span style="font-size:12px;font-weight:700;color:#a1a3f7">ORGANIZER BROADCAST</span>
        <span style="font-size:12px;color:#737373;margin-left:auto">2 min ago</span>
      </div>
      <div style="font-size:18px;font-weight:700;color:#fff">Rally Phase Begins at 3:15 PM</div>
      <div style="font-size:14px;color:#d4d4d4;margin-top:8px">All participants proceed to Civic Center Plaza. Medics station at south entrance. Legal observers hold position at perimeter. Stay hydrated and keep communication channels open.</div>
    </div>

    <!-- Quick report -->
    <div style="font-size:16px;font-weight:700;color:#fff">Quick Report</div>
    <div class="quick-grid">
      <button class="quick-btn" style="background:#dc2626" onclick="showToast('Medical alert sent!')">
        <i class="fas fa-briefcase-medical"></i>Medical Needed
      </button>
      <button class="quick-btn" style="background:#d97706" onclick="showToast('Police activity reported!')">
        <i class="fas fa-shield-alt"></i>Police Activity
      </button>
      <button class="quick-btn" style="background:#7c3aed" onclick="showToast('Route block reported!')">
        <i class="fas fa-road"></i>Route Blocked
      </button>
      <button class="quick-btn" style="background:#059669" onclick="showToast('All clear sent!')">
        <i class="fas fa-check-circle"></i>All Clear
      </button>
    </div>

    <!-- Recent alerts -->
    <div style="font-size:16px;font-weight:700;color:#fff">Recent Alerts</div>
    ${[
      { bg:'#dc2626', icon:'fa-briefcase-medical', title:'Medical assistance requested', sub:'5th & Main — Dehydration case', time:'3:02 PM · Reported by Terrence Nguyen' },
      { bg:'#d97706', icon:'fa-shield-alt',        title:'Police presence increased',   sub:'7th & Elm — 4 officers on foot', time:'2:48 PM · Reported by Marcia Delgado' },
      { bg:'#059669', icon:'fa-check-circle',      title:'All clear — South perimeter', sub:'Civic Center south gate secure', time:'2:35 PM · Reported by Keisha Barnwell' },
      { bg:'#7c3aed', icon:'fa-road',              title:'Route blocked — 6th Ave',     sub:'Construction barrier across full lane', time:'2:20 PM · Reported by David Okonkwo' },
    ].map(a => `
    <div class="alert-item">
      <div class="alert-icon" style="background:${a.bg}">
        <i class="fas ${a.icon}" style="color:#fff;font-size:12px"></i>
      </div>
      <div>
        <div style="font-size:14px;font-weight:700;color:#fff">${a.title}</div>
        <div style="font-size:12px;color:#a3a3a3;margin-top:2px">${a.sub}</div>
        <div style="font-size:12px;color:#737373;margin-top:2px">${a.time}</div>
      </div>
    </div>`).join('')}

    <!-- Coordination team chat -->
    <div class="chat-box">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:32px;height:32px;background:#6366f1;border-radius:50%;display:flex;align-items:center;justify-content:center">
          <i class="fas fa-headset" style="color:#fff;font-size:12px"></i>
        </div>
        <div>
          <div style="font-size:14px;font-weight:700;color:#fff">Coordination Team</div>
          <div style="font-size:12px;color:#22c55e">● Online — Avg. response &lt;30s</div>
        </div>
      </div>
      <div class="chat-input-row">
        <input class="chat-input" type="text" placeholder="Type a message..." />
        <button class="chat-send" onclick="showToast('Message sent!')">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>

    <!-- Nav links -->
    <div style="display:flex;justify-content:space-around;padding:8px 0">
      <span onclick="navigate('dashboard')" style="font-size:12px;font-weight:700;color:#d4d4d4;cursor:pointer">
        <i class="fas fa-tachometer-alt" style="color:#6366f1;margin-right:4px"></i>Dashboard
      </span>
      <span onclick="navigate('map')" style="font-size:12px;font-weight:700;color:#d4d4d4;cursor:pointer">
        <i class="fas fa-map-marker-alt" style="color:#6366f1;margin-right:4px"></i>Map
      </span>
      <span onclick="navigate('tasks')" style="font-size:12px;font-weight:700;color:#d4d4d4;cursor:pointer">
        <i class="fas fa-list" style="color:#6366f1;margin-right:4px"></i>Tasks
      </span>
      <span onclick="navigate('checkin')" style="font-size:12px;font-weight:700;color:#d4d4d4;cursor:pointer">
        <i class="fas fa-qrcode" style="color:#6366f1;margin-right:4px"></i>Check-In
      </span>
    </div>

  </div>
  ${bottomNav('alerts')}`;
}

// ── Screen 5: Participant Check-In ───────────────────────────
function renderCheckin() {
  document.getElementById('screen-checkin').innerHTML = `
  ${header()}
  <div class="screen-content">

    <div style="text-align:center">
      <div style="font-size:18px;font-weight:700;color:#fff">Scan Hub to Check In</div>
      <div style="font-size:12px;color:#a3a3a3;margin-top:4px">Position the QR code within the frame below</div>
    </div>

    <!-- QR scanner frame -->
    <div style="display:flex;justify-content:center;padding:8px 0">
      <div class="qr-frame">
        <i class="fas fa-qrcode" style="color:#2a3a56;font-size:80px"></i>
      </div>
    </div>

    <!-- Registration card -->
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:36px;height:36px;background:#10b981;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <i class="fas fa-user-check" style="color:#fff;font-size:16px"></i>
        </div>
        <div>
          <div style="font-size:12px;color:#a3a3a3">You're registered as</div>
          <div style="font-size:14px;font-weight:700;color:#fff">Participant</div>
        </div>
        <div class="checked-in-badge" style="margin-left:auto">
          <span style="width:8px;height:8px;background:#10b981;border-radius:50%;display:inline-block"></span>
          <span style="font-size:12px;font-weight:700;color:#10b981">Checked In</span>
        </div>
      </div>
      <div style="border-top:1px solid #262626;margin-top:12px;padding-top:12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <i class="fas fa-bullhorn" style="color:#8285f4;font-size:12px"></i>
          <span style="font-size:12px;font-weight:700;color:#fff">March for Housing Justice</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <i class="fas fa-clock" style="color:#a3a3a3;font-size:11px"></i>
          <span style="font-size:12px;color:#d4d4d4">Today, 2:00 PM – 5:30 PM</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <i class="fas fa-location-arrow" style="color:#a3a3a3;font-size:11px"></i>
          <span style="font-size:12px;color:#d4d4d4">City Hall Plaza, 200 N Spring St</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <i class="fas fa-hourglass" style="color:#a3a3a3;font-size:11px"></i>
          <span style="font-size:12px;color:#d4d4d4">Expected duration: ~3.5 hours</span>
        </div>
      </div>
    </div>

    <!-- Pre-event readiness -->
    <div class="card">
      <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:12px">Pre-Event Readiness</div>
      ${[
        'Read safety guidelines',
        'Emergency contacts saved',
        'Communication channels joined',
        'Downloaded offline map',
      ].map(item => `
      <div class="checklist-item">
        <div class="check-box"><i class="fas fa-check" style="color:#fff;font-size:11px"></i></div>
        <span style="font-size:14px;color:#fff;flex:1">${item}</span>
        <i class="fas fa-check-circle" style="color:#10b981;font-size:14px"></i>
      </div>`).join('')}
    </div>

    <!-- Success banner -->
    <div class="success-banner">
      <div class="success-icon"><i class="fas fa-check" style="color:#fff;font-size:18px"></i></div>
      <div>
        <div style="font-size:14px;font-weight:700;color:#10b981">Successfully Checked In</div>
        <div style="font-size:12px;color:#6ee7b7;margin-top:2px">Today at 1:47 PM · Hub #A3</div>
      </div>
    </div>

    <!-- Action buttons -->
    <div style="display:flex;gap:10px">
      <button class="btn btn-indigo" style="flex:1;height:54px" onclick="navigate('dashboard')">
        <strong>Go to Dashboard</strong>
      </button>
      <button class="btn" style="flex:1;height:54px;background:#262626;border:1px solid #404040;color:#f5f5f5" onclick="navigate('alerts')">
        <strong>Report Issue</strong>
      </button>
    </div>

  </div>
  ${bottomNav('checkin')}`;
}

// ── Toast notification ───────────────────────────────────────
function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = `
    position:fixed;bottom:100px;left:50%;transform:translateX(-50%);
    background:#6366f1;color:#fff;padding:10px 20px;border-radius:12px;
    font-size:13px;font-weight:700;z-index:9999;pointer-events:none;
    animation:fadeInOut 2s ease forwards;
  `;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

// Add toast animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInOut {
    0%   { opacity:0; transform:translateX(-50%) translateY(10px); }
    20%  { opacity:1; transform:translateX(-50%) translateY(0); }
    80%  { opacity:1; }
    100% { opacity:0; }
  }
`;
document.head.appendChild(style);

// ── Init ─────────────────────────────────────────────────────
renderDashboard();
renderMap();
renderTasks();
renderAlerts();
renderCheckin();
navigate('dashboard');
