// src/pages/Calendar.js
import React, { useState, useEffect, useCallback } from 'react';
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
    IconButton,
    Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TodayIcon from '@mui/icons-material/Today';
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
    'pizza@test.com': '#FF5722',
    '1bfish106@test.com': '#2196F3',
    'hosk2014@test.com': '#4CAF50'
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

    // 모바일 환경 감지
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // 커스텀 주간 뷰 컴포넌트
    const CustomWeekView = ({ date, localizer }) => {
        // 현재 주간의 시작일과 종료일 계산
        const start = moment(date).startOf('week');
        const end = moment(date).endOf('week');

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

        return (
            <Box sx={{ height: '100%', overflow: 'auto', pt: 1 }}>
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
                            }}
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
                                            onClick={() => handleSelectEvent(event)}
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

            // 서버에서 받은 일정 데이터 변환
            const formattedEvents = scheduleData.map(event => {
                // 사용자 이메일 확인 (이벤트 생성자 또는 사용자 객체에서)
                const userEmail = event.user?.email || event.userEmail || 'unknown';

                return {
                    id: event.id,
                    title: event.title || '제목 없음',
                    description: event.description || '',
                    start: new Date(event.startDate || event.start),
                    end: new Date(event.endDate || event.end),
                    // 사용자별 색상 지정
                    color: userColors[userEmail] || defaultColor,
                    // 사용자 식별자 저장
                    userEmail: userEmail,
                    createdBy: event.user?.name || event.userName || userEmail
                };
            });

            setEvents(formattedEvents);
        } catch (error) {
            console.error('일정 조회 중 오류 발생:', error.response?.data || error.message);
        }
    }, []);

    // 컴포넌트 마운트 시 일정 조회
    useEffect(() => {
        if (user) {
            fetchEvents();
        }
    }, [user, fetchEvents]);

    // 일정 선택 핸들러
    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setDialogMode('edit');
        setDialogOpen(true);
    };

    // 시간대 선택 핸들러
    const handleSelectSlot = (slotInfo) => {
        setSelectedSlot({
            start: slotInfo.start,
            end: slotInfo.end
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
                        color: userColors[user?.email] || defaultColor,
                        userEmail: user?.email,
                        createdBy: user?.name || user?.email
                    };

                    setEvents(prev => [...prev, newEvent]);
                }
            } else {
                // 기존 일정 수정
                response = await api.put(`/schedules/${selectedEvent.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // 수정된 일정을 상태에서 업데이트
                setEvents(prev => prev.map(event =>
                    event.id === selectedEvent.id
                        ? {
                            ...event,
                            title: eventData.title,
                            description: eventData.description,
                            start: new Date(eventData.start),
                            end: new Date(eventData.end)
                        }
                        : event
                ));
            }

            setDialogOpen(false);

            // 일정 다시 조회 (최신 데이터 확보를 위해)
            setTimeout(() => fetchEvents(), 500);
        } catch (error) {
            console.error('일정 저장 중 오류 발생:', error.response?.data || error.message);
        }
    };

    // 일정 삭제 핸들러
    const handleDeleteEvent = async (eventId) => {
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/schedules/${eventId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 삭제된 일정을 상태에서 제거
            setEvents(prev => prev.filter(event => event.id !== eventId));
            setDialogOpen(false);
        } catch (error) {
            console.error('일정 삭제 중 오류 발생:', error.response?.data || error.message);
        }
    };

    // 사용자별 이벤트 스타일 설정
    const eventStyleGetter = (event) => {
        const backgroundColor = event.color || defaultColor;
        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block',
                fontSize: isMobile ? '0.7rem' : '0.9rem', // 모바일에서 글꼴 크기 줄임
                padding: isMobile ? '2px 4px' : '2px 5px', // 모바일에서 패딩 조정
            }
        };
    };

    // 이벤트 형식 지정
    const formats = {
        eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
            `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(end, 'HH:mm', culture)}`,
        timeGutterFormat: (date, culture, localizer) =>
            localizer.format(date, 'HH:mm', culture),
        monthHeaderFormat: date => localizer.format(date, isMobile ? 'YYYY년 MM월' : 'YYYY년 MMMM', 'ko'),
        dayHeaderFormat: date => localizer.format(date, isMobile ? 'M/D(ddd)' : 'YYYY년 MM월 DD일(ddd)', 'ko'),
        dayRangeHeaderFormat: ({ start, end }) =>
            isMobile
                ? `${localizer.format(start, 'M/D', 'ko')} - ${localizer.format(end, 'M/D', 'ko')}`
                : `${localizer.format(start, 'YYYY년 MM월 DD일', 'ko')} - ${localizer.format(end, 'YYYY년 MM월 DD일', 'ko')}`,
    };

    // 이벤트 내용 표시 컴포넌트
    const EventComponent = ({ event }) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <div style={{ fontWeight: 'bold' }}>{event.title}</div>
            {!isMobile && event.createdBy && (
                <div style={{ fontSize: '0.7em' }}>작성자: {event.createdBy}</div>
            )}
        </div>
    );

    // 내비게이션 컨트롤
    const CustomToolbar = ({ label, onNavigate, views, view, onView }) => {
        return (
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1,
                mb: 1
            }}>
                <Box>
                    <IconButton onClick={() => onNavigate('TODAY')}>
                        <TodayIcon />
                    </IconButton>
                    <IconButton onClick={() => onNavigate('PREV')}>
                        <NavigateBeforeIcon />
                    </IconButton>
                    <IconButton onClick={() => onNavigate('NEXT')}>
                        <NavigateNextIcon />
                    </IconButton>
                </Box>

                <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mx: 2 }}>
                    {label}
                </Typography>

                {!isMobile && (
                    <Box>
                        {Object.keys(views).map(viewName => (
                            <Button
                                key={viewName}
                                onClick={() => onView(viewName)}
                                color={view === viewName ? 'primary' : 'inherit'}
                            >
                                {viewName === 'month' ? '월간' : '주간'}
                            </Button>
                        ))}
                    </Box>
                )}
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

                {/* 캘린더 */}
                <Paper sx={{
                    p: isMobile ? 1 : 2,
                    flexGrow: 1,
                    borderRadius: isMobile ? 1 : 2
                }}>
                    {view === 'week' && isMobile ? (
                        <Box sx={{ height: '100%' }}>
                            <CustomToolbar
                                label={`${moment(currentDate).startOf('week').format('YYYY년 MM월 DD일')} - ${moment(currentDate).endOf('week').format('MM월 DD일')}`}
                                onNavigate={(action) => {
                                    let newDate = moment(currentDate);
                                    if (action === 'PREV') newDate = newDate.subtract(1, 'week');
                                    else if (action === 'NEXT') newDate = newDate.add(1, 'week');
                                    else if (action === 'TODAY') newDate = moment();
                                    setCurrentDate(newDate.toDate());
                                }}
                                views={{ month: true, week: true }}
                                view={view}
                                onView={setView}
                            />
                            <CustomWeekView
                                date={currentDate}
                                localizer={localizer}
                            />
                        </Box>
                    ) : (
                        <BigCalendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: '100%' }}
                            view={view}
                            onView={setView}
                            views={{ month: true, week: !isMobile }}
                            selectable
                            popup
                            onSelectEvent={handleSelectEvent}
                            onSelectSlot={handleSelectSlot}
                            eventPropGetter={eventStyleGetter}
                            formats={formats}
                            date={currentDate}
                            onNavigate={date => setCurrentDate(date)}
                            components={{
                                event: EventComponent,
                                toolbar: CustomToolbar
                            }}
                            messages={{
                                next: "다음",
                                previous: "이전",
                                today: "오늘",
                                month: "월간",
                                week: "주간",
                                day: "일간",
                                agenda: "일정목록",
                                date: "날짜",
                                time: "시간",
                                event: "일정",
                                allDay: "하루종일",
                                noEventsInRange: "일정이 없습니다",
                                showMore: total => `+${total}개`
                            }}
                        />
                    )}
                </Paper>

                {/* 새 일정 추가 버튼 */}
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
                />
            </Box>
        </LocalizationProvider>
    );
};

export default Calendar;
