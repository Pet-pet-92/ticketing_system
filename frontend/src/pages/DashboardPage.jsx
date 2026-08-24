import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const DashboardPage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0,
    });
    const [allTickets, setAllTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('total');
    const [newTicketId, setNewTicketId] = useState(null);

    const isAdmin = user?.is_superuser || user?.groups?.includes('Admin');
    const isAgent = user?.groups?.includes('Support_Agent') || user?.is_staff;

    const fetchDashboardData = async () => {
        try {
            const [statsRes, ticketsRes] = await Promise.all([
                api.get('/tickets/stats/'),
                api.get('/tickets/?limit=50&ordering=-created_at'),
            ]);
            setStats(statsRes.data);
            const tickets = ticketsRes.data.results || ticketsRes.data || [];
            setAllTickets(tickets);
            setFilteredTickets(tickets);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const isNew = localStorage.getItem('new_ticket_created');
        const ticketId = localStorage.getItem('new_ticket_id');
        
        if (isNew === 'true' && ticketId) {
            setNewTicketId(parseInt(ticketId));
            localStorage.removeItem('new_ticket_created');
        }

        fetchDashboardData();
    }, []);

    // ✅ Filter tickets by status
    const filterByStatus = (status) => {
        setActiveFilter(status);
        if (status === 'total') {
            setFilteredTickets(allTickets);
        } else {
            const filtered = allTickets.filter(ticket => ticket.status === status);
            setFilteredTickets(filtered);
        }
    };

    const goToTicket = (ticketId) => {
        window.location.href = `/tickets/${ticketId}`;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    const getDashboardTitle = () => {
        if (isAdmin) return 'Admin Dashboard';
        if (isAgent) return 'Agent Dashboard';
        return 'My Dashboard';
    };

    const getTicketSubtitle = () => {
        if (isAdmin) return 'Viewing all tickets in the system';
        if (isAgent) return 'Viewing tickets assigned to you';
        return 'Viewing tickets you have created';
    };

    // ✅ Card configuration
    const cards = [
        { key: 'total', label: 'Total', value: stats.total, color: '#6b7280', bg: '#f9fafb' },
        { key: 'open', label: 'Open', value: stats.open, color: '#2563eb', bg: '#eff6ff' },
        { key: 'in_progress', label: 'In Progress', value: stats.in_progress, color: '#ca8a04', bg: '#fefce8' },
        { key: 'resolved', label: 'Resolved', value: stats.resolved, color: '#16a34a', bg: '#f0fdf4' },
        { key: 'closed', label: 'Closed', value: stats.closed, color: '#6b7280', bg: '#f9fafb' },
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        Welcome, {user?.username || 'User'}!
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>
                        {getDashboardTitle()} — {getTicketSubtitle()}
                    </p>
                    {newTicketId && (
                        <p style={{ color: '#16a34a', marginTop: '4px' }}>
                             Ticket created successfully!
                        </p>
                    )}
                </div>
                <button
                    onClick={() => window.location.href = '/create-ticket'}
                    style={{
                        padding: '10px 20px',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                    }}
                >
                    + New Ticket
                </button>
            </div>

            {/* Clickable Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
            }}>
                {cards.map((card) => (
                    <div
                        key={card.key}
                        onClick={() => filterByStatus(card.key)}
                        style={{
                            background: activeFilter === card.key ? '#e5e7eb' : card.bg,
                            padding: '16px',
                            borderRadius: '8px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: activeFilter === card.key ? `2px solid ${card.color}` : '2px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                        }}
                    >
                        <h3 style={{ color: card.color, fontSize: '14px', fontWeight: '500' }}>
                            {card.label}
                        </h3>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: card.color }}>
                            {card.value}
                        </p>
                        {activeFilter === card.key && (
                            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                                ⚡ Active filter
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* Recent Tickets */}
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600' }}>
                        Recent Tickets
                        {activeFilter !== 'total' && (
                            <span style={{ fontSize: '14px', fontWeight: '400', color: '#6b7280', marginLeft: '12px' }}>
                                Filtered by: <strong>{activeFilter.replace('_', ' ').toUpperCase()}</strong>
                                <button
                                    onClick={() => filterByStatus('total')}
                                    style={{
                                        marginLeft: '8px',
                                        padding: '2px 10px',
                                        fontSize: '12px',
                                        background: '#f3f4f6',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Clear
                                </button>
                            </span>
                        )}
                    </h2>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        Showing {filteredTickets.length} of {allTickets.length} tickets
                    </span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f9fafb' }}>
                            <tr>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>
                                    Ticket Number
                                </th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>
                                    Title
                                </th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>
                                    Status
                                </th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>
                                    Priority
                                </th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>
                                    Assigned To
                                </th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>
                                    Created By
                                </th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>
                                    Created
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.length > 0 ? (
                                filteredTickets.map((ticket) => {
                                    const isNew = ticket.id === newTicketId;
                                    return (
                                        <tr
                                            key={ticket.id}
                                            style={{
                                                borderTop: '1px solid #e5e7eb',
                                                backgroundColor: isNew ? '#d1fae5' : 'transparent',
                                                transition: 'background-color 0.5s ease',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => goToTicket(ticket.id)}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = isNew ? '#d1fae5' : '#f3f4f6';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = isNew ? '#d1fae5' : 'transparent';
                                            }}
                                        >
                                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: isNew ? 'bold' : 'normal' }}>
                                                {ticket.ticket_number || `T-${ticket.id}`}
                                                {isNew && <span style={{ color: '#16a34a', marginLeft: '8px', fontSize: '12px' }}> New</span>}
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>{ticket.title}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '9999px',
                                                    fontSize: '12px',
                                                    background: ticket.status === 'open' ? '#dbeafe' :
                                                              ticket.status === 'in_progress' ? '#fef3c7' :
                                                              ticket.status === 'resolved' ? '#d1fae5' : '#f3f4f6',
                                                    color: ticket.status === 'open' ? '#1d4ed8' :
                                                           ticket.status === 'in_progress' ? '#b45309' :
                                                           ticket.status === 'resolved' ? '#065f46' : '#4b5563'
                                                }}>
                                                    {ticket.status?.replace('_', ' ') || 'Unknown'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '14px', textTransform: 'capitalize' }}>
                                                {ticket.priority || 'Medium'}
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                                                {ticket.assigned_to || 'Unassigned'}
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                                                {ticket.created_by || 'Unknown'}
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                                        No tickets found for this filter
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;