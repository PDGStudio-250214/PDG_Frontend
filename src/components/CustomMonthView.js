// src/components/CustomMonthView.js
import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import moment from 'moment';
import 'moment/locale/ko';
import HomeIcon from '@mui/icons-material/Home';
import PaymentIcon from '@mui/icons-material/Payment';

// 기본 색상
const defaultColor = '#9C27B0';

const CustomMonthView = ({ date, events, onDateClick, onEventClick, isMobile }) => {
    // 현재 월의 시작일과 종료일
    const start = moment(date).startOf('month').startOf('week');
    const end = moment(date).endOf('month').endOf('week');

    // 월세 납부일인지 확인하는 함수
    const isRentDueDate = (date) => {
        return date.date() === 23;
    };

    // 오늘보다 미래 날짜인지 체크
    const isFutureDate = (date) => {
        return date.isAfter(moment(), 'day');
    };

    // 월세 납부일 표시에 사용할 상태 확인 (납부 전/후)
    const getRentStatus = (date) => {
        if (!isRentDueDate(date)) return null;

        const currentMonth = moment().month();
        const cellMonth = date.month();

        // 현재 월이거나 미래 월인 경우 "납부 예정"
        if (date.isAfter(moment(), 'day') ||
            (date.date() === 23 && date.month() === moment().month() && date.date() >= moment().date())) {
            return "due";
        }
        // 과거 날짜인 경우 "납부 완료"
        else {
            return "paid";
        }
    };

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
        ? (weekCount > 5 ? 60 : 75) // 모바일에서 높이 조절
        : (weekCount > 5 ? 100 : 120); // 데스크톱에서 높이 조절

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
                py: isMobile ? 1.5 : 2,
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
                        fontSize: isMobile ? '0.85rem' : '1rem'
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
                        minHeight: isMobile ? '60px' : '100px',
                    }}>
                        {week.map((day, dayIdx) => {
                            const dateStr = day.format('YYYY-MM-DD');
                            const isToday = day.isSame(moment(), 'day');
                            const isCurrentMonth = day.month() === currentMonth;
                            const dayEvents = eventsByDate[dateStr] || [];
                            const rentStatus = getRentStatus(day);

                            return (
                                <Grid
                                    item
                                    xs={12/7}
                                    key={dayIdx}
                                    sx={{
                                        borderRight: dayIdx < 6 ? '1px solid #f0f0f0' : 'none',
                                        p: 0.5,
                                        backgroundColor: isToday
                                            ? 'rgba(25, 118, 210, 0.05)'
                                            : rentStatus === "due"
                                                ? 'rgba(255, 152, 0, 0.05)'
                                                : rentStatus === "paid"
                                                    ? 'rgba(76, 175, 80, 0.05)'
                                                    : 'transparent',
                                        color: !isCurrentMonth ? 'text.disabled' :
                                            dayIdx === 0 ? 'error.main' :
                                                dayIdx === 6 ? 'primary.main' : 'text.primary',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                        },
                                        overflow: 'hidden'
                                    }}
                                    onClick={() => handleDateClick(day)}
                                >
                                    {/* 월세 납부일 표시 */}
                                    {rentStatus && isCurrentMonth && (
                                        <Box sx={{
                                            position: 'absolute',
                                            top: 2,
                                            right: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            backgroundColor: rentStatus === "due" ? 'warning.main' : 'success.main',
                                            color: 'white',
                                            fontSize: '0.65rem',
                                            padding: '1px 4px',
                                            borderRadius: '4px',
                                            fontWeight: 'bold',
                                            zIndex: 5
                                        }}>
                                            <HomeIcon sx={{ fontSize: '0.85rem' }} />
                                            {rentStatus === "due" ? '월세' : '완료'}
                                        </Box>
                                    )}

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
                                        mb: 0.75,
                                        fontWeight: isToday || day.date() === 1
                                            ? 'bold'
                                            : isRentDueDate(day) && isCurrentMonth
                                                ? 'bold'
                                                : 'normal',
                                        fontSize: isMobile ? '0.85rem' : '1rem'
                                    }}>
                                        {day.date()}
                                    </Box>

                                    {/* 일정 표시 */}
                                    <Box sx={{
                                        overflow: 'auto',
                                        flexGrow: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '3px'
                                    }}>
                                        {/* 월세 납부일에 고정 이벤트 표시 */}
                                        {isRentDueDate(day) && isCurrentMonth && (
                                            <Box
                                                sx={{
                                                    backgroundColor: rentStatus === "due" ? '#FF9800' : '#4CAF50',
                                                    color: 'white',
                                                    borderRadius: '3px',
                                                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                                                    p: '2px 4px',
                                                    height: 'auto',
                                                    minHeight: isMobile ? '18px' : '22px',
                                                    lineHeight: isMobile ? '18px' : '22px',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5
                                                }}
                                            >
                                                <PaymentIcon sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }} />
                                                월세/공과금
                                            </Box>
                                        )}

                                        {/* 일반 일정 표시 */}
                                        {dayEvents.slice(0, isRentDueDate(day) && isCurrentMonth ? (isMobile ? 2 : 3) : (isMobile ? 3 : 4)).map((event, idx) => (
                                            <Box
                                                key={idx}
                                                sx={{
                                                    backgroundColor: event.color || defaultColor,
                                                    color: 'white',
                                                    borderRadius: '3px',
                                                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                                                    p: '2px 4px',
                                                    height: 'auto',
                                                    minHeight: isMobile ? '18px' : '22px',
                                                    lineHeight: isMobile ? '18px' : '22px',
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

                                        {/* 더 많은 일정이 있을 경우 표시 */}
                                        {dayEvents.length > (isRentDueDate(day) && isCurrentMonth ? (isMobile ? 2 : 3) : (isMobile ? 3 : 4)) && (
                                            <Typography variant="caption" sx={{
                                                color: 'text.secondary',
                                                fontSize: '0.7rem',
                                                mt: 0.5
                                            }}>
                                                +{dayEvents.length - (isRentDueDate(day) && isCurrentMonth ? (isMobile ? 2 : 3) : (isMobile ? 3 : 4))}개
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