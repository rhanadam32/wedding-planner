import axios from 'axios';
import Cookies from 'js-cookie';

const Api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
});

const jsonPlainHeaders = {
    'Content-Type': 'text/plain;charset=utf-8'
};

export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    message?: string;
    data?: T;
}

export interface User {
    id_user?: string | number;
    id?: string | number;
    name: string;
    role?: string;
    username: string;
}

export const authService = {
    async login(credentials: { username: string; password: string }) {
        const response = await Api.post('', JSON.stringify({
            action: 'login',
            username: credentials.username,
            password: credentials.password
        }), {
            headers: jsonPlainHeaders
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

    getUser(): User | null {
        const user = Cookies.get('user');
        if (!user) return null;
        try {
            const parsed = JSON.parse(user);
            if (!parsed.id_user && (parsed.id || parsed.username)) {
                parsed.id_user = parsed.id || parsed.username;
            }
            return parsed;
        } catch {
            return null;
        }
    },

    isAuthenticated() {
        return !!Cookies.get('token');
    }
};

// ========================================================
// 1. Tipe Data & Service untuk Rencana
// ========================================================
export interface RencanaItem {
    id: string | number;
    id_user?: string | number;
    TugasRencana: string;
    tgl_deadline: string;
    status: 'selesai' | 'pending';
}

export const rencanaService = {
    // A. Ambil data rencana (POST action atau GET fallback) terpisah per id_user
    async getRencana(idUser?: string | number): Promise<RencanaItem[]> {
        const uid = idUser ?? authService.getUser()?.id_user;
        try {
            const response = await Api.post('', JSON.stringify({
                action: 'getRencana',
                id_user: uid
            }), {
                headers: jsonPlainHeaders
            });
            if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
                return response.data.data;
            }
        } catch (e) {
            console.warn('POST getRencana error, mencoba GET...', e);
        }

        try {
            const response = await Api.get('', {
                params: uid ? { id_user: uid } : {}
            });
            if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
                return response.data.data;
            }
        } catch (err) {
            console.error('Gagal mengambil data rencana via GET:', err);
        }

        return [];
    },

    // B. Tambah tugas rencana baru (POST) dengan id_user
    async addRencana(payload: { TugasRencana: string; tgl_deadline?: string; id_user?: string | number }) {
        const uid = payload.id_user ?? authService.getUser()?.id_user;
        const response = await Api.post('', JSON.stringify({
            action: 'addRencana',
            TugasRencana: payload.TugasRencana,
            tgl_deadline: payload.tgl_deadline || '',
            id_user: uid
        }), {
            headers: jsonPlainHeaders
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
            headers: jsonPlainHeaders
        });
        return response.data;
    },

    // D. Hapus tugas rencana (POST)
    async deleteRencana(id: string | number) {
        const response = await Api.post('', JSON.stringify({
            action: 'deleteRencana',
            id: id
        }), {
            headers: jsonPlainHeaders
        });
        return response.data;
    }
};

// ========================================================
// 2. Tipe Data & Service untuk Transaksi
// ========================================================
export interface Transaksi {
    id_transaksi?: string;
    id_user?: string | number;
    tanggal: string;
    Keterangan: string;
    Kategori: string;
    Kredit_Debit: number | string;
}

export const transaksiService = {
    async getTransaksi(idUser?: string | number): Promise<Transaksi[]> {
        const uid = idUser ?? authService.getUser()?.id_user;
        const response = await Api.post('', JSON.stringify({
            action: 'getTransaksi',
            id_user: uid
        }), {
            headers: jsonPlainHeaders
        });
        if (response.data && response.data.status === 'success') {
            return response.data.data ?? [];
        }
        return [];
    },

    async addTransaksi(payload: Omit<Transaksi, 'id_transaksi'>) {
        const uid = payload.id_user ?? authService.getUser()?.id_user;
        const response = await Api.post('', JSON.stringify({
            action: 'addTransaksi',
            ...payload,
            id_user: uid
        }), {
            headers: jsonPlainHeaders
        });
        return response.data;
    },

    async updateTransaksi(payload: Partial<Transaksi> & { id_transaksi: string }) {
        const response = await Api.post('', JSON.stringify({
            action: 'updateTransaksi',
            ...payload
        }), {
            headers: jsonPlainHeaders
        });
        return response.data;
    },

    async deleteTransaksi(id_transaksi: string) {
        const response = await Api.post('', JSON.stringify({
            action: 'deleteTransaksi',
            id_transaksi
        }), {
            headers: jsonPlainHeaders
        });
        return response.data;
    }
};

// ========================================================
// 3. Tipe Data & Service untuk Tamu
// ========================================================
export interface Tamu {
    id?: string;
    id_user?: string | number;
    nama_tamu: string;
    kategori: string;
    kontak: string;
    konfirmasi: 'Hadir' | 'Tidak Hadir' | 'Pending';
}

export const TamuServices = {
    async getTamu(idUser?: string | number): Promise<Tamu[]> {
        const uid = idUser ?? authService.getUser()?.id_user;
        const response = await Api.post('', JSON.stringify({
            action: 'getTamu',
            id_user: uid
        }), {
            headers: jsonPlainHeaders
        });
        if (response.data && response.data.status === 'success') {
            return response.data.data ?? [];
        }
        return [];
    },

    async addTamu(payload: Omit<Tamu, 'id'>) {
        const uid = payload.id_user ?? authService.getUser()?.id_user;
        const response = await Api.post('', JSON.stringify({
            action: 'addTamu',
            ...payload,
            id_user: uid
        }), {
            headers: jsonPlainHeaders
        });
        return response.data;
    },

    async updateTamu(payload: Partial<Tamu> & { id: string }) {
        const response = await Api.post('', JSON.stringify({
            action: 'updateTamu',
            ...payload
        }), {
            headers: jsonPlainHeaders
        });
        return response.data;
    },

    async deleteTamu(id: string) {
        const response = await Api.post('', JSON.stringify({
            action: 'deleteTamu',
            id
        }), {
            headers: jsonPlainHeaders
        });
        return response.data;
    }
};

// ========================================================
// 4. Tipe Data & Service untuk Pengantin / Akun
// ========================================================
export interface Pengantin {
    id?: string;
    id_user?: string | number;
    calon_pengantin_pria: string;
    calon_pengantin_wanita: string;
    tanggal_pernikahan: string;
    Lokasi: string;
}

export const pengantinService = {
    async getPengantin(idUser?: string | number): Promise<Pengantin | null> {
        const uid = idUser ?? authService.getUser()?.id_user;
        const response = await Api.post('', JSON.stringify({
            action: 'getPengantin',
            id_user: uid
        }), {
            headers: jsonPlainHeaders
        });
        if (response.data && response.data.status === 'success') {
            if (Array.isArray(response.data.data)) {
                return response.data.data[0] || null;
            }
            return response.data.data || null;
        }
        return null;
    },

    async savePengantin(payload: Pengantin) {
        const uid = payload.id_user ?? authService.getUser()?.id_user;
        const response = await Api.post('', JSON.stringify({
            action: 'savePengantin',
            ...payload,
            id_user: uid
        }), {
            headers: jsonPlainHeaders
        });
        return response.data;
    }
};

export const akunService = pengantinService;

export default Api;
