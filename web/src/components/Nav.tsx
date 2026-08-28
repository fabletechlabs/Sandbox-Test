import { NavLink } from 'react-router-dom';

function linkClassName({ isActive }: { isActive: boolean }): string {
  return isActive ? 'nav-link nav-link-active' : 'nav-link';
}

function Nav() {
  return (
    <>
      {/* Visually hidden until focused; jumps keyboard/screen reader users past the nav. */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="app-header">
        <div className="app-header-inner">
          <span className="app-title">Cardboard</span>
          <nav aria-label="Main">
            <ul className="nav-list">
              <li>
                <NavLink to="/" end className={linkClassName}>
                  Board
                </NavLink>
              </li>
              <li>
                <NavLink to="/backlog" className={linkClassName}>
                  Backlog
                </NavLink>
              </li>
              <li>
                <NavLink to="/epics" className={linkClassName}>
                  Epics
                </NavLink>
              </li>
              <li>
                <NavLink to="/docs" className={linkClassName}>
                  Docs
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}

export default Nav;
