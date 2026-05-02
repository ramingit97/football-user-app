import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Select, DatePicker, Input, message, Spin } from 'antd';
import {
    ThunderboltOutlined,
    EnvironmentOutlined,
    CalendarOutlined,
    TeamOutlined,
    MessageOutlined,
    PhoneOutlined,
    SendOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import ruLocale from 'antd/es/date-picker/locale/ru_RU';
import azLocale from 'antd/es/date-picker/locale/az_AZ';
import { useGetLookupsQuery, useCreateLookupMutation } from '../../store/lookupApi';
import { useGetDistrictsQuery } from '../../store/locationsApi';

const { Option } = Select;
const { TextArea } = Input;

const FORMAT_COLORS = {
    '5x5':   { color: '#00e87a', bg: 'rgba(0,232,122,0.1)'  },
    '6x6':   { color: '#4f86f7', bg: 'rgba(79,134,247,0.1)' },
    '7x7':   { color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
    '8x8':   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    '11x11': { color: '#f04438', bg: 'rgba(240,68,56,0.1)'  },
};
const getFmt = (f) => FORMAT_COLORS[f] || FORMAT_COLORS['6x6'];

const STATUS_COLORS = {
    open:      { color: '#00e87a', bg: 'rgba(0,232,122,0.1)'  },
    matched:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    cancelled: { color: '#f04438', bg: 'rgba(240,68,56,0.1)'  },
};

const useTimeAgo = () => {
    const { t } = useTranslation();
    return (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1) return t('lookup.timeAgoNow');
        if (m < 60) return t('lookup.timeAgoMin', { n: m });
        const h = Math.floor(m / 60);
        if (h < 24) return t('lookup.timeAgoHour', { n: h });
        return t('lookup.timeAgoDay', { n: Math.floor(h / 24) });
    };
};

const LookupCard = ({ lookup, onClick }) => {
    const [hovered, setHovered] = useState(false);
    const { t, i18n } = useTranslation();
    const timeAgo = useTimeAgo();
    const fmt = getFmt(lookup.format);
    const dateLocale = i18n.language === 'az' ? 'az-AZ' : 'ru-RU';
    const responseCount = (lookup.responses || []).length;
    const statusLabel = { open: t('lookup.statusOpen'), matched: t('lookup.statusMatched'), cancelled: t('lookup.statusCancelled') }[lookup.status] || t('lookup.statusOpen');
    const statusStyle = STATUS_COLORS[lookup.status] || STATUS_COLORS.open;

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'relative',
                cursor: 'pointer',
                background: 'var(--bg-card)',
                border: `1px solid ${hovered ? fmt.color + '60' : 'var(--border-color)'}`,
                borderRadius: 20,
                overflow: 'hidden',
                transform: hovered ? 'translateY(-4px)' : 'none',
                boxShadow: hovered
                    ? `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${fmt.color}20`
                    : '0 2px 12px rgba(0,0,0,0.3)',
                transition: 'all 0.22s ease',
            }}
        >
            {/* Top color bar */}
            <div style={{
                height: 3,
                background: `linear-gradient(90deg, ${fmt.color}, ${fmt.color}44)`,
                boxShadow: hovered ? `0 0 12px ${fmt.color}60` : 'none',
                transition: 'box-shadow 0.22s',
            }} />

            {/* Glow accent */}
            <div style={{
                position: 'absolute',
                top: -60, right: -40,
                width: 160, height: 160,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${fmt.color}08 0%, transparent 70%)`,
                pointerEvents: 'none',
                opacity: hovered ? 1 : 0.4,
                transition: 'opacity 0.3s',
            }} />

            <div style={{ padding: '18px 20px 20px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    {/* Avatar */}
                    <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: fmt.bg,
                        border: `2px solid ${fmt.color}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 17, fontWeight: 800,
                        fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                        color: fmt.color,
                        overflow: 'hidden',
                    }}>
                        {lookup.creatorAvatar
                            ? <img src={lookup.creatorAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : (lookup.creatorName?.[0] || '?').toUpperCase()
                        }
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                            fontWeight: 700, fontSize: 15,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                            {lookup.teamName || lookup.creatorName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif', marginTop: 1 }}>
                            {timeAgo(lookup.createdAt)}
                        </div>
                    </div>

                    {/* Status badge */}
                    <span style={{
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 11, fontWeight: 700,
                        fontFamily: 'Outfit,sans-serif',
                        border: `1px solid ${statusStyle.color}30`,
                        flexShrink: 0,
                    }}>
                        {statusLabel}
                    </span>
                </div>

                {/* Format + info chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                    <span style={{
                        background: fmt.bg,
                        color: fmt.color,
                        padding: '5px 12px',
                        borderRadius: 20, fontSize: 12, fontWeight: 700,
                        fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                        border: `1px solid ${fmt.color}25`,
                    }}>
                        ⚽ {lookup.format}
                    </span>

                    {lookup.playerCount > 0 && (
                        <span style={{
                            background: 'var(--bg-raised)',
                            color: 'var(--text-secondary)',
                            padding: '5px 12px',
                            borderRadius: 20, fontSize: 12, fontWeight: 600,
                            fontFamily: 'Outfit,sans-serif',
                            border: '1px solid var(--border-color)',
                            display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                            <TeamOutlined style={{ fontSize: 11 }} />
                            {t('lookup.playerCount', { count: lookup.playerCount })}
                        </span>
                    )}

                    {lookup.district && (
                        <span style={{
                            background: 'var(--bg-raised)',
                            color: 'var(--text-secondary)',
                            padding: '5px 12px',
                            borderRadius: 20, fontSize: 12, fontWeight: 500,
                            fontFamily: 'Outfit,sans-serif',
                            border: '1px solid var(--border-color)',
                            display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                            <EnvironmentOutlined style={{ fontSize: 11, color: fmt.color, opacity: 0.7 }} />
                            {lookup.district}
                        </span>
                    )}

                    {lookup.preferredDate && (
                        <span style={{
                            background: 'var(--bg-raised)',
                            color: 'var(--text-secondary)',
                            padding: '5px 12px',
                            borderRadius: 20, fontSize: 12, fontWeight: 500,
                            fontFamily: 'Outfit,sans-serif',
                            border: '1px solid var(--border-color)',
                            display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                            <CalendarOutlined style={{ fontSize: 11, color: fmt.color, opacity: 0.7 }} />
                            {new Date(lookup.preferredDate).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }).replace('/', '.')}
                            {lookup.preferredTime && ` · ${lookup.preferredTime}`}
                        </span>
                    )}
                </div>

                {/* Message preview */}
                {lookup.message && (
                    <div style={{
                        fontSize: 13, color: 'var(--text-secondary)',
                        fontFamily: 'Outfit,sans-serif',
                        lineHeight: 1.5,
                        marginBottom: 14,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}>
                        {lookup.message}
                    </div>
                )}

                {/* Footer */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: 12,
                    borderTop: '1px solid var(--border-color)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-tertiary)', fontSize: 12, fontFamily: 'Outfit,sans-serif' }}>
                        <MessageOutlined style={{ fontSize: 12 }} />
                        <span>{responseCount > 0 ? t('lookup.responses', { count: responseCount }) : t('lookup.noResponses')}</span>
                    </div>

                    {lookup.contactPhone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'Outfit,sans-serif' }}>
                            <PhoneOutlined style={{ fontSize: 11 }} />
                            <span>{lookup.contactPhone}</span>
                        </div>
                    )}

                    <div style={{
                        background: lookup.status === 'open' ? fmt.bg : 'var(--bg-raised)',
                        color: lookup.status === 'open' ? fmt.color : 'var(--text-tertiary)',
                        padding: '5px 14px',
                        borderRadius: 10,
                        fontSize: 12, fontWeight: 700,
                        fontFamily: 'Outfit,sans-serif',
                        border: lookup.status === 'open' ? `1px solid ${fmt.color}30` : '1px solid var(--border-color)',
                    }}>
                        {lookup.status === 'open' ? t('lookup.responsesCta') : t('lookup.closed')}
                    </div>
                </div>
            </div>
        </div>
    );
};

