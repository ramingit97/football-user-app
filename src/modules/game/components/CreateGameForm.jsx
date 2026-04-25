import { useState, useEffect, useRef } from 'react';
import {
    Form, Input, DatePicker, InputNumber,
    Select, message, Spin, Image, Alert, Checkbox, TimePicker,
} from 'antd';
import {
    EnvironmentOutlined, TeamOutlined, InfoCircleOutlined,
    BankOutlined, ClockCircleOutlined, LockOutlined,
    GlobalOutlined, CheckCircleFilled, WalletOutlined,
    ShopOutlined, UserAddOutlined, PlusOutlined, MinusOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import ruLocale from 'antd/es/date-picker/locale/ru_RU';
import azLocale from 'antd/es/date-picker/locale/az_AZ';
import { useTranslation } from 'react-i18next';
import { useCreateGameMutation } from '../../../store/gamesApi';
import { useConvertElanMutation } from '../../../store/elanlarApi';
import { useGetDistrictsQuery, useGetMetroStationsQuery } from '../../../store/locationsApi';
import axios from 'axios';
import { API_BASE } from '../../../config.js';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const FORMAT_PLAYERS = { '5x5': 10, '6x6': 12, '7x7': 14, '8x8': 16, '11x11': 22 };

const computeEndTime = (startTime, durationMinutes) => {
    const [h, m] = startTime.split(':').map(Number);
    const total = h * 60 + m + durationMinutes;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

// ── Section header ─────────────────────────────────────────
const SectionHeader = ({ icon, title, subtitle }) => (
    <div style={{ marginBottom: 20, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(0,232,122,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--green)', fontSize: 15, flexShrink: 0,
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif", lineHeight: 1.2 }}>
                    {title}
                </div>
                {subtitle && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{subtitle}</div>}
            </div>
        </div>
        <div style={{ height: 1, background: 'var(--border-color)', marginTop: 12 }} />
    </div>
);

// ── Step counter control ────────────────────────────────────
const CounterControl = ({ value, onChange, min = 0, max = 30, label, sublabel, color = 'var(--green)' }) => (
    <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px',
        background: 'var(--bg-raised)',
        border: `1px solid var(--border-color)`,
        borderRadius: 12,
    }}>
        <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{label}</div>
            {sublabel && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{sublabel}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <button type="button"
                onClick={() => onChange(Math.max(min, value - 1))}
                disabled={value <= min}
                style={{
                    width: 36, height: 36, borderRadius: '8px 0 0 8px',
                    border: `1px solid var(--border-color)`,
                    background: value <= min ? 'transparent' : 'var(--bg-secondary)',
                    color: value <= min ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    cursor: value <= min ? 'default' : 'pointer',
                    fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                <MinusOutlined style={{ fontSize: 12 }} />
            </button>
            <div style={{
                minWidth: 48, height: 36,
                border: `1px solid var(--border-color)`, borderLeft: 'none', borderRight: 'none',
                background: 'var(--bg-base)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                fontWeight: 800, fontSize: 18, color,
            }}>
                {value}
            </div>
            <button type="button"
                onClick={() => onChange(Math.min(max, value + 1))}
                disabled={value >= max}
                style={{
                    width: 36, height: 36, borderRadius: '0 8px 8px 0',
                    border: `1px solid var(--border-color)`,
                    background: value >= max ? 'transparent' : 'var(--bg-secondary)',
                    color: value >= max ? 'var(--text-tertiary)' : color,
                    cursor: value >= max ? 'default' : 'pointer',
                    fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                <PlusOutlined style={{ fontSize: 12 }} />
            </button>
        </div>
    </div>
);

const CreateGameForm = ({ onSuccess, elanPrefill = null }) => {
    const [form] = Form.useForm();
    const { t, i18n } = useTranslation();
    const datePickerLocale = i18n.language === 'az' ? azLocale : ruLocale;
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const [createGame, { isLoading }] = useCreateGameMutation();
    const [convertElan] = useConvertElanMutation();
    const { data: districts = [] } = useGetDistrictsQuery();
    const { data: metros = [] } = useGetMetroStationsQuery();

    // ── Mode: 'marketplace' | 'own' ─────────────────────────
    const [gameMode, setGameMode] = useState(elanPrefill ? 'own' : null);

    // ── Marketplace state ────────────────────────────────────
    const [stadiums, setStadiums] = useState([]);
    const [filteredStadiums, setFilteredStadiums] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedMetro, setSelectedMetro] = useState(null);
    const [selectedStadium, setSelectedStadium] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDuration, setSelectedDuration] = useState(60);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [gameVisibility, setGameVisibility] = useState('public');
    const [maxPlayers, setMaxPlayers] = useState(null);
    const [selectedFormat, setSelectedFormat] = useState(null);
    const titleTouched = useRef(false);

    // ── Own game state ───────────────────────────────────────
    const [guestCount, setGuestCount] = useState(0);
    const [openSlots, setOpenSlots] = useState(2);
    const [legionPaymentType, setLegionPaymentType] = useState('self');
    const [organizerCoversAmount, setOrganizerCoversAmount] = useState(10);
    const [guestNames, setGuestNames] = useState([]);
    const [showGuestNames, setShowGuestNames] = useState(false);
    const [ownFormat, setOwnFormat] = useState(elanPrefill?.format || '6x6');

    // ── Prefill from elan ────────────────────────────────────
    useEffect(() => {
        if (!elanPrefill) return;
        const fields = {};
        if (elanPrefill.date) fields.date = dayjs(elanPrefill.date);
        if (elanPrefill.time) {
            const [h, m] = elanPrefill.time.split(':');
            fields.ownTime = dayjs().hour(Number(h)).minute(Number(m)).second(0);
        }
        if (Object.keys(fields).length) form.setFieldsValue(fields);
    }, [elanPrefill]);

    useEffect(() => {
        axios.get(`${API_BASE}/api/stadiums`)
            .then(r => { setStadiums(r.data); setFilteredStadiums(r.data); })
            .catch(() => {});
    }, []);

    useEffect(() => {
        let f = stadiums;
        if (selectedDistrict) f = f.filter(s => s.district === selectedDistrict);
        if (selectedMetro) f = f.filter(s => s.metro === selectedMetro);
        setFilteredStadiums(f);
    }, [selectedDistrict, selectedMetro, stadiums]);

    useEffect(() => {
        if (!selectedStadium || !selectedDate) { setAvailableSlots([]); return; }
        setLoadingSlots(true);
        axios.get(`${API_BASE}/api/stadiums/${selectedStadium}/available-slots?date=${selectedDate.format('YYYY-MM-DD')}`)
            .then(r => setAvailableSlots(r.data))
            .catch(() => setAvailableSlots([]))
            .finally(() => setLoadingSlots(false));
    }, [selectedStadium, selectedDate]);

    useEffect(() => {
        if (titleTouched.current) return;
        const stadium = stadiums.find(s => s.id === selectedStadium);
        if (selectedFormat && stadium && selectedDate) {
            form.setFieldValue('title', `${selectedFormat} · ${stadium.name} · ${selectedDate.format('D MMM')}`);
        }
    }, [selectedFormat, selectedStadium, selectedDate, stadiums]);

    // Sync guest names array length with guestCount — default to "Qonaq N"
    useEffect(() => {
        setGuestNames(prev => {
            const arr = [...prev];
            while (arr.length < guestCount) {
                const n = arr.length + 1;
                arr.push({ id: `guest-${Date.now()}-${n}`, name: `Qonaq ${n}` });
            }
            return arr.slice(0, guestCount);
        });
    }, [guestCount]);

    const selectedStadiumData = stadiums.find(s => s.id === selectedStadium);
    const pricePerPlayer = selectedStadiumData && maxPlayers
        ? Math.ceil((selectedStadiumData.pricePerHour || 0) / maxPlayers * 10) / 10
        : null;

    const totalOwnPlayers = guestCount + openSlots;
    const ownMaxPlayers = FORMAT_PLAYERS[ownFormat] || 10;

    const resetForm = () => {
        form.resetFields();
        setSelectedDistrict(null); setSelectedMetro(null); setSelectedStadium(null);
        setSelectedDate(null); setAvailableSlots([]); setSelectedDuration(60);
        setMaxPlayers(null); setSelectedFormat(null);
        titleTouched.current = false;
        setGuestCount(0); setOpenSlots(2); setLegionPaymentType('self');
        setOrganizerCoversAmount(10); setGuestNames([]); setShowGuestNames(false);
        setOwnFormat('6x6');
    };

    const onFinish = async (values) => {
        try {
            let gameData;

            if (gameMode === 'own') {
                const timeStr = values.ownTime ? dayjs(values.ownTime).format('HH:mm') : values.ownTimeManual;
                const filledGuests = guestNames.filter(g => g.name.trim());

                gameData = {
                    title: values.title,
                    date: values.date.format('YYYY-MM-DD'),
                    time: timeStr,
                    customLocation: values.customLocation,
                    location: values.customLocation,
                    format: ownFormat,
                    maxPlayers: totalOwnPlayers,
                    minPlayers: guestCount + 1,
                    guestCount,
                    guests: filledGuests,
                    legionPaymentType,
                    organizerCoversAmount: legionPaymentType === 'organizer' ? organizerCoversAmount : 0,
                    price: legionPaymentType === 'self' ? (values.legionPrice || 0) : 0,
                    gameMode: 'own',
                    gameType: 'public',
                    skillLevel: values.skillLevel || 'any',
                    minAge: values.ageGroup ?? null,
                    duration: values.duration || 60,
                    description: values.description || '',
                    recurrence: values.recurrence || 'none',
                    status: 'open',
                    organizerId: currentUser?.id,
                    organizerName: currentUser?.name,
                };
            } else {
                const stadium = stadiums.find(s => s.id === selectedStadium);
                gameData = {
                    title: values.title,
                    date: values.date.format('YYYY-MM-DD'),
                    time: values.time,
                    location: stadium?.name || '',
                    stadiumId: values.stadium,
                    district: stadium?.district,
                    metro: stadium?.metro,
                    maxPlayers: values.maxPlayers,
                    minPlayers: values.minPlayers || Math.floor(values.maxPlayers / 2),
                    description: values.description || '',
                    format: values.format,
                    skillLevel: values.skillLevel || 'any',
                    minAge: values.ageGroup ?? null,
                    duration: values.duration || 60,
                    gameType: gameVisibility,
                    price: pricePerPlayer ?? (stadium?.pricePerHour || 0),
                    gameMode: 'marketplace',
                    status: 'open',
                    organizerId: currentUser?.id,
                    organizerName: currentUser?.name,
                    recurrence: values.recurrence || 'none',
                };
            }

            const result = await createGame(gameData).unwrap();

            // If created from an elan, mark it as converted and notify interested players
            if (elanPrefill?.elanId && result?.id) {
                try {
                    await convertElan({
                        id: elanPrefill.elanId,
                        userId: currentUser?.id,
                        gameId: result.id,
                        gameTitle: gameData.title,
                    }).unwrap();
                } catch (_) { /* non-critical */ }
            }

            if (gameMode === 'own') {
                message.success(t('game.create.ownCreatedSuccess'), 5);
            } else {
                message.success(t('game.create.pendingSuccess'), 6);
            }

            resetForm();
            if (onSuccess) onSuccess(result);
        } catch (error) {
            message.error(error.data?.message || t('game.create.error'));
        }
    };

    // ── Mode selector ────────────────────────────────────────
    if (!gameMode) {
        return (
            <div>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                        fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8,
                    }}>
                        {t('game.create.modeTitle')}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>
                        {t('game.create.modeSubtitle')}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <ModeCard
                        onClick={() => setGameMode('marketplace')}
                        icon="🏟️"
                        title={t('game.create.modeMarketplace')}
                        description={t('game.create.modeMarketplaceDesc')}
                        tags={t('game.create.modeMarketplaceTags').split('|')}
                        color="var(--green)"
                        badge={t('game.create.modeMarketplaceBadge')}
                    />
                    <ModeCard
                        onClick={() => setGameMode('own')}
                        icon="⚽"
                        title={t('game.create.modeOwn')}
                        description={t('game.create.modeOwnDesc')}
                        tags={t('game.create.modeOwnTags').split('|')}
                        color="#7c6af7"
                        badge={t('game.create.modeOwnBadge')}
                    />
                </div>
            </div>
        );
    }

    // ── OWN GAME form ────────────────────────────────────────
    if (gameMode === 'own') {
        const availableOnlySlots = availableSlots.filter(s => s.available);

        const paymentCards = [
            { value: 'self',      icon: '💸', title: t('game.create.ownPaySelf'),      desc: t('game.create.ownPaySelfDesc'),      color: 'var(--green)' },
            { value: 'cash',      icon: '🤝', title: t('game.create.ownPayCash'),      desc: t('game.create.ownPayCashDesc'),      color: '#f5a623' },
            { value: 'organizer', icon: '🎁', title: t('game.create.ownPayOrganizer'), desc: t('game.create.ownPayOrganizerDesc'), color: '#7c6af7' },
        ];

        return (
            <Form form={form} name="createOwnGame" onFinish={onFinish} layout="vertical" requiredMark={false}>
                {/* Back button — hidden when coming from elan */}
                {!elanPrefill && (
                    <button
                        type="button"
                        onClick={() => { setGameMode(null); form.resetFields(); }}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-tertiary)', fontSize: 13, padding: '0 0 20px 0',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}
                    >
                        {t('game.create.changeType')}
                    </button>
                )}

                {/* Elan conversion banner */}
                {elanPrefill && (
                    <div style={{
                        background: 'rgba(245,166,35,0.1)',
                        border: '1px solid rgba(245,166,35,0.35)',
                        borderRadius: 10, padding: '10px 14px',
                        marginBottom: 20, fontSize: 13,
                        color: '#f5a623', display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        📋 Elan əsasında oyun yaradılır. Maraqlananlara bildiriş göndəriləcək.
                    </div>
                )}

                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 14px', borderRadius: 20,
                    background: 'rgba(124,106,247,0.12)',
                    border: '1px solid rgba(124,106,247,0.3)',
                    color: '#a590f7', fontSize: 13, fontWeight: 600,
                    marginBottom: 24,
                }}>
                    {t('game.create.modeOwnBadgeLabel')}
                </div>

                {/* Title */}
                <Form.Item
                    name="title"
                    label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.nameLabel')}</span>}
                    rules={[{ required: true, message: t('game.create.ownValidation.title') }, { min: 3 }]}
                    style={{ marginBottom: 24 }}
                >
                    <Input placeholder={t('game.create.ownTitlePlaceholder')} size="large"
                        onChange={() => { titleTouched.current = true; }} />
                </Form.Item>

                <SectionHeader icon={<EnvironmentOutlined />} title={t('game.create.ownLocationLabel')} subtitle={t('game.create.ownLocationSubtitle')} />

                <Form.Item
                    name="customLocation"
                    rules={[{ required: true, message: t('game.create.ownValidation.location') }]}
                    style={{ marginBottom: 24 }}
                >
                    <Input
                        placeholder={t('game.create.ownLocationPlaceholder')}
                        size="large"
                        prefix={<EnvironmentOutlined style={{ color: 'var(--text-tertiary)' }} />}
                    />
                </Form.Item>

                <SectionHeader icon={<ClockCircleOutlined />} title={t('game.create.ownDateTimeLabel')} />

                <div className="form-grid-2col" style={{ marginBottom: 16 }}>
                    <Form.Item
                        name="date"
                        label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.ownDateLabel')}</span>}
                        rules={[{ required: true, message: t('game.create.ownValidation.date') }]}
                        style={{ marginBottom: 0 }}
                    >
                        <DatePicker locale={datePickerLocale} size="large" style={{ width: '100%' }} format="YYYY.MM.DD"
                            disabledDate={current => current && current < dayjs().startOf('day')} />
                    </Form.Item>
                    <Form.Item
                        name="ownTime"
                        label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.ownTimeLabel')}</span>}
                        rules={[{ required: true, message: t('game.create.ownValidation.time') }]}
                        style={{ marginBottom: 0 }}
                    >
                        <TimePicker
                            format="HH:mm" minuteStep={15} size="large" style={{ width: '100%' }}
                            placeholder={t('game.create.ownTimePlaceholder')}
                        />
                    </Form.Item>
                </div>

                <Form.Item
                    name="duration"
                    label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.ownDurationLabel')}</span>}
                    initialValue={60}
                    style={{ marginBottom: 24 }}
                >
                    <Select size="large">
                        <Option value={60}>{t('game.create.duration60')}</Option>
                        <Option value={90}>{t('game.create.duration90')}</Option>
                        <Option value={120}>{t('game.create.duration120')}</Option>
                    </Select>
                </Form.Item>

                <SectionHeader icon={<TeamOutlined />} title={t('game.create.ownFormatLabel')} />

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                    {Object.keys(FORMAT_PLAYERS).map(fmt => (
                        <button
                            key={fmt} type="button"
                            onClick={() => setOwnFormat(fmt)}
                            style={{
                                padding: '8px 18px', borderRadius: 8,
                                border: `1.5px solid ${ownFormat === fmt ? 'var(--green)' : 'var(--border-color)'}`,
                                background: ownFormat === fmt ? 'rgba(0,232,122,0.1)' : 'transparent',
                                color: ownFormat === fmt ? 'var(--green)' : 'var(--text-secondary)',
                                fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                                fontWeight: 700, fontSize: 15, cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            {fmt}
                        </button>
                    ))}
                </div>

                {/* Guest & legionnaire counters */}
                <SectionHeader
                    icon={<UserAddOutlined />}
                    title={t('game.create.ownRosterLabel')}
                    subtitle={t('game.create.ownRosterSubtitle')}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                    <CounterControl
                        value={guestCount}
                        onChange={setGuestCount}
                        min={0}
                        max={ownMaxPlayers - 1}
                        label={t('game.create.ownGuestLabel')}
                        sublabel={t('game.create.ownGuestSub')}
                        color="#7c6af7"
                    />
                    <CounterControl
                        value={openSlots}
                        onChange={setOpenSlots}
                        min={1}
                        max={ownMaxPlayers - guestCount}
                        label={t('game.create.ownLegionLabel')}
                        sublabel={t('game.create.ownLegionSub')}
                        color="var(--green)"
                    />
                </div>

                <div style={{
                    padding: '12px 16px', borderRadius: 10, marginBottom: 24,
                    background: 'rgba(0,232,122,0.06)',
                    border: '1px solid rgba(0,232,122,0.2)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
                }}>
                    <div style={{ display: 'flex', gap: 20 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                            {t('game.create.ownTotalLabel')}<br />
                            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif" }}>
                                {totalOwnPlayers} / {ownMaxPlayers}
                            </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                            {t('game.create.ownMyCount')}<br />
                            <span style={{ fontSize: 16, fontWeight: 700, color: '#a590f7', fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif" }}>{guestCount}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                            {t('game.create.ownLookingFor')}<br />
                            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)', fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif" }}>{openSlots}</span>
                        </div>
                    </div>
                    {totalOwnPlayers >= ownMaxPlayers && (
                        <div style={{ fontSize: 12, color: '#f5a623', fontWeight: 500 }}>
                            {t('game.create.ownFullRoster', { format: ownFormat })}
                        </div>
                    )}
                </div>

                <SectionHeader
                    icon={<WalletOutlined />}
                    title={t('game.create.ownPaymentLabel')}
                    subtitle={t('game.create.ownPaymentSubtitle')}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: legionPaymentType === 'self' || legionPaymentType === 'organizer' ? 16 : 24 }}>
                    {paymentCards.map(card => {
                        const active = legionPaymentType === card.value;
                        return (
                            <div
                                key={card.value}
                                onClick={() => setLegionPaymentType(card.value)}
                                style={{
                                    padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                                    border: `1.5px solid ${active ? card.color : 'var(--border-color)'}`,
                                    background: active ? `${card.color === 'var(--green)' ? 'rgba(0,232,122,0.06)' : card.color === '#f5a623' ? 'rgba(245,166,35,0.06)' : 'rgba(124,106,247,0.06)'}` : 'transparent',
                                    transition: 'all 0.15s',
                                    display: 'flex', alignItems: 'center', gap: 14, position: 'relative',
                                }}
                            >
                                {active && <CheckCircleFilled style={{ position: 'absolute', top: 12, right: 12, color: card.color, fontSize: 16 }} />}
                                <span style={{ fontSize: 24, flexShrink: 0 }}>{card.icon}</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{card.title}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{card.desc}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legion price (self pay) */}
                {legionPaymentType === 'self' && (
                    <Form.Item
                        name="legionPrice"
                        label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.ownLegionPriceLabel')}</span>}
                        rules={[{ required: true, message: t('game.create.ownValidation.price') }]}
                        style={{ marginBottom: 24 }}
                    >
                        <InputNumber
                            min={0} max={200} step={1} size="large"
                            style={{ width: '100%' }}
                            placeholder="10"
                            addonAfter="₼"
                        />
                    </Form.Item>
                )}

                {/* Organizer pays amount */}
                {legionPaymentType === 'organizer' && (
                    <div style={{
                        padding: '16px', borderRadius: 12, marginBottom: 24,
                        background: 'rgba(124,106,247,0.08)',
                        border: '1px solid rgba(124,106,247,0.25)',
                    }}>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                            💳 {t('game.create.ownOrgCoversLabel')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <InputNumber
                                min={0} max={200} value={organizerCoversAmount}
                                onChange={v => setOrganizerCoversAmount(v || 0)}
                                size="large" addonAfter="₼"
                                style={{ width: 160 }}
                            />
                            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                                × {openSlots} слота = <strong style={{ color: '#a590f7' }}>{organizerCoversAmount * openSlots} ₼</strong> спишется при создании
                            </div>
                        </div>
                    </div>
                )}

                {/* Guest names — shown by default with "Qonaq N" placeholders */}
                {guestCount > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <div style={{
                            fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
                            marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <UserAddOutlined style={{ color: '#a590f7' }} />
                            {t('game.create.ownGuestNamesLabel')}
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>
                                {t('game.create.ownGuestNamesHint')}
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {guestNames.map((g, i) => (
                                <Input
                                    key={g.id}
                                    value={g.name}
                                    size="large"
                                    onChange={e => setGuestNames(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                                    prefix={
                                        <span style={{
                                            color: '#a590f7', fontSize: 12, fontWeight: 700,
                                            minWidth: 20, fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                                        }}>
                                            {i + 1}
                                        </span>
                                    }
                                    style={{ background: 'var(--bg-raised)' }}
                                />
                            ))}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
                            {t('game.create.ownGuestFieldHint')}
                        </div>
                    </div>
                )}

                {/* Optional details */}
                <SectionHeader icon={<InfoCircleOutlined />} title={t('game.create.ownExtrasLabel')} subtitle={t('game.create.ownExtrasSubtitle')} />

                <div className="form-grid-2col" style={{ marginBottom: 16 }}>
                    <Form.Item
                        name="skillLevel"
                        label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.ownSkillLabel')}</span>}
                        initialValue="any"
                        style={{ marginBottom: 0 }}
                    >
                        <Select size="large">
                            <Option value="any">🌐 {t('game.create.skillLevelAny')}</Option>
                            <Option value="beginner">🟢 {t('game.create.skillLevelBeginner')}</Option>
                            <Option value="intermediate">🟡 {t('game.create.skillLevelIntermediate')}</Option>
                            <Option value="advanced">🔴 {t('game.create.skillLevelAdvanced')}</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="ageGroup"
                        label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.ownAgeLabel')}</span>}
                        initialValue={null}
                        style={{ marginBottom: 0 }}
                    >
                        <Select size="large" allowClear placeholder={t('game.create.ageGroupAny')}>
                            <Option value={null}>🌐 Любой</Option>
                            <Option value={30}>🔵 30+</Option>
                            <Option value={35}>🟣 35+</Option>
                            <Option value={40}>🟡 40+</Option>
                            <Option value={45}>🟠 45+</Option>
                            <Option value={50}>🔴 50+</Option>
                        </Select>
                    </Form.Item>
                </div>

                <Form.Item
                    name="description"
                    label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.ownDescLabel')}</span>}
                    style={{ marginBottom: 28 }}
                >
                    <TextArea placeholder={t('game.create.ownDescPlaceholder')} rows={3} maxLength={500} showCount />
                </Form.Item>

                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        width: '100%', height: 52,
                        background: isLoading ? 'var(--bg-raised)' : 'linear-gradient(135deg, #7c6af7 0%, #5c4fd6 100%)',
                        border: 'none', borderRadius: 12,
                        color: isLoading ? 'var(--text-tertiary)' : '#fff',
                        fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                        fontWeight: 800, fontSize: 16, cursor: isLoading ? 'default' : 'pointer',
                        transition: 'opacity 0.15s, transform 0.15s',
                        boxShadow: isLoading ? 'none' : '0 0 24px rgba(124,106,247,0.35)',
                    }}
                    onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'scale(1.01)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    {isLoading ? '...' : t('game.create.ownCreateBtn', { n: openSlots })}
                </button>
            </Form>
        );
    }

    // ── MARKETPLACE form (existing) ──────────────────────────
    const availableOnlySlots = availableSlots.filter(s => s.available);

    const visibilityCards = [
        {
            value: 'public',
            icon: <GlobalOutlined />,
            title: t('game.create.publicType'),
            description: t('game.create.publicDesc'),
            note: t('game.create.publicPrice'),
            color: 'var(--green)',
        },
        {
            value: 'private',
            icon: <LockOutlined />,
            title: t('game.create.privateType'),
            description: t('game.create.privateDesc'),
            note: t('game.create.privatePrice'),
            color: '#4f86f7',
        },
    ];

    return (
        <Form form={form} name="createGame" onFinish={onFinish} layout="vertical" requiredMark={false}>
            {/* Back button */}
            <button
                type="button"
                onClick={() => { setGameMode(null); form.resetFields(); }}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-tertiary)', fontSize: 13, padding: '0 0 20px 0',
                    display: 'flex', alignItems: 'center', gap: 6,
                }}
            >
                ← Изменить тип
            </button>

            {/* Mode badge */}
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 20,
                background: 'rgba(0,232,122,0.1)',
                border: '1px solid rgba(0,232,122,0.25)',
                color: 'var(--green)', fontSize: 13, fontWeight: 600,
                marginBottom: 24,
            }}>
                {t('game.create.modeMarketplaceBadgeLabel')}
            </div>

            {/* Title */}
            <Form.Item
                name="title"
                label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.nameLabel')}</span>}
                rules={[{ required: true, message: t('game.create.namePlaceholder') }, { min: 3, message: t('game.create.nameMinLength') }]}
                style={{ marginBottom: 24 }}
            >
                <Input placeholder={t('game.create.nameExample')} size="large" onChange={() => { titleTouched.current = true; }} />
            </Form.Item>

            {/* Stadium */}
            <SectionHeader icon={<BankOutlined />} title={t('game.create.stadiumLabel')} subtitle={t('game.create.stadiumHint')} />

            <div className="form-grid-2col" style={{ marginBottom: 0 }}>
                <Form.Item name="district" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.districtLabel')}</span>} style={{ marginBottom: 16 }}>
                    <Select placeholder={t('game.create.districtAll')} size="large" allowClear onChange={v => { setSelectedDistrict(v || null); form.setFieldValue('stadium', undefined); form.setFieldValue('time', undefined); setSelectedStadium(null); setAvailableSlots([]); }}>
                        {districts.map(d => <Option key={d.id} value={d.name}>{d.name}</Option>)}
                    </Select>
                </Form.Item>
                <Form.Item name="metro" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.metroLabel')}</span>} style={{ marginBottom: 16 }}>
                    <Select placeholder={t('game.create.metroAll')} size="large" allowClear onChange={v => { setSelectedMetro(v || null); form.setFieldValue('stadium', undefined); form.setFieldValue('time', undefined); setSelectedStadium(null); setAvailableSlots([]); }}>
                        {metros.map(m => <Option key={m.id} value={m.name}>{m.name}</Option>)}
                    </Select>
                </Form.Item>
            </div>

            <Form.Item
                name="stadium"
                label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.stadiumSelect')}</span>}
                rules={[{ required: true, message: t('game.create.validation.selectStadium') }]}
                style={{ marginBottom: selectedStadium ? 12 : 24 }}
            >
                <Select placeholder={t('game.create.stadiumSelect')} size="large" showSearch optionFilterProp="children"
                    onChange={v => { setSelectedStadium(v); form.setFieldValue('time', undefined); }}>
                    {filteredStadiums.map(s => (
                        <Option key={s.id} value={s.id}>
                            {s.name} — {s.location}
                            <span style={{ color: 'var(--text-tertiary)', marginLeft: 8 }}>{s.pricePerHour}{t('common.perHour')}</span>
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            {selectedStadiumData && (
                <div style={{ marginBottom: 24, padding: '12px 16px', background: 'rgba(0,232,122,0.04)', border: '1px solid rgba(0,232,122,0.15)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{selectedStadiumData.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                <span><EnvironmentOutlined style={{ marginRight: 3 }} />{selectedStadiumData.location}</span>
                                {selectedStadiumData.openTime && selectedStadiumData.closeTime && (
                                    <span><ClockCircleOutlined style={{ marginRight: 3 }} />{selectedStadiumData.openTime}–{selectedStadiumData.closeTime}</span>
                                )}
                                <span style={{ color: 'var(--green)', fontWeight: 600 }}><WalletOutlined style={{ marginRight: 3 }} />{selectedStadiumData.pricePerHour} ₼/ч</span>
                            </div>
                        </div>
                        {selectedStadiumData.images?.filter(Boolean).length > 0 && (
                            <Image.PreviewGroup>
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                    {selectedStadiumData.images.filter(Boolean).slice(0, 3).map((img, i) => (
                                        <Image key={i} width={52} height={40} src={img}
                                            style={{ objectFit: 'cover', borderRadius: 6, cursor: 'pointer' }}
                                            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                                        />
                                    ))}
                                </div>
                            </Image.PreviewGroup>
                        )}
                    </div>
                </div>
            )}

            {/* Date & Time */}
            <SectionHeader icon={<ClockCircleOutlined />} title={t('game.create.dateTimeLabel')} />

            <Form.Item name="date" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.dateLabel')}</span>}
                rules={[{ required: true, message: t('game.create.validation.selectDate') }]} style={{ marginBottom: 16 }}>
                <DatePicker locale={datePickerLocale} placeholder={t('game.create.datePlaceholder')} size="large" style={{ width: '100%' }} format="YYYY.MM.DD"
                    disabledDate={current => current && current < dayjs().startOf('day')}
                    onChange={date => { setSelectedDate(date); form.setFieldValue('time', undefined); }} />
            </Form.Item>

            <Form.Item name="duration" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.durationLabel')}</span>}
                initialValue={60} rules={[{ required: true, message: t('game.create.validation.selectDuration') }]} style={{ marginBottom: 16 }}>
                <Select size="large" onChange={val => { setSelectedDuration(val); form.setFieldValue('time', undefined); }}>
                    <Option value={60}>{t('game.create.duration60')}</Option>
                    <Option value={90}>{t('game.create.duration90')}</Option>
                    <Option value={120}>{t('game.create.duration120')}</Option>
                </Select>
            </Form.Item>

            <Form.Item name="time" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.timeLabel')}</span>}
                rules={[{ required: true, message: t('game.create.validation.selectDate') }]} style={{ marginBottom: 24 }}>
                <Select
                    placeholder={loadingSlots ? t('game.create.loading') : !selectedStadium ? t('game.create.selectStadiumFirst') : !selectedDate ? 'Сначала выберите дату' : t('game.create.selectSlot')}
                    size="large"
                    disabled={!selectedStadium || !selectedDate || loadingSlots}
                    notFoundContent={loadingSlots ? <Spin size="small" /> : t('game.create.noSlots')}
                >
                    {availableOnlySlots.map(slot => (
                        <Option key={slot.time} value={slot.time}>{slot.time} – {computeEndTime(slot.time, selectedDuration)}</Option>
                    ))}
                </Select>
            </Form.Item>

            {/* Visibility */}
            <SectionHeader icon={<LockOutlined />} title={t('game.create.gameTypeLabel')} />

            <div className="form-grid-2col" style={{ marginBottom: 20 }}>
                {visibilityCards.map(card => {
                    const active = gameVisibility === card.value;
                    return (
                        <div key={card.value} onClick={() => setGameVisibility(card.value)} style={{
                            padding: '14px 16px', borderRadius: 10,
                            border: `1.5px solid ${active ? card.color : 'var(--border-color)'}`,
                            background: active ? (card.color === 'var(--green)' ? 'rgba(0,232,122,0.08)' : 'rgba(79,134,247,0.08)') : 'transparent',
                            cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
                        }}>
                            {active && <CheckCircleFilled style={{ position: 'absolute', top: 10, right: 10, color: card.color, fontSize: 16 }} />}
                            <div style={{ fontSize: 18, marginBottom: 6, color: card.color }}>{card.icon}</div>
                            <div style={{ fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 2, color: 'var(--text-primary)' }}>{card.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>{card.description}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: card.color }}>{card.note}</div>
                        </div>
                    );
                })}
            </div>

            {gameVisibility === 'private' && (
                <Alert message={t('game.create.privateHint')} type="info" showIcon style={{ marginBottom: 20 }} />
            )}

            {/* Format */}
            <SectionHeader icon={<TeamOutlined />} title={t('game.create.formatLabel')} />

            <div className="form-grid-2col" style={{ marginBottom: 16 }}>
                <Form.Item name="format" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.formatSelect')}</span>}
                    rules={[{ required: true, message: t('game.create.validation.selectFormat') }]} style={{ marginBottom: 0 }}>
                    <Select placeholder="5×5, 7×7..." size="large" onChange={value => {
                        setSelectedFormat(value);
                        const players = FORMAT_PLAYERS[value];
                        if (players) { form.setFieldValue('maxPlayers', players); setMaxPlayers(players); }
                    }}>
                        <Option value="5x5">5 × 5</Option>
                        <Option value="6x6">6 × 6</Option>
                        <Option value="7x7">7 × 7</Option>
                        <Option value="8x8">8 × 8</Option>
                        <Option value="11x11">11 × 11</Option>
                    </Select>
                </Form.Item>
                <Form.Item name="maxPlayers" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.maxPlayersLabel')}</span>}
                    rules={[{ required: true, message: t('game.create.maxPlayersPlaceholder') }]} style={{ marginBottom: 0 }}>
                    <InputNumber min={4} max={30} placeholder="10" size="large" style={{ width: '100%' }} onChange={val => setMaxPlayers(val)} />
                </Form.Item>
            </div>

            <Form.Item name="skillLevel" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.skillLevelLabel')}</span>}
                initialValue="any" style={{ marginBottom: 16 }}>
                <Select size="large">
                    <Option value="any"><span style={{ marginRight: 8 }}>🌐</span>{t('game.create.skillLevelAny')}</Option>
                    <Option value="beginner"><span style={{ marginRight: 8 }}>🟢</span>{t('game.create.skillLevelBeginner')}</Option>
                    <Option value="intermediate"><span style={{ marginRight: 8 }}>🟡</span>{t('game.create.skillLevelIntermediate')}</Option>
                    <Option value="advanced"><span style={{ marginRight: 8 }}>🔴</span>{t('game.create.skillLevelAdvanced')}</Option>
                </Select>
            </Form.Item>

            <Form.Item name="ageGroup" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>👴 {t('game.create.ageGroupLabel')}</span>}
                initialValue={null} style={{ marginBottom: 16 }}>
                <Select size="large" allowClear placeholder={t('game.create.ageGroupAny')}>
                    <Option value={null}>🌐 {t('game.create.ageGroupAny')}</Option>
                    <Option value={30}>🔵 30+</Option><Option value={35}>🟣 35+</Option>
                    <Option value={40}>🟡 40+</Option><Option value={45}>🟠 45+</Option>
                    <Option value={50}>🔴 50+</Option>
                </Select>
            </Form.Item>

            <Form.Item name="minPlayers" label={<span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
                {t('game.create.minStartLabel')} <InfoCircleOutlined style={{ color: 'var(--text-tertiary)' }} title={t('game.create.minStartTooltip')} />
            </span>} style={{ marginBottom: 16 }}>
                <InputNumber min={2} max={30} placeholder={t('game.create.minPlayersAuto')} size="large" style={{ width: '100%' }} />
            </Form.Item>

            {pricePerPlayer !== null && (
                <div style={{ marginBottom: 20, padding: '14px 16px', background: 'rgba(0,232,122,0.06)', border: '1px solid rgba(0,232,122,0.2)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{t('game.create.priceRent')}<br /><span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{selectedStadiumData?.pricePerHour} ₼/ч</span></div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{t('game.create.pricePlayers')}<br /><span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{maxPlayers}</span></div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>{t('game.create.pricePerPlayerLabel')}</div>
                        <div style={{ fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif", fontWeight: 800, fontSize: 22, color: 'var(--green)' }}>~{pricePerPlayer} ₼</div>
                    </div>
                </div>
            )}

            <Form.Item name="description" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.descriptionLabel')}</span>} style={{ marginBottom: 16 }}>
                <TextArea placeholder={t('game.create.descriptionPlaceholder')} rows={3} maxLength={500} showCount />
            </Form.Item>

            <Form.Item name="recurrence" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.recurrenceLabel')}</span>}
                initialValue="none" style={{ marginBottom: 28 }}>
                <Select size="large">
                    <Option value="none">{t('game.create.recurrenceNone')}</Option>
                    <Option value="weekly">{t('game.create.recurrenceWeekly')}</Option>
                    <Option value="biweekly">{t('game.create.recurrenceBiweekly')}</Option>
                </Select>
            </Form.Item>

            <Form.Item name="stadiumConfirmed" valuePropName="checked"
                rules={[{ validator: (_, val) => val ? Promise.resolve() : Promise.reject(t('game.create.stadiumConfirmRequired')) }]}
                style={{ marginBottom: 20 }}>
                <Checkbox style={{ fontFamily: 'Outfit,sans-serif', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {t('game.create.stadiumConfirmLabel')}
                </Checkbox>
            </Form.Item>

            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 12, lineHeight: 1.5 }}>
                {t('game.create.moderationNotice')}
            </p>

            <button type="submit" disabled={isLoading} style={{
                width: '100%', height: 50,
                background: isLoading ? 'var(--bg-raised)' : 'var(--green)',
                border: 'none', borderRadius: 10,
                color: isLoading ? 'var(--text-tertiary)' : '#060c18',
                fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif", fontWeight: 800,
                fontSize: 16, cursor: isLoading ? 'default' : 'pointer',
                transition: 'opacity 0.15s',
                boxShadow: isLoading ? 'none' : '0 0 24px rgba(0,232,122,0.3)',
            }}
                onMouseEnter={e => { if (!isLoading) e.currentTarget.style.opacity = '0.88'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
                {isLoading ? '...' : t('game.create.createBtn')}
            </button>
        </Form>
    );
};

// ── Mode selection card ──────────────────────────────────────
const ModeCard = ({ onClick, icon, title, description, tags, color, badge }) => {
    const [hovered, setHovered] = useState(false);
    const isGreen = color === 'var(--green)';
    const glowColor = isGreen ? 'rgba(0,232,122,0.12)' : 'rgba(124,106,247,0.15)';
    const tintColor = isGreen ? 'rgba(0,232,122,0.06)' : 'rgba(124,106,247,0.06)';
    const badgeBg  = isGreen ? 'rgba(0,232,122,0.12)' : 'rgba(124,106,247,0.12)';

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                padding: '20px 20px 20px 24px',
                borderRadius: 14,
                border: `1.5px solid ${hovered ? color : 'var(--border-color)'}`,
                background: hovered ? tintColor : 'var(--bg-raised)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                transform: hovered ? 'translateY(-2px)' : 'none',
                boxShadow: hovered ? `0 8px 28px ${glowColor}` : 'none',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Left accent bar */}
            <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                background: hovered ? color : 'transparent',
                transition: 'background 0.18s',
                borderRadius: '14px 0 0 14px',
            }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                {/* Icon */}
                <div style={{
                    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                    background: badgeBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, transition: 'transform 0.18s',
                    transform: hovered ? 'scale(1.08)' : 'scale(1)',
                }}>
                    {icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title row with badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{
                            fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                            fontWeight: 800, fontSize: 17, color: 'var(--text-primary)',
                        }}>
                            {title}
                        </span>
                        {badge && (
                            <span style={{
                                padding: '2px 9px', borderRadius: 6,
                                background: badgeBg,
                                color, fontSize: 10, fontWeight: 700,
                                letterSpacing: '0.4px', flexShrink: 0,
                                border: `1px solid ${isGreen ? 'rgba(0,232,122,0.2)' : 'rgba(124,106,247,0.2)'}`,
                            }}>
                                {badge}
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.5, marginBottom: 12 }}>
                        {description}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {tags.map(tag => (
                            <span key={tag} style={{
                                padding: '3px 10px', borderRadius: 6,
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500,
                            }}>
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Arrow */}
                <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: hovered ? badgeBg : 'transparent',
                    border: `1.5px solid ${hovered ? color : 'var(--border-color)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.18s',
                    color: hovered ? color : 'var(--text-tertiary)',
                    fontSize: 14, marginTop: 10,
                    transform: hovered ? 'translateX(3px)' : 'none',
                }}>
                    →
                </div>
            </div>
        </div>
    );
};

export default CreateGameForm;
