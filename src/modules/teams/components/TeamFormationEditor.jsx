import { useState, useEffect, useRef } from 'react';
import { Card, Button, message, Tooltip, Segmented, Space, Typography, Tag } from 'antd';
import { SaveOutlined, UndoOutlined, InfoCircleOutlined, PlusOutlined, StarFilled } from '@ant-design/icons';
import { useUpdateFormationByFormatMutation, useLazyGetFormationByFormatQuery } from '../../../store/teamsApi';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const GAME_FORMATS = [
    { value: '5x5',   label: '5x5',   playerCount: 5  },
    { value: '6x6',   label: '6x6',   playerCount: 6  },
    { value: '8x8',   label: '8x8',   playerCount: 8  },
    { value: '11x11', label: '11x11', playerCount: 11 },
];

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

const CARD_W  = 54;
const LABEL_H = 15;
const CARD_H  = 68;
const TEAM_COLOR = '#00e87a';

// Tactical arrows between formation rows
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
        rows[i].forEach(from => {
            [...rows[i + 1]]
                .sort((a, b) => Math.abs(a.x - from.x) - Math.abs(b.x - from.x))
                .slice(0, Math.min(2, rows[i + 1].length))
                .forEach(to => arrows.push({ fx: from.x, fy: from.y, tx: to.x, ty: to.y }));
        });
    }
    return arrows;
};

// ─── FIFA card slot ──────────────────────────────────────────────────────────
const FieldSlot = ({ slot, index, players, isSelected, isCaptain, captainId, onClick }) => {
    const { t } = useTranslation();
    const { playerId, position } = slot;
    const player  = players.find(p => p.id === playerId);
    const isCapt  = playerId === captainId;
    const initials = (player?.name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

    const glowColor = isSelected ? '#4f86f7' : isCapt ? '#faad14' : TEAM_COLOR;

    return (
        <div
            onClick={onClick}
            style={{
                position: 'absolute',
                left: `${slot.x}%`,
                top:  `${slot.y}%`,
                transform: 'translate(-50%, -50%)',
                cursor: isCaptain ? 'pointer' : 'default',
                zIndex: isSelected ? 20 : 10,
                transition: 'transform 0.15s',
            }}
        >
            <Tooltip title={
                playerId
                    ? `${player?.name || playerId} (${position})${isCapt ? ' 👑' : ''}`
                    : t('teams.formation.freePosition', { pos: position })
            }>
                {/* Card */}
                <div style={{
                    width: CARD_W,
                    height: CARD_H,
                    borderRadius: 10,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    border: playerId
                        ? `2px solid ${glowColor}cc`
                        : isCaptain
                            ? '1.5px dashed rgba(0,232,122,0.55)'
                            : '1.5px dashed rgba(255,255,255,0.18)',
                    boxShadow: isSelected
                        ? `0 0 28px #4f86f755, 0 0 10px #4f86f745, 0 6px 20px rgba(0,0,0,0.7)`
                        : playerId
                            ? `0 0 22px ${glowColor}50, 0 0 8px ${glowColor}30, 0 6px 20px rgba(0,0,0,0.7)`
                            : '0 4px 14px rgba(0,0,0,0.5)',
                    background: playerId
                        ? 'linear-gradient(180deg, rgba(0,28,14,0.97) 0%, rgba(0,14,6,0.99) 100%)'
                        : 'rgba(0,20,10,0.6)',
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.2s',
                }}>
                    {/* Avatar area */}
                    <div style={{
                        flex: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', overflow: 'hidden',
                        background: playerId
                            ? `radial-gradient(ellipse at 50% 60%, ${glowColor}18 0%, transparent 70%)`
                            : 'transparent',
                    }}>
                        {playerId ? (
                            player?.avatar ? (
                                <img src={player.avatar} alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <>
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
                                        background: `${glowColor}38`, border: `1px solid ${glowColor}45`,
                                    }} />
                                    <span style={{
                                        position: 'relative', zIndex: 1,
                                        fontSize: 14, fontWeight: 900, color: '#fff',
                                        letterSpacing: -0.5,
                                        textShadow: `0 0 12px ${glowColor}, 0 0 4px ${glowColor}`,
                                    }}>{initials}</span>
                                    {isCapt && (
                                        <span style={{
                                            position: 'absolute', top: 4, right: 4,
                                            fontSize: 10, lineHeight: 1,
                                        }}>👑</span>
                                    )}
                                </>
                            )
                        ) : (
                            <>
                                <div style={{
                                    position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                                    width: 28, height: 32, background: 'rgba(255,255,255,0.07)',
                                    borderRadius: '50% 50% 0 0 / 55% 55% 0 0',
                                }} />
                                <div style={{
                                    position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                                    width: 16, height: 16, borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.1)',
                                }} />
                                {isCaptain && (
                                    <PlusOutlined style={{
                                        position: 'relative', zIndex: 1, fontSize: 14,
                                        color: 'rgba(0,232,122,0.8)',
                                        filter: 'drop-shadow(0 0 5px rgba(0,232,122,0.5))',
                                    }} />
                                )}
                            </>
                        )}
                    </div>

                    {/* Position label bar */}
                    <div style={{
                        height: LABEL_H,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: playerId
                            ? `linear-gradient(90deg, ${glowColor}e8, ${glowColor}c0)`
                            : isCaptain
                                ? 'rgba(0,232,122,0.2)'
                                : 'rgba(255,255,255,0.07)',
                    }}>
                        <span style={{
                            fontSize: 9, fontWeight: 900, letterSpacing: 0.7, textTransform: 'uppercase',
                            color: playerId ? '#060c18' : isCaptain ? 'rgba(0,232,122,0.85)' : 'rgba(255,255,255,0.3)',
                        }}>
                            {position}
                        </span>
                    </div>
                </div>
            </Tooltip>

            {/* Name badge below card */}
            {playerId && (
                <div style={{
                    position: 'absolute',
                    top: CARD_H + 3, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.82)',
                    border: `1px solid ${glowColor}28`,
                    padding: '2px 6px', borderRadius: 6,
                    color: '#e8ffee', fontSize: 9, fontWeight: 600,
                    whiteSpace: 'nowrap', maxWidth: 72,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    pointerEvents: 'none', textAlign: 'center',
                }}>
                    {player?.name?.split(' ')[0] || '?'}
                </div>
            )}

            {/* Selected indicator */}
            {isSelected && (
                <div style={{
                    position: 'absolute', top: -8, right: -8,
                    background: '#4f86f7', borderRadius: '50%',
                    width: 20, height: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#fff', fontWeight: 900,
                    boxShadow: '0 0 10px #4f86f780',
                    zIndex: 30,
                }}>✓</div>
            )}
        </div>
    );
};

