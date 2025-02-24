// src/components/TransactionDialog.js
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';

const TransactionDialog = ({ open, onClose, selectedDate, type }) => {
    const [formData, setFormData] = useState({
        amount: '',
        date: selectedDate || new Date(),
        description: '',
        type: type || '월세',
        receipt: null
    });

    const handleSubmit = async () => {
        // API 호출 로직 구현
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{type || '거래'} 내역 추가</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel>종류</InputLabel>
                        <Select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <MenuItem value="월세">월세</MenuItem>
                            <MenuItem value="공과금">공과금</MenuItem>
                            <MenuItem value="기타">기타</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        label="금액"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        fullWidth
                    />

                    <DatePicker
                        label="날짜"
                        value={formData.date}
                        onChange={(newDate) => setFormData({ ...formData, date: newDate })}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                    />

                    <TextField
                        label="설명"
                        multiline
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        fullWidth
                    />

                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormData({ ...formData, receipt: e.target.files[0] })}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>취소</Button>
                <Button onClick={handleSubmit} variant="contained">저장</Button>
            </DialogActions>
        </Dialog>
    );
};

export default TransactionDialog;
