<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { rencanaService, RencanaItem } from '../../services/api';

const checklist = ref<RencanaItem[]>([]);
const isLoading = ref(true);

const fetchRencana = async () => {
  isLoading.value = true;
  try {
    const data = await rencanaService.getRencana();
    checklist.value = data;
  } catch (error) {
    console.error('Gagal memuat data rencana:', error);
  } finally {
    isLoading.value = false;
  }
};

const toggle = (item: RencanaItem) => {
  item.status = item.status === 'selesai' ? 'pending' : 'selesai';
};

onMounted(() => {
  fetchRencana();
});
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

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5 text-muted">
      <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
      <p class="small mb-0">Memuat data rencana...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="checklist.length === 0" class="text-center py-5 text-muted">
      <i class="bi bi-clipboard-x fs-1 d-block mb-2 text-secondary"></i>
      <p class="mb-0 fw-medium">Belum ada rencana yang tersimpan.</p>
    </div>

    <!-- Checklist List -->
    <div v-else class="list-group list-group-flush">
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
            :checked="item.status === 'selesai'"
            @change="toggle(item)"
          />
          <div>
            <label 
              :for="'chk-' + item.id" 
              class="form-check-label cursor-pointer mb-0"
              :class="{ 'text-decoration-line-through text-muted': item.status === 'selesai', 'fw-medium text-dark': item.status !== 'selesai' }"
            >
              {{ item.TugasRencana }}
            </label>
            <small class="d-block text-muted" style="font-size: 0.75rem;">
              Target: {{ item.tgl_deadline || '-' }}
            </small>
          </div>
        </div>
        <span 
          class="badge rounded-pill text-capitalize"
          :class="item.status === 'selesai' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'"
        >
          {{ item.status }}
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
