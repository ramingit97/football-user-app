import { useState } from 'react';
import {
    Form, Input, InputNumber, Select, TimePicker,
    Upload, Modal, message, Spin, Empty,
} from 'antd';
import {
    PlusOutlined, BankOutlined, EnvironmentOutlined,
    ClockCircleOutlined, PictureOutlined, CheckCircleFilled,
    CloseCircleFilled, SyncOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useGetMyStadiumsQuery, useSuggestStadiumMutation } from '../../../store/stadiumsApi';
import { useGetDistrictsQuery, useGetMetroStationsQuery } from '../../../store/locationsApi';
import { API_BASE } from '../../../config.js';

const { TextArea } = Input;
const { Option } = Select;

const STATUS_CFG = {
    pending:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: <SyncOutlined spin />,         label: 'Gözləyir'    },
    approved: { color: '#00e87a', bg: 'rgba(0,232,122,0.1)',   icon: <CheckCircleFilled />,          label: 'Təsdiq edildi' },
    rejected: { color: '#f04438', bg: 'rgba(240,68,56,0.1)',   icon: <CloseCircleFilled />,          label: 'Rədd edildi' },
    suspended:{ color: '#888',    bg: 'rgba(136,136,136,0.1)', icon: <CloseCircleFilled />,          label: 'Dayandırıldı' },
};

const SectionHeader = ({ icon, title }) => (
    <div style={{ marginBottom: 16, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'rgba(0,232,122,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--green)', fontSize: 13, flexShrink: 0,
            }}>
                {icon}
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
                {title}
            </span>
        </div>
        <div style={{ height: 1, background: 'var(--border-color)', marginTop: 10 }} />
    </div>
);

