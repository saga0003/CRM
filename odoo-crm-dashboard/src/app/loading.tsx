export default function Loading() {
  return (
    <div className="shell">
      <aside className="sidebar"><div className="brand">Admissions <span>OS</span></div></aside>
      <main className="main">
        <div className="skeleton skeleton-title" />
        <div className="grid kpis" style={{marginTop:24}}>{Array.from({length:6}).map((_,i)=><div className="card" key={i}><div className="skeleton skeleton-line"/><div className="skeleton skeleton-value"/><div className="skeleton skeleton-line short"/></div>)}</div>
        <div className="grid two" style={{marginTop:16}}>{Array.from({length:2}).map((_,i)=><div className="card" key={i}><div className="skeleton skeleton-line"/><div className="skeleton skeleton-block"/></div>)}</div>
      </main>
    </div>
  );
}
