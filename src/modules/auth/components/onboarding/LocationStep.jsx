import React from 'react';
import { Select } from 'antd';
import { useTranslation } from 'react-i18next';

const BAKU_DISTRICTS = [
    'Насими', 'Сабаиль', 'Ясамал', 'Низами', 'Наримановский',
    'Бинагадинский', 'Хатаинский', 'Сабунчинский', 'Хазарский',
    'Сураханский', 'Гарадагский', 'Пираллахинский'
];

const BAKU_METRO = [
    'Ичеришехер', 'Сахиль', '28 Мая', 'Гянджлик', 'Нариман Нариманов',
    'Бакмил', 'Улдуз', 'Короглу', '8 Ноября', 'Ази Асланов',
    'Хатаи', 'Джафар Джаббарлы', 'Низами', 'Эльмляр Академиясы',
    'Иншаатчылар', 'Ходжасан', 'Нефтчиляр', 'Халглар Достлугу', 'Ахмедлы'
];

const LocationStep = ({ formData, updateFormData, onNext, onBack }) => {
    const { t } = useTranslation();

    return (
        <div className="onboarding-step">
            <div className="step-icon-wrapper">
                <span className="step-emoji">📍</span>
            </div>

            <h1 className="step-title">{t('auth.onboarding.location.title')}</h1>
            <p className="step-subtitle">
                {t('auth.onboarding.location.subtitle')}
            </p>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="step-input-wrapper">
                    <Select
                        size="large"
                        placeholder={t('auth.onboarding.location.districtPlaceholder')}
                        value={formData.district || undefined}
                        onChange={(value) => updateFormData('district', value)}
                        style={{ width: '100%', height: 56 }}
                        showSearch
                        optionFilterProp="children"
                        dropdownStyle={{ background: '#1a2420', border: '1px solid rgba(255,255,255,0.1)' }}
                        bordered={false}
                        className="premium-select"
                    >
                        {BAKU_DISTRICTS.map(d => (
                            <Select.Option key={d} value={d} style={{ color: 'white' }}>{d}</Select.Option>
                        ))}
                    </Select>
                </div>

                <div className="step-input-wrapper">
                    <Select
                        size="large"
                        placeholder={t('auth.onboarding.location.metroPlaceholder')}
                        value={formData.metro || undefined}
                        onChange={(value) => updateFormData('metro', value)}
                        style={{ width: '100%', height: 56 }}
                        showSearch
                        allowClear
                        optionFilterProp="children"
                        dropdownStyle={{ background: '#1a2420', border: '1px solid rgba(255,255,255,0.1)' }}
                        bordered={false}
                        className="premium-select"
                    >
                        {BAKU_METRO.map(m => (
                            <Select.Option key={m} value={m} style={{ color: 'white' }}>🚇 {m}</Select.Option>
                        ))}
                    </Select>
                </div>
            </div>

            <div className="step-actions">
                <button className="btn-secondary" onClick={onBack}>
                    {t('common.back')}
                </button>
                <button
                    className="btn-primary"
                    onClick={onNext}
                    disabled={!formData.district}
                >
                    {t('common.next')}
                </button>
            </div>

            <style>{`
                .premium-select .ant-select-selector {
                    background: transparent !important;
                    color: white !important;
                    height: 56px !important;
                    display: flex;
                    align-items: center;
                }
                .premium-select .ant-select-selection-item {
                    color: white !important;
                    font-size: 16px;
                    font-weight: 500;
                }
                .premium-select .ant-select-selection-placeholder {
                    color: rgba(255,255,255,0.3) !important;
                    font-size: 16px;
                }
                .premium-select .ant-select-arrow {
                    color: rgba(255,255,255,0.5);
                }
                .ant-select-clear {
                    background: transparent !important;
                    color: rgba(255,255,255,0.5) !important;
                }
            `}</style>
        </div>
    );
};

export default LocationStep;
