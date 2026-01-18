import { useState, useEffect } from 'react';
import { notificationService, type Notification } from '../services/notificationService';
import { Bell, Check, Trash2, AlertTriangle, Info } from 'lucide-react';
import { Button } from '../components/Button';

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const loadData = async () => { setNotifications(await notificationService.getAll(false)); };
    useEffect(() => { loadData(); }, []);

    const handleMarkRead = async (id: number) => {
        await notificationService.markRead(id);
        setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    };

    const handleMarkAll = async () => { await notificationService.markAllRead(); loadData(); };

    return (
        <div className="p-6 bg-white min-h-screen text-black font-sans">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Bell className="text-orange-500" size={24} /> Notifications
                    </h1>
                    <p className="text-gray-500 text-sm">Alerts & History</p>
                </div>
                <Button onClick={handleMarkAll} variant="secondary">
                    <Check size={16} className="mr-2" /> Mark All Read
                </Button>
            </div>

            <div className="border rounded overflow-hidden bg-gray-50 h-[calc(100vh-120px)] overflow-y-auto p-4">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-gray-400 h-full">
                        <Bell size={48} className="mb-4 opacity-20" />
                        <span className="font-bold">No Notifications</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`p-4 rounded border flex gap-4 transition-all ${n.is_read ? 'bg-white text-gray-500' : 'bg-orange-50 border-orange-200 shadow-sm'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'LOW_STOCK' ? 'bg-orange-100 text-orange-500' : 'bg-blue-100 text-blue-500'
                                    }`}>
                                    {n.type === 'LOW_STOCK' ? <AlertTriangle size={20} /> : <Info size={20} />}
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-bold text-sm uppercase ${n.is_read ? 'text-gray-500' : 'text-black'}`}>
                                            {n.title}
                                        </h3>
                                        <span className="text-xs text-gray-400 font-mono">
                                            {new Date(n.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm mt-1">{n.message}</p>
                                </div>

                                {!n.is_read && (
                                    <button
                                        onClick={() => handleMarkRead(n.id)}
                                        title="Mark as Read"
                                        className="self-center p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded"
                                    >
                                        <Check size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
