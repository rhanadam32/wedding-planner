<script setup lang="ts">
import { ref } from 'vue';
import { authService } from '../../services/api';

const user = authService.getUser() || { name: 'Raihan', username: 'admin' };

const profil = ref({
  mempelaiPria: 'Raihan',
  mempelaiWanita: 'Sarah',
  tanggalAcara: '2026-10-24',
  lokasiAcara: 'Jakarta',
});
</script>

<template>
  <div class="card border-0 rounded-4 shadow-sm p-4 bg-white">
    <div class="mb-4 pb-2 border-bottom">
      <h4 class="fw-bold mb-1 text-dark">
        <i class="bi bi-person-circle text-primary me-2"></i>Akun & Data Pernikahan
      </h4>
      <p class="text-muted small mb-0">Informasi akun pengguna dan data acara pernikahan</p>
    </div>

    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label small fw-semibold">Nama Pengguna (Login)</label>
        <input type="text" class="form-control" :value="user.name || user.username" disabled />
      </div>
      <div class="col-md-6">
        <label class="form-label small fw-semibold">Tanggal Pernikahan</label>
        <input type="date" class="form-control" v-model="profil.tanggalAcara" />
      </div>
      <div class="col-md-6">
        <label class="form-label small fw-semibold">Nama Calon Pengantin Pria</label>
        <input type="text" class="form-control" v-model="profil.mempelaiPria" />
      </div>
      <div class="col-md-6">
        <label class="form-label small fw-semibold">Nama Calon Pengantin Wanita</label>
        <input type="text" class="form-control" v-model="profil.mempelaiWanita" />
      </div>
      <div class="col-12">
        <label class="form-label small fw-semibold">Lokasi / Kota Acara</label>
        <input type="text" class="form-control" v-model="profil.lokasiAcara" />
      </div>
      <div class="col-12 text-end mt-3">
        <button class="btn btn-primary rounded-pill px-4 fw-semibold">
          <i class="bi bi-save me-1"></i> Simpan Data
        </button>
      </div>
    </div>
  </div>
</template>
