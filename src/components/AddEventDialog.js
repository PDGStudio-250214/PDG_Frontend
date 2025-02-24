// src/components/AddEventDialog.js
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import koLocale from 'date-fns/locale/ko';

function AddEventDialog({ open, onClose, onAdd, selectedSlot }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(selectedSlot?.start || new Date());
    const [endDate, setEndDate] = useState(selectedSlot?.end || new Date());

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd({
            title,
            description,
            start: startDate,
            end: endDate,
        });
        setTitle('');
        setDescription('');
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={koLocale}>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>일정 추가</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="제목"
                            fullWidth
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                        <TextField
                            margin="dense"
                            label="설명"
                            fullWidth
                            multiline
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <DateTimePicker
                            label="시작 시간"
                            value={startDate}
                            onChange={setStartDate}
                            renderInput={(params) => <TextField {...params} fullWidth margin="dense" />}
                        />
                        <DateTimePicker
                            label="종료 시간"
                            value={endDate}
                            onChange={setEndDate}
                            renderInput={(params) => <TextField {...params} fullWidth margin="dense" />}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onClose}>취소</Button>
                        <Button type="submit" variant="contained">추가</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </LocalizationProvider>
    );
}

export default AddEventDialog;
