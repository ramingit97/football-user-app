import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function TeamSide({ name, logo, isWinner, align = 'left' }) {
    const { t } = useTranslation();
    const isRight = align === 'right';
    return (
        <div style={{
            display: 'flex',
            flexDirection: isRight ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 10,
            flex: 1,
            minWidth: 0,
        }}>
            {logo ? (
                <img src={logo} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
                <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#a0aec0', flexShrink: 0,
                }}>
                    {name === 'TBD' || name === '?' ? '?' : name?.substring(0, 2).toUpperCase()}
                </div>
            )}
            <span style={{
                fontWeight: isWinner ? 700 : 500,
                fontSize: 15,
                color: isWinner ? '#e0e6f0' : '#7a8ba0',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                textAlign: isRight ? 'right' : 'left',
            }}>
                {name === 'TBD' || name === '?' ? t('tournaments.detail.tbd') : name}
            </span>
        </div>
    );
}

export default function MatchCard({
    match, groupId, showStage = false,
    slots = [], myTournamentTeam, userId, isOrganizer, tournamentId,
    onProposeSlot, onRespondSlot,
}) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const tm = (key, opts) => t(`tournaments.match.${key}`, opts);
    const td = (key, opts) => t(`tournaments.detail.${key}`, opts);

    const stageLabel = {
        group: null,
        quarterfinal: tm('quarterfinal'),
        semifinal: tm('semifinal'),
        final: tm('final'),
    };

    const statusConfig = {
        scheduled:     { color: '#7a8ba0', bg: 'rgba(122,139,160,0.1)', label: tm('statusScheduled') },
        slot_pending:  { color: '#f0c040', bg: 'rgba(240,192,64,0.1)',  label: tm('statusSlotPending') },
        confirmed:     { color: '#63b3ed', bg: 'rgba(99,179,237,0.1)',  label: tm('statusConfirmed') },
        played:        { color: '#48bb78', bg: 'rgba(72,187,120,0.1)',  label: tm('statusPlayed') },
        walkover_home: { color: '#e07b20', bg: 'rgba(224,123,32,0.1)', label: tm('statusWalkoverHome') },
        walkover_away: { color: '#e07b20', bg: 'rgba(224,123,32,0.1)', label: tm('statusWalkoverAway') },
    };

    const [showSlots, setShowSlots] = useState(false);
    const [proposing, setProposing] = useState(false);
    const [responding, setResponding] = useState(false);

    if (!match) return null;

    const isPlayed = match.status === 'played' || match.status === 'walkover_home' || match.status === 'walkover_away';
    const homeWins = isPlayed && match.homeScore > match.awayScore;
    const awayWins = isPlayed && match.awayScore > match.homeScore;
    const status = statusConfig[match.status] || statusConfig.scheduled;
    const stage = stageLabel[match.stage];

    // Determine if current user is captain of one of these teams
    const isHomeCaptain = myTournamentTeam && match.homeTeamId === myTournamentTeam.teamId;
    const isAwayCaptain = myTournamentTeam && match.awayTeamId === myTournamentTeam.teamId;
    const isParticipant = isHomeCaptain || isAwayCaptain;

    // Can propose: match is scheduled, user is a captain in this match, no slot proposed yet
    const canPropose = !isPlayed && match.status === 'scheduled' && isParticipant && onProposeSlot;

    // Can respond: match has pending slot, proposed by the OTHER captain (backend stores captainId/userId)
    const canRespond = match.status === 'slot_pending'
        && isParticipant
        && userId !== match.pendingSlotProposedBy
        && onRespondSlot;

    // Is my proposal pending (I proposed, waiting for other side)
    const myProposalPending = match.status === 'slot_pending'
        && userId === match.pendingSlotProposedBy;

    // Available slots for selection
    const availableSlots = slots.filter(s => s.status === 'available');

    // Resolve pending slot details from the slots list
    const pendingSlot = match.pendingSlotId ? slots.find(s => s.id === match.pendingSlotId) : null;

    // Resolve confirmed slot details
    const confirmedSlot = match.slotId ? slots.find(s => s.id === match.slotId) : null;

    const handlePropose = async (slotId) => {
        setProposing(true);
        await onProposeSlot(match.id, slotId);
        setProposing(false);
        setShowSlots(false);
    };

    const handleRespond = async (accept) => {
        setResponding(true);
        await onRespondSlot(match.id, accept);
        setResponding(false);
    };

    return (
        <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            marginBottom: 10,
            overflow: 'hidden',
            transition: 'all 0.2s',
        }}>
            <div
                style={{ padding: '14px 18px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                {/* Top meta */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {groupId && (
                            <span style={{
                                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                background: 'rgba(240,192,64,0.15)', color: '#f0c040',
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>
                                {td('groupLabel')} {groupId}
                            </span>
                        )}
                        {showStage && stage && (
                            <span style={{
                                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                background: 'rgba(240,192,64,0.15)', color: '#f0c040',
                            }}>
                                {stage}
                            </span>
                        )}
                        {match.matchday && match.stage === 'group' && (
                            <span style={{ fontSize: 11, color: '#5a6b7a' }}>{tm('round')} {match.matchday}</span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{
                            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                            background: status.bg, color: status.color,
                        }}>
                            {status.label}
                        </span>
                        {tournamentId && (
                            <button
                                onClick={() => navigate(`/tournaments/${tournamentId}/matches/${match.id}`)}
                                style={{
                                    background: 'rgba(255,255,255,0.06)', border: 'none',
                                    color: '#7a8ba0', fontSize: 11, cursor: 'pointer',
                                    padding: '3px 8px', borderRadius: 6, fontWeight: 600,
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#c0d0e0'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#7a8ba0'; }}
                            >
                                {t('common.details')} →
                            </button>
                        )}
                    </div>
                </div>

                {/* Main: teams + score */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <TeamSide
                        name={match.homeTeamName}
                        logo={match.homeTeamLogo}
                        isWinner={homeWins}
                        align="left"
                    />

                    {/* Score / time */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                        minWidth: 80, justifyContent: 'center',
                    }}>
                        {isPlayed ? (
                            <>
                                <span style={{ fontSize: 26, fontWeight: 900, color: homeWins ? '#e0e6f0' : '#5a6b7a', lineHeight: 1 }}>
                                    {match.homeScore}
                                </span>
                                <span style={{ fontSize: 18, color: '#3a4b5a', fontWeight: 300 }}>:</span>
                                <span style={{ fontSize: 26, fontWeight: 900, color: awayWins ? '#e0e6f0' : '#5a6b7a', lineHeight: 1 }}>
                                    {match.awayScore}
                                </span>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                {match.scheduledAt ? (
                                    <>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#63b3ed' }}>
                                            {new Date(match.scheduledAt).toLocaleDateString('ru', { day: '2-digit', month: 'short' })}
                                        </div>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: '#e0e6f0' }}>
                                            {new Date(match.scheduledAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </>
                                ) : (
                                    <span style={{ fontSize: 20, color: '#4a5b6a', fontWeight: 700, letterSpacing: 2 }}>-</span>
                                )}
                            </div>
                        )}
                    </div>

                    <TeamSide
                        name={match.awayTeamName}
                        logo={match.awayTeamLogo}
                        isWinner={awayWins}
                        align="right"
                    />
                </div>

                {/* Slot info when confirmed */}
                {match.status === 'confirmed' && confirmedSlot && (
                    <div style={{
                        marginTop: 10, paddingTop: 10,
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        fontSize: 12, color: '#63b3ed',
                        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                    }}>
                        <span>📅 {new Date(confirmedSlot.date + 'T12:00').toLocaleDateString('ru', { day: '2-digit', month: 'long' })}</span>
                        <span style={{ color: '#e0e6f0', fontWeight: 700 }}>{confirmedSlot.startTime} – {confirmedSlot.endTime}</span>
                        {confirmedSlot.stadiumName && (
                            <span style={{ color: '#7a8ba0' }}>📍 {confirmedSlot.stadiumName}{confirmedSlot.stadiumAddress && `, ${confirmedSlot.stadiumAddress}`}</span>
                        )}
                    </div>
                )}

                {/* Deadline */}
                {!isPlayed && match.deadlineAt && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: 11, color: '#5a6b7a' }}>
                            {tm('deadline')}: {new Date(match.deadlineAt).toLocaleDateString('ru', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                )}

                {/* My proposal is pending — waiting for opponent */}
                {myProposalPending && (
                    <div style={{
                        marginTop: 12, padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(240,192,64,0.08)',
                        border: '1px solid rgba(240,192,64,0.2)',
                        fontSize: 13, color: '#f0c040',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        {tm('slotMyPending')}
                    </div>
                )}

                {/* Respond to slot proposal */}
                {canRespond && (
                    <div style={{
                        marginTop: 12, padding: '14px 16px', borderRadius: 10,
                        background: 'rgba(99,179,237,0.08)',
                        border: '1px solid rgba(99,179,237,0.2)',
                    }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#63b3ed', marginBottom: 10 }}>
                            {tm('slotPendingTitle')}
                        </div>
                        {pendingSlot && (
                            <div style={{ fontSize: 13, color: '#a0b0c0', marginBottom: 12 }}>
                                📅 {new Date(pendingSlot.date + 'T12:00').toLocaleDateString('ru', { weekday: 'long', day: '2-digit', month: 'long' })}
                                &nbsp;·&nbsp;
                                <strong style={{ color: '#e0e6f0' }}>{pendingSlot.startTime} – {pendingSlot.endTime}</strong>
                                {pendingSlot.stadiumName && (
                                    <> &nbsp;·&nbsp; 📍 {pendingSlot.stadiumName}</>
                                )}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={() => handleRespond(true)}
                                disabled={responding}
                                style={{
                                    padding: '8px 20px', borderRadius: 8, border: 'none',
                                    background: 'linear-gradient(135deg, #48bb78, #38a169)',
                                    color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                    opacity: responding ? 0.7 : 1,
                                }}
                            >
                                {tm('slotConfirm')}
                            </button>
                            <button
                                onClick={() => handleRespond(false)}
                                disabled={responding}
                                style={{
                                    padding: '8px 20px', borderRadius: 8, border: 'none',
                                    background: 'rgba(255,255,255,0.07)',
                                    color: '#a0b0c0', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                    opacity: responding ? 0.7 : 1,
                                }}
                            >
                                {tm('slotDecline')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Propose a slot */}
                {canPropose && (
                    <div style={{ marginTop: 12 }}>
                        {!showSlots ? (
                            <button
                                onClick={() => setShowSlots(true)}
                                style={{
                                    padding: '8px 18px', borderRadius: 8,
                                    background: 'rgba(72,187,120,0.12)',
                                    border: '1px solid rgba(72,187,120,0.25)',
                                    color: '#48bb78', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                }}
                            >
                                {tm('slotPropose')}
                            </button>
                        ) : (
                            <div style={{
                                padding: '14px 16px', borderRadius: 10,
                                background: 'rgba(72,187,120,0.06)',
                                border: '1px solid rgba(72,187,120,0.2)',
                            }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    marginBottom: 12,
                                }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#48bb78' }}>
                                        {tm('slotChoose')}
                                    </span>
                                    <button
                                        onClick={() => setShowSlots(false)}
                                        style={{ background: 'none', border: 'none', color: '#5a6b7a', cursor: 'pointer', fontSize: 16 }}
                                    >
                                        ✕
                                    </button>
                                </div>
                                {availableSlots.length === 0 ? (
                                    <div style={{ fontSize: 13, color: '#5a6b7a', textAlign: 'center', padding: '12px 0' }}>
                                        {tm('slotNoAvailable')}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {availableSlots.map(slot => (
                                            <button
                                                key={slot.id}
                                                onClick={() => handlePropose(slot.id)}
                                                disabled={proposing}
                                                style={{
                                                    padding: '10px 14px', borderRadius: 8,
                                                    background: 'rgba(255,255,255,0.04)',
                                                    border: '1px solid rgba(72,187,120,0.2)',
                                                    color: '#c0d0e0', cursor: 'pointer',
                                                    textAlign: 'left', fontSize: 13,
                                                    display: 'flex', alignItems: 'center', gap: 12,
                                                    transition: 'all 0.15s',
                                                    opacity: proposing ? 0.6 : 1,
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(72,187,120,0.1)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                            >
                                                <span style={{ fontWeight: 700, color: '#e0e6f0', minWidth: 90 }}>
                                                    {slot.startTime} – {slot.endTime}
                                                </span>
                                                <span style={{ flex: 1 }}>
                                                    {new Date(slot.date + 'T12:00').toLocaleDateString('ru', { weekday: 'short', day: '2-digit', month: 'short' })}
                                                </span>
                                                <span style={{ color: '#7a8ba0', fontSize: 12 }}>
                                                    📍 {slot.stadiumName}
                                                    {slot.stadiumAddress && `, ${slot.stadiumAddress}`}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