const LookupPage = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    const locale = i18n.language === 'az' ? azLocale : ruLocale;

    const [formatFilter, setFormatFilter] = useState(null);
    const [districtFilter, setDistrictFilter] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState({
        format: '6x6', preferredDate: null,
        preferredTime: null, district: '', message: '', contactPhone: '',
        teamName: '',
    });

    const { data: lookups = [], isLoading } = useGetLookupsQuery({
        format: formatFilter || undefined,
        district: districtFilter || undefined,
    });
    const { data: districtsData } = useGetDistrictsQuery();
    const districts = districtsData || [];

    const [createLookup, { isLoading: creating }] = useCreateLookupMutation();

    const handleCreate = async () => {
        if (!currentUser) { navigate('/login?returnTo=/lookup'); return; }
        if (!form.format) { message.error(t('lookup.modal.validationFormat')); return; }

        try {
            await createLookup({
                creatorId: currentUser.id,
                creatorName: currentUser.name,
                creatorAvatar: currentUser.avatar || null,
                format: form.format,
                playerCount: parseInt(form.format.split('x')[0]) || 0,
                preferredDate: form.preferredDate ? form.preferredDate.format('YYYY-MM-DD') : null,
                preferredTime: form.preferredTime || null,
                district: form.district || null,
                message: form.message || null,
                contactPhone: form.contactPhone || null,
                teamName: form.teamName || null,
            }).unwrap();
            message.success(t('lookup.modal.successPublished'));
            setCreateOpen(false);
            setForm({ format: '6x6', preferredDate: null, preferredTime: null, district: '', message: '', contactPhone: '', teamName: '' });
        } catch (e) {
            message.error(e?.data?.message || t('lookup.modal.errorPublish'));
        }
    };

    const inputStyle = {
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-color)',
        borderRadius: 10,
        color: 'var(--text-primary)',
        fontFamily: 'Outfit,sans-serif',
        fontSize: 14,
        height: 42,
    };

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

            {/* ── HERO ─────────────────────────────────── */}
            <div style={{
                position: 'relative',
                borderRadius: 24,
                overflow: 'hidden',
                marginBottom: 28,
                background: 'linear-gradient(135deg, #0d1f0e 0%, #060c18 60%, #0a0a1a 100%)',
                border: '1px solid rgba(0,232,122,0.15)',
                padding: '36px 32px',
            }}>
                {/* Background field lines */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.04,
                    backgroundImage: `
                        linear-gradient(rgba(0,232,122,0.8) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,232,122,0.8) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                    pointerEvents: 'none',
                }} />

                {/* Glow orbs */}
                <div style={{
                    position: 'absolute', top: -80, right: -80,
                    width: 300, height: 300, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0,232,122,0.12) 0%, transparent 60%)',
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', bottom: -60, left: -60,
                    width: 200, height: 200, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(79,134,247,0.08) 0%, transparent 60%)',
                    pointerEvents: 'none',
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'rgba(0,232,122,0.1)',
                        border: '1px solid rgba(0,232,122,0.25)',
                        borderRadius: 20,
                        padding: '5px 14px',
                        fontSize: 12, fontWeight: 600,
                        color: '#00e87a',
                        fontFamily: 'Outfit,sans-serif',
                        marginBottom: 14,
                    }}>
                        <ThunderboltOutlined />
                        {t('nav.newFeature')}
                    </div>

                    <h1 style={{
                        fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                        fontWeight: 800,
                        fontSize: 'clamp(26px, 4vw, 42px)',
                        color: '#fff',
                        margin: '0 0 10px',
                        lineHeight: 1.15,
                        letterSpacing: '-1px',
                    }}>
                        {t('lookup.pageTitle').split(' ').slice(0, -1).join(' ')}<br />
                        <span style={{ color: '#00e87a' }}>{t('lookup.pageTitle').split(' ').slice(-1)[0]}</span>
                    </h1>

                    <p style={{
                        fontFamily: 'Outfit,sans-serif',
                        fontSize: 15, color: 'rgba(255,255,255,0.55)',
                        margin: '0 0 24px',
                        maxWidth: 440,
                        lineHeight: 1.6,
                    }}>
                        {t('lookup.heroDesc')}
                    </p>

                    <button
                        onClick={() => {
                            if (!currentUser) { navigate('/login?returnTo=/lookup'); return; }
                            setCreateOpen(true);
                        }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 9,
                            background: '#00e87a',
                            border: 'none',
                            borderRadius: 12,
                            padding: '13px 26px',
                            color: '#060c18',
                            fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                            fontWeight: 800, fontSize: 15,
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(0,232,122,0.35)',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,232,122,0.5)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,232,122,0.35)'; }}
                    >
                        <SendOutlined />
                        {t('lookup.cta')}
                    </button>
                </div>
            </div>

            {/* ── FILTERS ─────────────────────────────── */}
            <div style={{
                display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap',
                padding: '14px 16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 14,
            }}>
                <Select
                    allowClear
                    placeholder={t('lookup.filterFormat')}
                    value={formatFilter}
                    onChange={setFormatFilter}
                    style={{ width: 130 }}
                    popupMatchSelectWidth={false}
                >
                    {['5x5','6x6','7x7','8x8','11x11'].map(f => (
                        <Option key={f} value={f}>⚽ {f}</Option>
                    ))}
                </Select>

                <Select
                    allowClear
                    placeholder={t('lookup.filterDistrict')}
                    value={districtFilter}
                    onChange={setDistrictFilter}
                    style={{ width: 160 }}
                    showSearch
                    optionFilterProp="children"
                    popupMatchSelectWidth={false}
                >
                    {districts.map(d => (
                        <Option key={d.name || d} value={d.name || d}>{d.name || d}</Option>
                    ))}
                </Select>

                {(formatFilter || districtFilter) && (
                    <button
                        onClick={() => { setFormatFilter(null); setDistrictFilter(null); }}
                        style={{
                            background: 'transparent', border: '1px solid var(--border-color)',
                            borderRadius: 8, padding: '0 12px',
                            color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif',
                            fontSize: 12, cursor: 'pointer',
                        }}
                    >
                        {t('lookup.filterReset')}
                    </button>
                )}

                <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif', display: 'flex', alignItems: 'center' }}>
                    {isLoading ? '' : t('lookup.count', { count: lookups.length })}
                </div>
            </div>

            {/* ── LIST ────────────────────────────────── */}
            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <Spin size="large" />
                </div>
            ) : lookups.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '64px 24px',
                    background: 'var(--bg-card)',
                    border: '1px dashed var(--border-color)',
                    borderRadius: 20,
                }}>
                    <div style={{ fontSize: 52, marginBottom: 16 }}>⚽</div>
                    <div style={{
                        fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                        fontWeight: 700, fontSize: 20,
                        color: 'var(--text-primary)', marginBottom: 8,
                    }}>
                        {t('lookup.emptyTitle')}
                    </div>
                    <div style={{ color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif', fontSize: 14, marginBottom: 24 }}>
                        {t('lookup.emptyDesc')}
                    </div>
                    <button
                        onClick={() => { if (!currentUser) { navigate('/login?returnTo=/lookup'); return; } setCreateOpen(true); }}
                        style={{
                            background: '#00e87a', border: 'none', borderRadius: 10,
                            padding: '10px 24px', color: '#060c18',
                            fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 14,
                            cursor: 'pointer',
                        }}
                    >
                        {t('lookup.cta')}
                    </button>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 16,
                }}>
                    {lookups.map(lookup => (
                        <LookupCard
                            key={lookup.id}
                            lookup={lookup}
                            onClick={() => navigate(`/lookup/${lookup.id}`)}
                        />
                    ))}
                </div>
            )}

            {/* ── CREATE MODAL ─────────────────────────── */}
            <Modal
                open={createOpen}
                onCancel={() => setCreateOpen(false)}
                footer={null}
                width={520}
                centered
                styles={{
                    content: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 20, padding: 0 },
                    header: { background: 'transparent', borderBottom: '1px solid var(--border-color)', padding: '20px 24px 16px' },
                    mask: { backdropFilter: 'blur(4px)' },
                }}
                title={
                    <span style={{ fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
                        {t('lookup.modal.title')}
                    </span>
                }
            >
                <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Формат */}
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif', marginBottom: 6, display: 'block' }}>
                            {t('lookup.modal.labelFormat')} *
                        </label>
                        <Select
                            value={form.format}
                            onChange={v => setForm(f => ({ ...f, format: v }))}
                            style={{ width: '100%' }}
                        >
                            {['5x5','6x6','7x7','8x8','11x11'].map(f => (
                                <Option key={f} value={f}>⚽ {f}</Option>
                            ))}
                        </Select>
                    </div>

                    {/* Название команды */}
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif', marginBottom: 6, display: 'block' }}>
                            {t('lookup.modal.labelTeam')}
                        </label>
                        <Input
                            placeholder={t('lookup.modal.placeholderTeam')}
                            value={form.teamName}
                            onChange={e => setForm(f => ({ ...f, teamName: e.target.value }))}
                            style={inputStyle}
                        />
                    </div>

                    {/* Дата + Время в одной строке */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif', marginBottom: 6, display: 'block' }}>
                                {t('lookup.modal.labelDate')}
                            </label>
                            <DatePicker
                                locale={locale}
                                value={form.preferredDate}
                                onChange={d => setForm(f => ({ ...f, preferredDate: d }))}
                                disabledDate={d => d && d < dayjs().startOf('day')}
                                style={{ ...inputStyle, width: '100%' }}
                                format="DD.MM.YYYY"
                                getPopupContainer={trigger => trigger.parentElement}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif', marginBottom: 6, display: 'block' }}>
                                {t('lookup.modal.labelTime')}
                            </label>
                            <Select
                                value={form.preferredTime}
                                onChange={v => setForm(f => ({ ...f, preferredTime: v }))}
                                style={{ ...inputStyle, width: '100%' }}
                                getPopupContainer={trigger => trigger.parentElement}
                                options={Array.from({ length: 15 }, (_, i) => {
                                    const h = i + 8;
                                    const start = `${String(h).padStart(2, '0')}:00`;
                                    const end = `${String(h + 1).padStart(2, '0')}:00`;
                                    return { value: start, label: `${start} – ${end}` };
                                })}
                            />
                        </div>
                    </div>

                    {/* Район */}
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif', marginBottom: 6, display: 'block' }}>
                            {t('lookup.modal.labelDistrict')}
                        </label>
                        <Select
                            allowClear
                            placeholder={t('lookup.modal.placeholderDistrict')}
                            value={form.district || undefined}
                            onChange={v => setForm(f => ({ ...f, district: v || '' }))}
                            style={{ width: '100%' }}
                            showSearch
                            optionFilterProp="children"
                            getPopupContainer={trigger => trigger.parentElement}
                        >
                            {districts.map(d => (
                                <Option key={d.name || d} value={d.name || d}>{d.name || d}</Option>
                            ))}
                        </Select>
                    </div>

                    {/* Телефон */}
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif', marginBottom: 6, display: 'block' }}>
                            {t('lookup.modal.labelPhone')}
                        </label>
                        <Input
                            placeholder={t('lookup.modal.placeholderPhone')}
                            value={form.contactPhone}
                            onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                            prefix={<PhoneOutlined style={{ color: 'var(--text-tertiary)' }} />}
                            style={inputStyle}
                        />
                    </div>

                    {/* Сообщение */}
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif', marginBottom: 6, display: 'block' }}>
                            {t('lookup.modal.labelMessage')}
                        </label>
                        <TextArea
                            placeholder={t('lookup.modal.placeholderMessage')}
                            value={form.message}
                            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                            rows={3}
                            style={{ ...inputStyle, height: 'auto', resize: 'none' }}
                        />
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={creating}
                        style={{
                            width: '100%',
                            height: 48,
                            background: '#00e87a',
                            border: 'none',
                            borderRadius: 12,
                            color: '#060c18',
                            fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                            fontWeight: 800, fontSize: 16,
                            cursor: creating ? 'not-allowed' : 'pointer',
                            opacity: creating ? 0.7 : 1,
                            transition: 'opacity 0.15s',
                            marginTop: 4,
                        }}
                    >
                        {creating ? t('lookup.modal.submitting') : t('lookup.modal.submit')}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default LookupPage;
