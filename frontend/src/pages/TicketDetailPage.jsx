import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import TicketComments from '../components/tickets/TicketComments';

const TicketDetailPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);

    const fetchTicket = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/tickets/${id}/`);
            setTicket(response.data);
        } catch (err) {
            setError('Failed to load ticket');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicket();
    }, [id]);

    const handleStatusChange = async (newStatus) => {
        setUpdating(true);
        try {
            await api.post(`/tickets/${id}/update_status/`, { status: newStatus });
            fetchTicket();
        } catch (err) {
            setError('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading ticket...</p>
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ color: '#dc2626' }}>{error || 'Ticket not found'}</p>
                <button
                    onClick={() => navigate('/tickets')}
                    style={{
                        padding: '8px 16px',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginTop: '16px',
                    }}
                >
                    Back to Tickets
                </button>
            </div>
        );
    }

    const isAgent = user?.groups?.includes('Support_Agent') || user?.is_staff;
    const isAdmin = user?.is_superuser;

    return (
        <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
            {/* Back button */}
            <button
                onClick={() => navigate('/tickets')}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginBottom: '16px',
                }}
            >
                ← Back to Tickets
            </button>

            {/* Ticket Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {ticket.ticket_number || `#${ticket.id}`}: {ticket.title}
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>
                        Created {new Date(ticket.created_at).toLocaleString()}
                        {ticket.created_by && ` by ${ticket.created_by}`}
                    </p>
                </div>
                <div style={{
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '14px',
                    background: ticket.status === 'open' ? '#dbeafe' :
                              ticket.status === 'in_progress' ? '#fef3c7' :
                              ticket.status === 'resolved' ? '#d1fae5' : '#f3f4f6',
                    color: ticket.status === 'open' ? '#1d4ed8' :
                           ticket.status === 'in_progress' ? '#b45309' :
                           ticket.status === 'resolved' ? '#065f46' : '#4b5563',
                }}>
                    {ticket.status?.replace('_', ' ')}
                </div>
            </div>

            {/* Ticket Details */}
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <h4 style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Description</h4>
                        <p style={{ marginTop: '4px' }}>{ticket.description}</p>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Priority</h4>
                        <p style={{ marginTop: '4px', textTransform: 'capitalize' }}>{ticket.priority}</p>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Category</h4>
                        <p style={{ marginTop: '4px' }}>{ticket.category_name || 'N/A'}</p>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Type</h4>
                        <p style={{ marginTop: '4px' }}>{ticket.type_name || 'N/A'}</p>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Assigned To</h4>
                        <p style={{ marginTop: '4px' }}>{ticket.assigned_to || 'Unassigned'}</p>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>SLA Status</h4>
                        <p style={{ marginTop: '4px' }}>{ticket.sla_status || 'N/A'}</p>
                    </div>
                </div>

                {/* Status Update (Agents only) */}
                {(isAgent || isAdmin) && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                        <h4 style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Update Status
                        </h4>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {['open', 'in_progress', 'resolved', 'closed'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusChange(status)}
                                    disabled={status === ticket.status || updating}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        border: status === ticket.status ? '2px solid #2563eb' : '1px solid #d1d5db',
                                        background: status === ticket.status ? '#eff6ff' : 'white',
                                        color: status === ticket.status ? '#2563eb' : '#4b5563',
                                        cursor: status === ticket.status || updating ? 'default' : 'pointer',
                                        fontSize: '12px',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {status.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ============================================ */}
            {/* COMMENTS SECTION */}
            {/* ============================================ */}
            <TicketComments ticketId={ticket.id} />
        </div>
    );
};

export default TicketDetailPage;