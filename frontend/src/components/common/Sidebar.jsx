import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [expandedMenus, setExpandedMenus] = useState({
        dashboard: true,
        tickets: true,
        management: false,
        users: false,
        reports: false,
    });

    // Close sidebar on mobile when route changes
    useEffect(() => {
        if (window.innerWidth < 768) {
            toggleSidebar();
        }
    }, [location.pathname]);

    const toggleMenu = (menu) => {
        setExpandedMenus((prev) => ({
            ...prev,
            [menu]: !prev[menu],
        }));
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Determine user role
    const isAdmin = user?.is_superuser || user?.groups?.includes('Admin');
    const isAgent = user?.groups?.includes('Support_Agent') || user?.is_staff;

    // Menu items based on role
    const menuItems = {
        dashboard: {
            label: 'Dashboard',
            items: [
                { label: 'Overview', path: '/dashboard' },
                { label: 'Analytics', path: '/analytics' },
            ],
            roles: ['admin', 'agent', 'user'],
        },
        tickets: {
            label: 'Tickets',
            items: [
                { label: 'All Tickets', path: '/tickets' },
                { label: 'My Tickets', path: '/my-tickets' },
                { label: 'Create Ticket', path: '/create-ticket' },
            ],
            roles: ['admin', 'agent', 'user'],
        },
        management: {
            label: 'Management',
            items: [
                { label: 'Categories', path: '/categories' },
                { label: 'Types', path: '/types' },
                { label: 'Departments', path: '/departments' },
                { label: 'Priority Rules', path: '/priority-rules' },
                { label: 'SLA Rules', path: '/sla-rules' },
            ],
            roles: ['admin', 'agent'],
        },
        users: {
            label: 'Users',
            items: [
                { label: 'All Users', path: '/users' },
                { label: 'Roles', path: '/roles' },
            ],
            roles: ['admin'],
        },
        reports: {
            label: 'Reports',
            items: [
                { label: 'Reports Dashboard', path: '/reports' },  // ✅ UNIFIED
            ],
            roles: ['admin'],
        },
    };

    // Filter menus based on user role
    const getVisibleMenus = () => {
        const role = isAdmin ? 'admin' : isAgent ? 'agent' : 'user';
        const visible = {};
        Object.keys(menuItems).forEach((key) => {
            if (menuItems[key].roles.includes(role)) {
                visible[key] = menuItems[key];
            }
        });
        return visible;
    };

    const visibleMenus = getVisibleMenus();

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    onClick={toggleSidebar}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 999,
                        display: 'block',
                    }}
                />
            )}

            {/* Sidebar */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: isOpen ? '280px' : '0px',
                    backgroundColor: '#1f2937',
                    color: '#e5e7eb',
                    overflowX: 'hidden',
                    overflowY: 'auto',
                    transition: 'width 0.3s ease',
                    zIndex: 1000,
                    boxShadow: '2px 0 8px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Logo / Header */}
                <div
                    style={{
                        padding: '20px 16px',
                        borderBottom: '1px solid #374151',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minHeight: '64px',
                    }}
                >
                    <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', fontSize: '18px', fontWeight: 'bold' }}>
                        Ticketing System
                    </Link>
                    <button
                        onClick={toggleSidebar}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#9ca3af',
                            fontSize: '20px',
                            cursor: 'pointer',
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '16px 0' }}>
                    {Object.keys(visibleMenus).map((menuKey) => {
                        const menu = visibleMenus[menuKey];
                        const isExpanded = expandedMenus[menuKey];
                        const hasActiveChild = menu.items.some(
                            (item) => location.pathname === item.path
                        );

                        return (
                            <div key={menuKey} style={{ marginBottom: '4px' }}>
                                {/* Menu Header */}
                                <div
                                    onClick={() => toggleMenu(menuKey)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 16px',
                                        cursor: 'pointer',
                                        backgroundColor: hasActiveChild ? '#374151' : 'transparent',
                                        borderRadius: '4px',
                                        margin: '0 8px',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!hasActiveChild) {
                                            e.currentTarget.style.backgroundColor = '#374151';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!hasActiveChild) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                >
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{menu.label}</span>
                                    <span style={{ fontSize: '12px', transition: 'transform 0.3s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                        ▼
                                    </span>
                                </div>

                                {/* Submenu Items */}
                                {isExpanded && (
                                    <div style={{ paddingLeft: '16px' }}>
                                        {menu.items.map((item) => {
                                            const isActive = location.pathname === item.path;
                                            return (
                                                <Link
                                                    key={item.path}
                                                    to={item.path}
                                                    style={{
                                                        display: 'block',
                                                        padding: '8px 16px',
                                                        margin: '2px 8px',
                                                        borderRadius: '4px',
                                                        textDecoration: 'none',
                                                        color: isActive ? 'white' : '#9ca3af',
                                                        backgroundColor: isActive ? '#2563eb' : 'transparent',
                                                        fontSize: '14px',
                                                        transition: 'all 0.2s',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isActive) {
                                                            e.currentTarget.style.backgroundColor = '#374151';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isActive) {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                        }
                                                    }}
                                                >
                                                    {item.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div
                    style={{
                        padding: '16px',
                        borderTop: '1px solid #374151',
                        marginTop: 'auto',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px 8px',
                            borderRadius: '4px',
                            marginBottom: '8px',
                        }}
                    >
                        <div
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                backgroundColor: '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '16px',
                            }}
                        >
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: '500' }}>{user?.username || 'User'}</div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                {isAdmin ? 'Admin' : isAgent ? 'Agent' : 'User'}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: 'none',
                            border: '1px solid #4b5563',
                            borderRadius: '4px',
                            color: '#e5e7eb',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#374151';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;