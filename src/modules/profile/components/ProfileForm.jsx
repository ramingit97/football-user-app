import { useState, useEffect } from 'react';
import { Form, Input, Select, Slider, InputNumber, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useUpdateProfileMutation } from '../../../store/authApi';

const { TextArea } = Input;
const { Option } = Select;

// ── Section header ────────────────────────────────
const Section = ({ label, children }) => (
    <div style={{ marginBottom: 28 }}>
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 18,
        }}>
            <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.8px',
                textTransform: 'uppercase', color: 'var(--text-tertiary)',
                fontFamily: 'Outfit, sans-serif',
            }}>
                {label}
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
        </div>
        {children}
    </div>
);

// ── Field label ───────────────────────────────────
const FieldLabel = ({ children }) => (
    <span style={{
        fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)',
        fontFamily: 'Outfit, sans-serif', display: 'block', marginBottom: 6,
    }}>
        {children}
    </span>
);

const ProfileForm = ({ initialData = {} }) => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const [updateProfile, { isLoading }] = useUpdateProfileMutation();
    const [isDirty, setIsDirty] = useState(false);

    const positions = [
        { value: 'goalkeeper', label: t('positions.goalkeeper'), emoji: '🧤' },
        { value: 'defender',   label: t('positions.defender'),   emoji: '🛡️' },
        { value: 'midfielder', label: t('positions.midfielder'), emoji: '⚙️' },
        { value: 'forward',    label: t('positions.forward'),    emoji: '⚡' },
        { value: 'any',        label: t('positions.any'),        emoji: '🔄' },
    ];

    const skillLevels = [
        { value: 'beginner',     label: t('skillLevel.beginner') },
        { value: 'amateur',      label: t('skillLevel.amateur') },
        { value: 'intermediate', label: t('skillLevel.intermediate') },
        { value: 'advanced',     label: t('skillLevel.advanced') },
        { value: 'professional', label: t('skillLevel.professional') },
    ];

    useEffect(() => {
        if (initialData) form.setFieldsValue(initialData);
    }, [initialData, form]);

    const onFinish = async (values) => {
        try {
            await updateProfile({ ...initialData, ...values }).unwrap();
            message.success(t('profile.edit.saveSuccess'));
            setIsDirty(false);
        } catch (error) {
            message.error(error.data?.message || t('profile.edit.saveError'));
        }
    };

    return (
        <Form
            form={form}
            onFinish={onFinish}
            onValuesChange={() => setIsDirty(true)}
            layout="vertical"
            requiredMark={false}
            initialValues={initialData}
        >
            {/* ── Header ── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-color)',
                marginBottom: 28,
            }}>
                <span style={{
                    fontFamily: 'Syne, sans-serif', fontWeight: 700,
                    fontSize: 17, color: 'var(--text-primary)',
                }}>
                    {t('profile.edit.title')}
                </span>
                <button
                    type="submit"
                    disabled={!isDirty || isLoading}
                    style={{
                        background: isDirty ? 'var(--green)' : 'var(--bg-raised)',
                        border: 'none', borderRadius: 8,
                        padding: '8px 20px',
                        color: isDirty ? '#060c18' : 'var(--text-tertiary)',
                        fontWeight: 700, fontSize: 13,
                        fontFamily: 'Outfit, sans-serif',
                        cursor: isDirty ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'all 0.2s',
                        opacity: isLoading ? 0.7 : 1,
                    }}
                    onClick={() => form.submit()}
                >
                    <SaveOutlined />
                    {isLoading ? '...' : t('profile.edit.save')}
                </button>
            </div>

            <div style={{ padding: '0 24px 24px' }}>

                {/* ── Basic info ── */}
                <Section label={t('profile.edit.basicInfo')}>
                    <div style={{ marginBottom: 16 }}>
                        <FieldLabel>{t('profile.edit.nameLabel')}</FieldLabel>
                        <Form.Item name="name" rules={[{ required: true, message: t('profile.edit.nameRequired') }]} style={{ marginBottom: 0 }}>
                            <Input placeholder={t('profile.edit.namePlaceholder')} size="large" />
                        </Form.Item>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                        <div>
                            <FieldLabel>{t('profile.edit.phoneLabel')}</FieldLabel>
                            <Input
                                value={initialData.phone || '—'}
                                readOnly
                                size="large"
                                style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', cursor: 'default' }}
                            />
                        </div>
                        <div>
                            <FieldLabel>{t('profile.edit.emailLabel')}</FieldLabel>
                            <Input
                                value={initialData.email || '—'}
                                readOnly
                                size="large"
                                style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', cursor: 'default' }}
                            />
                        </div>
                    </div>

                    <div>
                        <FieldLabel>{t('profile.edit.bioLabel')}</FieldLabel>
                        <Form.Item name="bio" style={{ marginBottom: 0 }}>
                            <TextArea placeholder={t('profile.edit.bioPlaceholder')}
                                rows={3} maxLength={300} showCount />
                        </Form.Item>
                    </div>
                </Section>

                {/* ── Personal data ── */}
                <Section label={t('profile.edit.personalData')}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
                        <div>
                            <FieldLabel>{t('profile.edit.ageLabel')}</FieldLabel>
                            <Form.Item name="age" style={{ marginBottom: 0 }}>
                                <InputNumber min={14} max={70} style={{ width: '100%' }} size="large" />
                            </Form.Item>
                        </div>
                        <div>
                            <FieldLabel>{t('profile.edit.heightLabel')}</FieldLabel>
                            <Form.Item name="height" style={{ marginBottom: 0 }}>
                                <InputNumber min={100} max={250} style={{ width: '100%' }} size="large" />
                            </Form.Item>
                        </div>
                        <div>
                            <FieldLabel>{t('profile.edit.weightLabel')}</FieldLabel>
                            <Form.Item name="weight" style={{ marginBottom: 0 }}>
                                <InputNumber min={30} max={150} style={{ width: '100%' }} size="large" />
                            </Form.Item>
                        </div>
                    </div>

                    <div>
                        <FieldLabel>{t('profile.edit.districtLabel')}</FieldLabel>
                        <Form.Item name="city" style={{ marginBottom: 0 }}>
                            <Select placeholder={t('profile.edit.districtPlaceholder')} size="large">
                                <Option value="nasimi">{t('districts.nasimi')}</Option>
                                <Option value="sabail">{t('districts.sabail')}</Option>
                                <Option value="yasamal">{t('districts.yasamal')}</Option>
                                <Option value="nizami">{t('districts.nizami')}</Option>
                                <Option value="binagadi">{t('districts.binagadi')}</Option>
                                <Option value="sabunchu">{t('districts.sabunchu')}</Option>
                                <Option value="surakhani">{t('districts.surakhani')}</Option>
                                <Option value="khazar">{t('districts.khazar')}</Option>
                                <Option value="pirallahi">{t('districts.pirallahi')}</Option>
                                <Option value="garadagh">{t('districts.garadagh')}</Option>
                                <Option value="absheron">{t('districts.absheron')}</Option>
                            </Select>
                        </Form.Item>
                    </div>
                </Section>

                {/* ── Game params ── */}
                <Section label={t('profile.edit.gameParams')}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                        <div>
                            <FieldLabel>{t('profile.edit.positionLabel')}</FieldLabel>
                            <Form.Item name="position" style={{ marginBottom: 0 }}>
                                <Select placeholder={t('profile.edit.positionPlaceholder')} size="large">
                                    {positions.map(pos => (
                                        <Option key={pos.value} value={pos.value}>{pos.emoji} {pos.label}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </div>
                        <div>
                            <FieldLabel>{t('profile.edit.skillLabel')}</FieldLabel>
                            <Form.Item name="skillLevel" style={{ marginBottom: 0 }}>
                                <Select placeholder={t('profile.edit.skillPlaceholder')} size="large">
                                    {skillLevels.map(l => (
                                        <Option key={l.value} value={l.value}>{l.label}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                        <div>
                            <FieldLabel>{t('profile.edit.footLabel')}</FieldLabel>
                            <Form.Item name="preferredFoot" style={{ marginBottom: 0 }}>
                                <Select placeholder={t('profile.edit.footPlaceholder')} size="large">
                                    <Option value="right">{t('foot.right')}</Option>
                                    <Option value="left">{t('foot.left')}</Option>
                                    <Option value="both">{t('foot.both')}</Option>
                                </Select>
                            </Form.Item>
                        </div>
                        <div>
                            <FieldLabel>{t('profile.edit.shirtNumberLabel')}</FieldLabel>
                            <Form.Item name="shirtNumber" style={{ marginBottom: 0 }}>
                                <InputNumber min={1} max={99} style={{ width: '100%' }} size="large" />
                            </Form.Item>
                        </div>
                    </div>

                    <div>
                        <FieldLabel>{t('profile.edit.physicalLabel')}</FieldLabel>
                        <Form.Item name="physicalLevel" style={{ marginBottom: 0 }}>
                            <Slider marks={{
                                0:   t('profile.edit.physicalBeginning'),
                                50:  t('profile.edit.physicalMiddle'),
                                100: t('profile.edit.physicalAthlete'),
                            }} />
                        </Form.Item>
                    </div>
                </Section>

                {/* ── Preferences ── */}
                <Section label={t('profile.edit.preferences')}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                        <div>
                            <FieldLabel>{t('profile.edit.daysLabel')}</FieldLabel>
                            <Form.Item name="preferredDays" style={{ marginBottom: 0 }}>
                                <Select mode="multiple" placeholder={t('profile.edit.daysPlaceholder')} size="large">
                                    <Option value="monday">{t('days.monday')}</Option>
                                    <Option value="tuesday">{t('days.tuesday')}</Option>
                                    <Option value="wednesday">{t('days.wednesday')}</Option>
                                    <Option value="thursday">{t('days.thursday')}</Option>
                                    <Option value="friday">{t('days.friday')}</Option>
                                    <Option value="saturday">{t('days.saturday')}</Option>
                                    <Option value="sunday">{t('days.sunday')}</Option>
                                </Select>
                            </Form.Item>
                        </div>
                        <div>
                            <FieldLabel>{t('profile.edit.timeLabel')}</FieldLabel>
                            <Form.Item name="preferredTime" style={{ marginBottom: 0 }}>
                                <Select mode="multiple" placeholder={t('profile.edit.timePlaceholder')} size="large">
                                    <Option value="morning">{t('timeOfDay.morning')}</Option>
                                    <Option value="afternoon">{t('timeOfDay.afternoon')}</Option>
                                    <Option value="evening">{t('timeOfDay.evening')}</Option>
                                </Select>
                            </Form.Item>
                        </div>
                    </div>

                    <div>
                        <FieldLabel>{t('profile.edit.notificationsLabel')}</FieldLabel>
                        <Form.Item name="notifications" style={{ marginBottom: 0 }}>
                            <Select size="large">
                                <Option value={true}>{t('profile.edit.notificationsOn')}</Option>
                                <Option value={false}>{t('profile.edit.notificationsOff')}</Option>
                            </Select>
                        </Form.Item>
                    </div>
                </Section>

            </div>
        </Form>
    );
};

export default ProfileForm;
