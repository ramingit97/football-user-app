import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from 'antd';
import { PlusOutlined, StarFilled } from '@ant-design/icons';
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
            { name: 'GK',  x: 50, y: 92 },
            { name: 'LB',  x: 15, y: 75 },
            { name: 'CB',  x: 38, y: 78 },
            { name: 'CB2', x: 62, y: 78 },
            { name: 'RB',  x: 85, y: 75 },
            { name: 'LM',  x: 15, y: 50 },
            { name: 'CM',  x: 38, y: 50 },
            { name: 'CM2', x: 62, y: 50 },
            { name: 'RM',  x: 85, y: 50 },
            { name: 'LF',  x: 35, y: 22 },
            { name: 'RF',  x: 65, y: 22 },
        ]
    }
};

const CARD_W = 54;
const LABEL_H = 15;
const CARD_H = 68;

// Compute tactical pass arrows between formation lines
const computeArrows = (slots) => {
    const sorted = [...slots].sort((a, b) => b.y - a.y);
    const rows = [];
    sorted.forEach(slot => {
        const last = rows[rows.length - 1];
        if (!last || Math.abs(last[0].y - slot.y) > 12) rows.push([slot]);
        else last.push(slot);
    });

    const arrows = [];
    for (let i = 0; i < rows.length - 1; i++) {
        const fromRow = rows[i];
        const toRow   = rows[i + 1];
        fromRow.forEach(from => {
            const byDist = [...toRow].sort((a, b) => Math.abs(a.x - from.x) - Math.abs(b.x - from.x));
            byDist.slice(0, Math.min(2, toRow.length)).forEach(to => {
                arrows.push({ fx: from.x, fy: from.y, tx: to.x, ty: to.y });
            });
        });
    }
    return arrows;
};

const TacticalArrows = ({ slots }) => {
    const arrows = computeArrows(slots);
    return (
        <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
        >
            <defs>
                <marker id="arrowhead" markerWidth="3.5" markerHeight="3" refX="3" refY="1.5" orient="auto">
                    <polygon points="0 0, 3.5 1.5, 0 3" fill="rgba(180,255,120,0.5)" />
                </marker>
            </defs>
            {arrows.map((a, i) => (
                <line
                    key={i}
                    x1={a.fx} y1={a.fy} x2={a.tx} y2={a.ty}
                    stroke="rgba(160,255,100,0.28)"
                    strokeWidth="0.75"
                    strokeDasharray="2.5 2"
                    markerEnd="url(#arrowhead)"
                />
            ))}
        </svg>
    );
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
            setDisplayPlayers(players);
            if (shufflePhase !== 'idle') setShufflePhase('idle');
        }
        prevAnimatingRef.current = isAnimating;
        return () => { if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current); };
    }, [isAnimating, players]);

    useEffect(() => {
        if (!isAnimating && shufflePhase === 'idle') setDisplayPlayers(players);
    }, [players, isAnimating, shufflePhase]);

    const formationSlots = (DEFAULT_FORMATIONS[gameFormat] || DEFAULT_FORMATIONS['6x6']).positions;

    const buildSlotAssignments = () => {
        const assignments = new Map();
        const unassigned = [];
        for (const player of displayPlayers) {
            if (player.position) {
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
        let idx = 0;
        for (const slot of formationSlots) {
            if (!assignments.has(slot.name) && idx < unassigned.length) {
                assignments.set(slot.name, unassigned[idx++]);
            }
        }
        return assignments;
    };

    const slotAssignments = buildSlotAssignments();

    const handlePlayerClick = (player) => {
        if (onPlayerClick) onPlayerClick(player);
        else if (player?.id) navigate(`/player/${player.id}`);
    };

    const handleSlotClick = (pos) => {
        if (onPositionClick && isSelectionMode) onPositionClick(pos.name, team);
    };

    return (
        <div style={{ width: '100%' }}>
            {/* Team Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, marginBottom: 10, padding: '8px 16px',
                background: `linear-gradient(135deg, ${teamColor}22, ${teamColor}0d)`,
                borderRadius: 10, border: `1px solid ${teamColor}45`,
            }}>
                <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: teamColor, boxShadow: `0 0 10px ${teamColor}90`,
                }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{teamName}</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 2 }}>
                    ({formation}) · {players.length} {t('game.fieldView.players')}
                </span>
            </div>

            {/* Field */}
            <div style={{
                width: '100%',
                maxWidth: '450px',
                aspectRatio: '2/3',
                margin: '0 auto',
                background: 'linear-gradient(180deg, #021409 0%, #0b3319 45%, #072616 100%)',
                position: 'relative',
                borderRadius: 14,
                overflow: 'hidden',
                border: shufflePhase !== 'idle'
                    ? `2px solid ${teamColor}`
                    : '2px solid rgba(0,200,80,0.35)',
                boxShadow: shufflePhase !== 'idle'
                    ? `0 0 50px rgba(0,0,0,0.8), 0 0 30px ${teamColor}30, inset 0 0 80px rgba(0,0,0,0.4)`
                    : '0 0 50px rgba(0,0,0,0.8), inset 0 0 80px rgba(0,0,0,0.4)',
                transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
            }}>
                {/* Grass stripes */}
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 36px, transparent 36px, transparent 72px)',
                }} />

                {/* Stadium light glow from top */}
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'radial-gradient(ellipse 90% 35% at 50% 0%, rgba(120,255,120,0.09) 0%, transparent 60%)',
                }} />

                {/* Goal box */}
                <div style={{
                    position: 'absolute', top: 0, left: '30%', right: '30%', height: 46,
                    border: '1.5px solid rgba(255,255,255,0.75)', borderTop: 'none',
                    boxShadow: 'inset 0 -3px 8px rgba(255,255,255,0.04)',
                }} />

                {/* Penalty area */}
                <div style={{
                    position: 'absolute', top: 0, left: '18%', right: '18%', height: 78,
                    border: '1.5px solid rgba(255,255,255,0.6)', borderTop: 'none',
                }} />

                {/* Goal bar */}
                <div style={{
                    position: 'absolute', top: -8, left: '37%', right: '37%', height: 8,
                    border: '2px solid rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.25)',
                    boxShadow: '0 0 18px rgba(255,255,255,0.6)',
                }} />

                {/* Halfway line */}
                <div style={{
                    position: 'absolute', top: '5%', left: 0, right: 0, height: '1.5px',
                    background: 'rgba(255,255,255,0.6)',
                    boxShadow: '0 0 6px rgba(255,255,255,0.3)',
                }} />

                {/* Center arc */}
                <div style={{
                    position: 'absolute', top: '5%', left: '50%',
                    width: 86, height: 43,
                    borderBottom: '1.5px solid rgba(255,255,255,0.6)',
                    borderLeft:   '1.5px solid rgba(255,255,255,0.6)',
                    borderRight:  '1.5px solid rgba(255,255,255,0.6)',
                    borderBottomLeftRadius: 50, borderBottomRightRadius: 50,
                    transform: 'translateX(-50%)',
                    boxShadow: '0 4px 6px rgba(255,255,255,0.06)',
                }} />

                {/* Tactical arrows */}
                <TacticalArrows slots={formationSlots} />

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
                                background: `radial-gradient(circle at center, ${teamColor}14 0%, transparent 70%)`,
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
                                    initial={{ opacity: 0.8, scale: 0, x: `${30 + Math.random() * 40}%`, y: `${20 + Math.random() * 60}%` }}
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

