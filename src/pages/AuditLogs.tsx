import { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { auditService, type AuditLogEntry } from '../services/auditService';
import { Table } from '../components/Table';
import clsx from 'clsx';

export default function AuditLogs() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('');

    const loadLogs = async () => {
        setLoading(true);
        try { const data = await auditService.getLogs(200); setLogs(data); } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { loadLogs(); }, []);

    const filteredLogs = logs.filter(log =>
        log.user_name.toLowerCase().includes(filter.toLowerCase()) ||
        log.action.toLowerCase().includes(filter.toLowerCase()) ||
        log.details.toLowerCase().includes(filter.toLowerCase())
    );

    const columns = [
        {
            header: 'Time',
            accessor: (row: AuditLogEntry) => (
                <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
                    <div style={{ fontWeight: 'bold', color: 'white' }}>{new Date(row.timestamp).toLocaleDateString()}</div>
                    <div style={{ opacity: 0.6 }}>{new Date(row.timestamp).toLocaleTimeString()}</div>
                </div>
            )
        },
        { header: 'User', accessor: (row: AuditLogEntry) => <span style={{ fontWeight: 'bold', color: 'white' }}>{row.user_name}</span> },
        {
            header: 'Action',
            accessor: (row: AuditLogEntry) => (
                <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                    {row.action}
                </span>
            )
        },
        {
            header: 'Details',
            accessor: (row: AuditLogEntry) => <span style={{ fontSize: '12px', color: '#a1a1aa', wordBreak: 'break-all', display: 'block', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.details || ''}>{row.details || '-'}</span>,
            className: "w-1/2"
        }
    ];

    return (
        <div className="p-6 bg-white min-h-screen text-black font-sans">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Audit Log</h1>
                    <p className="text-gray-500 text-sm">System security and activity history</p>
                </div>
                <button
                    onClick={loadLogs}
                    className="p-2 border rounded hover:bg-gray-100"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Filter logs by user, action, or details..."
                    className="w-full p-3 border rounded"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                />
            </div>

            <div className="border rounded overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="p-3 border-b">Time</th>
                            <th className="p-3 border-b">User</th>
                            <th className="p-3 border-b">Action</th>
                            <th className="p-3 border-b">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.length > 0 ? (
                            filteredLogs.map((log, idx) => (
                                <tr key={idx} className="border-b hover:bg-gray-50">
                                    <td className="p-3">
                                        <div className="font-medium">{new Date(log.timestamp).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="p-3 font-bold">{log.user_name}</td>
                                    <td className="p-3">
                                        <span className="px-2 py-1 bg-gray-100 border rounded text-xs font-bold uppercase">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-600 truncate max-w-xs" title={log.details || ''}>
                                        {log.details || '-'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                    No audit logs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
