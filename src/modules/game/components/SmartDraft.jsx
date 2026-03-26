import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

// ─── Field positions (landscape, % of container) ────────────────────────────
// Team A on the left half, Team B mirrored on the right
const RAW_POS = {
    1:  [{ x: 25, y: 50 }],
    2:  [{ x: 15, y: 38 }, { x: 15, y: 62 }],
    3:  [{ x: 9,  y: 50 }, { x: 24, y: 28 }, { x: 24, y: 72 }],
    4:  [{ x: 9,  y: 50 }, { x: 24, y: 24 }, { x: 24, y: 76 }, { x: 38, y: 50 }],
    5:  [
        { x: 7,  y: 50 },
        { x: 22, y: 22 }, { x: 22, y: 78 },
        { x: 38, y: 32 }, { x: 38, y: 68 },
    ],
    6:  [
        { x: 7,  y: 50 },
        { x: 20, y: 18 }, { x: 20, y: 82 },
        { x: 32, y: 50 },
        { x: 42, y: 28 }, { x: 42, y: 72 },
    ],
    7:  [
        { x: 7,  y: 50 },
        { x: 18, y: 18 }, { x: 18, y: 82 },
        { x: 30, y: 35 }, { x: 30, y: 65 },
        { x: 42, y: 22 }, { x: 42, y: 78 },
    ],
    8:  [
        { x: 6,  y: 50 },
        { x: 17, y: 18 }, { x: 17, y: 50 }, { x: 17, y: 82 },
        { x: 30, y: 30 }, { x: 30, y: 70 },
        { x: 42, y: 22 }, { x: 42, y: 78 },
    ],
    9:  [
        { x: 6,  y: 50 },
        { x: 16, y: 18 }, { x: 16, y: 50 }, { x: 16, y: 82 },
        { x: 28, y: 28 }, { x: 28, y: 50 }, { x: 28, y: 72 },
        { x: 40, y: 28 }, { x: 40, y: 72 },
    ],
    10: [
        { x: 5,  y: 50 },
        { x: 15, y: 18 }, { x: 15, y: 42 }, { x: 15, y: 58 }, { x: 15, y: 82 },
        { x: 27, y: 28 }, { x: 27, y: 50 }, { x: 27, y: 72 },
        { x: 39, y: 28 }, { x: 39, y: 72 },
    ],
    11: [
        { x: 5,  y: 50 },
        { x: 15, y: 15 }, { x: 15, y: 38 }, { x: 15, y: 62 }, { x: 15, y: 85 },
        { x: 27, y: 22 }, { x: 27, y: 42 }, { x: 27, y: 58 }, { x: 27, y: 78 },
        { x: 39, y: 30 }, { x: 39, y: 70 },
    ],
};

const getPositions = (team, count) => {
    const sizes = Object.keys(RAW_POS).map(Number).sort((a, b) => a - b);
    const best  = sizes.reduce((p, c) => (Math.abs(c - count) < Math.abs(p - count) ? c : p));
    const base  = RAW_POS[best] || RAW_POS[5];
    const pts   = count <= base.length ? base.slice(0, count)
        : [...base, ...Array.from({ length: count - base.length }, (_, i) => ({
            x: 38 + (i % 3 - 1) * 6,
            y: 15 + (i * 15) % 80
        }))];
    return team === 'A' ? pts : pts.map(p => ({ x: 100 - p.x, y: p.y }));
};

const buildSequence = (teamA, teamB) => {
    const posA = getPositions('A', teamA.length);
    const posB = getPositions('B', teamB.length);
    const seq  = [];
    const max  = Math.max(teamA.length, teamB.length);
    for (let i = 0; i < max; i++) {
        if (teamA[i]) seq.push({ ...teamA[i], _team: 'A', _pos: posA[i] });
        if (teamB[i]) seq.push({ ...teamB[i], _team: 'B', _pos: posB[i] });
    }
    return seq;
};

