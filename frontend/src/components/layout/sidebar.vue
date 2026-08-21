<script setup lang="ts">
const props = defineProps<{
    activeMenu?: string;
    isOpen?: boolean;
}>();

const emit = defineEmits(['selectMenu', 'closeSidebar']);

const menus = [
    { key: 'dashboard', label: 'Dashboard', icon: 'bi bi-grid-1x2-fill' },
    { key: 'rencana', label: 'Rencana', icon: 'bi bi-calendar2-check-fill' },
    { key: 'transaksi', label: 'Transaksi', icon: 'bi bi-wallet2' },
    { key: 'tamu', label: 'Tamu Undangan', icon: 'bi bi-people-fill' },
    { key: 'akun', label: 'Akun', icon: 'bi bi-person-circle' },
];

const handleSelect = (key: string) => {
    emit('selectMenu', key);
    emit('closeSidebar');
};
</script>

<template>
    <aside 
        class="sidebar-container bg-white border-end d-flex flex-column" 
        :class="{ 'sidebar-open': isOpen }"
    >
        <!-- Header / Logo Brand & Tombol Tutup Mobile -->
        <div class="p-3 border-bottom d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
                <i class="bi bi-heart-fill text-danger fs-5"></i>
                <div>
                    <h5 class="fw-bold text-primary mb-0 lh-1">Wedding Planner</h5>
                    
                </div>
            </div>
            <!-- Tombol Tutup (Hanya di layar HP / Tablet < 992px) -->
            <button 
                type="button"
                @click="emit('closeSidebar')" 
                class="btn btn-sm btn-light border d-flex d-lg-none align-items-center justify-content-center rounded-circle p-1"
                style="width: 32px; height: 32px;"
                aria-label="Tutup Menu"
                title="Tutup"
            >
                <i class="bi bi-x-lg text-dark fs-6"></i>
            </button>
        </div>

        <!-- Daftar Menu Navigasi -->
        <div class="p-3 flex-grow-1 overflow-y-auto">
            <ul class="nav flex-column gap-2">
                <li v-for="item in menus" :key="item.key" class="nav-item">
                    <button 
                        type="button"
                        @click="handleSelect(item.key)" 
                        class="btn w-100 text-start rounded-3 py-2 px-3 d-flex align-items-center gap-2 transition-all"
                        :class="activeMenu === item.key ? 'btn-primary text-white shadow-sm' : 'btn-light text-dark bg-transparent border-0 hover-nav'"
                    >
                        <i :class="item.icon" class="fs-5"></i>
                        <span class="fw-medium">{{ item.label }}</span>
                    </button>
                </li>
            </ul>
        </div>
    </aside>
</template>

<style scoped>
.sidebar-container {
    width: 250px;
    min-width: 250px;
    min-height: 100vh;
    transition: transform 0.3s ease-in-out;
}

.hover-nav:hover {
    background-color: #f8f9fa !important;
    color: #0d6efd !important;
    transform: translateX(3px);
}

.transition-all {
    transition: all 0.2s ease;
}

/* KHUSUS RESPONSIVE MOBILE (< 992px) */
@media (max-width: 991.98px) {
    .sidebar-container {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        z-index: 1050;
        box-shadow: 6px 0 25px rgba(0, 0, 0, 0.2);
        transform: translateX(-100%);
    }

    .sidebar-container.sidebar-open {
        transform: translateX(0) !important;
    }
}
</style>