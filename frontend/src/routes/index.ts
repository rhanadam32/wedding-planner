import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'home',
        component: () => import('../view/auth/login.vue')
    },
    {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('../view/dashboard/dashboard.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router