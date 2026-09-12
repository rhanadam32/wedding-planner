<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { authService, rencanaService, RencanaItem, User } from '../../services/api';

const user = ref<User | null>(authService.getUser());
const checklist = ref<RencanaItem[]>([]);
const isLoading = ref(true);

// State Modal Form
const showModal = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');
const form = ref({
  TugasRencana: '',
  tgl_deadline: ''
});

const fetchRencana = async () => {
  isLoading.value = true;
  user.value = authService.getUser();
  try {
    const data = await rencanaService.getRencana(user.value?.id_user);
    checklist.value = data;
  } catch (error) {
    console.error('Gagal memuat data rencana:', error);
  } finally {
    isLoading.value = false;
  }
};

const openModal = () => {
  form.value = {
    TugasRencana: '',
    tgl_deadline: ''
  };
  errorMessage.value = '';
  showModal.value = true;
};

const closeModal = () => {
  if (isSubmitting.value) return;
  showModal.value = false;
};

const handleSubmit = async () => {
  if (!form.value.TugasRencana.trim()) {
    errorMessage.value = 'Tugas/Rencana tidak boleh kosong!';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    const currentUser = authService.getUser();
    const res = await rencanaService.addRencana({
      TugasRencana: form.value.TugasRencana.trim(),
      tgl_deadline: form.value.tgl_deadline,
      id_user: currentUser?.id_user
    });

    if (res && res.status === 'error') {
      errorMessage.value = res.message || 'Gagal menambahkan tugas rencana';
      return;
    }

    // Refresh data rencana & tutup modal
    await fetchRencana();
    closeModal();
  } catch (error: any) {
    console.error('Error saat menambah rencana:', error);
    errorMessage.value = error?.message || 'Terjadi kesalahan pada server saat menambahkan data.';
  } finally {
    isSubmitting.value = false;
  }
};

const toggle = async (item: RencanaItem) => {
  const previousStatus = item.status;
  const newStatus = item.status === 'selesai' ? 'pending' : 'selesai';
  item.status = newStatus;

  try {
    if (item.id) {
      await rencanaService.updateStatusRencana(item.id, newStatus);
    }
  } catch (error) {
    console.error('Gagal update status rencana:', error);
    item.status = previousStatus; // rollback jika gagal
  }
};

const deletingId = ref<string | number | null>(null);

