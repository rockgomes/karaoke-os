import React from 'react';
import Sidebar from './Sidebar';
import './AdminLayout.css';

const AdminLayout = ({ user, children }) => {
  return (
    <div className="admin-layout">
      <Sidebar user={user} />
      <div className="admin-layout__main">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
