import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Acasă', icon: '💰', end: true },
  { to: '/statistici', label: 'Statistici', icon: '📊' },
  { to: '/calendar', label: 'Calendar', icon: '📅' },
  { to: '/spatii', label: 'Spații', icon: '📂' },
  { to: '/obiective', label: 'Obiective', icon: '🎯' },
  { to: '/setari', label: 'Setări', icon: '⚙️' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
