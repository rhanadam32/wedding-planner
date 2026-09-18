<script setup lang="ts">
import { ref, onMounted, provide } from 'vue';
import { useRouter } from 'vue-router';
import { authService, pengantinService, Pengantin, User } from '../../services/api';

import Sidebar from '../../components/layout/sidebar.vue';
import Header from '../../components/layout/header.vue';
import Footer from '../../components/layout/footer.vue';

const router = useRouter();
const user: User = authService.getUser() || { name: 'Pengantin', username: 'user', id_user: '' };

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
    const data = await pengantinService.getPengantin(user?.id_user);
    if (data) {
      weddingProfile.value = data;
      sisaHari.value = calculateSisaHari(data.tanggal_pernikahan);
    } else {
      weddingProfile.value = null;
      sisaHari.value = null;
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
      <main class="p-2 p-sm-3 p-md-4 flex-grow-1 main-content d-flex flex-column">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" class="flex-grow-1 d-flex flex-column" />
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

.main-content {
  min-width: 0;
  overflow-x: hidden;
}

/* HP: penuhkan area antara header & footer tanpa celah/jarak berlebih */
@media (max-width: 575.98px) {
  .main-content {
    padding: 0 !important;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .main-content > * {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  /* Kartu utama halaman (rencana, transaksi, tamu, akun) memenuhi layar dari header hingga footer */
  .main-content :deep(.card) {
    border-radius: 0 !important;
    border: none !important;
    box-shadow: none !important;
  }

  .main-content :deep(.card:only-child),
  .main-content :deep(.account-card) {
    min-height: 100%;
    flex-grow: 1;
  }

  /* Padding dalam kartu di HP agar tetap rapi dan tidak mepet teks */
  .main-content :deep(.card) {
    padding: 1rem 0.85rem !important;
  }

  /* Khusus dashboard beranda (dash-content) dengan multi-card */
  .main-content :deep(.dash-content) {
    padding: 0.65rem 0.5rem 1rem 0.5rem !important;
    flex-grow: 1;
  }

  .main-content :deep(.dash-content .card) {
    border-radius: 1rem !important;
    border: 1px solid #edf2f7 !important;
    padding: 1rem !important;
  }

  .main-content :deep(.dash-content .stat-card) {
    padding: 0.75rem !important;
  }

  .main-content h4 {
    font-size: 1.1rem;
  }
}
</style>