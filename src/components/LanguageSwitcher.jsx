import { useTranslation } from 'react-i18next';
import { Button, Space } from 'antd';
import axios from 'axios';
import { API_BASE } from '../config.js';

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

    return (
        <Space size={4}>
            <Button
                type={i18n.language === 'ru' ? 'primary' : 'text'}
                size="small"
                onClick={() => changeLanguage('ru')}
                style={{
                    fontWeight: 600,
                    minWidth: 36,
                    padding: '0 8px',
                    fontSize: 12,
                }}
            >
                RU
            </Button>
            <Button
                type={i18n.language === 'az' ? 'primary' : 'text'}
                size="small"
                onClick={() => changeLanguage('az')}
                style={{
                    fontWeight: 600,
                    minWidth: 36,
                    padding: '0 8px',
                    fontSize: 12,
                }}
            >
                AZ
            </Button>
        </Space>
    );
};

export default LanguageSwitcher;
