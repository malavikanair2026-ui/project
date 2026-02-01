import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PrincipalProvider, usePrincipal } from '../context/PrincipalContext';

const PrincipalLayoutInner = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    uniqueSemesters,
    uniqueSections,
    selectedSemester,
    selectedSection,
    setSelectedSemester,
    setSelectedSection,
    loading: contextLoading,
  } = usePrincipal();

  const menuItems = [
    { path: '/principal/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/principal/students', label: 'View Students', icon: '👥' },
    { path: '/principal/results', label: 'View Results', icon: '📋' },
    { path: '/principal/analytics', label: 'Analytics', icon: '📈' },
    { path: '/principal/profile', label: 'Profile', icon: '👤' },
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
          {sidebarOpen && <h2 style={styles.logo}>Principal</h2>}
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
        {/* Header - Section & Semester same source as Class Management */}
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>Principal Dashboard</h1>
          <div style={styles.headerFilters}>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              style={styles.select}
              disabled={contextLoading}
            >
              <option value="">All Sections</option>
              {uniqueSections.map((section) => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              style={styles.select}
              disabled={contextLoading}
            >
              <option value="">All Semesters</option>
              {uniqueSemesters.map((sem) => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
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

const PrincipalLayout = ({ children }) => (
  <PrincipalProvider>
    <PrincipalLayoutInner>{children}</PrincipalLayoutInner>
  </PrincipalProvider>
);

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  sidebar: {
    backgroundColor: '#9b59b6',
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
    borderBottom: '1px solid rgba(255,255,255,0.2)',
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
    color: 'rgba(255,255,255,0.9)',
    textDecoration: 'none',
    transition: 'background 0.2s',
    gap: '10px',
  },
  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderLeft: '4px solid white',
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
    gap: '20px',
    flexWrap: 'wrap',
  },
  headerFilters: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
    minWidth: '120px',
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

export default PrincipalLayout;
