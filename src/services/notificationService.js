// src/services/notificationService.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase 구성 정보
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// 사용자에게 알림 권한 요청 및 토큰 획득
export const requestNotificationPermission = async () => {
    try {
        // 브라우저 알림 권한 요청
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            // 토큰 획득
            const token = await getToken(messaging, {
                vapidKey: 'YOUR_VAPID_KEY'
            });

            console.log('알림 토큰:', token);

            // 토큰을 백엔드에 저장
            await saveTokenToServer(token);

            return token;
        } else {
            console.log('알림 권한이 거부되었습니다.');
            return null;
        }
    } catch (error) {
        console.error('알림 권한 요청 중 오류 발생:', error);
        return null;
    }
};

// 토큰을 백엔드에 저장
const saveTokenToServer = async (token) => {
    try {
        const authToken = localStorage.getItem('token');
        await fetch('/api/notifications/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ token })
        });
    } catch (error) {
        console.error('토큰 저장 중 오류 발생:', error);
    }
};

// 포그라운드 메시지 처리
export const setupNotificationListener = () => {
    onMessage(messaging, (payload) => {
        console.log('포그라운드 메시지 수신:', payload);

        // 브라우저 알림 표시
        if (Notification.permission === 'granted') {
            const { title, body } = payload.notification;
            const notification = new Notification(title, {
                body,
                icon: '/path/to/icon.png'
            });

            // 알림 클릭 처리
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    });
};

export default { requestNotificationPermission, setupNotificationListener };
