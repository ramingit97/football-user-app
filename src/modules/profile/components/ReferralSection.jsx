import { Card, Typography, Button, Statistic, Row, Col, Divider, message, Spin } from 'antd';
import {
    CopyOutlined,
    ShareAltOutlined,
    GiftOutlined,
    TeamOutlined,
    WalletOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useGetReferralInfoQuery } from '../../../store/authApi';

const { Title, Text, Paragraph } = Typography;

const ReferralSection = ({ currentUser }) => {
    const { t } = useTranslation();
    const { data: referralInfo, isLoading } = useGetReferralInfoQuery(currentUser?.id, {
        skip: !currentUser?.id,
    });

    if (!currentUser) return null;

    const referralCode = referralInfo?.referralCode || currentUser?.id;
    const referralLink = `${window.location.origin}/?ref=${referralCode}`;
    const invitedCount = referralInfo?.invitedCount || 0;
    const earnedAzn = referralInfo?.earnedAzn || 0;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink).then(() => {
            message.success(t('profile.referral.copied'));
        }).catch(() => {
            message.error('Copy failed');
        });
    };

    const handleShareWhatsApp = () => {
        const text = `${t('profile.referral.description')}\n\n${referralLink}`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const STEPS = [
        { icon: <ShareAltOutlined style={{ color: '#1890ff', fontSize: 18 }} />, text: t('profile.referral.step1') },
        { icon: <GiftOutlined style={{ color: '#52c41a', fontSize: 18 }} />, text: t('profile.referral.step2') },
        { icon: <WalletOutlined style={{ color: '#faad14', fontSize: 18 }} />, text: t('profile.referral.step3') },
    ];

    return (
        <Card
            className="glass-card"
            style={{ marginBottom: 16 }}
            title={
                <span style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GiftOutlined style={{ color: '#faad14' }} />
                    {t('profile.referral.title')}
                </span>
            }
        >
            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                    <Spin />
                </div>
            ) : (
                <>
                    {/* Description */}
                    <Paragraph style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
                        {t('profile.referral.description')}
                    </Paragraph>

                    {/* Referral Link */}
                    <div style={{ marginBottom: 16 }}>
                        <Text style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block', marginBottom: 6 }}>
                            {t('profile.referral.yourLink')}
                        </Text>
                        <div style={{
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            padding: '8px 12px',
                        }}>
                            <Text
                                style={{
                                    color: 'var(--text-primary)',
                                    fontSize: 12,
                                    flex: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontFamily: 'monospace',
                                }}
                            >
                                {referralLink}
                            </Text>
                            <Button
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={handleCopy}
                                type="primary"
                                ghost
                            >
                                {t('profile.referral.copy')}
                            </Button>
                        </div>
                    </div>

                    {/* Share button */}
                    <Button
                        block
                        icon={<ShareAltOutlined />}
                        onClick={handleShareWhatsApp}
                        style={{
                            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                            border: 'none',
                            color: 'white',
                            fontWeight: 600,
                            marginBottom: 16,
                        }}
                    >
                        {t('profile.referral.share')}
                    </Button>

                    <Divider style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '12px 0' }} />

                    {/* Stats */}
                    <Text style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block', marginBottom: 10 }}>
                        {t('profile.referral.stats')}
                    </Text>
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                        <Col span={12}>
                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: 8,
                                padding: '12px',
                                textAlign: 'center',
                            }}>
                                <TeamOutlined style={{ fontSize: 20, color: '#1890ff', marginBottom: 4, display: 'block' }} />
                                <div style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 700 }}>
                                    {invitedCount}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                                    {t('profile.referral.invited')}
                                </div>
                            </div>
                        </Col>
                        <Col span={12}>
                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: 8,
                                padding: '12px',
                                textAlign: 'center',
                            }}>
                                <WalletOutlined style={{ fontSize: 20, color: '#52c41a', marginBottom: 4, display: 'block' }} />
                                <div style={{ color: '#52c41a', fontSize: 22, fontWeight: 700 }}>
                                    {earnedAzn.toFixed(2)}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                                    {t('profile.referral.earned')}
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Divider style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '12px 0' }} />

                    {/* How it works */}
                    <Text style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block', marginBottom: 10 }}>
                        {t('profile.referral.howItWorks')}
                    </Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {STEPS.map((step, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    {step.icon}
                                </div>
                                <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                    {step.text}
                                </Text>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </Card>
    );
};

export default ReferralSection;
