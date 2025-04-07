// src/pages/Calendar.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import moment from 'moment';
import 'moment/locale/ko';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
    Box,
    Paper,
    Tabs,
    Tab,
    Typography,
    useMediaQuery,
    useTheme,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    Alert,
    ToggleButtonGroup,
    ToggleButton,
    Button,
    IconButton,
    Tooltip
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import EventDialog from '../components/EventDialog';
import DayDetailDialog from '../components/DayDetailDialog';
import CustomMonthView from '../components/CustomMonthView';
import CustomWeekView from '../components/CustomWeekView';
import api from '../api/config';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { getUserColor } from '../utils/colorUtils';
import { checkForAllMembersScheduled } from '../services/notificationService';

// 한국어 설정
moment.locale('ko');

// 2025년 한국 공휴일 데이터
const koreanHolidays2025 = [
    { id: 'holiday-2025-01-01', title: '신정', start: new Date(2025, 0, 1), end: new Date(2025, 0, 1), allDay: true, isHoliday: true },
    { id: 'holiday-2025-02-01', title: '설날', start: new Date(2025, 1, 1), end: new Date(2025, 1, 1), allDay: true, isHoliday: true },
    { id: 'holiday-2025-02-02', title: '설날', start: new Date(2025, 1, 2), end: new Date(2025, 1, 2), allDay: true, isHoliday: true },
    { id: 'holiday-2025-02-03', title: '설날', start: new Date(2025, 1, 3), end: new Date(2025, 1, 3), allDay: true, isHoliday: true },
    { id: 'holiday-2025-03-01', title: '삼일절', start: new Date(2025, 2, 1), end: new Date(2025, 2, 1), allDay: true, isHoliday: true },
    { id: 'holiday-2025-05-05', title: '어린이날', start: new Date(2025, 4, 5), end: new Date(2025, 4, 5), allDay: true, isHoliday: true },
    { id: 'holiday-2025-05-08', title: '부처님오신날', start: new Date(2025, 4, 8), end: new Date(2025, 4, 8), allDay: true, isHoliday: true },
    { id: 'holiday-2025-06-06', title: '현충일', start: new Date(2025, 5, 6), end: new Date(2025, 5, 6), allDay: true, isHoliday: true },
    { id: 'holiday-2025-08-15', title: '광복절', start: new Date(2025, 7, 15), end: new Date(2025, 7, 15), allDay: true, isHoliday: true },
    { id: 'holiday-2025-09-19', title: '추석', start: new Date(2025, 8, 19), end: new Date(2025, 8, 19), allDay: true, isHoliday: true },
    { id: 'holiday-2025-09-20', title: '추석', start: new Date(2025, 8, 20), end: new Date(2025, 8, 20), allDay: true, isHoliday: true },
    { id: 'holiday-2025-09-21', title: '추석', start: new Date(2025, 8, 21), end: new Date(2025, 8, 21), allDay: true, isHoliday: true },
    { id: 'holiday-2025-10-03', title: '개천절', start: new Date(2025, 9, 3), end: new Date(2025, 9, 3), allDay: true, isHoliday: true },
    { id: 'holiday-2025-10-09', title: '한글날', start: new Date(2025, 9, 9), end: new Date(2025, 9, 9), allDay: true, isHoliday: true },
    { id: 'holiday-2025-12-25', title: '크리스마스', start: new Date(2025, 11, 25), end: new Date(2025, 11, 25), allDay: true, isHoliday: true }
];

