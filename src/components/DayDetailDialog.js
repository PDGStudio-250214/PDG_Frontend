// src/components/DayDetailDialog.js
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    Box,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Divider,
    Fab,
    useMediaQuery,
    useTheme,
    AppBar,
    Toolbar
} from '@mui/material';
import { Close, Add as AddIcon, Event as EventIcon } from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/ko';

const DayDetailDialog = ({ open, onClose, selectedDay, events, onEventClick, onAddEvent, isMobile }) => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    // 선택된 날짜가 없는 경우 렌더링하지 않음
    if (!selectedDay) return null;

    // 요일과 날짜 포맷팅
    const isToday = selectedDay.isSame(moment(), 'day');
    const formattedDate = selectedDay.format('YYYY년 MM월 DD일');
    const dayOfWeek = selectedDay.format('dddd');

    // 주말 여부 확인
    const isWeekend = selectedDay.day() === 0 || selectedDay.day() === 6;

    // 요일 색상 설정
    const dayColor =
        selectedDay.day() === 0 ? 'error.main' :
            selectedDay.day() === 6 ? 'primary.main' :
                'text.primary';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={fullScreen}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    borderRadius: fullScreen ? 0 : 1,
                    height: fullScreen ? '100%' : 'auto',
                    maxHeight: fullScreen ? '100%' : '80vh'
                }
            }}
        >
            {/* 모바일 앱바 */}
            {fullScreen ? (
                <AppBar position="sticky" color="primary" elevation={0}>
                    <Toolbar>
                        <IconButton
                            edge="start"
                            color="inherit"
                            onClick={onClose}
                            aria-label="close"
                        >
                            <Close />
                        </IconButton>
                        <Typography variant="h6" sx={{ ml: 2, flex: 1 }}>
                            {formattedDate}
                        </Typography>
                        <IconButton color="inherit" onClick={onAddEvent}>
                            <AddIcon />
                        </IconButton>
                    </Toolbar>
                </AppBar>
            ) : (
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #eee',
                    pb: 1
                }}>
                    <Box>
                        <Typography variant="h6" component="div">
                            {formattedDate}
                        </Typography>
                        <Typography
                            variant="subtitle2"
                            color={dayColor}
                            sx={{ fontWeight: isWeekend ? 'bold' : 'normal' }}
                        >
                            {dayOfWeek}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} edge="end">
                        <Close />
                    </IconButton>
                </DialogTitle>
            )}

            <DialogContent
                sx={{
                    p: fullScreen ? 0 : 2,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* 일정 추가 버튼 (상단에 고정) */}
                <Box
                    sx={{
                        p: 2,
                        textAlign: 'center',
                        borderBottom: '1px solid #f0f0f0',
                        bgcolor: 'background.paper',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        display: !fullScreen ? 'block' : 'none' // 모바일에서는 앱바에 버튼이 있으므로 숨김
                    }}
                >
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={onAddEvent}
                        fullWidth
                    >
                        일정 추가
                    </Button>
                </Box>

                {/* 일정 목록 */}
                {events.length === 0 ? (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 8,
                        px: 2,
                        textAlign: 'center',
                        color: 'text.secondary',
                        flexGrow: 1
                    }}>
                        <EventIcon sx={{ fontSize: 48, mb: 2, color: 'action.disabled' }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            일정이 없습니다
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            새 일정을 추가해 보세요
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ pt: 0, width: '100%' }}>
                        {events
                            .sort((a, b) => moment(a.start).valueOf() - moment(b.start).valueOf())
                            .map((event, index) => (
                                <React.Fragment key={event.id || index}>
                                    <ListItem
                                        button
                                        onClick={() => onEventClick(event)}
                                        sx={{
                                            pl: 3,
                                            pr: 2,
                                            py: 2,
                                            borderLeft: `4px solid ${event.color || '#1976d2'}`,
                                            '&:hover': {
                                                backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                            }
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                                    {event.title}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box sx={{ mt: 0.5 }}>
                                                    <Typography variant="body2" component="span">
                                                        {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
                                                    </Typography>
                                                    {event.description && (
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                mt: 0.5,
                                                                color: 'text.secondary',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden'
                                                            }}
                                                        >
                                                            {event.description}
                                                        </Typography>
                                                    )}
                                                    {event.userName && (
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                display: 'block',
                                                                mt: 0.5,
                                                                color: 'text.secondary'
                                                            }}
                                                        >
                                                            작성자: {event.userName}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < events.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            ))}
                    </List>
                )}
            </DialogContent>

            {/* 모바일 하단 고정 버튼 */}
            {fullScreen && events.length > 0 && (
                <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
                    <Fab color="primary" onClick={onAddEvent}>
                        <AddIcon />
                    </Fab>
                </Box>
            )}

            {!fullScreen && (
                <DialogActions sx={{ borderTop: '1px solid #eee', px: 3, py: 2 }}>
                    <Button onClick={onClose} variant="outlined">
                        닫기
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

export default DayDetailDialog;
