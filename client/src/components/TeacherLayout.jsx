import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TeacherLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/teacher/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/teacher/classes', label: 'My Classes', icon: '🏫' },
    { path: '/teacher/students', label: 'My Students', icon: '👥' },
    { path: '/teacher/marks', label: 'Enter Marks', icon: '✏️' },
    { path: '/teacher/edit-marks', label: 'Edit Marks', icon: '📝' },
    { path: '/teacher/performance', label: 'Student Performance', icon: '📈' },
    { path: '/teacher/analytics', label: 'Class Analytics', icon: '📊' },
    { path: '/teacher/feedback', label: 'Feedback', icon: '💬' },
    { path: '/teacher/queries', label: 'Student Queries', icon: '📩' },
    { path: '/teacher/notifications', label: 'Notifications', icon: '🔔' },
    { path: '/teacher/profile', label: 'Profile', icon: '👤' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={{ ...styles.sidebar, width: sidebarOpen ? '240px' : '70px' }}>
        <div style={styles.sidebarHeader}>
          {sidebarOpen && <h2 style={styles.logo}>Teacher</h2>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.toggleBtn}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navItem,
                ...(location.pathname === item.path ? styles.navItemActive : {}),
              }}
            >
              <span style={styles.icon}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>Teacher Panel</h1>
          <div style={styles.headerRight}>
            <span style={styles.userName}>{user?.name}</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </header>

        <main style={styles.content}>{children}</main>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  sidebar: {
    backgroundColor: '#1f2a44',
    color: 'white',
    transition: 'width 0.3s',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: '18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #2f3d5a',
  },
  logo: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
  },
  nav: {
    flex: 1,
    padding: '10px 0',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 18px',
    color: '#ecf0f1',
    textDecoration: 'none',
    transition: 'background 0.2s',
    gap: '10px',
    fontSize: '15px',
  },
  navItemActive: {
    backgroundColor: '#2f3d5a',
    borderLeft: '4px solid #4aa3ff',
  },
  icon: {
    fontSize: '18px',
    minWidth: '22px',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: 'white',
    padding: '18px 28px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    margin: 0,
    fontSize: '22px',
    color: '#1f2a44',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userName: {
    color: '#555',
    fontWeight: '500',
  },
  logoutBtn: {
    padding: '8px 14px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: '28px',
    overflowY: 'auto',
  },
};

export default TeacherLayout;
