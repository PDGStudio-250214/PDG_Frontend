// src/services/notificationService.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import moment from 'moment';
import 'moment/locale/ko';

// 한국어 설정
moment.locale('ko');

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyDOZrC4AVi4gt69PmgzinsdfxkcnENWtoc",
    authDomain: "schedule-app-notifications.firebaseapp.com",
    projectId: "schedule-app-notifications",
    storageBucket: "schedule-app-notifications.firebasestorage.app",
    messagingSenderId: "308198270982",
    appId: "1:308198270982:web:4fe21a985683c40cf63b87"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// 로컬호스트 확인 함수
const isLocalhost = () =>
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

// 메시징 객체
let messaging = null;

try {
    // 프로덕션 환경에서만 Firebase 메시징 초기화
    if (!isLocalhost()) {
        messaging = getMessaging(app);
    }
} catch (error) {
    console.error('Firebase 메시징 초기화 실패:', error);
}

// 로컬 스토리지에서 알림 관리 (데모/개발용)
const NOTIFICATION_STORAGE_KEY = 'pdgstudio_notifications';

// 초기 알림 데이터 로드 또는 생성
const getInitialNotifications = () => {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);

    if (stored) {
        return JSON.parse(stored);
    }

    // 초기 데이터 생성
    const initialData = {
        notifications: [],
        lastUpdate: new Date().toISOString()
    };

    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
};

// 알림 데이터 저장
const saveNotifications = (data) => {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify({
        ...data,
        lastUpdate: new Date().toISOString()
    }));

    // 구독자들에게 변경 알림
    notifySubscribers(data);
};

// 구독자 관리
let subscribers = [];

// 알림 상태 변경 구독
export const subscribeToNotificationUpdates = (callback) => {
    // 초기 데이터 로드
    const initialData = getInitialNotifications();
    const unreadCount = countUnreadNotifications(initialData.notifications);

    // 초기 데이터로 콜백 호출
    callback({
        notifications: initialData.notifications,
        count: unreadCount
    });

    // 구독자 추가
    subscribers.push(callback);

    // 구독 해제 함수 반환
    return () => {
        subscribers = subscribers.filter(sub => sub !== callback);
    };
};

// 구독자들에게 변경 알림
const notifySubscribers = (data) => {
    const unreadCount = countUnreadNotifications(data.notifications);

    // 모든 구독자에게 알림
    subscribers.forEach(callback => {
        callback({
            notifications: data.notifications,
            count: unreadCount
        });
    });
};

// 읽지 않은 알림 개수 계산
const countUnreadNotifications = (notifications) => {
    return notifications.filter(notification => !notification.read).length;
};

// 알림 기록 가져오기
export const getNotificationHistory = () => {
    const data = getInitialNotifications();
    return data.notifications;
};

// 읽지 않은 알림 개수 가져오기
export const getUnreadCount = () => {
    const data = getInitialNotifications();
    return countUnreadNotifications(data.notifications);
};

