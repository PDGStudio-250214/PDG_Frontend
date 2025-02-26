// src/pages/Login.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    FormControlLabel,
    Checkbox,
    CircularProgress,
    InputAdornment,
    IconButton,
    useTheme,
    useMediaQuery,
    Avatar
} from '@mui/material';
import {
    MailOutline as EmailIcon,
    LockOutlined as PasswordIcon,
    Visibility,
    VisibilityOff,
    Login as LoginIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // 초기화 시 "아이디 저장" 확인
    useEffect(() => {
        // 저장된 이메일과 "아이디 저장" 선택 여부 확인
        const savedEmail = localStorage.getItem('savedEmail');
        const isRememberMe = localStorage.getItem('rememberMe') === 'true';

        if (savedEmail && isRememberMe) {
            setEmail(savedEmail);
            setRememberMe(true);
        }

        // 이미 로그인 상태면 홈으로 리다이렉트
        if (user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // "아이디 저장" 처리
            if (rememberMe) {
                localStorage.setItem('savedEmail', email);
                localStorage.setItem('rememberMe', 'true');
            } else {
                localStorage.removeItem('savedEmail');
                localStorage.removeItem('rememberMe');
            }

            // 로그인 시도
            const success = await login({
                email,
                password
            });

            if (success) {
                navigate('/', { replace: true });
            } else {
                setError('아이디 또는 비밀번호가 올바르지 않습니다.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('로그인 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: isMobile
                    ? 'linear-gradient(180deg, #3a6bb0 0%, #1a3a6f 100%)'
                    : 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)',
                p: 0,
                m: 0
            }}
        >
            {isMobile ? (
                // 모바일 디자인
                <Box
                    sx={{
                        width: '100%',
                        maxWidth: '420px',
                        display: 'flex',
                        flexDirection: 'column',
                        p: 0
                    }}
                >
                    {/* 상단 로고 영역 */}
                    <Box
                        sx={{
                            bgcolor: '#2e68bf',
                            color: 'white',
                            py: 5,
                            px: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            borderRadius: '0 0 15px 15px',
                            mb: -2,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 60,
                                height: 60,
                                bgcolor: 'white',
                                color: '#2e68bf',
                                mb: 2
                            }}
                        >
                            <LoginIcon fontSize="large" />
                        </Avatar>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                            PDGStudio
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                            관리 사이트
                        </Typography>
                    </Box>

                    {/* 로그인 폼 영역 */}
                    <Paper
                        elevation={3}
                        sx={{
                            borderRadius: 3,
                            p: 3,
                            width: '100%',
                            boxSizing: 'border-box'
                        }}
                    >
                        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                            로그인
                        </Typography>

                        {error && (
                            <Box
                                sx={{
                                    p: 1.5,
                                    mb: 2,
                                    bgcolor: 'error.light',
                                    color: 'error.dark',
                                    borderRadius: 1,
                                    fontSize: '0.875rem'
                                }}
                            >
                                {error}
                            </Box>
                        )}

                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                placeholder="이메일 주소"
                                name="email"
                                label="이메일 주소"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EmailIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                                variant="outlined"
                                size="small"
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                placeholder="비밀번호"
                                label="비밀번호"
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PasswordIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={handleTogglePasswordVisibility}
                                                edge="end"
                                                size="small"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                variant="outlined"
                                size="small"
                                sx={{ mb: 1 }}
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        color="primary"
                                        size="small"
                                    />
                                }
                                label="아이디 저장"
                                sx={{ mb: 2 }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={isLoading}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 1,
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    bgcolor: '#2e68bf',
                                    '&:hover': {
                                        bgcolor: '#235aa8'
                                    }
                                }}
                            >
                                {isLoading ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    "로그인"
                                )}
                            </Button>
                        </Box>

                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
                            PDGStudio 멤버가 아니면 로그인이 불가합니다.
                        </Typography>
                    </Paper>
                </Box>
            ) : (
                // 데스크톱 디자인
                <Container maxWidth="sm">
                    <Paper
                        elevation={10}
                        sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)'
                        }}
                    >
                        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                            {/* 왼쪽 영역 - 로고 및 소개 */}
                            <Box
                                sx={{
                                    bgcolor: '#2e68bf',
                                    color: 'white',
                                    padding: 4,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    width: '40%'
                                }}
                            >
                                <Avatar
                                    sx={{
                                        width: 70,
                                        height: 70,
                                        bgcolor: 'white',
                                        color: '#2e68bf',
                                        mb: 2
                                    }}
                                >
                                    <LoginIcon fontSize="large" />
                                </Avatar>
                                <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                                    PDGStudio
                                </Typography>
                                <Typography variant="body1">
                                    관리 사이트
                                </Typography>
                            </Box>

                            {/* 오른쪽 영역 - 로그인 폼 */}
                            <Box
                                sx={{
                                    padding: 4,
                                    width: '60%',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <Typography
                                    variant="h5"
                                    component="h2"
                                    gutterBottom
                                    sx={{ fontWeight: 'bold', mb: 3 }}
                                >
                                    로그인
                                </Typography>

                                {error && (
                                    <Box
                                        sx={{
                                            py: 1,
                                            px: 2,
                                            mb: 3,
                                            bgcolor: 'error.light',
                                            color: 'error.dark',
                                            borderRadius: 1,
                                            opacity: 0.9
                                        }}
                                    >
                                        <Typography variant="body2">{error}</Typography>
                                    </Box>
                                )}

                                <Box component="form" onSubmit={handleSubmit} noValidate>
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="email"
                                        label="이메일 주소"
                                        name="email"
                                        autoComplete="email"
                                        autoFocus={!email}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <EmailIcon color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        variant="outlined"
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
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PasswordIcon color="action" />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="toggle password visibility"
                                                        onClick={handleTogglePasswordVisibility}
                                                        edge="end"
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                        variant="outlined"
                                        sx={{ mb: 1 }}
                                    />

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                value="remember"
                                                color="primary"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                            />
                                        }
                                        label="아이디 저장"
                                        sx={{ mb: 2 }}
                                    />

                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        disabled={isLoading}
                                        sx={{
                                            py: 1.5,
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontSize: '1rem',
                                            fontWeight: 'bold',
                                            bgcolor: '#2e68bf',
                                            '&:hover': {
                                                bgcolor: '#235aa8'
                                            }
                                        }}
                                    >
                                        {isLoading ? (
                                            <CircularProgress size={24} color="inherit" />
                                        ) : (
                                            "로그인"
                                        )}
                                    </Button>
                                </Box>

                                <Box sx={{ mt: 3, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        PDGStudio 멤버가 아니면 로그인이 불가합니다.
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Container>
            )}
        </Box>
    );
};

export default Login;
