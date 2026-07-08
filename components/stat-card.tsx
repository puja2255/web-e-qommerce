import { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="panel">
      <div className="nav-links" style={{ justifyContent: "space-between" }}>
        <span className="muted tiny">{label}</span>
        {icon}
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: 10 }}>{value}</div>
      {hint ? <div className="muted tiny" style={{ marginTop: 6 }}>{hint}</div> : null}
    </div>
  );
}

