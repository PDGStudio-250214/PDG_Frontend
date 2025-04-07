// src/components/Layout.js
import React, { useState, useEffect } from 'react';
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
    Badge,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    ListItemSecondaryAction,
    Tooltip
} from '@mui/material';
import {
    Menu as MenuIcon,
    Logout as LogoutIcon,
    CalendarMonth as CalendarIcon,
    AccountBalance as MoneyIcon,
    Person as PersonIcon,
    NotificationsNone as NotificationIcon,
    NotificationsActive as NotificationsActiveIcon,
    Delete as DeleteIcon,
    DoNotDisturbOn as MarkReadIcon,
    Clear as ClearIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import moment from 'moment';
import 'moment/locale/ko';

// 노티피케이션 서비스 임포트
import {
    getNotificationHistory,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    getUnreadCount,
    sendTestNotification,
    subscribeToNotificationUpdates
} from '../services/notificationService';

// 한국어 설정
moment.locale('ko');

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // 알림 관련 상태
    const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

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

    // 사용자 이메일에 따라 프로필 이미지 경로 반환
    const getProfileImage = (email) => {
        if (!email) return null;

        // 이메일에 따라 다른 이미지 반환
        if (email === 'pizza@test.com') return '/pizza.png';
        if (email === '1bfish106@test.com') return '/gayeon.png';
        if (email === 'hosk2014@test.com') return '/hosk.png';

        return null; // 기본값은 null (아바타 사용)
    };

    const avatarColor = getAvatarColor(user?.email);
    const profileImage = getProfileImage(user?.email);

    // 알림 관련 함수들
    // 알림 상태 업데이트 핸들러
    const handleNotificationUpdate = (data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.count);
    };

    // 컴포넌트 마운트 시 알림 업데이트 구독
    useEffect(() => {
        if (user) {
            // 알림 상태 변경 구독
            const unsubscribe = subscribeToNotificationUpdates(handleNotificationUpdate);

            // 알림 리스트 표시 이벤트 리스너 등록
            const handleShowNotificationList = () => {
                if (isMobile) {
                    setNotificationDialogOpen(true);
                } else {
                    setNotificationAnchorEl(document.getElementById('notification-button'));
                }
            };

            window.addEventListener('showNotificationList', handleShowNotificationList);

            return () => {
                // 컴포넌트 언마운트 시 구독 해제
                unsubscribe();
                window.removeEventListener('showNotificationList', handleShowNotificationList);
            };
        }
    }, [user, isMobile]);

    // 알림 아이콘 클릭 핸들러
    const handleNotificationClick = (event) => {
        setNotificationAnchorEl(event.currentTarget);
    };

    // 알림 메뉴 닫기 핸들러
    const handleNotificationClose = () => {
        setNotificationAnchorEl(null);
    };

    // 알림 클릭 핸들러 (읽음 표시)
    const handleNotificationItemClick = (notificationId) => {
        markNotificationAsRead(notificationId);
    };

    // 알림 삭제 핸들러
    const handleDeleteNotification = (event, notificationId) => {
        event.stopPropagation();
        deleteNotification(notificationId);
    };

    // 모든 알림 읽음 표시 핸들러
    const handleMarkAllAsRead = () => {
        markAllNotificationsAsRead();
        if (isMobile) {
            setNotificationDialogOpen(false);
        } else {
            setNotificationAnchorEl(null);
        }
    };

    // 모든 알림 삭제 확인 다이얼로그 표시
    const handleConfirmClearAll = () => {
        setConfirmDialogOpen(true);
    };

    // 모든 알림 삭제 확인
    const handleClearAll = () => {
        clearAllNotifications();
        setConfirmDialogOpen(false);
        if (isMobile) {
            setNotificationDialogOpen(false);
        } else {
            setNotificationAnchorEl(null);
        }
    };

    // 알림 시간 표시 형식
    const formatTime = (timestamp) => {
        const now = moment();
        const notifTime = moment(timestamp);

        // 오늘이면 시간만 표시
        if (now.isSame(notifTime, 'day')) {
            return notifTime.format('HH:mm');
        }
        // 같은 주면 요일 표시
        else if (now.diff(notifTime, 'days') < 7) {
            return notifTime.format('ddd HH:mm');
        }
        // 이외에는 날짜 표시
        else {
            return notifTime.format('MM/DD HH:mm');
        }
    };

    const notificationOpen = Boolean(notificationAnchorEl);

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
                    </Box>

                    {user && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {/* 알림 아이콘 */}
                            <IconButton
                                id="notification-button"
                                color="inherit"
                                onClick={handleNotificationClick}
                                aria-controls={notificationOpen ? 'notification-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={notificationOpen ? 'true' : undefined}
                            >
                                <Badge badgeContent={unreadCount} color="error">
                                    {unreadCount > 0 ? <NotificationsActiveIcon /> : <NotificationIcon />}
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
                                {profileImage ? (
                                    <Avatar
                                        src={profileImage}
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                ) : (
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
                                )}
                                {!isMobile && (
                                    <Typography
                                        variant="body2"
                                        sx={{ ml: 1, fontWeight: 'medium' }}
                                    >
                                        {user.name || user.email}
                                    </Typography>
                                )}
                            </Box>

                            {/* 사용자 메뉴 */}
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

                            {/* 알림 메뉴 */}
                            <Menu
                                id="notification-menu"
                                anchorEl={notificationAnchorEl}
                                open={notificationOpen}
                                onClose={handleNotificationClose}
                                PaperProps={{
                                    elevation: 3,
                                    sx: {
                                        maxHeight: 400,
                                        width: 320,
                                        borderRadius: 2,
                                        overflow: 'visible',
                                        mt: 1.5
                                    }
                                }}
                            >
                                <Box sx={{ p: 2, bgcolor: '#1976d2', color: 'white' }}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>알림</Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                        <Button
                                            size="small"
                                            color="inherit"
                                            onClick={handleMarkAllAsRead}
                                            startIcon={<MarkReadIcon fontSize="small" />}
                                            variant="outlined"
                                            sx={{ borderColor: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}
                                        >
                                            모두 읽음
                                        </Button>
                                        <Button
                                            size="small"
                                            color="inherit"
                                            onClick={handleConfirmClearAll}
                                            startIcon={<DeleteIcon fontSize="small" />}
                                            variant="outlined"
                                            sx={{ borderColor: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}
                                        >
                                            모두 삭제
                                        </Button>
                                    </Box>
                                </Box>

                                <List sx={{ py: 0 }}>
                                    {notifications.length === 0 ? (
                                        <Box sx={{ p: 2, textAlign: 'center' }}>
                                            <InfoIcon color="disabled" sx={{ mb: 1 }} />
                                            <Typography variant="body2" color="text.secondary">
                                                알림이 없습니다
                                            </Typography>
                                        </Box>
                                    ) : (
                                        notifications.map(notification => (
                                            <ListItem
                                                key={notification.id}
                                                onClick={() => handleNotificationItemClick(notification.id)}
                                                sx={{
                                                    borderBottom: '1px solid #f0f0f0',
                                                    bgcolor: notification.read ? 'transparent' : 'rgba(33, 150, 243, 0.08)',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(0, 0, 0, 0.04)'
                                                    },
                                                    py: 1
                                                }}
                                            >
                                                <Box sx={{ width: '100%' }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                        <Typography variant="subtitle2" fontWeight={notification.read ? 'normal' : 'bold'}>
                                                            {notification.title}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formatTime(notification.timestamp)}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary" sx={{
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {notification.message}
                                                    </Typography>
                                                </Box>
                                                <ListItemSecondaryAction>
                                                    <IconButton
                                                        edge="end"
                                                        size="small"
                                                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                                                    >
                                                        <ClearIcon fontSize="small" />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        ))
                                    )}
                                </List>
                            </Menu>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: '0 8px 8px 0',
                        boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
                        width: 240
                    }
                }}
            >
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                    {profileImage ? (
                        <Avatar
                            src={profileImage}
                            sx={{
                                width: 40,
                                height: 40,
                                mr: 2,
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                    ) : (
                        <Avatar
                            sx={{
                                width: 40,
                                height: 40,
                                mr: 2,
                                bgcolor: avatarColor,
                                fontWeight: 'bold',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            {getInitials(user?.name || user?.email || '')}
                        </Avatar>
                    )}
                    <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                            {user?.name || ''}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {user?.email || ''}
                        </Typography>
                    </Box>
                </Box>

                <List component="nav" sx={{ p: 1 }}>
                    {menuItems.map((item, index) => (
                        <ListItem
                            key={index}
                            component={NavLink}
                            to={item.path}
                            sx={{
                                color: 'inherit',
                                textDecoration: 'none',
                                borderRadius: 2,
                                mb: 0.5,
                                '&.active': {
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    '& .MuiListItemIcon-root': {
                                        color: 'white'
                                    }
                                },
                                '&:hover:not(.active)': {
                                    bgcolor: 'rgba(0, 0, 0, 0.04)'
                                }
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItem>
                    ))}
                </List>

                <Box sx={{ mt: 'auto', p: 2 }}>
                    <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        startIcon={<LogoutIcon />}
                        onClick={handleLogout}
                    >
                        로그아웃
                    </Button>
                </Box>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                {children}
            </Box>

            {isMobile && (
                <Paper
                    elevation={3}
                    square
                    sx={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1000
                    }}
                >
                    <BottomNavigation
                        value={getNavValue()}
                        onChange={handleNavigationChange}
                        showLabels
                    >
                        <BottomNavigationAction label="일정" icon={<CalendarIcon />} />
                        <BottomNavigationAction label="금융" icon={<MoneyIcon />} />
                    </BottomNavigation>
                </Paper>
            )}

            {/* 모바일 알림 다이얼로그 */}
            <Dialog
                open={notificationDialogOpen}
                onClose={() => setNotificationDialogOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle sx={{
                    bgcolor: '#1976d2',
                    color: 'white',
                    p: 2,
                    pb: 3
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">알림</Typography>
                        <IconButton size="small" color="inherit" onClick={() => setNotificationDialogOpen(false)}>
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Button
                            size="small"
                            color="inherit"
                            onClick={handleMarkAllAsRead}
                            startIcon={<MarkReadIcon fontSize="small" />}
                            variant="outlined"
                            sx={{ borderColor: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}
                        >
                            모두 읽음
                        </Button>
                        <Button
                            size="small"
                            color="inherit"
                            onClick={handleConfirmClearAll}
                            startIcon={<DeleteIcon fontSize="small" />}
                            variant="outlined"
                            sx={{ borderColor: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}
                        >
                            모두 삭제
                        </Button>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <List sx={{ p: 0 }}>
                        {notifications.length === 0 ? (
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                <InfoIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
                                <Typography variant="body1" color="text.secondary">
                                    알림이 없습니다
                                </Typography>
                            </Box>
                        ) : (
                            notifications.map(notification => (
                                <ListItem
                                    key={notification.id}
                                    onClick={() => handleNotificationItemClick(notification.id)}
                                    sx={{
                                        borderBottom: '1px solid #f0f0f0',
                                        bgcolor: notification.read ? 'transparent' : 'rgba(33, 150, 243, 0.08)',
                                        py: 1.5
                                    }}
                                >
                                    <Box sx={{ width: '100%' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="subtitle1" fontWeight={notification.read ? 'normal' : 'bold'}>
                                                {notification.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {formatTime(notification.timestamp)}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {notification.message}
                                        </Typography>
                                    </Box>
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            onClick={(e) => handleDeleteNotification(e, notification.id)}
                                        >
                                            <ClearIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNotificationDialogOpen(false)}>닫기</Button>
                </DialogActions>
            </Dialog>

            {/* 모든 알림 삭제 확인 다이얼로그 */}
            <Dialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
            >
                <DialogTitle>알림 삭제</DialogTitle>
                <DialogContent>
                    <Typography>모든 알림을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)}>취소</Button>
                    <Button onClick={handleClearAll} color="error" variant="contained">
                        삭제
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Layout;
