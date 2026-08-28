import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./design-system";
import ThemeToggle from "./ThemeToggle";
import { IS_DEMO } from "../demo";
import "./Navbar.css";

// Inline SVG icons — no external icon library needed
const MenuIcon = () => (
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20">
    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CloseIcon = () => (
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20">
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const UserIcon = () => (
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LogoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const Navbar = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin");
  const showAdminLogin = !user && isAdminRoute;

  const isActive = (path) => location.pathname === path;

  const handleToggleMenu = () => setIsMenuOpen((open) => !open);
  const handleCloseMenu = () => setIsMenuOpen(false);

  return (
    <>
      <nav className="navbar">
        {/* Brand */}
        <div className="navbar__brand">
          {user && (
            <button
              type="button"
              className="navbar__menu-btn"
              aria-label="Open navigation menu"
              aria-expanded={isMenuOpen}
              onClick={handleToggleMenu}
            >
              <MenuIcon />
            </button>
          )}
          <Link to="/" className="navbar__logo-link">
            <div className="navbar__logo-icon">
              <LogoIcon />
            </div>
            <span className="navbar__logo-text">Karaoke OS</span>
          </Link>
        </div>

        {/* Desktop nav links — only when logged in */}
        {user && (
          <div className="navbar__links">
            <Link
              to="/admin/songs"
              className={`navbar__link${isActive("/admin/songs") ? " navbar__link--active" : ""}`}
            >
              Manage Songs
            </Link>
            <Link
              to="/admin/libraries"
              className={`navbar__link${isActive("/admin/libraries") ? " navbar__link--active" : ""}`}
            >
              Libraries
            </Link>
          </div>
        )}

        {/* Desktop right actions */}
        <div className="navbar__actions">
          {user ? (
            <>
              <span className="navbar__user">
                <UserIcon />
                {user.username}
              </span>
              <Button variant="outline" onClick={onLogout} className="navbar__logout-btn">
                Logout
              </Button>
            </>
          ) : (
            showAdminLogin && (
              <Link to="/admin/login" className="navbar__link">
                Admin Login
              </Link>
            )
          )}
          {/* Dark mode is unfinished, so the demo does not offer it. */}
          {!IS_DEMO && <ThemeToggle />}
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {user && (
        <>
          {/* Backdrop */}
          <div
            className={`navbar__backdrop${isMenuOpen ? " navbar__backdrop--open" : ""}`}
            aria-hidden="true"
            onClick={handleCloseMenu}
          />

          {/* Drawer */}
          <div
            className={`navbar__drawer${isMenuOpen ? " navbar__drawer--open" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="navbar__drawer-header">
              <button
                type="button"
                className="navbar__drawer-close"
                onClick={handleCloseMenu}
                aria-label="Close navigation menu"
              >
                <CloseIcon />
                <span>Karaoke OS</span>
              </button>
            </div>

            <div className="navbar__drawer-body">
              <div className="navbar__drawer-user">
                <UserIcon />
                <span>{user.username}</span>
              </div>

              <nav className="navbar__drawer-nav">
                <Link
                  to="/admin/songs"
                  className={`navbar__drawer-link${isActive("/admin/songs") ? " navbar__drawer-link--active" : ""}`}
                  onClick={handleCloseMenu}
                >
                  Manage Songs
                </Link>
                <Link
                  to="/admin/libraries"
                  className={`navbar__drawer-link${isActive("/admin/libraries") ? " navbar__drawer-link--active" : ""}`}
                  onClick={handleCloseMenu}
                >
                  Libraries
                </Link>
              </nav>

              <Button
                variant="outline"
                className="navbar__drawer-logout"
                onClick={() => {
                  handleCloseMenu();
                  onLogout();
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
