import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            api.get('/auth/user/')
                .then(response => {
                    setUser(response.data);
                })
                .catch(() => {
                    localStorage.removeItem('access_token');
                    delete api.defaults.headers.common['Authorization'];
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login/', { username, password });
            const { access, refresh } = response.data;
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
            
            const userResponse = await api.get('/auth/user/');
            setUser(userResponse.data);
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.detail || 'Login failed. Please check your credentials.' 
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.post('/auth/register/', userData);
            if (response.data.success) {
                // Auto-login after registration
                const loginResult = await login(userData.username, userData.password);
                if (loginResult.success) {
                    return { success: true };
                }
                return { success: false, error: 'Registration successful but auto-login failed. Please log in manually.' };
            }
            return { success: false, error: 'Registration failed' };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.error || 'Registration failed. Please try again.' 
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const value = { user, login, register, logout, loading };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};