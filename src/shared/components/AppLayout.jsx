import { Layout, Avatar, Dropdown, notification } from 'antd';
import {
    UserOutlined, LogoutOutlined, TeamOutlined,
    TrophyOutlined, BellOutlined, PlusOutlined,
    HomeOutlined, SettingOutlined, UsergroupAddOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useGetProfileQuery, useLogoutMutation } from '../../store/authApi';
import { requestForToken, messaging } from '../../firebase';
import { onMessage } from 'firebase/messaging';
import axios from 'axios';
import { API_BASE } from '../../config.js';
import OnboardingModal from '../../components/OnboardingModal';
import PushNotificationBanner from '../../components/PushNotificationBanner';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import FeedbackModal from '../../components/FeedbackModal';
import { useTranslation } from 'react-i18next';

const { Content } = Layout;

// Desktop nav — 4 core items only
const DESKTOP_NAV = [
    { key: '/games',       icon: HomeOutlined,          labelKey: 'nav.games' },
    { key: '/teams',       icon: TeamOutlined,          labelKey: 'nav.teams' },
    { key: '/players',     icon: UsergroupAddOutlined,  labelKey: 'nav.players' },
    { key: '/leaderboard', icon: TrophyOutlined,        labelKey: 'nav.leaderboard' },
];

// Mobile bottom nav — 4 items + central FAB
const MOBILE_NAV = [
    { key: '/games',   icon: HomeOutlined,          labelKey: 'nav.games' },
    { key: '/teams',   icon: TeamOutlined,           labelKey: 'nav.teams' },
    null, // FAB placeholder
    { key: '/players', icon: UsergroupAddOutlined,   labelKey: 'nav.players' },
    { key: '/profile', icon: UserOutlined,           labelKey: 'nav.profile', authOnly: true },
];

const AppLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { data: user, isLoading } = useGetProfileQuery();
    const [logout] = useLogoutMutation();
    const [api, contextHolder] = notification.useNotification();
    const { t, i18n } = useTranslation();
    const [hasUnread, setHasUnread] = useState(false);
    const [feedbackVisible, setFeedbackVisible] = useState(false);

    useEffect(() => {
        const localLang = localStorage.getItem('lang');
        if (!localLang && user?.language && user.language !== i18n.language) {
            i18n.changeLanguage(user.language);
            localStorage.setItem('lang', user.language);
        }
    }, [user?.language]);

    useEffect(() => {
        if (user?.id) {
            requestForToken().then(token => {
                if (token) {
                    axios.patch(`${API_BASE}/api/users/${user.id}/fcm-token`, { token })
                        .catch(err => console.error('Failed to update FCM token', err));
                }
            });
            const unsubscribe = onMessage(messaging, (payload) => {
                if (payload) {
                    setHasUnread(true);
                    api.info({
                        message: payload.notification?.title || t('nav.newNotification'),
                        description: payload.notification?.body || '',
                        placement: 'topRight',
                    });
                }
            });
            return () => unsubscribe();
        }
    }, [user]);

    const handleLogout = async () => {
        try { await logout().unwrap(); } catch {}
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: t('nav.profile'),
            onClick: () => navigate('/profile'),
        },
        {
            key: 'notifications',
            icon: <BellOutlined />,
            label: t('nav.notifications'),
            onClick: () => { navigate('/notifications'); setHasUnread(false); },
        },
        {
            key: 'leaderboard',
            icon: <TrophyOutlined />,
            label: t('nav.leaderboard'),
            onClick: () => navigate('/leaderboard'),
        },
        { type: 'divider' },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: t('nav.logout'),
            onClick: handleLogout,
            danger: true,
        },
    ];

    const isActive = (key) => {
        if (key === '/games') return location.pathname === '/games' || location.pathname === '/';
        return location.pathname.startsWith(key);
    };

    const visibleMobileNav = MOBILE_NAV.filter(item => {
        if (!item) return true; // FAB always shown
        if (item.authOnly && !user) return false;
        return true;
    });

    return (
        <Layout style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
            {contextHolder}

            {/* ── Desktop header ── */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 28px',
                height: 60,
                background: 'rgba(6,12,24,0.94)',
                backdropFilter: 'blur(24px)',
                borderBottom: '1px solid var(--border-color)',
            }}>
                {/* Logo */}
                <div
                    onClick={() => navigate('/')}
                    style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}
                >
                    <img
                        src="/logo.png" alt="logo"
                        style={{ height: 72, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                    />
                </div>

                {/* Desktop nav */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="desktop-nav">
                    {DESKTOP_NAV.map(({ key, icon: Icon, labelKey }) => {
                        const active = isActive(key);
                        return (
                            <button
                                key={key}
                                onClick={() => navigate(key)}
                                style={{
                                    position: 'relative',
                                    background: active ? 'rgba(0,232,122,0.08)' : 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '7px 16px',
                                    borderRadius: 10,
                                    display: 'flex', alignItems: 'center', gap: 7,
                                    color: active ? 'var(--green)' : 'var(--text-tertiary)',
                                    fontFamily: 'Outfit, sans-serif',
                                    fontWeight: active ? 600 : 400,
                                    fontSize: 14,
                                    transition: 'all 0.15s ease',
                                    whiteSpace: 'nowrap',
                                }}
                                onMouseEnter={e => {
                                    if (!active) {
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!active) {
                                        e.currentTarget.style.color = 'var(--text-tertiary)';
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                <Icon style={{ fontSize: 15 }} />
                                {t(labelKey)}
                                {active && (
                                    <span style={{
                                        position: 'absolute', bottom: -1, left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: 16, height: 2,
                                        background: 'var(--green)',
                                        borderRadius: 2,
                                        boxShadow: '0 0 6px rgba(0,232,122,0.6)',
                                    }} />
                                )}
                            </button>
                        );
                    })}

                    {/* Create — special CTA button */}
                    <button
                        onClick={() => navigate('/games/create')}
                        style={{
                            marginLeft: 8,
                            display: 'flex', alignItems: 'center', gap: 7,
                            background: isActive('/games/create') ? '#00c868' : 'var(--green)',
                            border: 'none',
                            borderRadius: 10,
                            padding: '7px 16px',
                            color: '#060c18',
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: 'pointer',
                            transition: 'opacity 0.15s, transform 0.15s',
                            boxShadow: '0 0 16px rgba(0,232,122,0.2)',
                            whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                        <PlusOutlined style={{ fontSize: 13 }} />
                        {t('nav.createGame')}
                    </button>
                </nav>

                {/* Right section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <LanguageSwitcher userId={user?.id} />

                    {/* Notification bell — only if logged in */}
                    {user && (
                        <button
                            onClick={() => { navigate('/notifications'); setHasUnread(false); }}
                            style={{
                                position: 'relative',
                                width: 36, height: 36,
                                borderRadius: 10,
                                background: location.pathname === '/notifications' ? 'rgba(0,232,122,0.08)' : 'transparent',
                                border: '1px solid var(--border-color)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                color: location.pathname === '/notifications' ? 'var(--green)' : 'var(--text-tertiary)',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = location.pathname === '/notifications' ? 'var(--green)' : 'var(--text-tertiary)'; }}
                        >
                            <BellOutlined style={{ fontSize: 16 }} />
                            {hasUnread && (
                                <span style={{
                                    position: 'absolute', top: 6, right: 6,
                                    width: 7, height: 7, borderRadius: '50%',
                                    background: '#f04438',
                                    border: '1.5px solid var(--bg-base)',
                                    boxShadow: '0 0 6px rgba(240,68,56,0.8)',
                                }} />
                            )}
                        </button>
                    )}

                    {isLoading ? (
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-raised)' }} />
                    ) : user ? (
                        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                cursor: 'pointer',
                                padding: '4px 10px 4px 4px',
                                borderRadius: 40,
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-raised)',
                                transition: 'border-color 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green-border)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                            >
                                <Avatar
                                    size={32}
                                    src={user.avatar}
                                    icon={<UserOutlined />}
                                    style={{ backgroundColor: 'var(--green)', color: '#060c18', fontSize: 14, flexShrink: 0 }}
                                />
                                <span style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, fontFamily: 'Outfit,sans-serif' }} className="user-name">
                                    {user.name?.split(' ')[0] || user.email}
                                </span>
                            </div>
                        </Dropdown>
                    ) : (
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                borderRadius: 10,
                                padding: '7px 18px',
                                color: 'var(--text-secondary)',
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: 600, fontSize: 14,
                                cursor: 'pointer',
                                transition: 'border-color 0.15s, color 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green-border)'; e.currentTarget.style.color = 'var(--green)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                            {t('nav.login')}
                        </button>
                    )}
                </div>
            </header>

            {/* ── Main content ── */}
            <Content style={{ paddingBottom: 72 }} className="main-content-wrap">
                {children}
            </Content>

            {/* ── Mobile bottom nav ── */}
            <nav className="mobile-bottom-nav" style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                height: 64,
                background: 'rgba(6,12,24,0.97)',
                backdropFilter: 'blur(24px)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center',
                zIndex: 1000,
                paddingBottom: 'env(safe-area-inset-bottom)',
            }}>
                {visibleMobileNav.map((item, idx) => {
                    // FAB — create game
                    if (!item) {
                        return (
                            <div key="fab" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <button
                                    onClick={() => navigate('/games/create')}
                                    style={{
                                        width: 50, height: 50,
                                        borderRadius: '50%',
                                        background: 'var(--green)',
                                        border: '3px solid var(--bg-base)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 0 20px rgba(0,232,122,0.45), 0 4px 16px rgba(0,0,0,0.5)',
                                        transform: 'translateY(-10px)',
                                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                        flexShrink: 0,
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-12px) scale(1.06)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(0,232,122,0.6), 0 6px 20px rgba(0,0,0,0.5)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,232,122,0.45), 0 4px 16px rgba(0,0,0,0.5)'; }}
                                >
                                    <PlusOutlined style={{ fontSize: 22, color: '#060c18', fontWeight: 900 }} />
                                </button>
                            </div>
                        );
                    }

                    const active = isActive(item.key);
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.key}
                            onClick={() => navigate(item.key)}
                            style={{
                                flex: 1,
                                background: 'none', border: 'none',
                                cursor: 'pointer',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                gap: 4,
                                padding: '10px 4px',
                                color: active ? 'var(--green)' : 'var(--text-tertiary)',
                                transition: 'color 0.15s',
                                position: 'relative',
                            }}
                        >
                            {/* Icon pill background when active */}
                            <div style={{
                                width: 34, height: 28,
                                borderRadius: 8,
                                background: active ? 'rgba(0,232,122,0.1)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.15s',
                            }}>
                                <Icon style={{ fontSize: 18 }} />
                                {item.key === '/notifications' && hasUnread && (
                                    <span style={{
                                        position: 'absolute', top: 8, left: '50%',
                                        transform: 'translateX(2px)',
                                        width: 6, height: 6, borderRadius: '50%',
                                        background: '#f04438',
                                        border: '1.5px solid var(--bg-base)',
                                    }} />
                                )}
                            </div>
                            <span style={{
                                fontSize: 10,
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: active ? 600 : 400,
                                lineHeight: 1,
                                letterSpacing: '0.1px',
                            }}>
                                {t(item.labelKey)}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {user && <OnboardingModal user={user} />}
            {user && <PushNotificationBanner user={user} />}
            <FeedbackModal open={feedbackVisible} onClose={() => setFeedbackVisible(false)} />

            {/* Feedback floating button */}
            <button
                onClick={() => setFeedbackVisible(true)}
                title="Rəy bildir"
                style={{
                    position: 'fixed',
                    right: 16,
                    bottom: user ? 80 : 20,
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontSize: 18,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 900,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.color = 'var(--green)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
                💬
            </button>

            <style>{`
                @media (min-width: 768px) {
                    .user-name { display: inline !important; }
                    .mobile-bottom-nav { display: none !important; }
                    .main-content-wrap { padding-bottom: 0 !important; }
                }
                @media (max-width: 767px) {
                    .desktop-nav { display: none !important; }
                    .user-name { display: none; }
                }
            `}</style>
        </Layout>
    );
};

export default AppLayout;
