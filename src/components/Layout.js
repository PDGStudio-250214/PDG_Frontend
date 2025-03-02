// src/components/Layout.js
import React, { useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
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
    useTheme,
    BottomNavigation,
    BottomNavigationAction,
    Paper,
    Avatar,
    Menu,
    MenuItem,
    Badge
} from '@mui/material';
import {
    Menu as MenuIcon,
    Logout as LogoutIcon,
    CalendarMonth as CalendarIcon,
    AccountBalance as MoneyIcon,
    Person as PersonIcon,
    NotificationsNone as NotificationIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // 현재 경로에 따른 네비게이션 값 설정
    const getNavValue = () => {
        if (location.pathname === '/') return 0;
        if (location.pathname === '/expenses') return 1;
        return 0;
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const menuItems = [
        { text: '일정 관리', icon: <CalendarIcon />, path: '/' },
        { text: '금융 관리', icon: <MoneyIcon />, path: '/expenses' }
    ];

    // 관리자 여부 확인
    const isAdmin = user?.email === 'hosk2014@test.com';

    const handleNavigationChange = (event, newValue) => {
        const path = ["/", "/expenses"][newValue];
        navigate(path);
    };

    // 유저 이름의 첫 글자로 아바타 생성
    const getInitials = (name) => {
        if (!name) return '';
        return name.charAt(0).toUpperCase();
    };

    // 유저 아바타 색상 결정
    const getAvatarColor = (email) => {
        const colors = [
            '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
            '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
            '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
            '#FF5722'
        ];

        if (!email) return colors[0];

        // 이메일에서 간단한 해시 값 생성
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
            hash = (hash << 5) - hash + email.charCodeAt(i);
            hash |= 0; // 32비트 정수로 변환
        }

        // 색상 배열의 인덱스로 변환
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    const avatarColor = getAvatarColor(user?.email);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar
                position="static"
                elevation={0}
                sx={{
                    background: 'linear-gradient(120deg, #2196F3 0%, #3f51b5 100%)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}
            >
                <Toolbar>
                    {!isMobile && (
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
                    )}

                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexGrow: 1
                    }}>
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{
                                fontWeight: 'bold',
                                letterSpacing: '0.5px',
                                textShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            PDGStudio
                        </Typography>

                        {!isMobile && (
                            <Box sx={{ ml: 3, display: 'flex', gap: 1 }}>
                                {menuItems.map((item) => (
                                    <Button
                                        key={item.text}
                                        component={NavLink}
                                        to={item.path}
                                        color="inherit"
                                        startIcon={item.icon}
                                        sx={{
                                            fontWeight: 'medium',
                                            textTransform: 'none',
                                            opacity: 0.9,
                                            '&.active': {
                                                opacity: 1,
                                                fontWeight: 'bold',
                                                bgcolor: 'rgba(255, 255, 255, 0.15)',
                                                borderRadius: 1
                                            },
                                            '&:hover': {
                                                bgcolor: 'rgba(255, 255, 255, 0.1)'
                                            }
                                        }}
                                    >
                                        {item.text}
                                    </Button>
                                ))}
                            </Box>
                        )}
                    </Box>

                    {user && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton color="inherit">
                                <Badge badgeContent={0} color="error">
                                    <NotificationIcon />
                                </Badge>
                            </IconButton>

                            <Box
                                onClick={handleMenuOpen}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    ml: 1.5,
                                    cursor: 'pointer',
                                    p: 0.5,
                                    borderRadius: 2,
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 255, 255, 0.1)'
                                    }
                                }}
                            >
                                <Avatar
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        bgcolor: avatarColor,
                                        fontWeight: 'bold',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                                    }}
                                >
                                    {getInitials(user.name || user.email)}
                                </Avatar>
                                {!isMobile && (
                                    <Typography
                                        variant="body2"
                                        sx={{ ml: 1, fontWeight: 'medium' }}
                                    >
                                        {user.name || user.email}
                                    </Typography>
                                )}
                            </Box>

                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                                elevation={3}
                                PaperProps={{
                                    sx: {
                                        mt: 1.5,
                                        borderRadius: 2,
                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                                    }
                                }}
                            >
                                <MenuItem
                                    disabled
                                    sx={{
                                        opacity: 1,
                                        color: 'text.primary',
                                        fontWeight: 'medium',
                                        py: 1.5
                                    }}
                                >
                                    <ListItemIcon>
                                        <PersonIcon fontSize="small" />
                                    </ListItemIcon>
                                    {user.name || user.email}
                                </MenuItem>
                                <Divider />
                                <MenuItem
                                    onClick={handleLogout}
                                    sx={{ py: 1.5 }}
                                >
                                    <ListItemIcon>
                                        <LogoutIcon fontSize="small" color="error" />
                                    </ListItemIcon>
                                    <Typography color="error.main">로그아웃</Typography>
                                </MenuItem>
                            </Menu>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            {/* 사이드 메뉴 (데스크톱) */}
            {!isMobile && (
                <Drawer
                    anchor="left"
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    PaperProps={{
                        sx: {
                            width: 280,
                            borderRadius: '0 16px 16px 0',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                        }
                    }}
                >
                    <Box
                        sx={{ width: 280 }}
                        role="presentation"
                        onClick={() => setDrawerOpen(false)}
                    >
                        <Box sx={{
                            p: 3,
                            bgcolor: 'primary.main',
                            color: 'white',
                            background: 'linear-gradient(120deg, #2196F3 0%, #3f51b5 100%)',
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                                작업실 관리
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                <Avatar sx={{ bgcolor: avatarColor, width: 48, height: 48 }}>
                                    {getInitials(user?.name || user?.email)}
                                </Avatar>
                                <Box sx={{ ml: 2 }}>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                        {user?.name || "사용자"}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        {user?.email}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <List sx={{ pt: 2 }}>
                            {menuItems.map((item) => (
                                <ListItem
                                    key={item.text}
                                    component={NavLink}
                                    to={item.path}
                                    sx={{
                                        py: 1.5,
                                        '&.active': {
                                            bgcolor: 'primary.lighter',
                                            borderLeft: '4px solid',
                                            borderColor: 'primary.main',
                                            '& .MuiListItemIcon-root': {
                                                color: 'primary.main',
                                                ml: '-4px' // 왼쪽 경계선 보정
                                            },
                                            '& .MuiListItemText-primary': {
                                                fontWeight: 'bold',
                                                color: 'primary.main'
                                            }
                                        }
                                    }}
                                >
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItem>
                            ))}
                        </List>
                        <Divider sx={{ mt: 2 }} />
                        <List>
                            <ListItem
                                button
                                onClick={handleLogout}
                                sx={{
                                    py: 1.5,
                                    color: 'error.main',
                                    '&:hover': {
                                        bgcolor: 'error.lighter'
                                    }
                                }}
                            >
                                <ListItemIcon>
                                    <LogoutIcon color="error" />
                                </ListItemIcon>
                                // src/components/Layout.js (이어서)
                                <ListItemText
                                    primary="로그아웃"
                                    primaryTypographyProps={{
                                        color: 'error.main',
                                        fontWeight: 'medium'
                                    }}
                                />
                            </ListItem>
                        </List>
                    </Box>
                </Drawer>
            )}

            <Box component="main" sx={{
                flexGrow: 1,
                pb: isMobile ? 7 : 0, // 모바일에서는 하단 네비게이션을 위한 패딩 추가
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto',
                bgcolor: '#f5f7fa' // 배경색 추가
            }}>
                {children}
            </Box>

            {/* 모바일 하단 탭 네비게이션 */}
            {isMobile && (
                <Paper
                    sx={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
                        borderRadius: '12px 12px 0 0'
                    }}
                    elevation={3}
                >
                    <BottomNavigation
                        value={getNavValue()}
                        onChange={handleNavigationChange}
                        showLabels
                        sx={{
                            height: 60,
                            '& .MuiBottomNavigationAction-root': {
                                py: 1,
                                minWidth: 0,
                                maxWidth: 'none'
                            },
                            '& .Mui-selected': {
                                color: 'primary.main',
                                fontWeight: 'bold'
                            }
                        }}
                    >
                        <BottomNavigationAction
                            label="캘린더"
                            icon={<CalendarIcon />}
                            sx={{
                                '&.Mui-selected': {
                                    color: 'primary.main'
                                }
                            }}
                        />
                        <BottomNavigationAction
                            label="금융"
                            icon={<MoneyIcon />}
                            sx={{
                                '&.Mui-selected': {
                                    color: 'primary.main'
                                }
                            }}
                        />
                    </BottomNavigation>
                </Paper>
            )}
        </Box>
    );
};

export default Layout;
