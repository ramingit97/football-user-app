import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Spin, Upload, Form, Input, List, Empty, Modal, InputNumber, message, Avatar, Tag, Button, Progress
} from 'antd';
import {
    UserOutlined, TrophyOutlined, HistoryOutlined, TeamOutlined,
    WalletOutlined, PlusCircleOutlined, CameraOutlined, UserAddOutlined,
    StarFilled, ThunderboltFilled, GiftOutlined, RightOutlined, BankOutlined,
    CustomerServiceOutlined, CalendarOutlined, DeleteOutlined, EyeOutlined, LockOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ProfileForm from '../components/ProfileForm';
import FriendsList from '../components/FriendsList';
import Achievements from '../components/Achievements';
import GameHistory from '../components/GameHistory';
import TeamInvitations from '../components/TeamInvitations';
import MyStadiums from '../components/MyStadiums';
import SupportChat from '../components/SupportChat';
import TransferModal from '../../../components/TransferModal';
import FifaPlayerCard from '../../../components/FifaPlayerCard';
import ReferralSection from '../components/ReferralSection';
import { useGetProfileQuery, useUpdateProfileMutation } from '../../../store/authApi';
import { useGetGamesByUserQuery } from '../../../store/gamesApi';
import { useGetMyTeamsQuery, useCreateTeamMutation } from '../../../store/teamsApi';
import axios from 'axios';
import { API_BASE } from '../../../config.js';

// ── Position config ──────────────────────────────────
const POS_CFG = {
    goalkeeper: { color: '#f59e0b', glow: 'rgba(245,158,11,0.3)',  grad: 'rgba(245,158,11,0.12)' },
    defender:   { color: '#4f86f7', glow: 'rgba(79,134,247,0.3)',  grad: 'rgba(79,134,247,0.12)' },
    midfielder: { color: '#a855f7', glow: 'rgba(168,85,247,0.3)',  grad: 'rgba(168,85,247,0.12)' },
    forward:    { color: '#ef4444', glow: 'rgba(239,68,56,0.3)',   grad: 'rgba(239,68,56,0.12)'  },
};
const getPOS = (pos) => POS_CFG[pos] || { color: '#00e87a', glow: 'rgba(0,232,122,0.3)', grad: 'rgba(0,232,122,0.1)' };

const calculateProfileCompletion = (user) => {
    if (!user) return 0;
    const fields = ['name', 'position', 'skillLevel', 'preferredFoot', 'height', 'weight', 'avatar'];
    return Math.round((fields.filter(f => user[f]).length / fields.length) * 100);
};

// ── Tab button ───────────────────────────────────────
const TabBtn = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className="profile-tab-btn" style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '10px 16px',
        color: active ? 'var(--green)' : 'var(--text-tertiary)',
        fontFamily: 'Outfit, sans-serif',
        fontWeight: active ? 600 : 400,
        fontSize: 14,
        borderBottom: active ? '2px solid var(--green)' : '2px solid transparent',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
    }}>
        {icon}
        <span>{label}</span>
    </button>
);

// ── Stat item ────────────────────────────────────────
const StatItem = ({ value, label, color = 'var(--text-primary)' }) => (
    <div style={{ textAlign: 'center', padding: '0 8px' }}>
        <div style={{ fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight: 800, fontSize: 22, color, lineHeight: 1 }}>
            {value}
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 11, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {label}
        </div>
    </div>
);

