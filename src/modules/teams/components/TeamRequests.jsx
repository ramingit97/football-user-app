import { List, Button, Avatar, message, Tag, Card } from 'antd';
import { UserOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useGetTeamRequestsQuery, useRespondToRequestMutation } from '../../../store/teamsApi';
import { useTranslation } from 'react-i18next';

const TeamRequests = ({ teamId }) => {
    const { t } = useTranslation();
    const { data: requests, isLoading, refetch } = useGetTeamRequestsQuery(teamId);
    const [respondToRequest, { isLoading: isResponding }] = useRespondToRequestMutation();

    const handleRespond = async (requestId, status) => {
        try {
            await respondToRequest({ requestId, status }).unwrap();
            message.success(status === 'approved' ? t('teams.requests.acceptSuccess') : t('teams.requests.rejectSuccess'));
            refetch();
        } catch (error) {
            message.error(t('teams.requests.error'));
        }
    };

    if (isLoading) return null;
    if (!requests || requests.length === 0) return null;

    return (
        <Card
            className="glass-card"
            title={t('teams.requests.title')}
            style={{ marginTop: 24, background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}
        >
            <List
                itemLayout="horizontal"
                dataSource={requests}
                renderItem={(request) => (
                    <List.Item
                        actions={[
                            <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                loading={isResponding}
                                onClick={() => handleRespond(request.id, 'approved')}
                            >
                                {t('teams.requests.accept')}
                            </Button>,
                            <Button
                                danger
                                icon={<CloseOutlined />}
                                loading={isResponding}
                                onClick={() => handleRespond(request.id, 'rejected')}
                            >
                                {t('teams.requests.reject')}
                            </Button>
                        ]}
                    >
                        <List.Item.Meta
                            avatar={<Avatar icon={<UserOutlined />} />}
                            title={`${t('teams.requests.userId')} ${request.userId}`}
                            description={`${t('teams.requests.requestDate')} ${new Date(request.createdAt).toLocaleDateString()}`}
                        />
                    </List.Item>
                )}
            />
        </Card>
    );
};

export default TeamRequests;
