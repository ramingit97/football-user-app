import { useTranslation } from 'react-i18next';
import { Dropdown } from 'antd';
import { GlobalOutlined, CheckOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_BASE } from '../config.js';

const LANGUAGES = [
    { code: 'ru', label: 'Русский',       flag: '🇷🇺' },
    { code: 'az', label: 'Azərbaycanca',  flag: '🇦🇿' },
];

const LanguageSwitcher = ({ userId }) => {
    const { i18n } = useTranslation();

    const changeLanguage = async (lang) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('lang', lang);
        if (userId) {
            try {
                const token = localStorage.getItem('token');
                await axios.patch(
                    `${API_BASE}/api/users/${userId}`,
                    { language: lang },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (e) {
                // silently ignore
            }
        }
    };

    const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

    const items = LANGUAGES.map(lang => ({
        key: lang.code,
        label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 150, padding: '2px 0' }}>
                <span style={{ fontSize: 16 }}>{lang.flag}</span>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, flex: 1 }}>{lang.label}</span>
                {i18n.language === lang.code && (
                    <CheckOutlined style={{ color: 'var(--green)', fontSize: 12 }} />
                )}
            </div>
        ),
        onClick: () => changeLanguage(lang.code),
    }));

    return (
        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <button
                style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    padding: '5px 10px',
                    color: 'var(--text-secondary)',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, color 0.15s',
                    whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--green-border)';
                    e.currentTarget.style.color = 'var(--green)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                }}
            >
                <GlobalOutlined style={{ fontSize: 13 }} />
                {current.code.toUpperCase()}
            </button>
        </Dropdown>
    );
};

export default LanguageSwitcher;
