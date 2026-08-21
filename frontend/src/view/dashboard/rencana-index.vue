<script setup lang="ts">
import { ref } from 'vue';

const checklist = ref([
  { id: 1, tugas: 'Menentukan tanggal & konsep pernikahan', selesai: true, batas: 'H-6 Bulan' },
  { id: 2, tugas: 'Survey & booking tempat akad / resepsi', selesai: true, batas: 'H-5 Bulan' },
  { id: 3, tugas: 'Menyiapkan berkas KUA / Catatan Sipil', selesai: true, batas: 'H-3 Bulan' },
  { id: 4, tugas: 'Memilih & sewa baju pengantin serta MUA', selesai: true, batas: 'H-2 Bulan' },
  { id: 5, tugas: 'Pesan katering / konsumsi keluarga', selesai: false, batas: 'H-1 Bulan' },
  { id: 6, tugas: 'Membuat draft daftar tamu undangan', selesai: false, batas: 'H-3 Minggu' },
  { id: 7, tugas: 'Beli cincin pernikahan & mahar/seserahan', selesai: false, batas: 'H-2 Minggu' },
  { id: 8, tugas: 'Gladi resik susunan acara bersama keluarga', selesai: false, batas: 'H-3 Hari' },
]);

const toggle = (item: any) => {
  item.selesai = !item.selesai;
};
</script>

<template>
  <div class="card border-0 rounded-4 shadow-sm p-4 bg-white">
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-4 pb-2 border-bottom">
      <div>
        <h4 class="fw-bold mb-1 text-dark">
          <i class="bi bi-calendar2-check-fill text-primary me-2"></i>Rencana & Checklist Persiapan
        </h4>
        <p class="text-muted small mb-0">Timeline dan daftar tugas persiapan pernikahan mandiri</p>
      </div>
      <button class="btn btn-sm btn-primary rounded-pill px-3 fw-semibold">
        <i class="bi bi-plus-lg me-1"></i> Tambah Tugas
      </button>
    </div>

    <div class="list-group list-group-flush">
      <div 
        v-for="item in checklist" 
        :key="item.id" 
        class="list-group-item d-flex justify-content-between align-items-center py-3 px-0"
      >
        <div class="form-check d-flex align-items-center gap-2">
          <input 
            type="checkbox" 
            class="form-check-input mt-0 fs-5 cursor-pointer" 
            :id="'chk-' + item.id" 
            :checked="item.selesai"
            @change="toggle(item)"
          />
          <div>
            <label 
              :for="'chk-' + item.id" 
              class="form-check-label cursor-pointer mb-0"
              :class="{ 'text-decoration-line-through text-muted': item.selesai, 'fw-medium text-dark': !item.selesai }"
            >
              {{ item.tugas }}
            </label>
            <small class="d-block text-muted" style="font-size: 0.75rem;">Target: {{ item.batas }}</small>
          </div>
        </div>
        <span 
          class="badge rounded-pill"
          :class="item.selesai ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'"
        >
          {{ item.selesai ? 'Selesai' : 'Pending' }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
