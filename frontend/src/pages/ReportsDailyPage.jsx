import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const ReportsDailyPage = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`/reports/daily/?date=${date}`);
            setReport(response.data);
        } catch (err) {
            setError('Failed to load daily report');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [date]);

    const handleDateChange = (e) => {
        setDate(e.target.value);
    };

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
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Daily Summary Report</h1>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500' }}>Date:</label>
                    <input
                        type="date"
                        value={date}
                        onChange={handleDateChange}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            outline: 'none',
                        }}
                    />
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
                    {/* Summary Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '16px',
                        marginBottom: '24px',
                    }}>
                        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ color: '#6b7280', fontSize: '14px' }}>New Tickets</h3>
                            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{report.new_tickets || 0}</p>
                        </div>
                        <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ color: '#16a34a', fontSize: '14px' }}>Resolved</h3>
                            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{report.resolved_tickets || 0}</p>
                        </div>
                        <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ color: '#2563eb', fontSize: '14px' }}>Open</h3>
                            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
                                {report.open_by_priority?.reduce((sum, p) => sum + p.count, 0) || 0}
                            </p>
                        </div>
                        <div style={{ background: '#fefce8', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ color: '#ca8a04', fontSize: '14px' }}>SLA Compliance</h3>
                            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ca8a04' }}>{report.sla_compliance || 0}%</p>
                        </div>
                    </div>

                    {/* Priority Breakdown */}
                    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Tickets by Priority</h2>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            {report.open_by_priority?.map((item) => (
                                <div key={item.priority} style={{ flex: '1', minWidth: '100px' }}>
                                    <div style={{ fontSize: '14px', textTransform: 'capitalize', color: '#6b7280' }}>{item.priority}</div>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{item.count}</div>
                                    <div style={{
                                        height: '4px',
                                        background: item.priority === 'critical' ? '#dc2626' :
                                                    item.priority === 'high' ? '#f59e0b' :
                                                    item.priority === 'medium' ? '#3b82f6' : '#10b981',
                                        borderRadius: '2px',
                                        width: '100%',
                                        marginTop: '4px',
                                    }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Categories */}
                    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Top Categories</h2>
                        {report.top_categories?.length > 0 ? (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {report.top_categories.map((cat, index) => (
                                    <li key={index} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '8px 0',
                                        borderBottom: '1px solid #f3f4f6',
                                    }}>
                                        <span>{cat.category__name || 'Uncategorized'}</span>
                                        <span style={{ fontWeight: 'bold' }}>{cat.count}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p style={{ color: '#6b7280' }}>No data available</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ReportsDailyPage;