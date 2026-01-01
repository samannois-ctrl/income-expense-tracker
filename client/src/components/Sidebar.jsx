import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { BASE_URL } from '../config/api.js';

const Sidebar = ({ onLinkClick }) => {
    const { user, logout } = useAuth();
    const { t } = useSettings();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
        if (onLinkClick) onLinkClick();
    };

    const handleLinkClick = () => {
        if (onLinkClick) onLinkClick();
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">💰</div>
                    <span>Tracker</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section">
                    <div className="sidebar-section-title">{t('sidebar.menu')}</div>

                    <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                        <span className="sidebar-link-icon">📊</span>
                        <span>{t('sidebar.dashboard')}</span>
                    </NavLink>
                    <NavLink to="/categories" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                        <span className="sidebar-link-icon">🏷️</span>
                        <span>หมวดรายรับ/รายจ่าย</span>
                    </NavLink>
                    <NavLink to="/entry" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                        <span className="sidebar-link-icon">➕</span>
                        <span>บันทึก รายรับ/รายจ่าย</span>
                    </NavLink>
                    <NavLink to="/menu" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                        <span className="sidebar-link-icon">🍜</span>
                        <span>จัดการรายการอาหาร</span>
                    </NavLink>
                    <NavLink to="/pos" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                        <span className="sidebar-link-icon">🧾</span>
                        <span>บันทึกการขาย</span>
                    </NavLink>
                    <NavLink to="/pos/history" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                        <span className="sidebar-link-icon">🕒</span>
                        <span>ประวัติการขาย</span>
                    </NavLink>

                </div>

                <div className="sidebar-section">
                    <div className="sidebar-section-title">{t('sidebar.account')}</div>
                    <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                        <span className="sidebar-link-icon">👤</span>
                        <span>{t('sidebar.profile')}</span>
                    </NavLink>
                    {user?.role === 'admin' && (
                        <>
                            <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                                <span className="sidebar-link-icon">👥</span>
                                <span>{t('sidebar.userManagement')}</span>
                            </NavLink>
                            <NavLink to="/backup" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                                <span className="sidebar-link-icon">💾</span>
                                <span>{t('sidebar.backup')}</span>
                            </NavLink>
                        </>
                    )}
                    <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                        <span className="sidebar-link-icon">⚙️</span>
                        <span>{t('sidebar.settings')}</span>
                    </NavLink>
                </div>
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">
                        {user?.avatar ? (
                            <img src={`${BASE_URL}${user.avatar}`} alt={user.fullName} />
                        ) : (
                            getInitials(user?.fullName)
                        )}
                    </div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{user?.fullName || 'User'}</div>
                        <div className="sidebar-user-role">{user?.role === 'admin' ? t('userManagement.admin') : t('userManagement.user')}</div>
                    </div>
                </div>
                <button className="btn-logout" onClick={handleLogout}>
                    <span>🚪</span>
                    <span>{t('sidebar.logout')}</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
