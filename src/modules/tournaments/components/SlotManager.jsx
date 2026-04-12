import React, { useState } from 'react';
import { message, DatePicker, TimePicker } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
    useGetTournamentSlotsQuery,
    useAddSlotMutation,
    useDeleteSlotMutation,
} from '../../../store/tournamentsApi';

export default function SlotManager({ tournamentId, isOrganizer, matches = [] }) {
    const { t, i18n } = useTranslation();
    const ts = (k) => t(`tournaments.slot.${k}`);
    const locale = i18n.language === 'az' ? 'az' : 'ru';

    const { data: slots = [], refetch } = useGetTournamentSlotsQuery(tournamentId);
    const [addSlot, { isLoading: isAdding }] = useAddSlotMutation();
    const [deleteSlot] = useDeleteSlotMutation();

    const [showForm, setShowForm] = useState(false);
    const [stadiumName, setStadiumName] = useState('');
    const [stadiumAddress, setStadiumAddress] = useState('');
    const [date, setDate] = useState(null);           // dayjs
    const [timeRange, setTimeRange] = useState(null); // [dayjs, dayjs]

    const resetForm = () => {
        setStadiumName(''); setStadiumAddress('');
        setDate(null); setTimeRange(null);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!stadiumName || !date || !timeRange?.[0] || !timeRange?.[1]) {
            message.error(ts('fillAll'));
            return;
        }
        try {
            await addSlot({
                tournamentId,
                stadiumName,
                stadiumAddress,
                stadiumId: 'manual',
                date: date.format('YYYY-MM-DD'),
                startTime: timeRange[0].format('HH:mm'),
                endTime: timeRange[1].format('HH:mm'),
            }).unwrap();
            message.success(ts('addSuccess'));
            resetForm();
            setShowForm(false);
            refetch();
        } catch (err) {
            message.error(err?.data?.message || 'Error');
        }
    };

    const handleDelete = async (slotId) => {
        try {
            await deleteSlot({ tournamentId, slotId }).unwrap();
            refetch();
        } catch {
            message.error(ts('deleteFail'));
        }
    };

    // Status config (translated)
    const statusCfg = {
        available: { color: '#48bb78', bg: 'rgba(72,187,120,0.12)', label: ts('statusAvailable') },
        reserved:  { color: '#f0c040', bg: 'rgba(240,192,64,0.12)',  label: ts('statusReserved') },
        confirmed: { color: '#63b3ed', bg: 'rgba(99,179,237,0.12)', label: ts('statusConfirmed') },
    };

    // Group by date
    const byDate = slots.reduce((acc, s) => {
        if (!acc[s.date]) acc[s.date] = [];
        acc[s.date].push(s);
        return acc;
    }, {});

    const availableCount = slots.filter(s => s.status === 'available').length;
    const pendingMatches = matches.filter(m => m.stage === 'group' && m.status === 'scheduled').length;

    const inputStyle = {
        width: '100%', padding: '10px 14px', borderRadius: 8,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#e0e6f0', fontSize: 14, fontFamily: 'inherit',
        outline: 'none', boxSizing: 'border-box',
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h3 style={{ color: '#e0e6f0', fontWeight: 700, fontSize: 18, margin: 0 }}>{ts('title')}</h3>
                    <div style={{ fontSize: 13, color: '#5a6b7a', marginTop: 4 }}>
                        {ts('available')}: <span style={{ color: '#48bb78', fontWeight: 600 }}>{availableCount}</span>
                        {pendingMatches > 0 && (
                            <> · <span style={{ color: '#f0c040', fontWeight: 600 }}>{pendingMatches}</span> {ts('totalMatches')}</>
                        )}
                    </div>
                </div>
                {isOrganizer && (
                    <button
                        onClick={() => { setShowForm(p => !p); resetForm(); }}
                        style={{
                            padding: '9px 20px', borderRadius: 10, border: 'none',
                            background: showForm ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #48bb78, #38a169)',
                            color: showForm ? '#a0b0c0' : '#fff',
                            fontWeight: 700, fontSize: 14, cursor: 'pointer',
                        }}
                    >
                        {showForm ? ts('cancelBtn') : ts('addBtn')}
                    </button>
                )}
            </div>

            {/* Empty hint */}
            {isOrganizer && slots.length === 0 && !showForm && (
                <div style={{
                    padding: '24px', borderRadius: 14, marginBottom: 20,
                    background: 'rgba(240,192,64,0.06)',
                    border: '1px dashed rgba(240,192,64,0.25)',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
                    <div style={{ fontWeight: 700, color: '#f0c040', marginBottom: 6 }}>{ts('emptyHint')}</div>
                    <div style={{ fontSize: 13, color: '#7a8ba0', lineHeight: 1.6 }}>{ts('emptyHintDesc')}</div>
                </div>
            )}

            {/* Add form */}
            {isOrganizer && showForm && (
                <form onSubmit={handleAdd} style={{
                    padding: '22px', borderRadius: 14, marginBottom: 20,
                    background: 'rgba(72,187,120,0.05)',
                    border: '1px solid rgba(72,187,120,0.2)',
                }}>
                    <style>{`
                        .slot-picker .ant-picker {
                            background: rgba(255,255,255,0.06) !important;
                            border: 1px solid rgba(255,255,255,0.1) !important;
                            border-radius: 8px !important; width: 100%;
                        }
                        .slot-picker .ant-picker:hover,
                        .slot-picker .ant-picker-focused {
                            border-color: rgba(72,187,120,0.5) !important;
                            box-shadow: none !important;
                        }
                        .slot-picker .ant-picker-input input,
                        .slot-picker .ant-picker-range-separator { color: #e0e6f0 !important; font-size: 14px !important; }
                        .slot-picker .ant-picker-suffix,
                        .slot-picker .ant-picker-clear { color: #5a6b7a !important; }
                    `}</style>

                    <div style={{ fontSize: 12, fontWeight: 700, color: '#48bb78', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                        {ts('newSlot')}
                    </div>

                    {/* Stadium + Address */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, color: '#7a8ba0', fontWeight: 600, display: 'block', marginBottom: 5 }}>{ts('stadiumLabel')}</label>
                            <input style={inputStyle} placeholder={ts('stadiumPlaceholder')} value={stadiumName} onChange={e => setStadiumName(e.target.value)} />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: '#7a8ba0', fontWeight: 600, display: 'block', marginBottom: 5 }}>{ts('addressLabel')}</label>
                            <input style={inputStyle} placeholder={ts('addressPlaceholder')} value={stadiumAddress} onChange={e => setStadiumAddress(e.target.value)} />
                        </div>
                    </div>

                    {/* Date + Time range */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                        <div>
                            <label style={{ fontSize: 11, color: '#7a8ba0', fontWeight: 600, display: 'block', marginBottom: 5 }}>{ts('dateLabel')}</label>
                            <div className="slot-picker">
                                <DatePicker
                                    format="DD.MM.YYYY"
                                    value={date}
                                    onChange={setDate}
                                    disabledDate={d => d && d < dayjs().startOf('day')}
                                    style={{ width: '100%', padding: '9px 14px' }}
                                    placeholder={ts('dateLabel')}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: '#7a8ba0', fontWeight: 600, display: 'block', marginBottom: 5 }}>{ts('timeRangeLabel')}</label>
                            <div className="slot-picker">
                                <TimePicker.RangePicker
                                    format="HH:mm"
                                    minuteStep={30}
                                    value={timeRange}
                                    onChange={setTimeRange}
                                    style={{ width: '100%', padding: '9px 14px' }}
                                    placeholder={['13:00', '14:00']}
                                    order={false}
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={isAdding} style={{
                        padding: '10px 28px', borderRadius: 9, border: 'none',
                        background: 'linear-gradient(135deg, #48bb78, #38a169)',
                        color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                        opacity: isAdding ? 0.7 : 1,
                    }}>
                        {isAdding ? ts('adding') : ts('addSubmitBtn')}
                    </button>
                </form>
            )}

            {/* Slots list */}
            {slots.length > 0 ? (
                Object.entries(byDate)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([dateKey, daySlots]) => (
                        <div key={dateKey} style={{ marginBottom: 18 }}>
                            <div style={{
                                fontSize: 12, fontWeight: 700, color: '#7a8ba0',
                                textTransform: 'uppercase', letterSpacing: '0.08em',
                                marginBottom: 8, paddingLeft: 2,
                            }}>
                                {new Date(dateKey + 'T12:00').toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long' })}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {daySlots
                                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                    .map(slot => {
                                        const sc = statusCfg[slot.status] || statusCfg.available;
                                        return (
                                            <div key={slot.id} style={{
                                                display: 'flex', alignItems: 'center', gap: 14,
                                                padding: '12px 16px', borderRadius: 12,
                                                background: 'rgba(255,255,255,0.04)',
                                                border: `1px solid ${sc.color}30`,
                                            }}>
                                                <div style={{ fontWeight: 800, fontSize: 15, color: '#e0e6f0', minWidth: 110, whiteSpace: 'nowrap' }}>
                                                    {slot.startTime} – {slot.endTime}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, fontSize: 14, color: '#c0d0e0' }}>{slot.stadiumName}</div>
                                                    {slot.stadiumAddress && (
                                                        <div style={{ fontSize: 12, color: '#5a6b7a', marginTop: 2 }}>📍 {slot.stadiumAddress}</div>
                                                    )}
                                                </div>
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: 20,
                                                    background: sc.bg, color: sc.color,
                                                    fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                                                }}>
                                                    {sc.label}
                                                </span>
                                                {isOrganizer && slot.status === 'available' && (
                                                    <button
                                                        onClick={() => handleDelete(slot.id)}
                                                        style={{
                                                            background: 'none', border: 'none',
                                                            color: '#5a6b7a', cursor: 'pointer',
                                                            fontSize: 16, padding: '2px 6px', borderRadius: 6,
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.color = '#fc8181'}
                                                        onMouseLeave={e => e.currentTarget.style.color = '#5a6b7a'}
                                                    >✕</button>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    ))
            ) : (
                !isOrganizer && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#5a6b7a' }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
                        <div style={{ fontSize: 14, color: '#7a8ba0' }}>{ts('noSlots')}</div>
                    </div>
                )
            )}
        </div>
    );
}
