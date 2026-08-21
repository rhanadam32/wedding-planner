<script setup lang="ts">
import { ref } from 'vue';
import { authService } from '../../services/api';

const user = authService.getUser() || { name: 'Pengantin', role: 'Calon Pengantin' };

const weddingInfo = ref({
  pasangan: 'Raihan & Pasangan',
  tanggal: '24 Oktober 2026',
  lokasi: 'Jakarta',
  sisaHari: 65,
});

const ringkasan = ref([
  { label: 'Sisa Waktu', nilai: '65 Hari', subtext: 'Menuju hari pernikahan', icon: 'bi bi-calendar2-heart-fill', bg: 'bg-primary-subtle text-primary' },
  { label: 'Progres Persiapan', nilai: '72%', subtext: '8 dari 12 tugas selesai', icon: 'bi bi-check2-circle', bg: 'bg-success-subtle text-success' },
  { label: 'Total Pengeluaran', nilai: 'Rp 45.000.000', subtext: 'Dari target Rp 80.000.000', icon: 'bi bi-wallet2', bg: 'bg-warning-subtle text-warning' },
  { label: 'Tamu Undangan', nilai: '150 Orang', subtext: '110 Sudah konfirmasi', icon: 'bi bi-people-fill', bg: 'bg-info-subtle text-info' },
]);

const checklist = ref([
  { id: 1, text: 'Menentukan tanggal & tempat akad/resepsi', done: true },
  { id: 2, text: 'Menyiapkan berkas KUA / Catatan Sipil', done: true },
  { id: 3, text: 'Memilih busana akad & rias pengantin', done: true },
  { id: 4, text: 'Pesan konsumsi / katering keluarga', done: false },
  { id: 5, text: 'Finalisasi daftar undangan keluarga & sahabat', done: false },
]);

const toggleCheck = (item: any) => {
  item.done = !item.done;
};

const transaksiTerakhir = ref([
  { item: 'DP Lokasi / Gedung', biaya: 'Rp 15.000.000', status: 'Lunas' },
  { item: 'DP Katering Makanan', biaya: 'Rp 12.000.000', status: 'DP' },
  { item: 'Sewa Busana & MUA', biaya: 'Rp 6.000.000', status: 'Lunas' },
  { item: 'Foto & Video Cinematic', biaya: 'Rp 4.500.000', status: 'DP' },
]);
</script>

<template>
  <div class="dash-content d-flex flex-column gap-4">
    <!-- BANNER ATAS: INFO PERNIKAHAN MANDIRI -->
    <div class="card border-0 rounded-4 shadow-sm p-4 bg-white">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <span class="badge bg-danger-subtle text-danger px-3 py-1 rounded-pill mb-2 fw-semibold">
            <i class="bi bi-heart-fill me-1"></i> Rencana Pernikahan Mandiri
          </span>
          <h3 class="fw-bold text-dark mb-1">{{ weddingInfo.pasangan }}</h3>
          <p class="text-muted mb-0 d-flex flex-wrap gap-3 small">
            <span><i class="bi bi-calendar-event me-1 text-primary"></i> {{ weddingInfo.tanggal }}</span>
            <span><i class="bi bi-geo-alt me-1 text-danger"></i> {{ weddingInfo.lokasi }}</span>
            <span><i class="bi bi-person me-1 text-success"></i> Akun: {{ user.name }}</span>
          </p>
        </div>
        <div class="text-md-end bg-light p-3 rounded-4 border">
          <span class="display-6 fw-bold text-danger lh-1">{{ weddingInfo.sisaHari }}</span>
          <span class="d-block text-muted small fw-semibold">Hari Menuju Hari-H</span>
        </div>
      </div>
    </div>

    <!-- 4 KARTU STATISTIK RINGKASAN -->
    <div class="row g-3">
      <div v-for="(item, idx) in ringkasan" :key="idx" class="col-sm-6 col-xl-3">
        <div class="card border-0 rounded-4 shadow-sm p-3 bg-white h-100">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <div>
              <small class="text-muted d-block fw-semibold">{{ item.label }}</small>
              <h5 class="fw-bold mb-0 mt-1 text-dark">{{ item.nilai }}</h5>
            </div>
            <div :class="item.bg" class="rounded-3 p-3 d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
              <i :class="item.icon" class="fs-4"></i>
            </div>
          </div>
          <small class="text-muted" style="font-size: 0.75rem;">{{ item.subtext }}</small>
        </div>
      </div>
    </div>

    <!-- MAIN TWO-COLUMN SECTION -->
    <div class="row g-4">
      <!-- KOLOM KIRI: CHECKLIST RINGKAS -->
      <div class="col-lg-7">
        <div class="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
          <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
            <div>
              <h5 class="fw-bold mb-0 text-dark">
                <i class="bi bi-check2-square text-success me-2"></i>Checklist Persiapan Penting
              </h5>
              <small class="text-muted">Centang tugas yang telah diselesaikan</small>
            </div>
          </div>

          <div class="list-group list-group-flush">
            <div 
              v-for="item in checklist" 
              :key="item.id" 
              class="list-group-item d-flex justify-content-between align-items-center px-0 py-3"
            >
              <div class="form-check d-flex align-items-center gap-2">
                <input 
                  type="checkbox" 
                  class="form-check-input mt-0 fs-5 cursor-pointer" 
                  :id="'chk-' + item.id" 
                  :checked="item.done"
                  @change="toggleCheck(item)"
                />
                <label 
                  :for="'chk-' + item.id" 
                  class="form-check-label cursor-pointer mb-0"
                  :class="{ 'text-decoration-line-through text-muted': item.done, 'fw-medium text-dark': !item.done }"
                >
                  {{ item.text }}
                </label>
              </div>
              <span 
                class="badge rounded-pill"
                :class="item.done ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'"
              >
                {{ item.done ? 'Selesai' : 'Pending' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- KOLOM KANAN: PENGELUARAN TERAKHIR -->
      <div class="col-lg-5">
        <div class="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
          <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
            <div>
              <h5 class="fw-bold mb-0 text-dark">
                <i class="bi bi-receipt text-warning me-2"></i>Pengeluaran Terakhir
              </h5>
              <small class="text-muted">Catatan pembayaran biaya</small>
            </div>
          </div>

          <div class="d-flex flex-column gap-2">
            <div 
              v-for="(trx, idx) in transaksiTerakhir" 
              :key="idx" 
              class="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between"
            >
              <div>
                <strong class="d-block text-dark small">{{ trx.item }}</strong>
                <span 
                  class="badge"
                  :class="trx.status === 'Lunas' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'"
                  style="font-size: 0.7rem;"
                >
                  {{ trx.status }}
                </span>
              </div>
              <div class="text-end">
                <span class="fw-bold text-dark small">{{ trx.biaya }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>