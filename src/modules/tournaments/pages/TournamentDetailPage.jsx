import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, message } from 'antd';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
    useGetTournamentByIdQuery,
    useGetTournamentSlotsQuery,
    useRegisterTeamMutation,
    useStartGroupDrawMutation,
    useStartPlayoffDrawMutation,
    useProposeSlotMutation,
    useRespondToSlotMutation,
} from '../../../store/tournamentsApi';
import { useGetMyTeamsQuery } from '../../../store/teamsApi';
import GroupTable from '../components/GroupTable';
import MatchCard from '../components/MatchCard';
import TournamentBracket from '../components/TournamentBracket';
import { GroupDrawAnimation, PlayoffDrawAnimation } from '../components/DrawAnimation';
import SlotManager from '../components/SlotManager';
import { API_BASE } from '../../../config';

const STATUS_ICONS = {
    registration: '📋',
    group_draw:   '🎲',
    group_stage:  '⚽',
    playoff_draw: '🎲',
    playoff:      '🔥',
    completed:    '🏆',
    cancelled:    '❌',
};
const STATUS_COLORS = {
    registration: '#63b3ed',
    group_draw:   '#f0c040',
    group_stage:  '#68d391',
    playoff_draw: '#f0c040',
    playoff:      '#fc8181',
    completed:    '#a0aec0',
    cancelled:    '#e53e3e',
};

