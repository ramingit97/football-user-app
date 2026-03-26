import { useState } from 'react';
import { Tooltip, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

// Позиции на поле для разных форматов игры
const fieldPositions = {
    '5x5': {
        team1: [
            { id: 'gk1', x: 10, y: 50, role: 'Вратарь' },
            { id: 'def1', x: 25, y: 30, role: 'Защитник' },
            { id: 'def2', x: 25, y: 70, role: 'Защитник' },
            { id: 'mid1', x: 40, y: 50, role: 'Полузащитник' },
            { id: 'fwd1', x: 48, y: 50, role: 'Нападающий' },
        ],
        team2: [
            { id: 'gk2', x: 90, y: 50, role: 'Вратарь' },
            { id: 'def3', x: 75, y: 30, role: 'Защитник' },
            { id: 'def4', x: 75, y: 70, role: 'Защитник' },
            { id: 'mid2', x: 60, y: 50, role: 'Полузащитник' },
            { id: 'fwd2', x: 52, y: 50, role: 'Нападающий' },
        ]
    },
    '7x7': {
        team1: [
            { id: 'gk1', x: 8, y: 50, role: 'Вратарь' },
            { id: 'def1', x: 20, y: 25, role: 'Защитник' },
            { id: 'def2', x: 20, y: 50, role: 'Защитник' },
            { id: 'def3', x: 20, y: 75, role: 'Защитник' },
            { id: 'mid1', x: 35, y: 35, role: 'Полузащитник' },
            { id: 'mid2', x: 35, y: 65, role: 'Полузащитник' },
            { id: 'fwd1', x: 48, y: 50, role: 'Нападающий' },
        ],
        team2: [
            { id: 'gk2', x: 92, y: 50, role: 'Вратарь' },
            { id: 'def4', x: 80, y: 25, role: 'Защитник' },
            { id: 'def5', x: 80, y: 50, role: 'Защитник' },
            { id: 'def6', x: 80, y: 75, role: 'Защитник' },
            { id: 'mid3', x: 65, y: 35, role: 'Полузащитник' },
            { id: 'mid4', x: 65, y: 65, role: 'Полузащитник' },
            { id: 'fwd2', x: 52, y: 50, role: 'Нападающий' },
        ]
    },
    '11x11': {
        team1: [
            { id: 'gk1', x: 5, y: 50, role: 'Вратарь' },
            { id: 'def1', x: 18, y: 15, role: 'Защитник' },
            { id: 'def2', x: 15, y: 35, role: 'Защитник' },
            { id: 'def3', x: 15, y: 65, role: 'Защитник' },
            { id: 'def4', x: 18, y: 85, role: 'Защитник' },
            { id: 'mid1', x: 32, y: 25, role: 'Полузащитник' },
            { id: 'mid2', x: 30, y: 50, role: 'Полузащитник' },
            { id: 'mid3', x: 32, y: 75, role: 'Полузащитник' },
            { id: 'fwd1', x: 43, y: 30, role: 'Нападающий' },
            { id: 'fwd2', x: 45, y: 50, role: 'Нападающий' },
            { id: 'fwd3', x: 43, y: 70, role: 'Нападающий' },
        ],
        team2: [
            { id: 'gk2', x: 95, y: 50, role: 'Вратарь' },
            { id: 'def5', x: 82, y: 15, role: 'Защитник' },
            { id: 'def6', x: 85, y: 35, role: 'Защитник' },
            { id: 'def7', x: 85, y: 65, role: 'Защитник' },
            { id: 'def8', x: 82, y: 85, role: 'Защитник' },
            { id: 'mid4', x: 68, y: 25, role: 'Полузащитник' },
            { id: 'mid5', x: 70, y: 50, role: 'Полузащитник' },
            { id: 'mid6', x: 68, y: 75, role: 'Полузащитник' },
            { id: 'fwd4', x: 57, y: 30, role: 'Нападающий' },
            { id: 'fwd5', x: 55, y: 50, role: 'Нападающий' },
            { id: 'fwd6', x: 57, y: 70, role: 'Нападающий' },
        ]
    }
};

const FootballField = ({
    gameType = '7x7',
    players = [],
    onPositionClick,
    selectedPosition,
    isSelectionMode = false
}) => {
    const { t } = useTranslation();
    const positions = fieldPositions[gameType] || fieldPositions['7x7'];
    const allPositions = [...positions.team1, ...positions.team2];

    const roleTranslations = {
        'Вратарь': t('positions.goalkeeper'),
        'Защитник': t('positions.defender'),
        'Полузащитник': t('positions.midfielder'),
        'Нападающий': t('positions.forward'),
    };
    const translateRole = (role) => roleTranslations[role] || role;

    // Сопоставляем игроков с позициями
    const getPlayerAtPosition = (positionId) => {
        return players.find(p => p.position === positionId);
    };

    const handlePositionClick = (position, team) => {
        if (onPositionClick && isSelectionMode) {
            onPositionClick(position, team);
        }
    };

    return (
        <div className="football-field-container">
            <svg
                viewBox="0 0 100 70"
                className="football-field"
                style={{
                    width: '100%',
                    maxWidth: '800px',
                    height: 'auto',
                    aspectRatio: '100 / 70'
                }}
            >
                {/* Поле - градиентный фон */}
                <defs>
                    <linearGradient id="fieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1a472a" />
                        <stop offset="50%" stopColor="#2d5a3d" />
                        <stop offset="100%" stopColor="#1a472a" />
                    </linearGradient>
                    <linearGradient id="team1Gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#52c41a" />
                        <stop offset="100%" stopColor="#73d13d" />
                    </linearGradient>
                    <linearGradient id="team2Gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1890ff" />
                        <stop offset="100%" stopColor="#40a9ff" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Газон */}
                <rect x="0" y="0" width="100" height="70" fill="url(#fieldGradient)" rx="2" />

                {/* Полосы на газоне */}
                {[...Array(10)].map((_, i) => (
                    <rect
                        key={i}
                        x={i * 10}
                        y="0"
                        width="10"
                        height="70"
                        fill={i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
                    />
                ))}

                {/* Центральная линия */}
                <line x1="50" y1="0" x2="50" y2="70" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" />

                {/* Центральный круг */}
                <circle cx="50" cy="35" r="9" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" />
                <circle cx="50" cy="35" r="0.5" fill="rgba(255,255,255,0.5)" />

                {/* Штрафная зона - левая */}
                <rect x="0" y="15" width="16" height="40" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" />
                <rect x="0" y="25" width="6" height="20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" />

                {/* Штрафная зона - правая */}
                <rect x="84" y="15" width="16" height="40" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" />
                <rect x="94" y="25" width="6" height="20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" />

                {/* Ворота */}
                <rect x="-2" y="28" width="2" height="14" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.2" />
                <rect x="100" y="28" width="2" height="14" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.2" />

                {/* Угловые дуги */}
                <path d="M 0 2 A 2 2 0 0 0 2 0" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" />
                <path d="M 98 0 A 2 2 0 0 0 100 2" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" />
                <path d="M 0 68 A 2 2 0 0 1 2 70" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" />
                <path d="M 98 70 A 2 2 0 0 1 100 68" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" />

                {/* Границы поля */}
                <rect x="0" y="0" width="100" height="70" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" rx="1" />
            </svg>

            {/* Позиции игроков поверх SVG */}
            <div className="field-positions">
                {/* Команда 1 */}
                {positions.team1.map((pos) => {
                    const player = getPlayerAtPosition(pos.id);
                    const isSelected = selectedPosition === pos.id;
                    const isEmpty = !player;

                    return (
                        <Tooltip
                            key={pos.id}
                            title={
                                <div>
                                    <div style={{ fontWeight: 600 }}>{translateRole(pos.role)}</div>
                                    {player && <div>{player.name}</div>}
                                    {isEmpty && isSelectionMode && <div>{t('game.interactiveField.takePosition')}</div>}
                                </div>
                            }
                        >
                            <div
                                className={`field-position team1 ${isEmpty ? 'empty' : ''} ${isSelected ? 'selected' : ''} ${isSelectionMode && isEmpty ? 'selectable' : ''}`}
                                style={{
                                    left: `${pos.x}%`,
                                    top: `${(pos.y / 70) * 100}%`,
                                }}
                                onClick={() => isEmpty && handlePositionClick(pos, 'team1')}
                            >
                                {player ? (
                                    <Avatar
                                        shape="square"
                                        size={40}
                                        src={player.avatar || player.avatarUrl}
                                        style={{ backgroundColor: '#52c41a', borderRadius: '8px' }}
                                    >
                                        {player.name?.charAt(0)}
                                    </Avatar>
                                ) : (
                                    <div className="empty-position">
                                        <UserOutlined />
                                    </div>
                                )}
                            </div>
                        </Tooltip>
                    );
                })}

                {/* Команда 2 */}
                {positions.team2.map((pos) => {
                    const player = getPlayerAtPosition(pos.id);
                    const isSelected = selectedPosition === pos.id;
                    const isEmpty = !player;

                    return (
                        <Tooltip
                            key={pos.id}
                            title={
                                <div>
                                    <div style={{ fontWeight: 600 }}>{translateRole(pos.role)}</div>
                                    {player && <div>{player.name}</div>}
                                    {isEmpty && isSelectionMode && <div>{t('game.interactiveField.takePosition')}</div>}
                                </div>
                            }
                        >
                            <div
                                className={`field-position team2 ${isEmpty ? 'empty' : ''} ${isSelected ? 'selected' : ''} ${isSelectionMode && isEmpty ? 'selectable' : ''}`}
                                style={{
                                    left: `${pos.x}%`,
                                    top: `${(pos.y / 70) * 100}%`,
                                }}
                                onClick={() => isEmpty && handlePositionClick(pos, 'team2')}
                            >
                                {player ? (
                                    <Avatar
                                        shape="square"
                                        size={40}
                                        src={player.avatar || player.avatarUrl}
                                        style={{ backgroundColor: '#1890ff', borderRadius: '8px' }}
                                    >
                                        {player.name?.charAt(0)}
                                    </Avatar>
                                ) : (
                                    <div className="empty-position">
                                        <UserOutlined />
                                    </div>
                                )}
                            </div>
                        </Tooltip>
                    );
                })}
            </div>

            <style>{`
        .football-field-container {
          position: relative;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 60px rgba(82, 196, 26, 0.1);
        }

        .football-field {
          display: block;
        }

        .field-positions {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .field-position {
          position: absolute;
          transform: translate(-50%, -50%);
          pointer-events: auto;
          transition: all 0.3s ease;
          z-index: 10;
        }

        .field-position.team1 .ant-avatar,
        .field-position.team1 .empty-position {
          border: 2px solid #52c41a;
          box-shadow: 0 0 10px rgba(82, 196, 26, 0.5);
        }

        .field-position.team2 .ant-avatar,
        .field-position.team2 .empty-position {
          border: 2px solid #1890ff;
          box-shadow: 0 0 10px rgba(24, 144, 255, 0.5);
        }

        .empty-position {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 14px;
        }

        .field-position.selectable {
          cursor: pointer;
        }

        .field-position.selectable:hover .empty-position {
          background: rgba(82, 196, 26, 0.3);
          color: #52c41a;
          transform: scale(1.1);
        }

        .field-position.selected .empty-position {
          background: rgba(82, 196, 26, 0.6);
          color: white;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 10px rgba(82, 196, 26, 0.5); }
          50% { box-shadow: 0 0 20px rgba(82, 196, 26, 0.8); }
        }

        .field-position .ant-avatar {
          cursor: default;
        }

        .field-position:hover .ant-avatar {
          transform: scale(1.1);
        }
      `}</style>
        </div>
    );
};

export default FootballField;
