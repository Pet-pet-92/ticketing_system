import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const ReportsSLAPage = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/reports/sla/');
            setReport(response.data);
        } catch (err) {
            setError('Failed to load SLA report');
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
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>SLA Compliance Report</h1>
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
                    {/* SLA Summary */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        marginBottom: '24px',
                    }}>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ color: '#6b7280', fontSize: '14px' }}>Total Tickets</h3>
                            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{report.total || 0}</p>
                        </div>
                        <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ color: '#16a34a', fontSize: '14px' }}>SLA Met</h3>
                            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a' }}>{report.met || 0}</p>
                        </div>
                        <div style={{ background: '#fee2e2', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ color: '#dc2626', fontSize: '14px' }}>SLA Breached</h3>
                            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626' }}>{report.breached || 0}</p>
                        </div>
                        <div style={{
                            background: report.compliance >= 90 ? '#f0fdf4' :
                                      report.compliance >= 70 ? '#fefce8' : '#fee2e2',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}>
                            <h3 style={{
                                color: report.compliance >= 90 ? '#16a34a' :
                                       report.compliance >= 70 ? '#ca8a04' : '#dc2626',
                                fontSize: '14px'
                            }}>Compliance Rate</h3>
                            <p style={{
                                fontSize: '28px',
                                fontWeight: 'bold',
                                color: report.compliance >= 90 ? '#16a34a' :
                                       report.compliance >= 70 ? '#ca8a04' : '#dc2626',
                            }}>{report.compliance || 0}%</p>
                        </div>
                    </div>

                    {/* SLA by Priority */}
                    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>SLA by Priority</h2>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f9fafb' }}>
                                    <tr>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Priority</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Total</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Met</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Breached</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Compliance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.by_priority?.length > 0 ? (
                                        report.by_priority.map((item, index) => (
                                            <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                                                <td style={{ padding: '12px 16px', fontSize: '14px', textTransform: 'capitalize', fontWeight: '500' }}>
                                                    {item.priority}
                                                </td>
                                                <td style={{ padding: '12px 16px', fontSize: '14px' }}>{item.total}</td>
                                                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#16a34a' }}>{item.met}</td>
                                                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#dc2626' }}>{item.breached}</td>
                                                <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '9999px',
                                                        fontSize: '12px',
                                                        background: item.compliance >= 90 ? '#d1fae5' :
                                                                  item.compliance >= 70 ? '#fef3c7' : '#fee2e2',
                                                        color: item.compliance >= 90 ? '#065f46' :
                                                               item.compliance >= 70 ? '#b45309' : '#dc2626',
                                                    }}>
                                                        {item.compliance}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                                                No data available
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

export default ReportsSLAPage;