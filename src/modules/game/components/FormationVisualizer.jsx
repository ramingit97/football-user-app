import React from 'react';
import { Card } from 'antd';

const FormationVisualizer = ({ formationA, formationB, format = '5x5' }) => {
    // Default formations if not provided
    const formA = formationA || '2-2';
    const formB = formationB || '2-2';

    // Helper to parse formation string into rows
    // e.g., "1-2-1" -> [1, 2, 1] (GK is implicit in some contexts, but let's assume explicit for now or just field players)
    // Let's assume the string represents field players from defense to attack. GK is always 1 and fixed.
    // Actually for 5x5 (4 field + 1 GK), "2-2" means 2 defenders, 2 attackers.

    const getPositions = (formation, isTeamA) => {
        const rows = formation.split('-').map(Number);
        const positions = [];

        // Always add GK
        positions.push({ x: 50, y: isTeamA ? 5 : 95, role: 'GK' });

        const fieldHeight = 80; // Percentage of field used for field players
        const startY = isTeamA ? 20 : 80;
        const direction = isTeamA ? 1 : -1;

        // Distribute rows
        const rowStep = fieldHeight / (rows.length + 1);

        rows.forEach((count, rowIndex) => {
            const y = startY + (direction * (rowStep * (rowIndex)));

            // Distribute players in row
            const colStep = 100 / (count + 1);
            for (let i = 0; i < count; i++) {
                positions.push({
                    x: colStep * (i + 1),
                    y: y,
                    role: 'FP'
                });
            }
        });

        return positions;
    };

    const teamAPositions = getPositions(formA, true);
    const teamBPositions = getPositions(formB, false);

    return (
        <div style={{
            width: '100%',
            height: '400px',
            background: '#4CAF50',
            position: 'relative',
            borderRadius: '8px',
            border: '2px solid #fff',
            overflow: 'hidden'
        }}>
            {/* Center Line */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '2px',
                background: 'rgba(255,255,255,0.7)',
                transform: 'translateY(-50%)'
            }} />

            {/* Center Circle */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '80px',
                height: '80px',
                border: '2px solid rgba(255,255,255,0.7)',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)'
            }} />

            {/* Goals */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: '35%',
                width: '30%',
                height: '20px',
                border: '2px solid rgba(255,255,255,0.7)',
                borderTop: 'none'
            }} />
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: '35%',
                width: '30%',
                height: '20px',
                border: '2px solid rgba(255,255,255,0.7)',
                borderBottom: 'none'
            }} />

            {/* Players Team A */}
            {teamAPositions.map((pos, idx) => (
                <div key={`a-${idx}`} style={{
                    position: 'absolute',
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    width: '20px',
                    height: '20px',
                    background: '#1890ff',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    zIndex: 2
                }} />
            ))}

            {/* Players Team B */}
            {teamBPositions.map((pos, idx) => (
                <div key={`b-${idx}`} style={{
                    position: 'absolute',
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    width: '20px',
                    height: '20px',
                    background: '#f5222d',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    zIndex: 2
                }} />
            ))}
        </div>
    );
};

export default FormationVisualizer;
