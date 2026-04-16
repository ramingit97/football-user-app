import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Select, Empty, Image, Tag } from 'antd';
import {
    ArrowLeftOutlined,
    EnvironmentOutlined,
    ClockCircleOutlined,
    PictureOutlined,
} from '@ant-design/icons';
import { useGetStadiumsQuery } from '../../store/stadiumsApi';
import { useGetDistrictsQuery } from '../../store/locationsApi';

const { Option } = Select;

const AMENITY_LABELS = {
    shower: 'Duş', parking: 'Parkinq', changing_room: 'Soyunucu otaqları',
    lighting: 'İşıqlandırma', cafe: 'Kafe', wifi: 'Wi-Fi',
    artificial_turf: 'Süni çim', tribunes: 'Tribuna',
};
const normalizeAmenity = (a) => AMENITY_LABELS[a?.toLowerCase()] || a;

// Placeholder when no real image exists
const IMG_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyNDAiIGZpbGw9IiMxMTFiMmIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI1NiIgZmlsbD0iIzAwZTg3YTIwIj7wn4+fPC90ZXh0Pjwvc3ZnPg==';

const StadiumCard = ({ stadium, onClick }) => {
    const images = (stadium.images || []).filter(Boolean);
    const hasPhotos = images.length > 0;
    const cover = hasPhotos ? images[0] : null;

    return (
        <div
            onClick={onClick}
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 16,
                marginBottom: 14,
                overflow: 'hidden',
                transition: 'border-color 0.2s, transform 0.15s',
                cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,232,122,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
            {/* ── Cover image strip ── */}
            {hasPhotos ? (
                <Image.PreviewGroup>
                    <div style={{ display: 'flex', gap: 2, height: 160, overflow: 'hidden' }}>
                        {/* Main cover — takes 60% width */}
                        <div style={{ flex: '0 0 60%', position: 'relative', overflow: 'hidden' }}>
                            <Image
                                src={images[0]}
                                fallback={IMG_PLACEHOLDER}
                                style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                                preview={{ mask: <span style={{ fontSize: 11, color: '#fff', fontFamily: 'Outfit,sans-serif' }}>Bax</span> }}
                            />
                        </div>

                        {/* Side thumbnails — stack up to 2 */}
                        {images.length > 1 && (
                            <div style={{ flex: '0 0 calc(40% - 2px)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {images.slice(1, 3).map((src, i) => {
                                    const isLast = i === 1 && images.length > 3;
                                    return (
                                        <div key={i} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                                            <Image
                                                src={src}
                                                fallback={IMG_PLACEHOLDER}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                preview={{ mask: isLast ? <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 14, color: '#fff' }}>+{images.length - 3} foto</span> : <span style={{ fontSize: 11, color: '#fff' }}>Bax</span> }}
                                            />
                                        </div>
                                    );
                                })}
                                {/* Hidden images (index 3+) for preview group to include */}
                                {images.slice(3).map((src, i) => (
                                    <Image key={`h-${i}`} src={src} style={{ display: 'none' }} />
                                ))}
                            </div>
                        )}
                    </div>
                </Image.PreviewGroup>
            ) : (
                /* No photos placeholder */
                <div style={{
                    height: 100, background: 'linear-gradient(135deg, rgba(0,232,122,0.06), rgba(79,134,247,0.04))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    borderBottom: '1px solid var(--border-color)',
                }}>
                    <PictureOutlined style={{ fontSize: 28, color: 'var(--border-color)' }} />
                    <span style={{ fontFamily: 'Outfit,sans-serif', fontSize: 13, color: 'var(--text-tertiary)' }}>Foto yoxdur</span>
                </div>
            )}

            {/* ── Info body ── */}
            <div style={{ padding: '16px 20px 18px' }}>
                {/* Name + district */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{
                        fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif",
                        fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', lineHeight: 1.3,
                    }}>
                        {stadium.name}
                    </div>
                    {stadium.district && (
                        <span style={{
                            background: 'rgba(0,232,122,0.1)', border: '1px solid rgba(0,232,122,0.2)',
                            borderRadius: 6, padding: '2px 8px', fontSize: 11, color: 'var(--green)',
                            fontFamily: 'Outfit,sans-serif', fontWeight: 600, flexShrink: 0, marginLeft: 10,
                        }}>
                            {stadium.district}
                        </span>
                    )}
                </div>

                {/* Info row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Outfit,sans-serif' }}>
                        <EnvironmentOutlined style={{ color: 'var(--green)', fontSize: 13 }} />
                        {stadium.location}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Outfit,sans-serif' }}>
                        <ClockCircleOutlined style={{ fontSize: 13 }} />
                        {stadium.openTime} – {stadium.closeTime}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontFamily: 'Outfit,sans-serif' }}>
                        <span style={{ color: '#f59e0b', fontWeight: 700 }}>{Number(stadium.pricePerHour)} ₼</span>
                        <span style={{ color: 'var(--text-tertiary)' }}>/saat</span>
                    </div>
                    {stadium.metro && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Outfit,sans-serif' }}>
                            🚇 {stadium.metro}
                        </div>
                    )}
                </div>

                {/* Amenities */}
                {stadium.amenities?.filter(Boolean).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                        {stadium.amenities.filter(Boolean).map(a => (
                            <span key={a} style={{
                                background: 'var(--bg-raised)', border: '1px solid var(--border-color)',
                                borderRadius: 6, padding: '2px 8px', fontSize: 11,
                                color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif',
                            }}>
                                {normalizeAmenity(a)}
                            </span>
                        ))}
                    </div>
                )}

                {/* Description */}
                {stadium.description && (
                    <p style={{
                        fontFamily: 'Outfit,sans-serif', fontSize: 13, color: 'var(--text-tertiary)',
                        margin: 0, lineHeight: 1.55,
                    }}>
                        {stadium.description}
                    </p>
                )}

                {/* Photo count badge */}
                {hasPhotos && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <PictureOutlined style={{ fontSize: 12, color: 'var(--text-tertiary)' }} />
                        <span style={{ fontFamily: 'Outfit,sans-serif', fontSize: 11, color: 'var(--text-tertiary)' }}>
                            {images.length} foto
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

const StadiumsPage = () => {
    const navigate = useNavigate();
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const { data: stadiums = [], isLoading } = useGetStadiumsQuery(
        selectedDistrict ? { district: selectedDistrict } : undefined
    );
    const { data: districts = [] } = useGetDistrictsQuery();

    const approvedStadiums = stadiums.filter(s => s.status === 'approved');

    return (
        <div style={{ minHeight: '100vh', padding: '32px 20px 80px' }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
                <button
                    onClick={() => navigate('/games')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6, background: 'none',
                        border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)',
                        fontSize: 13, fontFamily: 'Outfit,sans-serif', marginBottom: 24, padding: 0,
                    }}
                >
                    <ArrowLeftOutlined style={{ fontSize: 12 }} /> Oyunlara qayıt
                </button>

                {/* Header */}
                <div style={{ marginBottom: 22 }}>
                    <h1 style={{
                        fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif",
                        fontWeight: 800, fontSize: 28, color: 'var(--text-primary)',
                        margin: 0, letterSpacing: '-0.5px', marginBottom: 6,
                    }}>
                        Stadionlar 🏟️
                    </h1>
                    <p style={{ fontFamily: 'Outfit,sans-serif', fontSize: 14, color: 'var(--text-tertiary)', margin: 0 }}>
                        Bakıda {approvedStadiums.length} stadion qeydiyyatda
                    </p>
                </div>

                {/* District filter */}
                <div style={{ marginBottom: 20 }}>
                    <Select
                        placeholder="Rayona görə filtr..."
                        allowClear
                        style={{ width: '100%' }}
                        size="large"
                        onChange={v => setSelectedDistrict(v || null)}
                    >
                        {districts.map(d => (
                            <Option key={d.name} value={d.name}>{d.name}</Option>
                        ))}
                    </Select>
                </div>

                {/* List */}
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
                ) : approvedStadiums.length === 0 ? (
                    <Empty
                        description={
                            <span style={{ color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif' }}>
                                Stadion tapılmadı
                            </span>
                        }
                    />
                ) : (
                    approvedStadiums.map(s => <StadiumCard key={s.id} stadium={s} onClick={() => navigate(`/stadiums/${s.id}`)} />)
                )}
            </div>
        </div>
    );
};

export default StadiumsPage;
