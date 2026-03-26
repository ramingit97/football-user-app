import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Draggable from 'react-draggable';
import { UserOutlined, PlusOutlined, StarFilled } from '@ant-design/icons';
import { Avatar, Tooltip, Badge } from 'antd';

const InteractiveFootballField = ({
    formationA,
    formationB,
    players = [],
    onPositionClick,
    isOrganizer,
    teamAColor = '#ff4d4f',
    teamBColor = '#1890ff',
    currentUser,
    gameFormat = '5x5',
    onPlayerClick, // Optional: callback when player is clicked
    hideEmptySlots = false
}) => {
    const navigate = useNavigate();
    const fieldRef = useRef(null);
    const [positions, setPositions] = useState([]);

    // Standard formations coordinates (percentages)
    const getFormationCoords = (formation, isTeamA) => {
        const coords = [];

        // GK is always there
        coords.push({ x: 50, y: isTeamA ? 90 : 10, role: 'GK' });

        // Parse formation string (e.g. "2-2", "1-2-1", "4-4-2")
        const parts = formation ? formation.split('-').map(Number) : [2, 2];

        const totalLines = parts.length + 1; // +1 for GK line

        let currentLine = 1;
        parts.forEach(count => {
            // Calculate Y position for this line
            const yStep = 40 / totalLines;
            const y = isTeamA
                ? 85 - (currentLine * yStep)
                : 15 + (currentLine * yStep);

            for (let i = 0; i < count; i++) {
                // Distribute players evenly across the width (X axis)
                const x = ((i + 1) * 100) / (count + 1);
                coords.push({ x, y, role: 'FIELD' });
            }
            currentLine++;
        });

        return coords;
    };

    useEffect(() => {
        // Generate initial positions based on formations
        const coordsA = getFormationCoords(formationA || '2-2', true);
        const coordsB = getFormationCoords(formationB || '2-2', false);

        let initialPositions = [
            ...coordsA.map((c, i) => ({ ...c, id: `A-${i}`, team: 'A' })),
            ...coordsB.map((c, i) => ({ ...c, id: `B-${i}`, team: 'B' }))
        ];

        setPositions(initialPositions);
    }, [formationA, formationB, gameFormat]);

    return (
        <div
            ref={fieldRef}
            id="tactical-board"
            style={{
                width: '100%',
                height: '600px',
                background: 'linear-gradient(to bottom, #2e7d32, #388e3c)', // Gradient grass
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '4px solid rgba(255,255,255,0.8)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                perspective: '1000px' // Add depth
            }}
        >
            {/* Grass Pattern Overlay */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(0,0,0,0.05) 50px, rgba(0,0,0,0.05) 99px)',
                pointerEvents: 'none'
            }} />

            {/* Center Line */}
            <div style={{
                position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.8)', transform: 'translateY(-50%)',
                boxShadow: '0 0 10px rgba(255,255,255,0.3)'
            }} />

            {/* Center Circle */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%', width: '120px', height: '120px',
                border: '2px solid rgba(255,255,255,0.8)', borderRadius: '50%', transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 10px rgba(255,255,255,0.3)'
            }} />

            {/* Penalty Areas */}
            <div style={{
                position: 'absolute', top: 0, left: '25%', right: '25%', height: '80px',
                border: '2px solid rgba(255,255,255,0.8)', borderTop: 'none',
                background: 'rgba(255,255,255,0.05)'
            }} />
            <div style={{
                position: 'absolute', bottom: 0, left: '25%', right: '25%', height: '80px',
                border: '2px solid rgba(255,255,255,0.8)', borderBottom: 'none',
                background: 'rgba(255,255,255,0.05)'
            }} />

            {/* Goals */}
            <div style={{
                position: 'absolute', top: '-10px', left: '40%', right: '40%', height: '10px',
                border: '2px solid rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.2)',
                boxShadow: '0 0 15px rgba(255,255,255,0.5)'
            }} />
            <div style={{
                position: 'absolute', bottom: '-10px', left: '40%', right: '40%', height: '10px',
                border: '2px solid rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.2)',
                boxShadow: '0 0 15px rgba(255,255,255,0.5)'
            }} />

            {/* Players/Slots */}

            {/* Empty Slots (Formation Positions) */}
            {positions.map((pos) => {
                // Check if this slot is occupied by a player using the slot ID
                const playerInSlot = players.find(p => p.position === pos.id);

                // If occupied by a player who HAS coordinates, they are already rendered in the explicit block (or will be). 
                // We should NOT render the slot here if we want to avoid duplication/underlap.
                // But actually, if we want the slot to be clickable foundation, maybe we render it?
                // No, if player is there, we want ONLY the player.

                if (playerInSlot && playerInSlot.x !== undefined && playerInSlot.y !== undefined) return null;

                // If occupied by a player WITHOUT coordinates (legacy), render them here
                if (playerInSlot) {
                    return (
                        <PlayerNode
                            key={pos.id}
                            pos={pos}
                            fieldRef={fieldRef}
                            isOrganizer={isOrganizer}
                            teamAColor={teamAColor}
                            teamBColor={teamBColor}
                            onPositionClick={onPositionClick}
                            player={playerInSlot}
                            navigate={navigate}
                            onPlayerClick={onPlayerClick}
                        />
                    );
                }

                // If slot is empty, render it
                if (hideEmptySlots) return null;

                return (
                    <PlayerNode
                        key={pos.id}
                        pos={pos}
                        fieldRef={fieldRef}
                        isOrganizer={isOrganizer}
                        teamAColor={teamAColor}
                        teamBColor={teamBColor}
                        onPositionClick={onPositionClick}
                        player={null}
                        navigate={navigate}
                        onPlayerClick={onPlayerClick}
                    />
                );
            })}

            {/* Players with explicit coordinates (Rendered ON TOP) */}
            {players.filter(p => p.x !== undefined && p.y !== undefined).map((player) => (
                <PlayerNode
                    key={player.id}
                    pos={{ x: player.x, y: player.y, id: player.id, team: player.team }}
                    fieldRef={fieldRef}
                    isOrganizer={isOrganizer}
                    teamAColor={teamAColor}
                    teamBColor={teamBColor}
                    onPositionClick={onPositionClick}
                    player={player}
                    navigate={navigate}
                    onPlayerClick={onPlayerClick}
                />
            ))}
        </div>
    );
};

