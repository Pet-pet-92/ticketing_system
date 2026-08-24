import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import FileUpload from '../common/FileUpload';

const TicketComments = ({ ticketId }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [commentAttachments, setCommentAttachments] = useState([]);
    const [error, setError] = useState('');

    const fetchComments = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/tickets/${ticketId}/comments/`);
            setComments(response.data || []);
        } catch (err) {
            setError('Failed to load comments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (ticketId) {
            fetchComments();
        }
    }, [ticketId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() && commentAttachments.length === 0) return;

        setSubmitting(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('comment', newComment.trim());
            commentAttachments.forEach((file) => {
                formData.append('attachments', file);
            });

            await api.post(`/tickets/${ticketId}/add_comment/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setNewComment('');
            setCommentAttachments([]);
            fetchComments();
        } catch (err) {
            setError('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    const isAgent = user?.groups?.includes('Support_Agent') || user?.is_staff;

    const renderAttachments = (attachments) => {
        if (!attachments || attachments.length === 0) return null;
        return (
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {attachments.map((att) => (
                    <a
                        key={att.id}
                        href={att.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            background: '#f3f4f6',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#2563eb',
                            textDecoration: 'none',
                        }}
                    >
                        📄 {att.filename} ({att.size_display || `${(att.file_size / 1024).toFixed(1)} KB`})
                    </a>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ padding: '16px', textAlign: 'center' }}>
                <p>Loading comments...</p>
            </div>
        );
    }

    return (
        <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Comments ({comments.length})
            </h3>

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

            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '16px' }}>
                {comments.length === 0 ? (
                    <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
                        No comments yet. Be the first to comment!
                    </p>
                ) : (
                    comments.map((comment) => {
                        const isOwnComment = comment.user === user?.username;
                        const isAgentComment = comment.user && user?.groups?.includes('Support_Agent');
                        return (
                            <div
                                key={comment.id}
                                style={{
                                    padding: '12px 16px',
                                    marginBottom: '8px',
                                    borderRadius: '8px',
                                    background: isAgentComment ? '#eff6ff' : '#f9fafb',
                                    borderLeft: isAgentComment ? '4px solid #2563eb' : '4px solid #9ca3af',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: '600', fontSize: '14px' }}>
                                            {comment.user}
                                        </span>
                                        {isAgentComment && (
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '9999px',
                                                fontSize: '10px',
                                                background: '#2563eb',
                                                color: 'white',
                                            }}>
                                                Agent
                                            </span>
                                        )}
                                        {isOwnComment && (
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '9999px',
                                                fontSize: '10px',
                                                background: '#f3f4f6',
                                                color: '#4b5563',
                                            }}>
                                                You
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                        {new Date(comment.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <p style={{ marginTop: '4px', fontSize: '14px', color: '#1f2937' }}>
                                    {comment.comment}
                                </p>
                                {renderAttachments(comment.attachments)}
                            </div>
                        );
                    })
                )}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        style={{
                            flex: 1,
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            outline: 'none',
                        }}
                        disabled={submitting}
                    />
                    <button
                        type="submit"
                        disabled={submitting || (!newComment.trim() && commentAttachments.length === 0)}
                        style={{
                            padding: '10px 20px',
                            background: submitting || (!newComment.trim() && commentAttachments.length === 0) ? '#93c5fd' : '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: submitting || (!newComment.trim() && commentAttachments.length === 0) ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {submitting ? 'Sending...' : 'Send'}
                    </button>
                </div>
                <FileUpload
                    onFilesSelected={setCommentAttachments}
                    multiple={true}
                    accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                />
            </form>
        </div>
    );
};

export default TicketComments;