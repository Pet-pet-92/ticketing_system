import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import api from '../api/axios';

const ReportsPage = () => {
    const [reportType, setReportType] = useState('performance');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dateRange, setDateRange] = useState({
        start_date: '',
        end_date: '',
    });
    const [singleDate, setSingleDate] = useState('');

    const reportTypes = [
        { value: 'performance', label: '📊 Performance Report' },
        { value: 'sla', label: '⏱️ SLA Compliance' },
        { value: 'workload', label: '👨‍💻 Agent Workload' },
        { value: 'departments', label: '🏢 Department Report' },
    ];

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            let endpoint = '';
            let params = new URLSearchParams();

            // Build endpoint based on report type
            switch (reportType) {
                case 'performance':
                    endpoint = '/reports/weekly/';
                    break;
                case 'sla':
                    endpoint = '/reports/sla/';
                    break;
                case 'workload':
                    endpoint = '/reports/workload/';
                    break;
                case 'departments':
                    endpoint = '/reports/departments/';
                    break;
                default:
                    endpoint = '/reports/weekly/';
            }

            // Add date parameters if provided
            if (singleDate) {
                params.append('date', singleDate);
            }
            if (dateRange.start_date) {
                params.append('start_date', dateRange.start_date);
            }
            if (dateRange.end_date) {
                params.append('end_date', dateRange.end_date);
            }

            const url = `${endpoint}?${params.toString()}`;
            const response = await api.get(url);
            setReportData(response.data);
        } catch (err) {
            setError('Failed to load report data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [reportType]);

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        if (name === 'single_date') {
            setSingleDate(value);
            setDateRange({ start_date: '', end_date: '' });
        } else {
            setDateRange({ ...dateRange, [name]: value });
        }
    };

    const handleApplyDates = () => {
        fetchReport();
    };

    const clearDates = () => {
        setSingleDate('');
        setDateRange({ start_date: '', end_date: '' });
        setTimeout(fetchReport, 100);
    };

    // ============================================
    // EXCEL EXPORT FUNCTION
    // ============================================
    const exportToExcel = () => {
        if (!reportData) return;

        let exportData = [];
        let sheetName = 'Report';

        switch (reportType) {
            case 'performance':
                exportData = reportData.agent_performance?.map((agent) => ({
                    'Agent': agent.agent,
                    'Resolved': agent.resolved,
                    'Assigned': agent.assigned,
                    'Avg Resolution Time': agent.avg_resolution_time || '-',
                    'SLA Compliance %': agent.sla_compliance || 0,
                    'Tickets Handled': agent.tickets_handled || 0,
                })) || [];
                sheetName = 'Performance';
                break;

            case 'sla':
                const summary = {
                    'Total Tickets': reportData.total || 0,
                    'SLA Met': reportData.met || 0,
                    'SLA Breached': reportData.breached || 0,
                    'Compliance %': reportData.compliance || 0,
                };
                exportData = [summary];
                const priorityData = reportData.by_priority?.map((p) => ({
                    'Priority': p.priority,
                    'Total': p.total,
                    'Met': p.met,
                    'Breached': p.breached,
                    'Compliance %': p.compliance,
                })) || [];
                exportData = exportData.concat(priorityData);
                sheetName = 'SLA Compliance';
                break;

            case 'workload':
                exportData = reportData.workload_summary?.map((agent) => ({
                    'Agent': agent.agent,
                    'Status': agent.status || 'unknown',
                    'Open Tickets': agent.open_tickets,
                    'In Progress': agent.in_progress,
                    'Resolved Today': agent.resolved_today,
                    'SLA Breaches': agent.sla_breaches || 0,
                })) || [];
                sheetName = 'Workload';
                break;

            case 'departments':
                exportData = reportData.departments?.map((dept) => ({
                    'Department': dept.name || 'Uncategorized',
                    'Total Tickets': dept.total || 0,
                    'Open': dept.open || 0,
                    'In Progress': dept.in_progress || 0,
                    'Resolved': dept.resolved || 0,
                    'Closed': dept.closed || 0,
                })) || [];
                sheetName = 'Departments';
                break;

            default:
                exportData = [];
        }

        if (exportData.length === 0) {
            alert('No data to export');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // ============================================
    // RENDER FUNCTIONS FOR EACH REPORT
    // ============================================
    const renderPerformanceTable = () => {
        if (!reportData?.agent_performance) return null;

        return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb' }}>
                    <tr>
                        <th style={thStyle}>Agent</th>
                        <th style={thStyle}>Resolved</th>
                        <th style={thStyle}>Assigned</th>
                        <th style={thStyle}>Avg Resolution Time</th>
                        <th style={thStyle}>SLA Compliance %</th>
                        <th style={thStyle}>Tickets Handled</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.agent_performance.map((agent, idx) => (
                        <tr key={idx} style={idx % 2 === 0 ? rowEvenStyle : rowOddStyle}>
                            <td style={tdStyle}><strong>{agent.agent}</strong></td>
                            <td style={tdStyle}>{agent.resolved}</td>
                            <td style={tdStyle}>{agent.assigned}</td>
                            <td style={tdStyle}>{agent.avg_resolution_time || '-'}</td>
                            <td style={tdStyle}>
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    background: agent.sla_compliance >= 90 ? '#d1fae5' :
                                              agent.sla_compliance >= 70 ? '#fef3c7' : '#fee2e2',
                                    color: agent.sla_compliance >= 90 ? '#065f46' :
                                           agent.sla_compliance >= 70 ? '#b45309' : '#dc2626',
                                }}>
                                    {agent.sla_compliance}%
                                </span>
                            </td>
                            <td style={tdStyle}>{agent.tickets_handled}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    const renderSLATable = () => {
        if (!reportData) return null;

        return (
            <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h4 style={{ color: '#6b7280', fontSize: '14px' }}>Total Tickets</h4>
                        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{reportData.total || 0}</p>
                    </div>
                    <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h4 style={{ color: '#16a34a', fontSize: '14px' }}>SLA Met</h4>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{reportData.met || 0}</p>
                    </div>
                    <div style={{ background: '#fee2e2', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h4 style={{ color: '#dc2626', fontSize: '14px' }}>SLA Breached</h4>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{reportData.breached || 0}</p>
                    </div>
                    <div style={{
                        background: reportData.compliance >= 90 ? '#f0fdf4' : '#fefce8',
                        padding: '16px',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}>
                        <h4 style={{ color: reportData.compliance >= 90 ? '#16a34a' : '#ca8a04', fontSize: '14px' }}>Compliance Rate</h4>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: reportData.compliance >= 90 ? '#16a34a' : '#ca8a04' }}>
                            {reportData.compliance || 0}%
                        </p>
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f9fafb' }}>
                        <tr>
                            <th style={thStyle}>Priority</th>
                            <th style={thStyle}>Total</th>
                            <th style={thStyle}>Met</th>
                            <th style={thStyle}>Breached</th>
                            <th style={thStyle}>Compliance %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.by_priority?.map((item, idx) => (
                            <tr key={idx} style={idx % 2 === 0 ? rowEvenStyle : rowOddStyle}>
                                <td style={tdStyle}><strong>{item.priority}</strong></td>
                                <td style={tdStyle}>{item.total}</td>
                                <td style={tdStyle} style={{ ...tdStyle, color: '#16a34a' }}>{item.met}</td>
                                <td style={tdStyle} style={{ ...tdStyle, color: '#dc2626' }}>{item.breached}</td>
                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        background: item.compliance >= 90 ? '#d1fae5' :
                                                  item.compliance >= 70 ? '#fef3c7' : '#fee2e2',
                                        color: item.compliance >= 90 ? '#065f46' :
                                               item.compliance >= 70 ? '#b45309' : '#dc2626',
                                    }}>
                                        {item.compliance}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
        );
    };

    const renderWorkloadTable = () => {
        if (!reportData?.workload_summary) return null;

        return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb' }}>
                    <tr>
                        <th style={thStyle}>Agent</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Open Tickets</th>
                        <th style={thStyle}>In Progress</th>
                        <th style={thStyle}>Resolved Today</th>
                        <th style={thStyle}>SLA Breaches</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.workload_summary.map((agent, idx) => (
                        <tr key={idx} style={idx % 2 === 0 ? rowEvenStyle : rowOddStyle}>
                            <td style={tdStyle}><strong>{agent.agent}</strong></td>
                            <td style={tdStyle}>
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '9999px',
                                    fontSize: '12px',
                                    background: agent.status === 'available' ? '#d1fae5' :
                                              agent.status === 'busy' ? '#fef3c7' : '#f3f4f6',
                                    color: agent.status === 'available' ? '#065f46' :
                                           agent.status === 'busy' ? '#b45309' : '#4b5563',
                                }}>
                                    {agent.status}
                                </span>
                            </td>
                            <td style={tdStyle}><strong>{agent.open_tickets}</strong></td>
                            <td style={tdStyle}>{agent.in_progress}</td>
                            <td style={tdStyle}>{agent.resolved_today}</td>
                            <td style={tdStyle}>
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    background: agent.sla_breaches > 0 ? '#fee2e2' : '#d1fae5',
                                    color: agent.sla_breaches > 0 ? '#dc2626' : '#065f46',
                                }}>
                                    {agent.sla_breaches || 0}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    const renderDepartmentTable = () => {
        if (!reportData?.departments) return null;

        return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb' }}>
                    <tr>
                        <th style={thStyle}>Department</th>
                        <th style={thStyle}>Total Tickets</th>
                        <th style={thStyle}>Open</th>
                        <th style={thStyle}>In Progress</th>
                        <th style={thStyle}>Resolved</th>
                        <th style={thStyle}>Closed</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.departments.map((dept, idx) => (
                        <tr key={idx} style={idx % 2 === 0 ? rowEvenStyle : rowOddStyle}>
                            <td style={tdStyle}><strong>{dept.name || 'Uncategorized'}</strong></td>
                            <td style={tdStyle}><strong>{dept.total || 0}</strong></td>
                            <td style={tdStyle}>{dept.open || 0}</td>
                            <td style={tdStyle}>{dept.in_progress || 0}</td>
                            <td style={tdStyle}>{dept.resolved || 0}</td>
                            <td style={tdStyle}>{dept.closed || 0}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    // ============================================
    // STYLES
    // ============================================
    const thStyle = {
        padding: '12px 16px',
        textAlign: 'left',
        fontSize: '12px',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        borderBottom: '2px solid #e5e7eb',
    };

    const tdStyle = {
        padding: '12px 16px',
        fontSize: '14px',
        borderBottom: '1px solid #e5e7eb',
    };

    const rowEvenStyle = { background: 'white' };
    const rowOddStyle = { background: '#f9fafb' };

    // ============================================
    // MAIN RENDER
    // ============================================
    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                📊 Reports Dashboard
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                Select a report type and filter by date to view detailed analytics.
            </p>

            {/* Filters */}
            <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: '24px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                alignItems: 'end',
            }}>
                {/* Report Type Dropdown */}
                <div style={{ flex: '1', minWidth: '200px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                        Report Type
                    </label>
                    <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            outline: 'none',
                            background: 'white',
                        }}
                    >
                        {reportTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Single Date */}
                <div>
                    <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                        Single Date
                    </label>
                    <input
                        type="date"
                        name="single_date"
                        value={singleDate}
                        onChange={handleDateChange}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            outline: 'none',
                        }}
                    />
                </div>

                {/* Date Range */}
                <div>
                    <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                        From
                    </label>
                    <input
                        type="date"
                        name="start_date"
                        value={dateRange.start_date}
                        onChange={handleDateChange}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            outline: 'none',
                        }}
                    />
                </div>

                <div>
                    <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                        To
                    </label>
                    <input
                        type="date"
                        name="end_date"
                        value={dateRange.end_date}
                        onChange={handleDateChange}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            outline: 'none',
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={handleApplyDates}
                        style={{
                            padding: '8px 16px',
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                        }}
                    >
                        Apply Filters
                    </button>
                    <button
                        onClick={clearDates}
                        style={{
                            padding: '8px 16px',
                            background: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#4b5563',
                        }}
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Report Content */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Loading report...</p>
                </div>
            ) : error ? (
                <div style={{
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '16px',
                    borderRadius: '4px',
                    textAlign: 'center',
                }}>
                    {error}
                </div>
            ) : reportData ? (
                <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    {/* Report Header with Export */}
                    <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                    }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600' }}>
                            {reportTypes.find(t => t.value === reportType)?.label}
                        </h2>
                        <button
                            onClick={exportToExcel}
                            style={{
                                padding: '8px 16px',
                                background: '#16a34a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            📥 Export to Excel
                        </button>
                    </div>

                    {/* Report Table */}
                    <div style={{ overflowX: 'auto', padding: '16px' }}>
                        {reportType === 'performance' && renderPerformanceTable()}
                        {reportType === 'sla' && renderSLATable()}
                        {reportType === 'workload' && renderWorkloadTable()}
                        {reportType === 'departments' && renderDepartmentTable()}
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No data available. Please select a report type.
                </div>
            )}
        </div>
    );
};

export default ReportsPage;