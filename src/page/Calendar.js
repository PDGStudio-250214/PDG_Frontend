// src/pages/Calendar.js
import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ko';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Box, Paper, Tabs, Tab, Fab, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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

    // 일정 조회
    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('인증 토큰이 없습니다');
                return;
            }

            console.log('인증 토큰으로 일정 조회:', token.substring(0, 15) + '...');

            // 모든 일정을 조회하는 쿼리 파라미터 추가
            const response = await api.get('/schedules?all=true', {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('서버 응답:', response);

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
                console.log('일정 데이터가 없습니다.');
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

            console.log('변환된 일정 데이터:', formattedEvents);
            setEvents(formattedEvents);
        } catch (error) {
            console.error('일정 조회 중 오류 발생:', error.response?.data || error.message);
        }
    };

    // 컴포넌트 마운트 시 일정 조회
    useEffect(() => {
        if (user) {
            console.log('일정 데이터를 불러옵니다. 현재 사용자:', user);
            fetchEvents();
        }
    }, [user]);

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

            console.log('저장할 일정 데이터:', payload);

            let response;

            if (dialogMode === 'create') {
                // 새 일정 생성
                response = await api.post('/schedules', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('생성된 일정:', response.data);

                // 응답에서 일정 데이터 확인
                const createdSchedule = response.data.schedule || response.data;
                console.log('생성된 일정 데이터:', createdSchedule);

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

                    console.log('이벤트 배열에 추가할 새 일정:', newEvent);
                    setEvents(prev => [...prev, newEvent]);
                }
            } else {
                // 기존 일정 수정
                response = await api.put(`/schedules/${selectedEvent.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('수정된 일정:', response.data);

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
            setTimeout(() => fetchEvents(), 500); // 약간의 지연을 둠
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
                display: 'block'
            }
        };
    };

    // 이벤트 형식 지정
    const formats = {
        eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
            `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(end, 'HH:mm', culture)}`,
    };

    // 이벤트 내용 표시 컴포넌트
    const EventComponent = ({ event }) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <div style={{ fontWeight: 'bold' }}>{event.title}</div>
            {event.createdBy && (
                <div style={{ fontSize: '0.8em' }}>작성자: {event.createdBy}</div>
            )}
        </div>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <Box sx={{ p: 3, height: 'calc(100vh - 84px)' }}>
                {/* 보증금 정보 */}
                <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                    <Typography variant="h6" component="div" gutterBottom>
                        보증금: 1,000만원
                    </Typography>
                </Paper>

                {/* 탭 선택 (월간/주간) */}
                <Paper sx={{ mb: 2 }}>
                    <Tabs
                        value={view}
                        onChange={(e, newValue) => setView(newValue)}
                        variant="fullWidth"
                    >
                        <Tab value="month" label="월간" />
                        <Tab value="week" label="주간" />
                    </Tabs>
                </Paper>

                {/* 캘린더 */}
                <Paper sx={{ p: 2, height: 'calc(100% - 140px)' }}>
                    <BigCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        view={view}
                        onView={setView}
                        views={['month', 'week']}
                        step={60} // 1시간 단위
                        timeslots={1}
                        selectable
                        popup
                        onSelectEvent={handleSelectEvent}
                        onSelectSlot={handleSelectSlot}
                        eventPropGetter={eventStyleGetter}
                        formats={formats}
                        components={{
                            event: EventComponent
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
                            noEventsInRange: "표시할 일정이 없습니다.",
                            showMore: total => `+${total}개 더보기`
                        }}
                    />
                </Paper>

                {/* 새 일정 추가 버튼 */}
                <Fab
                    color="primary"
                    sx={{ position: 'fixed', bottom: 20, right: 20 }}
                    onClick={() => {
                        setSelectedSlot({ start: new Date(), end: new Date(new Date().getTime() + 60*60*1000) });
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
                />
            </Box>
        </LocalizationProvider>
    );
};

export default Calendar;
