import React, { useState } from 'react';
import {
    Box,
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    FormControlLabel,
    Checkbox,
    Alert,
    Grow,
    InputAdornment,
    IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import {navigate} from "react-big-calendar/lib/utils/constants";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../contexts/AuthContext";
import api from "../api/config";

const StyledPaper = styled(Paper)(({ theme }) => ({
    marginTop: theme.spacing(8),
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: theme.spacing(2),
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
}));

const LoginBackground = styled(Box)({
    minHeight: '100vh',
    display: 'flex',
    background: 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)',  // 따뜻한 그라데이션
    padding: '20px',
});

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    // src/pages/Login.js - handleSubmit 함수 수정
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        console.log('Login attempt:', { email, password, rememberMe });

        try {
            const response = await api.post('/auth/login', {
                email: email,
                password: password
            });

            console.log('Login response:', response.data);

            if (response.data.success) {
                // 토큰 저장
                const token = response.data.access_token;
                localStorage.setItem('token', token);

                // API 기본 헤더에 토큰 설정
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                console.log('Token stored:', token);

                // 로그인 상태 업데이트
                await login(response.data);

                // 페이지 이동
                navigate('/', { replace: true });
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || '로그인 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const testAccounts = [
        { email: 'pizza@test.com', password: '1234' },
        { email: '1bfish106@test.com', password: '1234' },
        { email: 'hosk2014@test.com', password: '1234' },
    ];

    return (
        <LoginBackground>
            <Container component="main" maxWidth="xs">
                <Grow in={true} timeout={1000}>
                    <StyledPaper elevation={6}>
                        <Typography
                            component="h1"
                            variant="h4"
                            sx={{
                                mb: 3,
                                fontWeight: 'bold',
                                background: 'linear-gradient(45deg, #f6d365 30%, #fda085 90%)',
                                backgroundClip: 'text',
                                textFillColor: 'transparent',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            일정 관리
                        </Typography>

                        {error && (
                            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="이메일"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="비밀번호"
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 2 }}
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        value="remember"
                                        color="warning"  // 테마 색상 변경
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                }
                                label="자동 로그인"
                                sx={{ mb: 2 }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={isLoading}
                                startIcon={<LoginIcon />}
                                sx={{
                                    mt: 2,
                                    mb: 3,
                                    height: '48px',
                                    background: 'linear-gradient(45deg, #f6d365 30%, #fda085 90%)',
                                    color: '#fff',
                                    '&:hover': {
                                        background: 'linear-gradient(45deg, #f6c254 30%, #fc8f74 90%)',
                                    },
                                }}
                            >
                                {isLoading ? '로그인 중...' : '로그인'}
                            </Button>

                            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                                테스트 계정
                            </Typography>
                            <Box sx={{
                                mt: 1,
                                p: 2,
                                bgcolor: 'rgba(253, 160, 133, 0.1)',
                                borderRadius: 1,
                                border: '1px solid rgba(253, 160, 133, 0.2)'
                            }}>
                                {testAccounts.map((account, index) => (
                                    <Typography
                                        key={index}
                                        variant="body2"
                                        color="text.secondary"
                                        align="center"
                                        sx={{ mb: index !== testAccounts.length - 1 ? 1 : 0 }}
                                    >
                                        {account.email} / {account.password}
                                    </Typography>
                                ))}
                            </Box>
                        </Box>
                    </StyledPaper>
                </Grow>
            </Container>
        </LoginBackground>
    );
}

export default Login;
