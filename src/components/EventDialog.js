// src/components/EventDialog.js
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    IconButton,
    Typography,
    useMediaQuery,
    useTheme,
    Chip
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Close, Delete, Lock, Edit } from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/ko';

const EventDialog = ({ open, onClose, mode, event, selectedSlot, onSave, onDelete, isMobile: propIsMobile, currentUser }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedDate, setSelectedDate] = useState(moment().startOf('day'));
    const [startTime, setStartTime] = useState(moment().startOf('hour'));
    const [endTime, setEndTime] = useState(moment().startOf('hour').add(1, 'hour'));
    const [isReadOnly, setIsReadOnly] = useState(false);

    // 테마와 미디어 쿼리
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    // 부모로부터 전달받은 isMobile 값을 우선 사용하고, 없으면 미디어 쿼리 결과 사용
    const isMobile = propIsMobile !== undefined ? propIsMobile : isSmallScreen;

    // 초기값 설정 및 읽기 전용 모드 체크
    useEffect(() => {
        if ((mode === 'edit' || mode === 'view') && event) {
            setTitle(event.title || '');
            setDescription(event.description || '');

            // 날짜와 시간 설정
            const eventStart = moment(event.start);
            setSelectedDate(eventStart.clone().startOf('day'));
            setStartTime(eventStart);
            setEndTime(moment(event.end));

            // mode가 'view'이거나 isOwner가 false면 읽기 전용
            setIsReadOnly(mode === 'view' || !event.isOwner);

            console.log('EventDialog mode:', mode, 'isOwner:', event.isOwner, 'setting isReadOnly:', mode === 'view' || !event.isOwner);
        } else if (mode === 'create' && selectedSlot) {
            setTitle('');
            setDescription('');

            // 선택한 슬롯의 날짜와 시간으로 설정
            const slotStart = moment(selectedSlot.start);
            setSelectedDate(slotStart.clone().startOf('day'));
            setStartTime(slotStart);
            setEndTime(moment(selectedSlot.end || moment(selectedSlot.start).add(1, 'hour')));

            setIsReadOnly(false);
        }
    }, [mode, event, selectedSlot, open, currentUser]);

    // 날짜 변경 핸들러
    const handleDateChange = (newDate) => {
        setSelectedDate(moment(newDate).startOf('day'));
    };

    // 저장 처리
    const handleSave = () => {
        if (isReadOnly) return;

        // 선택한 날짜와 시간을 결합
        const start = moment(selectedDate)
            .hour(startTime.hour())
            .minute(startTime.minute())
            .second(0);

        const end = moment(selectedDate)
            .hour(endTime.hour())
            .minute(endTime.minute())
            .second(0);

        // 종료 시간이 시작 시간보다 빠르면 다음 날로 설정
        if (end.isBefore(start)) {
            end.add(1, 'day');
        }

        const eventData = {
            title,
            description,
            start: start.toDate(),
            end: end.toDate(),
        };

        onSave(eventData);
    };

    // 읽기 전용 모드 토글
    const toggleReadOnly = () => {
        // 본인의 일정인 경우에만 토글 가능
        if (event?.userId === currentUser?.id) {
            setIsReadOnly(!isReadOnly);
        }
    };

    // 작성자 정보 가져오기
    const getCreatorName = () => {
        if (!event) return '';

        // name 필드가 있으면 우선 사용
        if (event.userName) return event.userName;
        if (event.createdBy) return event.createdBy;

        // 이메일을 보여주는 것보다 이름이 더 중요
        if (event.userEmail) return event.userEmail;

        return '알 수 없음';
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            fullScreen={isMobile} // 모바일에서는 전체 화면으로
        >
            <DialogTitle sx={{
                px: isMobile ? 2 : 3,
                pt: isMobile ? 2 : 3,
                position: 'sticky',
                top: 0,
                zIndex: 1200,
                backgroundColor: 'white',
                borderBottom: '1px solid #eee'
            }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant={isMobile ? "h6" : "h5"}>
                        {mode === 'create' ? '새 일정 추가' : isReadOnly ? '일정 상세' : '일정 수정'}
                        {isReadOnly && mode === 'edit' && (
                            <Chip
                                icon={<Lock fontSize="small" />}
                                label="읽기 전용"
                                size="small"
                                color="default"
                                sx={{ ml: 1, fontSize: '0.7rem' }}
                            />
                        )}
                    </Typography>
                    <Box>
                        {mode === 'edit' && event?.userId === currentUser?.id && (
                            <IconButton onClick={toggleReadOnly} size="small" sx={{ mr: 1 }}>
                                {isReadOnly ? <Edit fontSize="small" /> : <Lock fontSize="small" />}
                            </IconButton>
                        )}
                        <IconButton onClick={onClose} size="small" edge="end">
                            <Close />
                        </IconButton>
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent dividers sx={{
                px: isMobile ? 2 : 3,
                py: 2,
                overflowY: 'auto'
            }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? 1.5 : 2
                }}>
                    {/* 작성자 표시 (보기/수정 모드일 때만) */}
                    {(mode === 'edit' || mode === 'view') && event && (
                        <Box sx={{ mb: 0.5 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                작성자: {getCreatorName()}
                            </Typography>
                        </Box>
                    )}

                    <TextField
                        label="제목"
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        size={isMobile ? "small" : "medium"}
                        variant="outlined"
                        autoFocus
                        disabled={isReadOnly}
                        InputProps={{
                            readOnly: isReadOnly
                        }}
                    />

                    <TextField
                        label="설명"
                        fullWidth
                        multiline
                        rows={isMobile ? 2 : 3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        size={isMobile ? "small" : "medium"}
                        variant="outlined"
                        disabled={isReadOnly}
                        InputProps={{
                            readOnly: isReadOnly
                        }}
                    />

                    <Box sx={{ mt: 1, mb: 0.5 }}>
                        <Typography variant={isMobile ? "body2" : "subtitle1"} color="text.secondary" sx={{ mb: 1 }}>
                            일정 날짜 및 시간:
                        </Typography>
                    </Box>

                    {/* 날짜 선택 */}
                    <DatePicker
                        label="날짜"
                        value={selectedDate}
                        onChange={isReadOnly ? undefined : handleDateChange}
                        readOnly={isReadOnly}
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                size: isMobile ? "small" : "medium",
                                disabled: isReadOnly
                            }
                        }}
                        sx={{ mb: 2 }}
                    />

                    <Box sx={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: 2
                    }}>
                        <TimePicker
                            label="시작 시간"
                            value={startTime}
                            onChange={isReadOnly ? undefined : setStartTime}
                            ampm={false}
                            minutesStep={15}
                            readOnly={isReadOnly}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: isMobile ? "small" : "medium",
                                    InputProps: {
                                        readOnly: isReadOnly
                                    }
                                }
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1
                                }
                            }}
                        />

                        <TimePicker
                            label="종료 시간"
                            value={endTime}
                            onChange={isReadOnly ? undefined : setEndTime}
                            ampm={false}
                            minutesStep={15}
                            readOnly={isReadOnly}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: isMobile ? "small" : "medium",
                                    InputProps: {
                                        readOnly: isReadOnly
                                    }
                                }
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1
                                }
                            }}
                        />
                    </Box>

                    {/* 모바일에서 시간 빠른 선택 버튼 (읽기 전용이 아닐 때만) */}
                    {isMobile && !isReadOnly && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                빠른 시간 선택:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {[9, 12, 15, 18].map(hour => (
                                    <Button
                                        key={hour}
                                        variant="outlined"
                                        size="small"
                                        onClick={() => {
                                            const start = moment().hour(hour).minute(0);
                                            setStartTime(start);
                                            setEndTime(moment(start).add(1, 'hour'));
                                        }}
                                        sx={{ minWidth: '60px', fontSize: '0.7rem' }}
                                    >
                                        {hour}:00
                                    </Button>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{
                px: isMobile ? 2 : 3,
                py: isMobile ? 1.5 : 2,
                justifyContent: (mode === 'edit' && !isReadOnly) ? 'space-between' : 'flex-end',
                position: 'sticky',
                bottom: 0,
                zIndex: 1200,
                backgroundColor: 'white',
                borderTop: '1px solid #eee'
            }}>
                {mode === 'edit' && !isReadOnly && event?.userId === currentUser?.id && (
                    <Button
                        onClick={() => onDelete(event.id)}
                        color="error"
                        startIcon={<Delete />}
                        size={isMobile ? "small" : "medium"}
                    >
                        삭제
                    </Button>
                )}
                <Box>
                    <Button
                        onClick={onClose}
                        size={isMobile ? "small" : "medium"}
                        sx={{ mr: 1 }}
                    >
                        {isReadOnly ? '닫기' : '취소'}
                    </Button>
                    {!isReadOnly && (
                        <Button
                            onClick={handleSave}
                            variant="contained"
                            disabled={!title}
                            size={isMobile ? "small" : "medium"}
                        >
                            저장
                        </Button>
                    )}
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default EventDialog;
