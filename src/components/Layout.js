// src/components/Layout.js
import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        일정 관리
                    </Typography>
                    {user && (
                        <>
                            <Typography sx={{ mr: 2 }}>{user.email}</Typography>
                            <Button color="inherit" onClick={handleLogout}>로그아웃</Button>
                        </>
                    )}
                </Toolbar>
            </AppBar>

            <Box sx={{ flexGrow: 1 }}>
                {children}
            </Box>
        </Box>
    );
};

export default Layout;
