// src/pages/ExpenseManager.js
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
    Snackbar
} from '@mui/material';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
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
    const [totalBalance, setTotalBalance] = useState(0); // 총 잔액 상태 추가

    // 특별 권한 체크 (hosk2014 계정만 수정 가능)
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
            console.log('Fetched transactions:', response.data);
            setTransactions(response.data);

            // 총 잔액 계산 (모든 거래 내역 기준)
            calculateTotalBalance(response.data);
        } catch (error) {
            console.error('거래 내역 데이터 로드 중 오류:', error);
            showSnackbar('거래 내역을 불러오는데 실패했습니다.', 'error');
        }
    };

    // 총 잔액 계산 함수
    const calculateTotalBalance = (transactionData) => {
        const total = transactionData.reduce((total, t) => {
            // 입금은 양수, 그 외는 음수로 계산
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

        // 현재 월의 거래만 필터링
        const monthlyTransactions = transactions.filter(t => {
            const transactionDate = moment(t.date);
            return transactionDate.month() === currentMonth &&
                transactionDate.year() === currentYear &&
                (type === 'ALL' || t.type === type);
        });

        // 합계 계산
        return monthlyTransactions.reduce((total, t) => {
            // 입금은 양수, 출금은 음수로 계산
            const value = t.type === 'DEPOSIT' ? t.amount : -t.amount;
            return total + value;
        }, 0);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <Box sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    금융 내역 관리
                </Typography>

                {/* 총 잔액 정보 (항상 표시) */}
                <Paper sx={{ p: 2, mb: 3, bgcolor: '#f0f7ff' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">
                            총 잔액
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color={totalBalance >= 0 ? 'success.main' : 'error.main'}>
                            {totalBalance.toLocaleString()}원
                        </Typography>
                    </Box>
                </Paper>

                {/* 월별 요약 정보 */}
                <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            이번 달 요약
                        </Typography>
                        <Typography variant="h5" color="primary.main" fontWeight="bold">
                            {moment().format('YYYY년 M월')}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ flex: '1 1 200px', p: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary">월세</Typography>
                            <Typography variant="h6">{calculateMonthlyTotal('RENT').toLocaleString()}원</Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 200px', p: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary">공과금</Typography>
                            <Typography variant="h6">{calculateMonthlyTotal('UTILITY').toLocaleString()}원</Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 200px', p: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary">관리비</Typography>
                            <Typography variant="h6">{calculateMonthlyTotal('MAINTENANCE').toLocaleString()}원</Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 200px', p: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary">이번 달 변동</Typography>
                            <Typography variant="h6" color={calculateMonthlyTotal('ALL') >= 0 ? 'success.main' : 'error.main'}>
                                {calculateMonthlyTotal('ALL').toLocaleString()}원
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                <Paper sx={{ mb: 3 }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        {tabs.map((tab, index) => (
                            <Tab key={index} label={tab.label} />
                        ))}
                    </Tabs>
                </Paper>

                <Paper sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">
                            {tabs[tabValue].label} 목록
                        </Typography>
                        {isAdmin && (
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenDialog()}
                            >
                                새 내역 추가
                            </Button>
                        )}
                    </Box>

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
                                        <TableRow key={transaction.id}>
                                            <TableCell>
                                                <Chip
                                                    label={typeInfo.label}
                                                    color={typeInfo.color}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{moment(transaction.date).format('YYYY-MM-DD')}</TableCell>
                                            <TableCell>
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
                </Paper>

                {/* Admin이 아닌 경우 알림 */}
                {!isAdmin && (
                    <Paper sx={{ p: 2, bgcolor: 'info.light', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LockIcon color="action" />
                        <Typography variant="body2">
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
                            right: 16
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
                >
                    <DialogTitle>
                        {currentTransaction ? '내역 수정' : '새 내역 추가'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                    <DialogActions>
                        <Button onClick={() => setDialogOpen(false)}>취소</Button>
                        <Button
                            onClick={handleSaveTransaction}
                            variant="contained"
                            disabled={!type || !amount || !date}
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
