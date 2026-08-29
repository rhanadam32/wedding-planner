<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../../services/api';

import Sidebar from '../../components/layout/sidebar.vue';
import Header from '../../components/layout/header.vue';
import Footer from '../../components/layout/footer.vue';

const router = useRouter();
const user = authService.getUser() || { name: 'Pengantin' };

const isSidebarOpen = ref(false); // State mobile sidebar (buka/tutup)

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