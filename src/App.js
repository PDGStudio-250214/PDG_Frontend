// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import 'moment/locale/ko';
import Login from "./page/Login";
import Calendar from "./page/Calendar";
import ExpenseManager from "./page/ExpenseManager";

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

// 내부 라우트 컴포넌트
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
            <Route path="/expenses" element={
                <PrivateRoute>
                    <Layout>
                        <ExpenseManager />
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
            <LocalizationProvider dateAdapter={AdapterMoment}>
                <AuthProvider>
                    <Router>
                        <AppRoutes />
                    </Router>
                </AuthProvider>
            </LocalizationProvider>
        </ThemeProvider>
    );
}

export default App;