// ─── FIFA-style card node ──────────────────────────────────────────────────────

const PlayerNode = ({
    pos, player, teamColor, onPlayerClick, onPositionClick,
    isSelectionMode, shufflePhase, staggerIndex
}) => {
    const { t } = useTranslation();
    const isOccupied = !!player;
    const isGuest    = player?.isGuest || player?.type === 'guest';

    const glowColor = isOccupied
        ? (isGuest ? '#a590f7' : teamColor)
        : '#00e87a';

    const handleClick = () => {
        if (shufflePhase !== 'idle') return;
        if (isOccupied && player?.id && !isGuest) onPlayerClick?.(player);
        else if (!isOccupied && isSelectionMode) onPositionClick?.(pos);
    };

    const staggerDelay = staggerIndex * 0.12;

    const getAnimationProps = () => {
        if (shufflePhase === 'exit') {
            return {
                initial: { scale: 1, opacity: 1 },
                animate: { scale: 0, opacity: 0, rotate: (staggerIndex % 2 === 0 ? 1 : -1) * 180, left: `${pos.x}%`, top: `${pos.y}%` },
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
    const initials  = (player?.name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

    return (
        <motion.div
            layout={shufflePhase === 'idle'}
            initial={animProps.initial}
            animate={animProps.animate}
            exit={{ scale: 0, opacity: 0, rotate: 180, transition: { duration: 0.3, delay: staggerIndex * 0.05 } }}
            transition={animProps.transition}
            style={{
                position: 'absolute',
                width: CARD_W,
                marginLeft: -(CARD_W / 2),
                marginTop: -(CARD_H / 2),
                cursor: (isOccupied || isSelectionMode) && shufflePhase === 'idle' ? 'pointer' : 'default',
                zIndex: 10,
            }}
            onClick={handleClick}
            whileHover={shufflePhase === 'idle' && (isOccupied || isSelectionMode) ? { scale: 1.14, zIndex: 20 } : {}}
        >
            <Tooltip
                title={
                    shufflePhase !== 'idle' ? null : (
                        isOccupied ? (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: 700 }}>{player.name}</div>
                                {isGuest && <div style={{ fontSize: 11, color: '#a590f7', marginTop: 2 }}>Qonaq</div>}
                                {!isGuest && player.averageRating > 0 && (
                                    <div style={{ fontSize: 12, color: '#faad14' }}>⭐ {player.averageRating?.toFixed(1)}</div>
                                )}
                                {!isGuest && (
                                    <div style={{ fontSize: 11, marginTop: 4, color: 'rgba(255,255,255,0.55)' }}>
                                        {t('game.fieldView.clickForProfile')}
                                    </div>
                                )}
                            </div>
                        ) : isSelectionMode ? t('game.fieldView.clickToOccupy') : t('game.fieldView.free')
                    )
                }
            >
                {/* FIFA Card */}
                <div style={{
                    width: CARD_W,
                    height: CARD_H,
                    borderRadius: 10,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    border: isOccupied
                        ? `2px solid ${glowColor}cc`
                        : isSelectionMode
                            ? '2px solid rgba(0,232,122,0.6)'
                            : '1.5px dashed rgba(255,255,255,0.2)',
                    boxShadow: isOccupied
                        ? `0 0 22px ${glowColor}55, 0 0 8px ${glowColor}35, 0 6px 20px rgba(0,0,0,0.7)`
                        : isSelectionMode
                            ? '0 0 14px rgba(0,232,122,0.35), 0 6px 16px rgba(0,0,0,0.5)'
                            : '0 4px 14px rgba(0,0,0,0.5)',
                    background: isOccupied
                        ? 'linear-gradient(180deg, rgba(0,28,14,0.97) 0%, rgba(0,14,6,0.99) 100%)'
                        : 'rgba(0,20,10,0.6)',
                }}>
                    {/* Avatar / silhouette area */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        background: isOccupied
                            ? `radial-gradient(ellipse at 50% 60%, ${glowColor}18 0%, transparent 70%)`
                            : 'transparent',
                    }}>
                        {isOccupied ? (
                            player.avatar ? (
                                <img
                                    src={player.avatar} alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <>
                                    {/* silhouette shape */}
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                                        width: 30, height: 36,
                                        background: `linear-gradient(180deg, ${glowColor}30 0%, ${glowColor}12 100%)`,
                                        borderRadius: '50% 50% 0 0 / 55% 55% 0 0',
                                        border: `1px solid ${glowColor}25`,
                                    }} />
                                    <div style={{
                                        position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                                        width: 18, height: 18, borderRadius: '50%',
                                        background: `${glowColor}38`,
                                        border: `1px solid ${glowColor}45`,
                                    }} />
                                    <span style={{
                                        position: 'relative', zIndex: 1,
                                        fontSize: 14, fontWeight: 900, color: '#fff',
                                        letterSpacing: -0.5,
                                        textShadow: `0 0 12px ${glowColor}, 0 0 4px ${glowColor}`,
                                    }}>
                                        {initials}
                                    </span>
                                </>
                            )
                        ) : (
                            <>
                                {/* Empty silhouette */}
                                <div style={{
                                    position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                                    width: 28, height: 32,
                                    background: 'rgba(255,255,255,0.07)',
                                    borderRadius: '50% 50% 0 0 / 55% 55% 0 0',
                                }} />
                                <div style={{
                                    position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                                    width: 16, height: 16, borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.1)',
                                }} />
                                {isSelectionMode && (
                                    <PlusOutlined style={{
                                        position: 'relative', zIndex: 1,
                                        fontSize: 15,
                                        color: 'rgba(0,232,122,0.85)',
                                        filter: 'drop-shadow(0 0 6px rgba(0,232,122,0.6))',
                                    }} />
                                )}
                            </>
                        )}
                    </div>

                    {/* Position label bar */}
                    <div style={{
                        height: LABEL_H,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                        background: isOccupied
                            ? `linear-gradient(90deg, ${glowColor}e8, ${glowColor}c0)`
                            : isSelectionMode
                                ? 'rgba(0,232,122,0.22)'
                                : 'rgba(255,255,255,0.07)',
                    }}>
                        <span style={{
                            fontSize: 9, fontWeight: 900, letterSpacing: 0.7,
                            textTransform: 'uppercase',
                            color: isOccupied
                                ? '#060c18'
                                : isSelectionMode ? 'rgba(0,232,122,0.9)' : 'rgba(255,255,255,0.3)',
                        }}>
                            {pos.name}
                        </span>
                        {isOccupied && !isGuest && player.averageRating > 4 && (
                            <StarFilled style={{ fontSize: 7, color: '#060c18', opacity: 0.8 }} />
                        )}
                    </div>
                </div>
            </Tooltip>

            {/* Name badge below card */}
            <AnimatePresence>
                {isOccupied && shufflePhase !== 'exit' && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: shufflePhase === 'enter' ? staggerIndex * 0.12 + 0.3 : 0, duration: 0.2 }}
                        style={{
                            position: 'absolute',
                            top: CARD_H + 3,
                            left: '50%', transform: 'translateX(-50%)',
                            background: 'rgba(0,0,0,0.82)',
                            border: `1px solid ${glowColor}28`,
                            padding: '2px 6px', borderRadius: 6,
                            color: '#e8ffee', fontSize: 9, fontWeight: 600,
                            whiteSpace: 'nowrap', maxWidth: 72,
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            pointerEvents: 'none', textAlign: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                        }}
                    >
                        {player.name?.split(' ')[0]}
                        {player.averageRating > 4 && (
                            <StarFilled style={{ color: '#faad14', fontSize: 7, marginLeft: 3 }} />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default TeamFieldView;
