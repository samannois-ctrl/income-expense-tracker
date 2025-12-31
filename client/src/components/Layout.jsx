import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div className="app-container">
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
                <Sidebar onLinkClick={closeSidebar} />
            </div>

            <main className="main-content">
                <Outlet />
            </main>

            <MobileNav />
        </div>
    );
};

export default Layout;
