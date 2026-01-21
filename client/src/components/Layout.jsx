import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    const toggleCollapse = () => {
        setCollapsed(!collapsed);
    };

    return (
        <div className={`app-container ${collapsed ? 'layout-collapsed' : ''}`}>
            {/* Hamburger Button */}
            <button
                className={`hamburger-btn ${sidebarOpen ? 'active' : ''}`}
                onClick={toggleSidebar}
                aria-label="Toggle menu"
            >
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
            </button>

            {/* Overlay */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
                onClick={closeSidebar}
            ></div>

            {/* Sidebar */}
            <div className={sidebarOpen ? 'sidebar-wrapper open' : 'sidebar-wrapper'}>
                <Sidebar
                    onLinkClick={closeSidebar}
                    collapsed={collapsed}
                    toggleCollapse={toggleCollapse}
                />
            </div>

            <main className="main-content">
                <Outlet />
            </main>

            <MobileNav />
        </div>
    );
};

export default Layout;
