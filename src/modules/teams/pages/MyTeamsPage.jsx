import { useState } from 'react';
import { Card, Button, Row, Col, Typography, Modal, Form, Input, List, Avatar, Empty, Spin } from 'antd';
import { PlusOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useGetMyTeamsQuery, useCreateTeamMutation } from '../../../store/teamsApi';
import { useGetProfileQuery } from '../../../store/authApi';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const MyTeamsPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { data: profile } = useGetProfileQuery();
    const { data: teams, isLoading } = useGetMyTeamsQuery(profile?.id, { skip: !profile?.id });
    const [createTeam, { isLoading: isCreating }] = useCreateTeamMutation();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    const handleCreate = async (values) => {
        try {
            await createTeam({ ...values, captainId: profile.id }).unwrap();
            setIsModalVisible(false);
            form.resetFields();
        } catch (error) {
            console.error('Failed to create team:', error);
        }
    };

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">{t('teams.myTeams.title')}</h1>
                    <p className="page-subtitle">{t('teams.myTeams.subtitle')}</p>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={() => setIsModalVisible(true)}
                >
                    {t('teams.myTeams.createBtn')}
                </Button>
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 50 }}>
                    <Spin size="large" />
                </div>
            ) : teams?.length > 0 ? (
                <Row gutter={[24, 24]}>
                    {teams.map(team => (
                        <Col xs={24} sm={12} md={8} key={team.id}>
                            <Card
                                className="glass-card"
                                hoverable
                                onClick={() => navigate(`/teams/${team.id}`)}
                            >
                                <Card.Meta
                                    avatar={<Avatar size={64} icon={<TeamOutlined />} src={team.logo} style={{ backgroundColor: 'var(--primary-color)' }} />}
                                    title={<span style={{ fontSize: 18, color: 'var(--text-primary)' }}>{team.name}</span>}
                                    description={
                                        <div style={{ marginTop: 8 }}>
                                            <div style={{ display: 'flex', gap: 16, color: 'var(--text-secondary)' }}>
                                                <span><UserOutlined /> {team.playerIds?.length || 1} {t('teams.myTeams.playerCount')}</span>
                                            </div>
                                            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                <span style={{ color: '#52c41a' }}>W: {team.wins}</span>
                                                <span style={{ color: '#ff4d4f' }}>L: {team.losses}</span>
                                                <span style={{ color: '#faad14' }}>D: {team.draws}</span>
                                            </div>
                                        </div>
                                    }
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={<span style={{ color: 'var(--text-secondary)' }}>{t('teams.myTeams.noTeams')}</span>}
                >
                    <Button type="primary" onClick={() => setIsModalVisible(true)}>
                        {t('teams.myTeams.createFirst')}
                    </Button>
                </Empty>
            )}

            <Modal
                title={t('teams.myTeams.createTitle')}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                destroyOnClose
            >
                <Form form={form} onFinish={handleCreate} layout="vertical">
                    <Form.Item
                        name="name"
                        label={t('teams.myTeams.nameLabel')}
                        rules={[{ required: true, message: t('teams.myTeams.namePlaceholder') }]}
                    >
                        <Input placeholder={t('teams.myTeams.namePlaceholder')} />
                    </Form.Item>

                    <Form.Item
                        name="logo"
                        label={t('teams.myTeams.logoLabel')}
                    >
                        <Input placeholder="https://example.com/logo.png" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={isCreating} block>
                            {t('teams.myTeams.createSubmit')}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default MyTeamsPage;
