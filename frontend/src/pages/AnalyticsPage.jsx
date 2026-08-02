import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import api from '../api/axios';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

const AnalyticsPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const [timeRange, setTimeRange] = useState('7');

    const fetchAnalytics = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`/analytics/?days=${timeRange}`);
            setAnalytics(response.data);
        } catch (err) {
            setError('Failed to load analytics data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    // ============================================
    // CHART CONFIGURATIONS
    // ============================================

    // Priority Chart
    const priorityData = {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [
            {
                label: 'Tickets by Priority',
                data: analytics?.priority_data || [0, 0, 0, 0],
                backgroundColor: ['#dc2626', '#f59e0b', '#3b82f6', '#10b981'],
                borderRadius: 4,
            },
        ],
    };

    const priorityOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Tickets by Priority',
                font: { size: 16, weight: 'bold' },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                },
            },
        },
    };

    // Status Chart (Pie)
    const statusData = {
        labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
        datasets: [
            {
                label: 'Tickets by Status',
                data: analytics?.status_data || [0, 0, 0, 0],
                backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#6b7280'],
                borderWidth: 2,
                borderColor: '#fff',
            },
        ],
    };

    const statusOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
            },
            title: {
                display: true,
                text: 'Tickets by Status',
                font: { size: 16, weight: 'bold' },
            },
        },
    };

    // Category Chart
    const categoryData = {
        labels: analytics?.category_labels || [],
        datasets: [
            {
                label: 'Tickets by Category',
                data: analytics?.category_data || [],
                backgroundColor: [
                    '#dc2626', '#f59e0b', '#3b82f6', '#10b981',
                    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
                ],
                borderRadius: 4,
            },
        ],
    };

    const categoryOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Tickets by Category',
                font: { size: 16, weight: 'bold' },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                },
            },
        },
    };

    // Trend Chart (Line)
    const trendData = {
        labels: analytics?.trend_labels || [],
        datasets: [
            {
                label: 'Tickets Created',
                data: analytics?.trend_data || [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
            },
            {
                label: 'Tickets Resolved',
                data: analytics?.trend_resolved || [],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
            },
        ],
    };

    const trendOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Ticket Trend (Created vs Resolved)',
                font: { size: 16, weight: 'bold' },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                },
            },
        },
    };

    // SLA Compliance (Doughnut)
    const slaData = {
        labels: ['SLA Met', 'SLA Breached'],
        datasets: [
            {
                data: [
                    analytics?.sla_met || 0,
                    analytics?.sla_breached || 0,
                ],
                backgroundColor: ['#10b981', '#dc2626'],
                borderWidth: 2,
                borderColor: '#fff',
            },
        ],
    };

    const slaOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
            },
            title: {
                display: true,
                text: `SLA Compliance: ${analytics?.sla_compliance || 0}%`,
                font: { size: 16, weight: 'bold' },
            },
        },
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading analytics...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Analytics Dashboard</h1>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500' }}>Time Range:</label>
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            outline: 'none',
                            background: 'white',
                        }}
                    >
                        <option value="7">Last 7 days</option>
                        <option value="14">Last 14 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                    </select>
                    <button
                        onClick={fetchAnalytics}
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

            {analytics && (
                <>
                    {/* Stats Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '16px',
                        marginBottom: '24px',
                    }}>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ color: '#6b7280', fontSize: '14px' }}>Total Tickets</h3>
                            <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{analytics.total_tickets}</p>
                        </div>
                        <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ color: '#2563eb', fontSize: '14px' }}>Open</h3>
                            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb' }}>{analytics.open_tickets}</p>
                        </div>
                        <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ color: '#16a34a', fontSize: '14px' }}>Resolved</h3>
                            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a' }}>{analytics.resolved_tickets}</p>
                        </div>
                        <div style={{ background: '#fefce8', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ color: '#ca8a04', fontSize: '14px' }}>SLA Compliance</h3>
                            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#ca8a04' }}>{analytics.sla_compliance}%</p>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                        gap: '24px',
                    }}>
                        {/* Priority Chart */}
                        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <Bar data={priorityData} options={priorityOptions} />
                        </div>

                        {/* Status Chart */}
                        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <Pie data={statusData} options={statusOptions} />
                        </div>

                        {/* Category Chart */}
                        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <Bar data={categoryData} options={categoryOptions} />
                        </div>

                        {/* SLA Compliance */}
                        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <Doughnut data={slaData} options={slaOptions} />
                        </div>
                    </div>

                    {/* Trend Chart (Full Width) */}
                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        marginTop: '24px',
                    }}>
                        <Line data={trendData} options={trendOptions} />
                    </div>
                </>
            )}
        </div>
    );
};

export default AnalyticsPage;