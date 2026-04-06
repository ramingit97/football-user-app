import { Layout, Avatar, Dropdown, notification } from 'antd';
import {
    HomeOutlined,
    UserOutlined,
    PlusCircleOutlined,
    LogoutOutlined,
    TeamOutlined,
    BellOutlined,
    TrophyOutlined,
    BankOutlined,
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
import { useTranslation } from 'react-i18next';

const { Content } = Layout;

const NAV = [
    { key: '/games',        icon: HomeOutlined,       labelKey: 'nav.games' },
    { key: '/games/create', icon: PlusCircleOutlined, labelKey: 'nav.createGame' },
    { key: '/players',      icon: TeamOutlined,        labelKey: 'nav.players' },
    { key: '/teams',        icon: TeamOutlined,        labelKey: 'nav.teams' },
    { key: '/leaderboard',  icon: TrophyOutlined,      labelKey: 'nav.leaderboard' },
    { key: '/stadiums',     icon: BankOutlined,        labelKey: 'nav.stadiums' },
    { key: '/notifications',icon: BellOutlined,        labelKey: 'nav.notifications' },
    { key: '/profile',      icon: UserOutlined,        labelKey: 'nav.profile' },
];

// Bottom nav items (mobile) — 5 max
const BOTTOM_NAV = [
    { key: '/games',        icon: HomeOutlined,        labelKey: 'nav.games' },
    { key: '/games/create', icon: PlusCircleOutlined,  labelKey: 'nav.createGame' },
    { key: '/leaderboard',  icon: TrophyOutlined,       labelKey: 'nav.leaderboard' },
    { key: '/notifications',icon: BellOutlined,         labelKey: 'nav.notifications' },
    { key: '/profile',      icon: UserOutlined,         labelKey: 'nav.profile' },
];

const AppLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { data: user, isLoading } = useGetProfileQuery();
    const [logout] = useLogoutMutation();
    const [api, contextHolder] = notification.useNotification();
    const { t, i18n } = useTranslation();

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
        { type: 'divider' },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: t('nav.logout'),
            onClick: handleLogout,
            danger: true,
        },
    ];

    const active = (key) => {
        if (key === '/games') return location.pathname === '/games' || location.pathname === '/';
        return location.pathname.startsWith(key);
    };

    return (
        <Layout style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
            {contextHolder}

            {/* ── Top navbar ── */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 24px',
                background: 'rgba(6, 12, 24, 0.92)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--border-color)',
            }}>
                {/* Logo */}
                <div
                    onClick={() => navigate('/')}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', marginLeft: 16 }}
                >
                    <img
                        src="/logo.png"
                        alt="logo"
                        style={{
                            height: 82,
                            width: 'auto',
                            objectFit: 'contain',
                            filter: 'brightness(0) invert(1)',
                        }}
                    />
                   
                </div>

                {/* Desktop nav */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
                    {NAV.filter(({ key }) => {
                        if (!user && (key === '/notifications' || key === '/profile')) return false;
                        return true;
                    }).map(({ key, icon: Icon, labelKey }) => {
                        const isActive = active(key);
                        return (
                            <button
                                key={key}
                                onClick={() => navigate(key)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '6px 14px',
                                    borderRadius: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    color: isActive ? 'var(--green)' : 'var(--text-tertiary)',
                                    fontFamily: 'Outfit, sans-serif',
                                    fontWeight: isActive ? 600 : 400,
                                    fontSize: 16,
                                    transition: 'all 0.15s ease',
                                    position: 'relative',
                                }}
                                onMouseEnter={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                        e.currentTarget.style.background = 'var(--bg-raised)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.color = 'var(--text-tertiary)';
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                <Icon style={{ fontSize: 16 }} />
                                {t(labelKey)}
                            </button>
                        );
                    })}
                </nav>

                {/* Right section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <LanguageSwitcher userId={user?.id} />

                    {isLoading ? (
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-raised)' }} />
                    ) : user ? (
                        <Dropdown
                            menu={{ items: userMenuItems }}
                            placement="bottomRight"
                            trigger={['click']}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                cursor: 'pointer',
                                padding: '4px 8px 4px 4px',
                                borderRadius: 40,
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-raised)',
                                transition: 'border-color 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green-border)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                            >
                                <Avatar
                                    size={34}
                                    src={user.avatar}
                                    icon={<UserOutlined />}
                                    style={{ backgroundColor: 'var(--green)', color: '#060c18', fontSize: 15 }}
                                />
                                <span style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 500 }} className="user-name">
                                    {user.name || user.email}
                                </span>
                            </div>
                        </Dropdown>
                    ) : (
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                background: 'var(--green)',
                                border: 'none',
                                borderRadius: 8,
                                padding: '7px 16px',
                                color: '#060c18',
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: 700,
                                fontSize: 14,
                                cursor: 'pointer',
                            }}
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
            <nav style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: 64,
                background: 'rgba(6, 12, 24, 0.97)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                zIndex: 1000,
                padding: '0 4px',
            }} className="mobile-bottom-nav">
                {BOTTOM_NAV.filter(({ key }) => {
                    if (!user && (key === '/notifications' || key === '/profile')) return false;
                    return true;
                }).map(({ key, icon: Icon, labelKey }) => {
                    const isActive = active(key);
                    return (
                        <button
                            key={key}
                            onClick={() => navigate(key)}
                            style={{
                                flex: 1,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 3,
                                padding: '8px 4px',
                                borderRadius: 10,
                                color: isActive ? 'var(--green)' : 'var(--text-tertiary)',
                                transition: 'color 0.15s',
                                position: 'relative',
                            }}
                        >
                            {isActive && (
                                <span style={{
                                    position: 'absolute',
                                    top: 4,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: 20,
                                    height: 2,
                                    background: 'var(--green)',
                                    borderRadius: 2,
                                }} />
                            )}
                            <Icon style={{ fontSize: 20 }} />
                            <span style={{
                                fontSize: 10,
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: isActive ? 600 : 400,
                                lineHeight: 1,
                            }}>
                                {t(labelKey)}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {user && <OnboardingModal user={user} />}
            {user && <PushNotificationBanner user={user} />}

            <style>{`
                @media (min-width: 768px) {
                    .logo-text { display: inline !important; }
                    .user-name { display: inline !important; }
                    .mobile-bottom-nav { display: none !important; }
                    .main-content-wrap { padding-bottom: 0 !important; }
                }

                @media (max-width: 767px) {
                    .desktop-nav { display: none !important; }
                    .logo-text { display: none; }
                    .user-name { display: none; }
                }
            `}</style>
        </Layout>
    );
};

export default AppLayout;
