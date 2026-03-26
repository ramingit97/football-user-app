import React from 'react';
import { ColorPicker, Space, Typography } from 'antd';

const { Text } = Typography;

const KitSelector = ({ teamAColor, teamBColor, onColorChange, isOrganizer }) => {
    if (!isOrganizer) return null;

    return (
        <div style={{
            marginBottom: 20,
            padding: '12px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '12px'
        }}>
            <Text strong style={{ color: 'white', display: 'block', marginBottom: 12 }}>
                Team Colors (Kits)
            </Text>
            <Space size="large">
                <div style={{ textAlign: 'center' }}>
                    <Text style={{ color: 'white', display: 'block', marginBottom: 4 }}>Team A</Text>
                    <ColorPicker
                        value={teamAColor}
                        onChange={(c) => onColorChange('teamA', c.toHexString())}
                    />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Text style={{ color: 'white', display: 'block', marginBottom: 4 }}>Team B</Text>
                    <ColorPicker
                        value={teamBColor}
                        onChange={(c) => onColorChange('teamB', c.toHexString())}
                    />
                </div>
            </Space>
        </div>
    );
};

export default KitSelector;
