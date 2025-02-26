// src/components/Layout.js
import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Button,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    Menu as MenuIcon,
    Logout as LogoutIcon,
    CalendarMonth as CalendarIcon,
    AccountBalance as MoneyIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { text: '일정 관리', icon: <CalendarIcon />, path: '/' },
        { text: '금융 관리', icon: <MoneyIcon />, path: '/expenses' }
    ];

    // 관리자 여부 확인
    const isAdmin = user?.email === 'hosk2014@test.com';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ mr: 2 }}
                        onClick={() => setDrawerOpen(true)}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        작업실 관리
                    </Typography>
                    {user && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon sx={{ mr: 1 }} />
                            <Typography variant="body2" sx={{ mr: 2 }}>
                                {user.name || user.email}
                            </Typography>
                            <Button
                                color="inherit"
                                onClick={handleLogout}
                                startIcon={<LogoutIcon />}
                                size={isMobile ? "small" : "medium"}
                            >
                                {isMobile ? "" : "로그아웃"}
                            </Button>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            {/* 사이드 메뉴 */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            >
                <Box
                    sx={{ width: 250 }}
                    role="presentation"
                    onClick={() => setDrawerOpen(false)}
                >
                    <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                        <Typography variant="h6">작업실 관리</Typography>
                        <Typography variant="body2">{user?.name || user?.email}</Typography>
                    </Box>
                    <List>
                        {menuItems.map((item) => (
                            <ListItem
                                button
                                key={item.text}
                                component={NavLink}
                                to={item.path}
                                sx={{
                                    '&.active': {
                                        bgcolor: 'action.selected',
                                        '& .MuiListItemIcon-root': {
                                            color: 'primary.main',
                                        },
                                        '& .MuiListItemText-primary': {
                                            fontWeight: 'bold',
                                        }
                                    }
                                }}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItem>
                        ))}
                    </List>
                    <Divider />
                    <List>
                        <ListItem button onClick={handleLogout}>
                            <ListItemIcon><LogoutIcon /></ListItemIcon>
                            <ListItemText primary="로그아웃" />
                        </ListItem>
                    </List>
                </Box>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1 }}>
                {children}
            </Box>
        </Box>
    );
};

export default Layout;
