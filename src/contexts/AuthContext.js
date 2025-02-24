// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CircularProgress, Box } from '@mui/material';
import api from '../api/config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // src/contexts/AuthContext.js - useEffect 부분 수정
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            console.log('Initializing auth, token exists:', !!token);

            if (token) {
                try {
                    // API 기본 헤더에 토큰 설정
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    const response = await api.post('/auth/auto-login', null, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    console.log('Auto-login response:', response.data);

                    if (response.data.success) {
                        setUser(response.data.user);
                        console.log('User authenticated:', response.data.user);
                    } else {
                        console.log('Auto-login failed, clearing token');
                        localStorage.removeItem('token');
                        delete api.defaults.headers.common['Authorization'];
                    }
                } catch (error) {
                    console.error('Auto login error:', error.response?.data || error.message);
                    localStorage.removeItem('token');
                    delete api.defaults.headers.common['Authorization'];
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (data) => {
        try {
            setUser(data.user);
            // 토큰을 명시적으로 저장
            if (data.access_token) {
                localStorage.setItem('token', data.access_token);
                // API 인스턴스의 기본 헤더에 토큰 설정
                api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
            }
            return true;
        } catch (error) {
            console.error('Login error:', error);
            throw new Error('로그인 처리 중 오류가 발생했습니다.');
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
    };

    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
