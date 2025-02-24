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
    Typography
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { Close, Delete } from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/ko';

const EventDialog = ({ open, onClose, mode, event, selectedSlot, onSave, onDelete }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState(moment().startOf('hour'));
    const [endTime, setEndTime] = useState(moment().startOf('hour').add(1, 'hour'));

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
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    {mode === 'create' ? '새 일정 추가' : '일정 수정'}
                    <IconButton onClick={onClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
                    {/* 기존 작성자 표시 (수정 모드일 때만) */}
                    {mode === 'edit' && event?.createdBy && (
                        <Box sx={{ mb: 1 }}>
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
                    />

                    <TextField
                        label="설명"
                        fullWidth
                        multiline
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <Box sx={{ mt: 2, mb: 1 }}>
                        <Typography variant="subtitle1">
                            선택한 날짜: {selectedDate.format('YYYY년 MM월 DD일')}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TimePicker
                            label="시작 시간"
                            value={startTime}
                            onChange={setStartTime}
                            ampm={false}
                            slotProps={{
                                textField: { fullWidth: true }
                            }}
                        />

                        <TimePicker
                            label="종료 시간"
                            value={endTime}
                            onChange={setEndTime}
                            ampm={false}
                            slotProps={{
                                textField: { fullWidth: true }
                            }}
                        />
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions>
                {mode === 'edit' && (
                    <Button
                        onClick={() => onDelete(event.id)}
                        color="error"
                        startIcon={<Delete />}
                        sx={{ mr: 'auto' }}
                    >
                        삭제
                    </Button>
                )}
                <Button onClick={onClose}>취소</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={!title}
                >
                    저장
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EventDialog;
