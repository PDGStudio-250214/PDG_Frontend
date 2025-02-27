// src/components/CustomMonthView.js
import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import moment from 'moment';
import 'moment/locale/ko';

// 기본 색상
const defaultColor = '#9C27B0';

const CustomMonthView = ({ date, events, onDateClick, onEventClick, isMobile }) => {
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
        onDateClick(day);
    };

    const currentMonth = moment(date).month();

    // 주 갯수 계산하여 cell 높이 조절
    const weekCount = weeks.length;
    const cellHeight = isMobile
        ? (weekCount > 5 ? 60 : 75) // 모바일에서 높이 증가
        : (weekCount > 5 ? 100 : 120); // 데스크톱에서 높이 증가

    // 요일 헤더
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

    return (
        <Box sx={{
            height: '100%',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* 요일 헤더 */}
            <Grid container sx={{
                textAlign: 'center',
                py: isMobile ? 1.5 : 2, // 헤더 높이 증가
                borderBottom: '1px solid #eee',
                position: 'sticky',
                top: 0,
                zIndex: 1,
                bgcolor: 'background.paper'
            }}>
                {weekdays.map((day, idx) => (
                    <Grid item xs={12/7} key={idx} sx={{
                        color: idx === 0 ? 'error.main' : idx === 6 ? 'primary.main' : 'text.primary',
                        fontWeight: 'bold',
                        fontSize: isMobile ? '0.85rem' : '1rem' // 폰트 크기 증가
                    }}>
                        {day}
                    </Grid>
                ))}
            </Grid>

            {/* 달력 내용 */}
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                {weeks.map((week, weekIdx) => (
                    <Grid container key={weekIdx} sx={{
                        borderBottom: weekIdx < weeks.length - 1 ? '1px solid #f0f0f0' : 'none',
                        height: cellHeight,
                        minHeight: isMobile ? '60px' : '100px', // 최소 높이 증가
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
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.02)'
                                        },
                                        overflow: 'hidden'
                                    }}
                                    onClick={() => handleDateClick(day)}
                                >
                                    {/* 날짜 표시 */}
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        width: isToday ? '24px' : 'auto', // 크기 증가
                                        height: isToday ? '24px' : 'auto', // 크기 증가
                                        borderRadius: isToday ? '50%' : 'none',
                                        backgroundColor: isToday ? 'primary.main' : 'transparent',
                                        color: isToday ? 'white' : 'inherit',
                                        mb: 0.75, // 마진 증가
                                        fontWeight: isToday || day.date() === 1 ? 'bold' : 'normal',
                                        fontSize: isMobile ? '0.85rem' : '1rem' // 폰트 크기 증가
                                    }}>
                                        {day.date()}
                                    </Box>

                                    {/* 일정 표시 */}
                                    <Box sx={{
                                        overflow: 'auto',
                                        flexGrow: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '3px' // 간격 증가
                                    }}>
                                        {dayEvents.slice(0, isMobile ? 3 : 4).map((event, idx) => ( // 표시 개수 증가
                                            <Box
                                                key={idx}
                                                sx={{
                                                    backgroundColor: event.color || defaultColor,
                                                    color: 'white',
                                                    borderRadius: '3px',
                                                    fontSize: isMobile ? '0.7rem' : '0.75rem', // 폰트 크기 증가
                                                    p: '2px 4px', // 패딩 증가
                                                    height: 'auto',
                                                    minHeight: isMobile ? '18px' : '22px', // 높이 증가
                                                    lineHeight: isMobile ? '18px' : '22px', // 줄 높이 증가
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: 'block'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEventClick(event);
                                                }}
                                            >
                                                {event.title}
                                            </Box>
                                        ))}
                                        {dayEvents.length > (isMobile ? 3 : 4) && ( // 표시 개수에 맞게 조정
                                            <Typography variant="caption" sx={{
                                                color: 'text.secondary',
                                                fontSize: '0.7rem', // 폰트 크기 증가
                                                mt: 0.5
                                            }}>
                                                +{dayEvents.length - (isMobile ? 3 : 4)}개
                                            </Typography>
                                        )}
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                ))}
            </Box>
        </Box>
    );
};

export default CustomMonthView;