// 사용자에게 알림 권한 요청 및 토큰 획득
export const requestNotificationPermission = async () => {
    try {
        // 로컬 개발 환경에서는 가상 토큰 사용
        if (isLocalhost()) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                return 'local-dev-notification-token';
            } else {
                console.log('알림 권한이 거부되었습니다.');
                return null;
            }
        }

        // 프로덕션 환경: Firebase 사용
        if (!messaging) {
            console.log('FCM 메시징이 초기화되지 않았습니다');
            return null;
        }

        // 브라우저 알림 권한 요청
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            // 토큰 획득
            const token = await getToken(messaging, {
                vapidKey: 'BFpjJGYrOgszJlUiL6AYjj36h_3bNXJmqDIuv6MHO6xt0RSriIz2ph74GkAYQcljh8t77rfHlTQMtp7Pw4N5feA'
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

        // 로컬 개발 환경에서는 API 호출 생략
        if (isLocalhost()) {
            console.log('로컬 개발 환경: 토큰 서버 저장 생략', token);
            return;
        }

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
    // 로컬 개발 환경에서는 리스너 설정 생략
    if (isLocalhost()) {
        console.log('로컬 개발 환경: 알림 리스너 설정됨 (가상)');

        // 이미 알림 리스너가 설정되어 있는지 확인
        if (!window.notificationListenerInitialized) {
            // 로컬에서 자동 알림 시작
            setupAutomaticNotifications();

            // 리스너 초기화 표시
            window.notificationListenerInitialized = true;
        } else {
            console.log('알림 리스너가 이미 초기화되어 있습니다. 중복 설정 방지');
        }

        return;
    }

    if (!messaging) return;

    // 이미 FCM 리스너가 설정되어 있는지 확인
    if (window.fcmListenerInitialized) {
        console.log('FCM 리스너가 이미 초기화되어 있습니다. 중복 설정 방지');
        return;
    }

    onMessage(messaging, (payload) => {
        console.log('포그라운드 메시지 수신:', payload);

        // 브라우저 알림 표시
        if (Notification.permission === 'granted') {
            const { title, body } = payload.notification;

            // 새 알림 생성 및 저장
            addNotification(title, body);

            // 브라우저 알림 표시
            const notification = new Notification(title, {
                body,
                icon: '/pdgicon.png'
            });

            // 알림 클릭 처리
            notification.onclick = () => {
                window.focus();

                // 알림 목록 열기 이벤트 발생
                window.dispatchEvent(new Event('showNotificationList'));

                notification.close();
            };
        }
    });

    // FCM 리스너 초기화 표시
    window.fcmListenerInitialized = true;

    // 자동 알림 설정
    setupAutomaticNotifications();
};

// 자동 알림 설정 (세 가지 종류의 알림)
export const setupAutomaticNotifications = () => {
    // 이미 설정된 타이머가 있다면 제거
    if (window.notificationTimers) {
        window.notificationTimers.forEach(timer => clearInterval(timer));
    }

    // 전역 타이머 배열이 없으면 생성
    if (!window.notificationTimers) {
        window.notificationTimers = [];
    }

    // 이미 설정된 알림이 있는지 확인 (새로고침 방지)
    if (window.notificationsInitialized) {
        console.log('알림이 이미 초기화되어 있습니다. 중복 설정 방지');
        return;
    }

    // 1. 쓰레기 버리는 날 알림 (화/목/일 오후 4시)
    setTrashDayNotification();

    // 2. 월세 납부일 알림 (매월 23일)
    setRentDayNotification();

    // 3. 모두 출근 알림 (일정 확인 기반)
    setAllMembersWorkingNotification();

    // 알림 초기화 표시
    window.notificationsInitialized = true;

    console.log('자동 알림이 설정되었습니다.');
};

// 1. 쓰레기 버리는 날 알림 설정 (화/목/일 오후 4시)
const setTrashDayNotification = () => {
    // 지난 체크 시간을 확인
    const lastTrashCheck = localStorage.getItem('last_trash_check');

    // 매 분마다 확인
    const timer = setInterval(() => {
        const now = moment();
        const currentTimeStr = now.format('YYYY-MM-DD HH:mm');

        // 이미 같은 분에 체크했다면 스킵
        if (lastTrashCheck === currentTimeStr) {
            return;
        }

        // 현재 시간 저장
        localStorage.setItem('last_trash_check', currentTimeStr);

        const dayOfWeek = now.day(); // 0: 일, 1: 월, 2: 화, 3: 수, 4: 목, 5: 금, 6: 토
        const hour = now.hour();
        const minute = now.minute();

        // 화요일(2), 목요일(4), 일요일(0)의 오후 4시(16:00)에 알림
        if ((dayOfWeek === 0 || dayOfWeek === 2 || dayOfWeek === 4) && hour === 16 && minute === 0) {
            // 오늘 날짜로 알림 기록 확인
            const today = now.format('YYYY-MM-DD');
            const trashNotificationKey = `trash_notification_${today}`;
            const alreadySent = localStorage.getItem(trashNotificationKey);

            if (!alreadySent) {
                sendNotification(
                    '쓰레기 버리는 날입니다',
                    '오늘은 쓰레기를 버리는날입니다 작업실에 계시면 버려주세요 (ゝω･)ﾉ'
                );

                // 알림 보냈음을 로컬 스토리지에 기록
                localStorage.setItem(trashNotificationKey, new Date().toISOString());
            }
        }
    }, 60 * 1000); // 1분마다 확인

    window.notificationTimers.push(timer);
};

// 2. 월세 납부일 알림 설정 (매월 23일)
const setRentDayNotification = () => {
    // 지난 체크 시간을 확인
    const lastRentCheck = localStorage.getItem('last_rent_check');

    // 매 분마다 확인
    const timer = setInterval(() => {
        const now = moment();
        const currentTimeStr = now.format('YYYY-MM-DD HH:mm');

        // 이미 같은 분에 체크했다면 스킵
        if (lastRentCheck === currentTimeStr) {
            return;
        }

        // 현재 시간 저장
        localStorage.setItem('last_rent_check', currentTimeStr);

        const day = now.date(); // 일자
        const hour = now.hour();
        const minute = now.minute();
        const month = now.format('YYYY-MM');

        // 매월 23일 오전 10시에 알림
        if (day === 23 && hour === 10 && minute === 0) {
            // 이번 달 23일 알림 기록 확인
            const rentNotificationKey = `rent_notification_${month}`;
            const alreadySent = localStorage.getItem(rentNotificationKey);

            if (!alreadySent) {
                sendNotification(
                    '월세 납부일입니다',
                    '월세를 내는 날입니다 부탁해요 돌린씌|⩊･)ﾉ⁾⁾'
                );

                // 알림 보냈음을 로컬 스토리지에 기록
                localStorage.setItem(rentNotificationKey, new Date().toISOString());
            }
        }

        // 월세 납부 3일 전에도 미리 알림 (매월 20일)
        if (day === 20 && hour === 10 && minute === 0) {
            // 이번 달 20일 알림 기록 확인
            const reminderNotificationKey = `rent_reminder_notification_${month}`;
            const alreadySent = localStorage.getItem(reminderNotificationKey);

            if (!alreadySent) {
                sendNotification(
                    '월세 납부일이 다가옵니다',
                    '월세 납부일(23일)이 3일 남았습니다'
                );

                // 3일 전 알림 보냈음을 로컬 스토리지에 기록
                localStorage.setItem(reminderNotificationKey, new Date().toISOString());
            }
        }
    }, 60 * 1000); // 1분마다 확인

    window.notificationTimers.push(timer);
};

// 3. 모두 출근 알림 설정 (일정 확인 기반, 이 부분은 이벤트가 발생할 때 호출됨)
const setAllMembersWorkingNotification = () => {
    // 백엔드 연계 필요 - 일정 데이터가 변경될 때마다 체크
    // 이 예시에서는 일정 체크 함수만 정의하고, 실제 호출은 일정 데이터 업데이트 시점에 해야 함

    // 페이지 로드 시 한 번만 체크 (타이머 설정하지 않음)
    // 실제 일정 업데이트 이벤트에서만 체크하도록 수정
    setTimeout(() => {
        checkForAllMembersScheduled();
    }, 2000); // 페이지 로드 후 2초 후에 한 번만 체크
};

// 일정 데이터 확인하여 모두 출근하는 날 체크
export const checkForAllMembersScheduled = async () => {
    try {
        // 이미 오늘 체크했는지 확인
        const todayCheck = localStorage.getItem('all_members_check_today');
        const today = moment().format('YYYY-MM-DD');

        if (todayCheck === today) {
            console.log('오늘 이미 모두 출근 날짜를 확인했습니다. 중복 체크 방지');
            return;
        }

        // 오늘 날짜 체크 기록
        localStorage.setItem('all_members_check_today', today);

        // 1. 오늘부터 2주 이내의 일정 가져오기 (백엔드 API 호출)
        const schedules = await fetchSchedules();

        if (!schedules || !schedules.length) return;

        // 2. 날짜별로 일정 그룹화
        const schedulesByDate = groupSchedulesByDate(schedules);

        // 3. 모든 멤버(3명)가 같은 날에 일정이 있는지 확인
        const allMembersDates = findDatesWithAllMembers(schedulesByDate);

        // 4. 발견된 날짜에 대해 알림 (아직 알림을 보내지 않은 날짜만)
        // 첫 번째 날짜에 대해서만 알림 전송 (한 번만 전송)
        if (allMembersDates.length > 0) {
            const nextDate = allMembersDates[0]; // 가장 가까운 날짜

            // 로컬 스토리지에서 이미 알림을 보냈는지 확인
            const allMembersNotificationKey = `all_members_notification_${nextDate}`;
            const alreadySent = localStorage.getItem(allMembersNotificationKey);

            if (!alreadySent) {
                sendNotification(
                    'PDG 모두 출근하는 날',
                    'PDG가 모두 작업실인 날입니다ヽ(•̀ω•́ )ゝ'
                );

                // 로컬 스토리지에 알림 전송 기록 저장
                localStorage.setItem(allMembersNotificationKey, new Date().toISOString());
            } else {
                console.log('이미 알림을 보낸 날짜입니다:', nextDate);
            }
        }
    } catch (error) {
        console.error('일정 확인 중 오류:', error);
    }
};

// 일정 데이터 가져오기 (백엔드 API 호출)
const fetchSchedules = async () => {
    // 실제 구현에서는 API 호출로 대체
    // 여기서는 예시로 로컬 스토리지에서 가져오는 형태로 구현

    try {
        const token = localStorage.getItem('token');
        if (!token) return [];

        // 로컬 환경에서는 로컬 스토리지의 가짜 데이터 사용
        if (isLocalhost()) {
            const fakeSchedules = localStorage.getItem('pdg_schedules');
            if (fakeSchedules) {
                return JSON.parse(fakeSchedules);
            }
            return [];
        }

        // 실제 환경에서는 API 호출
        const response = await fetch('/api/schedules?all=true', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('일정 조회 실패');
        }

        const data = await response.json();
        return data.schedules || [];
    } catch (error) {
        console.error('일정 데이터 가져오기 오류:', error);
        return [];
    }
};

// 날짜별 일정 그룹화
const groupSchedulesByDate = (schedules) => {
    const result = {};

    schedules.forEach(schedule => {
        const startDate = moment(schedule.startDate || schedule.start).format('YYYY-MM-DD');

        if (!result[startDate]) {
            result[startDate] = [];
        }

        result[startDate].push(schedule);
    });

    return result;
};

// 모든 멤버가 같은 날에 일정이 있는 날짜 찾기
const findDatesWithAllMembers = (schedulesByDate) => {
    const result = [];
    const memberEmails = ['pizza@test.com', '1bfish106@test.com', 'hosk2014@test.com'];

    Object.entries(schedulesByDate).forEach(([date, schedules]) => {
        // 해당 날짜의 일정에 포함된 사용자 이메일 추출
        const userEmails = schedules.map(s =>
            s.user?.email || s.userEmail || ''
        );

        // 중복 제거
        const uniqueEmails = [...new Set(userEmails)];

        // 모든 멤버의 이메일이 포함되어 있는지 확인
        const allMembersIncluded = memberEmails.every(email =>
            uniqueEmails.includes(email)
        );

        if (allMembersIncluded) {
            result.push(date);
        }
    });

    return result;
};

// 이미 알림을 보냈는지 확인
const checkIfAlreadyNotified = (notificationType, date) => {
    const notifiedHistory = localStorage.getItem('pdg_notification_history');

    if (!notifiedHistory) return false;

    const history = JSON.parse(notifiedHistory);

    // 오늘 날짜를 기준으로 확인 (같은 유형의 알림은 하루에 한 번만)
    const today = moment().format('YYYY-MM-DD');

    if (notificationType === 'trash_day') {
        return history[`${notificationType}_${today}`] || false;
    } else if (notificationType === 'rent_day' || notificationType === 'rent_reminder') {
        // 월세 알림은 매월 한 번만 (같은 달에는 다시 알림 없음)
        const thisMonth = moment().format('YYYY-MM');
        return history[`${notificationType}_${thisMonth}`] || false;
    } else {
        // 다른 알림 (모두 출근)은 해당 날짜별로 확인
        return history[`${notificationType}_${date}`] || false;
    }
};

// 알림 전송 기록 저장
const markAsNotified = (notificationType, date) => {
    const notifiedHistory = localStorage.getItem('pdg_notification_history') || '{}';
    const history = JSON.parse(notifiedHistory);

    // 유형별로 저장 키 다르게 설정
    if (notificationType === 'trash_day') {
        // 쓰레기 알림은 오늘 날짜로 저장
        const today = moment().format('YYYY-MM-DD');
        history[`${notificationType}_${today}`] = true;
    } else if (notificationType === 'rent_day' || notificationType === 'rent_reminder') {
        // 월세 알림은 이번 달로 저장
        const thisMonth = moment().format('YYYY-MM');
        history[`${notificationType}_${thisMonth}`] = true;
    } else {
        // 다른 알림 (모두 출근)은 해당 날짜별로 저장
        history[`${notificationType}_${date}`] = true;
    }

    localStorage.setItem('pdg_notification_history', JSON.stringify(history));
};

// 공통 알림 전송 함수
const sendNotification = (title, body) => {
    // 5초 이내에 같은 내용의 알림이 전송되었는지 확인 (중복 방지)
    const now = new Date();
    const lastSent = window.lastSentNotifications || {};
    const notificationKey = `${title}_${body}`;

    if (lastSent[notificationKey]) {
        const timeDiff = now - new Date(lastSent[notificationKey]);
        // 5초 이내에 같은 알림이 이미 전송되었다면 무시
        if (timeDiff < 5000) {
            console.log('중복 알림 방지: 같은 내용의 알림이 최근에 전송되었습니다', title);
            return false;
        }
    }

    // 알림 전송 시간 기록
    window.lastSentNotifications = window.lastSentNotifications || {};
    window.lastSentNotifications[notificationKey] = now.toISOString();

    // 브라우저 알림 표시
    if (Notification.permission === 'granted') {
        // 새 알림 생성 및 저장
        addNotification(title, body);

        // 브라우저 알림 표시
        const notification = new Notification(title, {
            body,
            icon: '/pdgicon.png',
            requireInteraction: true // 사용자가 상호작용할 때까지 알림 유지
        });

        notification.onclick = () => {
            window.focus();

            // 알림 목록 열기 이벤트 발생
            window.dispatchEvent(new Event('showNotificationList'));

            notification.close();
        };

        return true;
    }

    console.warn('알림 권한이 없어 알림을 표시할 수 없습니다.');
    return false;
};

// 새 알림 추가
export const addNotification = (title, message) => {
    const data = getInitialNotifications();

    // 새 알림 객체 생성
    const newNotification = {
        id: Date.now().toString(),
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false
    };

    // 알림 목록 앞에 추가
    data.notifications = [newNotification, ...data.notifications];

    // 저장 및 구독자 알림
    saveNotifications(data);

    return newNotification;
};

// 테스트용 알림 함수
export const sendTestNotification = (title, body) => {
    // 개발 환경에서는 로컬 스토리지에 테스트 알림 기록을 먼저 확인
    const testKey = `test_notification_${title.replace(/\s+/g, '_')}`;
    const lastSent = localStorage.getItem(testKey);

    if (lastSent) {
        const timeDiff = new Date() - new Date(lastSent);
        // 10분 이내에 같은 제목의 테스트 알림이 이미 전송되었다면 무시
        if (timeDiff < 10 * 60 * 1000) {
            console.log('테스트 중복 알림 방지:', title);
            return false;
        }
    }

    // 테스트 알림 전송 기록
    localStorage.setItem(testKey, new Date().toISOString());

    return sendNotification(title, body);
};

// 알림 읽음 표시
export const markNotificationAsRead = (notificationId) => {
    const data = getInitialNotifications();

    data.notifications = data.notifications.map(notification => {
        if (notification.id === notificationId) {
            return { ...notification, read: true };
        }
        return notification;
    });

    saveNotifications(data);
};

// 모든 알림 읽음 표시
export const markAllNotificationsAsRead = () => {
    const data = getInitialNotifications();

    data.notifications = data.notifications.map(notification => ({
        ...notification,
        read: true
    }));

    saveNotifications(data);
};

// 알림 삭제
export const deleteNotification = (notificationId) => {
    const data = getInitialNotifications();

    data.notifications = data.notifications.filter(
        notification => notification.id !== notificationId
    );

    saveNotifications(data);
};

// 모든 알림 삭제
export const clearAllNotifications = () => {
    const data = getInitialNotifications();
    data.notifications = [];

    saveNotifications(data);
};

export default {
    requestNotificationPermission,
    setupNotificationListener,
    getNotificationHistory,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    getUnreadCount,
    sendTestNotification,
    subscribeToNotificationUpdates,
    checkForAllMembersScheduled
};
