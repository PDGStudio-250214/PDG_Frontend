// src/components/NotificationPermission.js
import React, { useState, useEffect } from 'react';
import { Box, Button, Snackbar, Alert } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { requestNotificationPermission } from '../services/notificationService';

const NotificationPermission = () => {
    const [permission, setPermission] = useState('default');
    const [showBanner, setShowBanner] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    useEffect(() => {
        // 현재 알림 권한 상태 확인
        setPermission(Notification.permission);

        // 처음 방문이거나 아직 권한을 요청하지 않은 경우 배너 표시
        if (Notification.permission === 'default') {
            setShowBanner(true);
        }
    }, []);

    const handleRequestPermission = async () => {
        try {
            const result = await requestNotificationPermission();

            if (result) {
                setPermission('granted');
                setSnackbarMessage('알림이 성공적으로 활성화되었습니다!');
            } else {
                setPermission('denied');
                setSnackbarMessage('알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 변경할 수 있습니다.');
            }

            setSnackbarOpen(true);
            setShowBanner(false);
        } catch (error) {
            console.error('알림 권한 요청 중 오류:', error);
            setSnackbarMessage('알림 설정 중 오류가 발생했습니다.');
            setSnackbarOpen(true);
        }
    };

    if (!showBanner) {
        return null;
    }

    return (
        <>
            <Box
                sx={{
                    p: 2,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: 'primary.light',
                    borderRadius: 1,
                    color: 'white',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationsIcon sx={{ mr: 1 }} />
                    일정 알림을 받아보시겠습니까?
                </Box>
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleRequestPermission}
                >
                    알림 활성화
                </Button>
            </Box>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={permission === 'granted' ? 'success' : 'warning'}
                    variant="filled"
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </>
    );
};

export default NotificationPermission;
