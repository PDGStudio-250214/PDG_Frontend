// src/App.js 수정
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from "./page/Login";
import Calendar from "./page/Calendar";

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

// 인증이 필요한 경로를 위한 컴포넌트
const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return null; // 로딩 중에는 아무것도 표시하지 않음 (AuthProvider에서 처리)
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// 내부 라우트 컴포넌트 - useAuth가 여기서 사용되도록
const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
                <PrivateRoute>
                    <Layout>
                        <Calendar />
                    </Layout>
                </PrivateRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

function App() {
    return (
        <ThemeProvider theme={theme}>
            <AuthProvider>
                <Router>
                    <AppRoutes />
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
