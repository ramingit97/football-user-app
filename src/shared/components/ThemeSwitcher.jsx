import { useState } from 'react';
import { Drawer, Switch } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useTheme, THEMES, ACCENT_COLORS, FONT_SIZES } from '../context/ThemeContext';

const ThemeSwitcher = () => {
    const [visible, setVisible] = useState(false);
    const {
        currentThemeKey, changeTheme,
        accentKey, changeAccent,
        fontSizeKey, changeFontSize,
        isCompact, toggleCompact,
    } = useTheme();

    return (
        <>
            <button
                onClick={() => setVisible(true)}
                title="Görünüş"
                style={{
                    position: 'fixed', right: 20, bottom: 80, zIndex: 1000,
                    width: 44, height: 44, borderRadius: 12,
                    background: 'var(--header-bg)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                    transition: 'all 0.2s',
                    color: 'var(--green)',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(0,232,122,0.3)';
                    e.currentTarget.style.background = 'rgba(0,232,122,0.06)';
                    e.currentTarget.style.transform = 'rotate(30deg) scale(1.06)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.background = 'var(--header-bg)';
                    e.currentTarget.style.transform = 'none';
                }}
            >
                <SettingOutlined style={{ fontSize: 17 }} />
            </button>

            <Drawer
                title={
                    <span style={{ fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif", fontWeight: 700, fontSize: 16 }}>
                        ⚙️ Görünüş
                    </span>
                }
                placement="right"
                onClose={() => setVisible(false)}
                open={visible}
                width={300}
                styles={{ body: { padding: '20px 16px' } }}
            >
                {/* ── Background theme ── */}
                <Section label="Fon">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {Object.values(THEMES).map(t => {
                            const active = currentThemeKey === t.key.toUpperCase();
                            return (
                                <button
                                    key={t.key}
                                    onClick={() => changeTheme(t.key.toUpperCase())}
                                    style={{
                                        padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                                        border: active ? '2px solid var(--green)' : '1px solid var(--border-color)',
                                        background: active ? 'var(--green-dim)' : t.bg.card,
                                        color: active ? 'var(--green)' : t.text.primary,
                                        fontFamily: 'Outfit, sans-serif', fontWeight: active ? 700 : 400,
                                        fontSize: 13, transition: 'all 0.15s',
                                        display: 'flex', alignItems: 'center', gap: 6,
                                    }}
                                >
                                    <span style={{
                                        width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                                        background: t.bg.raised, border: `2px solid ${t.border}`,
                                    }} />
                                    {t.name}
                                </button>
                            );
                        })}
                    </div>
                </Section>

                <Divider />

                {/* ── Accent color ── */}
                <Section label="Accent rəng">
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {ACCENT_COLORS.map(a => {
                            const active = accentKey === a.key;
                            return (
                                <button
                                    key={a.key}
                                    onClick={() => changeAccent(a.key)}
                                    title={a.label}
                                    style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        background: a.color, border: 'none', cursor: 'pointer',
                                        outline: active ? `3px solid ${a.color}` : '2px solid transparent',
                                        outlineOffset: 2,
                                        boxShadow: active ? `0 0 12px ${a.glow}` : 'none',
                                        transition: 'all 0.15s',
                                        transform: active ? 'scale(1.15)' : 'scale(1)',
                                    }}
                                />
                            );
                        })}
                    </div>
                </Section>

                <Divider />

                {/* ── Font size ── */}
                <Section label="Şrift ölçüsü">
                    <div style={{ display: 'flex', gap: 8 }}>
                        {FONT_SIZES.map(f => {
                            const active = fontSizeKey === f.key;
                            return (
                                <button
                                    key={f.key}
                                    onClick={() => changeFontSize(f.key)}
                                    style={{
                                        flex: 1, padding: '8px 0', borderRadius: 8,
                                        border: active ? '2px solid var(--green)' : '1px solid var(--border-color)',
                                        background: active ? 'var(--green-dim)' : 'transparent',
                                        color: active ? 'var(--green)' : 'var(--text-secondary)',
                                        fontFamily: 'Outfit, sans-serif',
                                        fontWeight: active ? 700 : 400,
                                        fontSize: f.key === 'small' ? 12 : f.key === 'large' ? 16 : 14,
                                        cursor: 'pointer', transition: 'all 0.15s',
                                    }}
                                >
                                    {f.label}
                                </button>
                            );
                        })}
                    </div>
                </Section>

                <Divider />

                {/* ── Compact mode ── */}
                <Section label="">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: 'var(--text-secondary)' }}>
                            Kompakt rejim
                        </span>
                        <Switch checked={isCompact} onChange={toggleCompact} size="small" />
                    </div>
                </Section>

                <div style={{ marginTop: 32, textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'Outfit, sans-serif' }}>
                    Topin v1.0
                </div>
            </Drawer>
        </>
    );
};

const Section = ({ label, children }) => (
    <div style={{ marginBottom: 4 }}>
        {label && (
            <div style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 11,
                color: 'var(--text-tertiary)', textTransform: 'uppercase',
                letterSpacing: 1, marginBottom: 10,
            }}>
                {label}
            </div>
        )}
        {children}
    </div>
);

const Divider = () => (
    <div style={{ height: 1, background: 'var(--border-color)', margin: '18px 0' }} />
);

export default ThemeSwitcher;
