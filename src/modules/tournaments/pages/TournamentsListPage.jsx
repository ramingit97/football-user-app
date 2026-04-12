import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useGetTournamentsQuery } from '../../../store/tournamentsApi';

function TournamentCard({ t: tour }) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const statusLabel = t(`tournaments.status.${tour.status}`, tour.status);
    const statusColors = {
        registration: { color: '#63b3ed', bg: 'rgba(99,179,237,0.15)' },
        group_draw:   { color: '#f0c040', bg: 'rgba(240,192,64,0.15)' },
        group_stage:  { color: '#68d391', bg: 'rgba(104,211,145,0.15)' },
        playoff_draw: { color: '#f0c040', bg: 'rgba(240,192,64,0.15)' },
        playoff:      { color: '#fc8181', bg: 'rgba(252,129,129,0.15)' },
        completed:    { color: '#a0aec0', bg: 'rgba(160,174,192,0.1)' },
        cancelled:    { color: '#e53e3e', bg: 'rgba(229,62,62,0.1)' },
    };
    const { color, bg } = statusColors[tour.status] || statusColors.registration;
    const teamsCount = tour.teams?.length ?? 0;

    return (
        <div
            onClick={() => navigate(`/tournaments/${tour.id}`)}
            style={{
                borderRadius: 18, overflow: 'hidden',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', transition: 'all 0.25s', position: 'relative',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(240,192,64,0.3)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {/* Cover */}
            <div style={{
                height: 140, position: 'relative', overflow: 'hidden',
                background: tour.coverImage
                    ? `url(${tour.coverImage}) center/cover`
                    : 'linear-gradient(135deg, #1a2540 0%, #0d1528 100%)',
            }}>
                {!tour.coverImage && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 48, opacity: 0.2,
                    }}>🏆</div>
                )}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(10,14,26,0.9) 0%, transparent 60%)',
                }} />
                <div style={{
                    position: 'absolute', top: 12, right: 12,
                    padding: '4px 10px', borderRadius: 20,
                    background: bg, border: `1px solid ${color}40`,
                    fontSize: 11, fontWeight: 700, color,
                }}>
                    {statusLabel}
                </div>
                <div style={{
                    position: 'absolute', top: 12, left: 12,
                    padding: '4px 10px', borderRadius: 20,
                    background: 'rgba(0,0,0,0.5)',
                    fontSize: 11, fontWeight: 700, color: '#a0b0c0',
                }}>
                    {tour.format}
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '16px 18px' }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#e0e6f0', marginBottom: 6, lineHeight: 1.3 }}>
                    {tour.name}
                </div>
                {tour.location && (
                    <div style={{ fontSize: 12, color: '#7a8ba0', marginBottom: 12 }}>
                        📍 {tour.location}
                    </div>
                )}

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 0 }}>
                    <div style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#f0c040' }}>
                            {Number(tour.prizePool) > 0 ? `${Number(tour.prizePool)} ₼` : '—'}
                        </div>
                        <div style={{ fontSize: 10, color: '#5a6b7a', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                            {t('tournaments.prizePool')}
                        </div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#63b3ed' }}>
                            {teamsCount}/{tour.maxTeams}
                        </div>
                        <div style={{ fontSize: 10, color: '#5a6b7a', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                            {t('tournaments.teams')}
                        </div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: '10px 0' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#68d391' }}>
                            {Number(tour.entryFee) > 0 ? `${Number(tour.entryFee)} ₼` : 'FREE'}
                        </div>
                        <div style={{ fontSize: 10, color: '#5a6b7a', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                            {t('tournaments.entryFee')}
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                {tour.status === 'registration' && (
                    <div style={{ marginTop: 14 }}>
                        <div style={{
                            height: 4, borderRadius: 2,
                            background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%', borderRadius: 2,
                                width: `${(teamsCount / tour.maxTeams) * 100}%`,
                                background: 'linear-gradient(90deg, #63b3ed, #4299e1)',
                                transition: 'width 0.6s ease',
                            }} />
                        </div>
                        <div style={{ fontSize: 11, color: '#5a6b7a', marginTop: 5, textAlign: 'right' }}>
                            {tour.maxTeams - teamsCount} {t('tournaments.spotsLeft')}
                        </div>
                    </div>
                )}

                {tour.registrationDeadline && tour.status === 'registration' && (
                    <div style={{ marginTop: 10, fontSize: 11, color: '#5a6b7a' }}>
                        {t('tournaments.regUntil')} {new Date(tour.registrationDeadline).toLocaleDateString('ru', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TournamentsListPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const user = useSelector(s => s.auth.user);
    const [activeFilter, setActiveFilter] = useState(undefined);
    const { data, isLoading } = useGetTournamentsQuery({ status: activeFilter });

    const tournaments = data?.tournaments || [];

    const FILTERS = [
        { key: undefined,       label: t('tournaments.filters.all') },
        { key: 'registration',  label: t('tournaments.filters.registration') },
        { key: 'group_stage',   label: t('tournaments.filters.groupStage') },
        { key: 'playoff',       label: t('tournaments.filters.playoff') },
        { key: 'completed',     label: t('tournaments.filters.completed') },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0a0e1a 0%, #060a14 100%)',
            color: '#e0e6f0',
        }}>
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* Hero */}
            <div style={{
                background: 'linear-gradient(180deg, #0d1528 0%, #0a0e1a 100%)',
                padding: '48px 24px 36px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: -40, right: -40,
                    width: 300, height: 300,
                    background: 'radial-gradient(circle, rgba(240,192,64,0.08) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none',
                }} />
                <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>
                    <div style={{
                        fontSize: 13, fontWeight: 700, color: '#f0c040',
                        textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 10,
                    }}>
                        🏆 FOOTBALL BAKU
                    </div>
                    <h1 style={{
                        fontSize: 36, fontWeight: 900, color: '#e0e6f0', margin: 0, lineHeight: 1.1,
                        animation: 'fadeUp 0.5s ease',
                    }}>
                        {t('tournaments.title')}
                    </h1>
                    <p style={{ color: '#7a8ba0', marginTop: 10, fontSize: 15, marginBottom: 24 }}>
                        {t('tournaments.subtitle')}
                    </p>

                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginBottom: 16, flexWrap: 'wrap', gap: 12,
                    }}>
                        <div style={{ fontSize: 14, color: '#5a6b7a' }}>
                            {t('tournaments.findOrCreate')}
                        </div>
                        {user && (
                            <button
                                onClick={() => navigate('/tournaments/create')}
                                style={{
                                    padding: '10px 22px', borderRadius: 12, border: 'none',
                                    background: 'linear-gradient(135deg, #f0c040, #e07b20)',
                                    color: '#1a1a2e', fontWeight: 800, fontSize: 14,
                                    cursor: 'pointer', transition: 'opacity 0.2s',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                                🏆 {t('tournaments.createBtn')}
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {FILTERS.map(f => (
                            <button
                                key={String(f.key)}
                                onClick={() => setActiveFilter(f.key)}
                                style={{
                                    padding: '7px 16px', borderRadius: 20, border: 'none',
                                    cursor: 'pointer', fontWeight: 600, fontSize: 13,
                                    transition: 'all 0.2s',
                                    background: activeFilter === f.key
                                        ? 'linear-gradient(135deg, #f0c040, #e07b20)'
                                        : 'rgba(255,255,255,0.07)',
                                    color: activeFilter === f.key ? '#1a1a2e' : '#a0b0c0',
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 60 }}>
                        <Spin size="large" />
                    </div>
                ) : tournaments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#5a6b7a' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: '#7a8ba0' }}>
                            {t('tournaments.noTournaments')}
                        </div>
                        <div style={{ fontSize: 14, marginTop: 8 }}>
                            {t('tournaments.beFirstOrganizer')}
                        </div>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 20,
                    }}>
                        {tournaments.map((tour, i) => (
                            <div key={tour.id} style={{ animation: `fadeUp 0.4s ease ${i * 0.05}s both` }}>
                                <TournamentCard t={tour} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