// ─── Player dot (reused in spotlight and on field) ───────────────────────────
const PlayerDot = ({ player, color, size = 52, showName = false }) => {
    const initials = (player?.name || '??')
        .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{
                width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                border: `2.5px solid ${color}`,
                boxShadow: `0 0 16px ${color}60, 0 4px 14px rgba(0,0,0,0.5)`,
                background: `linear-gradient(145deg, ${color}cc, ${color}77)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {player?.avatar
                    ? <img src={player.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: size * 0.32, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
                        {initials}
                      </span>
                }
            </div>
            {showName && (
                <div style={{
                    background: 'rgba(0,0,0,0.82)', padding: '2px 9px', borderRadius: 8,
                    color: '#fff', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                    border: `1px solid ${color}40`, letterSpacing: 0.3,
                    maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {player?.name?.split(' ')[0] || '—'}
                </div>
            )}
        </div>
    );
};

// ─── Team header row ─────────────────────────────────────────────────────────
const TeamHeader = ({ name, color, ovr, placed, total }) => (
    <div style={{ textAlign: 'center', minWidth: 140 }}>
        <div style={{ fontSize: 20, fontWeight: 900, color, letterSpacing: -0.5 }}>{name}</div>
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <span style={{
                background: `${color}22`, border: `1px solid ${color}44`,
                borderRadius: 20, padding: '2px 10px', color,
                fontSize: 12, fontWeight: 700,
            }}>
                OVR {Math.round(ovr)}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                {placed}/{total}
            </span>
        </div>
    </div>
);

// ─── Main component ──────────────────────────────────────────────────────────
const SmartDraft = ({ teamA = [], teamB = [], onComplete, visible }) => {
    const { t } = useTranslation();
    const [stage,      setStage]      = useState('intro');
    const [sequence,   setSequence]   = useState([]);
    const [placed,     setPlaced]     = useState([]);
    const [curIdx,     setCurIdx]     = useState(0);

    const COLOR_A = '#4ade80';
    const COLOR_B = '#f472b6';

    useEffect(() => {
        if (!visible || !teamA?.length || !teamB?.length) return;
        setSequence(buildSequence(teamA, teamB));
        setPlaced([]);
        setCurIdx(0);
        setStage('intro');
    }, [visible]);

    // ── Auto-deal loop ────────────────────────────────────────────────────────
    useEffect(() => {
        if (stage !== 'animating') return;
        if (curIdx >= sequence.length) {
            const t = setTimeout(() => setStage('complete'), 900);
            return () => clearTimeout(t);
        }
        // Delay between placing each player (spotlight visible + fly time)
        const t = setTimeout(() => {
            setPlaced(prev => [...prev, { ...sequence[curIdx], _key: curIdx }]);
            setCurIdx(i => i + 1);
        }, 1000);
        return () => clearTimeout(t);
    }, [stage, curIdx, sequence]);

    if (!visible) return null;

    const placedA   = placed.filter(p => p._team === 'A');
    const placedB   = placed.filter(p => p._team === 'B');
    const ovrA      = placedA.reduce((s, p) => s + (p.averageRating ? p.averageRating * 10 : 50), 0);
    const ovrB      = placedB.reduce((s, p) => s + (p.averageRating ? p.averageRating * 10 : 50), 0);
    const remaining = sequence.length - curIdx;
    const nextP     = curIdx < sequence.length ? sequence[curIdx] : null;
    const nextColor = nextP?._team === 'A' ? COLOR_A : COLOR_B;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', flexDirection: 'column',
            background: '#070d14',
        }}>
            <AnimatePresence mode="wait">

                {/* ──────────── INTRO ──────────── */}
                {stage === 'intro' && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.35 }}
                        style={{
                            flex: 1, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            background: 'radial-gradient(ellipse at 50% 60%, #0f2744 0%, #070d14 70%)',
                        }}
                    >
                        {/* Ball */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                            style={{ fontSize: 88, lineHeight: 1, marginBottom: 28, filter: 'drop-shadow(0 0 24px rgba(74,222,128,0.5))' }}
                        >
                            ⚽
                        </motion.div>

                        {/* Title */}
                        <motion.div
                            initial={{ y: 24, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            style={{
                                fontSize: 48, fontWeight: 900, letterSpacing: -1.5,
                                background: 'linear-gradient(135deg, #4ade80 0%, #22d3ee 50%, #f472b6 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                marginBottom: 12, textAlign: 'center',
                            }}
                        >
                            Smart Draft
                        </motion.div>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.35 }}
                            style={{
                                color: 'rgba(255,255,255,0.55)', fontSize: 16, textAlign: 'center',
                                maxWidth: 380, lineHeight: 1.7, marginBottom: 44,
                            }}
                        >
                            {t('game.smartDraft.description', { n: (teamA.length || 0) + (teamB.length || 0) })}
                        </motion.p>

                        {/* Teams preview */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 48 }}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 30, fontWeight: 900, color: COLOR_A }}>Team A</div>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{teamA.length} {t('game.smartDraft.players')}</div>
                            </div>
                            <div style={{
                                width: 44, height: 44, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 16, fontWeight: 900, color: 'rgba(255,255,255,0.3)',
                            }}>VS</div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 30, fontWeight: 900, color: COLOR_B }}>Team B</div>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{teamB.length} {t('game.smartDraft.players')}</div>
                            </div>
                        </motion.div>

                        {/* Start button */}
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.65, type: 'spring', stiffness: 200 }}
                        >
                            <Button
                                size="large"
                                onClick={() => setStage('animating')}
                                style={{
                                    height: 62, padding: '0 56px', fontSize: 19, fontWeight: 800,
                                    borderRadius: 31, border: 'none', cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
                                    color: '#070d14',
                                    boxShadow: '0 0 40px rgba(74,222,128,0.45), 0 8px 24px rgba(0,0,0,0.4)',
                                    letterSpacing: -0.3,
                                }}
                            >
                                ⚡ {t('game.smartDraft.startBtn')}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}

                {/* ──────────── FIELD ──────────── */}
                {(stage === 'animating' || stage === 'complete') && (
                    <motion.div
                        key="field"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                    >
                        {/* ── Top bar ── */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr auto 1fr',
                            alignItems: 'center', gap: 16,
                            padding: '14px 32px',
                            background: 'rgba(0,0,0,0.75)',
                            backdropFilter: 'blur(12px)',
                            borderBottom: '1px solid rgba(255,255,255,0.07)',
                        }}>
                            <TeamHeader name="Team A" color={COLOR_A} ovr={ovrA} placed={placedA.length} total={teamA.length} />

                            {/* Center counter */}
                            <div style={{ textAlign: 'center', minWidth: 80 }}>
                                {stage === 'complete' ? (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', stiffness: 200 }}
                                        style={{ fontSize: 36 }}
                                    >
                                        🏆
                                    </motion.div>
                                ) : (
                                    <div>
                                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                                            {t('game.smartDraft.remaining')}
                                        </div>
                                        <AnimatePresence mode="popLayout">
                                            <motion.div
                                                key={remaining}
                                                initial={{ y: -16, opacity: 0, scale: 1.4 }}
                                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                                exit={{ y: 16, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1 }}
                                            >
                                                {remaining}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            <TeamHeader name="Team B" color={COLOR_B} ovr={ovrB} placed={placedB.length} total={teamB.length} />
                        </div>

                        {/* ── Football pitch ── */}
                        <div style={{
                            flex: 1, position: 'relative', overflow: 'hidden',
                            background: 'linear-gradient(180deg, #1a5c1a 0%, #1e7d1e 40%, #1a5c1a 100%)',
                        }}>
                            {/* Vertical grass stripes */}
                            <div style={{
                                position: 'absolute', inset: 0, pointerEvents: 'none',
                                backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 55px, rgba(0,0,0,0.07) 55px, rgba(0,0,0,0.07) 56px)',
                            }} />

                            {/* Center line */}
                            <div style={{
                                position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2,
                                background: 'rgba(255,255,255,0.55)', transform: 'translateX(-50%)',
                                pointerEvents: 'none',
                            }} />

                            {/* Center circle */}
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%',
                                width: 110, height: 110, borderRadius: '50%',
                                border: '2px solid rgba(255,255,255,0.55)',
                                transform: 'translate(-50%, -50%)', pointerEvents: 'none',
                            }} />
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%',
                                width: 10, height: 10, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.7)', transform: 'translate(-50%, -50%)',
                                pointerEvents: 'none',
                            }} />

                            {/* Goal boxes */}
                            {[{ left: 0, borderLeft: 'none' }, { right: 0, borderRight: 'none' }].map((style, i) => (
                                <div key={i} style={{
                                    position: 'absolute', ...style, top: '28%', bottom: '28%', width: 44,
                                    border: '2px solid rgba(255,255,255,0.55)',
                                    background: 'rgba(255,255,255,0.025)', pointerEvents: 'none',
                                    ...(i === 0 ? { borderLeft: 'none' } : { borderRight: 'none' }),
                                }} />
                            ))}

                            {/* Zone labels */}
                            <div style={{
                                position: 'absolute', left: '12%', top: '8%',
                                color: `${COLOR_A}70`, fontSize: 11, fontWeight: 800,
                                letterSpacing: 2.5, textTransform: 'uppercase', pointerEvents: 'none',
                            }}>TEAM A</div>
                            <div style={{
                                position: 'absolute', right: '12%', top: '8%',
                                color: `${COLOR_B}70`, fontSize: 11, fontWeight: 800,
                                letterSpacing: 2.5, textTransform: 'uppercase', pointerEvents: 'none',
                            }}>TEAM B</div>

                            {/* ── Spotlight: next player to be dealt ── */}
                            <AnimatePresence>
                                {stage === 'animating' && nextP && (
                                    <motion.div
                                        key={`spot-${curIdx}`}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.4, opacity: 0 }}
                                        transition={{ type: 'spring', stiffness: 250, damping: 22 }}
                                        style={{
                                            position: 'absolute', left: '50%', top: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            zIndex: 50, display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', gap: 8, pointerEvents: 'none',
                                        }}
                                    >
                                        {/* Pulsing glow ring */}
                                        <motion.div
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.1, 0.5] }}
                                            transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                                            style={{
                                                position: 'absolute', width: 100, height: 100,
                                                borderRadius: '50%', top: '50%', left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                background: `radial-gradient(circle, ${nextColor}40 0%, transparent 70%)`,
                                                border: `1.5px solid ${nextColor}50`,
                                                pointerEvents: 'none',
                                            }}
                                        />

                                        <PlayerDot player={nextP} color={nextColor} size={66} showName />

                                        {/* Team badge */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                            style={{
                                                background: `linear-gradient(135deg, ${nextColor}25, ${nextColor}10)`,
                                                border: `1px solid ${nextColor}50`,
                                                borderRadius: 20, padding: '3px 14px',
                                                color: nextColor, fontSize: 11, fontWeight: 800,
                                                letterSpacing: 1.5, textTransform: 'uppercase',
                                            }}
                                        >
                                            → {nextP._team === 'A' ? 'TEAM A' : 'TEAM B'}
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* ── Placed players on field ── */}
                            <AnimatePresence>
                                {placed.map(p => (
                                    <motion.div
                                        key={`p-${p._key}`}
                                        initial={{ left: '50%', top: '50%', scale: 0, opacity: 0 }}
                                        animate={{
                                            left: `${p._pos.x}%`,
                                            top:  `${p._pos.y}%`,
                                            scale: 1,
                                            opacity: 1,
                                        }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 80,
                                            damping: 14,
                                            mass: 0.8,
                                        }}
                                        style={{
                                            position: 'absolute',
                                            transform: 'translate(-50%, -50%)',
                                            zIndex: 10, pointerEvents: 'none',
                                        }}
                                    >
                                        <PlayerDot
                                            player={p}
                                            color={p._team === 'A' ? COLOR_A : COLOR_B}
                                            size={50}
                                            showName
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* ── Complete overlay ── */}
                            <AnimatePresence>
                                {stage === 'complete' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={{
                                            position: 'absolute', inset: 0, zIndex: 200,
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            background: 'rgba(7,13,20,0.65)',
                                            backdropFilter: 'blur(6px)',
                                        }}
                                    >
                                        <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', stiffness: 160, damping: 12, delay: 0.1 }}
                                            style={{ fontSize: 72, marginBottom: 12 }}
                                        >
                                            🏆
                                        </motion.div>

                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.45 }}
                                            style={{
                                                fontSize: 26, fontWeight: 900, color: '#fff',
                                                marginBottom: 6, textAlign: 'center',
                                            }}
                                        >
                                            {t('game.smartDraft.teamsFormed')}
                                        </motion.div>

                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.6 }}
                                            style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 14 }}
                                        >
                                            {t('game.smartDraft.applyHint')}
                                        </motion.div>

                                        <motion.div
                                            initial={{ scale: 0.85, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.75, type: 'spring', stiffness: 200 }}
                                        >
                                            <Button
                                                icon={<TrophyOutlined />}
                                                size="large"
                                                onClick={onComplete}
                                                style={{
                                                    height: 58, padding: '0 48px', fontSize: 17,
                                                    fontWeight: 800, borderRadius: 29, border: 'none', cursor: 'pointer',
                                                    background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
                                                    color: '#070d14',
                                                    boxShadow: '0 0 40px rgba(74,222,128,0.5), 0 8px 24px rgba(0,0,0,0.4)',
                                                }}
                                            >
                                                {t('game.smartDraft.applyBtn')}
                                            </Button>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SmartDraft;