// ─── Main component ──────────────────────────────────────────────────────────
const TeamFormationEditor = ({ team, players = [], isCaptain, onRefetch }) => {
    const { t } = useTranslation();
    const fieldRef = useRef(null);
    const [selectedFormat, setSelectedFormat]     = useState('6x6');
    const [formation, setFormation]               = useState([]);
    const [formationString, setFormationString]   = useState(DEFAULT_FORMATIONS['6x6'].formationString);
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);
    const [hasChanges, setHasChanges]             = useState(false);

    const [updateFormationByFormat, { isLoading: isSaving }] = useUpdateFormationByFormatMutation();
    const [getFormationByFormat] = useLazyGetFormationByFormatQuery();

    const currentUser   = JSON.parse(localStorage.getItem('user'));
    const mainPlayerIds = team?.playerIds || [];
    const formatConfig  = GAME_FORMATS.find(f => f.value === selectedFormat);

    useEffect(() => {
        const loadFormation = async () => {
            if (!team?.id) return;
            try {
                const savedFormation = await getFormationByFormat({ teamId: team.id, gameFormat: selectedFormat }).unwrap();
                if (savedFormation?.players?.length > 0) {
                    const defaultConfig  = DEFAULT_FORMATIONS[selectedFormat];
                    const loadedPlayers  = savedFormation.players;
                    const usedIds        = new Set();
                    const recovered = defaultConfig.positions.map(pos => {
                        const matched = loadedPlayers.find(p =>
                            !usedIds.has(p.playerId) && Math.abs(p.x - pos.x) < 10 && Math.abs(p.y - pos.y) < 10
                        );
                        if (matched) usedIds.add(matched.playerId);
                        return { playerId: matched ? matched.playerId : null, position: pos.name, x: pos.x, y: pos.y };
                    });
                    const matchedCount = recovered.filter(f => f.playerId).length;
                    if (matchedCount > 0) {
                        setFormation(recovered);
                    } else {
                        const ids = loadedPlayers.map(p => p.playerId);
                        setFormation(defaultConfig.positions.map((pos, i) => ({
                            playerId: ids[i] || null, position: pos.name, x: pos.x, y: pos.y
                        })));
                    }
                    setFormationString(savedFormation.formationString || DEFAULT_FORMATIONS[selectedFormat].formationString);
                } else {
                    initDefaultFormation();
                }
            } catch { initDefaultFormation(); }
            setHasChanges(false);
        };
        loadFormation();
    }, [team?.id, selectedFormat]);

    const initDefaultFormation = () => {
        const defaultConfig = DEFAULT_FORMATIONS[selectedFormat];
        let available = [...mainPlayerIds];
        const newFormation = [];
        defaultConfig.positions.forEach(pos => {
            const matchIdx = available.findIndex(id => {
                const p = players.find(pl => pl.id === id);
                if (!p?.position) return false;
                const pref = p.position.toLowerCase(), slot = pos.name.toLowerCase();
                if (pref === 'gk' && slot === 'gk') return true;
                if (pref === 'def' && slot.includes('b')) return true;
                if (pref === 'mid' && slot.includes('m')) return true;
                if (pref === 'fwd' && (slot.includes('f') || slot === 'st')) return true;
                return false;
            });
            let assignedId = null;
            if (matchIdx !== -1) { assignedId = available[matchIdx]; available.splice(matchIdx, 1); }
            newFormation.push({ playerId: assignedId, position: pos.name, x: pos.x, y: pos.y });
        });
        newFormation.forEach(slot => {
            if (!slot.playerId && available.length > 0) slot.playerId = available.shift();
        });
        setFormation(newFormation);
        setFormationString(defaultConfig.formationString);
    };

    const handleFormatChange = (format) => {
        if (hasChanges && !window.confirm(t('teams.formation.unsavedChanges'))) return;
        setSelectedFormat(format);
        setSelectedPlayerId(null);
    };

    const handleSlotClick = (index) => {
        if (!isCaptain) return;
        const clickedSlot     = formation[index];
        const clickedPlayerId = clickedSlot.playerId;

        if (selectedPlayerId) {
            if (clickedPlayerId === selectedPlayerId) { setSelectedPlayerId(null); return; }
            const sourceIdx = formation.findIndex(f => f.playerId === selectedPlayerId);
            if (sourceIdx !== -1) {
                const tempId = formation[index].playerId;
                setFormation(formation.map((s, i) => {
                    if (i === index)     return { ...s, playerId: selectedPlayerId };
                    if (i === sourceIdx) return { ...s, playerId: tempId };
                    return s;
                }));
                setHasChanges(true);
                setSelectedPlayerId(null);
                message.success(t('teams.formation.swapped'));
                return;
            }
            const isBench = mainPlayerIds.includes(selectedPlayerId) && !formation.find(f => f.playerId === selectedPlayerId);
            if (isBench) {
                setFormation(formation.map((s, i) => i === index ? { ...s, playerId: selectedPlayerId } : s));
                setHasChanges(true);
                setSelectedPlayerId(null);
                return;
            }
        } else {
            if (clickedPlayerId) setSelectedPlayerId(clickedPlayerId);
        }
    };

    const handleBenchPlayerClick = (playerId) => {
        if (!isCaptain) return;
        if (selectedPlayerId) {
            if (selectedPlayerId === playerId) { setSelectedPlayerId(null); return; }
            const sourceIdx = formation.findIndex(f => f.playerId === selectedPlayerId);
            if (sourceIdx !== -1) {
                setFormation(formation.map((s, i) => i === sourceIdx ? { ...s, playerId } : s));
                setHasChanges(true);
                setSelectedPlayerId(null);
                return;
            }
            setSelectedPlayerId(playerId);
        } else {
            setSelectedPlayerId(playerId);
        }
    };

    const handleSave = async () => {
        try {
            await updateFormationByFormat({
                teamId: team.id,
                gameFormat: selectedFormat,
                formationString,
                players: formation.filter(s => s.playerId).map(s => ({ playerId: s.playerId, position: s.position, x: s.x, y: s.y })),
                currentUserId: currentUser.id
            }).unwrap();
            message.success(t('teams.formation.savedSuccess', { format: selectedFormat }));
            setHasChanges(false);
            try {
                const fresh = await getFormationByFormat({ teamId: team.id, gameFormat: selectedFormat }).unwrap();
                if (fresh?.players?.length > 0) {
                    const usedIds = new Set();
                    setFormation(DEFAULT_FORMATIONS[selectedFormat].positions.map(pos => {
                        const m = fresh.players.find(p => !usedIds.has(p.playerId) && Math.abs(p.x - pos.x) < 10 && Math.abs(p.y - pos.y) < 10);
                        if (m) usedIds.add(m.playerId);
                        return { playerId: m ? m.playerId : null, position: pos.name, x: pos.x, y: pos.y };
                    }));
                    setFormationString(fresh.formationString || DEFAULT_FORMATIONS[selectedFormat].formationString);
                }
            } catch { /* ignore reload errors */ }
            if (onRefetch) onRefetch();
        } catch { message.error(t('teams.formation.saveError')); }
    };

    const handleReset = () => { initDefaultFormation(); setSelectedPlayerId(null); setHasChanges(false); };

    const getPlayerName   = id => { const p = players.find(pl => pl.id === id); return p?.name || p?.email || id?.substring(0, 8); };
    const getPlayerAvatar = id => { const p = players.find(pl => pl.id === id); return p?.avatar || p?.avatarUrl; };

    const playersInFormation = formation.filter(f => f.playerId).map(f => f.playerId);
    const playersOnBench     = mainPlayerIds.filter(id => !playersInFormation.includes(id));

    const formationPositions = (DEFAULT_FORMATIONS[selectedFormat] || DEFAULT_FORMATIONS['6x6']).positions;
    const tacticalArrows     = computeArrows(formationPositions);

    return (
        <Card className="glass-card" title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <span>{t('teams.formation.title')}</span>
                {isCaptain && (
                    <Space>
                        <Button icon={<UndoOutlined />} onClick={handleReset} disabled={!hasChanges}>
                            {t('teams.formation.reset')}
                        </Button>
                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={isSaving} disabled={!hasChanges}>
                            {t('teams.formation.save')}
                        </Button>
                    </Space>
                )}
            </div>
        }>
            {/* Format Selector */}
            <div style={{ marginBottom: 20 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                    {t('teams.formation.selectFormat')}
                </Text>
                <Segmented
                    options={GAME_FORMATS.map(f => ({
                        label: <span>{f.label} <Tag color="blue">{f.playerCount}</Tag></span>,
                        value: f.value
                    }))}
                    value={selectedFormat}
                    onChange={handleFormatChange}
                    block
                    style={{ maxWidth: 500 }}
                />
            </div>

            {isCaptain && (
                <div style={{
                    marginBottom: 16, padding: '8px 14px',
                    background: 'rgba(0,232,122,0.06)',
                    border: '1px solid rgba(0,232,122,0.2)',
                    borderRadius: 10,
                }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        <InfoCircleOutlined style={{ marginRight: 8, color: '#00e87a' }} />
                        <b>{t('teams.formation.editMode')}</b> {t('teams.formation.editModeHint')}
                    </Text>
                </div>
            )}

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {/* ── FIFA-style Football Field ── */}
                <div
                    ref={fieldRef}
                    style={{
                        flex: '1 1 400px',
                        aspectRatio: '2/3',
                        maxWidth: 500,
                        background: 'linear-gradient(180deg, #021409 0%, #0b3319 45%, #072616 100%)',
                        borderRadius: 14,
                        position: 'relative',
                        overflow: 'hidden',
                        border: '2px solid rgba(0,200,80,0.35)',
                        boxShadow: '0 0 50px rgba(0,0,0,0.8), inset 0 0 80px rgba(0,0,0,0.4)',
                    }}
                >
                    {/* Grass stripes */}
                    <div style={{
                        position: 'absolute', inset: 0, pointerEvents: 'none',
                        backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 36px, transparent 36px, transparent 72px)',
                    }} />

                    {/* Stadium light */}
                    <div style={{
                        position: 'absolute', inset: 0, pointerEvents: 'none',
                        background: 'radial-gradient(ellipse 90% 35% at 50% 0%, rgba(120,255,120,0.09) 0%, transparent 60%)',
                    }} />

                    {/* Field SVG lines */}
                    <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
                        {/* Border */}
                        <rect x="2%" y="1%" width="96%" height="98%" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
                        {/* Halfway line */}
                        <line x1="2%" y1="50%" x2="98%" y2="50%" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
                        {/* Center circle */}
                        <circle cx="50%" cy="50%" r="12%" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
                        {/* Top goal area */}
                        <rect x="30%" y="1%" width="40%" height="12%" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
                        {/* Top penalty area */}
                        <rect x="18%" y="1%" width="64%" height="22%" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
                        {/* Top goal bar */}
                        <rect x="38%" y="0%" width="24%" height="2%" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
                        {/* Bottom goal area */}
                        <rect x="30%" y="87%" width="40%" height="12%" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
                        {/* Bottom penalty area */}
                        <rect x="18%" y="77%" width="64%" height="22%" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
                    </svg>

                    {/* Tactical arrows */}
                    <svg
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
                        viewBox="0 0 100 100" preserveAspectRatio="none"
                    >
                        <defs>
                            <marker id="tf-arrow" markerWidth="3.5" markerHeight="3" refX="3" refY="1.5" orient="auto">
                                <polygon points="0 0, 3.5 1.5, 0 3" fill="rgba(180,255,120,0.5)" />
                            </marker>
                        </defs>
                        {tacticalArrows.map((a, i) => (
                            <line key={i} x1={a.fx} y1={a.fy} x2={a.tx} y2={a.ty}
                                stroke="rgba(160,255,100,0.28)" strokeWidth="0.75"
                                strokeDasharray="2.5 2" markerEnd="url(#tf-arrow)" />
                        ))}
                    </svg>

                    {/* Format badge */}
                    <div style={{
                        position: 'absolute', top: 10, left: 10, zIndex: 10,
                        background: 'rgba(0,232,122,0.15)',
                        border: '1px solid rgba(0,232,122,0.4)',
                        borderRadius: 8, padding: '3px 10px',
                        color: '#00e87a', fontSize: 11, fontWeight: 700,
                    }}>
                        {selectedFormat} · {playersInFormation.length}/{formatConfig?.playerCount}
                    </div>

                    {/* Player slots */}
                    {formation.map((slot, index) => (
                        <FieldSlot
                            key={index}
                            slot={slot}
                            index={index}
                            players={players}
                            isSelected={selectedPlayerId === slot.playerId && slot.playerId !== null}
                            isCaptain={isCaptain}
                            captainId={team?.captainId}
                            onClick={() => handleSlotClick(index)}
                        />
                    ))}
                </div>

                {/* ── Bench ── */}
                <div style={{ flex: '1 1 250px', maxWidth: 350 }}>
                    <div style={{ marginBottom: 12 }}>
                        <span style={{
                            fontSize: 14, fontWeight: 700,
                            color: 'var(--text-primary)',
                        }}>
                            {t('teams.formation.bench', { n: playersOnBench.length })}
                        </span>
                    </div>

                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: 8,
                        padding: 12,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 12,
                        minHeight: 100,
                    }}>
                        {playersOnBench.map(playerId => {
                            const isSelected  = selectedPlayerId === playerId;
                            const p           = players.find(pl => pl.id === playerId);
                            const isCapt      = playerId === team?.captainId;
                            const initials    = (p?.name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
                            return (
                                <div
                                    key={playerId}
                                    onClick={() => handleBenchPlayerClick(playerId)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 12px',
                                        background: isSelected
                                            ? 'rgba(79,134,247,0.12)'
                                            : 'rgba(255,255,255,0.04)',
                                        border: isSelected
                                            ? '1px solid rgba(79,134,247,0.55)'
                                            : '1px solid rgba(255,255,255,0.07)',
                                        borderRadius: 10,
                                        cursor: isCaptain ? 'pointer' : 'default',
                                        boxShadow: isSelected ? '0 0 14px rgba(79,134,247,0.25)' : 'none',
                                        transition: 'all 0.18s',
                                    }}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                                        border: isSelected
                                            ? '2px solid rgba(79,134,247,0.7)'
                                            : isCapt
                                                ? '2px solid rgba(250,173,20,0.7)'
                                                : '2px solid rgba(0,232,122,0.3)',
                                        background: isSelected
                                            ? 'rgba(79,134,247,0.2)'
                                            : isCapt
                                                ? 'rgba(250,173,20,0.15)'
                                                : 'rgba(0,232,122,0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: isSelected ? '0 0 10px rgba(79,134,247,0.35)' : 'none',
                                    }}>
                                        {getPlayerAvatar(playerId)
                                            ? <img src={getPlayerAvatar(playerId)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <span style={{
                                                fontSize: 13, fontWeight: 800, color: isCapt ? '#faad14' : '#00e87a',
                                            }}>{initials}</span>
                                        }
                                    </div>

                                    {/* Name */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: 13, fontWeight: 600,
                                            color: isSelected ? '#4f86f7' : 'var(--text-primary)',
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {getPlayerName(playerId)}
                                            {isCapt && <span style={{ marginLeft: 6, fontSize: 12 }}>👑</span>}
                                        </div>
                                        {p?.position && (
                                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                                                {p.position}
                                            </div>
                                        )}
                                    </div>

                                    {isSelected && (
                                        <div style={{
                                            width: 20, height: 20, borderRadius: '50%',
                                            background: '#4f86f7',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 11, color: '#fff', fontWeight: 900, flexShrink: 0,
                                        }}>✓</div>
                                    )}
                                </div>
                            );
                        })}

                        {playersOnBench.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    {t('teams.formation.allOnField')}
                                </Text>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default TeamFormationEditor;
