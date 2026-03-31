import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Empty, Select, Pagination } from 'antd';
import { PlusOutlined, ReloadOutlined, EnvironmentOutlined, CompassOutlined, FireOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import GameCard from '../components/GameCard';
import JoinGameModal from '../components/JoinGameModal';
import HotGamesSection from '../components/HotGamesSection';
import { useGetGamesQuery, useGetNearbyGamesQuery } from '../../../store/gamesApi';
import { useGetDistrictsQuery, useGetMetroStationsQuery } from '../../../store/locationsApi';

const { Option } = Select;

const PAGE_SIZE = 12;

// ── Кастомный таб-переключатель ───────────────────────
const TabPill = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 18px',
            background: active ? 'var(--green)' : 'transparent',
            border: active ? 'none' : '1px solid var(--border-color)',
            borderRadius: 20,
            color: active ? '#060c18' : 'var(--text-tertiary)',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: active ? 700 : 400,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
        }}
    >
        {icon}
        {label}
    </button>
);

const GameListPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'hot';
    const [currentPage, setCurrentPage] = useState(1);

    const setActiveTab = (tab) => { setSearchParams({ tab }); setCurrentPage(1); };

    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [locating, setLocating] = useState(false);
    const [searchRadius, setSearchRadius] = useState(5);

    const [statusFilter, setStatusFilter] = useState(null);
    const [formatFilter, setFormatFilter] = useState(null);
    const [districtFilter, setDistrictFilter] = useState(null);
    const [metroFilter, setMetroFilter] = useState(null);

    useEffect(() => { setCurrentPage(1); }, [statusFilter, formatFilter, districtFilter, metroFilter]);

    const { data: allGamesData, isLoading: isLoadingAll, refetch: refetchAll } = useGetGamesQuery(
        { page: currentPage, limit: PAGE_SIZE, status: statusFilter, format: formatFilter, district: districtFilter, metro: metroFilter },
        { skip: activeTab !== 'all' }
    );

    const { data: nearbyGames = [], isLoading: isLoadingNearby, refetch: refetchNearby } = useGetNearbyGamesQuery(
        userLocation ? { lat: userLocation.lat, lng: userLocation.lng, radius: searchRadius } : { lat: 0, lng: 0, radius: 0 },
        { skip: !userLocation || activeTab !== 'nearby' }
    );

    const { data: districts = [] } = useGetDistrictsQuery();
    const { data: metros = [] } = useGetMetroStationsQuery();

    const allGames = allGamesData?.data || [];
    const total = allGamesData?.total || 0;

    const [selectedGame, setSelectedGame] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const filteredNearby = nearbyGames.filter(game => {
        const matchesStatus = !statusFilter || game.status === statusFilter;
        const matchesFormat = !formatFilter || game.format === formatFilter;
        return matchesStatus && matchesFormat;
    });

    useEffect(() => {
        if (activeTab === 'nearby' && !userLocation && !locating) requestLocation();
    }, [activeTab]);

    const requestLocation = () => {
        if (!navigator.geolocation) { setLocationError(t('game.list.geo.notSupported')); return; }
        setLocating(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
            (err) => { setLocating(false); setLocationError(err.code === 1 ? t('game.list.geo.permissionDenied') : t('game.list.geo.failed')); },
            { timeout: 10000, enableHighAccuracy: false, maximumAge: 60000 }
        );
    };

    const handleJoinClick = (game) => { setSelectedGame(game); setModalVisible(true); };
    const handleModalClose = () => { setModalVisible(false); setSelectedGame(null); };
    const handleJoinSuccess = () => { refetchAll(); if (userLocation) refetchNearby(); };
    const clearFilters = () => { setStatusFilter(null); setFormatFilter(null); setDistrictFilter(null); setMetroFilter(null); };

    const isLoading = activeTab === 'nearby' ? isLoadingNearby : isLoadingAll;
    const displayedGames = activeTab === 'nearby' ? filteredNearby : allGames;
    const hasActiveFilters = statusFilter || formatFilter || districtFilter || metroFilter;

    return (
        <div style={{ minHeight: '100vh', padding: '32px 24px 64px', maxWidth: 1200, margin: '0 auto' }}>

            {/* ── Шапка ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{
                        fontFamily: 'Syne, sans-serif', fontWeight: 800,
                        fontSize: 28, color: 'var(--text-primary)',
                        margin: 0, letterSpacing: '-0.5px',
                    }}>
                        {t('game.list.title')}
                    </h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: '4px 0 0' }}>
                        {t('game.list.subtitle')}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/games/create')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'var(--green)', border: 'none', borderRadius: 10,
                        padding: '10px 22px',
                        color: '#060c18', fontFamily: 'Outfit, sans-serif',
                        fontWeight: 700, fontSize: 14, cursor: 'pointer',
                        boxShadow: '0 0 20px rgba(0,232,122,0.25)',
                        transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                    <PlusOutlined /> {t('game.list.createBtn')}
                </button>
            </div>

            {/* ── Табы ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                <TabPill
                    active={activeTab === 'hot'}
                    onClick={() => setActiveTab('hot')}
                    icon={<FireOutlined />}
                    label={t('game.hot.title')}
                />
                <TabPill
                    active={activeTab === 'all'}
                    onClick={() => setActiveTab('all')}
                    label={t('game.list.tabAll')}
                />
                <TabPill
                    active={activeTab === 'nearby'}
                    onClick={() => setActiveTab('nearby')}
                    icon={<CompassOutlined />}
                    label={t('game.list.tabNearby')}
                />
            </div>

            {/* ── Горящие игры ── */}
            {activeTab === 'hot' && <HotGamesSection onJoin={handleJoinClick} fullPage />}

            {/* ── Фильтры ── */}
            {activeTab !== 'hot' && (
                <div style={{
                    display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
                    marginBottom: 20,
                    padding: '12px 16px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 12,
                }}>
                    {activeTab === 'nearby' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{t('game.list.filter.radius')}</span>
                            <Select value={searchRadius} onChange={setSearchRadius} size="small" style={{ width: 90 }} variant="borderless">
                                <Option value={3}>3 км</Option>
                                <Option value={5}>5 км</Option>
                                <Option value={10}>10 км</Option>
                                <Option value={20}>20 км</Option>
                            </Select>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{t('game.list.filter.status')}</span>
                        <Select value={statusFilter} onChange={setStatusFilter} allowClear placeholder={t('game.list.filter.statusAll')} size="small" style={{ width: 120 }} variant="borderless">
                            <Option value="open">{t('game.list.filter.open')}</Option>
                            <Option value="full">{t('game.list.filter.full')}</Option>
                        </Select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{t('game.list.filter.format')}</span>
                        <Select value={formatFilter} onChange={setFormatFilter} allowClear placeholder={t('game.list.filter.formatAny')} size="small" style={{ width: 100 }} variant="borderless">
                            <Option value="5x5">5x5</Option>
                            <Option value="6x6">6x6</Option>
                            <Option value="7x7">7x7</Option>
                            <Option value="8x8">8x8</Option>
                            <Option value="11x11">11x11</Option>
                        </Select>
                    </div>

                    {activeTab === 'all' && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <EnvironmentOutlined style={{ color: 'var(--text-tertiary)', fontSize: 11 }} />
                                <Select value={districtFilter} onChange={setDistrictFilter} allowClear placeholder={t('game.list.filter.districtAll')} size="small" style={{ width: 140 }} variant="borderless">
                                    {districts.map(d => <Option key={d.id} value={d.name}>{d.name}</Option>)}
                                </Select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>М</span>
                                <Select value={metroFilter} onChange={setMetroFilter} allowClear placeholder={t('game.list.filter.metroAll')} size="small" style={{ width: 140 }} variant="borderless">
                                    {metros.map(m => <Option key={m.id} value={m.name}>{m.name}</Option>)}
                                </Select>
                            </div>
                        </>
                    )}

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} style={{
                                background: 'transparent', border: '1px solid var(--border-color)',
                                borderRadius: 8, padding: '5px 12px',
                                color: 'var(--text-tertiary)', fontSize: 12,
                                fontFamily: 'Outfit, sans-serif', cursor: 'pointer',
                            }}>
                                {t('game.list.filter.reset')}
                            </button>
                        )}
                        <button
                            onClick={() => { refetchAll(); if (activeTab === 'nearby' && userLocation) refetchNearby(); }}
                            style={{
                                background: 'transparent', border: '1px solid var(--border-color)',
                                borderRadius: 8, padding: '5px 12px',
                                color: 'var(--text-tertiary)', fontSize: 12,
                                fontFamily: 'Outfit, sans-serif', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}
                        >
                            <ReloadOutlined style={{ fontSize: 11 }} /> {t('game.list.filter.refresh')}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Контент ── */}
            {activeTab !== 'hot' && (
                isLoading || locating ? (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 300, gap: 16 }}>
                        <Spin size="large" />
                        {locating && <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{t('game.list.geo.locating')}</span>}
                    </div>
                ) : activeTab === 'nearby' && locationError ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <div style={{ color: 'var(--text-secondary)' }}>
                                <p>{locationError}</p>
                                <button onClick={requestLocation} style={{
                                    background: 'var(--green)', border: 'none', borderRadius: 8,
                                    padding: '8px 20px', color: '#060c18', fontWeight: 700,
                                    fontFamily: 'Outfit, sans-serif', cursor: 'pointer',
                                }}>
                                    {t('game.list.geo.retry')}
                                </button>
                            </div>
                        }
                        style={{ marginTop: 60 }}
                    />
                ) : displayedGames.length === 0 ? (
                    <Empty
                        description={<span style={{ color: 'var(--text-secondary)' }}>
                            {activeTab === 'nearby' ? t('game.list.noNearbyGames', { radius: searchRadius }) : t('game.list.noGames')}
                        </span>}
                        style={{ marginTop: 60 }}
                    >
                        <button onClick={() => navigate('/games/create')} style={{
                            background: 'var(--green)', border: 'none', borderRadius: 8,
                            padding: '8px 20px', color: '#060c18', fontWeight: 700,
                            fontFamily: 'Outfit, sans-serif', cursor: 'pointer',
                        }}>
                            {t('game.list.createFirst')}
                        </button>
                    </Empty>
                ) : (
                    <>
                        {activeTab === 'all' && (
                            <div style={{ marginBottom: 14, color: 'var(--text-tertiary)', fontSize: 13 }}>
                                {t('game.list.found')} <strong style={{ color: 'var(--text-secondary)' }}>{total}</strong> {t('game.list.foundGames')}
                            </div>
                        )}

                        <div className="games-grid">
                            {displayedGames.map(game => (
                                <GameCard key={game.id} game={game} onJoin={handleJoinClick} showDistance={activeTab === 'nearby'} />
                            ))}
                        </div>

                        {activeTab === 'all' && total > PAGE_SIZE && (
                            <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
                                <Pagination
                                    current={currentPage}
                                    total={total}
                                    pageSize={PAGE_SIZE}
                                    onChange={(page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    showSizeChanger={false}
                                    showQuickJumper={total > PAGE_SIZE * 5}
                                />
                            </div>
                        )}
                    </>
                )
            )}

            <JoinGameModal game={selectedGame} visible={modalVisible} onClose={handleModalClose} onSuccess={handleJoinSuccess} />
        </div>
    );
};

export default GameListPage;
