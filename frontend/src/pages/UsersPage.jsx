import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        role: 'User',
        is_active: true,
        is_staff: false,
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users/');
            setUsers(response.data || []);
        } catch (err) {
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAdd = () => {
        setEditingUser(null);
        setFormData({
            username: '',
            email: '',
            first_name: '',
            last_name: '',
            password: '',
            role: 'User',
            is_active: true,
            is_staff: false,
        });
        setShowModal(true);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        // Determine role from user groups or superuser status
        let role = 'User';
        if (user.is_superuser) {
            role = 'Admin';
        } else if (user.groups && user.groups.includes('Support_Agent')) {
            role = 'Agent';
        } else if (user.role) {
            role = user.role;
        }
        
        setFormData({
            username: user.username,
            email: user.email || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            password: '',
            role: role,
            is_active: user.is_active,
            is_staff: user.is_staff,
        });
        setShowModal(true);
    };

    const handleDelete = async (user) => {
        if (window.confirm(`Are you sure you want to delete "${user.username}"?`)) {
            try {
                await api.delete(`/users/${user.id}/`);
                fetchUsers();
            } catch (err) {
                setError('Failed to delete user');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            // ✅ Build payload with role included
            const payload = {
                username: formData.username,
                email: formData.email,
                first_name: formData.first_name,
                last_name: formData.last_name,
                is_active: formData.is_active,
                role: formData.role,  // ✅ Include role in the main payload
            };

            // Only include password for new users or if changed
            if (formData.password) {
                payload.password = formData.password;
            }

            if (editingUser) {
                // ✅ Update user info and role in one request
                await api.put(`/users/${editingUser.id}/`, payload);
            } else {
                // Create new user with role
                await api.post('/users/', payload);
            }
            
            setShowModal(false);
            fetchUsers();
            
        } catch (err) {
            console.error('Error saving user:', err);
            
            // Display detailed error message
            let errorMsg = 'Failed to save user';
            if (err.response?.data?.error) {
                errorMsg = typeof err.response.data.error === 'string' 
                    ? err.response.data.error 
                    : JSON.stringify(err.response.data.error);
            } else if (err.response?.data?.detail) {
                errorMsg = err.response.data.detail;
            } else if (err.message) {
                errorMsg = err.message;
            }
            setError(errorMsg);
        }
    };

    // Helper to get role display
    const getRoleDisplay = (user) => {
        if (user.is_superuser) return 'Admin';
        if (user.groups && user.groups.includes('Support_Agent')) return 'Agent';
        return user.role || 'User';
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>All Users</h1>
                <button
                    onClick={handleAdd}
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
                    + Add User
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

            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f9fafb' }}>
                            <tr>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>ID</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Username</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Email</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Role</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => {
                                    const role = getRoleDisplay(user);
                                    return (
                                        <tr key={user.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>{user.id}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>{user.username}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>{user.email || '-'}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '9999px',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    background: role === 'Admin' ? '#fee2e2' :
                                                              role === 'Agent' ? '#fef3c7' : '#dbeafe',
                                                    color: role === 'Admin' ? '#dc2626' :
                                                           role === 'Agent' ? '#b45309' : '#1d4ed8',
                                                }}>
                                                    {role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '9999px',
                                                    fontSize: '12px',
                                                    background: user.is_active ? '#d1fae5' : '#f3f4f6',
                                                    color: user.is_active ? '#065f46' : '#4b5563',
                                                }}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#2563eb',
                                                        cursor: 'pointer',
                                                        marginRight: '12px',
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#dc2626',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '8px',
                            padding: '24px',
                            maxWidth: '500px',
                            width: '90%',
                            maxHeight: '90vh',
                            overflow: 'auto',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                            {editingUser ? 'Edit User' : 'Add User'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            {/* Username */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Username</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        outline: 'none',
                                    }}
                                />
                            </div>

                            {/* Email */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        outline: 'none',
                                    }}
                                />
                            </div>

                            {/* First & Last Name */}
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>First Name</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Password (only for new users) */}
                            {!editingUser && (
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Password</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingUser}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                            )}

                            {/* Role Dropdown */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
                                    <option value="User">User</option>
                                    <option value="Agent">Agent</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>

                            {/* Active */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                    Active
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'none',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '8px 16px',
                                        background: '#2563eb',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {editingUser ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;