const handleDelete = async (item: RencanaItem) => {
  const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus tugas "${item.TugasRencana}"?`);
  if (!confirmDelete) return;

  deletingId.value = item.id;
  try {
    const res = await rencanaService.deleteRencana(item.id);
    if (res && res.status === 'error') {
      alert(res.message || 'Gagal menghapus tugas rencana');
      return;
    }
    // Hapus dari list
    checklist.value = checklist.value.filter((c) => c.id !== item.id);
  } catch (error: any) {
    console.error('Gagal menghapus rencana:', error);
    alert('Terjadi kesalahan saat menghapus rencana.');
  } finally {
    deletingId.value = null;
  }
};

onMounted(() => {
  fetchRencana();
});
</script>

<template>
  <div class="card border-0 rounded-4 shadow-sm p-3 p-sm-4 bg-white">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-4 pb-2 border-bottom">
      <div>
        <h4 class="fw-bold mb-1 text-dark">
          <i class="bi bi-calendar2-check-fill text-primary me-2"></i>Rencana &amp; Checklist Persiapan
        </h4>
        <p class="text-muted small mb-0">
          Timeline dan daftar tugas khusus akun <strong class="text-primary text-break">{{ user?.name || user?.username || 'Pengantin' }}</strong>
          <span v-if="user?.id_user" class="badge bg-light text-muted border ms-1 d-none d-md-inline">ID: {{ user.id_user }}</span>
        </p>
      </div>
      <!-- Action buttons: full-width di HP, sejajar di desktop -->
      <div class="d-flex align-items-stretch align-items-sm-center gap-2 rencana-actions">
        <button
          class="btn btn-sm btn-outline-secondary rounded-pill px-3 shadow-sm"
          title="Muat Ulang Data"
          :disabled="isLoading"
          @click="fetchRencana"
        >
          <i class="bi bi-arrow-clockwise me-1" :class="{ 'spin-anim': isLoading }"></i> Segarkan
        </button>
        <button
          class="btn btn-sm btn-primary rounded-pill px-3 fw-semibold shadow-sm"
          @click="openModal"
        >
          <i class="bi bi-plus-lg me-1"></i> Tambah Tugas
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5 text-muted">
      <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
      <p class="small mb-0">Memuat data rencana...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="checklist.length === 0" class="text-center py-5 text-muted">
      <i class="bi bi-clipboard-x fs-1 d-block mb-2 text-secondary"></i>
      <p class="mb-3 fw-medium">Belum ada rencana yang tersimpan.</p>
      <button class="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm py-2" @click="openModal">
        <i class="bi bi-plus-lg me-1"></i> Tambah Tugas Sekarang
      </button>
    </div>

    <!-- Checklist List -->
    <div v-else>

      <!-- ── Mobile card list (hidden on md+) ── -->
      <div class="d-md-none">
        <div 
          v-for="item in checklist" 
          :key="item.id" 
          class="rounded-3 border bg-light-subtle p-3 mb-2 shadow-sm"
        >
          <!-- Checkbox + task name -->
          <div class="form-check d-flex align-items-start gap-2 mb-2">
            <input 
              type="checkbox" 
              class="form-check-input mt-1 fs-5 cursor-pointer flex-shrink-0" 
              :id="'chk-mob-' + item.id" 
              :checked="item.status === 'selesai'"
              @change="toggle(item)"
            />
            <label 
              :for="'chk-mob-' + item.id" 
              class="form-check-label cursor-pointer mb-0 fw-medium text-break"
              :class="{ 'text-decoration-line-through text-muted': item.status === 'selesai', 'text-dark': item.status !== 'selesai' }"
            >
              {{ item.TugasRencana || '(Tugas Tanpa Judul)' }}
            </label>
          </div>

          <!-- Deadline -->
          <div class="small text-muted mb-2 ps-1">
            <i class="bi bi-calendar-event me-1"></i>Target: {{ item.tgl_deadline || '-' }}
          </div>

          <!-- Bottom row: status badge + delete button -->
          <div class="d-flex align-items-center justify-content-between pt-2 border-top gap-2">
            <span 
              class="badge rounded-pill text-capitalize"
              :class="item.status === 'selesai' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'"
            >
              {{ item.status }}
            </span>
            <button 
              type="button" 
              class="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1 py-2 px-3" 
              title="Hapus Tugas"
              :disabled="deletingId === item.id"
              @click="handleDelete(item)"
            >
              <span v-if="deletingId === item.id" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <i v-else class="bi bi-trash3"></i>
              <span>Hapus</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ── Desktop list-group (hidden below md) ── -->
      <div class="list-group list-group-flush d-none d-md-block">
        <div 
          v-for="item in checklist" 
          :key="item.id" 
          class="list-group-item d-flex justify-content-between align-items-center py-3 px-0 gap-3"
        >
          <div class="form-check d-flex align-items-center gap-2 flex-grow-1">
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
                {{ item.TugasRencana || '(Tugas Tanpa Judul)' }}
              </label>
              <div class="d-flex align-items-center gap-2 mt-1">
                <small class="text-muted" style="font-size: 0.75rem;">
                  <i class="bi bi-calendar-event me-1"></i>Target: {{ item.tgl_deadline || '-' }}
                </small>
                <span v-if="item.id_user" class="badge bg-light text-secondary border" style="font-size: 0.65rem;">
                  ID: {{ item.id_user }}
                </span>
              </div>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2 flex-shrink-0">
            <span 
              class="badge rounded-pill text-capitalize"
              :class="item.status === 'selesai' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'"
            >
              {{ item.status }}
            </span>
            <button 
              type="button" 
              class="btn btn-outline-danger btn-sm rounded-circle d-inline-flex align-items-center justify-content-center p-0" 
              style="width: 32px; height: 32px;"
              title="Hapus Tugas"
              :disabled="deletingId === item.id"
              @click="handleDelete(item)"
            >
              <span v-if="deletingId === item.id" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <i v-else class="bi bi-trash3"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Form Tambah Tugas -->
    <div v-if="showModal" class="modal-backdrop-custom d-flex align-items-center justify-content-center">
      <div class="modal-dialog-custom bg-white rounded-4 shadow-lg p-3 p-sm-4 w-100 mx-2" style="max-width: 500px;">
        <!-- Modal Header -->
        <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <div class="d-flex align-items-center gap-2">
            <div class="bg-primary-subtle text-primary p-2 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 38px; height: 38px;">
              <i class="bi bi-card-checklist fs-5"></i>
            </div>
            <div>
              <h5 class="fw-bold mb-0 text-dark">Tambah Tugas Baru</h5>
              <small class="text-muted">Buat checklist rencana pernikahan Anda</small>
            </div>
          </div>
          <button 
            type="button" 
            class="btn-close" 
            aria-label="Close" 
            :disabled="isSubmitting"
            @click="closeModal"
          ></button>
        </div>

        <!-- Alert Error -->
        <div v-if="errorMessage" class="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-3">
          <i class="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Modal Body / Form -->
        <form @submit.prevent="handleSubmit">
          <div class="mb-3">
            <label class="form-label fw-semibold small text-dark mb-1">
              Tugas / Rencana <span class="text-danger">*</span>
            </label>
            <input 
              v-model="form.TugasRencana" 
              type="text" 
              class="form-control rounded-3 w-100" 
              placeholder="Contoh: Booking Gedung & Catering"
              required
              autofocus
            />
          </div>

          <div class="mb-4">
            <label class="form-label fw-semibold small text-dark mb-1">
              Tanggal Deadline
            </label>
            <input 
              v-model="form.tgl_deadline" 
              type="date" 
              class="form-control rounded-3 w-100" 
            />
          </div>

          <!-- Modal Footer – stacked on mobile, side-by-side on sm+ -->
          <div class="d-flex flex-column-reverse flex-sm-row justify-content-end gap-2 pt-2 border-top">
            <button 
              type="button" 
              class="btn btn-light rounded-pill px-4 fw-semibold text-muted w-100 w-sm-auto py-2" 
              :disabled="isSubmitting"
              @click="closeModal"
            >
              Batal
            </button>
            <button 
              type="submit" 
              class="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm w-100 w-sm-auto py-2"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              <span v-else><i class="bi bi-save me-1"></i> Simpan Tugas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  z-index: 1050;
  animation: fadeIn 0.2s ease-in-out;
  padding: 1rem;
  overflow-y: auto;
}

.modal-dialog-custom {
  animation: slideDown 0.25s ease-out;
  max-height: calc(100vh - 2rem);
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.form-control {
  min-height: 48px;
  font-size: 16px;
}

/* Target sentuh yang nyaman di HP */
.list-group-item .btn,
.d-md-none .btn {
  min-height: 44px;
}

.d-md-none .form-check-input {
  width: 24px;
  height: 24px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.spin-anim {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* HP: tombol aksi full-width + modal jadi bottom-sheet */
@media (max-width: 575.98px) {
  .rencana-actions {
    width: 100%;
  }

  .rencana-actions .btn {
    flex: 1;
    min-height: 44px;
    font-size: 0.85rem;
  }

  .modal-backdrop-custom {
    padding: 0;
    align-items: flex-end !important;
  }

  .modal-dialog-custom {
    margin: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
    border-bottom-left-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
    border-top-left-radius: 1.25rem !important;
    border-top-right-radius: 1.25rem !important;
    max-height: calc(100vh - 3rem);
    max-height: calc(100dvh - 3rem);
  }
}
</style>

