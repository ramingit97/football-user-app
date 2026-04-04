import { useState, useEffect, useRef } from 'react';
import {
    Form, Input, DatePicker, InputNumber,
    Select, message, Spin, Image, Alert
} from 'antd';
import {
    EnvironmentOutlined, TeamOutlined, InfoCircleOutlined,
    BankOutlined, ClockCircleOutlined, LockOutlined,
    GlobalOutlined, CheckCircleFilled, WalletOutlined,
} from '@ant-design/icons';
import locale from 'antd/es/date-picker/locale/ru_RU';
import { useTranslation } from 'react-i18next';
import { useCreateGameMutation } from '../../../store/gamesApi';
import { useGetDistrictsQuery, useGetMetroStationsQuery } from '../../../store/locationsApi';
import axios from 'axios';
import { API_BASE } from '../../../config.js';

const { TextArea } = Input;
const { Option } = Select;

const FORMAT_PLAYERS = { '5x5': 10, '6x6': 12, '7x7': 14, '8x8': 16, '11x11': 22 };

const computeEndTime = (startTime, durationMinutes) => {
    const [h, m] = startTime.split(':').map(Number);
    const total = h * 60 + m + durationMinutes;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

// ── Заголовок секции ──────────────────────────────────
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
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif", lineHeight: 1.2 }}>
                    {title}
                </div>
                {subtitle && (
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        {subtitle}
                    </div>
                )}
            </div>
        </div>
        <div style={{ height: 1, background: 'var(--border-color)', marginTop: 12 }} />
    </div>
);

