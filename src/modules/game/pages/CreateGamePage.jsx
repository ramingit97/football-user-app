import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import CreateGameForm from '../components/CreateGameForm';

const CreateGamePage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div style={{ minHeight: '100vh', padding: '32px 20px 72px' }}>
            <div style={{ maxWidth: 580, margin: '0 auto' }}>
                <button
                    onClick={() => navigate('/games')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-tertiary)', fontSize: 13,
                        fontFamily: 'Outfit, sans-serif', marginBottom: 24, padding: 0,
                    }}
                >
                    <ArrowLeftOutlined style={{ fontSize: 12 }} />
                    {t('game.create.backToList')}
                </button>

                <div style={{ marginBottom: 24 }}>
                    <h1 style={{
                        fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight: 800,
                        fontSize: 26, color: 'var(--text-primary)',
                        margin: 0, letterSpacing: '-0.5px', marginBottom: 4,
                    }}>
                        {t('game.create.title')}
                    </h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: 0 }}>
                        {t('game.create.subtitle')}
                    </p>
                </div>

                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 16,
                    padding: '28px 28px 24px',
                }}>
                    <CreateGameForm onSuccess={(result) => navigate(`/games/${result.id}`)} />
                </div>
            </div>
        </div>
    );
};

export default CreateGamePage;
