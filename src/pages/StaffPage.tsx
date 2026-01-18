import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types/db';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isaddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const [role, setRole] = useState<User['role']>('CASHIER');

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        try { const data = await authService.getUsers(); setUsers(data); } catch (error) { console.error(error); toast.error('Failed to load staff'); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault(); if (!name || !pin) return; setIsLoading(true);
        try { await authService.createUser({ name, pin, role }); toast.success('Staff member added'); setIsAddModalOpen(false); resetForm(); loadUsers(); } catch (error: any) { toast.error(error.message || 'Failed to create user'); } finally { setIsLoading(false); }
    };

    const handleDelete = async (id: number, userName: string) => {
        if (!confirm(`Are you sure you want to delete ${userName}?`)) return;
        try { await authService.deleteUser(id); toast.success('User deleted'); loadUsers(); } catch (error: any) { toast.error(error.message || 'Failed to delete user'); }
    };

    const resetForm = () => { setName(''); setPin(''); setRole('CASHIER'); };

    return (
        <div className="p-4 bg-white min-h-screen text-black">
            <h1 className="text-2xl font-bold mb-4">Staff Management</h1>
            <p className="mb-4 text-gray-600">Manage access and permissions for your team.</p>

            <button
                onClick={() => setIsAddModalOpen(true)}
                className="mb-6 bg-blue-600 text-white px-4 py-2 rounded"
            >
                + Add Staff
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {users.map(user => (
                    <div key={user.id} className="border p-4 rounded bg-gray-50 flex justify-between items-start">
                        <div>
                            <div className="font-bold text-lg">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.role}</div>
                            <div className="text-xs text-gray-400 mt-2">PIN: ****</div>
                        </div>
                        <button onClick={() => handleDelete(user.id, user.name)} className="text-red-500 hover:text-red-700">
                            Delete
                        </button>
                    </div>
                ))}
            </div>

            <Modal isOpen={isaddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Team Member">
                <form onSubmit={handleCreate} className="flex flex-col gap-4 p-2">
                    <input
                        type="text"
                        placeholder="Full Name"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="border p-2 rounded"
                    />
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input type="radio" name="role" checked={role === 'CASHIER'} onChange={() => setRole('CASHIER')} /> Cashier
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="radio" name="role" checked={role === 'MANAGER'} onChange={() => setRole('MANAGER')} /> Manager
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="radio" name="role" checked={role === 'ADMIN'} onChange={() => setRole('ADMIN')} /> Admin
                        </label>
                    </div>
                    <input
                        type="password"
                        placeholder="PIN (4 digits)"
                        required
                        maxLength={8}
                        pattern="[0-9]{4,}"
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                        className="border p-2 rounded"
                    />
                    <Button type="submit" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Account'}</Button>
                </form>
            </Modal>
        </div>
    );
}
