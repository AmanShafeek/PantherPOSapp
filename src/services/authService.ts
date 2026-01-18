import type { User } from '../types/db';

import { auditService } from './auditService';

export const authService = {
    login: async (pin: string): Promise<User | null> => {
        const users = await window.electronAPI.dbQuery(
            'SELECT * FROM users WHERE pin = ?',
            [pin]
        );

        if (users.length > 0) {
            const user = users[0];
            localStorage.setItem('user', JSON.stringify(user));
            // Log successful login
            await auditService.log('LOGIN', { method: 'PIN' });
            return user;
        }
        return null;
    },

    getUsers: async (): Promise<User[]> => {
        return await window.electronAPI.dbQuery('SELECT * FROM users ORDER BY name ASC');
    },

    createUser: async (user: Omit<User, 'id' | 'created_at'>): Promise<number> => {
        const result = await window.electronAPI.dbQuery(
            'INSERT INTO users (name, role, pin, created_at) VALUES (?, ?, ?, ?)',
            [user.name, user.role, user.pin, new Date().toISOString()]
        );
        return result.changes;
    },

    deleteUser: async (id: number): Promise<number> => {
        // Prevent deleting the last Admin
        const admins = await window.electronAPI.dbQuery('SELECT count(*) as count FROM users WHERE role = "ADMIN"');
        const target = await window.electronAPI.dbQuery('SELECT role FROM users WHERE id = ?', [id]);

        if (target[0]?.role === 'ADMIN' && admins[0].count <= 1) {
            throw new Error('Cannot delete the last Administrator.');
        }

        const result = await window.electronAPI.dbQuery('DELETE FROM users WHERE id = ?', [id]);
        return result.changes;
    }
};
