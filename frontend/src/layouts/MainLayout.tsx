import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BookOpen, Library, ArrowRightLeft, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './MainLayout.module.css';

export const MainLayout: React.FC = () => {
  const { librarian, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.navContainer}>
          <div className={styles.brandGroup}>
            <NavLink to="/books" className={styles.brand}>
              <BookOpen className={styles.brandIcon} size={24} />
              <span>ShelfLife</span>
              <span className={styles.brandBadge}>LMS</span>
            </NavLink>

            <nav className={styles.navLinks}>
              <NavLink
                to="/books"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.activeNavLink : ''}`
                }
              >
                <Library size={18} />
                <span>Books</span>
              </NavLink>

              <NavLink
                to="/issue"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.activeNavLink : ''}`
                }
              >
                <ArrowRightLeft size={18} />
                <span>Issue Book</span>
              </NavLink>
            </nav>
          </div>

          <div className={styles.userGroup}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                {librarian?.name ? librarian.name.charAt(0).toUpperCase() : <User size={16} />}
              </div>
              <span className={styles.userName}>{librarian?.name || 'Demo Librarian'}</span>
            </div>

            <button
              onClick={handleLogout}
              className={styles.logoutBtn}
              title="Logout from ShelfLife"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
