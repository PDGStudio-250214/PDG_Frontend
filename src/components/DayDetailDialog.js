// src/components/DayDetailDialog.js
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    Button,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Fab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import moment from 'moment';
import 'moment/locale/ko';

// 기본 색상
const defaultColor = '#9C27B0';

const DayDetailDialog = ({
                             open,
                             onClose,
                             selectedDay,
                             events,
                             onEventClick,
                             onAddEvent,
                             isMobile
                         }) => {
    if (!selectedDay) {
        return null;
    }

    return (
        <Dialog
            fullScreen={isMobile}
            open={open}
            onClose={onClose}
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
                            onClick={onClose}
                            sx={{ mr: 1 }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h6">
                            {selectedDay.format('YYYY년 MM월 DD일 (ddd)')}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                            color="inherit"
                            onClick={onAddEvent}
                            sx={{ mr: 1 }}
                        >
                            <AddIcon />
                        </IconButton>
                        <IconButton
                            color="inherit"
                            onClick={onClose}
                            edge="end"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0, position: 'relative' }}>
                {events.length === 0 ? (
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
                            onClick={onAddEvent}
                            sx={{ mt: 2 }}
                        >
                            새 일정 추가
                        </Button>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {events
                            .sort((a, b) => moment(a.start).valueOf() - moment(b.start).valueOf())
                            .map((event, index) => (
                                <React.Fragment key={event.id || index}>
                                    <ListItem
                                        button
                                        onClick={() => onEventClick(event)}
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
                                    {index < events.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                    </List>
                )}

                {/* 플로팅 액션 버튼 (모바일에서만 표시) */}
                {isMobile && events.length > 0 && (
                    <Fab
                        color="primary"
                        size="medium"
                        onClick={onAddEvent}
                        sx={{
                            position: 'fixed',
                            bottom: 16,
                            right: 16,
                            zIndex: 1000
                        }}
                    >
                        <AddIcon />
                    </Fab>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default DayDetailDialog;