// ── Change Password Section ──────────────────────────
const ChangePasswordSection = ({ hasPassword }) => {
    const { t, i18n } = useTranslation();
    const isAz = i18n.language === 'az';
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    if (!hasPassword) {
        return (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 32, maxWidth: 480, textAlign: 'center' }}>
                <LockOutlined style={{ fontSize: 40, color: 'var(--text-tertiary)', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                    {isAz
                        ? 'Google hesabı ilə daxil olduğunuz üçün şifrə dəyişdirilməsi mümkün deyil.'
                        : 'Вы вошли через Google, поэтому смена пароля недоступна.'}
                </p>
            </div>
        );
    }

    const handleSubmit = async ({ oldPassword, newPassword }) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(
                `${API_BASE}/api/auth/change-password`,
                { oldPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            message.success(isAz ? 'Şifrə uğurla dəyişdirildi' : 'Пароль успешно изменён');
            form.resetFields();
        } catch (err) {
            const msg = err?.response?.data?.message;
            message.error(
                msg === 'Неверный текущий пароль'
                    ? (isAz ? 'Cari şifrə yanlışdır' : msg)
                    : (isAz ? 'Xəta baş verdi' : 'Ошибка. Проверьте текущий пароль.')
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, maxWidth: 480 }}>
            <h3 style={{ margin: '0 0 20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <LockOutlined style={{ color: 'var(--green)' }} />
                {isAz ? 'Şifrəni dəyiş' : 'Смена пароля'}
            </h3>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                    label={<span style={{ color: 'var(--text-secondary)' }}>{isAz ? 'Cari şifrə' : 'Текущий пароль'}</span>}
                    name="oldPassword"
                    rules={[{ required: true, message: isAz ? 'Cari şifrəni daxil edin' : 'Введите текущий пароль' }]}
                >
                    <Input.Password size="large" style={{ borderRadius: 10 }} />
                </Form.Item>
                <Form.Item
                    label={<span style={{ color: 'var(--text-secondary)' }}>{isAz ? 'Yeni şifrə' : 'Новый пароль'}</span>}
                    name="newPassword"
                    rules={[
                        { required: true, message: isAz ? 'Yeni şifrəni daxil edin' : 'Введите новый пароль' },
                        { min: 6, message: isAz ? 'Minimum 6 simvol' : 'Минимум 6 символов' },
                    ]}
                >
                    <Input.Password size="large" style={{ borderRadius: 10 }} />
                </Form.Item>
                <Form.Item
                    label={<span style={{ color: 'var(--text-secondary)' }}>{isAz ? 'Yeni şifrəni təsdiqləyin' : 'Подтвердите новый пароль'}</span>}
                    name="confirmPassword"
                    dependencies={['newPassword']}
                    rules={[
                        { required: true, message: isAz ? 'Şifrəni təsdiqləyin' : 'Подтвердите пароль' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                                return Promise.reject(isAz ? 'Şifrələr uyğun gəlmir' : 'Пароли не совпадают');
                            },
                        }),
                    ]}
                >
                    <Input.Password size="large" style={{ borderRadius: 10 }} />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} size="large" style={{ borderRadius: 10 }}>
                    {isAz ? 'Yadda saxla' : 'Сохранить'}
                </Button>
            </Form>
        </div>
    );
};

