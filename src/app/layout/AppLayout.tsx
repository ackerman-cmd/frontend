import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  HomeOutlined,
  TeamOutlined,
  LogoutOutlined,
  MenuOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAppDispatch } from '../store/hooks';
import { useAuth } from '../../shared/hooks/useAuth';
import { logout } from '../../features/auth/model/authSlice';
import { baseApi } from '../../shared/api/baseApi';
import { useServerLogoutMutation } from '../../shared/api/authApi';
import styles from './AppLayout.module.css';

const MAIN_NAV = [
  { to: '/', label: 'Главная', icon: <HomeOutlined />, exact: true },
];

const ADMIN_NAV = [
  { to: '/admin/users', label: 'Пользователи', icon: <TeamOutlined /> },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAdmin, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [serverLogout] = useServerLogoutMutation();

  const handleLogout = async () => {
    try { await serverLogout().unwrap(); } catch { }
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    navigate('/login', { replace: true });
  };

  const close = () => setSidebarOpen(false);

  const displayName = user?.sub ?? user?.email ?? '';
  const initials = displayName ? displayName.slice(0, 2).toUpperCase() : '?';

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarYellow} />

        <div className={styles.logoArea}>
          <Link to="/" className={styles.logoLink} onClick={close}>
            <div className={styles.logoSquare}>US</div>
            <div className={styles.logoTexts}>
              <span className={styles.logoName}>UserService</span>
              <span className={styles.logoSub}>Portal</span>
            </div>
          </Link>
        </div>

        <div className={styles.divider} />
        <div className={styles.sectionLabel}>Навигация</div>

        <nav className={styles.nav}>
          {MAIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={close}
              className={({ isActive }) =>
                isActive
                  ? `${styles.navLink} ${styles.navLinkActive}`
                  : styles.navLink
              }
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className={styles.divider} style={{ margin: '8px 0' }} />
              <div className={styles.sectionLabel} style={{ padding: '0 0 4px' }}>
                Администрирование
              </div>
              {ADMIN_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={close}
                  className={({ isActive }) =>
                    isActive
                      ? `${styles.navLink} ${styles.navLinkActive}`
                      : styles.navLink
                  }
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className={styles.sidebarFooter}>© 2026 UserService</div>
      </aside>

      {sidebarOpen && <div className={styles.overlay} onClick={close} />}

      <header className={styles.topbar}>
        <button
          className={styles.hamburger}
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Открыть меню"
        >
          <MenuOutlined />
        </button>

        <Link to="/profile" className={styles.profileChip}>
          <div className={styles.profileAvatar}>
            {displayName
              ? <span>{initials}</span>
              : <UserOutlined className={styles.profileAvatarIcon} />
            }
          </div>
          {displayName && (
            <span className={styles.profileName}>{displayName}</span>
          )}
          <UserOutlined style={{ fontSize: 13, color: 'var(--gray-500)', marginLeft: 2 }} />
        </Link>

        <button className={styles.btnLogout} onClick={handleLogout}>
          <LogoutOutlined />
          Выйти
        </button>
      </header>

      <div className={styles.contentWrap}>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
