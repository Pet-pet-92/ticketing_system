import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const TicketReassign = ({ ticketId, currentAssignee, onReassigned }) => {
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingAgents, setFetchingAgents] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (showDropdown) {
            fetchAgents();
        }
    }, [showDropdown]);

    const fetchAgents = async () => {
        setFetchingAgents(true);
        setError('');
        try {
            const response = await api.get('/tickets/available_agents/');
            console.log('Agents response:', response.data);
            setAgents(response.data || []);
            if (response.data.length === 0) {
                setError('No agents found. Please add users to the Support_Agent group.');
            }
        } catch (error) {
            console.error('Error fetching agents:', error);
            setError('Failed to load agents. Please try again.');
        } finally {
            setFetchingAgents(false);
        }
    };

    const handleReassign = async () => {
        if (!selectedAgent) {
            setError('Please select an agent');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await api.post(`/tickets/${ticketId}/reassign/`, {
                assigned_to: selectedAgent,
            });
            setSuccess('Ticket reassigned successfully!');
            setTimeout(() => {
                setShowDropdown(false);
                if (onReassigned) onReassigned();
            }, 1500);
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to reassign ticket');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Reassign Button */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                    padding: '8px 16px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}
            >
                🔄 Reassign
                <span style={{ fontSize: '10px' }}>{showDropdown ? '▲' : '▼'}</span>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        background: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        padding: '16px',
                        minWidth: '280px',
                        zIndex: 1000,
                        border: '1px solid #e5e7eb',
                    }}
                >
                    <div style={{ marginBottom: '8px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                            Reassign Ticket
                        </h4>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>
                            Current: <strong>{currentAssignee || 'Unassigned'}</strong>
                        </p>
                    </div>

                    {error && (
                        <div style={{
                            background: '#fee2e2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            fontSize: '13px',
                        }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{
                            background: '#d1fae5',
                            border: '1px solid #a7f3d0',
                            color: '#065f46',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            fontSize: '13px',
                        }}>
                            {success}
                        </div>
                    )}

                    {fetchingAgents ? (
                        <div style={{ textAlign: 'center', padding: '12px' }}>
                            <p style={{ fontSize: '14px', color: '#6b7280' }}>Loading agents...</p>
                        </div>
                    ) : (
                        <>
                            <select
                                value={selectedAgent}
                                onChange={(e) => setSelectedAgent(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    background: 'white',
                                    marginBottom: '12px',
                                }}
                            >
                                <option value="">Select an agent...</option>
                                {agents.map((agent) => (
                                    <option key={agent.id} value={agent.id}>
                                        {agent.username} {agent.first_name ? `(${agent.first_name} ${agent.last_name || ''})` : ''}
                                    </option>
                                ))}
                            </select>

                            {agents.length === 0 && !fetchingAgents && (
                                <p style={{ fontSize: '12px', color: '#dc2626', marginBottom: '12px' }}>
                                    No agents available. Please add users to the Support_Agent group.
                                </p>
                            )}
                        </>
                    )}

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => setShowDropdown(false)}
                            style={{
                                padding: '6px 12px',
                                background: 'none',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '13px',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReassign}
                            disabled={loading || !selectedAgent || agents.length === 0}
                            style={{
                                padding: '6px 16px',
                                background: loading || !selectedAgent || agents.length === 0 ? '#93c5fd' : '#8b5cf6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: loading || !selectedAgent || agents.length === 0 ? 'not-allowed' : 'pointer',
                                fontSize: '13px',
                            }}
                        >
                            {loading ? 'Reassigning...' : 'Reassign'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketReassign;