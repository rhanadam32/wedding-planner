import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { authService } from '../services/api.ts'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'home',
        component: () => import('../view/auth/login.vue')
    },
    {
        path: '/dashboard',
        component: () => import('../view/dashboard/dashboard.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'dashboard',
                component: () => import('../view/dashboard/dash-index.vue')
            },
            {
                path: 'rencana',
                name: 'rencana',
                component: () => import('../view/dashboard/rencana-index.vue')
            },
            {
                path: 'transaksi',
                name: 'transaksi',
                component: () => import('../view/dashboard/transaksi-index.vue')
            },
            {
                path: 'tamu',
                name: 'tamu',
                component: () => import('../view/dashboard/tamu-index.vue')
            },
            {
                path: 'akun',
                name: 'akun',
                component: () => import('../view/dashboard/akun-index.vue')
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to, _from, next) => {
    const isAuth = authService.isAuthenticated();

    if (to.matched.some(record => record.meta.requiresAuth) && !isAuth) {
        next({ name: 'home' });
    } else if (to.name === 'home' && isAuth) {
        next({ name: 'dashboard' });
    } else {
        next();
    }
})

export default router