const Calendar = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [view, setView] = useState('month');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [dialogMode, setDialogMode] = useState('create');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedYear, setSelectedYear] = useState(moment().year());
    const [selectedMonth, setSelectedMonth] = useState(moment().month() + 1);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('info');

    // 상세 페이지 관련 상태
    const [dayDetailOpen, setDayDetailOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);
    const [dayEvents, setDayEvents] = useState([]);

    // 무한 스크롤 관련 상태
    const weekViewRef = useRef(null);

    // 모바일 환경 감지
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // 년도와 월이 변경될 때 currentDate 업데이트 (월간 뷰에서만)
    useEffect(() => {
        if (view === 'month') {
            setCurrentDate(moment().year(selectedYear).month(selectedMonth - 1).toDate());
        }
    }, [selectedYear, selectedMonth, view]);

    // 년/월 선택 핸들러
    const handleYearChange = (event) => {
        setSelectedYear(event.target.value);
    };

    const handleMonthChange = (event) => {
        setSelectedMonth(event.target.value);
    };

    // 뷰 변경 핸들러
    const handleViewChange = (event, newView) => {
        if (newView !== null) {
            setView(newView);
        }
    };

    // 주간 이동 핸들러
    const navigateWeek = (direction) => {
        const newDate = moment(currentDate).add(direction, 'week').toDate();
        setCurrentDate(newDate);
    };

    // 일정 스타일 커스터마이징
    const eventStyleGetter = (event) => {
        if (event.isHoliday) {
            return {
                style: {
                    backgroundColor: '#FF5A5A',
                    color: 'white',
                    borderRadius: '4px',
                    border: 'none',
                    fontWeight: 'bold'
                }
            };
        }

        // 일반 일정의 경우 기존 색상 사용
        return {
            style: {
                backgroundColor: event.color || '#3174ad',
                borderRadius: '4px',
            }
        };
    };

    // 일정 조회
    const fetchEvents = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('인증 토큰이 없습니다');
                // 토큰이 없어도 공휴일은 표시
                setEvents([...koreanHolidays2025]);
                return;
            }

            // 모든 일정을 조회하는 쿼리 파라미터 추가
            const response = await api.get('/schedules?all=true', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 데이터 형식에 따라 처리
            let scheduleData = [];

            if (Array.isArray(response.data)) {
                scheduleData = response.data;
            } else if (response.data && response.data.schedules && Array.isArray(response.data.schedules)) {
                scheduleData = response.data.schedules;
            } else {
                console.error('처리할 수 있는 일정 데이터 형식이 아닙니다');
                // 데이터 형식 오류시에도 공휴일은 표시
                setEvents([...koreanHolidays2025]);
                return;
            }

            // 데이터가 있는지 확인
            if (scheduleData.length === 0) {
                // 공휴일 데이터만 설정
                setEvents([...koreanHolidays2025]);
                return;
            }

            const formattedEvents = scheduleData.map(event => {
                // 사용자 이름 우선 사용, 없으면 이메일 사용
                const userName = event.user?.name || event.userName || event.user?.email || event.userEmail || 'Unknown';
                const userId = event.user?.id || event.userId || null;

                return {
                    id: event.id,
                    title: event.title || '제목 없음',
                    description: event.description || '',
                    start: new Date(event.startDate || event.start),
                    end: new Date(event.endDate || event.end),
                    // 사용자 이름 기반 색상 지정
                    color: getUserColor(userName),
                    // 사용자 식별자 저장
                    userName: userName,
                    userId: userId,
                    // 현재 로그인한 사용자가 작성한 일정인지 여부
                    isOwner: userId === user?.id,
                    userEmail: event.user?.email || event.userEmail
                };
            });


            // 공휴일 데이터와 사용자 일정 데이터 합치기
            setEvents([...formattedEvents, ...koreanHolidays2025]);
      

            // 로컬 스토리지에 일정 데이터 저장 (알림 기능에서 사용)
            localStorage.setItem('pdg_schedules', JSON.stringify(formattedEvents));

            // 모든 멤버가 출근하는 날 체크 (알림 서비스의 함수 호출)
            checkForAllMembersScheduled();
        } catch (error) {
            console.error('일정 조회 중 오류 발생:', error.response?.data || error.message);
            // 오류 발생 시에도 공휴일은 표시
            setEvents([...koreanHolidays2025]);
        }
    }, [user]);

    // 컴포넌트 마운트 시 일정 조회
    useEffect(() => {
        if (user) {
            fetchEvents();
        } else {
            // 사용자가 로그인하지 않은 경우에도 공휴일은 표시
            setEvents([...koreanHolidays2025]);
        }
    }, [user, fetchEvents]);

    // 날짜 클릭 핸들러
    const handleDateClick = (day) => {
        // 상세 페이지용 날짜 정보 저장
        setSelectedDay(day);

        // 해당 날짜의 이벤트 필터링
        const dateStr = day.format('YYYY-MM-DD');
        const filteredEvents = events.filter(event =>
            moment(event.start).format('YYYY-MM-DD') === dateStr
        );
        setDayEvents(filteredEvents);

        // 상세 페이지 열기
        setDayDetailOpen(true);
    };

    // 일정 클릭 핸들러
    const handleEventClick = (event) => {
        // 공휴일은 수정 불가 (보기만 가능)
        if (event.isHoliday) {
            setSelectedEvent(event);
            setDialogMode('view');
            setDialogOpen(true);
            return;
        }

        setSelectedEvent(event);
        setDialogMode(event.isOwner ? 'edit' : 'view');
        setDialogOpen(true);
    };

    // 주간 뷰에서 일정 추가 버튼 클릭 핸들러
    const handleAddEventForDay = (day) => {
        const now = moment();
        const startDate = moment(day)
            .hour(now.hour())
            .minute(Math.ceil(now.minute() / 15) * 15); // 15분 단위로 반올림

        setSelectedSlot({
            start: startDate.toDate(),
            end: moment(startDate).add(1, 'hour').toDate()
        });
        setDialogMode('create');
        setDialogOpen(true);
    };

    // 상세 페이지에서 일정 추가 버튼 클릭 핸들러
    const handleAddEventFromDetail = () => {
        const now = moment();
        const startDate = moment(selectedDay)
            .hour(now.hour())
            .minute(Math.ceil(now.minute() / 15) * 15); // 15분 단위로 반올림

        setSelectedSlot({
            start: startDate.toDate(),
            end: moment(startDate).add(1, 'hour').toDate()
        });
        setDialogMode('create');
        setDialogOpen(true);
    };

    // 일정 저장 핸들러
    const handleSaveEvent = async (eventData) => {
        try {
            const token = localStorage.getItem('token');
            const payload = {
                title: eventData.title,
                description: eventData.description || '',
                startDate: eventData.start,
                endDate: eventData.end
            };

            let response;

            if (dialogMode === 'create') {
                // 새 일정 생성
                response = await api.post('/schedules', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // 응답에서 일정 데이터 확인
                const createdSchedule = response.data.schedule || response.data;

                if (createdSchedule) {
                    // 새 일정을 상태에 바로 추가
                    const newEvent = {
                        id: createdSchedule.id,
                        title: createdSchedule.title || eventData.title,
                        description: createdSchedule.description || eventData.description || '',
                        start: new Date(createdSchedule.startDate || eventData.start),
                        end: new Date(createdSchedule.endDate || eventData.end),
                        color: getUserColor(user?.name),
                        userName: user?.name,
                        userId: user?.id,
                        userEmail: user?.email,
                        isOwner: true
                    };

                    setEvents(prev => [...prev.filter(e => !e.isHoliday), newEvent, ...koreanHolidays2025]);

                    // 현재 상세 페이지에 표시된 이벤트 목록도 업데이트
                    if (selectedDay && moment(eventData.start).isSame(selectedDay, 'day')) {
                        setDayEvents(prev => [...prev, newEvent]);
                    }

                    // 일정 추가 후 모든 멤버 출근 체크 다시 수행
                    checkForAllMembersScheduled();
                }
            } else if (dialogMode === 'edit' && selectedEvent?.isOwner) {
                // 기존 일정 수정 (자신이 작성한 일정만)
                response = await api.put(`/schedules/${selectedEvent.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // 수정된 일정을 상태에서 업데이트
                const updatedEvent = {
                    ...selectedEvent,
                    title: eventData.title,
                    description: eventData.description,
                    start: new Date(eventData.start),
                    end: new Date(eventData.end)
                };

                setEvents(prev => [
                    ...prev.filter(event => event.id !== selectedEvent.id && !event.isHoliday),
                    updatedEvent,
                    ...koreanHolidays2025
                ]);

                // 상세 페이지에 표시된 이벤트 목록도 업데이트
                setDayEvents(prev => prev.map(event =>
                    event.id === selectedEvent.id ? updatedEvent : event
                ));

                // 일정 수정 후 모든 멤버 출근 체크 다시 수행
                checkForAllMembersScheduled();
            }

            setDialogOpen(false);
        } catch (error) {
            console.error('일정 저장 중 오류 발생:', error.response?.data || error.message);
            setSnackbarMessage('일정 저장 중 오류가 발생했습니다.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    // 일정 삭제 핸들러
    const handleDeleteEvent = async (eventId) => {
        // 공휴일은 삭제 불가
        if (selectedEvent?.isHoliday) {
            setSnackbarMessage('공휴일은 삭제할 수 없습니다.');
            setSnackbarOpen(true);
            return;
        }

        // 현재 선택된 일정이 자신의 것인지 확인
        if (!selectedEvent?.isOwner) {
            setSnackbarMessage('다른 사용자의 일정은 삭제할 수 없습니다.');
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await api.delete(`/schedules/${eventId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 삭제된 일정을 상태에서 제거
            setEvents(prev => [...prev.filter(event => event.id !== eventId && !event.isHoliday), ...koreanHolidays2025]);

            // 상세 페이지에 표시된 이벤트 목록도 업데이트
            setDayEvents(prev => prev.filter(event => event.id !== eventId));

            // 일정 삭제 후 모든 멤버 출근 체크 다시 수행
            checkForAllMembersScheduled();

            setDialogOpen(false);
        } catch (error) {
            console.error('일정 삭제 중 오류 발생:', error.response?.data || error.message);
            setSnackbarMessage('일정 삭제 중 오류가 발생했습니다.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    // 스낵바 닫기 핸들러
    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    // 년/월 선택기 생성 (월간 뷰에서만 사용)
    const YearMonthSelector = () => {
        // 년도 목록 (현재 년도 기준 -5년 ~ +5년)
        const currentYear = moment().year();
        const years = Array.from(
            {length: 11},
            (_, i) => currentYear - 5 + i
        );

        // 월 목록
        const months = Array.from(
            {length: 12},
            (_, i) => i + 1
        );

        return (
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel id="year-select-label">년도</InputLabel>
                    <Select
                        labelId="year-select-label"
                        id="year-select"
                        value={selectedYear}
                        label="년도"
                        onChange={handleYearChange}
                    >
                        {years.map(year => (
                            <MenuItem key={year} value={year}>{year}년</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 80 }}>
                    <InputLabel id="month-select-label">월</InputLabel>
                    <Select
                        labelId="month-select-label"
                        id="month-select"
                        value={selectedMonth}
                        label="월"
                        onChange={handleMonthChange}
                    >
                        {months.map(month => (
                            <MenuItem key={month} value={month}>{month}월</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
        );
    };

    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <Box sx={{
                p: isMobile ? 1 : 3,
                height: 'calc(100vh - 64px)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* 캘린더 컨트롤 영역 */}
                <Paper sx={{
                    p: 2,
                    mb: 2,
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 2,
                    alignItems: isMobile ? 'stretch' : 'center',
                    justifyContent: 'space-between',
                    borderRadius: 2,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                }}>
                    {/* 탭 선택 (월간/주간) */}
                    {isMobile ? (
                        <Tabs
                            value={view}
                            onChange={(e, newValue) => setView(newValue)}
                            variant="fullWidth"
                            centered
                        >
                            <Tab value="month" label="월간" />
                            <Tab value="week" label="주간" />
                        </Tabs>
                    ) : (
                        <ToggleButtonGroup
                            value={view}
                            exclusive
                            onChange={handleViewChange}
                            aria-label="calendar view"
                            size={isMobile ? "small" : "medium"}
                        >
                            <ToggleButton value="month">월간</ToggleButton>
                            <ToggleButton value="week">주간</ToggleButton>
                        </ToggleButtonGroup>
                    )}

                    {view === 'month' && (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <YearMonthSelector />
                        </Box>
                    )}
                </Paper>

                {/* 캘린더 */}
                <Paper sx={{
                    p: isMobile ? 1 : 2,
                    flexGrow: 1,
                    borderRadius: 2,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.07)'
                }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        overflow: 'hidden'
                    }}>
                        {/* 월세 납부일(23일) 표시 */}
                        {view === 'month' && (
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                mb: 1,
                                alignItems: 'center'
                            }}>
                                <Box
                                    sx={{
                                        width: 12,
                                        height: 12,
                                        bgcolor: 'error.main',
                                        borderRadius: '50%',
                                        mr: 1
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    월세 납부일 (매월 23일)
                                </Typography>
                            </Box>
                        )}

                        {/* 뷰에 따른 컴포넌트 렌더링 */}
                        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                            {view === 'month' ? (
                                <CustomMonthView
                                    date={currentDate}
                                    events={events}
                                    onDateClick={handleDateClick}
                                    onEventClick={handleEventClick}
                                    isMobile={isMobile}

                                    eventStyleGetter={eventStyleGetter}

                                    highlightRentDay={true} // 월세 납부일(23일) 강조 표시

                                />
                            ) : (
                                <CustomWeekView
                                    date={currentDate}
                                    events={events}
                                    onDayClick={handleDateClick}
                                    onEventClick={handleEventClick}
                                    onNavigateWeek={navigateWeek}
                                    onAddEvent={handleAddEventForDay}
                                    isMobile={isMobile}
                                    highlightRentDay={true} // 월세 납부일(23일) 강조 표시
                                    ref={weekViewRef}
                                    eventStyleGetter={eventStyleGetter}
                                />
                            )}
                        </Box>
                    </Box>
                </Paper>

                {/* 일정 수정/생성 다이얼로그 */}
                <EventDialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    mode={dialogMode}
                    event={selectedEvent}
                    selectedSlot={selectedSlot}
                    onSave={handleSaveEvent}
                    onDelete={handleDeleteEvent}
                    isMobile={isMobile}
                    currentUser={user}
                />

                {/* 날짜 상세 페이지 다이얼로그 */}
                <DayDetailDialog
                    open={dayDetailOpen}
                    onClose={() => setDayDetailOpen(false)}
                    selectedDay={selectedDay}
                    events={dayEvents}
                    onEventClick={handleEventClick}
                    onAddEvent={handleAddEventFromDetail}
                    isMobile={isMobile}
                />

                {/* 알림 메시지 */}
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={4000}
                    onClose={handleSnackbarClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        onClose={handleSnackbarClose}
                        severity={snackbarSeverity}
                        variant="filled"
                        sx={{ width: '100%' }}
                    >
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
};

export default Calendar;