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

export default Api;