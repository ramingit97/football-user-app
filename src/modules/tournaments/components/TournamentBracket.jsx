import React from 'react';
import { useTranslation } from 'react-i18next';

function BracketMatch({ match, highlight }) {
    if (!match) {
        return (
            <div style={{
                width: 200, borderRadius: 10,
                background: 'rgba(255,255,255,0.03)',
                border: '1px dashed rgba(255,255,255,0.12)',
                padding: '10px 14px',
                opacity: 0.5,
            }}>
                <div style={{ height: 28 }} />
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '6px 0' }} />
                <div style={{ height: 28 }} />
            </div>
        );
    }

    const isPlayed = match.status === 'played' || match.status?.startsWith('walkover');
    const homeTbd = match.homeTeamId === 'TBD' || match.homeTeamName === '?';
    const awayTbd = match.awayTeamId === 'TBD' || match.awayTeamName === '?';
    const homeWins = isPlayed && match.homeScore > match.awayScore;
    const awayWins = isPlayed && match.awayScore > match.homeScore;

    const renderTeam = (name, logo, score, wins, tbd) => (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 0',
            opacity: tbd ? 0.4 : 1,
        }}>
            {logo && !tbd ? (
                <img src={logo} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
                <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, color: '#5a6b7a', fontWeight: 700,
                }}>
                    {tbd ? '?' : name?.substring(0, 2).toUpperCase()}
                </div>
            )}
            <span style={{
                flex: 1, fontSize: 13, fontWeight: wins ? 700 : 400,
                color: tbd ? '#4a5b6a' : wins ? '#e0e6f0' : '#8a9aaa',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: 110,
            }}>
                {tbd ? 'Определяется' : name}
            </span>
            {isPlayed && (
                <span style={{
                    fontSize: 15, fontWeight: 800, minWidth: 18, textAlign: 'center',
                    color: wins ? '#f0c040' : '#5a6b7a',
                }}>
                    {score ?? 0}
                </span>
            )}
        </div>
    );

    return (
        <div style={{
            width: 210,
            borderRadius: 12,
            background: highlight
                ? 'linear-gradient(135deg, rgba(240,192,64,0.12), rgba(224,123,32,0.08))'
                : 'rgba(255,255,255,0.04)',
            border: `1px solid ${highlight ? 'rgba(240,192,64,0.4)' : 'rgba(255,255,255,0.08)'}`,
            padding: '10px 14px',
            transition: 'all 0.3s',
            boxShadow: highlight ? '0 0 20px rgba(240,192,64,0.15)' : 'none',
        }}>
            {renderTeam(match.homeTeamName, match.homeTeamLogo, match.homeScore, homeWins, homeTbd)}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0' }} />
            {renderTeam(match.awayTeamName, match.awayTeamLogo, match.awayScore, awayWins, awayTbd)}
        </div>
    );
}

// Connector line between rounds
function Connector({ count = 2 }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: 0 }}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} style={{
                    display: 'flex', alignItems: 'center', height: 74,
                    position: 'relative',
                }}>
                    <div style={{
                        position: 'absolute', left: 0, right: 0, top: '50%',
                        height: 1, background: 'rgba(255,255,255,0.1)',
                    }} />
                </div>
            ))}
        </div>
    );
}

function BracketColumn({ title, matches, highlighted = [] }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            <div style={{
                fontSize: 11, fontWeight: 700, color: '#7a8ba0',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                marginBottom: 16, padding: '4px 12px',
                background: 'rgba(255,255,255,0.05)', borderRadius: 6,
            }}>
                {title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {matches.map((m, i) => (
                    <BracketMatch key={m?.id || i} match={m} highlight={highlighted.includes(m?.bracketPosition)} />
                ))}
            </div>
        </div>
    );
}

// Center trophy
function TrophyCenter({ winner }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '0 20px', minWidth: 120,
        }}>
            <div style={{
                width: 80, height: 80,
                background: 'linear-gradient(135deg, #f0c040, #e07b20)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36,
                boxShadow: '0 0 40px rgba(240,192,64,0.4), 0 0 80px rgba(240,192,64,0.15)',
                animation: 'trophyPulse 2.5s ease-in-out infinite',
            }}>
                🏆
            </div>
            {winner && (
                <div style={{
                    marginTop: 12, textAlign: 'center',
                    padding: '6px 14px',
                    background: 'linear-gradient(135deg, rgba(240,192,64,0.2), rgba(224,123,32,0.1))',
                    border: '1px solid rgba(240,192,64,0.3)',
                    borderRadius: 20,
                }}>
                    <div style={{ fontSize: 10, color: '#f0c040', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                        Чемпион
                    </div>
                    <div style={{ fontSize: 12, color: '#e0e6f0', fontWeight: 700 }}>{winner}</div>
                </div>
            )}
        </div>
    );
}

