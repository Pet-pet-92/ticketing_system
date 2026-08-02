import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const CreateTicketPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [categories, setCategories] = useState([]);
    const [types, setTypes] = useState([]);
    const [departments, setDepartments] = useState([]);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        type: '',
        department: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [categoriesRes, typesRes, departmentsRes] = await Promise.all([
                    api.get('/categories/'),
                    api.get('/types/'),
                    api.get('/departments/'),
                ]);
                setCategories(categoriesRes.data || []);
                setTypes(typesRes.data || []);
                setDepartments(departmentsRes.data || []);
            } catch (err) {
                setError('Failed to load form data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        // Validation
        if (!formData.title.trim()) {
            setError('Title is required');
            setSubmitting(false);
            return;
        }
        if (!formData.description.trim()) {
            setError('Description is required');
            setSubmitting(false);
            return;
        }
        if (!formData.category) {
            setError('Please select a category');
            setSubmitting(false);
            return;
        }
        if (!formData.type) {
            setError('Please select a type');
            setSubmitting(false);
            return;
        }

        try {
            const payload = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                category: parseInt(formData.category),
                type: parseInt(formData.type),
                department: formData.department ? parseInt(formData.department) : null,
            };

            const response = await api.post('/tickets/', payload);
            
            // Store the new ticket ID to show on dashboard
            const newTicketId = response.data.id;
            localStorage.setItem('new_ticket_id', newTicketId);
            localStorage.setItem('new_ticket_created', 'true');
            
            setSuccess(`Ticket #${newTicketId} created successfully!`);
            
            // Redirect to dashboard after 1.5 seconds
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);

        } catch (err) {
            console.error('Error creating ticket:', err);
            setError(err.response?.data?.detail || 'Failed to create ticket.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading form...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Create New Ticket</h1>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                Fill in the details below to create a new support ticket.
            </p>

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

            {success && (
                <div style={{
                    background: '#d1fae5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    padding: '12px',
                    borderRadius: '4px',
                    marginBottom: '16px',
                }}>
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                {/* Title */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                        Title <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Brief summary of the issue"
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            outline: 'none',
                        }}
                    />
                </div>

                {/* Description */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                        Description <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <textarea
                        name="description"
                        rows="5"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Detailed description of the problem"
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            outline: 'none',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                        }}
                    />
                </div>

                {/* Category */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                        Category <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            outline: 'none',
                            background: 'white',
                        }}
                    >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Type */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                        Type <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            outline: 'none',
                            background: 'white',
                        }}
                    >
                        <option value="">Select a type</option>
                        {types.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Department (Optional) */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                        Department <span style={{ color: '#6b7280', fontSize: '12px' }}>(Optional)</span>
                    </label>
                    <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            outline: 'none',
                            background: 'white',
                        }}
                    >
                        <option value="">Select a department</option>
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                                {dept.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Submit Button */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            padding: '10px 24px',
                            background: submitting ? '#93c5fd' : '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s',
                        }}
                    >
                        {submitting ? 'Creating...' : 'Create Ticket'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        style={{
                            padding: '10px 24px',
                            background: 'none',
                            color: '#6b7280',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateTicketPage;