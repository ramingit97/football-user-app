import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from 'antd';
import { UserOutlined, PlusOutlined, StarFilled } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const DEFAULT_FORMATIONS = {
    '5x5': {
        formationString: '2-2',
        positions: [
            { name: 'GK', x: 50, y: 90 },
            { name: 'LB', x: 25, y: 70 },
            { name: 'RB', x: 75, y: 70 },
            { name: 'LF', x: 35, y: 35 },
            { name: 'RF', x: 65, y: 35 },
        ]
    },
    '6x6': {
        formationString: '2-2-1',
        positions: [
            { name: 'GK', x: 50, y: 90 },
            { name: 'LB', x: 25, y: 70 },
            { name: 'RB', x: 75, y: 70 },
            { name: 'LM', x: 25, y: 50 },
            { name: 'RM', x: 75, y: 50 },
            { name: 'ST', x: 50, y: 25 },
        ]
    },
    '8x8': {
        formationString: '3-3-1',
        positions: [
            { name: 'GK', x: 50, y: 90 },
            { name: 'LB', x: 20, y: 72 },
            { name: 'CB', x: 50, y: 75 },
            { name: 'RB', x: 80, y: 72 },
            { name: 'LM', x: 25, y: 50 },
            { name: 'CM', x: 50, y: 50 },
            { name: 'RM', x: 75, y: 50 },
            { name: 'ST', x: 50, y: 25 },
        ]
    },
    '11x11': {
        formationString: '4-4-2',
        positions: [
            { name: 'GK', x: 50, y: 92 },
            { name: 'LB', x: 15, y: 75 },
            { name: 'CB', x: 38, y: 78 },
            { name: 'CB2', x: 62, y: 78 },
            { name: 'RB', x: 85, y: 75 },
            { name: 'LM', x: 15, y: 50 },
            { name: 'CM', x: 38, y: 50 },
            { name: 'CM2', x: 62, y: 50 },
            { name: 'RM', x: 85, y: 50 },
            { name: 'LF', x: 35, y: 22 },
            { name: 'RF', x: 65, y: 22 },
        ]
    }
};

