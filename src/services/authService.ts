import type { User } from '../types/db';

import { auditService } from './auditService';
import { databaseService } from './databaseService';

export const authService = {
    login: async (pin: string): Promise<User | null> => {
        const users = await databaseService.query(
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
        return await databaseService.query('SELECT * FROM users ORDER BY name ASC');
    },

    createUser: async (user: Omit<User, 'id' | 'created_at'>): Promise<number> => {
        const result = await databaseService.query(
            'INSERT INTO users (name, role, pin, salary, pending_salary, given_salary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user.name, user.role, user.pin, user.salary || 0, user.salary || 0, 0, new Date().toISOString()]
        );
        return result.changes;
    },

    updateUser: async (id: number, user: Partial<User>): Promise<number> => {
        const fields = [];
        const params = [];
        if (user.name) { fields.push('name = ?'); params.push(user.name); }
        if (user.role) { fields.push('role = ?'); params.push(user.role); }
        if (user.pin) { fields.push('pin = ?'); params.push(user.pin); }
        if (user.salary !== undefined) { fields.push('salary = ?'); params.push(user.salary); }

        if (fields.length === 0) return 0;

        params.push(id);
        const result = await databaseService.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            params
        );
        return result.changes;
    },


    deleteUser: async (id: number): Promise<number> => {
        // Prevent deleting the last Admin
        const admins = await databaseService.query('SELECT count(*) as count FROM users WHERE role = "ADMIN"');
        const target = await databaseService.query('SELECT role FROM users WHERE id = ?', [id]);

        if (target[0]?.role === 'ADMIN' && admins[0].count <= 1) {
            throw new Error('Cannot delete the last Administrator.');
        }

        const result = await databaseService.query('DELETE FROM users WHERE id = ?', [id]);
        return result.changes;
    }
};
