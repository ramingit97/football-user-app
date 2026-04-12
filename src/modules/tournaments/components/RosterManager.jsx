import React, { useState } from 'react';
import { message } from 'antd';
import {
    useGetRosterQuery,
    useAddRosterPlayerMutation,
    useRemoveRosterPlayerMutation,
    useClaimRosterPlayerMutation,
    useApproveRosterClaimMutation,
} from '../../../store/tournamentsApi';

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'];
const posLabel = { GK: 'Вратарь', DEF: 'Защитник', MID: 'Полузащитник', FWD: 'Нападающий' };
const posColor = { GK: '#f6ad55', DEF: '#63b3ed', MID: '#68d391', FWD: '#fc8181' };

const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e0e6f0', fontSize: 13, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
};

const claimStatusConfig = {
    none:    { color: '#5a6b7a', bg: 'rgba(90,107,122,0.1)',   label: 'Без аккаунта' },
    pending: { color: '#f0c040', bg: 'rgba(240,192,64,0.1)',  label: 'Ожидает одобрения' },
    claimed: { color: '#48bb78', bg: 'rgba(72,187,120,0.1)',  label: 'Подтверждён' },
};

export default function RosterManager({ tournamentId, tournamentTeamId, isCaptain, currentUserId, teamName }) {
    const { data: roster = [], refetch } = useGetRosterQuery(
        { tournamentId, teamId: tournamentTeamId },
        { skip: !tournamentTeamId },
    );
    const [addPlayer, { isLoading: isAdding }] = useAddRosterPlayerMutation();
    const [removePlayer] = useRemoveRosterPlayerMutation();
    const [claimPlayer, { isLoading: isClaiming }] = useClaimRosterPlayerMutation();
    const [approveClaim] = useApproveRosterClaimMutation();

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', number: '', position: '', userId: '' });
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { message.error('Введите имя игрока'); return; }
        try {
            await addPlayer({
                tournamentId,
                teamId: tournamentTeamId,
                name: form.name.trim(),
                number: form.number ? Number(form.number) : undefined,
                position: form.position || undefined,
                userId: form.userId.trim() || undefined,
            }).unwrap();
            message.success('Игрок добавлен');
            setForm({ name: '', number: '', position: '', userId: '' });
            setShowForm(false);
            refetch();
        } catch (e) {
            message.error(e?.data?.message || 'Ошибка');
        }
    };

    const handleRemove = async (playerId) => {
        try {
            await removePlayer({ tournamentId, teamId: tournamentTeamId, playerId }).unwrap();
            refetch();
        } catch (e) {
            message.error(e?.data?.message || 'Ошибка');
        }
    };

    const handleClaim = async (playerId) => {
        try {
            await claimPlayer({ tournamentId, playerId }).unwrap();
            message.success('Заявка отправлена капитану!');
            refetch();
        } catch (e) {
            message.error(e?.data?.message || 'Ошибка');
        }
    };

    const handleApprove = async (playerId, approve) => {
        try {
            await approveClaim({ tournamentId, playerId, approve }).unwrap();
            message.success(approve ? 'Игрок подтверждён!' : 'Заявка отклонена');
            refetch();
        } catch (e) {
            message.error(e?.data?.message || 'Ошибка');
        }
    };

    // Check if current user already has a pending/confirmed claim in this roster
    const myClaimStatus = roster.find(p => p.userId === currentUserId || p.pendingClaimUserId === currentUserId);
    const canClaim = currentUserId && !myClaimStatus;

    // Pending claims that captain needs to review
    const pendingClaims = roster.filter(p => p.claimStatus === 'pending');

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#e0e6f0' }}>
                        {teamName ? `Состав: ${teamName}` : 'Состав команды'}
                    </div>
                    <div style={{ fontSize: 12, color: '#5a6b7a', marginTop: 3 }}>
                        {roster.length} игроков · {roster.filter(p => p.userId).length} с аккаунтом
                    </div>
                </div>
                {isCaptain && (
                    <button
                        onClick={() => setShowForm(p => !p)}
                        style={{
                            padding: '8px 18px', borderRadius: 9, border: 'none',
                            background: showForm ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg, #48bb78, #38a169)',
                            color: showForm ? '#a0b0c0' : '#fff',
                            fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        }}
                    >
                        {showForm ? '✕ Отмена' : '+ Добавить игрока'}
                    </button>
                )}
            </div>

            {/* Pending claims notice for captain */}
            {isCaptain && pendingClaims.length > 0 && (
                <div style={{
                    padding: '12px 16px', borderRadius: 10, marginBottom: 16,
                    background: 'rgba(240,192,64,0.07)',
                    border: '1px solid rgba(240,192,64,0.25)',
                }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f0c040', marginBottom: 10 }}>
                        ⏳ Заявки на подтверждение профиля ({pendingClaims.length})
                    </div>
                    {pendingClaims.map(p => (
                        <div key={p.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 0',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}>
                            <div style={{ flex: 1, fontSize: 13, color: '#c0d0e0' }}>
                                <span style={{ color: '#f0c040', fontWeight: 600 }}>{p.pendingClaimUserName}</span>
                                <span style={{ color: '#5a6b7a' }}> хочет быть «{p.name}»</span>
                            </div>
                            <button
                                onClick={() => handleApprove(p.id, true)}
                                style={{
                                    padding: '5px 12px', borderRadius: 7, border: 'none',
                                    background: 'rgba(72,187,120,0.15)',
                                    border: '1px solid rgba(72,187,120,0.3)',
                                    color: '#48bb78', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                                }}
                            >
                                ✓ Да, это он
                            </button>
                            <button
                                onClick={() => handleApprove(p.id, false)}
                                style={{
                                    padding: '5px 12px', borderRadius: 7, border: 'none',
                                    background: 'rgba(255,255,255,0.06)',
                                    color: '#7a8ba0', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                                }}
                            >
                                ✕ Нет
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* "Это я" banner for guests */}
            {canClaim && roster.some(p => !p.userId && p.claimStatus === 'none') && (
                <div style={{
                    padding: '12px 16px', borderRadius: 10, marginBottom: 16,
                    background: 'rgba(99,179,237,0.07)',
                    border: '1px solid rgba(99,179,237,0.2)',
                    fontSize: 13, color: '#a0b0c0',
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <span style={{ fontSize: 20 }}>👋</span>
                    <span>Видите своё имя в составе? Нажмите <strong style={{ color: '#63b3ed' }}>«Это я»</strong> рядом с ним.</span>
                </div>
            )}

            {/* Add form */}
            {isCaptain && showForm && (
                <form onSubmit={handleAdd} style={{
                    padding: '16px 18px', borderRadius: 12, marginBottom: 16,
                    background: 'rgba(72,187,120,0.05)',
                    border: '1px solid rgba(72,187,120,0.2)',
                }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#48bb78', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                        Новый игрок
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 10 }}>
                        <div>
                            <label style={{ fontSize: 11, color: '#7a8ba0', fontWeight: 600, display: 'block', marginBottom: 4 }}>Имя *</label>
                            <input style={inputStyle} placeholder="Полное имя" value={form.name} onChange={e => set('name', e.target.value)} />
                        </div>
                        <div style={{ width: 72 }}>
                            <label style={{ fontSize: 11, color: '#7a8ba0', fontWeight: 600, display: 'block', marginBottom: 4 }}>Номер</label>
                            <input type="number" min="1" max="99" style={{ ...inputStyle, textAlign: 'center' }}
                                placeholder="7" value={form.number} onChange={e => set('number', e.target.value)} />
                        </div>
                    </div>
                    {/* Position picker */}
                    <div style={{ marginBottom: 10 }}>
                        <label style={{ fontSize: 11, color: '#7a8ba0', fontWeight: 600, display: 'block', marginBottom: 6 }}>Позиция</label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {POSITIONS.map(pos => (
                                <button key={pos} type="button"
                                    onClick={() => set('position', form.position === pos ? '' : pos)}
                                    style={{
                                        padding: '6px 14px', borderRadius: 8, border: 'none',
                                        background: form.position === pos ? `${posColor[pos]}22` : 'rgba(255,255,255,0.06)',
                                        border: `1px solid ${form.position === pos ? posColor[pos] + '55' : 'rgba(255,255,255,0.08)'}`,
                                        color: form.position === pos ? posColor[pos] : '#7a8ba0',
                                        fontWeight: 700, fontSize: 11, cursor: 'pointer',
                                    }}
                                >
                                    {posLabel[pos]}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 11, color: '#7a8ba0', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                            ID пользователя <span style={{ color: '#4a5b6a', fontWeight: 400 }}>(если зарегистрирован)</span>
                        </label>
                        <input style={inputStyle} placeholder="Оставьте пустым если нет аккаунта"
                            value={form.userId} onChange={e => set('userId', e.target.value)} />
                    </div>
                    <button type="submit" disabled={isAdding} style={{
                        padding: '9px 22px', borderRadius: 8, border: 'none',
                        background: 'linear-gradient(135deg, #48bb78, #38a169)',
                        color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        opacity: isAdding ? 0.7 : 1,
                    }}>
                        {isAdding ? 'Добавляем...' : 'Добавить'}
                    </button>
                </form>
            )}

            {/* Empty state */}
            {roster.length === 0 && !showForm && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#4a5b6a' }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
                    <div style={{ fontSize: 14, color: '#5a6b7a' }}>
                        {isCaptain ? 'Добавьте игроков состава' : 'Капитан ещё не добавил игроков'}
                    </div>
                </div>
            )}

            {/* Roster list */}
            {roster.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Header row */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '32px 1fr auto auto',
                        gap: 10, padding: '4px 12px',
                        fontSize: 10, fontWeight: 700, color: '#4a5b6a',
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                        <span>#</span>
                        <span>Игрок</span>
                        <span>Статус</span>
                        <span></span>
                    </div>

                    {roster
                        .sort((a, b) => (a.number || 99) - (b.number || 99))
                        .map(player => {
                            const cs = claimStatusConfig[player.claimStatus] || claimStatusConfig.none;
                            const isMe = player.userId === currentUserId;
                            const myPendingClaim = player.pendingClaimUserId === currentUserId;
                            const canClaimThis = canClaim && !player.userId && player.claimStatus === 'none';

                            return (
                                <div key={player.id} style={{
                                    display: 'grid', gridTemplateColumns: '32px 1fr auto auto',
                                    gap: 10, padding: '10px 12px', borderRadius: 10,
                                    background: isMe ? 'rgba(72,187,120,0.07)' : 'rgba(255,255,255,0.04)',
                                    border: isMe
                                        ? '1px solid rgba(72,187,120,0.25)'
                                        : '1px solid rgba(255,255,255,0.07)',
                                    alignItems: 'center',
                                }}>
                                    {/* Number */}
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: player.position ? `${posColor[player.position]}20` : 'rgba(255,255,255,0.06)',
                                        border: `1px solid ${player.position ? posColor[player.position] + '40' : 'rgba(255,255,255,0.1)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 800,
                                        color: player.position ? posColor[player.position] : '#5a6b7a',
                                    }}>
                                        {player.number || '—'}
                                    </div>

                                    {/* Name + position */}
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{
                                            fontWeight: 600, fontSize: 14, color: '#e0e6f0',
                                            display: 'flex', alignItems: 'center', gap: 6,
                                        }}>
                                            {player.name}
                                            {isMe && <span style={{ fontSize: 10, color: '#48bb78', fontWeight: 700 }}>ВЫ</span>}
                                        </div>
                                        {player.position && (
                                            <div style={{ fontSize: 11, color: posColor[player.position], marginTop: 2, fontWeight: 600 }}>
                                                {posLabel[player.position]}
                                            </div>
                                        )}
                                        {/* Stats if any */}
                                        {(player.goals > 0 || player.assists > 0 || player.mvpCount > 0) && (
                                            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                                {player.goals > 0   && <span style={{ fontSize: 11, color: '#68d391' }}>⚽ {player.goals}</span>}
                                                {player.assists > 0 && <span style={{ fontSize: 11, color: '#63b3ed' }}>🅰 {player.assists}</span>}
                                                {player.mvpCount > 0 && <span style={{ fontSize: 11, color: '#f0c040' }}>⭐ {player.mvpCount}×MVP</span>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Claim status */}
                                    <span style={{
                                        padding: '3px 9px', borderRadius: 16,
                                        background: cs.bg, color: cs.color,
                                        fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                                    }}>
                                        {myPendingClaim ? '⏳ Ждём ответа' : cs.label}
                                    </span>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        {/* "Это я" button */}
                                        {canClaimThis && !myPendingClaim && (
                                            <button
                                                onClick={() => handleClaim(player.id)}
                                                disabled={isClaiming}
                                                style={{
                                                    padding: '5px 10px', borderRadius: 7, border: 'none',
                                                    background: 'rgba(99,179,237,0.15)',
                                                    border: '1px solid rgba(99,179,237,0.3)',
                                                    color: '#63b3ed', fontWeight: 700, fontSize: 11,
                                                    cursor: 'pointer', whiteSpace: 'nowrap',
                                                }}
                                            >
                                                Это я
                                            </button>
                                        )}
                                        {/* Delete button (captain only, can't delete claimed players easily) */}
                                        {isCaptain && player.claimStatus !== 'claimed' && (
                                            <button
                                                onClick={() => handleRemove(player.id)}
                                                style={{
                                                    background: 'none', border: 'none',
                                                    color: '#4a5b6a', cursor: 'pointer',
                                                    fontSize: 15, padding: '2px 5px',
                                                    borderRadius: 6,
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.color = '#fc8181'}
                                                onMouseLeave={e => e.currentTarget.style.color = '#4a5b6a'}
                                                title="Удалить"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}
        </div>
    );
}
