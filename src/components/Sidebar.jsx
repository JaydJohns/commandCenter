import { NavLink } from "react-router-dom";
import { navigation, quickTemplates } from "../data/mockData";

export default function Sidebar({ onTemplateClick }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="eyebrow">Prototype Build</div>
        <h1>Command Center</h1>
        <p>From Stitch concepts to a working React prototype with shared UI and mock workflows.</p>
      </div>

      <nav className="nav">
        {navigation.map((item) => (
          <NavLink
            key={item.id}
            to={item.id === "dashboard" ? "/" : `/${item.id}`}
            className={({ isActive }) => `nav__item ${isActive ? "is-active" : ""}`}
          >
            <span className="nav__eyebrow">{item.eyebrow}</span>
            <span className="nav__label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <section className="sidebar__panel">
        <div className="sidebar__panel-title">Quick templates</div>
        <div className="template-list">
          {quickTemplates.map((template) => (
            <button
              key={template}
              className="template-chip"
              type="button"
              onClick={() => onTemplateClick(template)}
            >
              {template}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
