import { Card, Progress, Row, Col, Tooltip, Typography } from 'antd';
import { TrophyOutlined, StarOutlined, FireOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const Achievements = ({ user }) => {
    const { t } = useTranslation();

    const ACHIEVEMENTS_LIST = [
        { id: 'first_game', title: t('profile.achievements.achievements.firstGame.title'), icon: <TrophyOutlined />, description: t('profile.achievements.achievements.firstGame.description') },
        { id: 'hat_trick', title: t('profile.achievements.achievements.hatTrick.title'), icon: <FireOutlined />, description: t('profile.achievements.achievements.hatTrick.description') },
        { id: 'playmaker', title: t('profile.achievements.achievements.playmaker.title'), icon: <ThunderboltOutlined />, description: t('profile.achievements.achievements.playmaker.description') },
        { id: 'mvp', title: t('profile.achievements.achievements.mvp.title'), icon: <StarOutlined />, description: t('profile.achievements.achievements.mvp.description') },
        { id: 'speedster', title: t('profile.achievements.achievements.sprinter.title'), icon: <ThunderboltOutlined />, description: t('profile.achievements.achievements.sprinter.description') },
    ];

    const xp = user?.xp || 0;
    const level = user?.level || 1;
    const nextLevelXp = level * 1000;
    const progress = (xp / nextLevelXp) * 100;
    const userAchievements = user?.achievements || [];

    return (
        <div className="achievements-container">
            <Card className="glass-card" style={{ marginBottom: 24 }}>
                <Row gutter={[24, 24]} align="middle">
                    <Col span={24} md={8} style={{ textAlign: 'center' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <Progress
                                type="circle"
                                percent={progress}
                                format={() => <span style={{ color: 'var(--primary-color)', fontSize: 24 }}>Lvl {level}</span>}
                                strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                                size={120}
                            />
                        </div>
                        <div style={{ marginTop: 16 }}>
                            <Text style={{ color: 'var(--text-secondary)' }}>{xp} / {nextLevelXp} XP</Text>
                        </div>
                    </Col>
                    <Col span={24} md={16}>
                        <Title level={4} style={{ color: 'var(--text-primary)', marginBottom: 16 }}>{t('profile.achievements.progress')}</Title>
                        <Text style={{ color: 'var(--text-secondary)' }}>
                            {t('profile.achievements.description')}
                        </Text>
                    </Col>
                </Row>
            </Card>

            {/* Collected Badges Section */}
            <Title level={4} style={{ color: 'var(--text-primary)', marginBottom: 16 }}>{t('profile.achievements.badges')}</Title>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {[
                    { key: 'attack', icon: '⚽', label: t('profile.achievements.badgeAttack'), color: '#f43f5e' },
                    { key: 'defense', icon: '🛡️', label: t('profile.achievements.badgeDefense'), color: '#ff6b35' },
                    { key: 'speed', icon: '⚡', label: t('profile.achievements.badgeSpeed'), color: '#00d4ff' },
                    { key: 'stamina', icon: '🔋', label: t('profile.achievements.badgeStamina'), color: '#52c41a' },
                    { key: 'game_saver', icon: '🦸', label: t('profile.achievements.badgeGameSaver'), color: '#faad14' },
                ].map(badge => {
                    const count = (user?.receivedBadges && user.receivedBadges[badge.key]) || 0;
                    return (
                        <Col xs={12} sm={6} key={badge.key}>
                            <Card className="glass-card" bodyStyle={{ padding: 12, textAlign: 'center' }}>
                                <div style={{ fontSize: 24, marginBottom: 4 }}>{badge.icon}</div>
                                <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{badge.label}</Text>
                                <div style={{
                                    fontSize: 20,
                                    fontWeight: 'bold',
                                    color: count > 0 ? badge.color : 'var(--text-tertiary)',
                                    marginTop: 4
                                }}>
                                    x{count}
                                </div>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            <Title level={4} style={{ color: 'var(--text-primary)', marginBottom: 16 }}>{t('profile.achievements.title')}</Title>
            <Row gutter={[16, 16]}>
                {ACHIEVEMENTS_LIST.map(ach => {
                    const isUnlocked = userAchievements.some(ua => ua.type === ach.id.toUpperCase());
                    return (
                        <Col xs={12} sm={8} md={6} key={ach.id}>
                            <Tooltip title={ach.description}>
                                <Card
                                    className="glass-card"
                                    style={{
                                        textAlign: 'center',
                                        opacity: isUnlocked ? 1 : 0.5,
                                        filter: isUnlocked ? 'none' : 'grayscale(100%)',
                                        cursor: 'default'
                                    }}
                                    bodyStyle={{ padding: 16 }}
                                >
                                    <div style={{
                                        fontSize: 32,
                                        color: isUnlocked ? 'gold' : 'var(--text-tertiary)',
                                        marginBottom: 8
                                    }}>
                                        {ach.icon}
                                    </div>
                                    <Text style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{ach.title}</Text>
                                </Card>
                            </Tooltip>
                        </Col>
                    );
                })}
            </Row>
        </div>
    );
};

export default Achievements;
