import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import UnifiedLoginForm from '../components/UnifiedLoginForm';
import LanguageSwitcher from '../../../components/LanguageSwitcher';

const LoginPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/games', { replace: true });
        }
    }, [navigate]);

    const handleSuccess = () => {
        navigate('/games');
    };

    const handleRegister = (e) => {
        e.preventDefault();
        const refParam = new URLSearchParams(location.search).get('ref');
        navigate(refParam ? `/register?ref=${refParam}` : '/register');
    };

    return (
        <div className="auth-container" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
                <LanguageSwitcher />
            </div>
            <div className="auth-card glass-card animate-fade-in">
                <div className="auth-header">
                    <img
                        src="/logo.png"
                        alt="logo"
                        style={{
                            width: 150,
                            height: 'auto',
                            objectFit: 'contain',
                            marginBottom: 8,
                            filter: 'brightness(0) invert(1)',
                        }}
                    />
                    <h1 className="auth-title">{t('auth.login.welcome')}</h1>
                    <p className="auth-subtitle">
                        {t('auth.login.subtitle')}
                    </p>
                </div>

                <UnifiedLoginForm onSuccess={handleSuccess} />

                <Divider style={{ borderColor: 'var(--border-color)', margin: '32px 0 24px 0' }}>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
                        {t('auth.login.noAccount')}
                    </span>
                </Divider>

                <div style={{ textAlign: 'center' }}>
                    <a
                        href="#"
                        style={{
                            color: 'var(--primary-color)',
                            fontWeight: 500,
                            fontSize: '15px'
                        }}
                        onClick={handleRegister}
                    >
                        {t('auth.login.register')}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
