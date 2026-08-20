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
        name: 'dashboard',
        component: () => import('../view/dashboard/dashboard.vue'),
        meta: { requiresAuth: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to, from, next) => {
    const isAuth = authService.isAuthenticated();

    if (to.meta.requiresAuth && !isAuth) {
        next({ name: 'home' });
    } else if (!to.meta.requiresAuth && isAuth) {
        next({ name: 'dashboard' });
    } else {
        next();
    }

})

export default router