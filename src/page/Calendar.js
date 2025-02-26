// src/pages/Calendar.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ko';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
    Box,
    Paper,
    Tabs,
    Tab,
    Fab,
    Typography,
    useMediaQuery,
    useTheme,
    Button,
    Grid,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useAuth } from '../contexts/AuthContext';
import EventDialog from '../components/EventDialog';
import api from '../api/config';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

// 한국어 설정
moment.locale('ko');
const localizer = momentLocalizer(moment);

// 사용자별 색상 설정
const userColors = {
    '승혜': '#FF5722',  // pizza
    'pizza@test.com': '#FF5722',  // 이메일로도 매핑
    '가연': '#2196F3',  // 1bfish106
    '1bfish106@test.com': '#2196F3',  // 이메일로도 매핑
    '석린': '#4CAF50',  // hosk2014
    'hosk2014@test.com': '#4CAF50'  // 이메일로도 매핑
};


const getUserColor = (username) => {
    console.log('색상 매핑 중:', username);

    // 직접 매핑 먼저 시도
    if (userColors[username]) {
        return userColors[username];
    }

    // 이름이 포함된 키 찾기 (부분 매칭)
    const partialMatch = Object.keys(userColors).find(key =>
        username.includes(key) || key.includes(username)
    );

    if (partialMatch) {
        return userColors[partialMatch];
    }

    // 이메일 패턴 매칭 (예: "이름 <이메일>" 형식)
    if (username.includes('@')) {
        const emailPart = username.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        if (emailPart && emailPart[0]) {
            const email = emailPart[0];
            if (userColors[email]) {
                return userColors[email];
            }

            // 이메일의 @ 앞부분을 기준으로 매칭 시도
            const emailPrefix = email.split('@')[0];
            for (const key in userColors) {
                if (key.includes(emailPrefix) || emailPrefix.includes(key)) {
                    return userColors[key];
                }
            }
        }
    }

    // 기본 색상 반환 (사용자별로 다른 기본 색상)
    const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const defaultColors = ['#9C27B0', '#673AB7', '#3F51B5', '#F44336', '#E91E63'];
    return defaultColors[hash % defaultColors.length];
};

