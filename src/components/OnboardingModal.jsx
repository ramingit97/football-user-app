import React, { useState, useEffect } from 'react';
import { Modal, Button, Typography, Steps, Space, Avatar } from 'antd';
import {
    RocketOutlined,
    TrophyOutlined,
    TeamOutlined,
    StarOutlined,
    ThunderboltOutlined,
    CheckCircleOutlined,
    UserOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Text, Paragraph } = Typography;

const OnboardingModal = ({ user, onComplete }) => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    const SLIDES = [
        {
            icon: <RocketOutlined style={{ fontSize: 64, color: '#722ed1' }} />,
            title: t('auth.onboarding.modal.welcome'),
            description: t('auth.onboarding.modal.description'),
            color: '#722ed1',
            background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)'
        },
        {
            icon: <TeamOutlined style={{ fontSize: 64, color: '#1890ff' }} />,
            title: t('auth.onboarding.modal.feature1Title'),
            description: t('auth.onboarding.modal.feature1Desc'),
            color: '#1890ff',
            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)'
        },
        {
            icon: <StarOutlined style={{ fontSize: 64, color: '#faad14' }} />,
            title: t('auth.onboarding.modal.feature2Title'),
            description: t('auth.onboarding.modal.feature2Desc'),
            color: '#faad14',
            background: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)'
        },
        {
            icon: <ThunderboltOutlined style={{ fontSize: 64, color: '#52c41a' }} />,
            title: t('auth.onboarding.modal.feature3Title'),
            description: t('auth.onboarding.modal.feature3Desc'),
            color: '#52c41a',
            background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)'
        },
        {
            icon: <TrophyOutlined style={{ fontSize: 64, color: '#eb2f96' }} />,
            title: t('auth.onboarding.modal.feature4Title'),
            description: t('auth.onboarding.modal.feature4Desc'),
            color: '#eb2f96',
            background: 'linear-gradient(135deg, #eb2f96 0%, #c41d7f 100%)'
        }
    ];

    useEffect(() => {
        // Check if user has seen onboarding
        if (user?.id) {
            const hasSeenOnboarding = localStorage.getItem(`onboarding_${user.id}`);
            if (!hasSeenOnboarding) {
                setVisible(true);
            }
        }
    }, [user?.id]);

    const handleNext = () => {
        if (currentSlide < SLIDES.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            handleFinish();
        }
    };

    const handlePrev = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const handleFinish = () => {
        localStorage.setItem(`onboarding_${user.id}`, 'true');
        setVisible(false);
        if (onComplete) onComplete();
    };

    const handleSkip = () => {
        handleFinish();
    };

    const slide = SLIDES[currentSlide];
    const isLastSlide = currentSlide === SLIDES.length - 1;

    return (
        <Modal
            open={visible}
            footer={null}
            closable={false}
            centered
            width={440}
            styles={{
                body: { padding: 0 },
                content: { borderRadius: 16, overflow: 'hidden' }
            }}
        >
            {/* Slide Content */}
            <div style={{
                background: slide.background,
                color: 'white',
                padding: '48px 32px',
                textAlign: 'center',
                minHeight: 280
            }}>
                <div style={{ marginBottom: 24 }}>
                    {slide.icon}
                </div>
                <Title level={2} style={{ color: 'white', marginBottom: 16 }}>
                    {slide.title}
                </Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, margin: 0 }}>
                    {slide.description}
                </Paragraph>
            </div>

            {/* Navigation */}
            <div style={{ padding: '24px 32px', background: '#fff' }}>
                {/* Progress Dots */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 24
                }}>
                    {SLIDES.map((_, index) => (
                        <div
                            key={index}
                            style={{
                                width: index === currentSlide ? 24 : 8,
                                height: 8,
                                borderRadius: 4,
                                background: index === currentSlide ? slide.color : '#e0e0e0',
                                transition: 'all 0.3s ease'
                            }}
                        />
                    ))}
                </div>

                {/* Buttons */}
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    {currentSlide > 0 ? (
                        <Button
                            onClick={handlePrev}
                            style={{
                                background: '#fff',
                                color: '#333',
                                borderColor: '#d9d9d9',
                            }}
                        >
                            {t('auth.onboarding.modal.back')}
                        </Button>
                    ) : (
                        <Button type="text" onClick={handleSkip} style={{ color: '#888' }}>
                            {t('auth.onboarding.modal.skip')}
                        </Button>
                    )}

                    <Button
                        type="primary"
                        size="large"
                        onClick={handleNext}
                        icon={isLastSlide ? <CheckCircleOutlined /> : null}
                        style={{
                            background: slide.background,
                            border: 'none',
                            minWidth: 140
                        }}
                    >
                        {isLastSlide ? t('auth.onboarding.modal.start') : t('auth.onboarding.modal.next')}
                    </Button>
                </Space>
            </div>
        </Modal>
    );
};

export default OnboardingModal;
