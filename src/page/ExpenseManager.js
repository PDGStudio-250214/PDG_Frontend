// src/pages/ExpenseManager.js - 모바일 최적화 버전
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Tabs,
    Tab,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TextField,
    Button,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Chip,
    Alert,
    Snackbar,
    Divider,
    Grid,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import HomeIcon from '@mui/icons-material/Home';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import PaymentIcon from '@mui/icons-material/Payment';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/config';
import moment from 'moment';
import 'moment/locale/ko';

moment.locale('ko');

const ExpenseManager = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [currentTransaction, setCurrentTransaction] = useState(null);
    const [type, setType] = useState('DEPOSIT');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(moment());
    const [description, setDescription] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('info');
    const [totalBalance, setTotalBalance] = useState(0);
    const [depositAmount] = useState(10000000);

    // 테마 및 모바일 감지
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // 특별 권한 체크
    const isAdmin = user?.email === 'hosk2014@test.com';

    // 탭 관련 정보
    const tabs = [
        { label: '모든 내역', value: 'ALL' },
        { label: '월세', value: 'RENT' },
        { label: '공과금', value: 'UTILITY' },
        { label: '관리비', value: 'MAINTENANCE' },
        { label: '입금', value: 'DEPOSIT' },
        { label: '출금', value: 'WITHDRAWAL' }
    ];

    // 거래 내역 데이터 로드
    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/transactions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTransactions(response.data);
            calculateTotalBalance(response.data);
        } catch (error) {
            console.error('거래 내역 데이터 로드 중 오류:', error);
            showSnackbar('거래 내역을 불러오는데 실패했습니다.', 'error');
        }
    };

    // 총 잔액 계산 함수
    const calculateTotalBalance = (transactionData) => {
        const total = transactionData.reduce((total, t) => {
            const value = t.type === 'DEPOSIT' ? t.amount : -t.amount;
            return total + value;
        }, 0);
        setTotalBalance(total);
    };

    // 필터링된 거래 내역 목록
    const filteredTransactions = tabValue === 0
        ? transactions
        : transactions.filter(transaction => transaction.type === tabs[tabValue].value);

    // 탭 변경 핸들러
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // 다이얼로그 열기
    const handleOpenDialog = (transaction = null) => {
        if (transaction) {
            setCurrentTransaction(transaction);
            setType(transaction.type);
            setAmount(transaction.amount.toString());
            setDate(moment(transaction.date));
            setDescription(transaction.description || '');
        } else {
            setCurrentTransaction(null);
            setType('DEPOSIT');
            setAmount('');
            setDate(moment());
            setDescription('');
        }
        setDialogOpen(true);
    };

    // 거래 내역 저장
    const handleSaveTransaction = async () => {
        try {
            const token = localStorage.getItem('token');
            const transactionData = {
                type,
                amount: parseFloat(amount),
                date: date.toISOString(),
                description
            };

            if (currentTransaction) {
                await api.put(`/transactions/${currentTransaction.id}`, transactionData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showSnackbar('거래 내역이 수정되었습니다.', 'success');
            } else {
                await api.post('/transactions', transactionData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showSnackbar('새 거래 내역이 추가되었습니다.', 'success');
            }

            setDialogOpen(false);
            fetchTransactions();
        } catch (error) {
            console.error('거래 내역 저장 중 오류:', error);
            showSnackbar('저장 중 오류가 발생했습니다.', 'error');
        }
    };

    // 거래 내역 삭제
    const handleDeleteTransaction = async (id) => {
        if (window.confirm('정말 삭제하시겠습니까?')) {
            try {
                const token = localStorage.getItem('token');
                await api.delete(`/transactions/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showSnackbar('거래 내역이 삭제되었습니다.', 'success');
                fetchTransactions();
            } catch (error) {
                console.error('거래 내역 삭제 중 오류:', error);
                showSnackbar('삭제 중 오류가 발생했습니다.', 'error');
            }
        }
    };

    // 스낵바 표시
    const showSnackbar = (message, severity = 'info') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    // 거래 유형별 라벨 및 색상
    const getTypeLabel = (type) => {
        const typeMap = {
            'RENT': { label: '월세', color: 'error' },
            'UTILITY': { label: '공과금', color: 'warning' },
            'MAINTENANCE': { label: '관리비', color: 'info' },
            'DEPOSIT': { label: '입금', color: 'success' },
            'WITHDRAWAL': { label: '출금', color: 'secondary' }
        };
        return typeMap[type] || { label: type, color: 'default' };
    };

    // 월별 합계 계산 (현재 선택된 월에 대한 계산)
    const calculateMonthlyTotal = (type) => {
        const currentMonth = moment().month();
        const currentYear = moment().year();

        const monthlyTransactions = transactions.filter(t => {
            const transactionDate = moment(t.date);
            return transactionDate.month() === currentMonth &&
                transactionDate.year() === currentYear &&
                (type === 'ALL' || t.type === type);
        });

        return monthlyTransactions.reduce((total, t) => {
            const value = t.type === 'DEPOSIT' ? t.amount : -t.amount;
            return total + value;
        }, 0);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <Box sx={{ p: isMobile ? 2 : 3 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
                    금융 내역 관리
                </Typography>

                {/* 모바일 화면에 최적화된 요약 카드 */}
                <Box sx={{ mb: 3, mt: 2 }}>
                    {/* 보증금 & 잔액 정보 - 모바일에서는 좀더 콤팩트하게 */}
                    <Paper sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                    }}>
                        {/* 보증금 정보 */}
                        <Box sx={{
                            p: isMobile ? 2 : 3,
                            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'linear-gradient(135deg, #f3f9ff 0%, #e6f1ff 100%)'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <HomeIcon sx={{ fontSize: isMobile ? 20 : 28, color: 'primary.main', mr: 1.5 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                                    보증금
                                </Typography>
                            </Box>
                            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                                {depositAmount.toLocaleString()}원
                            </Typography>
                        </Box>

                        {/* 총 잔액 정보 */}
                        <Box sx={{
                            p: isMobile ? 2 : 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: totalBalance >= 0
                                ? 'linear-gradient(135deg, #e7f5e9 0%, #c8e6c9 100%)'
                                : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AccountBalanceIcon sx={{
                                    fontSize: isMobile ? 20 : 28,
                                    color: totalBalance >= 0 ? 'success.main' : 'error.main',
                                    mr: 1.5
                                }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                                    총 잔액
                                </Typography>
                            </Box>
                            <Typography variant={isMobile ? "h6" : "h5"} sx={{
                                fontWeight: 'bold',
                                color: totalBalance >= 0 ? 'success.dark' : 'error.dark'
                            }}>
                                {totalBalance.toLocaleString()}원
                            </Typography>
                        </Box>
                    </Paper>
                </Box>

                {/* 월별 요약 정보 */}
                <Paper sx={{
                    p: isMobile ? 2 : 3,
                    mb: 3,
                    bgcolor: '#f8f9fa',
                    borderRadius: 2,
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ShowChartIcon sx={{ fontSize: isMobile ? 20 : 24, color: 'primary.main', mr: 1 }} />
                            <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 'medium' }}>
                                이번 달 요약
                            </Typography>
                        </Box>
                        <Typography variant={isMobile ? "subtitle1" : "h6"} color="primary.main" fontWeight="bold">
                            {moment().format('YYYY년 M월')}
                        </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={isMobile ? 1 : 2}>
                        <Grid item xs={6} md={3}>
                            <Box sx={{ p: isMobile ? 1 : 1.5, textAlign: 'center', borderRadius: 1, bgcolor: 'error.light', color: 'error.dark' }}>
                                <Typography variant={isMobile ? "caption" : "subtitle2"} color="error.dark" fontWeight="medium">
                                    월세
                                </Typography>
                                <Typography variant={isMobile ? "body1" : "h6"} fontWeight="bold">
                                    {calculateMonthlyTotal('RENT').toLocaleString()}원
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Box sx={{ p: isMobile ? 1 : 1.5, textAlign: 'center', borderRadius: 1, bgcolor: 'warning.light', color: 'warning.dark' }}>
                                <Typography variant={isMobile ? "caption" : "subtitle2"} color="warning.dark" fontWeight="medium">
                                    공과금
                                </Typography>
                                <Typography variant={isMobile ? "body1" : "h6"} fontWeight="bold">
                                    {calculateMonthlyTotal('UTILITY').toLocaleString()}원
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Box sx={{ p: isMobile ? 1 : 1.5, textAlign: 'center', borderRadius: 1, bgcolor: 'info.light', color: 'info.dark' }}>
                                <Typography variant={isMobile ? "caption" : "subtitle2"} color="info.dark" fontWeight="medium">
                                    관리비
                                </Typography>
                                <Typography variant={isMobile ? "body1" : "h6"} fontWeight="bold">
                                    {calculateMonthlyTotal('MAINTENANCE').toLocaleString()}원
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Box sx={{
                                p: isMobile ? 1 : 1.5,
                                textAlign: 'center',
                                borderRadius: 1,
                                bgcolor: calculateMonthlyTotal('ALL') >= 0 ? 'success.light' : 'error.light',
                                color: calculateMonthlyTotal('ALL') >= 0 ? 'success.dark' : 'error.dark'
                            }}>
                                <Typography
                                    variant={isMobile ? "caption" : "subtitle2"}
                                    color={calculateMonthlyTotal('ALL') >= 0 ? 'success.dark' : 'error.dark'}
                                    fontWeight="medium"
                                >
                                    이번 달 변동
                                </Typography>
                                <Typography variant={isMobile ? "body1" : "h6"} fontWeight="bold">
                                    {calculateMonthlyTotal('ALL').toLocaleString()}원
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* 탭 메뉴 */}
                <Paper sx={{
                    mb: 3,
                    borderRadius: 2,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden'
                }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons={isMobile ? "auto" : false}
                        sx={{
                            bgcolor: 'background.paper',
                            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                            '& .MuiTab-root': {
                                py: 1.5,
                                fontSize: isMobile ? '0.8rem' : 'inherit',
                                fontWeight: 'medium',
                                minWidth: isMobile ? 'auto' : 80
                            }
                        }}
                    >
                        {tabs.map((tab, index) => (
                            <Tab key={index} label={tab.label} />
                        ))}
                    </Tabs>
                </Paper>

                {/* 거래 내역 목록 */}
                <Paper sx={{
                    p: isMobile ? 1.5 : 3,
                    mb: 3,
                    borderRadius: 2,
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
                }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                        px: isMobile ? 1 : 0
                    }}>
                        <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 'medium' }}>
                            {tabs[tabValue].label} 목록
                        </Typography>
                        {isAdmin && !isMobile && (
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenDialog()}
                                sx={{
                                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
                                    borderRadius: 1.5
                                }}
                            >
                                새 내역 추가
                            </Button>
                        )}
                    </Box>

                    {/* 모바일에서는 테이블을 다르게 표시 */}
                    {isMobile ? (
                        <Box sx={{ overflow: 'auto' }}>
                            {filteredTransactions.length === 0 ? (
                                <Box sx={{
                                    py: 4,
                                    textAlign: 'center',
                                    color: 'text.secondary'
                                }}>
                                    내역이 없습니다
                                </Box>
                            ) : (
                                filteredTransactions.map(transaction => {
                                    const typeInfo = getTypeLabel(transaction.type);
                                    return (
                                        <Paper
                                            key={transaction.id}
                                            sx={{
                                                p: 1.5,
                                                mb: 1,
                                                borderRadius: 1,
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                '&:hover': {
                                                    bgcolor: 'rgba(0,0,0,0.01)'
                                                }
                                            }}
                                        >
                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                mb: 1
                                            }}>
                                                <Chip
                                                    label={typeInfo.label}
                                                    color={typeInfo.color}
                                                    size="small"
                                                    sx={{ fontWeight: 'medium', height: 24 }}
                                                />
                                                <Typography variant="body2" color="text.secondary">
                                                    {moment(transaction.date).format('YYYY-MM-DD')}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                    {transaction.amount.toLocaleString()}원
                                                </Typography>

                                                {isAdmin && (
                                                    <Box>
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleOpenDialog(transaction)}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeleteTransaction(transaction.id)}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                )}
                                            </Box>

                                            {transaction.description && (
                                                <Typography variant="body2" color="text.secondary">
                                                    {transaction.description}
                                                </Typography>
                                            )}
                                        </Paper>
                                    );
                                })
                            )}
                        </Box>
                    ) : (
                        // 데스크탑에서는 기존 테이블 유지
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>유형</TableCell>
                                    <TableCell>날짜</TableCell>
                                    <TableCell>금액</TableCell>
                                    <TableCell>내용</TableCell>
                                    {isAdmin && <TableCell align="right">작업</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={isAdmin ? 5 : 4} align="center">
                                            내역이 없습니다
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTransactions.map(transaction => {
                                        const typeInfo = getTypeLabel(transaction.type);
                                        return (
                                            <TableRow key={transaction.id} sx={{
                                                '&:hover': {
                                                    bgcolor: 'rgba(0, 0, 0, 0.02)'
                                                }
                                            }}>
                                                <TableCell>
                                                    <Chip
                                                        label={typeInfo.label}
                                                        color={typeInfo.color}
                                                        size="small"
                                                        sx={{ fontWeight: 'medium' }}
                                                    />
                                                </TableCell>
                                                <TableCell>{moment(transaction.date).format('YYYY-MM-DD')}</TableCell>
                                                <TableCell sx={{ fontWeight: 'medium' }}>
                                                    {transaction.amount.toLocaleString()}원
                                                </TableCell>
                                                <TableCell>{transaction.description}</TableCell>
                                                {isAdmin && (
                                                    <TableCell align="right">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleOpenDialog(transaction)}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeleteTransaction(transaction.id)}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    )}
                </Paper>

                {/* Admin이 아닌 경우 알림 */}
                {!isAdmin && (
                    <Paper sx={{
                        p: isMobile ? 1.5 : 2.5,
                        bgcolor: 'info.light',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        borderRadius: 2,
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                    }}>
                        <LockIcon sx={{ color: 'info.dark', fontSize: isMobile ? 18 : 24 }} />
                        <Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'info.dark' }}>
                            금융 내역의 추가 및 수정은 관리자(hosk2014)만 가능합니다.
                        </Typography>
                    </Paper>
                )}

                {/* 모바일 FAB */}
                {isAdmin && (
                    <Fab
                        color="primary"
                        sx={{
                            position: 'fixed',
                            bottom: 16,
                            right: 16,
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                        }}
                        onClick={() => handleOpenDialog()}
                    >
                        <AddIcon />
                    </Fab>
                )}

                {/* 내역 추가/편집 다이얼로그 */}
                <Dialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    fullWidth
                    maxWidth="sm"
                    fullScreen={isMobile}
                    PaperProps={{
                        sx: {
                            borderRadius: isMobile ? 0 : 2,
                            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
                        }
                    }}
                >
                    <DialogTitle sx={{ pb: 1, pt: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {currentTransaction ? '내역 수정' : '새 내역 추가'}
                            </Typography>
                            {isMobile && (
                                <IconButton onClick={() => setDialogOpen(false)}>
                                    <DeleteIcon />
                                </IconButton>
                            )}
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <FormControl fullWidth>
                                <InputLabel>유형</InputLabel>
                                <Select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    label="유형"
                                >
                                    <MenuItem value="RENT">월세</MenuItem>
                                    <MenuItem value="UTILITY">공과금</MenuItem>
                                    <MenuItem value="MAINTENANCE">관리비</MenuItem>
                                    <MenuItem value="DEPOSIT">입금</MenuItem>
                                    <MenuItem value="WITHDRAWAL">출금</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                label="금액"
                                fullWidth
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                type="number"
                                InputProps={{
                                    endAdornment: <Typography variant="body2">원</Typography>
                                }}
                            />

                            <DatePicker
                                label="날짜"
                                value={date}
                                onChange={(newDate) => setDate(newDate)}
                                slotProps={{
                                    textField: { fullWidth: true }
                                }}
                            />

                            <TextField
                                label="내용"
                                fullWidth
                                multiline
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2.5 }}>
                        <Button
                            onClick={() => setDialogOpen(false)}
                            variant="outlined"
                            sx={{ borderRadius: 1.5 }}
                        >
                            취소
                        </Button>
                        <Button
                            onClick={handleSaveTransaction}
                            variant="contained"
                            disabled={!type || !amount || !date}
                            sx={{ borderRadius: 1.5 }}
                        >
                            저장
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* 알림 스낵바 */}
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={5000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                >
                    <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} variant="filled">
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
};

export default ExpenseManager;
