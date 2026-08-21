<script setup lang="ts">
import { ref } from 'vue';

const daftarTamu = ref([
  { id: 1, nama: 'Bpk. Hendra & Keluarga', kelompok: 'Keluarga', jumlah: 3, konfirmasi: 'Hadir', hp: '08123456789' },
  { id: 2, nama: 'Dimas & Istri', kelompok: 'Sahabat', jumlah: 2, konfirmasi: 'Hadir', hp: '08129876543' },
  { id: 3, nama: 'Ratna Kusuma', kelompok: 'Teman Kantor', jumlah: 1, konfirmasi: 'Hadir', hp: '08567890123' },
  { id: 4, nama: 'Bambang Sudibyo', kelompok: 'Teman Kantor', jumlah: 1, konfirmasi: 'Tidak Hadir', hp: '08771234567' },
  { id: 5, nama: 'Andi Pratama', kelompok: 'Sahabat', jumlah: 2, konfirmasi: 'Pending', hp: '08134567890' },
]);
</script>

<template>
  <div class="card border-0 rounded-4 shadow-sm p-4 bg-white">
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-4 pb-2 border-bottom">
      <div>
        <h4 class="fw-bold mb-1 text-dark">
          <i class="bi bi-people-fill text-info me-2"></i>Daftar Tamu Undangan
        </h4>
        <p class="text-muted small mb-0">Kelola daftar tamu keluarga, sahabat, dan status kehadiran</p>
      </div>
      <button class="btn btn-sm btn-primary rounded-pill px-3 fw-semibold">
        <i class="bi bi-person-plus me-1"></i> Tambah Tamu
      </button>
    </div>

    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr class="small text-muted text-uppercase">
            <th>Nama Tamu</th>
            <th>Kategori</th>
            <th>Kontak (WA)</th>
            <th>Jumlah Pax</th>
            <th>Konfirmasi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tamu in daftarTamu" :key="tamu.id">
            <td class="fw-semibold text-dark">{{ tamu.nama }}</td>
            <td><span class="badge bg-light text-dark border">{{ tamu.kelompok }}</span></td>
            <td>
              <a :href="'https://wa.me/' + tamu.hp" target="_blank" class="text-decoration-none small text-success">
                <i class="bi bi-whatsapp me-1"></i>{{ tamu.hp }}
              </a>
            </td>
            <td>{{ tamu.jumlah }} Orang</td>
            <td>
              <span 
                class="badge"
                :class="{
                  'bg-success-subtle text-success': tamu.konfirmasi === 'Hadir',
                  'bg-danger-subtle text-danger': tamu.konfirmasi === 'Tidak Hadir',
                  'bg-secondary-subtle text-secondary': tamu.konfirmasi === 'Pending'
                }"
              >
                {{ tamu.konfirmasi }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
