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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}

                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="bg-transparent text-center p-8 rounded-2xl max-w-md w-full mx-4 relative"
                    >
                        {/* Glowing Effect Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 blur-xl rounded-full" />

                        <motion.div
                            animate={{
                                y: [0, -20, 0],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                            className="relative z-10 mb-6"
                        >
                            <TrophyOutlined style={{ fontSize: 80, color: '#f59e0b', filter: 'drop-shadow(0 0 15px gold)' }} />
                        </motion.div>

                        <Title level={2} style={{ color: 'white', marginBottom: 8, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                            MAN OF THE MATCH
                        </Title>

                        <div className="relative inline-block mb-6">
                            <Avatar
                                size={120}
                                src={mvpPlayer.avatar}
                                style={{
                                    border: '4px solid gold',
                                    boxShadow: '0 0 30px rgba(255, 215, 0, 0.6)'
                                }}
                            />
                            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black font-bold px-4 py-1 rounded-full text-lg shadow-lg">
                                MVP
                            </div>
                        </div>

                        <Title level={3} style={{ color: '#fbbf24', margin: 0 }}>
                            {mvpPlayer.name}
                        </Title>
                        <Text className="text-gray-300 text-lg block mt-2">
                            {t('game.mvpReveal.legendary')}
                        </Text>

                        <button
                            onClick={onClose}
                            className="mt-8 bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-2 rounded-full transition-all"
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
