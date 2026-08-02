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
    const [recentTickets, setRecentTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTicketId, setNewTicketId] = useState(null);

    const isAdmin = user?.is_superuser || user?.groups?.includes('Admin');
    const isAgent = user?.groups?.includes('Support_Agent') || user?.is_staff;

    const fetchDashboardData = async () => {
        try {
            const [statsRes, ticketsRes] = await Promise.all([
                api.get('/tickets/stats/'),
                api.get('/tickets/?limit=10&ordering=-created_at'),
            ]);
            setStats(statsRes.data);
            setRecentTickets(ticketsRes.data.results || ticketsRes.data || []);
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

        const interval = setInterval(() => {
            fetchDashboardData();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

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

    //  Navigate to ticket detail page
    const goToTicket = (ticketId) => {
        window.location.href = `/tickets/${ticketId}`;
    };

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

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
            }}>
                <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ color: '#6b7280', fontSize: '14px' }}>Total</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total}</p>
                </div>
                <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ color: '#2563eb', fontSize: '14px' }}>Open</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>{stats.open}</p>
                </div>
                <div style={{ background: '#fefce8', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ color: '#ca8a04', fontSize: '14px' }}>In Progress</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ca8a04' }}>{stats.in_progress}</p>
                </div>
                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ color: '#16a34a', fontSize: '14px' }}>Resolved</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{stats.resolved}</p>
                </div>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ color: '#6b7280', fontSize: '14px' }}>Closed</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.closed}</p>
                </div>
            </div>

            {/* Recent Tickets */}
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Recent Tickets</h2>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {isAdmin ? 'All tickets' : isAgent ? 'Assigned to you' : 'Your tickets'}
                    </span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f9fafb' }}>
                            <tr>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Ticket #</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Title</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Priority</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Assigned To</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTickets.length > 0 ? (
                                recentTickets.map((ticket) => {
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
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                                        {isAdmin ? 'No tickets found' : isAgent ? 'No tickets assigned to you' : 'You have not created any tickets yet'}
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