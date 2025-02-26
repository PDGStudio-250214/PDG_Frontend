// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CircularProgress, Box } from '@mui/material';
import api from '../api/config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 자동 로그인 처리
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // API 기본 헤더에 토큰 설정
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    // 자동 로그인 요청
                    const response = await api.post('/auth/auto-login');

                    console.log('Auto-login response:', response.data);

                    if (response.data && response.data.success) {
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

    // 로그인 함수
    const login = async (loginData) => {
        try {
            const response = await api.post('/auth/login', loginData);

            if (response.data && response.data.success) {
                const { user, access_token } = response.data;

                // 사용자 정보 저장
                setUser(user);

                // 토큰 저장
                localStorage.setItem('token', access_token);

                // API 기본 헤더에 토큰 설정
                api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    // 로그아웃 함수
    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
    };

    // 로딩 화면
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
        <AuthContext.Provider value={{ user, login, logout, loading }}>
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
