import React, { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import TeamFieldView from './TeamFieldView';
import { useTranslation } from 'react-i18next';

const DualTeamFieldView = ({
    players = [],
    teamAName,
    teamBName,
    teamAColor = '#ff4d4f',
    teamBColor = '#1890ff',
    formationA = '2-2',
    formationB = '2-2',
    onPlayerClick,
    onPositionClick,
    hideEmptySlots = false,
    gameFormat = '5x5',
    isSelectionMode = false,
    isAnimating = false
}) => {
    const { t } = useTranslation();
    const resolvedTeamAName = teamAName || t('game.detail.team1');
    const resolvedTeamBName = teamBName || t('game.detail.team2');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
    const [activeTab, setActiveTab] = useState('teamA');

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 900);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ===== PROPER TEAM FILTERING =====
    // Priority: team prop > position prefix "A-"/"B-" > fallback by index
    // Each player assigned to exactly one team, no duplicates
    const splitPlayersByTeam = (allPlayers) => {
        const teamA = [];
        const teamB = [];
        const assigned = new Set();

        // Pass 1: explicit `team` property
        allPlayers.forEach(p => {
            if (p.team === 'A') { teamA.push(p); assigned.add(p.id); }
            else if (p.team === 'B') { teamB.push(p); assigned.add(p.id); }
        });

        // Pass 2: position prefix (strict regex, not startsWith)
        allPlayers.forEach(p => {
            if (assigned.has(p.id)) return;
            if (p.position && /^A-/i.test(p.position)) { teamA.push(p); assigned.add(p.id); }
            else if (p.position && /^B-/i.test(p.position)) { teamB.push(p); assigned.add(p.id); }
        });

        // Pass 3: remaining unassigned — split by index
        const unassigned = allPlayers.filter(p => !assigned.has(p.id));
        const half = Math.ceil(unassigned.length / 2);
        unassigned.forEach((p, idx) => {
            if (idx < half) teamA.push(p);
            else teamB.push(p);
        });

        return { teamA, teamB };
    };

    const { teamA: teamAPlayers, teamB: teamBPlayers } = splitPlayersByTeam(players);

    if (isMobile) {
        return (
            <div style={{ width: '100%' }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    centered
                    type="card"
                    items={[
                        {
                            key: 'teamA',
                            label: (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: teamAColor, border: '2px solid white' }} />
                                    {resolvedTeamAName}
                                </span>
                            ),
                            children: (
                                <TeamFieldView
                                    team="A" players={teamAPlayers} teamName={resolvedTeamAName}
                                    teamColor={teamAColor} formation={formationA}
                                    onPlayerClick={onPlayerClick} onPositionClick={onPositionClick}
                                    hideEmptySlots={hideEmptySlots} gameFormat={gameFormat}
                                    isSelectionMode={isSelectionMode} isAnimating={isAnimating}
                                />
                            )
                        },
                        {
                            key: 'teamB',
                            label: (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: teamBColor, border: '2px solid white' }} />
                                    {resolvedTeamBName}
                                </span>
                            ),
                            children: (
                                <TeamFieldView
                                    team="B" players={teamBPlayers} teamName={resolvedTeamBName}
                                    teamColor={teamBColor} formation={formationB}
                                    onPlayerClick={onPlayerClick} onPositionClick={onPositionClick}
                                    hideEmptySlots={hideEmptySlots} gameFormat={gameFormat}
                                    isSelectionMode={isSelectionMode} isAnimating={isAnimating}
                                />
                            )
                        }
                    ]}
                />
            </div>
        );
    }

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: 12,
            width: '100%',
            alignItems: 'start'
        }}>
            <TeamFieldView
                team="A" players={teamAPlayers} teamName={resolvedTeamAName}
                teamColor={teamAColor} formation={formationA}
                onPlayerClick={onPlayerClick} onPositionClick={onPositionClick}
                hideEmptySlots={hideEmptySlots} gameFormat={gameFormat}
                isSelectionMode={isSelectionMode} isAnimating={isAnimating}
            />

            {/* VS Indicator */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                paddingTop: 200, position: 'relative'
            }}>
                <AnimatePresence>
                    {isAnimating ? (
                        <motion.div
                            key="vs-animated"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            style={{
                                width: 56, height: 56, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #FDB813, #FFA500)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 30px rgba(253, 184, 19, 0.6), 0 4px 15px rgba(0,0,0,0.3)',
                            }}
                        >
                            <motion.span
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e' }}
                            >
                                ⚡
                            </motion.span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="vs-static"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                                width: 40, height: 40, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid rgba(255,255,255,0.15)'
                            }}
                        >
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)' }}>VS</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <TeamFieldView
                team="B" players={teamBPlayers} teamName={resolvedTeamBName}
                teamColor={teamBColor} formation={formationB}
                onPlayerClick={onPlayerClick} onPositionClick={onPositionClick}
                hideEmptySlots={hideEmptySlots} gameFormat={gameFormat}
                isSelectionMode={isSelectionMode} isAnimating={isAnimating}
            />
        </div>
    );
};

export default DualTeamFieldView; 