function Arrow({ direction = 'right' }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center',
            padding: '0 6px',
        }}>
            <div style={{
                width: 30, height: 1,
                background: 'linear-gradient(90deg, rgba(240,192,64,0.3), rgba(240,192,64,0.6))',
                position: 'relative',
            }}>
                {direction === 'right' && (
                    <div style={{
                        position: 'absolute', right: -4, top: -3,
                        width: 0, height: 0,
                        borderLeft: '6px solid rgba(240,192,64,0.6)',
                        borderTop: '4px solid transparent',
                        borderBottom: '4px solid transparent',
                    }} />
                )}
                {direction === 'left' && (
                    <div style={{
                        position: 'absolute', left: -4, top: -3,
                        width: 0, height: 0,
                        borderRight: '6px solid rgba(240,192,64,0.6)',
                        borderTop: '4px solid transparent',
                        borderBottom: '4px solid transparent',
                    }} />
                )}
            </div>
        </div>
    );
}

export default function TournamentBracket({ bracket, status }) {
    const { t } = useTranslation();
    const tm = (key) => t(`tournaments.match.${key}`);

    if (!bracket || bracket.length === 0) {
        return (
            <div style={{
                textAlign: 'center', padding: '60px 20px',
                color: '#5a6b7a',
            }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{t('tournaments.detail.bracketEmpty')}</div>
            </div>
        );
    }

    const getByStage = (stage) => bracket.find(b => b.stage === stage)?.matches || [];
    const qf = getByStage('quarterfinal');
    const sf = getByStage('semifinal');
    const finals = getByStage('final');
    const finalMatch = finals[0] || null;

    const hasQF = qf.length > 0;
    const winner = finalMatch?.status === 'played' && finalMatch?.winnerId
        ? (finalMatch.winnerId === finalMatch.homeTeamId ? finalMatch.homeTeamName : finalMatch.awayTeamName)
        : null;

    // 16-team: QF + SF + Final layout
    if (hasQF) {
        const leftQF = qf.filter(m => m.bracketPosition <= 2).sort((a, b) => a.bracketPosition - b.bracketPosition);
        const rightQF = qf.filter(m => m.bracketPosition >= 3).sort((a, b) => a.bracketPosition - b.bracketPosition);
        const leftSF = sf.filter(m => m.bracketPosition === 5);
        const rightSF = sf.filter(m => m.bracketPosition === 6);

        return (
            <div style={{ overflowX: 'auto', padding: '20px 0' }}>
                <style>{`
                    @keyframes trophyPulse {
                        0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(240,192,64,0.4); }
                        50% { transform: scale(1.06); box-shadow: 0 0 60px rgba(240,192,64,0.6); }
                    }
                `}</style>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 0, minWidth: 900,
                }}>
                    {/* Left QF */}
                    <BracketColumn title={tm('quarterfinal')} matches={leftQF} />
                    <Arrow direction="right" />
                    {/* Left SF */}
                    <BracketColumn title={tm('semifinal')} matches={leftSF} />
                    <Arrow direction="right" />
                    {/* Trophy */}
                    <TrophyCenter winner={winner} />
                    <Arrow direction="left" />
                    {/* Right SF */}
                    <BracketColumn title={tm('semifinal')} matches={rightSF} />
                    <Arrow direction="left" />
                    {/* Right QF */}
                    <BracketColumn title={tm('quarterfinal')} matches={rightQF} />
                </div>

                {/* Final match below trophy */}
                {finalMatch && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: 11, fontWeight: 700, color: '#f0c040',
                                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
                            }}>
                                {tm('final')}
                            </div>
                            <BracketMatch match={finalMatch} highlight={true} />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // 8-team: SF + Final layout
    const leftSF = sf.filter(m => m.bracketPosition === 1);
    const rightSF = sf.filter(m => m.bracketPosition === 2);

    return (
        <div style={{ overflowX: 'auto', padding: '20px 0' }}>
            <style>{`
                @keyframes trophyPulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(240,192,64,0.4); }
                    50% { transform: scale(1.06); box-shadow: 0 0 60px rgba(240,192,64,0.6); }
                }
            `}</style>
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 0, minWidth: 700,
            }}>
                <BracketColumn title={tm('semifinal')} matches={leftSF} />
                <Arrow direction="right" />
                <TrophyCenter winner={winner} />
                <Arrow direction="left" />
                <BracketColumn title={tm('semifinal')} matches={rightSF} />
            </div>

            {finalMatch && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: 11, fontWeight: 700, color: '#f0c040',
                            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
                        }}>
                            {tm('final')}
                        </div>
                        <BracketMatch match={finalMatch} highlight={true} />
                    </div>
                </div>
            )}
        </div>
    );
}
