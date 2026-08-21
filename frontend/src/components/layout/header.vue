<script setup lang="ts">
import { computed } from 'vue';
import { authService } from '../../services/api';

const props = defineProps<{
  userName?: string;
}>();

const emit = defineEmits(['logout', 'toggleSidebar']);

const user = computed(() => {
  if (props.userName) return { name: props.userName };
  return authService.getUser() || { name: 'Pengantin' };
});
</script>

<template>
  <header class="bg-white border-bottom p-2 p-md-3 px-3 px-md-4 d-flex justify-content-between align-items-center sticky-top shadow-sm" style="z-index: 1020;">
    <!-- SISI KIRI: Tombol Hamburger & Judul Dashboard -->
    <div class="d-flex align-items-center gap-2 gap-md-3">
      <!-- Tombol Hamburger (Khusus Layar HP / Tablet < 992px) -->
      <button 
        type="button"
        @click="emit('toggleSidebar')" 
        class="btn btn-light border rounded-3 p-2 d-flex d-lg-none align-items-center justify-content-center hamburger-btn"
        aria-label="Buka Menu Sidebar"
        title="Menu Navigasi"
      >
        <i class="bi bi-list fs-4 text-dark"></i>
      </button>

      <div>
        <h5 class="mb-0 fw-bold text-dark fs-6 fs-md-5 lh-1">Dashboard Pernikahan</h5>
        <small class="text-muted d-none d-sm-block" style="font-size: 0.8rem;">
          Selamat datang, <strong class="text-primary">{{ user.name }}</strong>
        </small>
      </div>
    </div>

    <!-- SISI KANAN: Countdown & Logout -->
    <div class="d-flex align-items-center gap-2 gap-md-3">
      <!-- Badge Countdown H-Minus -->
      <div class="badge bg-danger-subtle text-danger py-2 px-2 px-md-3 rounded-pill d-flex align-items-center gap-1 fw-semibold">
        <i class="bi bi-hourglass-split"></i>
        <span class="d-none d-sm-inline">H-65 Menuju Hari H</span>
        <span class="d-inline d-sm-none">H-65</span>
      </div>

      <!-- Tombol Logout -->
      <button 
        type="button"
        @click="emit('logout')" 
        class="btn btn-sm btn-outline-danger rounded-pill px-2 px-md-3 d-flex align-items-center gap-1 fw-medium" 
        title="Keluar"
      >
        <i class="bi bi-box-arrow-right"></i>
        <span class="d-none d-sm-inline">Logout</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.hamburger-btn {
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.hamburger-btn:hover, .hamburger-btn:active {
  background-color: #e9ecef;
  transform: scale(1.05);
}
</style>