<script setup lang='ts'>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../../services/api';

const router = useRouter();
const username = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
    if (!username.value || !password.value){
        errorMessage.value = 'Username dan Password Wajib diisi!!!';
        return
    }

    loading.value = true;
    errorMessage.value = '';

    try {
        const result = await authService.login({
            username: username.value,
            password: password.value,
        });

        if (result.status === 'success'){
            router.push('/dashboard');
        } else {
            errorMessage.value = result.message || 'Login gagal';
        }
    } catch(error){
        errorMessage.value = 'terjadi kesalahan pada server/koneksi';
        console.error(error);
    } finally {
        loading.value = false;
    }
};
</script>

<template>
  <div class="min-vh-100 w-100 d-flex align-items-center justify-content-center p-3 p-sm-4 login-wrapper">
    <div class="card border-0 rounded-4 shadow-sm login-card" style="width: 100%; max-width: 420px; overflow: hidden;">
      <div class="card-header bg-white border-bottom py-3 px-4">
        <h5 class="fw-bold text-primary mb-0 d-flex align-items-center gap-2">
          <i class="bi bi-heart-fill text-danger fs-6"></i>
          <span>Wedding Planner</span>
        </h5>
      </div>
      <div class="card-body p-3 p-sm-4">
        <h4 class="card-title fw-bold mb-3 text-dark">Login</h4>
        <div v-if="errorMessage" class="alert alert-danger py-2 small" role="alert">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="handleLogin">
          <div class="form-floating mb-3">
            <input 
              type="text" 
              v-model="username" 
              class="form-control" 
              id="floatingInput" 
              placeholder="username" 
              autocomplete="username"
              required
            >
            <label for="floatingInput">Username</label>
          </div>
          <div class="form-floating mb-3">
            <input 
              type="password" 
              v-model="password" 
              class="form-control" 
              id="floatingPassword" 
              placeholder="password" 
              autocomplete="current-password"
              required
            >
            <label for="floatingPassword">Password</label>
          </div>
          <button type="submit" class="btn btn-primary rounded-4 w-100 py-2 fw-semibold" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? 'Memproses...' : 'Login' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>