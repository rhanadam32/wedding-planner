<script setup lang="ts">
import { ref, onMounted, inject } from 'vue';
import { authService, pengantinService, Pengantin, User } from '../../services/api';

const refreshWeddingData = inject<() => Promise<void>>('refreshWeddingData', () => Promise.resolve());
const user: User = authService.getUser() || { name: 'Pengantin', username: 'admin', id_user: '' };

const isLoading = ref(true);
const isSubmitting = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const profil = ref<Pengantin>({
  id: '',
  id_user: user?.id_user ? String(user.id_user) : '',
  calon_pengantin_pria: '',
  calon_pengantin_wanita: '',
  tanggal_pernikahan: '',
  Lokasi: ''
});

const loadProfil = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const currentIdUser = user?.id_user;
    const data = await pengantinService.getPengantin(currentIdUser);
    if (data) {
      profil.value = {
        id: data.id ? String(data.id) : '',
        id_user: data.id_user ? String(data.id_user) : (currentIdUser ? String(currentIdUser) : ''),
        calon_pengantin_pria: data.calon_pengantin_pria || '',
        calon_pengantin_wanita: data.calon_pengantin_wanita || '',
        tanggal_pernikahan: data.tanggal_pernikahan || '',
        Lokasi: data.Lokasi || (data as any).lokasi || ''
      };
    } else {
      // Belum ada data untuk id_user ini
      profil.value = {
        id: '',
        id_user: currentIdUser ? String(currentIdUser) : '',
        calon_pengantin_pria: '',
        calon_pengantin_wanita: '',
        tanggal_pernikahan: '',
        Lokasi: ''
      };
    }
  } catch (err: any) {
    console.error('Gagal mengambil data pernikahan:', err);
    errorMessage.value = 'Gagal memuat data dari server. Silakan coba lagi.';
  } finally {
    isLoading.value = false;
  }
};

const handleSimpan = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!profil.value.calon_pengantin_pria && !profil.value.calon_pengantin_wanita) {
    errorMessage.value = 'Mohon isi setidaknya salah satu nama calon pengantin!';
    return;
  }

  isSubmitting.value = true;
  try {
    if (user?.id_user) {
      profil.value.id_user = String(user.id_user);
    }
    const res = await pengantinService.savePengantin(profil.value);
    if (res && res.status === 'success') {
      successMessage.value = res.message || 'Data pernikahan berhasil disimpan!';
      if (res.data?.id) {
        profil.value.id = String(res.data.id);
      }
      await refreshWeddingData();
      setTimeout(() => {
        successMessage.value = '';
      }, 4000);
    } else {
      errorMessage.value = res?.message || 'Gagal menyimpan data pernikahan.';
    }
  } catch (err: any) {
    console.error('Error saat menyimpan data:', err);
    errorMessage.value = err?.message || 'Terjadi kesalahan saat menyimpan data.';
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  loadProfil();
});
</script>

<template>
  <div class="card border-0 rounded-4 shadow-sm p-4 bg-white">
    <div class="mb-4 pb-2 border-bottom">
      <h4 class="fw-bold mb-1 text-dark">
        <i class="bi bi-person-circle text-primary me-2"></i>Akun & Data Pernikahan
      </h4>
      <p class="text-muted small mb-0">Informasi akun pengguna dan data acara pernikahan yang terpisah per akun (ID User: {{ user?.id_user || '-' }})</p>
    </div>

    <!-- Alert Notifikasi -->
    <div v-if="successMessage" class="alert alert-success alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
      <i class="bi bi-check-circle-fill me-2 fs-5"></i>
      <div>{{ successMessage }}</div>
      <button type="button" class="btn-close" @click="successMessage = ''" aria-label="Close"></button>
    </div>

    <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
      <div>{{ errorMessage }}</div>
      <button type="button" class="btn-close" @click="errorMessage = ''" aria-label="Close"></button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Memuat data...</span>
      </div>
      <p class="text-muted small mt-2 mb-0">Memuat data pernikahan...</p>
    </div>

    <!-- Form Konten -->
    <form v-else @submit.prevent="handleSimpan" class="row g-3">
      <div class="col-md-6">
        <label class="form-label small fw-semibold">Nama Pengguna (Login)</label>
        <input type="text" class="form-control bg-light" :value="user.name || user.username" disabled />
      </div>
      <div class="col-md-6">
        <label class="form-label small fw-semibold">ID User Akun</label>
        <div class="input-group">
          <span class="input-group-text bg-light text-muted"><i class="bi bi-shield-lock"></i></span>
          <input type="text" class="form-control bg-light text-primary fw-semibold" :value="user.id_user || '-'" disabled />
        </div>
      </div>
      <div class="col-md-6">
        <label class="form-label small fw-semibold">Nama Calon Pengantin Pria</label>
        <input
          type="text"
          class="form-control"
          placeholder="Contoh: Raihan"
          v-model="profil.calon_pengantin_pria"
        />
      </div>
      <div class="col-md-6">
        <label class="form-label small fw-semibold">Nama Calon Pengantin Wanita</label>
        <input
          type="text"
          class="form-control"
          placeholder="Contoh: Sarah"
          v-model="profil.calon_pengantin_wanita"
        />
      </div>
      <div class="col-md-6">
        <label class="form-label small fw-semibold">Tanggal Pernikahan</label>
        <input type="date" class="form-control" v-model="profil.tanggal_pernikahan" />
      </div>
      <div class="col-md-6">
        <label class="form-label small fw-semibold">Lokasi / Kota Acara</label>
        <input
          type="text"
          class="form-control"
          placeholder="Contoh: Jakarta"
          v-model="profil.Lokasi"
        />
      </div>
      <div class="col-12 text-end mt-4">
        <button
          type="submit"
          class="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
          <i v-else class="bi bi-save me-1"></i>
          {{ isSubmitting ? 'Menyimpan...' : 'Simpan Data' }}
        </button>
      </div>
    </form>
  </div>
</template>
