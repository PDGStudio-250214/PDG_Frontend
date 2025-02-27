// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyB3awcs2gx9YWpSZ597H2J1OhTO3eXJTew",
    authDomain: "schedule-app-notifications.firebaseapp.com",
    projectId: "schedule-app-notifications",
    storageBucket: "schedule-app-notifications.firebasestorage.app",
    messagingSenderId: "308198270982",
    appId: "1:308198270982:web:4fe21a985683c40cf63b87"
});

const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage((payload) => {
    console.log('백그라운드 메시지 수신:', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo192.png' // React 프로젝트의 기본 아이콘 사용
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
