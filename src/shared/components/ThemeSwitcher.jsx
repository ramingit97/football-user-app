import { useState } from 'react';
import { Button, Drawer, Radio, Switch, Space, Typography, Divider } from 'antd';
import { SettingOutlined, BgColorsOutlined } from '@ant-design/icons';
import { useTheme, THEMES } from '../context/ThemeContext';

const { Text, Title } = Typography;

const ThemeSwitcher = () => {
    const [visible, setVisible] = useState(false);
    const { currentThemeKey, changeTheme, isCompact, toggleCompact } = useTheme();

    return (
        <>
            <Button
                type="primary"
                shape="circle"
                icon={<SettingOutlined spin={visible} />}
                size="large"
                style={{
                    position: 'fixed',
                    right: 24,
                    bottom: 24,
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
                onClick={() => setVisible(true)}
            />

            <Drawer
                title={
                    <Space>
                        <BgColorsOutlined />
                        <span>Настройки оформления</span>
                    </Space>
                }
                placement="right"
                onClose={() => setVisible(false)}
                open={visible}
                width={320}
                styles={{
                    body: { padding: '24px' }
                }}
            >
                <div style={{ marginBottom: 24 }}>
                    <Title level={5} style={{ marginBottom: 16 }}>Тема оформления</Title>
                    <Radio.Group
                        value={currentThemeKey}
                        onChange={(e) => changeTheme(e.target.value)}
                        style={{ width: '100%' }}
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {Object.values(THEMES).map((theme) => (
                                <Radio.Button
                                    key={theme.key}
                                    value={theme.key}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        marginBottom: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        height: 'auto',
                                        padding: '12px'
                                    }}
                                >
                                    <Space>
                                        <div style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: '50%',
                                            background: theme.token.colorPrimary,
                                            border: '2px solid rgba(255,255,255,0.2)'
                                        }} />
                                        <span>{theme.name}</span>
                                    </Space>
                                </Radio.Button>
                            ))}
                        </Space>
                    </Radio.Group>
                </div>

                <Divider />

                <div style={{ marginBottom: 24 }}>
                    <Title level={5} style={{ marginBottom: 16 }}>Интерфейс</Title>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text>Компактный режим</Text>
                        <Switch checked={isCompact} onChange={toggleCompact} />
                    </div>
                </div>

                <div style={{
                    marginTop: 'auto',
                    paddingTop: 24,
                    textAlign: 'center',
                    color: 'var(--text-tertiary)',
                    fontSize: 12
                }}>
                    Football App v1.0
                </div>
            </Drawer>
        </>
    );
};

export default ThemeSwitcher;
