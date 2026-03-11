import { useState } from 'react';
import {
    Shield, Zap, Database, Clock, CheckCircle2,
    ExternalLink, AlertTriangle, FileJson, Bell
} from 'lucide-react';
import { useSettings, type Config } from '../hooks/useSettings';

const SHEET_ID = '1aTMH5Yz28X_NA6lZgtjQzc7jlu9hiAPVVuf1ASTBQoU';

const SectionCard = ({ icon, title, badge, children }: {
    icon: React.ReactNode; title: string; badge?: React.ReactNode; children: React.ReactNode;
}) => (
    <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 22px', borderBottom: '1px solid var(--border)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--accent-light)' }}>{icon}</span>
                <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-1)' }}>{title}</span>
            </div>
            {badge}
        </div>
        <div style={{ padding: '22px' }}>
            {children}
        </div>
    </div>
);

const SettingRow = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
    <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 0', borderBottom: '1px solid var(--border-subtle)'
    }}>
        <div style={{ flex: 1, paddingRight: '24px' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-1)', marginBottom: '3px' }}>{label}</div>
            {desc && <div style={{ fontSize: '11.5px', color: 'var(--text-3)', lineHeight: 1.5 }}>{desc}</div>}
        </div>
        {children}
    </div>
);

const SettingInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} style={{
        width: '88px', height: '34px', padding: '0 10px',
        borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
        background: 'var(--bg-elevated)', color: 'var(--text-1)',
        fontSize: '13px', fontFamily: 'JetBrains Mono, monospace',
        outline: 'none', textAlign: 'right', transition: 'var(--trans-s)'
    }} />
);

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0, cursor: 'pointer' }}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
            style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
        <span style={{
            position: 'absolute', inset: 0, borderRadius: '99px',
            background: checked ? 'var(--accent)' : 'var(--border-strong)',
            transition: 'var(--trans-s)'
        }} />
        <span style={{
            position: 'absolute', top: 3, left: checked ? 23 : 3,
            width: 18, height: 18, borderRadius: '50%', background: 'white',
            transition: 'var(--trans-s)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
        }} />
    </label>
);