export default function TournamentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const td = (key, opts) => t(`tournaments.detail.${key}`, opts);

    const user = useSelector(s => s.auth.user);
    const [activeTab, setActiveTab] = useState('overview');
    const [drawData, setDrawData] = useState(null);
    const [drawType, setDrawType] = useState(null);
    const [liveData, setLiveData] = useState(null);
    const socketRef = useRef(null);

    const { data: tournament, isLoading, refetch } = useGetTournamentByIdQuery(id, { pollingInterval: 0 });
    const { data: slots = [], refetch: refetchSlots } = useGetTournamentSlotsQuery(id);
    const { data: userTeamsData } = useGetMyTeamsQuery(user?.id, { skip: !user?.id });
    const [registerTeam, { isLoading: isRegistering }] = useRegisterTeamMutation();
    const [startGroupDraw, { isLoading: isDrawing }] = useStartGroupDrawMutation();
    const [startPlayoffDraw, { isLoading: isPlayoffDrawing }] = useStartPlayoffDrawMutation();
    const [proposeSlot] = useProposeSlotMutation();
    const [respondToSlot] = useRespondToSlotMutation();

    const tour = liveData || tournament;
    const isOrganizer = user?.id && tour?.organizerId === user.id;
    const myCaptainTeam = userTeamsData?.find(team => team.captainId === user?.id);
    const myRegistration = tour?.teams?.find(reg => reg.captainId === user?.id);
    const myTournamentTeam = tour?.teams?.find(reg => reg.captainId === user?.id);

    const TABS = [
        { key: 'overview', label: td('tabs.overview') },
        { key: 'teams',    label: td('tabs.teams') },
        { key: 'groups',   label: td('tabs.groups') },
        { key: 'matches',  label: td('tabs.matches') },
        { key: 'slots',    label: td('tabs.slots') },
        { key: 'bracket',  label: td('tabs.bracket') },
    ];

    useEffect(() => {
        if (!id) return;
        const socket = io(API_BASE, { transports: ['websocket'] });
        socketRef.current = socket;
        socket.emit('joinTournamentRoom', id);
        socket.on('groupDrawComplete',  (data) => { setDrawType('group');   setDrawData(data); refetch(); });
        socket.on('playoffDrawComplete',(data) => { setDrawType('playoff'); setDrawData(data); refetch(); });
        socket.on('matchUpdated',       () => { refetch(); refetchSlots(); });
        socket.on('slotAdded',          () => { refetchSlots(); });
socket.on('teamAdvanced',       () => { refetch(); });
        socket.on('tournamentComplete', () => { refetch(); });
        socket.on('teamRegistered',     () => { refetch(); });
        socket.on('groupStageComplete', () => { refetch(); });
        return () => { socket.emit('leaveTournamentRoom', id); socket.disconnect(); };
    }, [id]);

    const handleRegister = async () => {
        if (!user) { navigate('/login'); return; }
        if (!myCaptainTeam) { message.error(td('actions.noCaptain')); return; }
        try {
            await registerTeam({ tournamentId: id, teamId: myCaptainTeam.id }).unwrap();
            message.success(td('actions.registered'));
            refetch();
        } catch (e) {
            message.error(e?.data?.message || 'Error');
        }
    };

    const handleStartGroupDraw = async () => {
        try {
            const result = await startGroupDraw(id).unwrap();
            setDrawType('group'); setDrawData(result);
        } catch (e) {
            message.error(e?.data?.message || 'Error');
        }
    };

    const handleStartPlayoffDraw = async () => {
        try {
            const result = await startPlayoffDraw(id).unwrap();
            setDrawType('playoff'); setDrawData(result);
        } catch (e) {
            message.error(e?.data?.message || 'Error');
        }
    };

    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!tour) {
        return (
            <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a8ba0', fontSize: 18 }}>
                {td('notFound')}
            </div>
        );
    }

    const statusColor = STATUS_COLORS[tour.status] || '#63b3ed';
    const statusIcon  = STATUS_ICONS[tour.status]  || '📋';
    const statusLabel = td(`statusLabels.${tour.status}`, tour.status);

    const teamsCount    = tour.teams?.length || 0;
    const allMatches    = tour.matches || [];
    const groupMatches  = allMatches.filter(m => m.stage === 'group');
    const playoffMatches = allMatches.filter(m => m.stage !== 'group');
    const playedMatches = allMatches.filter(m => m.status === 'played' || m.status?.startsWith('walkover'));
    const upcomingMatches = allMatches.filter(m => m.status !== 'played' && !m.status?.startsWith('walkover'));

    return (
        <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#e0e6f0' }}>
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* Draw animations */}
            {drawData && drawType === 'group' && (
                <GroupDrawAnimation
                    drawSequence={drawData.drawSequence}
                    onComplete={() => { setDrawData(null); setDrawType(null); setActiveTab('groups'); }}
                />
            )}
            {drawData && drawType === 'playoff' && (
                <PlayoffDrawAnimation
                    drawSequence={drawData.drawSequence}
                    onComplete={() => { setDrawData(null); setDrawType(null); setActiveTab('bracket'); }}
                />
            )}

            {/* Hero */}
            <div style={{
                position: 'relative', overflow: 'hidden',
                background: tour.coverImage
                    ? `url(${tour.coverImage}) center/cover`
                    : 'linear-gradient(135deg, #0d1528 0%, #1a2540 50%, #0a1020 100%)',
                minHeight: 280,
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(10,14,26,0.3) 0%, rgba(10,14,26,0.85) 70%, #0a0e1a 100%)',
                }} />
                {!tour.coverImage && (
                    <div style={{
                        position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)',
                        fontSize: 120, opacity: 0.06, lineHeight: 1,
                    }}>🏆</div>
                )}

                <div style={{ position: 'relative', padding: '40px 24px 0', maxWidth: 900, margin: '0 auto' }}>
                    <button
                        onClick={() => navigate('/tournaments')}
                        style={{
                            background: 'none', border: 'none', color: '#7a8ba0',
                            cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 20,
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}
                    >
                        {td('backToList')}
                    </button>

                    <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                        <span style={{
                            padding: '5px 14px', borderRadius: 20,
                            background: `${statusColor}20`,
                            border: `1px solid ${statusColor}40`,
                            fontSize: 12, fontWeight: 700, color: statusColor,
                        }}>
                            {statusIcon} {statusLabel}
                        </span>
                        <span style={{
                            padding: '5px 14px', borderRadius: 20,
                            background: 'rgba(255,255,255,0.07)',
                            fontSize: 12, fontWeight: 600, color: '#a0b0c0',
                        }}>
                            {tour.format}
                        </span>
                        {tour.maxTeams && (
                            <span style={{
                                padding: '5px 14px', borderRadius: 20,
                                background: 'rgba(255,255,255,0.07)',
                                fontSize: 12, fontWeight: 600, color: '#a0b0c0',
                            }}>
                                {tour.maxTeams} {td('teamsLabel')}
                            </span>
                        )}
                    </div>

                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#e0e6f0', margin: '0 0 8px', lineHeight: 1.2 }}>
                        {tour.name}
                    </h1>
                    {tour.organizerName && (
                        <div style={{ fontSize: 13, color: '#7a8ba0', marginBottom: 8 }}>
                            {td('organizer')}: <span style={{ color: '#a0b0c0' }}>{tour.organizerName}</span>
                        </div>
                    )}
                    {tour.location && (
                        <div style={{ fontSize: 13, color: '#7a8ba0', marginBottom: 20 }}>📍 {tour.location}</div>
                    )}
                </div>
            </div>

            {/* Stats bar */}
            <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {[
                        { key: 'prizePool', value: Number(tour.prizePool) > 0 ? `${Number(tour.prizePool)} ₼` : '—', color: '#f0c040' },
                        { key: 'entryFee',  value: Number(tour.entryFee) > 0 ? `${Number(tour.entryFee)} ₼` : 'FREE', color: '#68d391' },
                        { key: 'teams',     value: `${teamsCount} / ${tour.maxTeams}`, color: '#63b3ed' },
                        { key: 'played',    value: playedMatches.length, color: '#a0aec0' },
                    ].map((stat, i) => (
                        <div key={i} style={{
                            padding: '16px 20px',
                            borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                            <div style={{ fontSize: 11, color: '#5a6b7a', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>
                                {td(`statsBar.${stat.key}`)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main */}
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 48px' }}>

                {/* Actions */}
                <div style={{ padding: '20px 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {tour.status === 'registration' && !myRegistration && myCaptainTeam && (
                        <button
                            onClick={handleRegister}
                            disabled={isRegistering || teamsCount >= tour.maxTeams}
                            style={{
                                padding: '12px 28px', borderRadius: 12, border: 'none',
                                background: teamsCount >= tour.maxTeams
                                    ? 'rgba(255,255,255,0.1)'
                                    : 'linear-gradient(135deg, #f0c040, #e07b20)',
                                color: teamsCount >= tour.maxTeams ? '#7a8ba0' : '#1a1a2e',
                                fontWeight: 800, fontSize: 15, cursor: 'pointer',
                                transition: 'opacity 0.2s', opacity: isRegistering ? 0.7 : 1,
                            }}
                        >
                            {isRegistering
                                ? td('actions.registering')
                                : teamsCount >= tour.maxTeams
                                    ? td('actions.full')
                                    : td('actions.registerBtn').replace('{{name}}', myCaptainTeam.name)}
                        </button>
                    )}
                    {myRegistration && (
                        <div style={{
                            padding: '12px 20px', borderRadius: 12,
                            background: 'rgba(72,187,120,0.1)', border: '1px solid rgba(72,187,120,0.3)',
                            color: '#48bb78', fontWeight: 600, fontSize: 14,
                        }}>
                            {td('actions.registered')}
                        </div>
                    )}
                    {isOrganizer && tour.status === 'registration' && teamsCount >= 8 && (
                        <button
                            onClick={handleStartGroupDraw} disabled={isDrawing}
                            style={{
                                padding: '12px 28px', borderRadius: 12, border: 'none',
                                background: 'linear-gradient(135deg, #63b3ed, #4299e1)',
                                color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                            }}
                        >
                            {isDrawing ? td('actions.drawing') : td('actions.startDraw')}
                        </button>
                    )}
                    {isOrganizer && tour.status === 'playoff_draw' && (
                        <button
                            onClick={handleStartPlayoffDraw} disabled={isPlayoffDrawing}
                            style={{
                                padding: '12px 28px', borderRadius: 12, border: 'none',
                                background: 'linear-gradient(135deg, #fc8181, #e53e3e)',
                                color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                            }}
                        >
                            {isPlayoffDrawing ? td('actions.playoffDrawing') : td('actions.startPlayoffDraw')}
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex', gap: 0,
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    marginBottom: 28, overflowX: 'auto',
                }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                padding: '12px 20px', border: 'none', background: 'none',
                                cursor: 'pointer', fontWeight: 600, fontSize: 14,
                                color: activeTab === tab.key ? '#f0c040' : '#7a8ba0',
                                borderBottom: `2px solid ${activeTab === tab.key ? '#f0c040' : 'transparent'}`,
                                transition: 'all 0.2s', whiteSpace: 'nowrap', marginBottom: -1,
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div style={{ animation: 'fadeUp 0.3s ease' }}>

                    {/* ── OVERVIEW ── */}
                    {activeTab === 'overview' && (
                        <div>
                            {tour.description && (
                                <div style={{
                                    padding: '20px 24px', borderRadius: 14,
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    marginBottom: 24, fontSize: 15, color: '#a0b0c0', lineHeight: 1.7,
                                }}>
                                    {tour.description}
                                </div>
                            )}

                            <div style={{ marginBottom: 28 }}>
                                <h3 style={{ color: '#e0e6f0', fontWeight: 700, marginBottom: 16 }}>
                                    {td('overview.schedule')}
                                </h3>
                                {[
                                    { label: td('overview.regDeadline'),    date: tour.registrationDeadline, icon: '📋' },
                                    { label: td('overview.groupDeadline'),  date: tour.groupStageDeadline,   icon: '⚽' },
                                    { label: td('overview.playoffDeadline'),date: tour.playoffDeadline,      icon: '🔥' },
                                ].filter(e => e.date).map((e, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: 16,
                                        padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    }}>
                                        <span style={{ fontSize: 22 }}>{e.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: '#e0e6f0', fontSize: 14 }}>{e.label}</div>
                                        </div>
                                        <div style={{ fontSize: 13, color: '#63b3ed', fontWeight: 600 }}>
                                            {new Date(e.date).toLocaleDateString('ru', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {upcomingMatches.length > 0 && (
                                <div>
                                    <h3 style={{ color: '#e0e6f0', fontWeight: 700, marginBottom: 16 }}>
                                        {td('overview.upcoming')}
                                    </h3>
                                    {upcomingMatches
                                        .filter(m => m.scheduledAt)
                                        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
                                        .slice(0, 4)
                                        .map(m => (
                                            <MatchCard key={m.id} match={m} groupId={m.groupId} showStage={m.stage !== 'group'} />
                                        ))}
                                </div>
                            )}

                            {playedMatches.length > 0 && (
                                <div style={{ marginTop: 28 }}>
                                    <h3 style={{ color: '#e0e6f0', fontWeight: 700, marginBottom: 16 }}>
                                        {td('overview.lastResults')}
                                    </h3>
                                    {playedMatches.slice(-4).reverse().map(m => (
                                        <MatchCard key={m.id} match={m} groupId={m.groupId} showStage={m.stage !== 'group'} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TEAMS ── */}
                    {activeTab === 'teams' && (
                        <div>
                            <div style={{ fontSize: 13, color: '#7a8ba0', marginBottom: 20, fontWeight: 600 }}>
                                {td('teamsCount', { count: teamsCount, max: tour.maxTeams })}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 32 }}>
                                {(tour.teams || []).map((reg, i) => (
                                    <div key={reg.id} style={{
                                        borderRadius: 14, padding: '16px 18px',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        display: 'flex', alignItems: 'center', gap: 14,
                                        animation: `fadeUp 0.3s ease ${i * 0.04}s both`,
                                    }}>
                                        {reg.teamLogo ? (
                                            <img src={reg.teamLogo} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{
                                                width: 44, height: 44, borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #2a3550, #1a2540)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 14, fontWeight: 800, color: '#a0b0c0',
                                            }}>
                                                {reg.teamName?.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, color: '#e0e6f0', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {reg.teamName}
                                            </div>
                                            {reg.groupId && (
                                                <div style={{ fontSize: 11, color: '#f0c040', fontWeight: 600, marginTop: 3 }}>
                                                    {td('groupLabel')} {reg.groupId}
                                                </div>
                                            )}
                                            {reg.eliminated && (
                                                <div style={{ fontSize: 11, color: '#e53e3e', fontWeight: 600, marginTop: 3 }}>
                                                    {td('eliminated')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {[...Array(Math.max(0, tour.maxTeams - teamsCount))].map((_, i) => (
                                    <div key={`empty-${i}`} style={{
                                        borderRadius: 14, padding: '16px 18px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px dashed rgba(255,255,255,0.08)',
                                        display: 'flex', alignItems: 'center', gap: 14, opacity: 0.4,
                                    }}>
                                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                                        <span style={{ color: '#4a5b6a', fontSize: 13 }}>{td('teamsSlot')}</span>
                                    </div>
                                ))}
                            </div>

                        </div>
                    )}

                    {/* ── GROUPS ── */}
                    {activeTab === 'groups' && (
                        <div>
                            {(tour.standings || []).length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
                                    {(tour.standings || []).map(group => (
                                        <GroupTable key={group.groupId} group={group} />
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '60px 0', color: '#5a6b7a' }}>
                                    <div style={{ fontSize: 40, marginBottom: 16 }}>⚽</div>
                                    <div style={{ fontSize: 16, fontWeight: 600, color: '#7a8ba0' }}>
                                        {td('groups.empty')}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── MATCHES ── */}
                    {activeTab === 'matches' && (
                        <div>
                            {upcomingMatches.length > 0 && (
                                <div style={{ marginBottom: 32 }}>
                                    <h3 style={{ color: '#e0e6f0', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>
                                        {td('matches.upcoming')}
                                    </h3>
                                    {upcomingMatches
                                        .sort((a, b) => (a.scheduledAt || '').localeCompare(b.scheduledAt || ''))
                                        .map(m => (
                                            <MatchCard
                                                key={m.id} match={m} groupId={m.groupId}
                                                showStage={m.stage !== 'group'}
                                                slots={slots}
                                                myTournamentTeam={myTournamentTeam}
                                                userId={user?.id}
                                                isOrganizer={isOrganizer}
                                                tournamentId={id}
                                                onProposeSlot={async (matchId, slotId) => {
                                                    try {
                                                        await proposeSlot({ tournamentId: id, matchId, slotId }).unwrap();
                                                        message.success('OK');
                                                        refetch(); refetchSlots();
                                                    } catch (e) { message.error(e?.data?.message || 'Error'); }
                                                }}
                                                onRespondSlot={async (matchId, accept) => {
                                                    try {
                                                        await respondToSlot({ tournamentId: id, matchId, accept }).unwrap();
                                                        message.success('OK');
                                                        refetch(); refetchSlots();
                                                    } catch (e) { message.error(e?.data?.message || 'Error'); }
                                                }}
                                            />
                                        ))}
                                </div>
                            )}
                            {playedMatches.length > 0 && (
                                <div>
                                    <h3 style={{ color: '#e0e6f0', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>
                                        {td('matches.results')}
                                    </h3>
                                    {playedMatches.reverse().map(m => (
                                        <MatchCard key={m.id} match={m} groupId={m.groupId} showStage={m.stage !== 'group'} />
                                    ))}
                                </div>
                            )}
                            {allMatches.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '60px 0', color: '#5a6b7a' }}>
                                    <div style={{ fontSize: 40, marginBottom: 16 }}>📅</div>
                                    <div style={{ fontSize: 16, fontWeight: 600, color: '#7a8ba0' }}>
                                        {td('matches.empty')}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── SLOTS ── */}
                    {activeTab === 'slots' && (
                        <SlotManager tournamentId={id} isOrganizer={isOrganizer} matches={allMatches} />
                    )}

                    {/* ── BRACKET ── */}
                    {activeTab === 'bracket' && (
                        <TournamentBracket bracket={tour.bracket} status={tour.status} />
                    )}
                </div>
            </div>
        </div>
    );
}