const MyStadiums = ({ userId }) => {
    const { t } = useTranslation();
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

    const { data: myStadiums = [], isLoading, refetch } = useGetMyStadiumsQuery(userId, { skip: !userId });
    const [suggestStadium, { isLoading: isSubmitting }] = useSuggestStadiumMutation();
    const { data: districts = [] } = useGetDistrictsQuery();
    const { data: metros = [] } = useGetMetroStationsQuery();

    const [form] = Form.useForm();
    const [modalOpen, setModalOpen] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [uploadingImages, setUploadingImages] = useState(false);

    const parseGoogleMapsCoords = (url) => {
        if (!url) return null;
        const atMatch = url.match(/@(-?\d+\.?\d+),(-?\d+\.?\d+)/);
        if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
        const qMatch = url.match(/[?&]q=(-?\d+\.?\d+),(-?\d+\.?\d+)/);
        if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
        return null;
    };

    const handleMapLinkBlur = (e) => {
        const coords = parseGoogleMapsCoords(e.target.value);
        if (coords) {
            form.setFieldsValue({ latitude: coords.lat, longitude: coords.lng });
            message.success(t('stadium.suggest.coordsParsed'));
        }
    };

    const getBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });

    const handlePreview = async (file) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setPreviewImage(file.url || file.preview);
        setPreviewOpen(true);
    };

    const onFinish = async (values) => {
        setUploadingImages(true);
        try {
            // 1. Create stadium (pending)
            const payload = {
                name: values.name,
                location: values.location,
                district: values.district,
                metro: values.metro,
                stadiumLink: values.stadiumLink,
                latitude: values.latitude,
                longitude: values.longitude,
                openTime: values.openTime?.format('HH:mm') || '08:00',
                closeTime: values.closeTime?.format('HH:mm') || '23:00',
                pricePerHour: values.pricePerHour,
                amenities: values.amenities || [],
                description: values.description || '',
                ownerId: userId,
                suggestedByName: currentUser?.name || userId,
            };

            const created = await suggestStadium(payload).unwrap();

            // 2. Upload photos if any
            const newImages = [];
            const filesToUpload = fileList.filter(f => !!f.originFileObj);
            for (const file of filesToUpload) {
                const formData = new FormData();
                formData.append('file', file.originFileObj);
                const res = await axios.post(
                    `${API_BASE}/api/files/stadium/${created.id}`,
                    formData,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );
                if (res.data.url) newImages.push(res.data.url);
            }

            // 3. Update stadium with image URLs + re-trigger Telegram with photos
            if (newImages.length > 0) {
                await axios.put(`${API_BASE}/api/stadiums/${created.id}`, { images: newImages });
            }

            message.success(t('stadium.suggest.successMsg'));
            setModalOpen(false);
            form.resetFields();
            setFileList([]);
            refetch();
        } catch (err) {
            message.error(t('stadium.suggest.errorMsg'));
        } finally {
            setUploadingImages(false);
        }
    };

    const amenitiesOptions = [
        { value: 'shower',        label: `🚿 ${t('common.amenities.shower')}` },
        { value: 'parking',       label: `🅿️ ${t('common.amenities.parking')}` },
        { value: 'changing_room', label: `👕 ${t('common.amenities.changingRoom')}` },
        { value: 'lighting',      label: `💡 ${t('common.amenities.lighting')}` },
        { value: 'cafe',          label: `☕ ${t('common.amenities.cafe')}` },
        { value: 'equipment',     label: `⚽ ${t('common.amenities.equipment')}` },
    ];

    if (isLoading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin />
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, margin: 0, color: 'var(--text-primary)', fontSize: 18 }}>
                    {t('stadium.suggest.myStadiumsTitle')}
                </h2>
                <button
                    onClick={() => setModalOpen(true)}
                    style={{
                        background: 'var(--green)', border: 'none', borderRadius: 8,
                        padding: '8px 16px', color: '#060c18',
                        fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                >
                    <PlusOutlined /> {t('stadium.suggest.addBtn')}
                </button>
            </div>

            {/* List */}
            {myStadiums.length === 0 ? (
                <Empty
                    description={<span style={{ color: 'var(--text-tertiary)' }}>{t('stadium.suggest.noStadiums')}</span>}
                >
                    <button
                        onClick={() => setModalOpen(true)}
                        style={{
                            background: 'var(--green)', border: 'none', borderRadius: 8,
                            padding: '8px 20px', color: '#060c18', fontWeight: 700,
                            fontSize: 14, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                        }}
                    >
                        {t('stadium.suggest.suggestFirst')}
                    </button>
                </Empty>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {myStadiums.map(stadium => {
                        const cfg = STATUS_CFG[stadium.status] || STATUS_CFG.pending;
                        return (
                            <div key={stadium.id} style={{
                                background: 'var(--bg-raised)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 12, padding: '14px 18px',
                                display: 'flex', alignItems: 'center', gap: 14,
                            }}>
                                {stadium.images?.filter(Boolean)?.[0] ? (
                                    <img
                                        src={stadium.images[0]}
                                        alt={stadium.name}
                                        style={{ width: 56, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                                    />
                                ) : (
                                    <div style={{
                                        width: 56, height: 44, borderRadius: 8, flexShrink: 0,
                                        background: 'var(--bg-card)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--text-tertiary)',
                                    }}>
                                        <BankOutlined />
                                    </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, fontSize: 14 }}>
                                        {stadium.name}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <EnvironmentOutlined style={{ fontSize: 10 }} />
                                        {stadium.location}
                                    </div>
                                </div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    background: cfg.bg, color: cfg.color,
                                    padding: '4px 10px', borderRadius: 20,
                                    fontSize: 11, fontWeight: 600,
                                    border: `1px solid ${cfg.color}30`, flexShrink: 0,
                                }}>
                                    {cfg.icon}
                                    <span style={{ marginLeft: 4 }}>{cfg.label}</span>
                                </div>
                                {stadium.status === 'rejected' && stadium.rejectionReason && (
                                    <div style={{ fontSize: 11, color: '#f04438', marginTop: 4, gridColumn: '1/-1' }}>
                                        {stadium.rejectionReason}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Suggest Modal */}
            <Modal
                open={modalOpen}
                onCancel={() => { setModalOpen(false); form.resetFields(); setFileList([]); }}
                footer={null}
                title={
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--text-primary)' }}>
                        🏟 {t('stadium.suggest.formTitle')}
                    </span>
                }
                width={680}
                styles={{
                    content: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16 },
                    header: { background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' },
                    body: { maxHeight: '75vh', overflowY: 'auto', padding: '24px' },
                    mask: { backdropFilter: 'blur(4px)' },
                }}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>

                    <SectionHeader icon={<EnvironmentOutlined />} title={t('stadium.suggest.sectionBasic')} />

                    <Form.Item name="name" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('stadium.suggest.nameLabel')}</span>}
                        rules={[{ required: true, message: t('stadium.suggest.nameRequired') }]} style={{ marginBottom: 14 }}>
                        <Input placeholder={t('stadium.suggest.namePlaceholder')} size="large" />
                    </Form.Item>

                    <Form.Item name="location" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('stadium.suggest.addressLabel')}</span>}
                        rules={[{ required: true, message: t('stadium.suggest.addressRequired') }]} style={{ marginBottom: 14 }}>
                        <Input placeholder={t('stadium.suggest.addressPlaceholder')} size="large" />
                    </Form.Item>

                    <div className="form-grid-2col" style={{ marginBottom: 0 }}>
                        <Form.Item name="district" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('game.create.districtLabel')}</span>} style={{ marginBottom: 14 }}>
                            <Select placeholder={t('game.create.districtAll')} size="large" allowClear>
                                {districts.map(d => <Option key={d.id} value={d.name}>{d.name}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item name="metro" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('game.create.metroLabel')}</span>} style={{ marginBottom: 14 }}>
                            <Select placeholder={t('game.create.metroAll')} size="large" allowClear>
                                {metros.map(m => <Option key={m.id} value={m.name}>{m.name}</Option>)}
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item name="stadiumLink" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('stadium.suggest.mapsLabel')}</span>}
                        extra={<span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{t('stadium.suggest.mapsHint')}</span>}
                        style={{ marginBottom: 14 }}>
                        <Input placeholder="https://maps.google.com/..." size="large" onBlur={handleMapLinkBlur} />
                    </Form.Item>

                    <div className="form-grid-2col" style={{ marginBottom: 0 }}>
                        <Form.Item name="latitude" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('stadium.suggest.latLabel')}</span>} style={{ marginBottom: 14 }}>
                            <InputNumber placeholder="40.4093" size="large" style={{ width: '100%' }} precision={6} />
                        </Form.Item>
                        <Form.Item name="longitude" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('stadium.suggest.lngLabel')}</span>} style={{ marginBottom: 14 }}>
                            <InputNumber placeholder="49.8671" size="large" style={{ width: '100%' }} precision={6} />
                        </Form.Item>
                    </div>

                    <SectionHeader icon={<ClockCircleOutlined />} title={t('stadium.suggest.sectionSchedule')} />

                    <div className="form-grid-2col" style={{ marginBottom: 0 }}>
                        <Form.Item name="openTime" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('stadium.suggest.openTimeLabel')}</span>}
                            rules={[{ required: true, message: t('stadium.suggest.timeRequired') }]} style={{ marginBottom: 14 }}>
                            <TimePicker format="HH:mm" size="large" style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="closeTime" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('stadium.suggest.closeTimeLabel')}</span>}
                            rules={[{ required: true, message: t('stadium.suggest.timeRequired') }]} style={{ marginBottom: 14 }}>
                            <TimePicker format="HH:mm" size="large" style={{ width: '100%' }} />
                        </Form.Item>
                    </div>

                    <Form.Item name="pricePerHour" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('stadium.suggest.priceLabel')}</span>}
                        rules={[{ required: true, message: t('stadium.suggest.priceRequired') }]} style={{ marginBottom: 14 }}>
                        <InputNumber min={0} placeholder="60" size="large" style={{ width: '100%' }} addonAfter="₼/saat" />
                    </Form.Item>

                    <Form.Item name="amenities" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('stadium.suggest.amenitiesLabel')}</span>} style={{ marginBottom: 14 }}>
                        <Select mode="multiple" placeholder={t('stadium.suggest.amenitiesPlaceholder')} size="large" options={amenitiesOptions} />
                    </Form.Item>

                    <Form.Item name="description" label={<span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('stadium.suggest.descLabel')}</span>} style={{ marginBottom: 20 }}>
                        <TextArea placeholder={t('stadium.suggest.descPlaceholder')} rows={3} maxLength={500} showCount />
                    </Form.Item>

                    <SectionHeader icon={<PictureOutlined />} title={t('stadium.suggest.sectionPhotos')} />

                    <Form.Item style={{ marginBottom: 24 }}>
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            onPreview={handlePreview}
                            onChange={({ fileList: f }) => setFileList(f)}
                            beforeUpload={() => false}
                            accept="image/*"
                            multiple
                        >
                            {fileList.length >= 8 ? null : (
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8, fontSize: 12 }}>{t('stadium.suggest.uploadBtn')}</div>
                                </div>
                            )}
                        </Upload>
                        <Modal open={previewOpen} footer={null} onCancel={() => setPreviewOpen(false)}>
                            <img alt="preview" style={{ width: '100%' }} src={previewImage} />
                        </Modal>
                    </Form.Item>

                    <button
                        type="submit"
                        disabled={isSubmitting || uploadingImages}
                        style={{
                            width: '100%', height: 48,
                            background: isSubmitting || uploadingImages ? 'var(--bg-raised)' : 'var(--green)',
                            border: 'none', borderRadius: 10,
                            color: isSubmitting || uploadingImages ? 'var(--text-tertiary)' : '#060c18',
                            fontFamily: 'Syne, sans-serif', fontWeight: 800,
                            fontSize: 15, cursor: isSubmitting || uploadingImages ? 'default' : 'pointer',
                        }}
                    >
                        {isSubmitting || uploadingImages ? t('common.loading') : t('stadium.suggest.submitBtn')}
                    </button>
                </Form>
            </Modal>
        </div>
    );
};

export default MyStadiums;
