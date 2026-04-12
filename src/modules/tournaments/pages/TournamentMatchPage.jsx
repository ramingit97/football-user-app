import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, message } from 'antd';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
    useGetMatchQuery,
    useGetTournamentByIdQuery,
    useGetTournamentSlotsQuery,
    useEnterScoreMutation,
    useAssignWalkoverMutation,
    useProposeSlotMutation,
    useRespondToSlotMutation,
} from '../../../store/tournamentsApi';
import { API_BASE } from '../../../config';

function TeamHeader({ name, logo, score, isWinner, align = 'left' }) {
    const isRight = align === 'right';
    return (
        <div style={{ display: 'flex', flexDirection: isRight ? 'row-reverse' : 'row', alignItems: 'center', gap: 16, flex: 1 }}>
            {logo ? (
                <img src={logo} alt="" style={{
                    width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
                    border: isWinner ? '3px solid #f0c040' : '2px solid rgba(255,255,255,0.1)',
                    boxShadow: isWinner ? '0 0 20px rgba(240,192,64,0.4)' : 'none',
                }}/>
            ) : (
                <div style={{
                    width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #2a3550, #1a2540)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 900, color: isWinner ? '#f0c040' : '#a0b0c0',
                    border: isWinner ? '3px solid #f0c040' : '2px solid rgba(255,255,255,0.1)',
                    boxShadow: isWinner ? '0 0 20px rgba(240,192,64,0.4)' : 'none',
                }}>
                    {name?.substring(0, 2).toUpperCase()}
                </div>
            )}
            <div style={{ textAlign: isRight ? 'right' : 'left' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: isWinner ? '#e0e6f0' : '#a0b0c0', lineHeight: 1.2 }}>
                    {name}
                </div>
                {score !== null && score !== undefined && (
                    <div style={{ fontSize: 42, fontWeight: 900, lineHeight: 1, color: isWinner ? '#f0c040' : '#5a6b7a', marginTop: 4 }}>
                        {score}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Score entry panel (organizer) ── */
function ScoreEntryPanel({ match, tournamentId, onDone }) {
    const { t } = useTranslation();
    const tm = (k) => t(`tournaments.match.${k}`);
    const [homeScore, setHomeScore] = useState(match.homeScore ?? 0);
    const [awayScore, setAwayScore] = useState(match.awayScore ?? 0);
    const [winnerId, setWinnerId] = useState('');
    const [enterScore, { isLoading: isSaving }] = useEnterScoreMutation();
    const [assignWalkover, { isLoading: isWalkover }] = useAssignWalkoverMutation();

    const isDraw = Number(homeScore) === Number(awayScore);
    const isPlayoff = match.stage !== 'group';

    const handleScore = async () => {
        try {
            const body = { homeScore: Number(homeScore), awayScore: Number(awayScore) };
            if (isPlayoff && isDraw) {
                if (!winnerId) { message.warning(tm('penaltyWinner')); return; }
                body.winnerId = winnerId;
            }
            await enterScore({ tournamentId, matchId: match.id, ...body }).unwrap();
            message.success(tm('saveScore'));
            onDone();
        } catch (e) {
            message.error(e?.data?.message || 'Error');
        }
    };

    const handleWalkover = async (winnerTeamId) => {
        try {
            await assignWalkover({ tournamentId, matchId: match.id, winnerTeamId }).unwrap();
            message.success(tm('walkoverTitle'));
            onDone();
        } catch (e) {
            message.error(e?.data?.message || 'Error');
        }
    };

    return (
        <div style={{ padding: '20px 22px', borderRadius: 14, background: 'rgba(72,187,120,0.06)', border: '1px solid rgba(72,187,120,0.2)', marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#48bb78', marginBottom: 18 }}>{tm('scoreEntry')}</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#7a8ba0', marginBottom: 6 }}>{match.homeTeamName}</div>
                    <input
                        type="number" min="0" max="99" value={homeScore}
                        onChange={e => setHomeScore(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: 10, textAlign: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#e0e6f0', fontSize: 28, fontWeight: 900 }}
                    />
                </div>
                <div style={{ color: '#4a5b6a', fontSize: 22, fontWeight: 300 }}>:</div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#7a8ba0', marginBottom: 6 }}>{match.awayTeamName}</div>
                    <input
                        type="number" min="0" max="99" value={awayScore}
                        onChange={e => setAwayScore(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: 10, textAlign: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#e0e6f0', fontSize: 28, fontWeight: 900 }}
                    />
                </div>
            </div>

            {isPlayoff && isDraw && (
                <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(240,192,64,0.08)', border: '1px solid rgba(240,192,64,0.2)' }}>
                    <div style={{ fontSize: 12, color: '#f0c040', marginBottom: 8, fontWeight: 600 }}>{tm('penaltyWinner')}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[{ id: match.homeTeamId, name: match.homeTeamName }, { id: match.awayTeamId, name: match.awayTeamName }].map(team => (
                            <button key={team.id} onClick={() => setWinnerId(team.id)} style={{
                                flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: winnerId === team.id ? 'rgba(240,192,64,0.25)' : 'rgba(255,255,255,0.06)',
                                color: winnerId === team.id ? '#f0c040' : '#a0b0c0',
                                fontWeight: 700, fontSize: 13,
                                outline: winnerId === team.id ? '2px solid rgba(240,192,64,0.5)' : 'none',
                            }}>
                                {team.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleScore} disabled={isSaving} style={{
                    flex: 1, padding: '11px', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, #48bb78, #38a169)',
                    color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                }}>
                    {isSaving ? tm('savingScore') : tm('saveScore')}
                </button>
                <button onClick={() => handleWalkover(match.homeTeamId)} disabled={isWalkover}
                    title={`${tm('walkoverTitle')} ${match.homeTeamName}`}
                    style={{ padding: '11px 14px', borderRadius: 10, border: 'none', background: 'rgba(224,123,32,0.15)', color: '#e07b20', fontWeight: 600, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    🚩 {match.homeTeamName.substring(0, 8)}
                </button>
                <button onClick={() => handleWalkover(match.awayTeamId)} disabled={isWalkover}
                    title={`${tm('walkoverTitle')} ${match.awayTeamName}`}
                    style={{ padding: '11px 14px', borderRadius: 10, border: 'none', background: 'rgba(224,123,32,0.15)', color: '#e07b20', fontWeight: 600, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    🚩 {match.awayTeamName.substring(0, 8)}
                </button>
            </div>
        </div>
    );
}

/* ── Slot scheduling panel ── */
function SlotPanel({ match, tournamentId, slots, userId, myTournamentTeam }) {
    const { t, i18n } = useTranslation();
    const tm = (k) => t(`tournaments.match.${k}`);
    const locale = i18n.language === 'az' ? 'az' : 'ru';
    const [showSlots, setShowSlots] = useState(false);
    const [proposing, setProposing] = useState(false);
    const [responding, setResponding] = useState(false);
    const [proposeSlot] = useProposeSlotMutation();
    const [respondToSlot] = useRespondToSlotMutation();

    const isHomeCaptain = myTournamentTeam && match.homeTeamId === myTournamentTeam.teamId;
    const isAwayCaptain = myTournamentTeam && match.awayTeamId === myTournamentTeam.teamId;
    const isParticipant = isHomeCaptain || isAwayCaptain;

    const canPropose = match.status === 'scheduled' && isParticipant;
    const canRespond = match.status === 'slot_pending' && isParticipant && userId !== match.pendingSlotProposedBy;
    const myProposalPending = match.status === 'slot_pending' && userId === match.pendingSlotProposedBy;

    const confirmedSlot = match.slotId ? slots.find(s => s.id === match.slotId) : null;
    const pendingSlot = match.pendingSlotId ? slots.find(s => s.id === match.pendingSlotId) : null;
    const availableSlots = slots.filter(s => s.status === 'available');

    const handlePropose = async (slotId) => {
        setProposing(true);
        try {
            await proposeSlot({ tournamentId, matchId: match.id, slotId }).unwrap();
            message.success(tm('slotProposed'));
            setShowSlots(false);
        } catch (e) {
            message.error(e?.data?.message || 'Error');
        }
        setProposing(false);
    };

    const handleRespond = async (accept) => {
        setResponding(true);
        try {
            await respondToSlot({ tournamentId, matchId: match.id, accept }).unwrap();
            message.success(accept ? tm('slotConfirm') : tm('slotDecline'));
        } catch (e) {
            message.error(e?.data?.message || 'Error');
        }
        setResponding(false);
    };

    if (match.status === 'played' || match.status?.startsWith('walkover')) return null;

    return (
        <div style={{ marginBottom: 20 }}>
            {confirmedSlot && (
                <div style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(99,179,237,0.08)', border: '1px solid rgba(99,179,237,0.2)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#63b3ed', marginBottom: 10 }}>{tm('slotVenueTitle')}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#e0e6f0', marginBottom: 4 }}>
                        {new Date(confirmedSlot.date + 'T12:00').toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long' })}
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#f0c040', marginBottom: 8 }}>
                        {confirmedSlot.startTime} — {confirmedSlot.endTime}
                    </div>
                    {confirmedSlot.stadiumName && (
                        <div style={{ fontSize: 14, color: '#a0b0c0' }}>
                            🏟 {confirmedSlot.stadiumName}
                            {confirmedSlot.stadiumAddress && ` · ${confirmedSlot.stadiumAddress}`}
                        </div>
                    )}
                </div>
            )}

            {canRespond && pendingSlot && (
                <div style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(240,192,64,0.07)', border: '1px solid rgba(240,192,64,0.25)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f0c040', marginBottom: 10 }}>{tm('slotPendingTitle')}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#e0e6f0', marginBottom: 4 }}>
                        {new Date(pendingSlot.date + 'T12:00').toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long' })}
                        &nbsp;·&nbsp;{pendingSlot.startTime} — {pendingSlot.endTime}
                    </div>
                    {pendingSlot.stadiumName && (
                        <div style={{ fontSize: 13, color: '#a0b0c0', marginBottom: 14 }}>📍 {pendingSlot.stadiumName}</div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleRespond(true)} disabled={responding}
                            style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #48bb78, #38a169)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                            {tm('slotConfirm')}
                        </button>
                        <button onClick={() => handleRespond(false)} disabled={responding}
                            style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#a0b0c0', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                            {tm('slotDecline')}
                        </button>
                    </div>
                </div>
            )}

            {myProposalPending && (
                <div style={{ padding: '14px 18px', borderRadius: 14, background: 'rgba(240,192,64,0.07)', border: '1px solid rgba(240,192,64,0.2)', color: '#f0c040', fontSize: 13, fontWeight: 600 }}>
                    {tm('slotMyPending')}
                </div>
            )}

            {canPropose && !match.slotId && (
                <div>
                    {!showSlots ? (
                        <button onClick={() => setShowSlots(true)} style={{
                            padding: '10px 20px', borderRadius: 10, border: 'none',
                            background: 'rgba(72,187,120,0.12)', color: '#48bb78',
                            fontWeight: 600, fontSize: 13, cursor: 'pointer',
                        }}>
                            {tm('slotPropose')}
                        </button>
                    ) : (
                        <div style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(72,187,120,0.06)', border: '1px solid rgba(72,187,120,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#48bb78' }}>{tm('slotChoose')}</span>
                                <button onClick={() => setShowSlots(false)} style={{ background: 'none', border: 'none', color: '#5a6b7a', cursor: 'pointer', fontSize: 18 }}>✕</button>
                            </div>
                            {availableSlots.length === 0 ? (
                                <div style={{ fontSize: 13, color: '#5a6b7a', textAlign: 'center', padding: '12px 0' }}>
                                    {tm('slotNoAvailable')}
                                </div>
                            ) : (
                                availableSlots.map(slot => (
                                    <button key={slot.id} onClick={() => handlePropose(slot.id)} disabled={proposing}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.04)', color: '#c0d0e0', cursor: 'pointer', textAlign: 'left', fontSize: 13, marginBottom: 6, display: 'flex', gap: 12, alignItems: 'center' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(72,187,120,0.1)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                    >
                                        <span style={{ fontWeight: 700, color: '#e0e6f0', minWidth: 100 }}>{slot.startTime} – {slot.endTime}</span>
                                        <span>{new Date(slot.date + 'T12:00').toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                                        <span style={{ color: '#7a8ba0', fontSize: 12, marginLeft: 'auto' }}>📍 {slot.stadiumName}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════ */
export default function TournamentMatchPage() {
    const { id: tournamentId, matchId } = useParams();
    const navigate = useNavigate();
    const user = useSelector(s => s.auth.user);
    const socketRef = useRef(null);
    const { t, i18n } = useTranslation();
    const tm = (k) => t(`tournaments.match.${k}`);
    const locale = i18n.language === 'az' ? 'az' : 'ru';

    const { data: matchData, isLoading, refetch } = useGetMatchQuery({ tournamentId, matchId });
    const { data: tournament } = useGetTournamentByIdQuery(tournamentId);
    const { data: slots = [], refetch: refetchSlots } = useGetTournamentSlotsQuery(tournamentId);

    useEffect(() => {
        const socket = io(API_BASE, { transports: ['websocket'] });
        socketRef.current = socket;
        socket.emit('joinTournamentRoom', tournamentId);
        socket.on('matchUpdated', () => { refetch(); refetchSlots(); });
        socket.on('slotAdded', () => refetchSlots());
        return () => { socket.emit('leaveTournamentRoom', tournamentId); socket.disconnect(); };
    }, [tournamentId]);

    const statusConfig = {
        scheduled:     { color: '#7a8ba0', bg: 'rgba(122,139,160,0.12)', label: tm('statusScheduled'),   icon: '📋' },
        slot_pending:  { color: '#f0c040', bg: 'rgba(240,192,64,0.12)',  label: tm('statusSlotPending'),  icon: '⏳' },
        confirmed:     { color: '#63b3ed', bg: 'rgba(99,179,237,0.12)', label: tm('statusConfirmed'),    icon: '✅' },
        played:        { color: '#48bb78', bg: 'rgba(72,187,120,0.12)', label: tm('statusPlayed'),       icon: '⚽' },
        walkover_home: { color: '#e07b20', bg: 'rgba(224,123,32,0.12)', label: tm('statusWalkoverHome'), icon: '🚩' },
        walkover_away: { color: '#e07b20', bg: 'rgba(224,123,32,0.12)', label: tm('statusWalkoverAway'), icon: '🚩' },
    };

    const stageLabel = {
        group:        tm('group'),
        quarterfinal: tm('quarterfinal'),
        semifinal:    tm('semifinal'),
        final:        tm('final'),
    };

    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!matchData) {
        return (
            <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a8ba0', fontSize: 18 }}>
                {tm('notFound')}
            </div>
        );
    }

    const match = matchData;
    const slot = matchData.slot;

    const isOrganizer = user?.id && tournament?.organizerId === user.id;
    const myTournamentTeam = tournament?.teams?.find(reg => reg.captainId === user?.id);

    const isPlayed = match.status === 'played' || match.status?.startsWith('walkover');
    const homeWins = isPlayed && (
        match.status === 'walkover_home' ||
        (match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore) ||
        match.winnerId === match.homeTeamId
    );
    const awayWins = isPlayed && !homeWins;

    const status = statusConfig[match.status] || statusConfig.scheduled;

    return (
        <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#e0e6f0' }}>
            <style>{`
                @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                input[type=number]::-webkit-inner-spin-button { opacity: 0.5; }
            `}</style>

            {/* ── Hero ── */}
            <div style={{
                background: 'linear-gradient(135deg, #0d1528 0%, #1a2540 50%, #0a1020 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '28px 24px 32px',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 400, height: 200, background: 'rgba(240,192,64,0.04)', borderRadius: '50%', filter: 'blur(40px)' }} />

                <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
                    <button
                        onClick={() => navigate(`/tournaments/${tournamentId}`)}
                        style={{ background: 'none', border: 'none', color: '#7a8ba0', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        ← {tournament?.name || ''}
                    </button>

                    {/* Meta row */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ padding: '5px 12px', borderRadius: 20, background: status.bg, border: `1px solid ${status.color}40`, fontSize: 12, fontWeight: 700, color: status.color }}>
                            {status.icon} {status.label}
                        </span>
                        <span style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', fontSize: 12, color: '#7a8ba0', fontWeight: 600 }}>
                            {stageLabel[match.stage] || match.stage}
                        </span>
                        {match.stage === 'group' && match.groupId && (
                            <span style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(240,192,64,0.1)', border: '1px solid rgba(240,192,64,0.2)', fontSize: 12, fontWeight: 700, color: '#f0c040' }}>
                                {tm('groupLabel')} {match.groupId}
                            </span>
                        )}
                        {match.matchday && match.stage === 'group' && (
                            <span style={{ fontSize: 12, color: '#5a6b7a' }}>{tm('round')} {match.matchday}</span>
                        )}
                    </div>

                    {/* Score display */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <TeamHeader name={match.homeTeamName} logo={match.homeTeamLogo} score={isPlayed ? match.homeScore : null} isWinner={homeWins} align="left" />

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, minWidth: 60 }}>
                            {!isPlayed && (
                                match.scheduledAt ? (
                                    <>
                                        <div style={{ fontSize: 12, color: '#63b3ed', fontWeight: 600 }}>
                                            {new Date(match.scheduledAt).toLocaleDateString(locale, { day: '2-digit', month: 'short' })}
                                        </div>
                                        <div style={{ fontSize: 20, fontWeight: 800, color: '#e0e6f0' }}>
                                            {new Date(match.scheduledAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ fontSize: 28, color: '#3a4b5a', fontWeight: 700, letterSpacing: 4 }}>-</div>
                                )
                            )}
                            {isPlayed && (
                                <div style={{ fontSize: 13, color: '#5a6b7a', letterSpacing: 2 }}>{tm('final_label')}</div>
                            )}
                        </div>

                        <TeamHeader name={match.awayTeamName} logo={match.awayTeamLogo} score={isPlayed ? match.awayScore : null} isWinner={awayWins} align="right" />
                    </div>

                    {/* Venue info */}
                    {slot && (
                        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ fontSize: 11, color: '#5a6b7a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{tm('dateLabel')}</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#e0e6f0' }}>
                                    {new Date(slot.date + 'T12:00').toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long' })}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: '#5a6b7a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{tm('timeLabel')}</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#f0c040' }}>{slot.startTime} — {slot.endTime}</div>
                            </div>
                            {slot.stadiumName && (
                                <div>
                                    <div style={{ fontSize: 11, color: '#5a6b7a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{tm('stadiumLabel')}</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#63b3ed' }}>🏟 {slot.stadiumName}</div>
                                    {slot.stadiumAddress && <div style={{ fontSize: 12, color: '#7a8ba0' }}>{slot.stadiumAddress}</div>}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Content ── */}
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 24px 48px' }}>

                {isOrganizer && !isPlayed && (
                    <ScoreEntryPanel match={match} tournamentId={tournamentId} onDone={refetch} />
                )}

                {!isPlayed && (
                    <SlotPanel
                        match={match}
                        tournamentId={tournamentId}
                        slots={slots}
                        userId={user?.id}
                        myTournamentTeam={myTournamentTeam}
                    />
                )}

                {!isPlayed && match.deadlineAt && (
                    <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 13, color: '#5a6b7a' }}>
                        {tm('deadline')}: {new Date(match.deadlineAt).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                )}
            </div>
        </div>
    );
}
