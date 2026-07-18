const kpis = [
  ['Total Leads', '4,974', '+128 this month'],
  ['Admissions', '39', '₹32.4L confirmed'],
  ['Conversion', '2.4%', '+0.3% vs last month'],
  ['Due Today', '84', 'Needs action'],
  ['Overdue', '126', '37 high priority'],
  ['Forecast', '₹58.2L', 'Weighted pipeline'],
];

const stages = [
  ['New Lead', 132, 16, '₹0'],
  ['Qualified', 202, 24, '₹70K'],
  ['Appointment Scheduled', 5, 1, '₹0'],
  ['Visited School', 2, 1, '₹0'],
  ['NEET Long Term', 44, 19, '₹12.8L'],
  ['Admission Confirmed', 39, 28, '₹32.4L'],
];

const agents = [
  ['Sachin', 87, 389, 7, '1.8%', 40, 72],
  ['Ramya', 70, 269, 7, '2.6%', 35, 57],
  ['Rohan', 92, 170, 5, '2.9%', 15, 40],
];

export default function DashboardPage() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Admissions <span>OS</span></div>
        <nav className="nav">
          <a className="active" href="#">Command Center</a>
          <a href="#">Leads</a>
          <a href="#">Follow-ups</a>
          <a href="#">Telecaller Analytics</a>
          <a href="#">Pipeline</a>
          <a href="#">Targets & Forecast</a>
          <a href="#">Reports</a>
          <a href="#">Settings</a>
        </nav>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h1>Admissions Command Center</h1>
            <div className="sub">Live operational view across institutes, programmes, agents and lead stages.</div>
          </div>
          <div className="filters">
            <select defaultValue="2026-27"><option>2026-27</option><option>2027-28</option></select>
            <select defaultValue="all"><option value="all">All Institutes</option><option>St. Mary’s ISC</option><option>SMIS</option><option>State Board</option><option>St. Mary’s Kids</option></select>
            <select defaultValue="30"><option value="30">Last 30 Days</option><option value="7">Last 7 Days</option><option value="today">Today</option></select>
          </div>
        </div>

        <section className="grid kpis">
          {kpis.map(([label, value, note]) => (
            <div className="card" key={label}>
              <div className="kpi-label">{label}</div>
              <div className="kpi-value">{value}</div>
              <div className="kpi-note">{note}</div>
            </div>
          ))}
        </section>

        <section className="alerts">
          <div className="alert danger"><span>Overdue follow-ups</span><strong>126</strong></div>
          <div className="alert warn"><span>Stagnant leads</span><strong>169</strong></div>
          <div className="alert warn"><span>No action recorded</span><strong>58</strong></div>
          <div className="alert good"><span>Appointments today</span><strong>12</strong></div>
        </section>

        <section className="grid two">
          <div className="card">
            <div className="section-title">Pipeline Distribution</div>
            <div className="section-sub">Lead count, share and expected value at each important stage.</div>
            {stages.map(([stage, count, share, value]) => (
              <div className="pipeline-row" key={String(stage)}>
                <strong>{stage}</strong>
                <span>{count}</span>
                <div className="bar"><span style={{ width: `${share}%` }} /></div>
                <span>{value}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="section-title">Today’s Priorities</div>
            <div className="section-sub">The highest-impact work for the admissions team.</div>
            <table>
              <thead><tr><th>Lead</th><th>Programme</th><th>Status</th></tr></thead>
              <tbody>
                <tr><td>Akash R.</td><td>NEET Long Term</td><td><span className="badge hot">Overdue</span></td></tr>
                <tr><td>Navya M.</td><td>Grade 11 Science</td><td><span className="badge">Due today</span></td></tr>
                <tr><td>Rahul P.</td><td>JEE Repeaters</td><td><span className="badge good">Hot lead</span></td></tr>
                <tr><td>Sahana K.</td><td>Grade 1 ICSE</td><td><span className="badge">Appointment</span></td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="card" style={{ marginTop: 16 }}>
          <div className="section-title">Telecaller Performance</div>
          <div className="section-sub">Daily effort, assigned leads, conversions and operational risk.</div>
          <table>
            <thead><tr><th>Agent</th><th>Calls</th><th>Leads</th><th>Admissions</th><th>Conversion</th><th>Overdue</th><th>Stagnant</th></tr></thead>
            <tbody>
              {agents.map(([name, calls, leads, admissions, conversion, overdue, stagnant]) => (
                <tr key={String(name)}><td><strong>{name}</strong></td><td>{calls}</td><td>{leads}</td><td>{admissions}</td><td>{conversion}</td><td>{overdue}</td><td>{stagnant}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
