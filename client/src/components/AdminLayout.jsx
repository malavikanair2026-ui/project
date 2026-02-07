import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Manage Users', icon: '👥' },
    { path: '/admin/students', label: 'Manage Students', icon: '🎓' },
    { path: '/admin/courses', label: 'Courses', icon: '📜' },
    { path: '/admin/departments', label: 'Departments', icon: '🏢' },
    { path: '/admin/classes', label: 'Manage Classes', icon: '🏫' },
    { path: '/admin/subjects', label: 'Manage Subjects', icon: '📚' },
    { path: '/admin/grading-schema', label: 'Grading Schema', icon: '⚙️' },
    { path: '/admin/results', label: 'View Results', icon: '📋' },
    { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={{ ...styles.sidebar, width: sidebarOpen ? '250px' : '70px' }}>
        <div style={styles.sidebarHeader}>
          {sidebarOpen && <h2 style={styles.logo}>SRA</h2>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.toggleBtn}
          >
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
        {/* Header */}
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>Admin Panel</h1>
          <div style={styles.headerRight}>
            <span style={styles.userName}>{user?.name}</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
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
    backgroundColor: '#2c3e50',
    color: 'white',
    transition: 'width 0.3s',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #34495e',
  },
  logo: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '18px',
  },
  nav: {
    flex: 1,
    padding: '10px 0',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    color: '#ecf0f1',
    textDecoration: 'none',
    transition: 'background 0.2s',
    gap: '10px',
  },
  navItemActive: {
    backgroundColor: '#34495e',
    borderLeft: '4px solid #3498db',
  },
  icon: {
    fontSize: '20px',
    minWidth: '24px',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: 'white',
    padding: '20px 30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    margin: 0,
    fontSize: '24px',
    color: '#2c3e50',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  userName: {
    color: '#666',
    fontWeight: '500',
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: '30px',
    overflowY: 'auto',
  },
};

export default AdminLayout;
