import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CustomerServiceOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import SupportChat from '../../modules/profile/components/SupportChat';
import { useGetMyTicketsQuery, useMarkTicketsSeenMutation } from '../../store/supportApi';

const HIDDEN_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

export default function SupportWidget() {
    const { pathname } = useLocation();
    const user = useSelector(s => s.auth.user);
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    const { data: tickets = [] } = useGetMyTicketsQuery(user?.id, {
        skip: !user?.id,
        pollingInterval: 30000,
    });
    const [markSeen] = useMarkTicketsSeenMutation();

    const unread = tickets.filter(tk => tk.status === 'replied' && !tk.seenByUser).length;

    const handleToggle = () => {
        setOpen(p => {
            const next = !p;
            if (next && unread > 0 && user?.id) markSeen(user.id);
            return next;
        });
    };

    if (HIDDEN_PATHS.includes(pathname)) return null;

    return (
        <>
            {/* Chat popup */}
            {open && (
                <div className="support-popup" style={{
                    position: 'fixed',
                    right: 20,
                    width: 360,
                    maxWidth: 'calc(100vw - 32px)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 8px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
                    background: 'var(--bg-card)',
                    zIndex: 9999,
                    animation: 'supportFadeUp 0.2s ease both',
                }}>
                    <SupportChat user={user} />
                </div>
            )}

            {/* FAB button */}
            <button
                onClick={handleToggle}
                title={t('support.title')}
                className="support-fab"
                style={{
                    position: 'fixed',
                    borderRadius: 12,
                    border: open
                        ? '1px solid rgba(0,232,122,0.3)'
                        : '1px solid rgba(255,255,255,0.08)',
                    background: open
                        ? 'rgba(0,232,122,0.08)'
                        : 'var(--header-bg)',
                    backdropFilter: 'blur(16px)',
                    color: open ? 'var(--green, #00e87a)' : 'var(--green, #00e87a)',
                    fontSize: 18,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                    transition: 'all 0.2s ease',
                    zIndex: 9999,
                }}
                onMouseEnter={e => {
                    if (!open) e.currentTarget.style.borderColor = 'rgba(0,232,122,0.3)';
                }}
                onMouseLeave={e => {
                    if (!open) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                }}
            >
                {open ? <CloseOutlined /> : <CustomerServiceOutlined />}

                {/* Unread badge */}
                {!open && unread > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: -4, right: -4,
                        minWidth: 18, height: 18,
                        borderRadius: 9,
                        background: '#f04438',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid var(--bg-base)',
                        padding: '0 3px',
                    }}>
                        {unread > 9 ? '9+' : unread}
                    </div>
                )}
            </button>

            <style>{`
                @keyframes supportFadeUp {
                    from { opacity: 0; transform: translateY(12px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)    scale(1); }
                }

                /* Desktop: bottom-right corner */
                .support-fab {
                    bottom: 20px;
                    right: 20px;
                    width: 52px;
                    height: 52px;
                }
                .support-popup {
                    bottom: 84px;
                }

                /* Mobile: above the bottom nav bar */
                @media (max-width: 767px) {
                    .support-fab {
                        bottom: 76px;
                        right: 16px;
                        width: 48px;
                        height: 48px;
                    }
                    .support-popup {
                        bottom: 136px;
                    }
                }
            `}</style>
        </>
    );
}
