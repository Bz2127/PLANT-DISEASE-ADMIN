// client/src/components/Sidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="admin-sidebar" style={{ width: '250px', background: '#1e293b', color: 'white', height: '100vh' }}>
      <h2 style={{ padding: '20px', textAlign: 'center' }}>PLANT AI</h2>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px' }}>
        <Link to="/dashboard" style={navStyle}>📊 Dashboard Overview</Link>
        <Link to="/diseases" style={navStyle}>🌱 Disease Library</Link>
        <Link to="/crops" style={navStyle}>🌾 Crop Management</Link>
        <Link to="/users" style={navStyle}>👥 User Monitoring</Link>
        <Link to="/scans" style={navStyle}>📸 Scan History (AI Audit)</Link>
        <Link to="/notifications" style={navStyle}>🔔 Notification Hub</Link>
        <Link to="/cms" style={navStyle}>✍️ Content (CMS)</Link>
        <Link to="/analytics" style={navStyle}>📈 Analytics & Reports</Link>
      </nav>
    </div>
  );
};

const navStyle = { color: 'white', textDecoration: 'none', padding: '12px', borderRadius: '8px', transition: '0.3s' };

export default Sidebar;
