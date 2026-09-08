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
    <div class="row justify-content-center mt-5">
   
        <div class="card border-0 rounded-4 shadow-sm " style="margin: 6em; padding:0;">
            <div class="card-header">
                Wedding Planner
            </div>
            <div class="card-body">
                <h4 class="card-title">Login</h4>
                 <div v-if="errorMessage" class="alert alert-danger py-2" role="alert">
          {{ errorMessage }}
        </div>

                <form @submit.prevent="handleLogin">
                <div class="form-floating mb-3">
                    <input type="text" v-model="username" class="form-control" id="floatingInput" placeholder="username" required>
                    <label for="">Username</label>
                </div>
                 <div class="form-floating mb-3">
                    <input type="password" v-model="password" class="form-control" id="floatingPassword" placeholder="password" required>
                    <label for="">Password</label>
                </div>
                <button type="submit" class="btn btn-primary rounded-4 w-100" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? 'Memproses...' : 'Login' }}</button>
            </form>
            </div>
        </div>
       
        
    </div>
</template>