import { useState, useEffect } from 'react';
import { message, Input } from 'antd';
import {
    WalletOutlined, CheckOutlined, UserOutlined,
    SaveOutlined, DownOutlined, UpOutlined,
} from '@ant-design/icons';
import { useUpdatePaymentTrackingMutation, useUpdateGuestsMutation } from '../../../store/gamesApi';
import { useTranslation } from 'react-i18next';

const PaymentPanel = ({ game, currentUser }) => {
    const { t } = useTranslation();
    const STATUS_OPTIONS = [
        { key: 'paid_wallet', label: t('game.paymentPanel.payWallet'), emoji: '🟢', color: '#00c868' },
        { key: 'paid_cash',   label: t('game.paymentPanel.payCash'),   emoji: '🟡', color: '#f5a623' },
        { key: 'paid_card',   label: t('game.paymentPanel.payCard'),   emoji: '🔵', color: '#4f86f7' },
        { key: 'owes',        label: t('game.paymentPanel.owes'),      emoji: '🔴', color: '#f04438' },
    ];
    const [expanded, setExpanded] = useState(false);
    const [tracking, setTracking] = useState([]);
    const [guestNames, setGuestNames] = useState([]);
    const [dirty, setDirty] = useState(false);
    const [updatePaymentTracking, { isLoading: saving }] = useUpdatePaymentTrackingMutation();
    const [updateGuests, { isLoading: savingGuests }] = useUpdateGuestsMutation();

    // Build tracking list from game state
    useEffect(() => {
        if (!game) return;

        // Merge registered players (exclude guests — they come from game.guests below)
        const registeredEntries = (game.players || [])
            .filter(p => (p.userId || p.id) && p.type !== 'guest' && !p.isGuest)
            .map(p => {
                const existing = (game.paymentTracking || []).find(t => t.playerId === (p.userId || p.id));
                return existing || {
                    playerId: p.userId || p.id,
                    name: p.name || p.playerName || t('game.paymentPanel.defaultPlayerName'),
                    status: p.paidAmount > 0 ? 'paid_wallet' : 'owes',
                    amount: p.paidAmount || game.price || 0,
                    isGuest: false,
                };
            });

        // Add guests
        const guestEntries = (game.guests || []).map((g, i) => {
            const existing = (game.paymentTracking || []).find(t => t.playerId === g.id);
            return existing || {
                playerId: g.id,
                name: g.name || `Гость ${i + 1}`,
                status: 'owes',
                amount: game.price || 0,
                isGuest: true,
            };
        });

        setTracking([...registeredEntries, ...guestEntries]);
        setGuestNames((game.guests || []).map(g => ({ id: g.id, name: g.name || '' })));
        setDirty(false);
    }, [game]);

    const setStatus = (playerId, status) => {
        setTracking(prev => prev.map(t => t.playerId === playerId ? { ...t, status } : t));
        setDirty(true);
    };

    const setAmount = (playerId, amount) => {
        setTracking(prev => prev.map(t => t.playerId === playerId ? { ...t, amount } : t));
        setDirty(true);
    };

    const handleSave = async () => {
        try {
            await updatePaymentTracking({ id: game.id, organizerId: currentUser.id, tracking }).unwrap();
            // Save guest names too if changed
            const updatedGuests = (game.guests || []).map((g, i) => ({
                ...g,
                name: guestNames[i]?.name || g.name || '',
            }));
            if (updatedGuests.length > 0) {
                await updateGuests({ id: game.id, organizerId: currentUser.id, guests: updatedGuests }).unwrap();
            }
            setDirty(false);
            message.success(t('game.paymentPanel.saved'));
        } catch {
            message.error(t('game.paymentPanel.saveError'));
        }
    };

    const paidCount = tracking.filter(t => t.status !== 'owes').length;
    const owesCount = tracking.filter(t => t.status === 'owes').length;
    const totalCollected = tracking.filter(t => t.status !== 'owes').reduce((s, t) => s + Number(t.amount || 0), 0);

    const legionPaymentLabel = {
        self: t('game.paymentPanel.payTypeSelf'),
        cash: t('game.paymentPanel.payTypeCash'),
        organizer: t('game.paymentPanel.payTypeOrganizer'),
    }[game.legionPaymentType] || '';

    return (
        <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            marginBottom: 16,
            overflow: 'hidden',
        }}>
            {/* Header */}
            <button
                type="button"
                onClick={() => setExpanded(v => !v)}
                style={{
                    width: '100%', background: 'none', border: 'none',
                    padding: '14px 20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 12,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'rgba(245,166,35,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#f5a623', fontSize: 15, flexShrink: 0,
                    }}>
                        <WalletOutlined />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{
                            fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                            fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.2,
                        }}>
                            {t('game.paymentPanel.title')}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                            {legionPaymentLabel} · {t('game.paymentPanel.paidCount', { n: paidCount })}{owesCount > 0 ? ` · ${t('game.paymentPanel.owesCount', { n: owesCount })}` : ''}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {totalCollected > 0 && (
                        <span style={{
                            fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                            fontWeight: 800, fontSize: 16, color: '#00c868',
                        }}>
                            {totalCollected} ₼
                        </span>
                    )}
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                        {expanded ? <UpOutlined /> : <DownOutlined />}
                    </div>
                </div>
            </button>

            {expanded && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {tracking.length === 0 && (
                            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>
                                {t('game.paymentPanel.noPlayers')}
                            </div>
                        )}

                        {tracking.map((entry, i) => (
                            <PlayerPaymentRow
                                key={entry.playerId}
                                entry={entry}
                                isGuest={entry.isGuest}
                                guestName={entry.isGuest ? (guestNames.find(g => g.id === entry.playerId)?.name || '') : null}
                                onGuestNameChange={entry.isGuest ? (name) => {
                                    setGuestNames(prev => prev.map(g => g.id === entry.playerId ? { ...g, name } : g));
                                    setTracking(prev => prev.map(t => t.playerId === entry.playerId ? { ...t, name: name || t.name } : t));
                                    setDirty(true);
                                } : null}
                                onStatusChange={(status) => setStatus(entry.playerId, status)}
                                onAmountChange={(amount) => setAmount(entry.playerId, amount)}
                            />
                        ))}
                    </div>

                    {/* Summary */}
                    {tracking.length > 0 && (
                        <div style={{
                            marginTop: 16, padding: '12px 16px', borderRadius: 10,
                            background: 'var(--bg-raised)',
                            border: '1px solid var(--border-color)',
                            display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                        }}>
                            <div style={{ display: 'flex', gap: 20 }}>
                                {STATUS_OPTIONS.map(s => {
                                    const count = tracking.filter(t => t.status === s.key).length;
                                    if (count === 0) return null;
                                    return (
                                        <div key={s.key} style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                                            {s.emoji} {s.label}<br />
                                            <span style={{ fontWeight: 700, color: s.color, fontSize: 14 }}>{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{t('game.paymentPanel.collected')}</div>
                                <div style={{
                                    fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                                    fontWeight: 800, fontSize: 20, color: '#00c868',
                                }}>
                                    {totalCollected} ₼
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Save button */}
                    {dirty && (
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || savingGuests}
                            style={{
                                marginTop: 14, width: '100%', height: 42,
                                background: 'var(--green)', border: 'none', borderRadius: 10,
                                color: '#060c18',
                                fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                transition: 'opacity 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                        >
                            <SaveOutlined />
                            {saving || savingGuests ? t('game.paymentPanel.saving') : t('game.paymentPanel.save')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const PlayerPaymentRow = ({ entry, isGuest, guestName, onGuestNameChange, onStatusChange, onAmountChange }) => {
    const { t } = useTranslation();
    const STATUS_OPTIONS = [
        { key: 'paid_wallet', label: t('game.paymentPanel.payWallet'), emoji: '🟢', color: '#00c868' },
        { key: 'paid_cash',   label: t('game.paymentPanel.payCash'),   emoji: '🟡', color: '#f5a623' },
        { key: 'paid_card',   label: t('game.paymentPanel.payCard'),   emoji: '🔵', color: '#4f86f7' },
        { key: 'owes',        label: t('game.paymentPanel.owes'),      emoji: '🔴', color: '#f04438' },
    ];
    const current = STATUS_OPTIONS.find(s => s.key === entry.status) || STATUS_OPTIONS[3];

    return (
        <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: 'var(--bg-raised)',
            border: `1px solid ${entry.status === 'owes' ? 'rgba(240,68,56,0.15)' : 'var(--border-color)'}`,
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
            {/* Avatar / Guest indicator */}
            <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: isGuest ? 'rgba(124,106,247,0.15)' : 'rgba(0,232,122,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isGuest ? '#a590f7' : 'var(--green)', fontSize: 14,
            }}>
                <UserOutlined />
            </div>

            {/* Name */}
            <div style={{ flex: 1, minWidth: 80 }}>
                {isGuest && onGuestNameChange ? (
                    <Input
                        value={guestName}
                        onChange={e => onGuestNameChange(e.target.value)}
                        placeholder={`Гость`}
                        size="small"
                        style={{ fontSize: 13, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                ) : (
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {entry.name}
                        {isGuest && <span style={{ marginLeft: 6, fontSize: 11, color: '#a590f7' }}>{t('game.paymentPanel.guestLabel')}</span>}
                    </div>
                )}
            </div>

            {/* Amount */}
            <input
                type="number"
                value={entry.amount || 0}
                onChange={e => onAmountChange(Number(e.target.value))}
                style={{
                    width: 60, padding: '4px 8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 6, color: 'var(--text-secondary)',
                    fontSize: 13, textAlign: 'center',
                    outline: 'none',
                }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: -6 }}>₼</span>

            {/* Status pills */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {STATUS_OPTIONS.map(opt => {
                    const active = entry.status === opt.key;
                    return (
                        <button
                            key={opt.key}
                            type="button"
                            onClick={() => onStatusChange(opt.key)}
                            style={{
                                padding: '3px 8px', borderRadius: 6,
                                border: `1px solid ${active ? opt.color : 'var(--border-color)'}`,
                                background: active ? `${opt.color}20` : 'transparent',
                                color: active ? opt.color : 'var(--text-tertiary)',
                                fontSize: 11, fontWeight: active ? 700 : 400,
                                cursor: 'pointer', transition: 'all 0.1s',
                                display: 'flex', alignItems: 'center', gap: 3,
                            }}
                        >
                            {active && <CheckOutlined style={{ fontSize: 9 }} />}
                            {opt.emoji} {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default PaymentPanel;
