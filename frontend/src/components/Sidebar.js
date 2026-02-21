import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SidebarNavItem } from './design-system';
import './Sidebar.css';

const Sidebar = ({ user }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar">
      {/* Logo & Branding */}
      <div className="sidebar__top">
        <Link to="/admin/songs" className="sidebar__brand">
          <div className="sidebar__logo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <span className="sidebar__brand-text">KaraokeOS</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="sidebar__nav">
        <div className="sidebar__nav-section">
          <div className="sidebar__nav-label">MENU</div>
          <SidebarNavItem
            as={Link}
            to="/admin/dashboard"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            }
            label="Dashboard"
            active={isActive('/admin/dashboard')}
          />
          <SidebarNavItem
            as={Link}
            to="/admin/songs"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            }
            label="Songs Library"
            active={isActive('/admin/songs')}
          />
          <SidebarNavItem
            as={Link}
            to="/admin/ai-generator"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            }
            label="AI Generator"
            active={isActive('/admin/ai-generator')}
          />
          <SidebarNavItem
            as={Link}
            to="/admin/customers"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
            label="Customers"
            active={isActive('/admin/customers')}
          />
        </div>

        <div className="sidebar__nav-section">
          <div className="sidebar__nav-label">SETTINGS</div>
          <SidebarNavItem
            as={Link}
            to="/admin/appearance"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2" />
              </svg>
            }
            label="Appearance"
            active={isActive('/admin/appearance')}
          />
          <SidebarNavItem
            as={Link}
            to="/admin/libraries"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            }
            label="Venue Settings"
            active={isActive('/admin/libraries')}
          />
        </div>
      </div>

      {/* User Profile */}
      <div className="sidebar__footer">
        <div className="sidebar__avatar"></div>
        <div className="sidebar__user-info">
          <div className="sidebar__user-name">{user?.username || 'Admin User'}</div>
          <div className="sidebar__user-role">Admin</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
