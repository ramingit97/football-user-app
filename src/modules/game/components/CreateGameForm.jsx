import { useState, useEffect } from 'react';
import {
    Form, Input, DatePicker, InputNumber,
    Select, message, Spin,
} from 'antd';
import {
    EnvironmentOutlined, ClockCircleOutlined, WalletOutlined,
    DownOutlined, UpOutlined, InfoCircleOutlined,
    PlusOutlined, MinusOutlined,
} from '@ant-design/icons';
import ruLocale from 'antd/es/date-picker/locale/ru_RU';
import azLocale from 'antd/es/date-picker/locale/az_AZ';
import { useTranslation } from 'react-i18next';
import { useCreateGameMutation } from '../../../store/gamesApi';
import { useConvertElanMutation } from '../../../store/elanlarApi';
import axios from 'axios';
import { API_BASE } from '../../../config.js';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const FORMAT_PLAYERS = { '5x5': 10, '6x6': 12, '7x7': 14, '8x8': 16, '11x11': 22 };
const FORMATS = ['5x5', '6x6', '7x7', '8x8', '11x11'];

const computeEndTime = (startTime, durationMinutes) => {
    const [h, m] = startTime.split(':').map(Number);
    const total = h * 60 + m + durationMinutes;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

/* ── Question block wrapper ──────────────────────────────── */
const QuestionBlock = ({ number, emoji, label, children }) => (
    <div style={{
        marginBottom: 16,
        padding: '18px 20px 20px',
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-color)',
        borderRadius: 16,
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: 'rgba(0,232,122,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800,
                color: 'var(--green)',
                fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                flexShrink: 0,
            }}>
                {number}
            </div>
            <span style={{ fontSize: 17 }}>{emoji}</span>
            <span style={{
                fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                fontWeight: 700, fontSize: 15,
                color: 'var(--text-primary)',
            }}>
                {label}
            </span>
        </div>
        {children}
    </div>
);

