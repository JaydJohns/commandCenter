export default function MetricCard({ label, value, detail }) {
  return (
    <article className="card metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
