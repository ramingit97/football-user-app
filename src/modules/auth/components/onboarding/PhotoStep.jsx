import React from 'react';
import { Upload, message } from 'antd';
import { CameraOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const PhotoStep = ({ formData, updateFormData, onNext, onBack, onSkip }) => {
    const { t } = useTranslation();

    // Correctly handle the file object from Ant Design's beforeUpload
    const handleUpload = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            updateFormData('avatar', e.target.result);
            message.success(t('auth.onboarding.photo.uploadSuccess'));
        };
        reader.readAsDataURL(file);
        return false; // Prevent default upload behavior
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        updateFormData('avatar', null);
    };

    return (
        <div className="onboarding-step fade-in-up">
            <div className="step-icon-wrapper">
                <span className="step-emoji">📸</span>
            </div>

            <h1 className="step-title">{t('auth.onboarding.photo.title')}</h1>
            <p className="step-subtitle">
                {t('auth.onboarding.photo.subtitle')}
            </p>

            <div className="photo-upload-container">
                <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleUpload}
                    maxCount={1}
                >
                    <div className={`avatar-circle ${formData.avatar ? 'has-image' : ''}`}>
                        {formData.avatar ? (
                            <>
                                <img src={formData.avatar} alt="Avatar" className="avatar-image" />
                                <div className="avatar-overlay">
                                    <CameraOutlined style={{ fontSize: 24, color: 'white' }} />
                                    <span style={{ fontSize: 12, marginTop: 4 }}>{t('auth.onboarding.photo.changeLabel')}</span>
                                </div>
                                <button className="remove-photo-btn" onClick={handleRemove}>
                                    <DeleteOutlined />
                                </button>
                            </>
                        ) : (
                            <div className="upload-placeholder">
                                <CameraOutlined style={{ fontSize: 40, color: 'var(--text-secondary)' }} />
                                <span style={{ marginTop: 12, fontSize: 14, color: 'var(--text-secondary)' }}>
                                    {t('auth.onboarding.photo.uploadLabel')}
                                </span>
                            </div>
                        )}
                    </div>
                </Upload>
            </div>

            <div className="step-actions">
                <button className="btn-secondary" onClick={onBack}>
                    {t('common.back')}
                </button>
                <button className="btn-ghost" onClick={onSkip}>
                    {t('common.skip')}
                </button>
                <button
                    className="btn-primary"
                    onClick={onNext}
                    disabled={!formData.avatar}
                    style={{ opacity: !formData.avatar ? 0.5 : 1 }}
                >
                    {t('common.next')}
                </button>
            </div>

            <style>{`
                .photo-upload-container {
                    display: flex;
                    justify-content: center;
                    margin: 32px 0;
                }

                .avatar-circle {
                    width: 160px;
                    height: 160px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.03);
                    border: 2px dashed rgba(255,255,255,0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .avatar-circle:hover {
                    border-color: var(--primary-color);
                    background: rgba(255,255,255,0.05);
                }

                .avatar-circle.has-image {
                    border: 2px solid var(--primary-color);
                    background: black;
                }

                .avatar-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .upload-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .avatar-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s;
                    color: white;
                }

                .avatar-circle:hover .avatar-overlay {
                    opacity: 1;
                }

                .remove-photo-btn {
                    position: absolute;
                    bottom: 10px;
                    right: 35%;
                    left: 35%;
                    background: rgba(255, 77, 79, 0.9);
                    border: none;
                    border-radius: 20px;
                    color: white;
                    padding: 4px 8px;
                    cursor: pointer;
                    z-index: 10;
                    opacity: 0;
                    transition: all 0.2s;
                    font-size: 12px;
                    display: flex;
                    justify-content: center;
                }

                .avatar-circle:hover .remove-photo-btn {
                    opacity: 1;
                    bottom: 15px;
                }
            `}</style>
        </div>
    );
};

export default PhotoStep;