export default function SettingsPage() {
    const { settings: config, saveSettings } = useSettings();
    const [local, setLocal] = useState<Config>(config);
    const [saved, setSaved] = useState(false);

    const upd = (key: keyof Config, val: any) => setLocal(p => ({ ...p, [key]: val }));

    const handleSave = () => {
        saveSettings(local);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const copyJson = () => {
        navigator.clipboard.writeText(JSON.stringify(local, null, 2));
        alert('Config JSON copied — paste into your n8n workflow node.');
    };

    const rrRatio = local.targetPoints / local.stopLossPoints;

    const sources = [
        { label: 'Signals Feed',    code: 'GID: 0',            desc: 'Updated every 5 minutes during market hours' },
        { label: 'Open Positions',  code: 'GID: 773018112',    desc: 'Real-time active monitoring' },
        { label: 'Trade History',   code: 'GID: 2086062684',   desc: 'Completed trade log & total stats' },
        { label: 'Price Feed',      code: 'TradingView API',   desc: 'NIFTY 50 & India VIX live pricing' },
    ];

    const schedule = [
        { label: 'Market Hours Refresh',  value: '30 sec',            desc: '9:15 AM – 3:30 PM IST' },
        { label: 'Off-Hours Refresh',     value: '3 min',             desc: 'Outside market session' },
        { label: 'Automation Cron',       value: '*/5 9-15 * * 1-5', desc: 'n8n workflow trigger' },
    ];

    return (
        <div className="page-scroll">
        <div className="page-body enter">

            {/* Toast */}
            {saved && (
                <div style={{
                    position: 'fixed', top: 80, right: 24, zIndex: 9999,
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 18px', borderRadius: 'var(--r-lg)',
                    background: 'var(--bg-elevated)', border: '1px solid var(--profit)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)', animation: 'enter 0.2s ease'
                }}>
                    <CheckCircle2 size={16} color="var(--profit)" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>Settings saved successfully</span>
                </div>
            )}

            {/* Title */}
            <div>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: '4px' }}>Tools</div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Settings</h2>
            </div>

            {/* Two-Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                {/* ── Left Column ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Risk Management */}
                    <SectionCard icon={<Shield size={15} />} title="Risk Management"
                        badge={local.paperTradingMode && <span className="badge badge-warn" style={{ fontSize: '10px' }}>Virtual Mode</span>}>

                        <SettingRow label="Virtual Trading Mode" desc="No real orders placed on broker when enabled">
                            <Toggle checked={local.paperTradingMode} onChange={v => upd('paperTradingMode', v)} />
                        </SettingRow>
                        <SettingRow label="Trade Quantity" desc="Number of lots per trade signal">
                            <SettingInput type="number" value={local.lotSize} min={1} step={1}
                                onChange={e => upd('lotSize', parseInt(e.target.value))} />
                        </SettingRow>
                        <SettingRow label="Stop Loss (Points)" desc="Max loss tolerance per trade">
                            <SettingInput type="number" value={local.stopLossPoints} min={5} max={50}
                                onChange={e => upd('stopLossPoints', parseInt(e.target.value))} />
                        </SettingRow>
                        <SettingRow label="Profit Target (Points)" desc="Exit trigger for profitable trades">
                            <SettingInput type="number" value={local.targetPoints} min={10} max={100}
                                onChange={e => upd('targetPoints', parseInt(e.target.value))} />
                        </SettingRow>

                        {/* R:R Readout */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px 14px', marginTop: '4px', borderRadius: 'var(--r-md)',
                            background: 'var(--bg-elevated)', border: '1px solid var(--border)'
                        }}>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', marginBottom: '2px' }}>Calculated R:R Ratio</div>
                                {rrRatio < 1.5 && <div style={{ fontSize: '10.5px', color: 'var(--warn)' }}>⚠ Aim for at least 1.5</div>}
                            </div>
                            <span style={{
                                fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '16px',
                                color: rrRatio >= 2 ? 'var(--profit)' : rrRatio >= 1.5 ? 'var(--warn)' : 'var(--loss)'
                            }}>1 : {rrRatio.toFixed(2)}</span>
                        </div>

                        <SettingRow label="Max Daily Loss (₹)" desc="Halt all trading if this threshold is breached">
                            <SettingInput type="number" value={local.maxDailyLoss} min={1000} step={500}
                                onChange={e => upd('maxDailyLoss', parseInt(e.target.value))} />
                        </SettingRow>
                    </SectionCard>

                    {/* Automation Rules */}
                    <SectionCard icon={<Zap size={15} />} title="Automation Rules">
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: '10px',
                            padding: '11px 14px', borderRadius: 'var(--r-md)', marginBottom: '12px',
                            background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)'
                        }}>
                            <AlertTriangle size={14} color="var(--warn)" style={{ marginTop: 1, flexShrink: 0 }} />
                            <span style={{ fontSize: '11.5px', color: 'var(--text-3)', lineHeight: 1.6 }}>
                                These values are used for reference. Update the live rules inside your n8n workflow.
                            </span>
                        </div>

                        <SettingRow label="Volatility Limit (VIX)" desc="Block signals above this VIX threshold">
                            <SettingInput type="number" value={local.vixThreshold} min={10} max={30} step={0.5}
                                onChange={e => upd('vixThreshold', parseFloat(e.target.value))} />
                        </SettingRow>
                        <SettingRow label="Confidence Required" desc="Minimum signal strength to trigger entry">
                            <SettingInput type="number" value={local.confidenceThreshold} min={10} max={60}
                                onChange={e => upd('confidenceThreshold', parseInt(e.target.value))} />
                        </SettingRow>
                        <SettingRow label="Trend Strength (ADX)" desc="Minimum trend power needed for entry">
                            <SettingInput type="number" value={local.adxThreshold} min={10} max={40}
                                onChange={e => upd('adxThreshold', parseInt(e.target.value))} />
                        </SettingRow>
                        <SettingRow label="Confirmation Bars" desc="Bars needed to confirm direction">
                            <SettingInput type="number" value={local.minStreak} min={1} max={5}
                                onChange={e => upd('minStreak', parseInt(e.target.value))} />
                        </SettingRow>
                        <SettingRow label="Repeat Trade Protection" desc="Prevent the same trade firing consecutively">
                            <Toggle checked={local.repeatProtection} onChange={v => upd('repeatProtection', v)} />
                        </SettingRow>
                    </SectionCard>
                </div>

                {/* ── Right Column ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Data Sources */}
                    <SectionCard icon={<Database size={15} />} title="Data Sources">
                        {/* Sheet ID */}
                        <div style={{ padding: '14px', marginBottom: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Database Sheet ID</div>
                            <code style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--accent-light)', wordBreak: 'break-all', marginBottom: '10px' }}>{SHEET_ID}</code>
                            <a href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}`} target="_blank" rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--accent-light)', fontWeight: 600, textDecoration: 'none' }}>
                                Open Spreadsheet <ExternalLink size={11} />
                            </a>
                        </div>

                        {sources.map(s => (
                            <SettingRow key={s.label} label={s.label} desc={s.desc}>
                                <code style={{
                                    fontFamily: 'JetBrains Mono, monospace', fontSize: '11px',
                                    color: 'var(--accent-light)', background: 'var(--accent-dim)',
                                    padding: '3px 8px', borderRadius: 'var(--r-sm)', whiteSpace: 'nowrap',
                                    border: '1px solid rgba(99,102,241,0.15)'
                                }}>{s.code}</code>
                            </SettingRow>
                        ))}
                    </SectionCard>

                    {/* Update Schedule */}
                    <SectionCard icon={<Bell size={15} />} title="Update Schedule">
                        {schedule.map(s => (
                            <SettingRow key={s.label} label={s.label} desc={s.desc}>
                                <span style={{
                                    fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 700,
                                    color: 'var(--accent-light)', whiteSpace: 'nowrap'
                                }}>{s.value}</span>
                            </SettingRow>
                        ))}
                    </SectionCard>

                    {/* Quick Links */}
                    <SectionCard icon={<ExternalLink size={15} />} title="External Resources">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {[
                                { label: 'Broker Portal',      url: 'https://developer.dhan.co' },
                                { label: 'Trading API Docs',   url: 'https://smartapi.angelbroking.com' },
                                { label: 'n8n Automation',     url: 'https://docs.n8n.io' },
                                { label: 'Performance Sheet',  url: `https://docs.google.com/spreadsheets/d/${SHEET_ID}` },
                            ].map(l => (
                                <a key={l.url} href={l.url} target="_blank" rel="noreferrer" style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '11px 14px', borderRadius: 'var(--r-md)',
                                    border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                                    textDecoration: 'none', color: 'var(--text-2)',
                                    fontSize: '12.5px', fontWeight: 600, transition: 'var(--trans-s)'
                                }}>
                                    {l.label} <ExternalLink size={11} color="var(--text-3)" />
                                </a>
                            ))}
                        </div>
                    </SectionCard>

                    {/* Schedule info for session */}
                    <div style={{ padding: '16px 18px', borderRadius: 'var(--r-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <Clock size={14} color="var(--accent-light)" />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)' }}>System Schedule</span>
                        </div>
                        {[
                            ['Pre-market',   '08:00 – 09:14'],
                            ['Market Hours', '09:15 – 15:30'],
                            ['Post-market',  '15:31 – 17:00'],
                        ].map(([label, time]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{label}</span>
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text-2)', fontWeight: 600 }}>{time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Action Bar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 22px', borderRadius: 'var(--r-xl)',
                background: 'var(--bg-elevated)', border: '1px solid var(--border)'
            }}>
                <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                    Settings saved locally. Use "Sync" to export values to n8n.
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={copyJson} style={{
                        display: 'flex', alignItems: 'center', gap: '7px',
                        padding: '8px 18px', borderRadius: 'var(--r-md)',
                        border: '1px solid var(--border)', background: 'var(--bg-subtle)',
                        color: 'var(--text-2)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'var(--trans-s)'
                    }}>
                        <FileJson size={14} /> Sync Export
                    </button>
                    <button onClick={handleSave} style={{
                        display: 'flex', alignItems: 'center', gap: '7px',
                        padding: '8px 22px', borderRadius: 'var(--r-md)',
                        border: 'none', background: 'var(--accent-grad)',
                        color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'var(--trans-s)'
                    }}>
                        <CheckCircle2 size={14} /> Save Changes
                    </button>
                </div>
            </div>

        </div>
        </div>
    );
}
