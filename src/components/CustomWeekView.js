// src/components/CustomWeekView.js
import React, { forwardRef } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import moment from 'moment';
import 'moment/locale/ko';

// 기본 색상
const defaultColor = '#9C27B0';

const CustomWeekView = forwardRef(({
                                       date,
                                       events,
                                       onDayClick,
                                       onEventClick,
                                       onNavigateWeek,
                                       isMobile
                                   }, ref) => {
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
                <IconButton onClick={() => onNavigateWeek(-1)}>
                    <ChevronLeftIcon />
                </IconButton>
                <Typography variant="h6" sx={{ fontWeight: 'medium', fontSize: isMobile ? '0.9rem' : '1.1rem' }}>
                    {currentWeekText}
                </Typography>
                <IconButton onClick={() => onNavigateWeek(1)}>
                    <ChevronRightIcon />
                </IconButton>
            </Box>

            {/* 주간 일정 표시 */}
            <Box
                ref={ref}
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
                            onClick={() => onDayClick(day)}
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
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEventClick(event);
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
                                            {event.userName && (
                                                <Typography variant="caption" color="text.secondary">
                                                    작성자: {event.userName}
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
});

export default CustomWeekView;
