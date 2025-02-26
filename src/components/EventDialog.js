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
    useTheme
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { Close, Delete } from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/ko';

const EventDialog = ({ open, onClose, mode, event, selectedSlot, onSave, onDelete, isMobile: propIsMobile }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState(moment().startOf('hour'));
    const [endTime, setEndTime] = useState(moment().startOf('hour').add(1, 'hour'));

    // 테마와 미디어 쿼리
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    // 부모로부터 전달받은 isMobile 값을 우선 사용하고, 없으면 미디어 쿼리 결과 사용
    const isMobile = propIsMobile !== undefined ? propIsMobile : isSmallScreen;

    // 선택한 날짜를 기준으로 설정
    const selectedDate = selectedSlot ? moment(selectedSlot.start).startOf('day') : moment().startOf('day');

    // 초기값 설정
    useEffect(() => {
        if (mode === 'edit' && event) {
            setTitle(event.title || '');
            setDescription(event.description || '');
            // 시간만 설정
            setStartTime(moment(event.start));
            setEndTime(moment(event.end));
        } else if (mode === 'create' && selectedSlot) {
            setTitle('');
            setDescription('');
            // 선택한 슬롯의 시간으로 설정
            setStartTime(moment(selectedSlot.start));
            setEndTime(moment(selectedSlot.end || moment(selectedSlot.start).add(1, 'hour')));
        }
    }, [mode, event, selectedSlot, open]);

    // 저장 처리
    const handleSave = () => {
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
                        {mode === 'create' ? '새 일정 추가' : '일정 수정'}
                    </Typography>
                    <IconButton onClick={onClose} size="small" edge="end">
                        <Close />
                    </IconButton>
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
                    {/* 기존 작성자 표시 (수정 모드일 때만) */}
                    {mode === 'edit' && event?.createdBy && (
                        <Box sx={{ mb: 0.5 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                작성자: {event.createdBy}
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
                    />

                    <Box sx={{ mt: 1, mb: 0.5 }}>
                        <Typography variant={isMobile ? "body2" : "subtitle1"} color="text.secondary">
                            날짜: {selectedDate.format('YYYY년 MM월 DD일 (ddd)')}
                        </Typography>
                    </Box>

                    <Box sx={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: 2
                    }}>
                        <TimePicker
                            label="시작 시간"
                            value={startTime}
                            onChange={setStartTime}
                            ampm={false}
                            minutesStep={15}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: isMobile ? "small" : "medium"
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
                            onChange={setEndTime}
                            ampm={false}
                            minutesStep={15}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: isMobile ? "small" : "medium"
                                }
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1
                                }
                            }}
                        />
                    </Box>

                    {/* 모바일에서 시간 빠른 선택 버튼 */}
                    {isMobile && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                빠른 시간 선택:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {[0, 1, 2, 3].map(hours => (
                                    <Button
                                        key={hours}
                                        variant="outlined"
                                        size="small"
                                        onClick={() => {
                                            const start = moment().startOf('hour').add(hours, 'hours');
                                            setStartTime(start);
                                            setEndTime(moment(start).add(1, 'hour'));
                                        }}
                                        sx={{ minWidth: '60px', fontSize: '0.7rem' }}
                                    >
                                        {moment().startOf('hour').add(hours, 'hours').format('HH:mm')}
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
                justifyContent: mode === 'edit' ? 'space-between' : 'flex-end',
                position: 'sticky',
                bottom: 0,
                zIndex: 1200,
                backgroundColor: 'white',
                borderTop: '1px solid #eee'
            }}>
                {mode === 'edit' && (
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
                        취소
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={!title}
                        size={isMobile ? "small" : "medium"}
                    >
                        저장
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default EventDialog;
