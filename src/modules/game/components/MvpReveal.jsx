import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { Modal, Typography, Avatar } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { TrophyOutlined } from '@ant-design/icons';
import { useWindowSize } from 'react-use'; // Optional, but usually good for confetti
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const MvpReveal = ({ visible, mvpPlayer, onClose }) => {
    const { t } = useTranslation();
    const [showConfetti, setShowConfetti] = useState(false);
    // Since we don't have react-use efficiently, we can omit providing width/height for defaults (full screen)

    useEffect(() => {
        if (visible) {
            setShowConfetti(true);
            // Stop confetti after 5 seconds
            const timer = setTimeout(() => setShowConfetti(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible || !mvpPlayer) return null;

    return (
        <AnimatePresence>
            {visible && (
                <div style={{
                        position: 'fixed', inset: 0, zIndex: 1050,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
                        padding: '16px',
                    }}>
                    {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}

                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        style={{
                            background: 'transparent', textAlign: 'center',
                            padding: '32px 24px', borderRadius: 24,
                            maxWidth: 400, width: '100%', position: 'relative',
                            boxSizing: 'border-box',
                        }}
                    >
                        {/* Glowing background */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.2) 0%, rgba(249,115,22,0.1) 60%, transparent 100%)',
                            filter: 'blur(20px)', borderRadius: '50%',
                            pointerEvents: 'none',
                        }} />

                        <motion.div
                            animate={{ y: [0, -16, 0], rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                            style={{ position: 'relative', zIndex: 1, marginBottom: 20 }}
                        >
                            <TrophyOutlined style={{ fontSize: 72, color: '#f59e0b', filter: 'drop-shadow(0 0 15px gold)' }} />
                        </motion.div>

                        <Title level={2} style={{ color: 'white', marginBottom: 8, textShadow: '0 2px 10px rgba(0,0,0,0.5)', fontSize: 'clamp(18px, 5vw, 24px)' }}>
                            MAN OF THE MATCH
                        </Title>

                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 32, paddingBottom: 16 }}>
                            <Avatar
                                size={110}
                                src={mvpPlayer.avatar}
                                style={{ border: '4px solid gold', boxShadow: '0 0 30px rgba(255,215,0,0.6)' }}
                            >
                                {!mvpPlayer.avatar && (mvpPlayer.name?.[0] || '?').toUpperCase()}
                            </Avatar>
                            <div style={{
                                position: 'absolute', bottom: 0, left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#f59e0b', color: '#000',
                                fontWeight: 800, padding: '3px 16px',
                                borderRadius: 20, fontSize: 14,
                                whiteSpace: 'nowrap',
                                boxShadow: '0 2px 10px rgba(245,158,11,0.5)',
                            }}>
                                MVP
                            </div>
                        </div>

                        <Title level={3} style={{ color: '#fbbf24', margin: '0 0 8px', fontSize: 'clamp(16px, 5vw, 22px)' }}>
                            {mvpPlayer.name}
                        </Title>
                        <Text style={{ color: '#d1d5db', fontSize: 16, display: 'block', marginBottom: 28 }}>
                            {t('game.mvpReveal.legendary')}
                        </Text>

                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.1)', color: '#fff',
                                border: '1px solid rgba(255,255,255,0.3)',
                                padding: '8px 28px', borderRadius: 24,
                                fontSize: 14, cursor: 'pointer',
                                fontFamily: 'Outfit, sans-serif', fontWeight: 600,
                            }}
                        >
                            {t('game.mvpReveal.close')}
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MvpReveal;