export const PlayerNode = ({ pos, fieldRef, isOrganizer, teamAColor, teamBColor, onPositionClick, player, navigate, onPlayerClick }) => {
    const isTeamA = pos.team === 'A';
    const color = isTeamA ? teamAColor : teamBColor;
    const isOccupied = !!player;

    const handleClick = () => {
        if (isOccupied && player?.id) {
            // Navigate to player profile or call callback
            if (onPlayerClick) {
                onPlayerClick(player);
            } else if (navigate) {
                navigate(`/player/${player.id}`);
            }
        } else if (!isOccupied && onPositionClick) {
            onPositionClick(pos);
        }
    };

    return (
        <div
            style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: '60px',
                height: '60px',
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'all 0.3s ease'
            }}
            onClick={handleClick}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.15)';
                e.currentTarget.style.zIndex = '20';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                e.currentTarget.style.zIndex = '10';
            }}
        >
            <Tooltip
                title={
                    isOccupied ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: 'bold' }}>{player.name}</div>
                            {player.averageRating > 0 && (
                                <div style={{ fontSize: 12, color: '#faad14' }}>
                                    ⭐ {player.averageRating?.toFixed(1)}
                                </div>
                            )}
                            <div style={{ fontSize: 11, marginTop: 4, color: 'rgba(255,255,255,0.7)' }}>
                                Нажмите для просмотра профиля
                            </div>
                        </div>
                    ) : (
                        isOrganizer ? "Position" : "Занять место"
                    )
                }
            >
                <div style={{
                    width: '100%',
                    height: '100%',
                    background: isOccupied
                        ? `linear-gradient(145deg, ${color}dd, ${color}99)`
                        : `linear-gradient(145deg, ${color}, ${color}cc)`,
                    borderRadius: '50%',
                    border: isOccupied ? '3px solid gold' : '3px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isOccupied
                        ? '0 6px 20px rgba(0,0,0,0.5), 0 0 15px rgba(255,215,0,0.3)'
                        : '0 4px 12px rgba(0,0,0,0.4)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                }}>
                    {isOccupied ? (
                        <Avatar
                            src={player.avatar}
                            size={54}
                            icon={<UserOutlined />}
                            style={{
                                backgroundColor: 'transparent',
                                fontSize: 24
                            }}
                        >
                            {!player.avatar && player.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                    ) : (
                        <PlusOutlined style={{ color: 'white', fontSize: 22 }} />
                    )}
                </div>
            </Tooltip>

            {/* Player Name Badge */}
            {isOccupied && (
                <div style={{
                    position: 'absolute',
                    bottom: -22,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.85), rgba(0,0,0,0.7))',
                    padding: '3px 10px',
                    borderRadius: 12,
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    {player.name?.split(' ')[0]}
                    {player.averageRating > 4 && (
                        <StarFilled style={{ color: '#faad14', fontSize: 10, marginLeft: 4 }} />
                    )}
                </div>
            )}
        </div>
    );
};


export default InteractiveFootballField;
