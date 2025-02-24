// src/api/config.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'https://web-production-3284b.up.railway.app', // 이 부분은 실제 백엔드 URL로 변경해야 합니다
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터 추가
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            console.log('Token added to request:', token.substring(0, 10) + '...');
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터 추가
api.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        if (error.response && error.response.status === 401) {
            console.log('Unauthorized request, redirecting to login');
            // 로컬 스토리지에서 토큰 제거
            localStorage.removeItem('token');
            // 로그인 페이지로 리다이렉트
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