/* ── Main component ──────────────────────────────────────── */
const CreateGameForm = ({ onSuccess, elanPrefill = null }) => {
    const [form] = Form.useForm();
    const { t, i18n } = useTranslation();
    const datePickerLocale = i18n.language === 'az' ? azLocale : ruLocale;
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const [createGame, { isLoading }] = useCreateGameMutation();
    const [convertElan] = useConvertElanMutation();

    const [format, setFormat] = useState(elanPrefill?.format || '6x6');
    const [alreadyHave, setAlreadyHave] = useState(0);
    const [useCustomLocation, setUseCustomLocation] = useState(!!elanPrefill);
    const [showExtras, setShowExtras] = useState(false);

    const [stadiums, setStadiums] = useState([]);
    const [selectedStadium, setSelectedStadium] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState(60);

    const maxPlayers = FORMAT_PLAYERS[format] || 12;
    const freeSlots = maxPlayers - alreadyHave;
    const selectedStadiumData = stadiums.find(s => s.id === selectedStadium);

    useEffect(() => {
        axios.get(`${API_BASE}/api/stadiums`)
            .then(r => setStadiums(r.data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!selectedStadium || !selectedDate) { setAvailableSlots([]); return; }
        setLoadingSlots(true);
        axios.get(`${API_BASE}/api/stadiums/${selectedStadium}/available-slots?date=${selectedDate.format('YYYY-MM-DD')}`)
            .then(r => setAvailableSlots(r.data))
            .catch(() => setAvailableSlots([]))
            .finally(() => setLoadingSlots(false));
    }, [selectedStadium, selectedDate]);

    useEffect(() => {
        if (!elanPrefill) return;
        const fields = {};
        if (elanPrefill.date) fields.date = dayjs(elanPrefill.date);
        if (elanPrefill.time) {
            const [h, m] = elanPrefill.time.split(':');
            fields.time = dayjs().hour(Number(h)).minute(Number(m)).second(0);
        }
        if (Object.keys(fields).length) form.setFieldsValue(fields);
    }, [elanPrefill]);

    const resetAll = () => {
        form.resetFields();
        setFormat('6x6');
        setAlreadyHave(0);
        setSelectedStadium(null);
        setSelectedDate(null);
        setAvailableSlots([]);
        setShowExtras(false);
        if (!elanPrefill) setUseCustomLocation(false);
    };

    const onFinish = async (values) => {
        try {
            const stadiumData = stadiums.find(s => s.id === selectedStadium);
            const timeStr = values.time || '';
            const locationName = useCustomLocation
                ? (values.customLocation || '')
                : (stadiumData?.name || '');

            const lang = i18n.language === 'az' ? 'az' : 'ru';
            const dateLabel = values.date
                ? values.date.locale(lang).format('D MMM')
                : '';
            const autoTitle = `${format} · ${locationName} · ${dateLabel}`;

            const gameData = {
                title: autoTitle,
                date: values.date.format('YYYY-MM-DD'),
                time: timeStr,
                location: locationName,
                format,
                maxPlayers,
                minPlayers: values.minPlayersOverride
                    || (alreadyHave > 0
                        ? Math.max(1, freeSlots)
                        : Math.floor(maxPlayers / 2)),
                guestCount: alreadyHave,
                skillLevel: values.skillLevel || 'any',
                minAge: values.ageGroup ?? null,
                duration: values.duration || 60,
                description: values.description || '',
                recurrence: values.recurrence || 'none',
                gameType: values.gameType || 'public',
                price: values.price || 0,
                gameMode: useCustomLocation ? 'own' : 'marketplace',
                status: 'open',
                organizerId: currentUser?.id,
                organizerName: currentUser?.name,
                ...(useCustomLocation ? {
                    customLocation: values.customLocation,
                } : {
                    stadiumId: selectedStadium,
                    district: stadiumData?.district,
                    metro: stadiumData?.metro,
                }),
            };

            const result = await createGame(gameData).unwrap();

            if (elanPrefill?.elanId && result?.id) {
                try {
                    await convertElan({
                        id: elanPrefill.elanId,
                        userId: currentUser?.id,
                        gameId: result.id,
                        gameTitle: gameData.title,
                    }).unwrap();
                } catch (_) {}
            }

            message.success(t('game.create.simple.successMsg'), 5);
            resetAll();
            if (onSuccess) onSuccess(result);
        } catch (error) {
            message.error(error.data?.message || t('game.create.error'));
        }
    };

    const availableOnlySlots = availableSlots.filter(s => s.available);

    return (
        <Form form={form} name="createGameSimple" onFinish={onFinish} layout="vertical" requiredMark={false}>

            {/* Elan banner */}
            {elanPrefill && (
                <div style={{
                    background: 'rgba(245,166,35,0.1)',
                    border: '1px solid rgba(245,166,35,0.3)',
                    borderRadius: 10, padding: '10px 14px',
                    marginBottom: 16, fontSize: 13,
                    color: '#f5a623', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    📋 {t('game.create.simple.elanBanner')}
                </div>
            )}

            {/* ── 1: Where ───────────────────────────────────── */}
            <QuestionBlock number="1" emoji="🏟️" label={t('game.create.simple.whereLabel')}>
                {!useCustomLocation ? (
                    <>
                        <Form.Item
                            name="stadium"
                            rules={[{ required: true, message: t('game.create.validation.selectStadium') }]}
                            style={{ marginBottom: 8 }}
                        >
                            <Select
                                placeholder={t('game.create.simple.stadiumPlaceholder')}
                                size="large"
                                showSearch
                                optionFilterProp="label"
                                options={stadiums.map(s => ({
                                    value: s.id,
                                    label: `${s.name}${s.district ? ' · ' + s.district : ''}`,
                                    raw: s,
                                }))}
                                optionRender={opt => (
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{opt.data.raw?.name}</div>
                                        {opt.data.raw?.district && (
                                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                                                {opt.data.raw.district}
                                                {opt.data.raw.pricePerHour ? ` · ${opt.data.raw.pricePerHour} ₼/ч` : ''}
                                            </div>
                                        )}
                                    </div>
                                )}
                                onChange={v => {
                                    setSelectedStadium(v);
                                    form.setFieldValue('time', undefined);
                                    setAvailableSlots([]);
                                }}
                            />
                        </Form.Item>

                        {/* Stadium info pill */}
                        {selectedStadiumData && (
                            <div style={{
                                padding: '8px 12px',
                                background: 'rgba(0,232,122,0.05)',
                                border: '1px solid rgba(0,232,122,0.15)',
                                borderRadius: 8, fontSize: 12,
                                color: 'var(--text-tertiary)',
                                display: 'flex', flexWrap: 'wrap', gap: 14,
                                marginBottom: 10,
                            }}>
                                <span><EnvironmentOutlined style={{ marginRight: 4 }} />{selectedStadiumData.location}</span>
                                {selectedStadiumData.pricePerHour > 0 && (
                                    <span style={{ color: 'var(--green)', fontWeight: 600 }}>
                                        <WalletOutlined style={{ marginRight: 4 }} />{selectedStadiumData.pricePerHour} ₼/ч
                                    </span>
                                )}
                                {selectedStadiumData.openTime && (
                                    <span>
                                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                                        {selectedStadiumData.openTime}–{selectedStadiumData.closeTime}
                                    </span>
                                )}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                setUseCustomLocation(true);
                                setSelectedStadium(null);
                                form.setFieldValue('stadium', undefined);
                                form.setFieldValue('time', undefined);
                                setAvailableSlots([]);
                            }}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-tertiary)', fontSize: 12, padding: 0,
                                textDecoration: 'underline',
                            }}
                        >
                            {t('game.create.simple.customLocationLink')}
                        </button>
                    </>
                ) : (
                    <>
                        <Form.Item
                            name="customLocation"
                            rules={[{ required: true, message: t('game.create.ownValidation.location') }]}
                            style={{ marginBottom: 8 }}
                        >
                            <Input
                                placeholder={t('game.create.simple.customLocationPlaceholder')}
                                size="large"
                                prefix={<EnvironmentOutlined style={{ color: 'var(--text-tertiary)' }} />}
                            />
                        </Form.Item>
                        {!elanPrefill && (
                            <button
                                type="button"
                                onClick={() => {
                                    setUseCustomLocation(false);
                                    form.setFieldValue('customLocation', undefined);
                                }}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--text-tertiary)', fontSize: 12, padding: 0,
                                    textDecoration: 'underline',
                                }}
                            >
                                {t('game.create.simple.backToList')}
                            </button>
                        )}
                    </>
                )}
            </QuestionBlock>

            {/* ── 2: When ────────────────────────────────────── */}
            <QuestionBlock number="2" emoji="📅" label={t('game.create.simple.whenLabel')}>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Form.Item
                        name="date"
                        rules={[{ required: true, message: t('game.create.validation.selectDate') }]}
                        style={{ flex: 1, marginBottom: 0 }}
                    >
                        <DatePicker
                            locale={datePickerLocale}
                            size="large"
                            style={{ width: '100%' }}
                            format="DD.MM.YYYY"
                            placeholder={t('game.create.simple.datePlaceholder')}
                            disabledDate={current => current && current < dayjs().startOf('day')}
                            onChange={date => {
                                setSelectedDate(date);
                                form.setFieldValue('time', undefined);
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="time"
                        rules={[{ required: true, message: t('game.create.ownValidation.time') }]}
                        style={{ flex: 1, marginBottom: 0 }}
                    >
                        {useCustomLocation ? (
                            <Select
                                size="large"
                                style={{ width: '100%' }}
                                placeholder={t('game.create.simple.timePlaceholder')}
                                options={Array.from({ length: 15 }, (_, i) => {
                                    const h = i + 8;
                                    const start = `${String(h).padStart(2, '0')}:00`;
                                    const end = `${String(h + 1).padStart(2, '0')}:00`;
                                    return { value: start, label: `${start} – ${end}` };
                                })}
                            />
                        ) : (
                            <Select
                                size="large"
                                placeholder={
                                    loadingSlots ? t('game.create.loading')
                                    : !selectedStadium ? t('game.create.selectStadiumFirst')
                                    : !selectedDate ? t('game.create.simple.selectDateFirst')
                                    : t('game.create.selectSlot')
                                }
                                disabled={!selectedStadium || !selectedDate || loadingSlots}
                                notFoundContent={loadingSlots ? <Spin size="small" /> : t('game.create.noSlots')}
                            >
                                {availableOnlySlots.map(slot => (
                                    <Option key={slot.time} value={slot.time}>
                                        {slot.time} – {computeEndTime(slot.time, selectedDuration)}
                                    </Option>
                                ))}
                            </Select>
                        )}
                    </Form.Item>
                </div>
            </QuestionBlock>

            {/* ── 3: Format ──────────────────────────────────── */}
            <QuestionBlock number="3" emoji="⚽" label={t('game.create.simple.formatLabel')}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {FORMATS.map(fmt => {
                        const active = format === fmt;
                        return (
                            <button
                                key={fmt}
                                type="button"
                                onClick={() => {
                                    setFormat(fmt);
                                    setAlreadyHave(prev => Math.min(prev, FORMAT_PLAYERS[fmt] - 1));
                                }}
                                style={{
                                    position: 'relative',
                                    padding: '10px 22px',
                                    borderRadius: 10,
                                    border: `2px solid ${active ? 'var(--green)' : 'var(--border-color)'}`,
                                    background: active ? 'rgba(0,232,122,0.12)' : 'var(--bg-secondary)',
                                    color: active ? 'var(--green)' : 'var(--text-secondary)',
                                    fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                                    fontWeight: 800, fontSize: 15, cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    boxShadow: active ? '0 0 12px rgba(0,232,122,0.2)' : 'none',
                                }}
                            >
                                {fmt}
                                {fmt === '6x6' && !active && (
                                    <span style={{
                                        position: 'absolute', top: -7, right: -4,
                                        background: '#f5a623', color: '#000',
                                        fontSize: 8, fontWeight: 800,
                                        padding: '1px 5px', borderRadius: 4,
                                        fontFamily: 'Outfit,sans-serif',
                                        letterSpacing: '0.3px',
                                    }}>
                                        {t('game.create.simple.topBadge')}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {t('game.create.simple.totalPlayers', { n: maxPlayers })}
                </div>
            </QuestionBlock>

            {/* ── 4: Already have players ────────────────────── */}
            <QuestionBlock number="4" emoji="👥" label={t('game.create.simple.alreadyLabel')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Counter */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={() => setAlreadyHave(prev => Math.max(0, prev - 1))}
                            disabled={alreadyHave <= 0}
                            style={{
                                width: 40, height: 40, borderRadius: '10px 0 0 10px',
                                border: '1.5px solid var(--border-color)',
                                background: alreadyHave <= 0 ? 'transparent' : 'var(--bg-secondary)',
                                color: alreadyHave <= 0 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                                cursor: alreadyHave <= 0 ? 'default' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <MinusOutlined style={{ fontSize: 12 }} />
                        </button>
                        <div style={{
                            width: 64, height: 40,
                            border: '1.5px solid var(--border-color)',
                            borderLeft: 'none', borderRight: 'none',
                            background: 'var(--bg-base)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                            fontWeight: 800, fontSize: 20,
                            color: alreadyHave > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        }}>
                            {alreadyHave}
                        </div>
                        <button
                            type="button"
                            onClick={() => setAlreadyHave(prev => Math.min(maxPlayers - 1, prev + 1))}
                            disabled={alreadyHave >= maxPlayers - 1}
                            style={{
                                width: 40, height: 40, borderRadius: '0 10px 10px 0',
                                border: '1.5px solid var(--border-color)',
                                background: alreadyHave >= maxPlayers - 1 ? 'transparent' : 'var(--bg-secondary)',
                                color: alreadyHave >= maxPlayers - 1 ? 'var(--text-tertiary)' : 'var(--green)',
                                cursor: alreadyHave >= maxPlayers - 1 ? 'default' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <PlusOutlined style={{ fontSize: 12 }} />
                        </button>
                    </div>

                    {/* Status text */}
                    <div>
                        {alreadyHave === 0 ? (
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                {t('game.create.simple.fromScratch')}
                            </div>
                        ) : (
                            <>
                                <div style={{ fontSize: 14, color: 'var(--green)', fontWeight: 700 }}>
                                    {t('game.create.simple.needMore', { n: freeSlots })}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                                    {t('game.create.simple.outOf', { total: maxPlayers })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </QuestionBlock>

            {/* ── Extras accordion ───────────────────────────── */}
            <div style={{ marginBottom: 24 }}>
                <button
                    type="button"
                    onClick={() => setShowExtras(v => !v)}
                    style={{
                        width: '100%', padding: '11px 16px',
                        background: 'transparent',
                        border: `1px solid ${showExtras ? 'rgba(0,232,122,0.25)' : 'var(--border-color)'}`,
                        borderRadius: showExtras ? '12px 12px 0 0' : 12,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
                        transition: 'border-color 0.15s',
                    }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{t('game.create.simple.extrasLabel')}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>
                            — {t('game.create.simple.extrasHint')}
                        </span>
                    </span>
                    {showExtras
                        ? <UpOutlined style={{ fontSize: 10, color: 'var(--green)' }} />
                        : <DownOutlined style={{ fontSize: 10 }} />
                    }
                </button>

                {showExtras && (
                    <div style={{
                        padding: '20px 16px',
                        border: '1px solid rgba(0,232,122,0.25)',
                        borderTop: 'none',
                        borderRadius: '0 0 12px 12px',
                        background: 'var(--bg-raised)',
                        display: 'flex', flexDirection: 'column', gap: 14,
                    }}>

                        {/* Skill + Age */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <Form.Item
                                name="skillLevel"
                                initialValue="any"
                                label={<span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{t('game.create.skillLevelLabel')}</span>}
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
                                initialValue={null}
                                label={<span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>👴 {t('game.create.ageGroupLabel')}</span>}
                                style={{ marginBottom: 0 }}
                            >
                                <Select size="large" allowClear placeholder={t('game.create.ageGroupAny')}>
                                    <Option value={null}>🌐 {t('game.create.ageGroupAny')}</Option>
                                    <Option value={30}>🔵 30+</Option>
                                    <Option value={35}>🟣 35+</Option>
                                    <Option value={40}>🟡 40+</Option>
                                    <Option value={45}>🟠 45+</Option>
                                    <Option value={50}>🔴 50+</Option>
                                </Select>
                            </Form.Item>
                        </div>

                        {/* Duration */}
                        <Form.Item
                            name="duration"
                            initialValue={60}
                            label={<span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{t('game.create.durationLabel')}</span>}
                            style={{ marginBottom: 0 }}
                        >
                            <Select size="large" onChange={val => setSelectedDuration(val)}>
                                <Option value={60}>{t('game.create.duration60')}</Option>
                                <Option value={90}>{t('game.create.duration90')}</Option>
                                <Option value={120}>{t('game.create.duration120')}</Option>
                            </Select>
                        </Form.Item>

                        {/* Game type */}
                        <Form.Item
                            name="gameType"
                            initialValue="public"
                            label={<span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{t('game.create.gameTypeLabel')}</span>}
                            style={{ marginBottom: 0 }}
                        >
                            <Select size="large">
                                <Option value="public">🌐 {t('game.create.publicType')}</Option>
                                <Option value="private">🔒 {t('game.create.privateType')}</Option>
                            </Select>
                        </Form.Item>

                        {/* Price */}
                        <Form.Item
                            name="price"
                            label={<span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>💰 {t('game.create.simple.priceLabel')}</span>}
                            style={{ marginBottom: 0 }}
                        >
                            <InputNumber
                                min={0} max={500} size="large"
                                style={{ width: '100%' }}
                                placeholder="0"
                                addonAfter="₼"
                            />
                        </Form.Item>

                        {/* Min players */}
                        <Form.Item
                            name="minPlayersOverride"
                            label={
                                <span style={{ color: 'var(--text-tertiary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {t('game.create.minStartLabel')}
                                    <InfoCircleOutlined style={{ fontSize: 11 }} title={t('game.create.minStartTooltip')} />
                                </span>
                            }
                            style={{ marginBottom: 0 }}
                        >
                            <InputNumber
                                min={2} max={maxPlayers} size="large"
                                style={{ width: '100%' }}
                                placeholder={t('game.create.minPlayersAuto')}
                            />
                        </Form.Item>

                        {/* Description */}
                        <Form.Item
                            name="description"
                            label={<span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{t('game.create.descriptionLabel')}</span>}
                            style={{ marginBottom: 0 }}
                        >
                            <TextArea
                                placeholder={t('game.create.descriptionPlaceholder')}
                                rows={2} maxLength={300} showCount
                            />
                        </Form.Item>

                        {/* Recurrence */}
                        <Form.Item
                            name="recurrence"
                            initialValue="none"
                            label={<span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{t('game.create.recurrenceLabel')}</span>}
                            style={{ marginBottom: 0 }}
                        >
                            <Select size="large">
                                <Option value="none">{t('game.create.recurrenceNone')}</Option>
                                <Option value="weekly">{t('game.create.recurrenceWeekly')}</Option>
                                <Option value="biweekly">{t('game.create.recurrenceBiweekly')}</Option>
                            </Select>
                        </Form.Item>
                    </div>
                )}
            </div>

            {/* ── Submit ─────────────────────────────────────── */}
            <button
                type="submit"
                disabled={isLoading}
                style={{
                    width: '100%', height: 54,
                    background: isLoading
                        ? 'var(--bg-raised)'
                        : 'linear-gradient(135deg, #00e87a 0%, #00b85e 100%)',
                    border: 'none', borderRadius: 14,
                    color: isLoading ? 'var(--text-tertiary)' : '#060c18',
                    fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                    fontWeight: 800, fontSize: 17,
                    cursor: isLoading ? 'default' : 'pointer',
                    transition: 'opacity 0.15s, transform 0.1s',
                    boxShadow: isLoading ? 'none' : '0 4px 24px rgba(0,232,122,0.35)',
                    letterSpacing: '-0.3px',
                }}
                onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
                {isLoading ? '...' : t('game.create.simple.createBtn')}
            </button>
        </Form>
    );
};

export default CreateGameForm;
