// src/components/NotificationList.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Badge,
    IconButton,
    Menu,
    MenuItem,
    Typography,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useMediaQuery,
    useTheme,
    Tooltip
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    NotificationsActive as NotificationsActiveIcon,
    Delete as DeleteIcon,
    DoNotDisturbOn as MarkReadIcon,
    Clear as ClearIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/ko';

import {
    getNotificationHistory,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    getUnreadCount
} from '../services/notificationService';

// 한국어 설정
moment.locale('ko');

const NotificationList = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [mobileDialogOpen, setMobileDialogOpen] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // 알림 목록 로드
    const loadNotifications = () => {
        const history = getNotificationHistory();
        setNotifications(history);
        setUnreadCount(getUnreadCount());
    };

    // 컴포넌트 마운트 시 알림 목록 로드
    useEffect(() => {
        loadNotifications();

        // 알림 리스트 표시 이벤트 리스너 등록
        const handleShowNotificationList = () => {
            if (isMobile) {
                setMobileDialogOpen(true);
            } else {
                setAnchorEl(document.getElementById('notification-button'));
            }
            loadNotifications();
        };

        window.addEventListener('showNotificationList', handleShowNotificationList);

        // 정기적으로 알림 목록 업데이트 (1분마다)
        const interval = setInterval(loadNotifications, 60000);

        return () => {
            window.removeEventListener('showNotificationList', handleShowNotificationList);
            clearInterval(interval);
        };
    }, [isMobile]);

    // 알림 아이콘 클릭 핸들러
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
        // 알림 목록이 열릴 때 목록 새로고침
        loadNotifications();
    };

    // 알림 메뉴 닫기 핸들러
    const handleClose = () => {
        setAnchorEl(null);
    };

    // 모바일 다이얼로그 닫기 핸들러
    const handleMobileDialogClose = () => {
        setMobileDialogOpen(false);
    };

    // 알림 클릭 핸들러 (읽음 표시)
    const handleNotificationClick = (notificationId) => {
        markNotificationAsRead(notificationId);
        loadNotifications();
    };

    // 알림 삭제 핸들러
    const handleDeleteNotification = (event, notificationId) => {
        event.stopPropagation();
        deleteNotification(notificationId);
        loadNotifications();
    };

    // 모든 알림 읽음 표시 핸들러
    const handleMarkAllAsRead = () => {
        markAllNotificationsAsRead();
        loadNotifications();
        if (isMobile) {
            setMobileDialogOpen(false);
        } else {
            setAnchorEl(null);
        }
    };

    // 모든 알림 삭제 확인 다이얼로그 표시
    const handleConfirmClearAll = () => {
        setConfirmDialogOpen(true);
    };

    // 모든 알림 삭제 확인
    const handleClearAll = () => {
        clearAllNotifications();
        loadNotifications();
        setConfirmDialogOpen(false);
        if (isMobile) {
            setMobileDialogOpen(false);
        } else {
            setAnchorEl(null);
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

    const open = Boolean(anchorEl);

    // 데스크톱 버전 메뉴
    const renderDesktopMenu = () => (
        <Menu
            id="notification-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            PaperProps={{
                elevation: 3,
                sx: {
                    maxHeight: 400,
                    width: 320,
                    mt: 1.5,
                    borderRadius: 2,
                    overflow: 'hidden',
                    '& .MuiList-root': {
                        padding: 0
                    }
                }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
            <Box sx={{
                p: 2,
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Typography variant="h6">알림</Typography>
                <Box>
                    <Tooltip title="모두 읽음 표시">
                        <IconButton size="small" color="inherit" onClick={handleMarkAllAsRead}>
                            <MarkReadIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="모두 삭제">
                        <IconButton size="small" color="inherit" onClick={handleConfirmClearAll}>
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {notifications.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <InfoIcon color="disabled" sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                    <Typography color="text.secondary">알림이 없습니다</Typography>
                </Box>
            ) : (
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {notifications.map((notification) => (
                        <ListItem
                            key={notification.id}
                            button
                            onClick={() => handleNotificationClick(notification.id)}
                            sx={{
                                bgcolor: notification.read ? 'inherit' : 'action.hover',
                                borderLeft: notification.read ? 'none' : `4px solid ${theme.palette.primary.main}`,
                                pl: notification.read ? 2 : 1.5,
                                '&:hover': {
                                    bgcolor: 'action.selected'
                                }
                            }}
                        >
                            <ListItemText
                                primary={notification.title}
                                secondary={
                                    <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{notification.body}</span>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                ml: 1,
                                                minWidth: '60px',
                                                textAlign: 'right',
                                                color: 'text.secondary'
                                            }}
                                        >
                                            {formatTime(notification.timestamp)}
                                        </Typography>
                                    </Box>
                                }
                                primaryTypographyProps={{
                                    variant: 'subtitle2',
                                    color: notification.read ? 'text.primary' : 'primary.main',
                                    fontWeight: notification.read ? 'normal' : 'medium',
                                    noWrap: true
                                }}
                                secondaryTypographyProps={{
                                    noWrap: true,
                                    component: 'div'
                                }}
                            />
                            <ListItemSecondaryAction>
                                <IconButton
                                    edge="end"
                                    size="small"
                                    onClick={(e) => handleDeleteNotification(e, notification.id)}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            )}
        </Menu>
    );

    // 모바일 버전 다이얼로그
    const renderMobileDialog = () => (
        <Dialog
            fullScreen={isMobile}
            open={mobileDialogOpen}
            onClose={handleMobileDialogClose}
            PaperProps={{
                sx: isMobile ? {} : {
                    maxWidth: 400,
                    maxHeight: '80vh',
                    width: '100%',
                    borderRadius: 2
                }
            }}
        >
            <DialogTitle sx={{
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2
            }}>
                <Typography variant="h6">알림</Typography>
                <Box>
                    <Tooltip title="모두 읽음 표시">
                        <IconButton size="small" color="inherit" onClick={handleMarkAllAsRead}>
                            <MarkReadIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="모두 삭제">
                        <IconButton size="small" color="inherit" onClick={handleConfirmClearAll}>
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="닫기">
                        <IconButton size="small" color="inherit" onClick={handleMobileDialogClose}>
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                {notifications.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <InfoIcon color="disabled" sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                        <Typography color="text.secondary">알림이 없습니다</Typography>
                    </Box>
                ) : (
                    <List>
                        {notifications.map((notification) => (
                            <ListItem
                                key={notification.id}
                                button
                                onClick={() => handleNotificationClick(notification.id)}
                                sx={{
                                    bgcolor: notification.read ? 'inherit' : 'action.hover',
                                    borderLeft: notification.read ? 'none' : `4px solid ${theme.palette.primary.main}`,
                                    pl: notification.read ? 2 : 1.5,
                                    '&:hover': {
                                        bgcolor: 'action.selected'
                                    }
                                }}
                            >
                                <ListItemText
                                    primary={notification.title}
                                    secondary={
                                        <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{notification.body}</span>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    ml: 1,
                                                    minWidth: '60px',
                                                    textAlign: 'right',
                                                    color: 'text.secondary'
                                                }}
                                            >
                                                {formatTime(notification.timestamp)}
                                            </Typography>
                                        </Box>
                                    }
                                    primaryTypographyProps={{
                                        variant: 'subtitle2',
                                        color: notification.read ? 'text.primary' : 'primary.main',
                                        fontWeight: notification.read ? 'normal' : 'medium'
                                    }}
                                    secondaryTypographyProps={{
                                        component: 'div'
                                    }}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>
            {isMobile && (
                <DialogActions>
                    <Button onClick={handleMobileDialogClose}>닫기</Button>
                </DialogActions>
            )}
        </Dialog>
    );

    return (
        <>
            <IconButton
                id="notification-button"
                color="inherit"
                onClick={handleClick}
                aria-controls={open ? 'notification-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
            >
                <Badge badgeContent={unreadCount} color="error">
                    {unreadCount > 0 ? <NotificationsActiveIcon /> : <NotificationsIcon />}
                </Badge>
            </IconButton>

            {/* 데스크톱 메뉴 */}
            {renderDesktopMenu()}

            {/* 모바일 다이얼로그 */}
            {renderMobileDialog()}

            {/* 모든 알림 삭제 확인 다이얼로그 */}
            <Dialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
            >
                <DialogTitle>알림 삭제</DialogTitle>
                <DialogContent>
                    <Typography>모든 알림을 삭제하시겠습니까?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)}>취소</Button>
                    <Button onClick={handleClearAll} color="error">삭제</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default NotificationList;
