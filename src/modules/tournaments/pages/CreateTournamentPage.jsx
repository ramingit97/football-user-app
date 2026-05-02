import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, DatePicker, InputNumber, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useCreateTournamentMutation } from '../../../store/tournamentsApi';

const FORMATS = ['5x5', '6x6', '7x7', '8x8', '11x11'];
const MAX_TEAMS_OPTIONS = [8, 16];
const PLATFORM_FEE_PCT = 0;

function Section({ title, icon, children }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 18, padding: '28px',
            marginBottom: 16,
        }}>
            <div style={{
                fontSize: 11, fontWeight: 700, color: '#f0c040',
                textTransform: 'uppercase', letterSpacing: '0.12em',
                marginBottom: 22, display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <span>{icon}</span> {title}
            </div>
            {children}
        </div>
    );
}

function Field({ label, hint, children, required }) {
    return (
        <div style={{ marginBottom: 22 }}>
            <label style={{
                display: 'block', fontWeight: 700, fontSize: 12,
                color: '#a0b0c0', marginBottom: 7,
                textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
                {label} {required && <span style={{ color: '#fc8181' }}>*</span>}
            </label>
            {children}
            {hint && <div style={{ fontSize: 12, color: '#5a6b7a', marginTop: 5 }}>{hint}</div>}
        </div>
    );
}

const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 10,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e0e6f0', fontSize: 15, fontFamily: 'inherit',
    outline: 'none', transition: 'border-color 0.2s',
    boxSizing: 'border-box',
};

function PrizeBar({ label, pct, amount, color, icon }) {
    return (
        <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: '#a0b0c0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{icon}</span> {label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color }}>
                    {pct}% {amount > 0 && <span style={{ color: '#7a8ba0', fontWeight: 400 }}>({amount} ₼)</span>}
                </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${Math.max(0, Math.min(pct, 100))}%`,
                    background: color, transition: 'width 0.3s ease',
                }} />
            </div>
        </div>
    );
}

export default function CreateTournamentPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const user = useSelector(s => s.auth.user);
    const [createTournament, { isLoading }] = useCreateTournamentMutation();

    const [form, setForm] = useState({
        name: '', description: '', format: '7x7', maxTeams: 16,
        entryFee: 100, location: '',
        registrationDeadline: null,
    });
    const [prize1, setPrize1] = useState(60);
    const [prize2, setPrize2] = useState(35);
    const [prize3, setPrize3] = useState(0);

    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const totalPool = useMemo(
        () => Number(form.entryFee || 0) * Number(form.maxTeams || 0),
        [form.entryFee, form.maxTeams],
    );
    const organizerPct = Math.max(0, 100 - PLATFORM_FEE_PCT - prize1 - prize2 - prize3);
    const pct = (p) => totalPool > 0 ? Math.round(totalPool * p / 100) : 0;
    const prizesValid = prize1 + prize2 + prize3 <= 95;
    const minPlayers = parseInt(form.format.split('x')[0], 10);

    if (!user) { navigate('/login'); return null; }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { message.error(t('tournaments.create.errorNameRequired')); return; }
        if (!form.format) { message.error(t('tournaments.create.errorFormatRequired')); return; }
        if (!prizesValid) { message.error(t('tournaments.create.prizesInvalid')); return; }
        try {
            const result = await createTournament({
                ...form,
                entryFee: Number(form.entryFee),
                prizePool: totalPool,
                maxTeams: Number(form.maxTeams),
                prize1Percent: prize1, prize2Percent: prize2, prize3Percent: prize3,
                registrationDeadline: form.registrationDeadline?.toISOString(),
            }).unwrap();
            message.success(t('tournaments.create.successMsg'));
            navigate(`/tournaments/${result.id}`);
        } catch (err) {
            message.error(err?.data?.message || 'Error');
        }
    };

    const tc = (key) => t(`tournaments.create.${key}`);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0a0e1a 0%, #060a14 100%)',
            color: '#e0e6f0', padding: '40px 24px 80px',
        }}>
            <style>{`
                input::placeholder, textarea::placeholder { color: #4a5b6a; }
                input:focus, textarea:focus {
                    border-color: rgba(240,192,64,0.5) !important;
                    background: rgba(255,255,255,0.08) !important;
                }
                .dark-picker .ant-picker {
                    background: rgba(255,255,255,0.06) !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    border-radius: 10px !important; width: 100%;
                }
                .dark-picker .ant-picker:hover,
                .dark-picker .ant-picker-focused {
                    border-color: rgba(240,192,64,0.5) !important;
                    box-shadow: none !important;
                }
                .dark-picker .ant-picker-input input { color: #e0e6f0 !important; font-size: 15px !important; }
                .dark-picker .ant-picker-suffix,
                .dark-picker .ant-picker-clear { color: #5a6b7a !important; }
                .dark-picker .ant-picker-clear:hover { color: #a0b0c0 !important; }
            `}</style>

            <div style={{ maxWidth: 640, margin: '0 auto' }}>
                <button
                    onClick={() => navigate('/tournaments')}
                    style={{
                        background: 'none', border: 'none', color: '#7a8ba0',
                        cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 28,
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}
                >
                    {tc('backToList')}
                </button>

                <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 13, color: '#f0c040', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
                        🏆 {tc('pageTitle')}
                    </div>
                    <h1 style={{ fontSize: 30, fontWeight: 900, margin: 0, color: '#e0e6f0' }}>
                        {tc('pageTitle')}
                    </h1>
                    <p style={{ color: '#7a8ba0', marginTop: 8, fontSize: 14 }}>
                        {tc('subtitle')}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* ─── Əsas / Основное ─── */}
                    <Section title={tc('sectionBasic')} icon="📋">
                        <Field label={tc('nameLabel')} required>
                            <input
                                style={inputStyle}
                                placeholder={tc('namePlaceholder')}
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                                maxLength={80}
                            />
                        </Field>
                        <Field label={tc('descLabel')} hint={tc('descHint')}>
                            <textarea
                                style={{ ...inputStyle, minHeight: 80, resize: 'vertical', lineHeight: 1.6 }}
                                placeholder={tc('descLabel') + '...'}
                                value={form.description}
                                onChange={e => set('description', e.target.value)}
                            />
                        </Field>
                        <Field label={tc('locationLabel')} hint={tc('locationHint')}>
                            <input
                                style={inputStyle}
                                placeholder={tc('locationPlaceholder')}
                                value={form.location}
                                onChange={e => set('location', e.target.value)}
                            />
                        </Field>
                    </Section>

                    {/* ─── Format ─── */}
                    <Section title={tc('sectionFormat')} icon="⚽">
                        <Field
                            label={tc('formatLabel')} required
                            hint={tc('formatHint').replace('{{count}}', minPlayers)}
                        >
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {FORMATS.map(f => (
                                    <button
                                        key={f} type="button" onClick={() => set('format', f)}
                                        style={{
                                            padding: '10px 20px', borderRadius: 10, border: 'none',
                                            cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
                                            background: form.format === f ? 'linear-gradient(135deg, #f0c040, #e07b20)' : 'rgba(255,255,255,0.07)',
                                            color: form.format === f ? '#1a1a2e' : '#a0b0c0',
                                        }}
                                    >{f}</button>
                                ))}
                            </div>
                        </Field>

                        <Field label={tc('maxTeamsLabel')} required hint={tc('maxTeamsHint')}>
                            <div style={{ display: 'flex', gap: 10 }}>
                                {MAX_TEAMS_OPTIONS.map(n => (
                                    <button
                                        key={n} type="button" onClick={() => set('maxTeams', n)}
                                        style={{
                                            padding: '12px 32px', borderRadius: 10, border: 'none',
                                            cursor: 'pointer', fontWeight: 700, fontSize: 16, transition: 'all 0.2s',
                                            background: form.maxTeams === n ? 'linear-gradient(135deg, #63b3ed, #4299e1)' : 'rgba(255,255,255,0.07)',
                                            color: form.maxTeams === n ? '#fff' : '#a0b0c0',
                                        }}
                                    >
                                        {n} {t('tournaments.teams').toLowerCase()}
                                    </button>
                                ))}
                            </div>
                        </Field>
                    </Section>

                    {/* ─── Start Date ─── */}
                    <Section title={tc('sectionDates')} icon="📅">
                        <Field label={tc('startDateLabel')} hint={tc('startDateHint')}>
                            <div className="dark-picker" style={{ maxWidth: 320 }}>
                                <DatePicker
                                    showTime={{ format: 'HH:mm' }} format="DD.MM.YYYY HH:mm"
                                    placeholder={tc('startDateLabel')}
                                    value={form.registrationDeadline}
                                    onChange={v => set('registrationDeadline', v)}
                                    disabledDate={d => d && d < dayjs().startOf('day')}
                                    style={{ width: '100%', padding: '11px 16px' }}
                                />
                            </div>
                        </Field>
                    </Section>

                    {/* ─── Finance ─── */}
                    <Section title={tc('sectionFinance')} icon="💰">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                            <Field label={tc('entryFeeLabel')} hint={tc('entryFeeHint')}>
                                <InputNumber
                                    min={0} step={10} value={form.entryFee}
                                    onChange={v => set('entryFee', v || 0)}
                                    style={{ width: '100%' }} addonAfter="₼" size="large"
                                />
                            </Field>
                            <Field label={tc('totalPool')}>
                                <div style={{
                                    padding: '13px 16px', borderRadius: 10,
                                    background: 'rgba(240,192,64,0.08)',
                                    border: '1px solid rgba(240,192,64,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                    <span style={{ color: '#7a8ba0', fontSize: 13 }}>
                                        {form.maxTeams} × {form.entryFee || 0} ₼
                                    </span>
                                    <span style={{ fontSize: 20, fontWeight: 900, color: '#f0c040' }}>
                                        {totalPool} ₼
                                    </span>
                                </div>
                            </Field>
                        </div>

                        {/* Prize distribution */}
                        <div style={{
                            padding: '20px', borderRadius: 14,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                        }}>
                            <div style={{
                                fontSize: 12, fontWeight: 700, color: '#a0b0c0',
                                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16,
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                {tc('prizeDistLabel')}
                                <Tooltip title={tc('prizeDistHint')}>
                                    <InfoCircleOutlined style={{ color: '#5a6b7a', cursor: 'help' }} />
                                </Tooltip>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                                {[
                                    { labelKey: 'prize1Label', val: prize1, setter: setPrize1, color: '#f0c040' },
                                    { labelKey: 'prize2Label', val: prize2, setter: setPrize2, color: '#a0aec0' },
                                    { labelKey: 'prize3Label', val: prize3, setter: setPrize3, color: '#cd7f32' },
                                ].map(({ labelKey, val, setter, color }) => (
                                    <div key={labelKey}>
                                        <div style={{ fontSize: 12, color: '#7a8ba0', marginBottom: 6 }}>{tc(labelKey)}</div>
                                        <InputNumber
                                            min={0} max={90} step={5} value={val}
                                            onChange={v => setter(v ?? 0)}
                                            addonAfter="%" size="middle"
                                            style={{ width: '100%' }}
                                            styles={{ input: { color } }}
                                        />
                                        {totalPool > 0 && (
                                            <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 700 }}>
                                                {pct(val)} ₼
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {!prizesValid && (
                                <div style={{
                                    padding: '8px 12px', borderRadius: 8, marginBottom: 12,
                                    background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.3)',
                                    fontSize: 12, color: '#fc8181',
                                }}>
                                    ⚠️ {tc('prizesInvalid')} ({prize1 + prize2 + prize3}%)
                                </div>
                            )}

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                                <PrizeBar label={tc('prize1Label')} icon="" pct={prize1} amount={pct(prize1)} color="#f0c040" />
                                <PrizeBar label={tc('prize2Label')} icon="" pct={prize2} amount={pct(prize2)} color="#a0aec0" />
                                <PrizeBar label={tc('prize3Label')} icon="" pct={prize3} amount={pct(prize3)} color="#cd7f32" />
                                <PrizeBar label={tc('organizerLabel')} icon="" pct={organizerPct} amount={pct(organizerPct)} color="#68d391" />
                            </div>
                        </div>
                    </Section>

                    {/* Min players notice */}
                    <div style={{
                        padding: '12px 18px', borderRadius: 12, marginBottom: 24,
                        background: 'rgba(240,192,64,0.07)', border: '1px solid rgba(240,192,64,0.18)',
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        fontSize: 12, color: '#a0b0c0',
                    }}>
                        <span style={{ fontSize: 18 }}>👥</span>
                        <div>
                            <strong style={{ color: '#f0c040' }}>{tc('minPlayersNotice')}</strong>{' '}
                            {tc('minPlayersDescPre')}{' '}
                            <strong style={{ color: '#f0c040' }}>{form.format}</strong>{' '}
                            — <strong style={{ color: '#f0c040' }}>{minPlayers}</strong>{' '}
                            {tc('minPlayersDescPost')}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !prizesValid}
                        style={{
                            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
                            cursor: isLoading || !prizesValid ? 'not-allowed' : 'pointer',
                            background: isLoading || !prizesValid
                                ? 'rgba(255,255,255,0.1)'
                                : 'linear-gradient(135deg, #f0c040, #e07b20)',
                            color: isLoading || !prizesValid ? '#7a8ba0' : '#1a1a2e',
                            fontWeight: 900, fontSize: 17, transition: 'all 0.2s',
                            opacity: isLoading ? 0.7 : 1,
                        }}
                    >
                        {isLoading ? tc('creating') : tc('submitBtn')}
                    </button>
                </form>
            </div>
        </div>
    );
}
