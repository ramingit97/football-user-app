import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Image, message } from 'antd';
import {
    ArrowLeftOutlined, EnvironmentOutlined, ClockCircleOutlined,
    PictureOutlined, CheckOutlined, CalendarOutlined, PhoneOutlined,
    CloseOutlined,
} from '@ant-design/icons';
import { useGetStadiumByIdQuery, useGetStadiumSlotsQuery, useCreateBookingMutation } from '../../store/stadiumsApi';

const IMG_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ4MCIgdmlld0JveD0iMCAwIDgwMCA0ODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI0ODAiIGZpbGw9IiMxMTFiMmIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI5NiIgZmlsbD0iIzAwZTg3YTIwIj7wn4+fPC90ZXh0Pjwvc3ZnPg==';

const AMENITY_ICONS = {
    'Süni çim': '🌿', 'artificial_turf': '🌿',
    'Soyunucu otaqları': '👕', 'changing_room': '👕',
    'Duş': '🚿', 'shower': '🚿',
    'Parkinq': '🅿️', 'parking': '🅿️',
    'Kafe': '☕', 'cafe': '☕',
    'İşıqlandırma': '💡', 'lighting': '💡',
    'Wi-Fi': '📶', 'wifi': '📶',
    'Tribuna': '🪑', 'tribunes': '🪑',
};

const AMENITY_LABELS = {
    shower: 'Duş', parking: 'Parkinq', changing_room: 'Soyunucu otaqları',
    lighting: 'İşıqlandırma', cafe: 'Kafe', wifi: 'Wi-Fi',
    artificial_turf: 'Süni çim', tribunes: 'Tribuna',
};
const normalizeAmenity = (a) => AMENITY_LABELS[a?.toLowerCase()] || a;

const getDates = () => {
    const days = ['B.e.', 'Ç.a.', 'Çər.', 'C.a.', 'Cüm.', 'Şən.', 'Baz.'];
    const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
            label: i === 0 ? 'Bu gün' : days[d.getDay()],
            sub: `${d.getDate()} ${months[d.getMonth()]}`,
            value: d.toISOString().split('T')[0],
        };
    });
};

const StadiumDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dates = getDates();
    const [selectedDate, setSelectedDate] = useState(dates[0].value);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [bookingSlot, setBookingSlot] = useState(null); // { time } — открытый слот в модалке
    const [note, setNote] = useState('');
    const [bookingDone, setBookingDone] = useState(false);
    const [createBooking, { isLoading: booking }] = useCreateBookingMutation();

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    const { data: stadium, isLoading } = useGetStadiumByIdQuery(id);
    const { data: slots = [], isLoading: loadingSlots, refetch: refetchSlots } = useGetStadiumSlotsQuery(
        { stadiumId: id, date: selectedDate },
        { skip: !id || !selectedDate }
    );

    const openBooking = (slot) => { setBookingSlot(slot); setNote(''); setBookingDone(false); };
    const closeBooking = () => { setBookingSlot(null); setNote(''); setBookingDone(false); };

    const handleConfirm = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            await createBooking({
                stadiumId: id,
                date: selectedDate,
                startTime: bookingSlot.time,
                endTime: bookingSlot.time,
                userId: user.id,
                customerName: user.name,
                price: stadium.pricePerHour,
                note: note.trim() || undefined,
            }).unwrap();
            setBookingDone(true);
            refetchSlots();
        } catch {
            message.error('Sifariş zamanı xəta baş verdi');
        }
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!stadium) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                Stadion tapılmadı
            </div>
        );
    }

    const images = (stadium.images || []).filter(Boolean);
    const amenities = (stadium.amenities || []).filter(Boolean);
    const availableCount = slots.filter(s => s.available).length;

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 80 }}>
            {/* ── Back button ── */}
            <div style={{ padding: '24px 20px 0', maxWidth: 860, margin: '0 auto' }}>
                <button
                    onClick={() => navigate('/stadiums')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6, background: 'none',
                        border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)',
                        fontSize: 13, fontFamily: 'Outfit,sans-serif', padding: 0, marginBottom: 20,
                    }}
                >
                    <ArrowLeftOutlined style={{ fontSize: 12 }} /> Stadionlara qayıt
                </button>
            </div>

            {/* ── Photo gallery ── */}
            <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px' }}>
                {images.length > 0 ? (
                    <Image.PreviewGroup>
                        <div style={{ display: 'grid', gridTemplateColumns: images.length === 1 ? '1fr' : '3fr 2fr', gap: 6, borderRadius: 20, overflow: 'hidden', height: 340 }}>
                            <div style={{ overflow: 'hidden' }}>
                                <Image
                                    src={images[0]}
                                    fallback={IMG_PLACEHOLDER}
                                    style={{ width: '100%', height: 340, objectFit: 'cover', display: 'block' }}
                                    preview={{ mask: <span style={{ fontSize: 12, color: '#fff', fontFamily: 'Outfit' }}>Bax</span> }}
                                />
                            </div>
                            {images.length > 1 && (
                                <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 6 }}>
                                    {images.slice(1, 3).map((src, i) => {
                                        const isLast = i === 1 && images.length > 3;
                                        return (
                                            <div key={i} style={{ overflow: 'hidden', position: 'relative' }}>
                                                <Image
                                                    src={src}
                                                    fallback={IMG_PLACEHOLDER}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                    preview={{ mask: isLast ? <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>+{images.length - 3} foto</span> : <span style={{ fontSize: 12, color: '#fff' }}>Bax</span> }}
                                                />
                                            </div>
                                        );
                                    })}
                                    {images.slice(3).map((src, i) => (
                                        <Image key={`h-${i}`} src={src} style={{ display: 'none' }} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </Image.PreviewGroup>
                ) : (
                    <div style={{
                        height: 260, borderRadius: 20, background: 'linear-gradient(135deg, rgba(0,232,122,0.07), rgba(79,134,247,0.05))',
                        border: '1px solid var(--border-color)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
                    }}>
                        <PictureOutlined style={{ fontSize: 48, color: 'var(--border-color)' }} />
                        <span style={{ fontFamily: 'Outfit,sans-serif', color: 'var(--text-tertiary)', fontSize: 14 }}>Foto yoxdur</span>
                    </div>
                )}
            </div>

            {/* ── Main content ── */}
            <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 20px 0', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: 24, alignItems: 'start' }}>

                {/* ── Left column ── */}
                <div>
                    {/* Name + district */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                        <h1 style={{
                            fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif",
                            fontWeight: 800, fontSize: 30, color: 'var(--text-primary)',
                            margin: 0, letterSpacing: '-0.5px', lineHeight: 1.2,
                        }}>
                            {stadium.name}
                        </h1>
                        {stadium.district && (
                            <span style={{
                                background: 'rgba(0,232,122,0.1)', border: '1px solid rgba(0,232,122,0.25)',
                                borderRadius: 8, padding: '4px 12px', fontSize: 12,
                                color: 'var(--green)', fontFamily: 'Outfit,sans-serif', fontWeight: 600,
                                flexShrink: 0, marginTop: 6,
                            }}>
                                {stadium.district}
                            </span>
                        )}
                    </div>

                    {/* Info chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                        {stadium.location && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'Outfit,sans-serif' }}>
                                <EnvironmentOutlined style={{ color: 'var(--green)' }} />
                                {stadium.location}
                            </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'Outfit,sans-serif' }}>
                            <ClockCircleOutlined style={{ color: 'var(--text-tertiary)' }} />
                            {stadium.openTime} – {stadium.closeTime}
                        </div>
                        {stadium.metro && (
                            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'Outfit,sans-serif' }}>
                                🚇 {stadium.metro}
                            </div>
                        )}
                        {stadium.phone && (
                            <a
                                href={`tel:${stadium.phone}`}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--green)', fontFamily: 'Outfit,sans-serif', textDecoration: 'none' }}
                            >
                                <PhoneOutlined /> {stadium.phone}
                            </a>
                        )}
                    </div>

                    {/* Description */}
                    {stadium.description && (
                        <p style={{
                            fontFamily: 'Outfit,sans-serif', fontSize: 15, color: 'var(--text-secondary)',
                            lineHeight: 1.7, margin: '0 0 20px',
                        }}>
                            {stadium.description}
                        </p>
                    )}

                    {/* Amenities */}
                    {amenities.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                            <h3 style={{
                                fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 15,
                                color: 'var(--text-primary)', margin: '0 0 12px',
                            }}>
                                İmkanlar
                            </h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                {amenities.map(a => (
                                    <div key={a} style={{
                                        display: 'flex', alignItems: 'center', gap: 7,
                                        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                        borderRadius: 10, padding: '8px 14px',
                                        fontFamily: 'Outfit,sans-serif', fontSize: 13, color: 'var(--text-secondary)',
                                    }}>
                                        <span>{AMENITY_ICONS[a] || AMENITY_ICONS[a?.toLowerCase()] || '✓'}</span>
                                        {normalizeAmenity(a)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Right column — Price + Slots ── */}
                <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                    borderRadius: 20, padding: 24, position: isMobile ? 'static' : 'sticky', top: 20,
                }}>
                    {/* Price */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                        <span style={{
                            fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif",
                            fontWeight: 800, fontSize: 36, color: '#f59e0b',
                        }}>
                            {Number(stadium.pricePerHour)} ₼
                        </span>
                        <span style={{ fontFamily: 'Outfit,sans-serif', fontSize: 14, color: 'var(--text-tertiary)' }}>/saat</span>
                    </div>

                    {/* Date selector */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <CalendarOutlined style={{ color: 'var(--text-tertiary)', fontSize: 13 }} />
                            <span style={{ fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                Tarix seçin
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {dates.map(d => (
                                <button
                                    key={d.value}
                                    onClick={() => setSelectedDate(d.value)}
                                    style={{
                                        flex: '0 0 auto',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        padding: '7px 10px', borderRadius: 10,
                                        border: selectedDate === d.value ? '1.5px solid var(--green)' : '1px solid var(--border-color)',
                                        background: selectedDate === d.value ? 'rgba(0,232,122,0.1)' : 'var(--bg-raised)',
                                        cursor: 'pointer', fontFamily: 'Outfit,sans-serif',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <span style={{ fontSize: 11, color: selectedDate === d.value ? 'var(--green)' : 'var(--text-tertiary)', fontWeight: 600 }}>{d.label}</span>
                                    <span style={{ fontSize: 12, color: selectedDate === d.value ? 'var(--green)' : 'var(--text-secondary)', fontWeight: 700, marginTop: 1 }}>{d.sub}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Slots */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                Boş saatlar
                            </span>
                            {!loadingSlots && slots.length > 0 && (
                                <span style={{ fontFamily: 'Outfit,sans-serif', fontSize: 12, color: 'var(--text-tertiary)' }}>
                                    {availableCount}/{slots.length} boş
                                </span>
                            )}
                        </div>

                        {loadingSlots ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}><Spin size="small" /></div>
                        ) : slots.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif', fontSize: 13 }}>
                                Bu tarix üçün slot yoxdur
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                                {slots.map(slot => (
                                    <button
                                        key={slot.time}
                                        disabled={!slot.available}
                                        onClick={() => slot.available && openBooking(slot)}
                                        style={{
                                            padding: '9px 4px',
                                            borderRadius: 10,
                                            border: slot.available ? '1px solid rgba(0,232,122,0.3)' : '1px solid var(--border-color)',
                                            background: slot.available ? 'rgba(0,232,122,0.07)' : 'var(--bg-raised)',
                                            color: slot.available ? 'var(--green)' : 'var(--text-tertiary)',
                                            fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 600,
                                            cursor: slot.available ? 'pointer' : 'not-allowed',
                                            opacity: slot.available ? 1 : 0.45,
                                            transition: 'all 0.15s',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                                        }}
                                        onMouseEnter={e => { if (slot.available) e.currentTarget.style.background = 'rgba(0,232,122,0.15)'; }}
                                        onMouseLeave={e => { if (slot.available) e.currentTarget.style.background = 'rgba(0,232,122,0.07)'; }}
                                    >
                                        {slot.available && <CheckOutlined style={{ fontSize: 10 }} />}
                                        {slot.time}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <p style={{ fontFamily: 'Outfit,sans-serif', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 12, textAlign: 'center' }}>
                        Boş saatı seçin, sifariş anında göndərilir ✓
                    </p>
                </div>
            </div>

            {/* ── Booking modal ── */}
            {bookingSlot && (
                <div
                    onClick={closeBooking}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 20, backdropFilter: 'blur(4px)',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                            borderRadius: 20, padding: 28, width: '100%', maxWidth: 420,
                            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif", fontWeight: 800, fontSize: 22, color: 'var(--text-primary)', margin: 0 }}>
                                {bookingDone ? '✅ Sifariş göndərildi!' : 'Sifariş et'}
                            </h2>
                            <button onClick={closeBooking} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 18, padding: 4 }}>
                                <CloseOutlined />
                            </button>
                        </div>

                        {bookingDone ? (
                            <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
                                <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
                                <p style={{ fontFamily: 'Outfit,sans-serif', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 8px' }}>
                                    Sifarişiniz qəbul edildi. Stadion admini sizinlə əlaqə saxlayacaq.
                                </p>
                                <p style={{ fontFamily: 'Outfit,sans-serif', fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
                                    📅 {selectedDate} · 🕐 {bookingSlot.time}
                                </p>
                                <button
                                    onClick={closeBooking}
                                    style={{
                                        marginTop: 20, width: '100%', background: 'var(--green)', border: 'none',
                                        borderRadius: 12, padding: '12px', color: '#060c18',
                                        fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                                    }}
                                >
                                    Bağla
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Slot info */}
                                <div style={{
                                    background: 'rgba(0,232,122,0.07)', border: '1px solid rgba(0,232,122,0.2)',
                                    borderRadius: 12, padding: '14px 16px', marginBottom: 20,
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                }}>
                                    <div>
                                        <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                                            {stadium.name}
                                        </div>
                                        <div style={{ fontFamily: "'ClashDisplay-Variable',sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
                                            {selectedDate} · {bookingSlot.time}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontFamily: "'ClashDisplay-Variable',sans-serif", fontWeight: 800, fontSize: 22, color: '#f59e0b' }}>
                                            {Number(stadium.pricePerHour)} ₼
                                        </div>
                                        <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 11, color: 'var(--text-tertiary)' }}>/saat</div>
                                    </div>
                                </div>

                                {/* Note */}
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                                        Qeyd <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(istəyə görə)</span>
                                    </label>
                                    <textarea
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        placeholder="Məs: 6x6 oyun, 10 nəfər gözlənilir..."
                                        maxLength={200}
                                        rows={3}
                                        style={{
                                            width: '100%', background: 'var(--bg-raised)',
                                            border: '1px solid var(--border-color)', borderRadius: 10,
                                            padding: '10px 12px', color: 'var(--text-primary)',
                                            fontFamily: 'Outfit,sans-serif', fontSize: 14,
                                            resize: 'none', outline: 'none', boxSizing: 'border-box',
                                            transition: 'border-color 0.15s',
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(0,232,122,0.5)'}
                                        onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                                    />
                                    <div style={{ textAlign: 'right', fontFamily: 'Outfit,sans-serif', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                                        {note.length}/200
                                    </div>
                                </div>

                                <button
                                    onClick={handleConfirm}
                                    disabled={booking}
                                    style={{
                                        width: '100%', background: booking ? 'rgba(0,232,122,0.4)' : 'var(--green)',
                                        border: 'none', borderRadius: 12, padding: '14px',
                                        color: '#060c18', fontFamily: 'Outfit,sans-serif',
                                        fontWeight: 800, fontSize: 15, cursor: booking ? 'not-allowed' : 'pointer',
                                        transition: 'opacity 0.15s', boxShadow: '0 4px 24px rgba(0,232,122,0.2)',
                                    }}
                                >
                                    {booking ? '⏳ Göndərilir...' : '✓ Sifarişi təsdiqlə'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StadiumDetailPage;
