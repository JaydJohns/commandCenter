import { useLocation } from "react-router-dom";
import { navigation } from "../data/mockData";

export default function Topbar() {
  const location = useLocation();

  const currentNavItem = navigation.find(
    (item) =>
      location.pathname === `/${item.id}` ||
      (location.pathname === "/" && item.id === "dashboard")
  );

  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">Unified Control</div>
        <h2>{currentNavItem?.label}</h2>
        <p>Shared design system, mock data, and connected flows in a single app surface.</p>
      </div>
      <div className="topbar__meta">
        <div className="status-pill">
          <span className="status-pill__dot" />
          Prototype ready
        </div>
        <div className="status-pill muted">UTC-04:00</div>
      </div>
    </header>
  );
}
