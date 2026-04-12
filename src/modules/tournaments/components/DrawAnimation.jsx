import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const STEP_MS = 3000;

const css = `
@keyframes drawOverlayIn {
  from { opacity:0; } to { opacity:1; }
}
@keyframes drawTitleIn {
  from { opacity:0; transform:translateY(-30px) scale(0.9); }
  to   { opacity:1; transform:translateY(0)     scale(1);   }
}
@keyframes potAppear {
  from { opacity:0; transform:scale(0.4) rotate(-12deg); }
  65%  { transform:scale(1.06) rotate(2deg); }
  to   { opacity:1; transform:scale(1)    rotate(0deg);  }
}
@keyframes potGlowPulse {
  0%,100% { filter:drop-shadow(0 0 16px rgba(240,192,64,.35)); }
  50%      { filter:drop-shadow(0 0 40px rgba(240,192,64,.85)); }
}
@keyframes ballFloat {
  0%,100% { transform:translateY(0px)  rotate(0deg)  scale(1);    }
  33%      { transform:translateY(-7px) rotate(8deg)  scale(1.06); }
  66%      { transform:translateY(-3px) rotate(-5deg) scale(0.97); }
}
@keyframes ballShake {
  0%,100%{ transform:translateX(0)    rotate(0deg);  }
  20%    { transform:translateX(-5px) rotate(-8deg); }
  40%    { transform:translateX(5px)  rotate(8deg);  }
  60%    { transform:translateX(-3px) rotate(-4deg); }
  80%    { transform:translateX(3px)  rotate(4deg);  }
}
@keyframes ballRiseUp {
  0%   { transform:translateY(0px)    scale(1);   opacity:1; }
  100% { transform:translateY(-170px) scale(1.65);opacity:1; }
}
@keyframes ballSpinAir {
  from { transform:translateY(-170px) scale(1.65) rotate(0deg);   }
  to   { transform:translateY(-170px) scale(1.65) rotate(720deg); }
}
@keyframes cardRevealIn {
  0%   { opacity:0; transform:translate(-50%,-50%) scale(0.15) rotate(-25deg); filter:blur(8px); }
  65%  { transform:translate(-50%,-50%) scale(1.07) rotate(2deg); filter:blur(0); }
  100% { opacity:1; transform:translate(-50%,-50%) scale(1)    rotate(0deg);  filter:blur(0); }
}
@keyframes cardGlow {
  0%,100% { box-shadow:0 0 28px rgba(240,192,64,.4),  0 20px 50px rgba(0,0,0,.65); }
  50%      { box-shadow:0 0 60px rgba(240,192,64,.85), 0 24px 70px rgba(0,0,0,.8);  }
}
@keyframes cardFlyLeft {
  to { opacity:0; transform:translate(calc(-50% - 380px), calc(-50% + 80px)) scale(0.1); }
}
@keyframes cardFlyRight {
  to { opacity:0; transform:translate(calc(-50% + 380px), calc(-50% + 80px)) scale(0.1); }
}
@keyframes slotIn {
  from { opacity:0; transform:translateX(-22px) scale(0.78); }
  62%  { transform:translateX(3px)   scale(1.04); }
  to   { opacity:1; transform:translateX(0)      scale(1);   }
}
@keyframes slotGlow {
  0%,100%{ background:rgba(255,255,255,0.055); }
  50%    { background:rgba(240,192,64,0.18);   }
}
@keyframes completeIn {
  0%  { opacity:0; transform:scale(0.5) translateY(28px); }
  68% { transform:scale(1.06) translateY(-5px); }
  100%{ opacity:1; transform:scale(1)   translateY(0);    }
}
@keyframes confettiFall {
  0%  { opacity:1; transform:translateY(0)     rotate(0deg)   scale(1);   }
  100%{ opacity:0; transform:translateY(160px) rotate(720deg) scale(0.4); }
}
@keyframes starTwinkle {
  0%,100%{ opacity:.15; } 50%{ opacity:.75; }
}
@keyframes dotBlink {
  0%,100%{ opacity:.3; } 50%{ opacity:1; }
}
`;

