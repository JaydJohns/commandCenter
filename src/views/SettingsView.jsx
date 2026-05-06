export default function SettingsView({ groups }) {
  return (
    <section className="settings-grid">
      {groups.map((group) => (
        <div className="card" key={group.title}>
          <div className="section-heading">
            <div>
              <div className="eyebrow">Configuration</div>
              <h4>{group.title}</h4>
            </div>
          </div>
          <div className="settings-list">
            {group.items.map((item) => (
              <div className="settings-item" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
