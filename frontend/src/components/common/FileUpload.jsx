import React, { useRef, useState } from 'react';

const FileUpload = ({ onFilesSelected, multiple = false, accept = 'image/*,.pdf,.doc,.docx,.txt,.zip' }) => {
    const fileInputRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [dragActive, setDragActive] = useState(false);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        handleFiles(selectedFiles);
    };

    const handleFiles = (selectedFiles) => {
        const validFiles = selectedFiles.filter(file => file.size <= 10 * 1024 * 1024);
        if (validFiles.length !== selectedFiles.length) {
            alert('Some files exceed the 10MB limit and were skipped.');
        }
        setFiles(prev => [...prev, ...validFiles]);
        if (onFilesSelected) {
            onFilesSelected(validFiles);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        // Update parent
        const remainingFiles = files.filter((_, i) => i !== index);
        if (onFilesSelected) {
            onFilesSelected(remainingFiles);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        handleFiles(droppedFiles);
    };

    // Get file icon based on type
    const getFileIcon = (file) => {
        const type = file.type;
        if (type.startsWith('image/')) return '🖼️';
        if (type === 'application/pdf') return '📄';
        if (type.includes('word') || type.includes('doc')) return '📝';
        if (type.includes('text')) return '📃';
        return '📎';
    };

    return (
        <div style={{ marginBottom: '12px' }}>
            {/* Upload Area */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${dragActive ? '#2563eb' : '#d1d5db'}`,
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragActive ? '#eff6ff' : '#f9fafb',
                    transition: 'all 0.2s',
                }}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple={multiple}
                    accept={accept}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                    Drag & drop files here, or click to select
                </p>
                <p style={{ color: '#9ca3af', fontSize: '12px' }}>
                    Max 10MB per file • Images, PDFs, Documents
                </p>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                    {files.map((file, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 12px',
                                background: '#f3f4f6',
                                borderRadius: '4px',
                                marginBottom: '4px',
                            }}
                        >
                            <span style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {getFileIcon(file)} {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                            <button
                                onClick={() => removeFile(index)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#dc2626',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileUpload;