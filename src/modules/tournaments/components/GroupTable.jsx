import React from 'react';
import { useTranslation } from 'react-i18next';

const pos = (i) => {
    if (i < 2) return { background: 'rgba(72,187,120,0.15)', borderLeft: '3px solid #48bb78' };
    return { background: 'transparent', borderLeft: '3px solid transparent' };
};

export default function GroupTable({ group, onTeamClick }) {
    const { t } = useTranslation();
    const td = (key, opts) => t(`tournaments.detail.${key}`, opts);

    if (!group) return null;
    const { groupId, teams = [] } = group;

    return (
        <div style={{ marginBottom: 28 }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
            }}>
                <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f0c040, #e07b20)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 15, color: '#1a1a2e',
                }}>
                    {groupId}
                </div>
                <span style={{ color: '#e0e6f0', fontWeight: 700, fontSize: 16 }}>
                    {td('groupLabel')} {groupId}
                </span>
            </div>

            <div style={{
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
            }}>
                {/* Header */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr repeat(7, 1fr)',
                    padding: '8px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}>
                    {[td('tableTeam'), 'И', 'В', 'Н', 'П', 'ГЗ', 'ГП', 'О'].map((h) => (
                        <div key={h} style={{
                            fontSize: 11, fontWeight: 600, color: '#7a8ba0',
                            textAlign: h === 'Команда' ? 'left' : 'center',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                            {h}
                        </div>
                    ))}
                </div>

                {/* Rows */}
                {teams.map((team, i) => (
                    <div
                        key={team.id}
                        onClick={() => onTeamClick?.(team)}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr repeat(7, 1fr)',
                            padding: '10px 16px',
                            alignItems: 'center',
                            cursor: onTeamClick ? 'pointer' : 'default',
                            borderBottom: i < teams.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                            transition: 'background 0.15s',
                            ...pos(i),
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = pos(i).background}
                    >
                        {/* Team name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 22, height: 22, borderRadius: '50%',
                                background: i === 0 ? 'linear-gradient(135deg,#f0c040,#e07b20)' : i === 1 ? 'linear-gradient(135deg,#63b3ed,#4299e1)' : 'rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 700,
                                color: i < 2 ? '#1a1a2e' : '#7a8ba0',
                                flexShrink: 0,
                            }}>
                                {i + 1}
                            </div>
                            {team.teamLogo ? (
                                <img src={team.teamLogo} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{
                                    width: 26, height: 26, borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 10, fontWeight: 700, color: '#a0aec0',
                                }}>
                                    {team.teamName?.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            <span style={{ color: '#e0e6f0', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {team.teamName}
                            </span>
                            {i < 2 && (
                                <span style={{
                                    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                    background: 'rgba(72,187,120,0.2)', color: '#48bb78',
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                }}>
                                    PO
                                </span>
                            )}
                        </div>

                        {[
                            team.matchesPlayed,
                            team.wins,
                            team.draws,
                            team.losses,
                            team.goalsFor,
                            team.goalsAgainst,
                        ].map((v, j) => (
                            <div key={j} style={{ textAlign: 'center', color: '#a0b0c0', fontSize: 14 }}>{v ?? 0}</div>
                        ))}

                        {/* Points */}
                        <div style={{
                            textAlign: 'center',
                            fontWeight: 800,
                            fontSize: 16,
                            color: i === 0 ? '#f0c040' : '#e0e6f0',
                        }}>
                            {team.points ?? 0}
                        </div>
                    </div>
                ))}
            </div>

            {teams.length > 0 && (
                <div style={{ display: 'flex', gap: 16, marginTop: 8, paddingLeft: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(72,187,120,0.4)' }} />
                        <span style={{ fontSize: 11, color: '#7a8ba0' }}>{td('playoffAdvance')}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
