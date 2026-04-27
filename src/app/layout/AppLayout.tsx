import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  TeamOutlined,
  LogoutOutlined,
  MenuOutlined,
  UserOutlined,
  FileTextOutlined,
  BankOutlined,
  ApartmentOutlined,
  StarOutlined,
  TagsOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import { useAppDispatch } from '../store/hooks';
import { useAuth } from '../../shared/hooks/useAuth';
import { logout } from '../../features/auth/model/authSlice';
import { baseApi } from '../../shared/api/baseApi';
import { crmApi } from '../../shared/api/crmBaseApi';
import { useServerLogoutMutation } from '../../shared/api/authApi';
import { ROLE_ADMIN } from '../../shared/lib/constants';
import styles from './AppLayout.module.css';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
  requiredRoles?: string[];
}

const MAIN_NAV: NavItem[] = [
  { to: '/appeals',           label: 'Обращения',         icon: <FileTextOutlined />,  exact: false },
  { to: '/organizations',     label: 'Организации',       icon: <BankOutlined />,      exact: false, requiredRoles: [ROLE_ADMIN] },
  { to: '/assignment-groups', label: 'Группы назначения', icon: <ApartmentOutlined />, exact: false, requiredRoles: [ROLE_ADMIN] },
  { to: '/skill-groups',      label: 'Скилл-группы',      icon: <StarOutlined />,      exact: false, requiredRoles: [ROLE_ADMIN] },
  { to: '/appeal-topics',     label: 'Тематики',          icon: <TagsOutlined />,      exact: false, requiredRoles: [ROLE_ADMIN] },
  { to: '/reports',           label: 'Отчёты',            icon: <BarChartOutlined />,  exact: false, requiredRoles: [ROLE_ADMIN] },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/admin/users', label: 'Пользователи', icon: <TeamOutlined />, requiredRoles: [ROLE_ADMIN] },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAdmin, user, hasAnyRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [serverLogout] = useServerLogoutMutation();

  const visibleMainNav  = MAIN_NAV.filter((item) => hasAnyRole(item.requiredRoles ?? []));
  const visibleAdminNav = ADMIN_NAV.filter((item) => hasAnyRole(item.requiredRoles ?? []));

  const handleLogout = async () => {
    try { await serverLogout().unwrap(); } catch { }
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    dispatch(crmApi.util.resetApiState());
    navigate('/signin', { replace: true });
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
            <div className={styles.logoSquare}>AS</div>
          </Link>
        </div>

        <div className={styles.divider} />

        <nav className={styles.nav}>
          {visibleMainNav.map((item) => (
            <Tooltip key={item.to} title={item.label} placement="right">
              <NavLink
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
              </NavLink>
            </Tooltip>
          ))}

          {isAdmin && visibleAdminNav.length > 0 && (
            <>
              <div className={styles.divider} style={{ margin: '8px 4px' }} />
              {visibleAdminNav.map((item) => (
                <Tooltip key={item.to} title={item.label} placement="right">
                  <NavLink
                    to={item.to}
                    onClick={close}
                    className={({ isActive }) =>
                      isActive
                        ? `${styles.navLink} ${styles.navLinkActive}`
                        : styles.navLink
                    }
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                  </NavLink>
                </Tooltip>
              ))}
            </>
          )}
        </nav>

        <div className={styles.sidebarFooter}>arm-support-service</div>
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
