import React from 'react';

const SidebarToggle = ({ toggleSidebar }) => {
    return (
        <button
            onClick={toggleSidebar}
            style={{
                position: 'fixed',
                top: '12px',
                left: '12px',
                zIndex: 998,
                background: '#1f2937',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '24px',
                padding: '8px 12px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#374151';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1f2937';
            }}
        >
            ☰
        </button>
    );
};

export default SidebarToggle;