// 기본 색상
const defaultColor = '#9C27B0';

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

    // 주간 이동 핸들러
    const navigateWeek = (direction) => {
        const newDate = moment(currentDate).add(direction, 'week').toDate();
        setCurrentDate(newDate);
    };

    // 커스텀 주간 뷰 컴포넌트
    const CustomWeekView = ({ date, localizer }) => {
        // 현재 주간의 시작일과 종료일 계산
        const start = moment(date).startOf('week');
        const end = moment(date).endOf('week');

        // 현재 주 표시
        const currentWeekText = `${start.format('YYYY년 MM월 DD일')} - ${end.format('MM월 DD일')}`;

        // 현재 주간에 해당하는 날짜들 생성 (7일)
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(moment(start).add(i, 'days'));
        }

        // 이벤트를 날짜별로 그룹화
        const eventsByDay = {};
        events.forEach(event => {
            const eventDate = moment(event.start).format('YYYY-MM-DD');
            if (!eventsByDay[eventDate]) {
                eventsByDay[eventDate] = [];
            }
            eventsByDay[eventDate].push(event);
        });

        const handleDayClick = (day) => {
            // 상세 페이지용 날짜 정보 저장
            setSelectedDay(day);

            // 해당 날짜의 이벤트 필터링
            const dateStr = day.format('YYYY-MM-DD');
            const filteredEvents = eventsByDay[dateStr] || [];
            setDayEvents(filteredEvents);

            // 상세 페이지 열기
            setDayDetailOpen(true);
        };

        return (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* 주간 네비게이션 */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                    px: 1
                }}>
                    <IconButton onClick={() => navigateWeek(-1)}>
                        <ChevronLeftIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 'medium', fontSize: isMobile ? '0.9rem' : '1.1rem' }}>
                        {currentWeekText}
                    </Typography>
                    <IconButton onClick={() => navigateWeek(1)}>
                        <ChevronRightIcon />
                    </IconButton>
                </Box>

                {/* 주간 일정 표시 */}
                <Box
                    ref={weekViewRef}
                    sx={{
                        flexGrow: 1,
                        overflow: 'auto',
                        pt: 1
                    }}
                >
                    {days.map((day) => {
                        const dateStr = day.format('YYYY-MM-DD');
                        const dayEvents = eventsByDay[dateStr] || [];
                        const isToday = day.isSame(moment(), 'day');

                        return (
                            <Box
                                key={dateStr}
                                sx={{
                                    mb: 2,
                                    backgroundColor: isToday ? 'rgba(25, 118, 210, 0.05)' : 'transparent',
                                    borderRadius: 1,
                                    border: isToday ? '1px solid rgba(25, 118, 210, 0.2)' : '1px solid #eee',
                                    cursor: 'pointer'
                                }}
                                onClick={() => handleDayClick(day)}
                            >
                                <Box
                                    sx={{
                                        py: 1,
                                        px: 2,
                                        backgroundColor: isToday ? 'primary.main' : 'grey.100',
                                        borderRadius: '4px 4px 0 0',
                                        color: isToday ? 'white' : 'inherit',
                                        fontWeight: isToday ? 'bold' : 'normal',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    {day.format('YYYY년 MM월 DD일 (ddd)')}
                                </Box>

                                {dayEvents.length === 0 ? (
                                    <Box sx={{ p: 2, color: 'text.secondary', fontSize: '0.9rem' }}>
                                        일정이 없습니다
                                    </Box>
                                ) : (
                                    dayEvents
                                        .sort((a, b) => moment(a.start).valueOf() - moment(b.start).valueOf())
                                        .map((event, idx) => (
                                            <Box
                                                key={idx}
                                                sx={{
                                                    p: 2,
                                                    borderBottom: idx < dayEvents.length - 1 ? '1px solid #eee' : 'none',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                                    }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                    <Box
                                                        sx={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: '50%',
                                                            backgroundColor: event.color || defaultColor,
                                                            mr: 1
                                                        }}
                                                    />
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                        {event.title}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
                                                </Typography>
                                                {event.createdBy && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        작성자: {event.createdBy}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ))
                                )}
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        );
    };

    // 커스텀 월간 뷰 컴포넌트
    const CustomMonthView = ({ date }) => {
        // 현재 월의 시작일과 종료일
        const start = moment(date).startOf('month').startOf('week');
        const end = moment(date).endOf('month').endOf('week');

        // 주 별로 날짜 생성
        const weeks = [];
        let days = [];
        let day = start.clone();

        while (day.isSameOrBefore(end, 'day')) {
            for (let i = 0; i < 7; i++) {
                days.push(day.clone());
                day.add(1, 'day');
            }
            weeks.push(days);
            days = [];
        }

        // 이벤트를 날짜별로 그룹화
        const eventsByDate = {};
        events.forEach(event => {
            const eventDate = moment(event.start).format('YYYY-MM-DD');
            if (!eventsByDate[eventDate]) {
                eventsByDate[eventDate] = [];
            }
            eventsByDate[eventDate].push(event);
        });

        const handleDateClick = (day) => {
            // 상세 페이지용 날짜 정보 저장
            setSelectedDay(day);

            // 해당 날짜의 이벤트 필터링
            const dateStr = day.format('YYYY-MM-DD');
            const filteredEvents = eventsByDate[dateStr] || [];
            setDayEvents(filteredEvents);

            // 상세 페이지 열기
            setDayDetailOpen(true);
        };

        const currentMonth = moment(date).month();

        // 요일 헤더
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

        return (
            <Box sx={{ height: '100%', overflow: 'auto' }}>
                {/* 요일 헤더 */}
                <Grid container sx={{ textAlign: 'center', py: 1, borderBottom: '1px solid #eee' }}>
                    {weekdays.map((day, idx) => (
                        <Grid item xs={12/7} key={idx} sx={{
                            color: idx === 0 ? 'error.main' : idx === 6 ? 'primary.main' : 'text.primary',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                        }}>
                            {day}
                        </Grid>
                    ))}
                </Grid>

                {/* 달력 내용 */}
                {weeks.map((week, weekIdx) => (
                    <Grid container key={weekIdx} sx={{
                        borderBottom: weekIdx < weeks.length - 1 ? '1px solid #f0f0f0' : 'none',
                        minHeight: isMobile ? '75px' : '100px',
                    }}>
                        {week.map((day, dayIdx) => {
                            const dateStr = day.format('YYYY-MM-DD');
                            const isToday = day.isSame(moment(), 'day');
                            const isCurrentMonth = day.month() === currentMonth;
                            const dayEvents = eventsByDate[dateStr] || [];

                            return (
                                <Grid
                                    item
                                    xs={12/7}
                                    key={dayIdx}
                                    sx={{
                                        borderRight: dayIdx < 6 ? '1px solid #f0f0f0' : 'none',
                                        p: 0.5,
                                        backgroundColor: isToday ? 'rgba(25, 118, 210, 0.05)' : 'transparent',
                                        color: !isCurrentMonth ? 'text.disabled' :
                                            dayIdx === 0 ? 'error.main' :
                                                dayIdx === 6 ? 'primary.main' : 'text.primary',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.02)'
                                        }
                                    }}
                                    onClick={() => handleDateClick(day)}
                                >
                                    {/* 날짜 표시 */}
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        width: isToday ? '24px' : 'auto',
                                        height: isToday ? '24px' : 'auto',
                                        borderRadius: isToday ? '50%' : 'none',
                                        backgroundColor: isToday ? 'primary.main' : 'transparent',
                                        color: isToday ? 'white' : 'inherit',
                                        mb: 0.5,
                                        fontWeight: isToday || day.date() === 1 ? 'bold' : 'normal',
                                        fontSize: '0.9rem'
                                    }}>
                                        {day.date()}
                                    </Box>

                                    {/* 일정 표시 */}
                                    <Box sx={{
                                        overflow: 'hidden',
                                        maxHeight: isMobile ? '40px' : '80px'
                                    }}>
                                        {dayEvents.slice(0, 3).map((event, idx) => (
                                            <Box
                                                key={idx}
                                                sx={{
                                                    backgroundColor: event.color || defaultColor,
                                                    color: 'white',
                                                    borderRadius: '3px',
                                                    fontSize: '0.7rem',
                                                    p: '1px 4px',
                                                    mb: 0.5,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                            >
                                                {event.title}
                                            </Box>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                                +{dayEvents.length - 3}개 더보기
                                            </Typography>
                                        )}
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                ))}
            </Box>
        );
    };

    // 일정 조회
    const fetchEvents = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('인증 토큰이 없습니다');
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
                return;
            }

            // 데이터가 있는지 확인
            if (scheduleData.length === 0) {
                setEvents([]);
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
                    // createdBy 필드 명시적 설정
                    createdBy: userName,
                    // 현재 로그인한 사용자가 작성한 일정인지 여부
                    isOwner: userId === user?.id
                };
            });

            setEvents(formattedEvents);
        } catch (error) {
            console.error('일정 조회 중 오류 발생:', error.response?.data || error.message);
        }
    }, [user]);

    // 컴포넌트 마운트 시 일정 조회
    useEffect(() => {
        if (user) {
            fetchEvents();
        }
    }, [user, fetchEvents]);

// 상세 페이지에서 일정 클릭 핸들러
    // 상세 페이지에서 일정 클릭 핸들러
    const handleEventClick = (event) => {
        setSelectedEvent(event);

        console.log('Clicked event full data:', {
            id: event.id,
            title: event.title,
            userId: event.userId,
            userEmail: event.userEmail,
            isOwner: event.isOwner
        });
        console.log('Current user:', user);

        // 소유자 여부에 따라 모드 설정
        setDialogMode(event.isOwner ? 'edit' : 'view');

        setDialogOpen(true);
    };

    // 상세 페이지에서 일정 추가 버튼 클릭 핸들러
    const handleAddEventFromDetail = () => {
        setSelectedSlot({
            start: selectedDay.toDate(),
            end: moment(selectedDay).add(1, 'hour').toDate()
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
                        isOwner: true
                    };

                    setEvents(prev => [...prev, newEvent]);

                    // 현재 상세 페이지에 표시된 이벤트 목록도 업데이트
                    if (selectedDay && moment(eventData.start).isSame(selectedDay, 'day')) {
                        setDayEvents(prev => [...prev, newEvent]);
                    }
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

                setEvents(prev => prev.map(event =>
                    event.id === selectedEvent.id ? updatedEvent : event
                ));

                // 상세 페이지에 표시된 이벤트 목록도 업데이트
                setDayEvents(prev => prev.map(event =>
                    event.id === selectedEvent.id ? updatedEvent : event
                ));
            }

            setDialogOpen(false);
        } catch (error) {
            console.error('일정 저장 중 오류 발생:', error.response?.data || error.message);
            setSnackbarMessage('일정 저장 중 오류가 발생했습니다.');
            setSnackbarOpen(true);
        }
    };

    // 일정 삭제 핸들러
    const handleDeleteEvent = async (eventId) => {
        // 현재 선택된 일정이 자신의 것인지 확인
        if (!selectedEvent?.isOwner) {
            setSnackbarMessage('다른 사용자의 일정은 삭제할 수 없습니다.');
            setSnackbarOpen(true);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await api.delete(`/schedules/${eventId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 삭제된 일정을 상태에서 제거
            setEvents(prev => prev.filter(event => event.id !== eventId));

            // 상세 페이지에 표시된 이벤트 목록도 업데이트
            setDayEvents(prev => prev.filter(event => event.id !== eventId));

            setDialogOpen(false);
        } catch (error) {
            console.error('일정 삭제 중 오류 발생:', error.response?.data || error.message);
            setSnackbarMessage('일정 삭제 중 오류가 발생했습니다.');
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
                mb: 2,
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
                flexDirection: 'column'
            }}>
                {/* 보증금 정보 */}
                <Paper sx={{
                    p: isMobile ? 1 : 2,
                    mb: 2,
                    bgcolor: '#f5f5f5',
                    borderRadius: isMobile ? 1 : 2
                }}>
                    <Typography
                        variant={isMobile ? "subtitle1" : "h6"}
                        component="div"
                        gutterBottom={!isMobile}
                    >
                        보증금: 1,000만원
                    </Typography>
                </Paper>

                {/* 탭 선택 (월간/주간) - 모바일에서만 표시 */}
                {isMobile && (
                    <Paper sx={{ mb: 2 }}>
                        <Tabs
                            value={view}
                            onChange={(e, newValue) => setView(newValue)}
                            variant="fullWidth"
                            centered
                        >
                            <Tab value="month" label="월간" />
                            <Tab value="week" label="주간" />
                        </Tabs>
                    </Paper>
                )}

                {/* 년/월 선택기 (월간 뷰에서만 표시) */}
                {view === 'month' && <YearMonthSelector />}

                {/* 캘린더 */}
                <Paper sx={{
                    p: isMobile ? 1 : 2,
                    flexGrow: 1,
                    borderRadius: isMobile ? 1 : 2
                }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%'
                    }}>
                        {/* 뷰에 따른 컴포넌트 렌더링 */}
                        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                            {view === 'month' ? (
                                <CustomMonthView date={currentDate} />
                            ) : (
                                <CustomWeekView
                                    date={currentDate}
                                    localizer={localizer}
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
                <Dialog
                    fullScreen={isMobile}
                    open={dayDetailOpen}
                    onClose={() => setDayDetailOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle sx={{
                        p: isMobile ? 2 : 3,
                        backgroundColor: 'primary.main',
                        color: 'white'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <IconButton
                                    edge="start"
                                    color="inherit"
                                    onClick={() => setDayDetailOpen(false)}
                                    sx={{ mr: 1 }}
                                >
                                    <ArrowBackIcon />
                                </IconButton>
                                <Typography variant="h6">
                                    {selectedDay ? selectedDay.format('YYYY년 MM월 DD일 (ddd)') : '날짜 상세'}
                                </Typography>
                            </Box>
                            <IconButton
                                color="inherit"
                                onClick={() => setDayDetailOpen(false)}
                                edge="end"
                            >
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ p: 0 }}>
                        {dayEvents.length === 0 ? (
                            <Box sx={{
                                p: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: isMobile ? 'calc(100vh - 64px)' : '300px'
                            }}>
                                <EventIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    일정이 없습니다
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddEventFromDetail}
                                    sx={{ mt: 2 }}
                                >
                                    새 일정 추가
                                </Button>
                            </Box>
                        ) : (
                            <List sx={{ p: 0 }}>
                                {dayEvents
                                    .sort((a, b) => moment(a.start).valueOf() - moment(b.start).valueOf())
                                    .map((event, index) => (
                                        <React.Fragment key={event.id || index}>
                                            <ListItem
                                                button
                                                onClick={() => handleEventClick(event)}
                                                sx={{
                                                    py: 2,
                                                    px: 3,
                                                    borderLeft: `4px solid ${event.color || defaultColor}`
                                                }}
                                            >
                                                <ListItemIcon sx={{ minWidth: '40px' }}>
                                                    <EventIcon sx={{ color: event.color || defaultColor }} />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                            {event.title}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <>
                                                            <Typography variant="body2" component="span">
                                                                {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
                                                            </Typography>
                                                            <br />
                                                            {event.description && (
                                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                                    {event.description}
                                                                </Typography>
                                                            )}
                                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                                                작성자: {event.userName || event.createdBy || '알 수 없음'}
                                                            </Typography>
                                                        </>
                                                    }
                                                />
                                            </ListItem>
                                            {index < dayEvents.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                            </List>
                        )}
                    </DialogContent>
                </Dialog>

                {/* 새 일정 추가 버튼 - 상세 페이지에서는 숨김 */}
                {!dayDetailOpen && (
                    <Fab
                        color="primary"
                        size={isMobile ? "medium" : "large"}
                        sx={{
                            position: 'fixed',
                            bottom: isMobile ? 16 : 20,
                            right: isMobile ? 16 : 20,
                            zIndex: 1000
                        }}
                        onClick={() => {
                            setSelectedSlot({
                                start: currentDate,
                                end: new Date(currentDate.getTime() + 60*60*1000)
                            });
                            setDialogMode('create');
                            setDialogOpen(true);
                        }}
                    >
                        <AddIcon />
                    </Fab>
                )}

                {/* 상세 페이지에서의 새 일정 추가 버튼 */}
                {dayDetailOpen && (
                    <Fab
                        color="primary"
                        size={isMobile ? "medium" : "large"}
                        sx={{
                            position: 'fixed',
                            bottom: isMobile ? 16 : 20,
                            right: isMobile ? 16 : 20,
                            zIndex: 1000
                        }}
                        onClick={handleAddEventFromDetail}
                    >
                        <AddIcon />
                    </Fab>
                )}

                {/* 알림 메시지 */}
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={4000}
                    onClose={handleSnackbarClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        onClose={handleSnackbarClose}
                        severity="info"
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
