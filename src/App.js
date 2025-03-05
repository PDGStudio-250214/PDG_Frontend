// src/App.js
import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import 'moment/locale/ko';
import { requestNotificationPermission, setupNotificationListener } from "./services/notificationService";
import ExpenseManager from "./page/ExpenseManager";
import Calendar from "./page/Calendar";
import Login from "./page/Login";

// 풀-투-리프레시 CSS 추가
import './styles/PullToRefresh.css';


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

function App() {
    // 풀-투-리프레시 관련 상태 및 ref
    const pullToRefreshRef = useRef(null);
    const refreshIconRef = useRef(null);
    const refreshingRef = useRef(false);
    const startYRef = useRef(0);

    useEffect(() => {
        // 서비스 워커 등록 확인
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/firebase-messaging-sw.js')
                .then(registration => {
                    console.log('서비스 워커 등록 성공:', registration.scope);
                })
                .catch(error => {
                    console.error('서비스 워커 등록 실패:', error);
                });
        }

        // 알림 권한 요청 및 리스너 설정
        const setupNotifications = async () => {
            // 로그인 상태일 때만 알림 설정
            const token = localStorage.getItem('token');
            if (token) {
                await requestNotificationPermission();
                setupNotificationListener();
            }
        };

        setupNotifications();

        // 풀-투-리프레시 설정
        setupPullToRefresh();

        return () => {
            // 풀-투-리프레시 정리
            cleanupPullToRefresh();
        };
    }, []);

    // 풀-투-리프레시 설정
    const setupPullToRefresh = () => {
        // 모바일 환경인지 확인
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (!isMobile) return;

        const container = document.body;

        // 풀-투-리프레시 컨테이너 생성
        if (!pullToRefreshRef.current) {
            const ptr = document.createElement('div');
            ptr.className = 'pull-to-refresh';
            ptr.innerHTML = `
                <div class="refresh-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 12h7V5l-2.35 1.35z"/>
                    </svg>
                </div>
            `;
            document.body.prepend(ptr);
            pullToRefreshRef.current = ptr;
            refreshIconRef.current = ptr.querySelector('.refresh-icon');
        }

        // 터치 이벤트 핸들러
        const handleTouchStart = (e) => {
            if (refreshingRef.current) return;
            if (window.scrollY > 0) return; // 스크롤이 최상단일 때만 작동

            startYRef.current = e.touches[0].clientY;
        };

        const handleTouchMove = (e) => {
            if (refreshingRef.current) return;
            if (window.scrollY > 0) return;
            if (!startYRef.current) return;

            const currentY = e.touches[0].clientY;
            const diff = currentY - startYRef.current;

            if (diff <= 0) {
                // 위로 스와이프는 무시
                return;
            }

            // 스크롤 방지
            e.preventDefault();

            // 최대 당김 거리 제한 (100px)
            const pull = Math.min(diff, 100);

            // 당김에 따른 시각적 효과
            const ptrEl = pullToRefreshRef.current;
            const iconEl = refreshIconRef.current;
            if (ptrEl && iconEl) {
                ptrEl.style.height = `${pull}px`;

                // 아이콘 회전 (0-180도)
                const rotation = (pull / 100) * 180;
                iconEl.style.transform = `translateY(${pull / 2}px) rotate(${rotation}deg)`;

                // 당김 정도에 따른 시각적 피드백
                if (pull >= 60) {
                    ptrEl.classList.add('ready');
                } else {
                    ptrEl.classList.remove('ready');
                }
            }
        };

        const handleTouchEnd = (e) => {
            if (refreshingRef.current) return;
            if (!startYRef.current) return;

            const ptrEl = pullToRefreshRef.current;
            const iconEl = refreshIconRef.current;

            // 당김 거리 확인
            const currentY = e.changedTouches[0].clientY;
            const diff = currentY - startYRef.current;
            const pull = Math.min(diff, 100);

            // 당김이 60px 이상이면 새로고침 실행
            if (pull >= 60) {
                refreshingRef.current = true;

                if (ptrEl && iconEl) {
                    ptrEl.style.height = '60px';
                    ptrEl.classList.add('refreshing');
                    iconEl.style.transform = 'translateY(30px) rotate(0deg)';

                    // 애니메이션 추가
                    iconEl.classList.add('spin');
                }

                // 페이지 새로고침
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                // 당김이 충분하지 않으면 원위치
                if (ptrEl && iconEl) {
                    ptrEl.style.height = '0';
                    ptrEl.classList.remove('ready');
                    iconEl.style.transform = 'translateY(0) rotate(0deg)';
                }
            }

            startYRef.current = 0;
        };

        // 이벤트 리스너 등록
        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: false });

        // 이벤트 정리 함수 저장
        const cleanup = () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };

        // 컴포넌트 언마운트 시 정리를 위해 ref에 저장
        container.ptrCleanup = cleanup;
    };

    // 풀-투-리프레시 정리
    const cleanupPullToRefresh = () => {
        if (document.body.ptrCleanup) {
            document.body.ptrCleanup();
        }

        if (pullToRefreshRef.current && pullToRefreshRef.current.parentNode) {
            pullToRefreshRef.current.parentNode.removeChild(pullToRefreshRef.current);
            pullToRefreshRef.current = null;
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
                <AuthProvider>
                    <Router>
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
                        </Routes>
                    </Router>
                </AuthProvider>
            </LocalizationProvider>
        </ThemeProvider>
    );
}

export default App;
