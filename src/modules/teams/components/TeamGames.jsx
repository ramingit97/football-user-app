import React, { useState } from 'react';
import { Table, Tag, Card, Select, Typography, Space, Button, Avatar } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useGetGamesByTeamQuery } from '../../../store/gamesApi';
import { TrophyOutlined, CloseCircleOutlined, MinusCircleOutlined, ClockCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;
const { Option } = Select;

const TeamGames = ({ teamId }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { data: games, isLoading } = useGetGamesByTeamQuery(teamId);
    const [filter, setFilter] = useState('all');

    const getGameResult = (game) => {
        if (game.status !== 'finished') return 'pending';

        const scoreA = Number(game.scoreTeamA);
        const scoreB = Number(game.scoreTeamB);

        if (scoreA === scoreB) return 'draw';

        const isTeamA = game.teamAId === teamId;

        if (isTeamA) {
            return scoreA > scoreB ? 'win' : 'loss';
        } else {
            return scoreB > scoreA ? 'win' : 'loss';
        }
    };

    const filteredGames = games?.filter(game => {
        if (filter === 'all') return true;
        return getGameResult(game) === filter;
    });

    const columns = [
        {
            title: t('teams.games.colDate'),
            dataIndex: 'date',
            key: 'date',
            render: (date, record) => (
                <div>
                    <div>{dayjs(date).format('DD.MM.YYYY')}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.time}</Text>
                </div>
            )
        },
        {
            title: t('teams.games.colOpponent'),
            key: 'opponent',
            render: (_, record) => {
                const isTeamA = record.teamAId === teamId;
                const opponentName = isTeamA ? record.teamBName : record.teamAName;
                // We'd ideally have opponentId to link to their page, maybe we can assume teamBId if isTeamA
                const opponentId = isTeamA ? record.teamBId : record.teamAId;

                return (
                    <Space>
                        {/* Placeholder for opponent logo if we had it */}
                        <Avatar style={{ backgroundColor: isTeamA ? record.teamBColor : record.teamAColor }}>
                            {opponentName?.charAt(0)}
                        </Avatar>

                        <span
                            style={{ cursor: opponentId ? 'pointer' : 'default' }}
                            onClick={(e) => {
                                if (opponentId) {
                                    e.stopPropagation();
                                    navigate(`/teams/${opponentId}`);
                                }
                            }}
                        >
                            {opponentName || 'Unknown Opponent'}
                        </span>
                    </Space>
                );
            }
        },
        {
            title: t('teams.games.colScore'),
            key: 'score',
            align: 'center',
            render: (_, record) => {
                if (record.status !== 'finished') return <Tag>-- : --</Tag>;

                const isTeamA = record.teamAId === teamId;
                const myScore = isTeamA ? record.scoreTeamA : record.scoreTeamB;
                const oppScore = isTeamA ? record.scoreTeamB : record.scoreTeamA;

                const result = getGameResult(record);
                const color = result === 'win' ? '#52c41a' : result === 'loss' ? '#ff4d4f' : '#faad14';

                return (
                    <span style={{ fontWeight: 'bold', fontSize: 16, color }}>
                        {myScore} : {oppScore}
                    </span>
                );
            }
        },
        {
            title: t('teams.games.colResult'),
            key: 'result',
            align: 'center',
            render: (_, record) => {
                const status = record.status;
                if (status !== 'finished') {
                    if (status === 'cancelled') return <Tag color="default">{t('teams.games.cancelled')}</Tag>;
                    return <Tag color="blue" icon={<ClockCircleOutlined />}>{t('teams.games.upcoming')}</Tag>;
                }

                const result = getGameResult(record);
                const map = {
                    win: { color: 'green', text: t('teams.games.win'), icon: <TrophyOutlined /> },
                    loss: { color: 'red', text: t('teams.games.loss'), icon: <CloseCircleOutlined /> },
                    draw: { color: 'orange', text: t('teams.games.draw'), icon: <MinusCircleOutlined /> }
                };

                const info = map[result];
                return <Tag color={info.color} icon={info.icon}>{info.text}</Tag>;
            }
        },
        {
            title: '',
            key: 'action',
            render: (_, record) => (
                <Button
                    icon={<EyeOutlined />}
                    size="small"
                    onClick={() => navigate(`/games/${record.id}`)}
                />
            )
        }
    ];

    return (
        <Card className="glass-card" title={t('teams.games.title')}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Select
                    defaultValue="all"
                    style={{ width: 150 }}
                    onChange={setFilter}
                >
                    <Option value="all">{t('teams.games.filterAll')}</Option>
                    <Option value="win">{t('teams.games.filterWin')}</Option>
                    <Option value="draw">{t('teams.games.filterDraw')}</Option>
                    <Option value="loss">{t('teams.games.filterLoss')}</Option>
                    <Option value="pending">{t('teams.games.filterPending')}</Option>
                </Select>
            </div>

            <Table
                dataSource={filteredGames}
                columns={columns}
                rowKey="id"
                loading={isLoading}
                pagination={{ pageSize: 5 }}
            />
        </Card>
    );
};

export default TeamGames;
