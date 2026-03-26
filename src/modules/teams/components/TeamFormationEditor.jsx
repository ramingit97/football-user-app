import { useState, useEffect, useRef } from 'react';
import { Card, Button, message, Avatar, Tag, Tooltip, Segmented, Space, Typography } from 'antd';
import { SaveOutlined, UndoOutlined, UserOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useUpdateFormationByFormatMutation, useLazyGetFormationByFormatQuery } from '../../../store/teamsApi';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

// Game formats with player counts
const GAME_FORMATS = [
    { value: '5x5', label: '5x5', playerCount: 5 },
    { value: '6x6', label: '6x6', playerCount: 6 },
    { value: '8x8', label: '8x8', playerCount: 8 },
    { value: '11x11', label: '11x11', playerCount: 11 },
];

// Default formations for different formats
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
            { name: 'CB', x: 62, y: 78 },
            { name: 'RB', x: 85, y: 75 },
            { name: 'LM', x: 15, y: 50 },
            { name: 'CM', x: 38, y: 50 },
            { name: 'CM', x: 62, y: 50 },
            { name: 'RM', x: 85, y: 50 },
            { name: 'LF', x: 35, y: 22 },
            { name: 'RF', x: 65, y: 22 },
        ]
    }
};

const TeamFormationEditor = ({ team, players = [], isCaptain, onRefetch }) => {
    const { t } = useTranslation();
    const fieldRef = useRef(null);
    const [selectedFormat, setSelectedFormat] = useState('6x6');
    const [formation, setFormation] = useState([]);
    const [formationString, setFormationString] = useState(DEFAULT_FORMATIONS['6x6'].formationString);
    const [selectedPlayerId, setSelectedPlayerId] = useState(null); // ID of selected player (on field or bench) for swap
    const [hasChanges, setHasChanges] = useState(false);

    const [updateFormationByFormat, { isLoading: isSaving }] = useUpdateFormationByFormatMutation();
    const [getFormationByFormat] = useLazyGetFormationByFormatQuery();

    const currentUser = JSON.parse(localStorage.getItem('user'));

    // Available players (from team)
    const mainPlayerIds = team?.playerIds || [];
    const formatConfig = GAME_FORMATS.find(f => f.value === selectedFormat);

    // Load formation when format changes
    useEffect(() => {
        const loadFormation = async () => {
            if (!team?.id) return;

            try {
                const savedFormation = await getFormationByFormat({
                    teamId: team.id,
                    gameFormat: selectedFormat
                }).unwrap();

                if (savedFormation && savedFormation.players && savedFormation.players.length > 0) {
                    // Map saved players to fixed slots based on strict position matching if possible,
                    // or just load them as is but snap to grid? 
                    // To ensure "fixed slots", we should re-generate the slots from DEFAULT and fill them.

                    const defaultConfig = DEFAULT_FORMATIONS[selectedFormat];
                    const loadedPlayers = savedFormation.players;

                    // Re-construct slots
                    const newFormation = defaultConfig.positions.map((pos, idx) => {
                        // Find if we have a saved player at this exact position (by index or proximity?)
                        // Simple approach: stick to saved index if matches, or just fill available.
                        // Better: Use the saved data if it aligns, otherwise reset.
                        // Actually, let's trust saved data but enable "Snap" if needed.
                        // For this refactor, let's just use the saved data effectively.

                        // We need to ensure the `formation` array has fixed size = slots count.
                        // The saved data might be old (variable length).
                        // Let's try to map saved players to the new slot structure.

                        // Find a player that was saved at this approximate position?
                        // Or just fill slots with saved players sequentially?

                        // Current simplifiction: Use InitDefault but try to preserve players who were on field.
                        const savedPlayer = loadedPlayers.find(p =>
                            (p.x === pos.x && p.y === pos.y) || // Exact match
                            (Math.abs(p.x - pos.x) < 5 && Math.abs(p.y - pos.y) < 5) // Approximate
                        );

                        // If no direct positional match, we might lose them?
                        // Let's use a simpler heuristic:
                        // 1. Initialize empty slots.
                        // 2. Fill slots with players from saved data who are "active".

                        return {
                            ...pos,
                            position: pos.name,
                            playerId: savedPlayer ? savedPlayer.playerId : null
                        };
                    });

                    // Fallback: If strict mapping failed (e.g. old coordinates were custom), 
                    // just fill slots with the list of players who were saved.
                    const activeSavedIds = loadedPlayers.map(p => p.playerId);
                    let currentSavedIdx = 0;

                    const usedPlayerIds = new Set();

                    const recoveredFormation = defaultConfig.positions.map((pos) => {
                        // Check if any saved player is roughly here
                        let assignedId = null;
                        // Try to find a player close to this slot
                        const closest = loadedPlayers.find(p =>
                            !usedPlayerIds.has(p.playerId) && Math.abs(p.x - pos.x) < 10 && Math.abs(p.y - pos.y) < 10
                        );

                        if (closest) {
                            assignedId = closest.playerId;
                            usedPlayerIds.add(assignedId);
                        } else if (currentSavedIdx < activeSavedIds.length) {
                            // If we have players but they don't match slots, we might put them nearby or just fill?
                            // Let's stick to "initDefault" logic if structure differs too much.
                        }

                        return {
                            playerId: assignedId,
                            position: pos.name,
                            x: pos.x,
                            y: pos.y
                        };
                    });

                    // If we found players via matching, use it. Otherwise default.
                    const matchedCount = recoveredFormation.filter(f => f.playerId).length;
                    if (matchedCount > 0) {
                        setFormation(recoveredFormation);
                    } else {
                        // Fallback to simple fill
                        const simpleFill = defaultConfig.positions.map((pos, idx) => ({
                            playerId: activeSavedIds[idx] || null,
                            position: pos.name,
                            x: pos.x,
                            y: pos.y
                        }));
                        setFormation(simpleFill);
                    }

                    setFormationString(savedFormation.formationString || DEFAULT_FORMATIONS[selectedFormat].formationString);
                } else {
                    initDefaultFormation();
                }
            } catch {
                initDefaultFormation();
            }
            setHasChanges(false);
        };

        loadFormation();
    }, [team?.id, selectedFormat]);

    const initDefaultFormation = () => {
        const defaultConfig = DEFAULT_FORMATIONS[selectedFormat];

        let availablePlayerIds = [...mainPlayerIds];
        const newFormation = [];

        // 1. First pass: Try to assign players to their preferred positions
        defaultConfig.positions.forEach(pos => {
            let assignedPlayerId = null;

            // Find a player whose position somewhat matches the slot name (e.g. GK -> gk, ST -> fwd, etc)
            const matchedPlayerIndex = availablePlayerIds.findIndex(id => {
                const player = players.find(p => p.id === id);
                if (!player || !player.position) return false;

                const prefPos = player.position.toLowerCase();
                const slotPos = pos.name.toLowerCase();

                if (prefPos === 'gk' && slotPos === 'gk') return true;
                if (prefPos === 'def' && (slotPos.includes('b'))) return true; // LB, RB, CB
                if (prefPos === 'mid' && (slotPos.includes('m'))) return true; // LM, RM, CM
                if (prefPos === 'fwd' && (slotPos.includes('f') || slotPos === 'st')) return true; // LF, RF, ST

                return false;
            });

            if (matchedPlayerIndex !== -1) {
                assignedPlayerId = availablePlayerIds[matchedPlayerIndex];
                availablePlayerIds.splice(matchedPlayerIndex, 1);
            }

            newFormation.push({
                playerId: assignedPlayerId,
                position: pos.name,
                x: pos.x,
                y: pos.y,
            });
        });

        // 2. Second pass: Fill remaining empty slots with any unassigned players
        newFormation.forEach(slot => {
            if (!slot.playerId && availablePlayerIds.length > 0) {
                slot.playerId = availablePlayerIds.shift();
            }
        });

        setFormation(newFormation);
        setFormationString(defaultConfig.formationString);
    };

    const handleFormatChange = (format) => {
        if (hasChanges) {
            const confirmed = window.confirm(t('teams.formation.unsavedChanges'));
            if (!confirmed) return;
        }
        setSelectedFormat(format);
        setSelectedPlayerId(null);
    };

    const handleSlotClick = (index) => {
        if (!isCaptain) return;

        const clickedSlot = formation[index];
        const clickedPlayerId = clickedSlot.playerId;

        if (selectedPlayerId) {
            // WE HAVE A SELECTION (Source)

            // Case 1: Clicked the same player/slot -> Deselect
            if (clickedPlayerId === selectedPlayerId) {
                setSelectedPlayerId(null);
                return;
            }

            // Case 2: Source was a Field Player (found in formation)
            const sourceSlotIndex = formation.findIndex(f => f.playerId === selectedPlayerId);

            if (sourceSlotIndex !== -1) {
                // Swap two field slots (immutable update)
                const tempId = formation[index].playerId;
                const newFormation = formation.map((slot, i) => {
                    if (i === index) return { ...slot, playerId: selectedPlayerId };
                    if (i === sourceSlotIndex) return { ...slot, playerId: tempId };
                    return slot;
                });

                setFormation(newFormation);
                setHasChanges(true);
                setSelectedPlayerId(null);
                message.success(t('teams.formation.swapped'));
                return;
            }

            // Case 3: Source was a Bench Player (not in formation)
            const isBenchPlayer = mainPlayerIds.includes(selectedPlayerId) && !formation.find(f => f.playerId === selectedPlayerId);

            if (isBenchPlayer) {
                // Place bench player into this slot (immutable update)
                const newFormation = formation.map((slot, i) => {
                    if (i === index) return { ...slot, playerId: selectedPlayerId };
                    return slot;
                });

                setFormation(newFormation);
                setHasChanges(true);
                setSelectedPlayerId(null);
                return;
            }
        } else {
            // NO SELECTION -> Select this slot (if occupied? or even if empty to move someone there?)
            // If empty, we can't "select" it to move IT somewhere. We select it to move someone TO it.
            // But usually we select Source first.
            // So if empty, maybe do nothing? Or allow selecting empty to verify? 
            // Better: Allow selecting occupied slots.

            if (clickedPlayerId) {
                setSelectedPlayerId(clickedPlayerId);
            }
        }
    };

    const handleBenchPlayerClick = (playerId) => {
        if (!isCaptain) return;

        if (selectedPlayerId) {
            // If we have a selection...

            if (selectedPlayerId === playerId) {
                setSelectedPlayerId(null); // Deselect
                return;
            }

            // If source was a Field Player -> Move him to bench? 
            // Existing logic: "Swap" implies we need a target. 
            // Clicking bench usually means "I want to put THIS guy on field".
            // If I already selected a field player, and click bench player... typically we swap them.

            const sourceSlotIndex = formation.findIndex(f => f.playerId === selectedPlayerId);
            if (sourceSlotIndex !== -1) {
                // Swap Field Player with Bench Player (immutable update)
                const newFormation = formation.map((slot, i) => {
                    if (i === sourceSlotIndex) return { ...slot, playerId: playerId };
                    return slot;
                });

                setFormation(newFormation);
                setHasChanges(true);
                setSelectedPlayerId(null);
                return;
            }

            // If source was another Bench Player -> Just change selection
            setSelectedPlayerId(playerId);
        } else {
            // Select this bench player
            setSelectedPlayerId(playerId);
        }
    };

    const handleSave = async () => {
        try {
            // Filter out empty slots for saving logic if API expects only list of players
            const playersToSave = formation
                .filter(slot => slot.playerId) // Only occupied slots
                .map(slot => ({
                    playerId: slot.playerId,
                    position: slot.position,
                    x: slot.x,
                    y: slot.y
                }));

            await updateFormationByFormat({
                teamId: team.id,
                gameFormat: selectedFormat,
                formationString,
                players: playersToSave,
                currentUserId: currentUser.id
            }).unwrap();
            message.success(t('teams.formation.savedSuccess', { format: selectedFormat }));
            setHasChanges(false);

            // Re-fetch formation from server to confirm save and sync state
            try {
                const freshData = await getFormationByFormat({
                    teamId: team.id,
                    gameFormat: selectedFormat
                }).unwrap();

                if (freshData?.players?.length > 0) {
                    const defaultConfig = DEFAULT_FORMATIONS[selectedFormat];
                    const loadedPlayers = freshData.players;

                    const usedIdsHandleSave = new Set();
                    const reloadedFormation = defaultConfig.positions.map((pos) => {
                        const matched = loadedPlayers.find(p =>
                            !usedIdsHandleSave.has(p.playerId) && Math.abs(p.x - pos.x) < 10 && Math.abs(p.y - pos.y) < 10
                        );
                        if (matched) usedIdsHandleSave.add(matched.playerId);
                        return {
                            playerId: matched ? matched.playerId : null,
                            position: pos.name,
                            x: pos.x,
                            y: pos.y
                        };
                    });
                    setFormation(reloadedFormation);
                    setFormationString(freshData.formationString || defaultConfig.formationString);
                }
            } catch { /* ignore reload errors, save was successful */ }

            if (onRefetch) onRefetch();
        } catch (error) {
            message.error(t('teams.formation.saveError'));
        }
    };

    const handleReset = () => {
        initDefaultFormation();
        setSelectedPlayerId(null);
        setHasChanges(false);
    };

    const getPlayerName = (playerId) => {
        const player = players.find(p => p.id === playerId);
        return player?.name || player?.email || `ID: ${playerId.substring(0, 8)}`;
    };

    const getPlayerAvatar = (playerId) => {
        const player = players.find(p => p.id === playerId);
        return player?.avatar || player?.avatarUrl;
    };

    // Derived state
    const playersInFormation = formation.filter(f => f.playerId).map(f => f.playerId);
    const playersOnBench = mainPlayerIds.filter(id => !playersInFormation.includes(id));

    return (
        <Card className="glass-card" title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <span>{t('teams.formation.title')}</span>
                {isCaptain && (
                    <Space>
                        <Button
                            icon={<UndoOutlined />}
                            onClick={handleReset}
                            disabled={!hasChanges}
                        >
                            {t('teams.formation.reset')}
                        </Button>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={handleSave}
                            loading={isSaving}
                            disabled={!hasChanges}
                        >
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
                <div style={{ marginBottom: 16, padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                    <Text type="secondary">
                        <InfoCircleOutlined style={{ marginRight: 8 }} />
                        <b>{t('teams.formation.editMode')}</b> {t('teams.formation.editModeHint')}
                    </Text>
                </div>
            )}

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {/* Football Field */}
                <div
                    ref={fieldRef}
                    style={{
                        flex: '1 1 400px',
                        aspectRatio: '2/3',
                        maxWidth: 500,
                        background: 'linear-gradient(180deg, #2d5a27 0%, #3d7a37 50%, #2d5a27 100%)',
                        borderRadius: 12,
                        position: 'relative',
                        overflow: 'hidden',
                        border: '3px solid #4a8044',
                    }}
                >
                    {/* Field Lines */}
                    <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
                        {/* Center line */}
                        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                        {/* Center circle */}
                        <circle cx="50%" cy="50%" r="15%" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                        {/* Goal areas */}
                        <rect x="30%" y="0" width="40%" height="15%" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                        <rect x="30%" y="85%" width="40%" height="15%" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                        {/* Penalty areas */}
                        <rect x="20%" y="0" width="60%" height="25%" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                        <rect x="20%" y="75%" width="60%" height="25%" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                        {/* Border */}
                        <rect x="2%" y="1%" width="96%" height="98%" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                    </svg>

                    {/* Format indicator */}
                    <Tag color="gold" style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
                        {selectedFormat} ({playersInFormation.length}/{formatConfig?.playerCount})
                    </Tag>

                    {/* Slots on field (Iterate over ALL formation slots) */}
                    {formation.map((slot, index) => {
                        const { playerId, position, x, y } = slot;
                        const isSelected = selectedPlayerId === playerId && playerId !== null;
                        // Also highlight empty slot if we want to target it? 
                        // No, we highlight selection source.

                        return (
                            <div
                                key={index}
                                onClick={() => handleSlotClick(index)}
                                style={{
                                    position: 'absolute',
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    cursor: isCaptain ? 'pointer' : 'default',
                                    transition: 'all 0.2s ease',
                                    zIndex: isSelected ? 20 : 10
                                }}
                            >
                                <Tooltip title={playerId ? `${getPlayerName(playerId)} (${position})` : t('teams.formation.freePosition', { pos: position })}>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 4
                                    }}>
                                        {playerId ? (
                                            <div style={{ position: 'relative' }}>
                                                <Avatar
                                                    shape="square"
                                                    size={48}
                                                    src={getPlayerAvatar(playerId)}
                                                    icon={<UserOutlined />}
                                                    style={{
                                                        borderRadius: '8px',
                                                        border: isSelected ? '3px solid #1890ff' : '2px solid white',
                                                        boxShadow: isSelected ? '0 0 15px #1890ff' : '0 2px 8px rgba(0,0,0,0.4)',
                                                        backgroundColor: playerId === team?.captainId ? '#faad14' : '#52c41a',
                                                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                />
                                                {isSelected && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: -10,
                                                        right: -10,
                                                        background: '#1890ff',
                                                        color: 'white',
                                                        borderRadius: '50%',
                                                        width: 20,
                                                        height: 20,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 12
                                                    }}>✓</div>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: '8px',
                                                border: '2px dashed rgba(255,255,255,0.5)',
                                                background: 'rgba(0,0,0,0.2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'rgba(255,255,255,0.7)'
                                            }}>
                                                <UserOutlined />
                                            </div>
                                        )}

                                        <Tag color={playerId ? "blue" : "default"} style={{ fontSize: 10, margin: 0, opacity: 0.9 }}>
                                            {position}
                                        </Tag>
                                    </div>
                                </Tooltip>
                            </div>
                        )
                    })}
                </div>

                {/* Players list / Bench */}
                <div style={{ flex: '1 1 250px', maxWidth: 350 }}>
                    <Title level={5} style={{ color: 'var(--text-primary)' }}>
                        {t('teams.formation.bench', { n: playersOnBench.length })}
                    </Title>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        padding: 12,
                        background: 'var(--bg-secondary)',
                        borderRadius: 8,
                        minHeight: 100
                    }}>
                        {playersOnBench.map(playerId => {
                            const isSelected = selectedPlayerId === playerId;
                            return (
                                <div
                                    key={playerId}
                                    onClick={() => handleBenchPlayerClick(playerId)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '8px 12px',
                                        background: isSelected ? '#e6f7ff' : 'var(--bg-primary)',
                                        border: isSelected ? '1px solid #1890ff' : '1px solid transparent',
                                        borderRadius: 8,
                                        cursor: isCaptain ? 'pointer' : 'default',
                                        boxShadow: isSelected ? '0 0 10px rgba(24, 144, 255, 0.3)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Avatar
                                        shape="square"
                                        size={40}
                                        src={getPlayerAvatar(playerId)}
                                        icon={<UserOutlined />}
                                        style={{ borderRadius: '8px' }}
                                    />
                                    <Text style={{ color: isSelected ? '#1890ff' : 'var(--text-primary)', fontSize: 12, fontWeight: isSelected ? 'bold' : 'normal' }}>
                                        {getPlayerName(playerId)}
                                    </Text>
                                </div>
                            )
                        })}
                        {playersOnBench.length === 0 && (
                            <Text type="secondary">{t('teams.formation.allOnField')}</Text>
                        )}
                    </div>


                </div>
            </div>
        </Card>
    );
};

export default TeamFormationEditor;