const TeamFieldView = ({
    team = 'A',
    players = [],
    teamName = 'Team',
    teamColor = '#ff4d4f',
    formation = '2-2',
    onPlayerClick,
    onPositionClick,
    hideEmptySlots = false,
    gameFormat = '6x6',
    isSelectionMode = false,
    isAnimating = false
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [shufflePhase, setShufflePhase] = useState('idle');
    const [displayPlayers, setDisplayPlayers] = useState(players);
    const prevAnimatingRef = useRef(false);
    const animationTimeoutRef = useRef(null);

    // Detect isAnimating false → true transition
    useEffect(() => {
        if (isAnimating && !prevAnimatingRef.current) {
            setShufflePhase('exit');

            animationTimeoutRef.current = setTimeout(() => {
                setDisplayPlayers(players);
                setShufflePhase('enter');

                animationTimeoutRef.current = setTimeout(() => {
                    setShufflePhase('idle');
                }, 1200);
            }, 600);
        } else if (!isAnimating && prevAnimatingRef.current) {
            // Animation ended externally — make sure we have latest players
            setDisplayPlayers(players);
            if (shufflePhase !== 'idle') {
                setShufflePhase('idle');
            }
        }

        prevAnimatingRef.current = isAnimating;

        return () => {
            if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
        };
    }, [isAnimating, players]);

    // Sync players when not animating
    useEffect(() => {
        if (!isAnimating && shufflePhase === 'idle') {
            setDisplayPlayers(players);
        }
    }, [players, isAnimating, shufflePhase]);

    const getFormationSlots = () => {
        const config = DEFAULT_FORMATIONS[gameFormat] || DEFAULT_FORMATIONS['6x6'];
        return config.positions;
    };

    const formationSlots = getFormationSlots();

    // ===== POSITION-AWARE ASSIGNMENT =====
    // First try to match players by their selected position, then fill remaining in order.
    const buildSlotAssignments = () => {
        const assignments = new Map();
        const currentPlayers = displayPlayers;
        const unassigned = [];

        // Pass 1: Match players to their selected position slot
        for (const player of currentPlayers) {
            if (player.position) {
                // Position format is "A-GK" or "B-LB" — extract slot name after the team prefix
                const posName = player.position.includes('-')
                    ? player.position.split('-').slice(1).join('-')
                    : player.position;

                const matchingSlot = formationSlots.find(s => s.name === posName);
                if (matchingSlot && !assignments.has(matchingSlot.name)) {
                    assignments.set(matchingSlot.name, player);
                    continue;
                }
            }
            unassigned.push(player);
        }

        // Pass 2: Fill remaining empty slots with unassigned players in order
        let unassignedIdx = 0;
        for (const slot of formationSlots) {
            if (!assignments.has(slot.name) && unassignedIdx < unassigned.length) {
                assignments.set(slot.name, unassigned[unassignedIdx]);
                unassignedIdx++;
            }
        }

        return assignments;
    };

    const slotAssignments = buildSlotAssignments();

    const handlePlayerClick = (player) => {
        if (onPlayerClick) {
            onPlayerClick(player);
        } else if (player?.id) {
            navigate(`/player/${player.id}`);
        }
    };

    const handleSlotClick = (pos) => {
        if (onPositionClick && isSelectionMode) {
            onPositionClick(pos.name, team);
        }
    };

    return (
        <div style={{ width: '100%' }}>
            {/* Team Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 12,
                padding: '8px 16px',
                background: `linear-gradient(135deg, ${teamColor}20, ${teamColor}10)`,
                borderRadius: 8,
                border: `1px solid ${teamColor}40`
            }}>
                <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: teamColor, border: '2px solid white',
                    boxShadow: `0 0 10px ${teamColor}60`
                }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {teamName}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>
                    ({formation})
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 4 }}>
                    • {players.length} {t('game.fieldView.players')}
                </span>
            </div>

            {/* Field */}
            <div style={{
                width: '100%',
                maxWidth: '450px',
                aspectRatio: '2/3',
                margin: '0 auto',
                background: 'linear-gradient(to bottom, #2e7d32, #388e3c)',
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                border: shufflePhase !== 'idle'
                    ? `3px solid ${teamColor}`
                    : '3px solid rgba(255,255,255,0.8)',
                boxShadow: shufflePhase !== 'idle'
                    ? `0 15px 40px rgba(0,0,0,0.4), 0 0 30px ${teamColor}40`
                    : '0 15px 40px rgba(0,0,0,0.4)',
                transition: 'border-color 0.5s ease, box-shadow 0.5s ease'
            }}>
                {/* Grass Pattern */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,0,0,0.05) 40px)',
                    pointerEvents: 'none'
                }} />

                {/* Goal Area */}
                <div style={{
                    position: 'absolute', top: 0, left: '30%', right: '30%', height: '50px',
                    border: '2px solid rgba(255,255,255,0.8)', borderTop: 'none',
                    background: 'rgba(255,255,255,0.05)'
                }} />

                {/* Penalty Area */}
                <div style={{
                    position: 'absolute', top: 0, left: '20%', right: '20%', height: '80px',
                    border: '2px solid rgba(255,255,255,0.8)', borderTop: 'none',
                    background: 'rgba(255,255,255,0.03)'
                }} />

                {/* Goal */}
                <div style={{
                    position: 'absolute', top: '-8px', left: '38%', right: '38%', height: '8px',
                    border: '2px solid rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.2)',
                    boxShadow: '0 0 15px rgba(255,255,255,0.5)'
                }} />

                {/* Center Circle */}
                <div style={{
                    position: 'absolute', top: '5%', left: '50%', width: '100px', height: '50px',
                    borderBottom: '2px solid rgba(255,255,255,0.6)',
                    borderLeft: '2px solid rgba(255,255,255,0.6)',
                    borderRight: '2px solid rgba(255,255,255,0.6)',
                    borderBottomLeftRadius: '50px', borderBottomRightRadius: '50px',
                    transform: 'translateX(-50%)'
                }} />

                {/* Halfway line */}
                <div style={{
                    position: 'absolute', top: '5%', left: 0, right: 0, height: '2px',
                    background: 'rgba(255,255,255,0.6)'
                }} />

                {/* Shuffle glow overlay */}
                <AnimatePresence>
                    {shufflePhase !== 'idle' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                position: 'absolute', inset: 0,
                                background: `radial-gradient(circle at center, ${teamColor}15 0%, transparent 70%)`,
                                pointerEvents: 'none', zIndex: 5
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Shuffling spinner */}
                <AnimatePresence>
                    {shufflePhase === 'exit' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.2 }}
                            style={{
                                position: 'absolute', top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 100, pointerEvents: 'none'
                            }}
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                style={{ fontSize: 40, textAlign: 'center' }}
                            >
                                ⚡
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Players */}
                <AnimatePresence mode="popLayout">
                    {formationSlots.map((slot, idx) => {
                        const playerInSlot = slotAssignments.get(slot.name) || null;

                        if (!playerInSlot && hideEmptySlots) return null;

                        return (
                            <PlayerNode
                                key={playerInSlot ? `player-${playerInSlot.id}` : `empty-${slot.name}`}
                                pos={slot}
                                player={playerInSlot}
                                teamColor={teamColor}
                                onPlayerClick={handlePlayerClick}
                                onPositionClick={() => handleSlotClick(slot)}
                                isSelectionMode={isSelectionMode}
                                shufflePhase={shufflePhase}
                                staggerIndex={idx}
                                totalSlots={formationSlots.length}
                            />
                        );
                    })}
                </AnimatePresence>

                {/* Particles during enter */}
                <AnimatePresence>
                    {shufflePhase === 'enter' && (
                        <>
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={`particle-${i}`}
                                    initial={{
                                        opacity: 0.8, scale: 0,
                                        x: `${30 + Math.random() * 40}%`,
                                        y: `${20 + Math.random() * 60}%`
                                    }}
                                    animate={{ opacity: 0, scale: 2, y: `${Math.random() * 100}%` }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.8 + Math.random() * 0.5, delay: i * 0.08 }}
                                    style={{
                                        position: 'absolute', width: 6, height: 6,
                                        borderRadius: '50%', background: teamColor,
                                        pointerEvents: 'none', zIndex: 50,
                                        boxShadow: `0 0 8px ${teamColor}`
                                    }}
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const PlayerNode = ({
    pos, player, teamColor, onPlayerClick, onPositionClick,
    isSelectionMode, shufflePhase, staggerIndex
}) => {
    const { t } = useTranslation();
    const isOccupied = !!player;

    const isGuest = player?.isGuest || player?.type === 'guest';

    const handleClick = () => {
        if (shufflePhase !== 'idle') return;
        if (isOccupied && player?.id && !isGuest) {
            onPlayerClick?.(player);
        } else if (!isOccupied && isSelectionMode) {
            onPositionClick?.(pos);
        }
    };

    const staggerDelay = staggerIndex * 0.12;

    const getAnimationProps = () => {
        if (shufflePhase === 'exit') {
            return {
                initial: { scale: 1, opacity: 1 },
                animate: {
                    scale: 0, opacity: 0,
                    rotate: (staggerIndex % 2 === 0 ? 1 : -1) * 180,
                    left: `${pos.x}%`, top: `${pos.y}%`,
                },
                transition: { duration: 0.4, delay: staggerDelay * 0.5, ease: 'easeIn' }
            };
        }
        if (shufflePhase === 'enter') {
            return {
                initial: { scale: 0, opacity: 0, left: '50%', top: '50%', rotate: (staggerIndex % 2 === 0 ? -1 : 1) * 90 },
                animate: { scale: 1, opacity: 1, left: `${pos.x}%`, top: `${pos.y}%`, rotate: 0 },
                transition: { type: 'spring', stiffness: 200, damping: 18, delay: staggerDelay }
            };
        }
        return {
            initial: false,
            animate: { left: `${pos.x}%`, top: `${pos.y}%`, scale: 1, opacity: 1, rotate: 0 },
            transition: { type: 'spring', stiffness: 300, damping: 30 }
        };
    };

    const animProps = getAnimationProps();
    const initials  = (player?.name || '')
        .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

    return (
        <motion.div
            layout={shufflePhase === 'idle'}
            initial={animProps.initial}
            animate={animProps.animate}
            exit={{ scale: 0, opacity: 0, rotate: 180, transition: { duration: 0.3, delay: staggerIndex * 0.05 } }}
            transition={animProps.transition}
            style={{
                position: 'absolute',
                width: '58px', height: '58px',
                marginLeft: '-29px', marginTop: '-29px',
                cursor: (isOccupied || isSelectionMode) && shufflePhase === 'idle' ? 'pointer' : 'default',
                zIndex: 10,
            }}
            onClick={handleClick}
            whileHover={shufflePhase === 'idle' && (isOccupied || isSelectionMode) ? { scale: 1.18, zIndex: 20 } : {}}
        >
            <Tooltip
                title={
                    shufflePhase !== 'idle' ? null : (
                        isOccupied ? (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: 700 }}>{player.name}</div>
                                {isGuest && <div style={{ fontSize: 11, color: '#a590f7', marginTop: 2 }}>Qonaq</div>}
                                {!isGuest && player.averageRating > 0 && (
                                    <div style={{ fontSize: 12, color: '#faad14' }}>
                                        ⭐ {player.averageRating?.toFixed(1)}
                                    </div>
                                )}
                                {!isGuest && (
                                    <div style={{ fontSize: 11, marginTop: 4, color: 'rgba(255,255,255,0.6)' }}>
                                        {t('game.fieldView.clickForProfile')}
                                    </div>
                                )}
                            </div>
                        ) : isSelectionMode ? t('game.fieldView.clickToOccupy') : t('game.fieldView.free')
                    )
                }
            >
                {/* ── Avatar circle ── */}
                <div style={{
                    width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
                    border: isOccupied
                        ? isGuest
                            ? '3px dashed rgba(165,144,247,0.85)'
                            : `3px solid rgba(255,215,0,0.85)`
                        : isSelectionMode
                            ? '2px solid rgba(82,196,26,0.8)'
                            : '2px dashed rgba(255,255,255,0.3)',
                    boxShadow: isOccupied
                        ? isGuest
                            ? '0 5px 18px rgba(0,0,0,0.35), 0 0 14px rgba(165,144,247,0.25)'
                            : `0 5px 18px rgba(0,0,0,0.45), 0 0 18px rgba(255,215,0,0.25), 0 0 22px ${teamColor}35`
                        : isSelectionMode ? '0 0 10px rgba(82,196,26,0.35)' : 'none',
                    background: isOccupied
                        ? isGuest
                            ? 'linear-gradient(145deg, #7c6af7cc, #5c4fd6aa)'
                            : `linear-gradient(145deg, ${teamColor}ee, ${teamColor}88)`
                        : 'rgba(0,0,0,0.32)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                }}>
                    {isOccupied ? (
                        player.avatar
                            ? <img src={player.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            : <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: -0.5, userSelect: 'none' }}>
                                {initials}
                              </span>
                    ) : (
                        <PlusOutlined style={{
                            color: isSelectionMode ? 'rgba(82,196,26,0.9)' : 'rgba(255,255,255,0.35)',
                            fontSize: 18,
                        }} />
                    )}
                </div>
            </Tooltip>

            {/* Position badge (top-right corner) */}
            {isOccupied && shufflePhase !== 'exit' && (
                <div style={{
                    position: 'absolute', top: -3, right: -3,
                    background: 'rgba(0,0,0,0.8)', border: `1px solid ${teamColor}55`,
                    borderRadius: 5, padding: '1px 4px',
                    color: teamColor, fontSize: 8, fontWeight: 800, letterSpacing: 0.3,
                    lineHeight: 1.5, pointerEvents: 'none',
                }}>
                    {pos.name}
                </div>
            )}

            {/* Name badge */}
            <AnimatePresence>
                {isOccupied && shufflePhase !== 'exit' && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ delay: shufflePhase === 'enter' ? staggerIndex * 0.12 + 0.3 : 0, duration: 0.2 }}
                        style={{
                            position: 'absolute', bottom: -20, left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(0,0,0,0.82)',
                            border: `1px solid ${teamColor}30`,
                            padding: '2px 7px', borderRadius: 8,
                            color: '#fff', fontSize: 10, fontWeight: 600,
                            whiteSpace: 'nowrap', maxWidth: 72,
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                            pointerEvents: 'none',
                        }}
                    >
                        {player.name?.split(' ')[0]}
                        {player.averageRating > 4 && (
                            <StarFilled style={{ color: '#faad14', fontSize: 8, marginLeft: 3 }} />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default TeamFieldView;