const CreateGameForm = ({ onSuccess }) => {
    const [form] = Form.useForm();
    const { t } = useTranslation();
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const [createGame, { isLoading }] = useCreateGameMutation();
    const { data: districts = [] } = useGetDistrictsQuery();
    const { data: metros = [] } = useGetMetroStationsQuery();

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

    // Загружаем слоты когда есть стадион + дата
    useEffect(() => {
        if (!selectedStadium || !selectedDate) { setAvailableSlots([]); return; }
        setLoadingSlots(true);
        axios.get(`${API_BASE}/api/stadiums/${selectedStadium}/available-slots?date=${selectedDate.format('YYYY-MM-DD')}`)
            .then(r => setAvailableSlots(r.data))
            .catch(() => setAvailableSlots([]))
            .finally(() => setLoadingSlots(false));
    }, [selectedStadium, selectedDate]);

    // Авто-заголовок: предлагаем название когда есть формат + стадион + дата
    useEffect(() => {
        if (titleTouched.current) return;
        const stadium = stadiums.find(s => s.id === selectedStadium);
        if (selectedFormat && stadium && selectedDate) {
            const dateStr = selectedDate.format('D MMM');
            form.setFieldValue('title', `${selectedFormat} · ${stadium.name} · ${dateStr}`);
        }
    }, [selectedFormat, selectedStadium, selectedDate, stadiums]);

    const selectedStadiumData = stadiums.find(s => s.id === selectedStadium);

    // Цена за игрока = pricePerHour / maxPlayers
    const pricePerPlayer = selectedStadiumData && maxPlayers
        ? Math.ceil((selectedStadiumData.pricePerHour || 0) / maxPlayers * 10) / 10
        : null;

    const handleDistrictChange = (v) => {
        setSelectedDistrict(v || null);
        form.setFieldValue('stadium', undefined);
        form.setFieldValue('time', undefined);
        setSelectedStadium(null);
        setAvailableSlots([]);
    };

    const handleMetroChange = (v) => {
        setSelectedMetro(v || null);
        form.setFieldValue('stadium', undefined);
        form.setFieldValue('time', undefined);
        setSelectedStadium(null);
        setAvailableSlots([]);
    };

    const handleStadiumChange = (v) => {
        setSelectedStadium(v);
        form.setFieldValue('time', undefined);
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        form.setFieldValue('time', undefined);
    };

    const handleDurationChange = (val) => {
        setSelectedDuration(val);
        form.setFieldValue('time', undefined);
    };

    const handleFormatChange = (value) => {
        setSelectedFormat(value);
        const players = FORMAT_PLAYERS[value];
        if (players) {
            form.setFieldValue('maxPlayers', players);
            setMaxPlayers(players);
        }
    };

    const onFinish = async (values) => {
        try {
            const gameData = {
                title: values.title,
                date: values.date.format('YYYY-MM-DD'),
                time: values.time,
                location: selectedStadiumData?.name || '',
                stadiumId: values.stadium,
                district: selectedStadiumData?.district,
                metro: selectedStadiumData?.metro,
                maxPlayers: values.maxPlayers,
                minPlayers: values.minPlayers || Math.floor(values.maxPlayers / 2),
                description: values.description || '',
                format: values.format,
                skillLevel: values.skillLevel || 'any',
                duration: values.duration || 60,
                gameType: gameVisibility,
                price: pricePerPlayer ?? (selectedStadiumData?.pricePerHour || 0),
                status: 'open',
                organizerId: currentUser?.id,
                organizerName: currentUser?.name,
            };

            const result = await createGame(gameData).unwrap();
            message.success(t('game.create.success'));
            form.resetFields();
            setSelectedDistrict(null);
            setSelectedMetro(null);
            setSelectedStadium(null);
            setSelectedDate(null);
            setAvailableSlots([]);
            setSelectedDuration(60);
            setMaxPlayers(null);
            setSelectedFormat(null);
            titleTouched.current = false;
            if (onSuccess) onSuccess(result);
        } catch (error) {
            message.error(error.data?.message || t('game.create.error'));
        }
    };

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
        <Form
            form={form}
            name="createGame"
            onFinish={onFinish}
            layout="vertical"
            requiredMark={false}
        >
            {/* ── Название ── */}
            <Form.Item
                name="title"
                label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.nameLabel')}</span>}
                rules={[
                    { required: true, message: t('game.create.namePlaceholder') },
                    { min: 3, message: t('game.create.nameMinLength') },
                ]}
                style={{ marginBottom: 24 }}
            >
                <Input
                    placeholder={t('game.create.nameExample')}
                    size="large"
                    onChange={() => { titleTouched.current = true; }}
                />
            </Form.Item>

            {/* ── Стадион ── */}
            <SectionHeader
                icon={<BankOutlined />}
                title={t('game.create.stadiumLabel')}
                subtitle={t('game.create.stadiumHint')}
            />

            <div className="form-grid-2col" style={{ marginBottom: 0 }}>
                <Form.Item name="district" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.districtLabel')}</span>} style={{ marginBottom: 16 }}>
                    <Select placeholder={t('game.create.districtAll')} size="large" allowClear onChange={handleDistrictChange}>
                        {districts.map(d => <Option key={d.id} value={d.name}>{d.name}</Option>)}
                    </Select>
                </Form.Item>
                <Form.Item name="metro" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.metroLabel')}</span>} style={{ marginBottom: 16 }}>
                    <Select placeholder={t('game.create.metroAll')} size="large" allowClear onChange={handleMetroChange}>
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
                <Select
                    placeholder={t('game.create.stadiumSelect')}
                    size="large"
                    showSearch
                    optionFilterProp="children"
                    onChange={handleStadiumChange}
                >
                    {filteredStadiums.map(s => (
                        <Option key={s.id} value={s.id}>
                            {s.name} — {s.location}
                            <span style={{ color: 'var(--text-tertiary)', marginLeft: 8 }}>
                                {s.pricePerHour}{t('common.perHour')}
                            </span>
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            {/* Инфо о стадионе */}
            {selectedStadiumData && (
                <div style={{
                    marginBottom: 24, padding: '12px 16px',
                    background: 'rgba(0,232,122,0.04)',
                    border: '1px solid rgba(0,232,122,0.15)',
                    borderRadius: 10,
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                                {selectedStadiumData.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                <span><EnvironmentOutlined style={{ marginRight: 3 }} />{selectedStadiumData.location}</span>
                                {selectedStadiumData.openTime && selectedStadiumData.closeTime && (
                                    <span><ClockCircleOutlined style={{ marginRight: 3 }} />{selectedStadiumData.openTime}–{selectedStadiumData.closeTime}</span>
                                )}
                                <span style={{ color: 'var(--green)', fontWeight: 600 }}>
                                    <WalletOutlined style={{ marginRight: 3 }} />{selectedStadiumData.pricePerHour} ₼/ч
                                </span>
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

            {/* ── Дата и время ── */}
            <SectionHeader icon={<ClockCircleOutlined />} title={t('game.create.dateTimeLabel')} />

            <Form.Item
                name="date"
                label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.dateLabel')}</span>}
                rules={[{ required: true, message: t('game.create.validation.selectDate') }]}
                style={{ marginBottom: 16 }}
            >
                <DatePicker
                    locale={locale}
                    placeholder={t('game.create.datePlaceholder')}
                    size="large"
                    style={{ width: '100%' }}
                    format="DD.MM.YYYY"
                    onChange={handleDateChange}
                />
            </Form.Item>

            {/* Длительность — ДО выбора слота, чтобы слоты отображались корректно */}
            <Form.Item
                name="duration"
                label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.durationLabel')}</span>}
                initialValue={60}
                rules={[{ required: true, message: t('game.create.validation.selectDuration') }]}
                style={{ marginBottom: 16 }}
            >
                <Select size="large" onChange={handleDurationChange}>
                    <Option value={60}>{t('game.create.duration60')}</Option>
                    <Option value={90}>{t('game.create.duration90')}</Option>
                    <Option value={120}>{t('game.create.duration120')}</Option>
                </Select>
            </Form.Item>

            <Form.Item
                name="time"
                label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.timeLabel')}</span>}
                rules={[{ required: true, message: t('game.create.validation.selectDate') }]}
                style={{ marginBottom: 24 }}
            >
                <Select
                    placeholder={
                        loadingSlots ? t('game.create.loading') :
                        !selectedStadium ? t('game.create.selectStadiumFirst') :
                        !selectedDate ? 'Сначала выберите дату' :
                        t('game.create.selectSlot')
                    }
                    size="large"
                    disabled={!selectedStadium || !selectedDate || loadingSlots}
                    notFoundContent={loadingSlots ? <Spin size="small" /> : t('game.create.noSlots')}
                >
                    {availableOnlySlots.map(slot => (
                        <Option key={slot.time} value={slot.time}>
                            {slot.time} – {computeEndTime(slot.time, selectedDuration)}
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            {/* ── Тип игры ── */}
            <SectionHeader icon={<LockOutlined />} title={t('game.create.gameTypeLabel')} />

            <div className="form-grid-2col" style={{ marginBottom: 20 }}>
                {visibilityCards.map(card => {
                    const active = gameVisibility === card.value;
                    return (
                        <div
                            key={card.value}
                            onClick={() => setGameVisibility(card.value)}
                            style={{
                                padding: '14px 16px',
                                borderRadius: 10,
                                border: `1.5px solid ${active ? card.color : 'var(--border-color)'}`,
                                background: active ? `${card.color === 'var(--green)' ? 'rgba(0,232,122,0.08)' : 'rgba(79,134,247,0.08)'}` : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                position: 'relative',
                            }}
                        >
                            {active && (
                                <CheckCircleFilled style={{ position: 'absolute', top: 10, right: 10, color: card.color, fontSize: 16 }} />
                            )}
                            <div style={{ fontSize: 18, marginBottom: 6, color: card.color }}>{card.icon}</div>
                            <div style={{ fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 2, color: 'var(--text-primary)' }}>
                                {card.title}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                                {card.description}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: card.color }}>
                                {card.note}
                            </div>
                        </div>
                    );
                })}
            </div>

            {gameVisibility === 'private' && (
                <Alert message={t('game.create.privateHint')} type="info" showIcon style={{ marginBottom: 20 }} />
            )}

            {/* ── Формат и состав ── */}
            <SectionHeader icon={<TeamOutlined />} title={t('game.create.formatLabel')} />

            <div className="form-grid-2col" style={{ marginBottom: 16 }}>
                <Form.Item
                    name="format"
                    label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.formatSelect')}</span>}
                    rules={[{ required: true, message: t('game.create.validation.selectFormat') }]}
                    style={{ marginBottom: 0 }}
                >
                    <Select placeholder="5×5, 7×7..." size="large" onChange={handleFormatChange}>
                        <Option value="5x5">5 × 5</Option>
                        <Option value="6x6">6 × 6</Option>
                        <Option value="7x7">7 × 7</Option>
                        <Option value="8x8">8 × 8</Option>
                        <Option value="11x11">11 × 11</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="maxPlayers"
                    label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.maxPlayersLabel')}</span>}
                    rules={[{ required: true, message: t('game.create.maxPlayersPlaceholder') }]}
                    style={{ marginBottom: 0 }}
                >
                    <InputNumber
                        min={4} max={30} placeholder="10" size="large"
                        style={{ width: '100%' }}
                        onChange={(val) => setMaxPlayers(val)}
                    />
                </Form.Item>
            </div>

            <Form.Item
                name="skillLevel"
                label={
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
                        {t('game.create.skillLevelLabel')}
                        <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 6 }}>(рекомендуемый)</span>
                    </span>
                }
                initialValue="any"
                style={{ marginBottom: 16 }}
            >
                <Select size="large">
                    <Option value="any"><span style={{ marginRight: 8 }}>🌐</span>{t('game.create.skillLevelAny')}</Option>
                    <Option value="beginner"><span style={{ marginRight: 8 }}>🟢</span>{t('game.create.skillLevelBeginner')}</Option>
                    <Option value="intermediate"><span style={{ marginRight: 8 }}>🟡</span>{t('game.create.skillLevelIntermediate')}</Option>
                    <Option value="advanced"><span style={{ marginRight: 8 }}>🔴</span>{t('game.create.skillLevelAdvanced')}</Option>
                </Select>
            </Form.Item>

            <Form.Item
                name="minPlayers"
                label={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
                        Минимум для старта
                        <InfoCircleOutlined
                            style={{ color: 'var(--text-tertiary)', cursor: 'default' }}
                            title="Бронирование стадиона автоматически подтвердится, когда наберётся это количество игроков"
                        />
                    </span>
                }
                style={{ marginBottom: 16 }}
            >
                <InputNumber
                    min={2} max={30}
                    placeholder={t('game.create.minPlayersAuto')}
                    size="large"
                    style={{ width: '100%' }}
                />
            </Form.Item>

            {/* ── Расчёт взноса ── */}
            {pricePerPlayer !== null && (
                <div style={{
                    marginBottom: 20, padding: '14px 16px',
                    background: 'rgba(0,232,122,0.06)',
                    border: '1px solid rgba(0,232,122,0.2)',
                    borderRadius: 10,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
                }}>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                            Аренда<br />
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{selectedStadiumData?.pricePerHour} ₼/ч</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                            Игроков<br />
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{maxPlayers}</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>Взнос с игрока</div>
                        <div style={{ fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight: 800, fontSize: 22, color: 'var(--green)' }}>
                            ~{pricePerPlayer} ₼
                        </div>
                    </div>
                </div>
            )}

            {/* ── Описание ── */}
            <Form.Item
                name="description"
                label={<span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{t('game.create.descriptionLabel')}</span>}
                style={{ marginBottom: 28 }}
            >
                <TextArea
                    placeholder={t('game.create.descriptionPlaceholder')}
                    rows={3} maxLength={500} showCount
                />
            </Form.Item>

            <button
                type="submit"
                disabled={isLoading}
                style={{
                    width: '100%', height: 50,
                    background: isLoading ? 'var(--bg-raised)' : 'var(--green)',
                    border: 'none', borderRadius: 10,
                    color: isLoading ? 'var(--text-tertiary)' : '#060c18',
                    fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight: 800,
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

export default CreateGameForm;
