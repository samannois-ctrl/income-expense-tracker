import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MobileNav = () => {
    const { user } = useAuth();

    return (
        <nav className="mobile-bottom-nav">
            <div className="mobile-bottom-nav-items">
                <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                    <span className="mobile-nav-item-icon">📊</span>
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/entry" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                    <span className="mobile-nav-item-icon">➕</span>
                    <span>Entry</span>
                </NavLink>
                <NavLink to="/history" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                    <span className="mobile-nav-item-icon">📋</span>
                    <span>History</span>
                </NavLink>
                <NavLink to="/profile" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                    <span className="mobile-nav-item-icon">👤</span>
                    <span>Profile</span>
                </NavLink>
                {user?.role === 'admin' && (
                    <NavLink to="/users" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                        <span className="mobile-nav-item-icon">👥</span>
                        <span>Users</span>
                    </NavLink>
                )}
            </div>
        </nav>
    );
};

export default MobileNav;
