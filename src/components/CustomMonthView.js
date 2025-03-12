// src/components/CustomMonthView.js
import React from 'react';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import moment from 'moment';
import 'moment/locale/ko';

// 기본 색상
const defaultColor = '#9C27B0';

// 일정 타입별 색상 매핑
const eventTypeColors = {
    '대체공휴일': '#F44336', // 빨간색
    '예정': '#9C27B0',      // 보라색
    '삼일절': '#F44336',    // 빨간색
};

const CustomMonthView = ({ date, events, onDateClick, onEventClick, isMobile }) => {
    const theme = useTheme();

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
    const currentYear = moment(date).year();

    // 주 갯수에 따라 셀 높이 조정 (화면에 꽉 차게)
    const weekCount = weeks.length;
    // 모바일은 더 작게 설정하여 스크롤 가능하게
    const cellHeight = isMobile ? `${100 / weekCount}%` : `${100 / weekCount}%`;

    // 요일 헤더
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

    // 해당 날짜가 공휴일인지 확인하는 함수 (예시)
    const isHoliday = (day) => {
        // 공휴일 예시: 3월 1일(삼일절)
        return (day.month() === 2 && day.date() === 1);
    };

    // 이벤트 표시 스타일을 결정하는 함수
    const getEventStyle = (event) => {
        // 이벤트 타입에 따른 색상 설정
        let eventColor = event.color || defaultColor;

        // 이벤트 제목에서 타입 추출 (예: [MILLO]오후, MILLO오전 등)
        const titleLower = event.title?.toLowerCase() || '';

        // 이벤트 타입 매칭
        for (const [type, color] of Object.entries(eventTypeColors)) {
            if (titleLower.includes(type.toLowerCase())) {
                eventColor = color;
                break;
            }
        }

        return {
            backgroundColor: eventColor,
            color: 'white',
            borderRadius: '3px',
            fontSize: isMobile ? '0.68rem' : '0.75rem',
            p: '2px 4px',
            height: 'auto',
            minHeight: isMobile ? '18px' : '22px',
            lineHeight: isMobile ? '18px' : '22px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center'
        };
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            overflow: 'hidden'
        }}>
            {/* 요일 헤더 */}
            <Grid container sx={{
                textAlign: 'center',
                py: isMobile ? 1 : 1.5,
                borderBottom: '1px solid #ddd',
                position: 'sticky',
                top: 0,
                zIndex: 1,
                bgcolor: theme.palette.background.paper
            }}>
                {weekdays.map((day, idx) => (
                    <Grid item xs={12/7} key={idx} sx={{
                        color: idx === 0 ? 'error.main' : idx === 6 ? 'primary.main' : 'text.primary',
                        fontWeight: 'bold',
                        fontSize: isMobile ? '0.85rem' : '1rem'
                    }}>
                        {day}
                    </Grid>
                ))}
            </Grid>

            {/* 달력 내용 - 스크롤 가능하도록 설정 */}
            <Box sx={{
                flexGrow: 1,
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                    width: '4px'
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: '4px'
                }
            }}>
                {weeks.map((week, weekIdx) => (
                    <Grid container key={weekIdx} sx={{
                        borderBottom: weekIdx < weeks.length - 1 ? '1px solid #eee' : 'none',
                        height: isMobile ? 'auto' : cellHeight,
                        minHeight: isMobile ? '70px' : '80px'
                    }}>
                        {week.map((day, dayIdx) => {
                            const dateStr = day.format('YYYY-MM-DD');
                            const isToday = day.isSame(moment(), 'day');
                            const isCurrentMonth = day.month() === currentMonth;
                            const dateHoliday = isHoliday(day);
                            const dayEvents = eventsByDate[dateStr] || [];

                            // 날짜가 23일이면 월세/공과금 납부일
                            const isRentDay = day.date() === 23 && isCurrentMonth;

                            return (
                                <Grid
                                    item
                                    xs={12/7}
                                    key={dayIdx}
                                    sx={{
                                        borderRight: dayIdx < 6 ? '1px solid #eee' : 'none',
                                        p: 0.5,
                                        backgroundColor: isToday
                                            ? 'rgba(25, 118, 210, 0.08)'
                                            : isRentDay
                                                ? 'rgba(255, 152, 0, 0.05)'
                                                : 'transparent',
                                        color: !isCurrentMonth
                                            ? 'text.disabled'
                                            : dateHoliday || dayIdx === 0
                                                ? 'error.main'
                                                : dayIdx === 6
                                                    ? 'primary.main'
                                                    : 'text.primary',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.03)'
                                        },
                                        overflow: 'hidden'
                                    }}
                                    onClick={() => handleDateClick(day)}
                                >
                                    {/* 날짜 표시 */}
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: isToday ? '26px' : 'auto',
                                        height: isToday ? '26px' : 'auto',
                                        borderRadius: isToday ? '50%' : 'none',
                                        backgroundColor: isToday ? 'primary.main' : 'transparent',
                                        color: isToday ? 'white' : 'inherit',
                                        fontWeight: isToday || day.date() === 1 || isRentDay ? 'bold' : 'normal',
                                        fontSize: isMobile ? '0.9rem' : '1rem',
                                        mb: 0.5
                                    }}>
                                        {day.date()}
                                    </Box>

                                    {/* 월세/공과금 납부일 표시 */}
                                    {isRentDay && (
                                        <Box sx={{
                                            bgcolor: 'warning.light',
                                            color: 'warning.dark',
                                            fontSize: '0.65rem',
                                            p: '1px 2px',
                                            borderRadius: '2px',
                                            textAlign: 'center',
                                            mb: 0.5,
                                            mx: 'auto',
                                            width: 'fit-content'
                                        }}>
                                            월세
                                        </Box>
                                    )}

                                    {/* 일정 표시 */}
                                    <Box sx={{
                                        overflow: 'auto',
                                        flexGrow: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '2px',
                                        '&::-webkit-scrollbar': {
                                            width: '3px'
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            backgroundColor: 'rgba(0,0,0,0.1)',
                                            borderRadius: '3px'
                                        }
                                    }}>
                                        {dayEvents.slice(0, isMobile ? 3 : 4).map((event, idx) => (
                                            <Box
                                                key={idx}
                                                sx={getEventStyle(event)}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEventClick(event);
                                                }}
                                            >
                                                {event.title}
                                            </Box>
                                        ))}
                                        {dayEvents.length > (isMobile ? 3 : 4) && (
                                            <Typography variant="caption" sx={{
                                                color: 'text.secondary',
                                                fontSize: '0.65rem',
                                                mt: 0.5,
                                                textAlign: 'center'
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