// ────────────────────────────────────────────────────
const ProfilePage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { data: userProfile, isLoading, isFetching, refetch: refetchProfile } = useGetProfileQuery();
    const { data: myGamesData } = useGetGamesByUserQuery(userProfile?.id, { skip: !userProfile?.id });
    const { data: myTeams, refetch: refetchTeams } = useGetMyTeamsQuery(userProfile?.id, { skip: !userProfile?.id });
    const [createTeam, { isLoading: isCreatingTeam }] = useCreateTeamMutation();
    const [updateProfile] = useUpdateProfileMutation();

    const [activeTab, setActiveTab] = useState('profile');
    const [topUpModalVisible, setTopUpModalVisible] = useState(false);
    const [transferModalVisible, setTransferModalVisible] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState(10);
    const [topUpLoading, setTopUpLoading] = useState(false);
    const [createTeamModalVisible, setCreateTeamModalVisible] = useState(false);
    const [teamForm] = Form.useForm();
    const [avatarModalVisible, setAvatarModalVisible] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarViewVisible, setAvatarViewVisible] = useState(false);
    const [avatarDeleting, setAvatarDeleting] = useState(false);
    const [showFifaCard, setShowFifaCard] = useState(false);

    const handleAvatarSelect = (info) => {
        const file = info.file.originFileObj || info.file;
        if (file) { setAvatarPreview(URL.createObjectURL(file)); setAvatarFile(file); setAvatarModalVisible(true); }
    };

    const handleAvatarUpload = async () => {
        if (!avatarFile || !userProfile?.id) return;
        setAvatarUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', avatarFile);
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE}/api/files/avatar/${userProfile.id}`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
            );
            await updateProfile({ avatar: response.data.url }).unwrap();
            message.success(t('profile.avatar.success'));
            setAvatarModalVisible(false);
            setAvatarPreview(null);
            setAvatarFile(null);
            refetchProfile();
        } catch { message.error(t('profile.avatar.error')); }
        finally { setAvatarUploading(false); }
    };

    const handleAvatarDelete = async () => {
        if (!userProfile?.id) return;
        setAvatarDeleting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${API_BASE}/api/files/avatar/${userProfile.id}`,
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );
            await updateProfile({ avatar: null }).unwrap();
            message.success('Şəkil silindi');
            refetchProfile();
        } catch { message.error('Xəta baş verdi'); }
        finally { setAvatarDeleting(false); }
    };

    const handleTopUp = async () => {
        if (topUpAmount < 1) { message.warning(t('profile.wallet.minAmount')); return; }
        setTopUpLoading(true);
        try {
            await axios.post(`${API_BASE}/api/payments/top-up`, { userId: userProfile.id, amount: topUpAmount });
            message.success(t('profile.wallet.topUpSuccess'));
            setTopUpModalVisible(false); window.location.reload();
        } catch { message.error(t('profile.wallet.topUpError')); }
        finally { setTopUpLoading(false); }
    };

    const handleCreateTeam = async () => {
        try {
            const values = await teamForm.validateFields();
            await createTeam({ name: values.teamName, captainId: userProfile.id, playerIds: [userProfile.id] }).unwrap();
            message.success(t('profile.teams.createSuccess'));
            setCreateTeamModalVisible(false); teamForm.resetFields(); refetchTeams();
        } catch { message.error(t('profile.teams.createError')); }
    };

    const claimProfileBonus = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_BASE}/api/users/${userProfile.id}/bonus/profile`, {}, { headers: { Authorization: `Bearer ${token}` } });
            if (response.data.success) { message.success(response.data.message); window.location.reload(); }
            else message.warning(response.data.message);
        } catch { message.error(t('profile.bonus.error')); }
    };

    if (isLoading && !userProfile) return (
        <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Spin size="large" />
        </div>
    );

    const pos = getPOS(userProfile?.position);
    const myGames = myGamesData || [];
    const completion = calculateProfileCompletion(userProfile);

    const TABS = [
        { key: 'profile',       icon: <UserOutlined />,    label: t('profile.tabs.profile') },
        { key: 'friends',       icon: <UserAddOutlined />, label: t('profile.tabs.friends') },
        { key: 'teams',         icon: <TeamOutlined />,    label: t('profile.tabs.teams') },
        { key: 'history',       icon: <HistoryOutlined />, label: t('profile.tabs.history') },
        { key: 'mygames',       icon: <CalendarOutlined />, label: t('profile.tabs.mygames') },
        { key: 'achievements',  icon: <TrophyOutlined />,  label: t('profile.tabs.achievements') },
        { key: 'stadiums',      icon: <BankOutlined />,             label: t('profile.tabs.stadiums') },
        { key: 'support',       icon: <CustomerServiceOutlined />,  label: t('profile.tabs.support') },
        { key: 'invitations',   icon: <TeamOutlined />,             label: t('profile.tabs.invitations') },
        { key: 'referral',      icon: <GiftOutlined />,    label: 'Referral' },
        { key: 'security',      icon: <LockOutlined />,    label: t('profile.tabs.security') },
    ];

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 48 }}>
            <style>{`
                @media (max-width: 767px) {
                    .profile-hero-inner { flex-direction: column !important; align-items: center !important; text-align: center !important; }
                    .profile-hero-right { display: none !important; }
                    .profile-stats-strip { gap: 12px !important; }
                    .profile-tab-btn { padding: 8px 10px !important; font-size: 11px !important; gap: 4px !important; }
                    .profile-tab-btn svg { font-size: 13px !important; }
                }
                .profile-tab-scroll::-webkit-scrollbar { display: none; }
            `}</style>

            {/* ══ HERO BANNER ══════════════════════════════════ */}
            <div style={{
                background: `linear-gradient(135deg, #060c18 0%, ${pos.grad.replace('0.1', '0.18')} 60%, #060c18 100%)`,
                borderBottom: `1px solid ${pos.color}25`,
                padding: '32px 24px 0',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Glow blob */}
                <div style={{
                    position: 'absolute', top: -80, right: -80,
                    width: 320, height: 320, borderRadius: '50%',
                    background: `radial-gradient(circle, ${pos.glow} 0%, transparent 70%)`,
                    pointerEvents: 'none',
                }} />

                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <div className="profile-hero-inner" style={{ display: 'flex', alignItems: 'flex-end', gap: 28 }}>

                        {/* Avatar */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            {/* Upload wraps avatar + camera — original design preserved */}
                            <Upload name="avatar" showUploadList={false} beforeUpload={() => false} onChange={handleAvatarSelect} accept="image/*">
                                <div style={{ position: 'relative', cursor: 'pointer' }}>
                                    <Avatar
                                        size={110}
                                        src={userProfile?.avatar}
                                        icon={<UserOutlined />}
                                        style={{
                                            border: `3px solid ${pos.color}`,
                                            boxShadow: `0 0 24px ${pos.glow}`,
                                            background: 'var(--bg-raised)',
                                            color: pos.color,
                                            fontSize: 44,
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute', bottom: 2, right: 2,
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: 'var(--bg-card)',
                                        border: `2px solid ${pos.color}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <CameraOutlined style={{ color: pos.color, fontSize: 12 }} />
                                    </div>
                                </div>
                            </Upload>
                            {/* Transparent overlay for lightbox — only if photo exists */}
                            {userProfile?.avatar && (
                                <div
                                    onClick={(e) => { e.stopPropagation(); setAvatarViewVisible(true); }}
                                    style={{
                                        position: 'absolute', inset: 0,
                                        borderRadius: '50%', cursor: 'zoom-in',
                                        width: 110, height: 110,
                                    }}
                                />
                            )}
                            {/* Delete button — top-right, only if photo exists */}
                            {userProfile?.avatar && (
                                <div
                                    onClick={(e) => { e.stopPropagation(); Modal.confirm({
                                        title: 'Şəkli sil?',
                                        content: 'Profil şəkliniz silinəcək.',
                                        okText: 'Sil', okButtonProps: { danger: true },
                                        cancelText: 'Ləğv et',
                                        onOk: handleAvatarDelete,
                                    }); }}
                                    style={{
                                        position: 'absolute', top: 0, right: 0,
                                        width: 24, height: 24, borderRadius: '50%',
                                        background: 'rgba(239,68,68,0.9)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', zIndex: 2,
                                    }}
                                >
                                    <DeleteOutlined style={{ color: '#fff', fontSize: 11 }} />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, paddingBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                                <h1 style={{
                                    fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight: 800,
                                    fontSize: 26, color: 'var(--text-primary)',
                                    margin: 0, letterSpacing: '-0.5px',
                                }}>
                                    {userProfile?.name || t('common.player')}
                                </h1>
                                {userProfile?.position && (
                                    <span style={{
                                        background: pos.grad, color: pos.color,
                                        border: `1px solid ${pos.color}40`,
                                        borderRadius: 6, padding: '2px 10px',
                                        fontSize: 12, fontWeight: 700,
                                        textTransform: 'uppercase', letterSpacing: '0.5px',
                                    }}>
                                        {t(`players.positionPills.${userProfile.position}`, userProfile.position)}
                                    </span>
                                )}
                                {userProfile?.skillLevel && (
                                    <span style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 6, padding: '2px 10px',
                                        fontSize: 12, color: 'var(--text-secondary)',
                                    }}>
                                        {t(`skillLevel.${userProfile.skillLevel}`, userProfile.skillLevel)}
                                    </span>
                                )}
                                {/* FIFA card trigger */}
                                <button onClick={() => setShowFifaCard(true)} style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 6, padding: '2px 10px',
                                    fontSize: 12, color: 'var(--text-tertiary)',
                                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                                    display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                    ⚽ FIFA card
                                </button>
                            </div>

                            {/* Balance row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                <div style={{
                                    background: 'rgba(0,232,122,0.08)',
                                    border: '1px solid rgba(0,232,122,0.2)',
                                    borderRadius: 8, padding: '6px 14px',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                    <WalletOutlined style={{ color: 'var(--green)', fontSize: 14 }} />
                                    <span style={{ fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--green)' }}>
                                        {(userProfile?.balance || 0).toFixed(2)} AZN
                                    </span>
                                </div>
                                
                                <button onClick={() => setTransferModalVisible(true)} style={{
                                    background: 'transparent',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 8, padding: '7px 16px',
                                    color: 'var(--text-secondary)', fontSize: 13,
                                    fontFamily: 'Outfit, sans-serif', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                    <WalletOutlined /> {t('profile.wallet.transfer')}
                                </button>
                            </div>
                        </div>

                        {/* Profile completion — right side */}
                        {completion < 100 && (
                            <div className="profile-hero-right" style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 12, padding: '14px 18px',
                                minWidth: 200, marginBottom: 20,
                            }}>
                                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                                    Profil dolduruluğu
                                </div>
                                <Progress
                                    percent={completion}
                                    strokeColor={pos.color}
                                    trailColor="rgba(255,255,255,0.07)"
                                    showInfo={false}
                                    size="small"
                                    style={{ marginBottom: 8 }}
                                />
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{completion}% tamamlandı</span>
                                    {completion === 100 && !userProfile?.profileBonusReceived && (
                                        <button onClick={claimProfileBonus} style={{
                                            background: 'none', border: 'none', color: 'var(--green)',
                                            cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                        }}>Bonus al →</button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ══ STATS STRIP ══════════════════════════════════ */}
            <div style={{
                background: 'var(--bg-card)',
                borderBottom: '1px solid var(--border-color)',
            }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
                    <div className="profile-stats-strip" style={{
                        display: 'flex', alignItems: 'center',
                        gap: 0, overflowX: 'auto',
                    }}>
                        {[
                            { value: (userProfile?.averageRating || 0).toFixed(1), label: t('profile.stats.rating'), color: '#faad14' },
                            { value: userProfile?.gamesPlayed || 0, label: t('profile.stats.games'), color: 'var(--green)' },
                            { value: userProfile?.manOfTheMatchCount || 0, label: t('profile.stats.mvp'), color: '#faad14' },
                            { value: userProfile?.totalGoals || 0, label: t('profile.stats.goals'), color: '#ef4444' },
                            { value: userProfile?.totalAssists || 0, label: t('profile.stats.assists'), color: '#4f86f7' },
                            { value: userProfile?.xp || 0, label: t('profile.stats.xp'), color: '#a855f7' },
                        ].map((s, i, arr) => (
                            <div key={s.label} style={{
                                flex: 1, padding: '16px 8px',
                                borderRight: i < arr.length - 1 ? '1px solid var(--border-color)' : 'none',
                                minWidth: 80,
                            }}>
                                <StatItem {...s} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══ TABS + CONTENT ════════════════════════════════ */}
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 0' }}>

                {/* Tab bar */}
                <div className="profile-tab-scroll" style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--border-color)',
                    marginBottom: 24,
                    overflowX: 'auto',
                    gap: 0,
                }}>
                    {TABS.map(tab => (
                        <TabBtn
                            key={tab.key}
                            active={activeTab === tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            icon={tab.icon}
                            label={tab.label}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="animate-fade-in">

                    {activeTab === 'profile' && (
                        <div style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 16,
                        }}>
                            <ProfileForm initialData={userProfile} />
                        </div>
                    )}

                    {activeTab === 'friends' && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24 }}>
                            <FriendsList userId={userProfile?.id} />
                        </div>
                    )}

                    {activeTab === 'teams' && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h2 style={{ fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                    {t('profile.tabs.myTeams')}
                                </h2>
                                <button onClick={() => setCreateTeamModalVisible(true)} style={{
                                    background: 'var(--green)', border: 'none', borderRadius: 8,
                                    padding: '7px 16px', color: '#060c18',
                                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                    fontFamily: 'Outfit, sans-serif',
                                }}>
                                    + {t('profile.teams.createBtn')}
                                </button>
                            </div>
                            {myTeams && myTeams.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {myTeams.map(team => (
                                        <div key={team.id} onClick={() => navigate(`/teams/${team.id}`)} style={{
                                            background: 'var(--bg-raised)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 12, padding: '14px 18px',
                                            display: 'flex', alignItems: 'center', gap: 14,
                                            cursor: 'pointer', transition: 'border-color 0.15s',
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green-border)'}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                                        >
                                            <Avatar icon={<TeamOutlined />} src={team.flag || team.logo} style={{ backgroundColor: 'var(--green)', color: '#060c18', flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                                    {team.name}
                                                </div>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <span style={{ background: 'rgba(250,173,20,0.12)', color: '#faad14', borderRadius: 4, padding: '1px 8px', fontSize: 11, fontWeight: 600 }}>
                                                        {team.rating || 1000} MMR
                                                    </span>
                                                    <span style={{ background: 'rgba(0,232,122,0.1)', color: 'var(--green)', borderRadius: 4, padding: '1px 8px', fontSize: 11, fontWeight: 600 }}>
                                                        W: {team.wins || 0}
                                                    </span>
                                                    <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 4, padding: '1px 8px', fontSize: 11, fontWeight: 600 }}>
                                                        L: {team.losses || 0}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {team.captainId === userProfile?.id && (
                                                    <span style={{ background: 'rgba(250,173,20,0.12)', color: '#faad14', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                                                        Kapitan
                                                    </span>
                                                )}
                                                <RightOutlined style={{ color: 'var(--text-tertiary)', fontSize: 12 }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Empty description={<span style={{ color: 'var(--text-tertiary)' }}>{t('profile.teams.noTeams')}</span>}>
                                    <button onClick={() => setCreateTeamModalVisible(true)} style={{
                                        background: 'var(--green)', border: 'none', borderRadius: 8,
                                        padding: '8px 20px', color: '#060c18', fontWeight: 700,
                                        fontSize: 14, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                                    }}>
                                        {t('profile.teams.createTeam')}
                                    </button>
                                </Empty>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden' }}>
                            <GameHistory games={myGames} />
                        </div>
                    )}

                    {activeTab === 'mygames' && (() => {
                        const createdGames = myGames.filter(g => g.organizerId === userProfile?.id);
                        const statusConfig = {
                            pending:   { label: t('profile.mygames.statusPending'),   color: 'orange' },
                            open:      { label: t('profile.mygames.statusOpen'),       color: 'green' },
                            full:      { label: t('profile.mygames.statusFull'),       color: 'blue' },
                            cancelled: { label: t('profile.mygames.statusCancelled'), color: 'red' },
                            finished:  { label: t('profile.mygames.statusFinished'),  color: 'default' },
                        };
                        return (
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 20 }}>
                                <h3 style={{ color: 'var(--text-primary)', marginBottom: 16, fontSize: 16, fontWeight: 700 }}>
                                    {t('profile.mygames.title')}
                                </h3>
                                {createdGames.length === 0 ? (
                                    <Empty description={<span style={{ color: 'var(--text-secondary)' }}>{t('profile.mygames.empty')}</span>} />
                                ) : (
                                    <List
                                        dataSource={createdGames}
                                        renderItem={g => {
                                            const cfg = statusConfig[g.status] || { label: g.status, color: 'default' };
                                            return (
                                                <List.Item
                                                    style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', padding: '12px 0' }}
                                                    onClick={() => navigate(`/games/${g.id}`)}
                                                >
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{g.title}</div>
                                                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{g.date} • {g.time} • {g.location}</div>
                                                    </div>
                                                    <Tag color={cfg.color} style={{ marginLeft: 8 }}>{cfg.label}</Tag>
                                                </List.Item>
                                            );
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })()}

                    {activeTab === 'achievements' && <Achievements user={userProfile} />}
                    {activeTab === 'stadiums' && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24 }}>
                            <MyStadiums userId={userProfile?.id} />
                        </div>
                    )}
                    {activeTab === 'support' && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden' }}>
                            <SupportChat user={userProfile} />
                        </div>
                    )}
                    {activeTab === 'invitations' && <TeamInvitations user={userProfile} />}

                    {activeTab === 'referral' && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24 }}>
                            <ReferralSection currentUser={userProfile} />
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <ChangePasswordSection hasPassword={userProfile?.hasPassword} />
                    )}
                </div>
            </div>

            {/* ══ FIFA CARD MODAL ══════════════════════════════ */}
            <Modal
                open={showFifaCard}
                onCancel={() => setShowFifaCard(false)}
                footer={null}
                centered
                width={320}
                styles={{ content: { background: 'transparent', boxShadow: 'none', padding: 0 }, mask: { backdropFilter: 'blur(8px)' } }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <FifaPlayerCard user={userProfile} size="large" />
                    <button
                        onClick={() => {
                            const url = `${window.location.origin}/player/${userProfile?.id}`;
                            if (navigator.share) {
                                navigator.share({ title: `${userProfile?.name} — Topin`, url });
                            } else {
                                navigator.clipboard.writeText(url);
                                message.success(i18n.language === 'az' ? 'Link kopyalandı!' : 'Ссылка скопирована!');
                            }
                        }}
                        style={{
                            background: 'var(--green)', color: '#060c18', border: 'none',
                            borderRadius: 10, padding: '10px 28px',
                            fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                        }}
                    >
                        🔗 {i18n.language === 'az' ? 'Profili paylaş' : 'Поделиться профилем'}
                    </button>
                </div>
            </Modal>

            {/* ══ MODALS ════════════════════════════════════════ */}
            <Modal title={t('profile.wallet.topUpTitle')} open={topUpModalVisible}
                onCancel={() => setTopUpModalVisible(false)} onOk={handleTopUp}
                confirmLoading={topUpLoading} okText={t('profile.wallet.payBtn')}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>{t('profile.wallet.topUpHint')}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{t('profile.wallet.amountLabel')}</span>
                    <InputNumber min={1} max={100} value={topUpAmount} onChange={setTopUpAmount} style={{ width: '100%' }} />
                </div>
            </Modal>

            <TransferModal visible={transferModalVisible} sender={userProfile} onClose={() => setTransferModalVisible(false)} />

            <Modal title={t('profile.avatar.uploadTitle')} open={avatarModalVisible}
                onCancel={() => { setAvatarModalVisible(false); setAvatarPreview(null); setAvatarFile(null); }}
                onOk={handleAvatarUpload} confirmLoading={avatarUploading}
                okText={t('profile.avatar.save')} cancelText={t('profile.avatar.cancel')}>
                <div style={{ textAlign: 'center', padding: 20 }}>
                    {avatarPreview && <img src={avatarPreview} alt="Preview" style={{ width: 160, height: 160, borderRadius: '50%', objectFit: 'cover', border: `4px solid ${pos.color}` }} />}
                    <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>{t('profile.avatar.hint')}</p>
                </div>
            </Modal>

            {/* Avatar lightbox */}
            <Modal
                open={avatarViewVisible}
                onCancel={() => setAvatarViewVisible(false)}
                footer={null}
                centered
                width="min(88vw, 88vh)"
                styles={{
                    body: { padding: 0, background: 'transparent' },
                    content: { background: 'transparent', boxShadow: 'none', padding: 0 },
                    mask: { background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' },
                }}
                closeIcon={
                    <span style={{
                        position: 'fixed', top: 20, right: 20,
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 16, cursor: 'pointer',
                    }}>✕</span>
                }
            >
                <img
                    src={userProfile?.avatar}
                    alt={userProfile?.name}
                    style={{
                        width: '100%',
                        height: 'min(88vw, 88vh)',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        display: 'block',
                        border: `4px solid ${pos.color}`,
                        boxShadow: `0 0 60px ${pos.glow}, 0 0 120px rgba(0,0,0,0.8)`,
                    }}
                />
            </Modal>

            <Modal title={t('profile.teams.createTitle')} open={createTeamModalVisible}
                onCancel={() => { setCreateTeamModalVisible(false); teamForm.resetFields(); }}
                onOk={handleCreateTeam} confirmLoading={isCreatingTeam}
                okText={t('profile.teams.createBtn2')} cancelText={t('common.cancel')}>
                <Form form={teamForm} layout="vertical">
                    <Form.Item name="teamName" label={t('profile.teams.nameLabel')} rules={[{ required: true, message: t('profile.teams.namePlaceholder') }]}>
                        <Input placeholder={t('profile.teams.nameExample')} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ProfilePage;
