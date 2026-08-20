<script setup lang="ts">
import { useRouter} from 'vue-router';
import { authService } from '../../services/api';

const router = useRouter();
const user = authService.getUser();

const handleLogout = () => {
    authService.logout();
    router.push('/');
};

</script>

<template>
  <div class="container py-4">
    <div class="card border-0 rounded-4 shadow-sm p-3" >
      <div>
        <h1>DASHBOARD</h1>
        <p v-if="user" class="text-muted">Selamat datang, {{ user.name }} ({{ user.role }})</p>
      </div>
      <button @click="handleLogout" class="btn btn-outline-danger">Logout</button>
    </div>
  </div>
</template>