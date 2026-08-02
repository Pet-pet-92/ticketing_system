import React, { useState } from 'react';

const DataTable = ({
    title,
    data,
    columns,
    onAdd,
    onEdit,
    onDelete,
    loading,
    error,
    addButtonText = 'Add New',
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = data.filter((item) =>
        columns.some((col) =>
            String(item[col.key])
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>{title}</h1>
                {onAdd && (
                    <button
                        onClick={onAdd}
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
                        + {addButtonText}
                    </button>
                )}
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

            {/* Search Bar */}
            <div style={{ marginBottom: '16px' }}>
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        maxWidth: '300px',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px',
                        outline: 'none',
                    }}
                />
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f9fafb' }}>
                            <tr>
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        style={{
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            color: '#6b7280',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                                <th
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'right',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        color: '#6b7280',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length + 1} style={{ padding: '24px', textAlign: 'center' }}>
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + 1} style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                                        No items found
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item, index) => (
                                    <tr
                                        key={item.id || index}
                                        style={{
                                            borderTop: '1px solid #e5e7eb',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f9fafb';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        {columns.map((col) => (
                                            <td key={col.key} style={{ padding: '12px 16px', fontSize: '14px' }}>
                                                {col.render ? col.render(item) : item[col.key]}
                                            </td>
                                        ))}
                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(item)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#2563eb',
                                                        cursor: 'pointer',
                                                        marginRight: '12px',
                                                        fontSize: '14px',
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => onDelete(item)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#dc2626',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DataTable;