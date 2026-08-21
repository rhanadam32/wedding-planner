import axios from 'axios';
import Cookies from 'js-cookie';

const Api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
});

export const authService = {
    async login(credentials: { username: string; password: string }) {
        const response = await Api.post('', JSON.stringify({
            action: 'login',
            username: credentials.username,
            password: credentials.password
        }), {
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            }
        });

        if (response.data.status === 'success') {
            Cookies.set('token', response.data.token, {
                expires: 1
            });
            Cookies.set('user', JSON.stringify(response.data.user), { expires: 1 });
        }
        return response.data;
    },

    logout() {
        Cookies.remove('token');
        Cookies.remove('user');
    },

    getUser() {
        const user = Cookies.get('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated() {
        return !!Cookies.get('token');
    }
};

// ========================================================
// 1. Tipe Data / Interface untuk Rencana
// ========================================================
export interface RencanaItem {
    id: string | number;
    TugasRencana: string;
    tgl_deadline: string;
    status: 'selesai' | 'pending';
}
// ========================================================
// 2. Service untuk CRUD Sheet Rencana
// ========================================================
export const rencanaService = {
    // A. Ambil semua data rencana (GET)
    async getRencana(): Promise<RencanaItem[]> {
        const response = await Api.get('');
        if (response.data.status === 'success') {
            return response.data.data;
        }
        return [];
    },
    // B. Tambah tugas rencana baru (POST)
    async addRencana(payload: { TugasRencana: string; tgl_deadline?: string }) {
        const response = await Api.post('', JSON.stringify({
            action: 'addRencana',
            TugasRencana: payload.TugasRencana,
            tgl_deadline: payload.tgl_deadline || ''
        }), {
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        return response.data;
    },
    // C. Update status selesai / pending (POST)
    async updateStatusRencana(id: string | number, status: 'selesai' | 'pending') {
        const response = await Api.post('', JSON.stringify({
            action: 'updateStatusRencana',
            id: id,
            status: status
        }), {
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        return response.data;
    },
    // D. Hapus tugas rencana (POST)
    async deleteRencana(id: string | number) {
        const response = await Api.post('', JSON.stringify({
            action: 'deleteRencana',
            id: id
        }), {
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        return response.data;
    }
};

export default Api;