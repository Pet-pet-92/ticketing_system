import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const ReportsWeeklyPage = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/reports/weekly/');
            setReport(response.data);
        } catch (err) {
            setError('Failed to load weekly report');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading report...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Weekly Performance Report</h1>
                <button
                    onClick={fetchReport}
                    style={{
                        padding: '8px 16px',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    Refresh
                </button>
            </div>

            {error && (
                <div style={{
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '12px',
                    borderRadius: '4px',
                    marginBottom: '16px',
                }}>
                    {error}
                </div>
            )}

            {report && (
                <>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '16px',
                        marginBottom: '24px',
                    }}>
                        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ color: '#6b7280', fontSize: '14px' }}>Week</h3>
                            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{report.week_start} - {report.week_end}</p>
                        </div>
                        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ color: '#6b7280', fontSize: '14px' }}>Created</h3>
                            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{report.total_created || 0}</p>
                        </div>
                        <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ color: '#16a34a', fontSize: '14px' }}>Resolved</h3>
                            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{report.total_resolved || 0}</p>
                        </div>
                        <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ color: '#2563eb', fontSize: '14px' }}>SLA Compliance</h3>
                            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>{report.sla_compliance || 0}%</p>
                        </div>
                    </div>

                    {/* Agent Performance */}
                    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Agent Performance</h2>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f9fafb' }}>
                                    <tr>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Agent</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Resolved</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Assigned</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Avg Time</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>SLA %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.agent_performance?.length > 0 ? (
                                        report.agent_performance.map((agent, index) => (
                                            <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                                                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500' }}>{agent.agent}</td>
                                                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{agent.resolved}</td>
                                                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{agent.assigned}</td>
                                                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{agent.avg_resolution_time || '-'}</td>
                                                <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '9999px',
                                                        fontSize: '12px',
                                                        background: agent.sla_compliance >= 90 ? '#d1fae5' :
                                                                  agent.sla_compliance >= 70 ? '#fef3c7' : '#fee2e2',
                                                        color: agent.sla_compliance >= 90 ? '#065f46' :
                                                               agent.sla_compliance >= 70 ? '#b45309' : '#dc2626',
                                                    }}>
                                                        {agent.sla_compliance}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                                                No agent data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ReportsWeeklyPage;