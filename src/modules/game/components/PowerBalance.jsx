import React from 'react';
import { Progress, Typography } from 'antd';

const { Text } = Typography;

const PowerBalance = ({ players = [] }) => {
    // Calculate team ratings
    // Mock logic: assume players have a 'rating' field or random
    // In real app, use player.averageRating

    // Split players into teams (mock logic for now)
    const teamA = players.filter((_, i) => i % 2 === 0);
    const teamB = players.filter((_, i) => i % 2 !== 0);

    const getTeamRating = (team) => {
        if (team.length === 0) return 0;
        const total = team.reduce((acc, p) => acc + (p.averageRating || 5.0), 0);
        return total / team.length;
    };

    const ratingA = getTeamRating(teamA);
    const ratingB = getTeamRating(teamB);

    const totalRating = ratingA + ratingB;
    const percentA = totalRating === 0 ? 50 : (ratingA / totalRating) * 100;

    return (
        <div style={{
            marginBottom: 20,
            padding: '12px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text strong style={{ color: 'white' }}>Team A ({ratingA.toFixed(1)})</Text>
                <Text strong style={{ color: 'white' }}>Team B ({ratingB.toFixed(1)})</Text>
            </div>
            <Progress
                percent={percentA}
                showInfo={false}
                strokeColor="#ff4d4f"
                trailColor="#1890ff"
                strokeLinecap="butt"
                size="large"
                style={{ borderRadius: '8px', overflow: 'hidden' }}
            />
            <div style={{ textAlign: 'center', marginTop: 4 }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                    Power Balance
                </Text>
            </div>
        </div>
    );
};

export default PowerBalance;
