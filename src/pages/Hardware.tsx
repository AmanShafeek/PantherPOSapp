import { useState, useEffect } from 'react';
import { Printer, Power, CheckCircle2, AlertCircle, Store, Image, Upload, FileText, Trash2, Scale } from 'lucide-react';
import { Button } from '../components/Button';
import { settingsService, type AppSettings } from '../services/settingsService';
import { printerService } from '../services/printerService';
import { scaleService } from '../services/scaleService';
import clsx from 'clsx';

export default function Hardware() {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try { setSettings(await settingsService.getSettings()); } catch (err: any) { console.error(err); setError(err.message || "Failed"); } finally { setLoading(false); }
        };
        load();
    }, []);

    const update = async (key: keyof AppSettings, value: any) => {
        if (!settings) return;
        setSettings({ ...settings, [key]: value });
        try { await settingsService.updateSetting(key, value); } catch (err) { console.error(err); }
    };

    const handleTestPulse = async () => { if (!settings) return; try { await printerService.openDrawer(); } catch { alert('Failed Pulse'); } };
    const handleTestPrint = async () => { if (!settings) return; try { const res = await printerService.printReceipt({ bill_no: 'TEST', date: new Date().toISOString(), total: 0 }); if (res.success) alert('Success'); else alert('Error: ' + res.error); } catch { alert('Failed'); } };
    const handleTestScale = async () => { try { const res = await scaleService.readWeight(); if (res.success) alert(`Weight: ${res.weight}`); else alert(`Error: ${res.error}`); } catch { alert('Failed'); } };

    if (loading) return <div style={{ padding: '32px', color: 'white' }}>Loading...</div>;
    if (error || !settings) return <div style={{ padding: '32px', color: 'red' }}>Error: {error}</div>;

    const InputGroup = ({ label, value, field, type = "text", placeholder = "", rows }: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', opacity: 0.6, marginLeft: '4px' }}>{label}</label>
            {rows ? (
                <textarea
                    style={{ width: '100%', minHeight: '80px', padding: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: 'bold', outline: 'none', resize: 'none' }}
                    value={value || ''}
                    onChange={(e) => update(field, e.target.value)}
                    placeholder={placeholder}
                />
            ) : (
                <input
                    type={type}
                    style={{ width: '100%', height: '48px', padding: '0 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: 'bold', outline: 'none' }}
                    value={value || ''}
                    onChange={(e) => update(field, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                    placeholder={placeholder}
                />
            )}
        </div>
    );

    return (
        <div className="p-6 bg-white min-h-screen text-black font-sans">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Hardware Settings</h1>
                <p className="text-gray-500 text-sm">Configure POS Peripherals & Diagnostics</p>
            </div>

            <div className="max-w-3xl flex flex-col gap-6">

                {/* THERMAL PRINTER */}
                <div className="border rounded p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Printer size={20} className="text-blue-500" />
                        <h2 className="text-lg font-bold">Thermal Printer</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-bold border ${settings.printer_enabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                            {settings.printer_enabled ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            {settings.printer_enabled ? 'Printer Ready' : 'Printer Disabled'}
                        </div>
                        <Button
                            onClick={() => update('printer_enabled', !settings.printer_enabled)}
                            variant={settings.printer_enabled ? 'secondary' : 'primary'}
                        >
                            <Power size={14} className="mr-2" /> {settings.printer_enabled ? 'Disable' : 'Enable'}
                        </Button>
                    </div>
                </div>

                {/* WEIGHING SCALE */}
                <div className="border rounded p-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <Scale size={20} className="text-purple-500" />
                            <h2 className="text-lg font-bold">Weighing Scale</h2>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.scale_enabled}
                            onChange={(e) => update('scale_enabled', e.target.checked)}
                            className="w-5 h-5"
                        />
                    </div>

                    {settings.scale_enabled && (
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="Serial Port" value={settings.scale_port} field="scale_port" placeholder="COM1" />
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Baud Rate</label>
                                    <select
                                        value={settings.scale_baud_rate}
                                        onChange={e => update('scale_baud_rate', parseInt(e.target.value))}
                                        className="w-full p-2 border rounded"
                                    >
                                        {[2400, 4800, 9600, 19200, 38400, 57600, 115200].map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                            </div>
                            <Button variant="secondary" onClick={handleTestScale} className="w-full">Test Scale Connectivity</Button>
                        </div>
                    )}
                </div>

                {/* STORE IDENTITY */}
                <div className="border rounded p-4">
                    <div className="flex items-center gap-2 mb-4 border-b pb-2">
                        <Store size={20} className="text-green-500" />
                        <h2 className="text-lg font-bold">Store Identity</h2>
                    </div>
                    <div className="flex flex-col gap-3">
                        <InputGroup label="Store Name" value={settings.store_name} field="store_name" />
                        <InputGroup label="Store GSTIN" value={settings.gst_no} field="gst_no" />
                        <InputGroup label="Address" value={settings.store_address} field="store_address" rows={true} />
                    </div>
                </div>

                {/* BUSINESS LOGO */}
                <div className="border rounded p-4">
                    <div className="flex items-center gap-2 mb-4 border-b pb-2">
                        <Image size={20} className="text-blue-400" />
                        <h2 className="text-lg font-bold">Business Logo</h2>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-24 h-24 border rounded flex items-center justify-center bg-gray-50">
                            {settings.store_logo ? (
                                <img src={settings.store_logo} alt="Logo" className="max-h-20 max-w-20 object-contain" />
                            ) : (
                                <Upload size={24} className="text-gray-300" />
                            )}
                        </div>
                        <div className="flex-1">
                            <InputGroup label="Logo URL (Base64)" value={settings.store_logo} field="store_logo" placeholder="Paste Base64..." />
                        </div>
                    </div>
                </div>

                {/* INVOICE TERMS */}
                <div className="border rounded p-4">
                    <div className="flex items-center gap-2 mb-4 border-b pb-2">
                        <FileText size={20} className="text-yellow-600" />
                        <h2 className="text-lg font-bold">Invoice Terms & Conditions</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup label="Terms (Detailed)" value={settings.invoice_terms} field="invoice_terms" rows={true} />
                        <InputGroup label="Footer (Greeting)" value={settings.invoice_footer} field="invoice_footer" rows={true} />
                    </div>
                </div>

            </div>
        </div>
    );
}
