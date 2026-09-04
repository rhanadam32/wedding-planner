<script setup lang="ts">
import { ref, onMounted, provide } from 'vue';
import { useRouter } from 'vue-router';
import { authService, pengantinService, Pengantin } from '../../services/api';

import Sidebar from '../../components/layout/sidebar.vue';
import Header from '../../components/layout/header.vue';
import Footer from '../../components/layout/footer.vue';

const router = useRouter();
const user = authService.getUser() || { name: 'Pengantin' };

const isSidebarOpen = ref(false); // State mobile sidebar (buka/tutup)
const weddingProfile = ref<Pengantin | null>(null);
const sisaHari = ref<number | null>(null);

const calculateSisaHari = (tglStr?: string): number | null => {
  if (!tglStr) return null;
  const target = new Date(tglStr);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = targetMidnight.getTime() - nowMidnight.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const fetchWeddingData = async () => {
  try {
    const data = await pengantinService.getPengantin();
    if (data) {
      weddingProfile.value = data;
      sisaHari.value = calculateSisaHari(data.tanggal_pernikahan);
    }
  } catch (err) {
    console.error('Gagal mengambil data profil pernikahan di layout:', err);
  }
};

provide('weddingProfile', weddingProfile);
provide('sisaHari', sisaHari);
provide('refreshWeddingData', fetchWeddingData);

onMounted(() => {
  fetchWeddingData();
});

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebar = () => {
  isSidebarOpen.value = false;
};

const handleLogout = () => {
  authService.logout();
  router.push('/');
};
</script>

<template>
  <div class="d-flex min-vh-100 bg-light position-relative">
    <!-- BACKDROP GELAP KETIKA SIDEBAR TERBUKA DI HP -->
    <transition name="backdrop-fade">
      <div 
        v-if="isSidebarOpen" 
        class="sidebar-backdrop d-lg-none"
        @click="closeSidebar"
      ></div>
    </transition>

    <!-- EMBED SIDEBAR -->
    <Sidebar 
      :is-open="isSidebarOpen"
      @close-sidebar="closeSidebar"
    />

    <!-- AREA KANAN (HEADER + CONTENT + FOOTER) -->
    <div class="d-flex flex-column flex-grow-1 main-wrapper" style="min-width: 0;">
      <!-- EMBED HEADER -->
      <Header 
        :user-name="user?.name" 
        :sisa-hari="sisaHari"
        @logout="handleLogout" 
        @toggle-sidebar="toggleSidebar"
      />

      <!-- EMBED DYNAMIC CONTENT (ROUTER VIEW) -->
      <main class="p-3 p-md-4 flex-grow-1">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <!-- EMBED FOOTER -->
      <Footer />
    </div>
  </div>
</template>

<style scoped>
.sidebar-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(2px);
  z-index: 1040;
}

.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.25s ease;
}

.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>