/* ── helpers ── */
function normalize(item) {
    // Backend sends { team:{name,logo,teamId}, group, order }
    // or already normalised { teamName, teamLogo, groupId }
    return {
        teamName: item.teamName || item.team?.name || '?',
        teamLogo: item.teamLogo || item.team?.logo || null,
        groupId:  item.groupId  || item.group       || '?',
    };
}

const STARS = Array.from({ length: 55 }, (_, i) => ({
    id: i,
    top:  Math.random() * 100,
    left: Math.random() * 100,
    size: 1 + Math.random() * 2,
    delay: Math.random() * 4,
    dur:   2 + Math.random() * 3,
}));

const CONF = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x:     -150 + Math.random() * 300,
    color: ['#f0c040','#63b3ed','#68d391','#fc8181','#fff','#f6ad55'][i % 6],
    delay: Math.random() * 0.9,
    dur:   1.2 + Math.random() * 1.1,
    size:  6 + Math.random() * 10,
}));

/* ─────────────────────────────────────────────
   SVG CUP / POT
───────────────────────────────────────────── */
function DrawPot({ ballCount, shaking }) {
    const shown = Math.min(ballCount, 10);
    return (
        <div style={{
            position: 'relative', width: 170, margin: '0 auto',
            animation: 'potAppear 0.9s ease both, potGlowPulse 2.5s ease-in-out 1s infinite',
        }}>
            <svg viewBox="0 0 170 160" width="170" height="160" style={{ display: 'block', overflow: 'visible' }}>
                <defs>
                    <linearGradient id="cupGold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%"   stopColor="#ffe566"/>
                        <stop offset="45%"  stopColor="#d4a017"/>
                        <stop offset="100%" stopColor="#7a5000"/>
                    </linearGradient>
                    <linearGradient id="rimGold" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%"   stopColor="#fff8c0"/>
                        <stop offset="100%" stopColor="#c8940a"/>
                    </linearGradient>
                </defs>
                {/* Bowl body */}
                <path d="M16,40 L6,128 Q6,146 85,146 Q164,146 164,128 L154,40 Z"
                    fill="url(#cupGold)" stroke="rgba(255,224,60,.35)" strokeWidth="1.5"/>
                {/* Inner dark */}
                <path d="M26,46 L16,125 Q16,138 85,138 Q154,138 154,125 L144,46 Z"
                    fill="#07101e" opacity="0.85"/>
                {/* Rim */}
                <ellipse cx="85" cy="40" rx="70" ry="20"
                    fill="url(#rimGold)" stroke="rgba(255,240,120,.45)" strokeWidth="1"/>
                {/* Rim shine */}
                <ellipse cx="68" cy="34" rx="30" ry="7" fill="rgba(255,255,215,.28)"/>
                {/* Inner top glow */}
                <ellipse cx="85" cy="50" rx="50" ry="10" fill="rgba(240,192,64,.13)"/>
                {/* Stem */}
                <rect x="74" y="146" width="22" height="16" rx="4" fill="url(#cupGold)"/>
                {/* Base */}
                <ellipse cx="85" cy="162" rx="38" ry="8"
                    fill="url(#cupGold)" stroke="rgba(255,220,60,.3)" strokeWidth="1"/>
                <ellipse cx="72" cy="159" rx="13" ry="3" fill="rgba(255,255,200,.22)"/>
            </svg>

            {/* Balls inside */}
            <div style={{
                position:'absolute', top:54, left:20, right:20, bottom:48,
                display:'flex', gap:5, justifyContent:'center',
                alignItems:'flex-end', flexWrap:'wrap',
                padding:'2px 6px', overflow:'hidden',
            }}>
                {Array.from({ length: shown }).map((_, i) => (
                    <div key={i} style={{
                        width:22, height:22, borderRadius:'50%', flexShrink:0,
                        background:'radial-gradient(circle at 36% 34%, #ffe066, #c8940a 60%, #7a5000)',
                        boxShadow:'0 2px 5px rgba(0,0,0,.5), inset 0 1px 3px rgba(255,255,200,.4)',
                        animation: shaking
                            ? `ballShake 0.28s ease-in-out infinite`
                            : `ballFloat ${1.4 + i * 0.22}s ease-in-out infinite`,
                        animationDelay:`${i * 0.16}s`,
                    }}/>
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   TEAM CARD — fixed to viewport centre
───────────────────────────────────────────── */
function TeamCardOverlay({ team, phase, flyDir, isMobile }) {
    const { t } = useTranslation();
    if (!team) return null;

    const anim = phase === 'revealed'
        ? 'cardRevealIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both, cardGlow 1s ease-in-out 0.6s infinite'
        : flyDir === 'left'
            ? 'cardFlyLeft  0.55s ease-in both'
            : 'cardFlyRight 0.55s ease-in both';

    const logoSize = isMobile ? 52 : 76;

    return (
        <div style={{
            position:'fixed', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)',
            zIndex:10001, pointerEvents:'none',
            animation: anim,
        }}>
            <div style={{
                background:'linear-gradient(135deg, #1a2540 0%, #0d1528 100%)',
                border:'2px solid rgba(240,192,64,.75)',
                borderRadius: isMobile ? 16 : 22,
                padding: isMobile ? '16px 28px' : '26px 40px',
                textAlign:'center', minWidth: isMobile ? 200 : 240,
                maxWidth: isMobile ? 260 : 320,
            }}>
                {team.teamLogo ? (
                    <img src={team.teamLogo} alt="" style={{
                        width:logoSize, height:logoSize, borderRadius:'50%', objectFit:'cover',
                        display:'block', margin:`0 auto ${isMobile ? 10 : 14}px`,
                        border:'3px solid rgba(240,192,64,.5)',
                    }}/>
                ) : (
                    <div style={{
                        width:logoSize, height:logoSize, borderRadius:'50%',
                        margin:`0 auto ${isMobile ? 10 : 14}px`,
                        background:'linear-gradient(135deg, #2a3a5c, #1a2540)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize: isMobile ? 16 : 24, fontWeight:900, color:'#f0c040',
                        border:'3px solid rgba(240,192,64,.4)',
                    }}>
                        {team.teamName?.substring(0,2).toUpperCase()}
                    </div>
                )}
                <div style={{
                    fontSize: isMobile ? 16 : 22, fontWeight:900, color:'#fff',
                    lineHeight:1.2, marginBottom: isMobile ? 8 : 12,
                    textShadow:'0 2px 12px rgba(0,0,0,.8)',
                }}>
                    {team.teamName}
                </div>
                <div style={{
                    display:'inline-block', padding: isMobile ? '4px 12px' : '5px 18px', borderRadius:20,
                    background:'rgba(240,192,64,.18)',
                    border:'1px solid rgba(240,192,64,.45)',
                    fontSize: isMobile ? 11 : 13, fontWeight:900, color:'#f0c040', letterSpacing:'0.12em',
                }}>
                    {t('tournaments.draw.group')} {team.groupId}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   GROUP COLUMN
───────────────────────────────────────────── */
function GroupColumn({ groupId, teams, maxSlots, compact }) {
    const { t } = useTranslation();
    return (
        <div style={{ minWidth:0 }}>
            <div style={{
                textAlign:'center', paddingBottom: compact ? 5 : 8, marginBottom: compact ? 5 : 8,
                borderBottom:'2px solid rgba(240,192,64,.3)',
            }}>
                <span style={{
                    fontSize: compact ? 9 : 11, fontWeight:900, color:'#f0c040',
                    letterSpacing:'0.15em', textTransform:'uppercase',
                }}>
                    {t('tournaments.detail.groupLabel')} {groupId}
                </span>
            </div>
            {Array.from({ length: maxSlots }).map((_, i) => {
                const team = teams[i];
                const logoSize = compact ? 20 : 26;
                return (
                    <div key={i} style={{
                        padding: compact ? '5px 7px' : '8px 10px', borderRadius: compact ? 7 : 10, marginBottom: compact ? 4 : 7,
                        background: team ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.025)',
                        border: team
                            ? '1px solid rgba(240,192,64,.22)'
                            : '1px dashed rgba(255,255,255,0.09)',
                        minHeight: compact ? 34 : 46, display:'flex', alignItems:'center', gap: compact ? 6 : 8,
                        animation: team
                            ? 'slotIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both, slotGlow 0.9s ease'
                            : 'none',
                    }}>
                        {team ? (
                            <>
                                {team.teamLogo ? (
                                    <img src={team.teamLogo} alt="" style={{
                                        width:logoSize, height:logoSize, borderRadius:'50%',
                                        objectFit:'cover', flexShrink:0,
                                    }}/>
                                ) : (
                                    <div style={{
                                        width:logoSize, height:logoSize, borderRadius:'50%', flexShrink:0,
                                        background:'linear-gradient(135deg,#2a3a5c,#1a2540)',
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                        fontSize: compact ? 7 : 9, fontWeight:800, color:'#f0c040',
                                    }}>
                                        {team.teamName?.substring(0,2).toUpperCase()}
                                    </div>
                                )}
                                <span style={{
                                    fontSize: compact ? 10 : 12, fontWeight:700, color:'#e0e6f0',
                                    overflow:'hidden', textOverflow:'ellipsis',
                                    whiteSpace:'nowrap', lineHeight:1.3,
                                }}>
                                    {team.teamName}
                                </span>
                            </>
                        ) : (
                            <span style={{ fontSize: compact ? 9 : 11, color:'#2a3b4a' }}>{t('tournaments.draw.waiting')}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ══════════════════════════════════════════════════
   GROUP DRAW ANIMATION
══════════════════════════════════════════════════ */
export function GroupDrawAnimation({ drawSequence: rawSequence, onComplete }) {
    const { t } = useTranslation();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const fn = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', fn, { passive: true });
        return () => window.removeEventListener('resize', fn);
    }, []);

    // Normalise backend format → { teamName, teamLogo, groupId }
    const drawSequence = (rawSequence || []).map(normalize);

    const [phase, setPhase]         = useState('intro');
    const [stepIndex, setStepIndex] = useState(-1);
    const [ballPhase, setBallPhase] = useState('idle');
    const [currentTeam, setCurrentTeam] = useState(null);
    const [placed, setPlaced]       = useState([]);

    const activeGroups  = [...new Set(drawSequence.map(t => t.groupId))].sort();
    const slotsPerGroup = activeGroups.length > 0
        ? Math.ceil(drawSequence.length / activeGroups.length)
        : 4;
    const remaining = Math.max(0, drawSequence.length - placed.length);

    // Split groups left / right
    const half       = Math.ceil(activeGroups.length / 2);
    const leftGroups = activeGroups.slice(0, half);
    const rightGroups= activeGroups.slice(half);
    const flyDir     = (team) => leftGroups.includes(team?.groupId) ? 'left' : 'right';

    /* ── timing ── */
    useEffect(() => {
        const t1 = setTimeout(() => setPhase('ready'),   1200);
        const t2 = setTimeout(() => setStepIndex(0),     2300);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    useEffect(() => {
        if (stepIndex < 0) return;
        if (stepIndex >= drawSequence.length) {
            setPhase('complete');
            setTimeout(onComplete, 3500);
            return;
        }
        const team = drawSequence[stepIndex];
        setCurrentTeam(team);
        setPhase('drawing');
        setBallPhase('shaking');

        const t1 = setTimeout(() => setBallPhase('rising'),   420);
        const t2 = setTimeout(() => setBallPhase('spinning'), 920);
        const t3 = setTimeout(() => setBallPhase('revealed'), 1530);
        const t4 = setTimeout(() => {
            setBallPhase('flying');
            setPlaced(prev => [...prev, team]);
        }, 2300);
        const t5 = setTimeout(() => {
            setBallPhase('idle');
            setCurrentTeam(null);
            setStepIndex(prev => prev + 1);
        }, STEP_MS);

        return () => [t1,t2,t3,t4,t5].forEach(clearTimeout);
    }, [stepIndex]);

    /* ── render ── */
    return (
        <div style={{
            position:'fixed', inset:0, zIndex:9999,
            background:'radial-gradient(ellipse at 50% 38%, #0d1528 0%, #060a14 62%, #020408 100%)',
            display:'flex', flexDirection:'column', alignItems:'center',
            animation:'drawOverlayIn 0.6s ease',
            overflow: isMobile ? 'auto' : 'hidden',
        }}>
            <style>{css}</style>

            {/* Stars — fewer on mobile */}
            {STARS.filter((_, i) => !isMobile || i % 2 === 0).map(s => (
                <div key={s.id} style={{
                    position:'fixed',
                    top:`${s.top}%`, left:`${s.left}%`,
                    width:s.size, height:s.size, borderRadius:'50%',
                    background:'#fff', pointerEvents:'none',
                    animation:`starTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
                }}/>
            ))}

            {/* Team card reveal */}
            {(ballPhase === 'revealed' || ballPhase === 'flying') && currentTeam && (
                <TeamCardOverlay
                    team={currentTeam}
                    phase={ballPhase}
                    flyDir={flyDir(currentTeam)}
                    isMobile={isMobile}
                />
            )}

            {/* ── Title ── */}
            <div style={{
                marginTop: isMobile ? 16 : 32,
                textAlign:'center',
                animation:'drawTitleIn 0.9s ease 0.2s both',
                position:'relative', zIndex:2,
                flexShrink: 0,
                padding: isMobile ? '0 16px' : 0,
            }}>
                <div style={{
                    fontSize: isMobile ? 9 : 10, fontWeight:800, color:'#f0c040',
                    letterSpacing:'0.4em', textTransform:'uppercase',
                    marginBottom:4, opacity:0.75,
                }}>
                    ★ &nbsp; Live Draw &nbsp; ★
                </div>
                <div style={{
                    fontSize: isMobile ? 20 : 30, fontWeight:900, color:'#fff',
                    textShadow:'0 0 36px rgba(240,192,64,.65), 0 2px 18px rgba(0,0,0,.9)',
                    letterSpacing:'0.04em', lineHeight: 1.2,
                }}>
                    {t('tournaments.draw.groupTitle')}
                </div>
                <div style={{ fontSize: isMobile ? 11 : 13, color:'#5a7080', marginTop:3 }}>
                    {t('tournaments.draw.distributed', { placed: placed.length, total: drawSequence.length })}
                </div>
            </div>

            {isMobile ? (
                /* ══════════════ MOBILE LAYOUT ══════════════ */
                <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 12px 24px', gap:12, flex:1 }}>

                    {/* Pot — compact, centered */}
                    <div style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                        {(ballPhase === 'rising' || ballPhase === 'spinning') && (
                            <div style={{
                                position:'absolute', bottom:'calc(50% + 10px)', left:'50%',
                                width:32, height:32, borderRadius:'50%',
                                background:'radial-gradient(circle at 36% 34%, #ffe066, #c8940a 60%, #7a5000)',
                                boxShadow:'0 0 20px rgba(240,192,64,.9)',
                                pointerEvents:'none',
                                animation: ballPhase === 'rising'
                                    ? 'ballRiseUp 0.52s cubic-bezier(0.34,1.56,0.64,1) both'
                                    : 'ballSpinAir 0.65s ease-in-out both',
                            }}/>
                        )}
                        {/* Scaled-down pot */}
                        <div style={{ transform:'scale(0.65)', transformOrigin:'top center', height:104 }}>
                            <DrawPot ballCount={remaining} shaking={ballPhase === 'shaking'}/>
                        </div>
                        {phase === 'drawing' && ballPhase !== 'revealed' && ballPhase !== 'flying' && (
                            <div style={{ display:'flex', gap:5, justifyContent:'center', marginTop:4 }}>
                                {[0,1,2].map(i => (
                                    <div key={i} style={{
                                        width:5, height:5, borderRadius:'50%', background:'#f0c040',
                                        animation:`dotBlink 0.9s ease-in-out ${i * 0.2}s infinite`,
                                    }}/>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Groups — 2-column grid */}
                    <div style={{
                        display:'grid',
                        gridTemplateColumns: activeGroups.length <= 2 ? '1fr' : '1fr 1fr',
                        gap:8, width:'100%',
                    }}>
                        {activeGroups.map(g => (
                            <GroupColumn key={g} groupId={g}
                                teams={placed.filter(tm => tm.groupId === g)}
                                maxSlots={slotsPerGroup}
                                compact={true}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                /* ══════════════ DESKTOP LAYOUT ══════════════ */
                <div style={{
                    flex:1, width:'100%', maxWidth:1040,
                    display:'flex', alignItems:'stretch',
                    gap:12, padding:'12px 24px 16px',
                }}>
                    {/* LEFT groups */}
                    <div style={{
                        flex:1, display:'grid',
                        gridTemplateColumns: leftGroups.length > 1 ? '1fr 1fr' : '1fr',
                        gap:12, alignContent:'start',
                    }}>
                        {leftGroups.map(g => (
                            <GroupColumn key={g} groupId={g}
                                teams={placed.filter(tm => tm.groupId === g)}
                                maxSlots={slotsPerGroup}/>
                        ))}
                    </div>

                    {/* CENTER: pot */}
                    <div style={{
                        width:190, flexShrink:0,
                        display:'flex', flexDirection:'column',
                        alignItems:'center', justifyContent:'center',
                        position:'relative',
                    }}>
                        {(ballPhase === 'rising' || ballPhase === 'spinning') && (
                            <div style={{
                                position:'absolute', bottom:'calc(50% + 20px)', left:'50%',
                                width:48, height:48, borderRadius:'50%',
                                background:'radial-gradient(circle at 36% 34%, #ffe066, #c8940a 60%, #7a5000)',
                                boxShadow:'0 0 28px rgba(240,192,64,.9), 0 0 55px rgba(240,192,64,.4)',
                                pointerEvents:'none',
                                animation: ballPhase === 'rising'
                                    ? 'ballRiseUp  0.52s cubic-bezier(0.34,1.56,0.64,1) both'
                                    : 'ballSpinAir 0.65s ease-in-out both',
                            }}/>
                        )}
                        <DrawPot ballCount={remaining} shaking={ballPhase === 'shaking'}/>
                        {phase === 'drawing' && ballPhase !== 'revealed' && ballPhase !== 'flying' && (
                            <div style={{ marginTop:10, display:'flex', gap:6, justifyContent:'center' }}>
                                {[0,1,2].map(i => (
                                    <div key={i} style={{
                                        width:6, height:6, borderRadius:'50%', background:'#f0c040',
                                        animation:`dotBlink 0.9s ease-in-out ${i * 0.2}s infinite`,
                                    }}/>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RIGHT groups */}
                    <div style={{
                        flex:1, display:'grid',
                        gridTemplateColumns: rightGroups.length > 1 ? '1fr 1fr' : '1fr',
                        gap:12, alignContent:'start',
                    }}>
                        {rightGroups.map(g => (
                            <GroupColumn key={g} groupId={g}
                                teams={placed.filter(tm => tm.groupId === g)}
                                maxSlots={slotsPerGroup}/>
                        ))}
                    </div>
                </div>
            )}

            {/* Complete overlay */}
            {phase === 'complete' && (
                <div style={{
                    position:'absolute', inset:0, zIndex:20,
                    display:'flex', flexDirection:'column',
                    alignItems:'center', justifyContent:'center',
                    background:'rgba(6,10,20,.88)', backdropFilter:'blur(8px)',
                }}>
                    {CONF.map(c => (
                        <div key={c.id} style={{
                            position:'absolute', top:'38%',
                            left:`calc(50% + ${c.x}px)`,
                            width:c.size, height:c.size,
                            background:c.color, borderRadius:2,
                            animation:`confettiFall ${c.dur}s ease-out ${c.delay}s both`,
                        }}/>
                    ))}
                    <div style={{
                        fontSize:66, marginBottom:18,
                        animation:'completeIn 0.8s cubic-bezier(0.34,1.56,0.64,1) both',
                        filter:'drop-shadow(0 0 28px rgba(240,192,64,.85))',
                    }}>🏆</div>
                    <div style={{
                        fontSize:30, fontWeight:900, color:'#fff',
                        textShadow:'0 0 30px rgba(240,192,64,.8)',
                        animation:'completeIn 0.8s ease 0.2s both',
                    }}>{t('tournaments.draw.complete')}</div>
                    <div style={{
                        fontSize:14, color:'#7a8ba0', marginTop:10,
                        animation:'completeIn 0.8s ease 0.4s both',
                    }}>{t('tournaments.draw.groupStageReady')}</div>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════
   PLAYOFF DRAW ANIMATION
══════════════════════════════════════════════════ */
export function PlayoffDrawAnimation({ drawSequence: rawSequence, onComplete }) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState([]);
    const [phase,   setPhase]   = useState('intro');

    // Build match pairs from raw sequence
    const matches = [];
    if (rawSequence) {
        // rawSequence: [{ team, position, side, order }, ...]
        // Group by position
        const byPos = {};
        rawSequence.forEach(item => {
            if (!byPos[item.position]) byPos[item.position] = {};
            byPos[item.position][item.side] = item.team;
            byPos[item.position].stage = item.stage;
        });
        Object.values(byPos).forEach(m => {
            if (m.home || m.away) {
                matches.push({
                    homeTeamName: m.home?.name || m.home?.teamName || '?',
                    awayTeamName: m.away?.name || m.away?.teamName || '?',
                    stage: m.stage,
                });
            }
        });
    }

    // Also handle format: [{ homeTeamName, awayTeamName, stage }]
    const displayMatches = matches.length > 0 ? matches : (rawSequence || []);

    useEffect(() => {
        const timers = [];
        timers.push(setTimeout(() => setPhase('drawing'), 1200));
        displayMatches.forEach((_, i) => {
            timers.push(setTimeout(() => setVisible(prev => [...prev, i]),
                1200 + (i + 1) * 1100));
        });
        timers.push(setTimeout(() => {
            setPhase('complete');
            setTimeout(onComplete, 2500);
        }, 1200 + displayMatches.length * 1100 + 1800));
        return () => timers.forEach(clearTimeout);
    }, []);

    const stageLabel = {
        quarterfinal: t('tournaments.match.quarterfinal'),
        semifinal:    t('tournaments.match.semifinal'),
        final:        t('tournaments.match.final'),
    };

    return (
        <div style={{
            position:'fixed', inset:0, zIndex:9999,
            background:'radial-gradient(ellipse at 50% 38%, #0d1528 0%, #060a14 62%, #020408 100%)',
            display:'flex', flexDirection:'column', alignItems:'center',
            animation:'drawOverlayIn 0.6s ease', overflowY:'auto',
        }}>
            <style>{css}</style>
            {STARS.map(s => (
                <div key={s.id} style={{
                    position:'fixed',
                    top:`${s.top}%`, left:`${s.left}%`,
                    width:s.size, height:s.size, borderRadius:'50%',
                    background:'#fff', pointerEvents:'none',
                    animation:`starTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
                }}/>
            ))}

            <div style={{
                marginTop:40, textAlign:'center',
                animation:'drawTitleIn 0.9s ease 0.2s both',
                position:'relative', zIndex:2,
            }}>
                <div style={{
                    fontSize:10, fontWeight:800, color:'#f0c040',
                    letterSpacing:'0.4em', textTransform:'uppercase',
                    marginBottom:6, opacity:0.75,
                }}>★ &nbsp; Live Draw &nbsp; ★</div>
                <div style={{
                    fontSize:30, fontWeight:900, color:'#fff',
                    textShadow:'0 0 36px rgba(240,192,64,.65)',
                    letterSpacing:'0.04em',
                }}>{t('tournaments.draw.playoffTitle')}</div>
            </div>

            <div style={{ width:'100%', maxWidth:640, padding:'28px 24px', zIndex:2, position:'relative' }}>
                {displayMatches.map((match, i) => (
                    <div key={i}>
                        {(i === 0 || displayMatches[i - 1]?.stage !== match.stage) && (
                            <div style={{
                                fontSize:11, fontWeight:800, color:'#f0c040',
                                letterSpacing:'0.15em', textTransform:'uppercase',
                                marginBottom:10, marginTop: i > 0 ? 22 : 0, opacity:0.8,
                            }}>
                                {stageLabel[match.stage] || match.stage}
                            </div>
                        )}
                        <div style={{
                            marginBottom:12,
                            opacity: visible.includes(i) ? 1 : 0,
                            animation: visible.includes(i)
                                ? 'cardRevealIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both'
                                : 'none',
                        }}>
                            <div style={{
                                background:'rgba(255,255,255,.05)',
                                border:'1px solid rgba(240,192,64,.3)',
                                borderRadius:14, padding:'14px 18px',
                                display:'flex', alignItems:'center', gap:10,
                                boxShadow:'0 0 18px rgba(240,192,64,.08)',
                            }}>
                                <div style={{ flex:1, display:'flex', alignItems:'center', gap:10 }}>
                                    <div style={{
                                        width:34, height:34, borderRadius:'50%', flexShrink:0,
                                        background:'rgba(240,192,64,.12)',
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                        fontSize:10, fontWeight:800, color:'#f0c040',
                                        border:'1px solid rgba(240,192,64,.3)',
                                    }}>
                                        {(match.homeTeamName || '?').substring(0,2).toUpperCase()}
                                    </div>
                                    <span style={{ fontWeight:700, fontSize:14, color:'#e0e6f0' }}>
                                        {match.homeTeamName}
                                    </span>
                                </div>
                                <span style={{ fontSize:13, color:'#3a4b5a', letterSpacing:2, flexShrink:0 }}>vs</span>
                                <div style={{ flex:1, display:'flex', alignItems:'center', gap:10, justifyContent:'flex-end' }}>
                                    <span style={{ fontWeight:700, fontSize:14, color:'#e0e6f0' }}>
                                        {match.awayTeamName}
                                    </span>
                                    <div style={{
                                        width:34, height:34, borderRadius:'50%', flexShrink:0,
                                        background:'rgba(240,192,64,.12)',
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                        fontSize:10, fontWeight:800, color:'#f0c040',
                                        border:'1px solid rgba(240,192,64,.3)',
                                    }}>
                                        {(match.awayTeamName || '?').substring(0,2).toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {phase === 'complete' && (
                <div style={{
                    position:'fixed', inset:0, zIndex:20,
                    display:'flex', flexDirection:'column',
                    alignItems:'center', justifyContent:'center',
                    background:'rgba(6,10,20,.88)', backdropFilter:'blur(8px)',
                }}>
                    {CONF.map(c => (
                        <div key={c.id} style={{
                            position:'absolute', top:'38%',
                            left:`calc(50% + ${c.x}px)`,
                            width:c.size, height:c.size,
                            background:c.color, borderRadius:2,
                            animation:`confettiFall ${c.dur}s ease-out ${c.delay}s both`,
                        }}/>
                    ))}
                    <div style={{ fontSize:66, marginBottom:18, animation:'completeIn 0.8s ease both', filter:'drop-shadow(0 0 28px rgba(240,192,64,.85))' }}>🔥</div>
                    <div style={{ fontSize:30, fontWeight:900, color:'#fff', textShadow:'0 0 30px rgba(240,192,64,.8)', animation:'completeIn 0.8s ease 0.2s both' }}>
                        {t('tournaments.draw.playoffReady')}
                    </div>
                </div>
            )}
        </div>
    );
}
