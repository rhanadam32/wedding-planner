<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { transaksiService, Transaksi } from '../../services/api';

const list = ref<Transaksi[]>([]);
const isLoading = ref(true);
const showModal = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');
const deletingId = ref<string | null>(null);
const editingId = ref<string | null>(null);

const emptyForm = () => ({
  tanggal: '',
  Keterangan: '',
  Kategori: '',
  Kredit_Debit: '' as number | string
});

const form = ref(emptyForm());

const formatRupiah = (value: number | string) => {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value || '-');
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(n);
};

const fetchTransaksi = async () => {
  isLoading.value = true;
  try {
    list.value = await transaksiService.getTransaksi();
  } catch (error) {
    console.error('Gagal memuat data transaksi:', error);
  } finally {
    isLoading.value = false;
  }
};

const openCreateModal = () => {
  editingId.value = null;
  form.value = emptyForm();
  errorMessage.value = '';
  showModal.value = true;
};

const openEditModal = (item: Transaksi) => {
  if (!item.id_transaksi) return;
  editingId.value = String(item.id_transaksi);
  form.value = {
    tanggal: item.tanggal || '',
    Keterangan: item.Keterangan || '',
    Kategori: item.Kategori || '',
    Kredit_Debit: item.Kredit_Debit ?? ''
  };
  errorMessage.value = '';
  showModal.value = true;
};

const closeModal = () => {
  if (isSubmitting.value) return;
  showModal.value = false;
};

const handleSubmit = async () => {
  if (!form.value.Keterangan.trim()) {
    errorMessage.value = 'Keterangan tidak boleh kosong!';
    return;
  }
  if (form.value.Kredit_Debit === '' || form.value.Kredit_Debit === null) {
    errorMessage.value = 'Nominal Kredit/Debit tidak boleh kosong!';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';

  const payload = {
    tanggal: form.value.tanggal,
    Keterangan: form.value.Keterangan.trim(),
    Kategori: form.value.Kategori.trim(),
    Kredit_Debit: form.value.Kredit_Debit
  };

  try {
    const res = editingId.value
      ? await transaksiService.updateTransaksi({
          id_transaksi: editingId.value,
          ...payload
        })
      : await transaksiService.addTransaksi(payload);

    if (res && res.status === 'error') {
      errorMessage.value = res.message || 'Gagal menyimpan transaksi';
      return;
    }

    await fetchTransaksi();
    closeModal();
  } catch (error: any) {
    console.error('Error saat menyimpan transaksi:', error);
    errorMessage.value = error?.message || 'Terjadi kesalahan pada server saat menyimpan data.';
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async (item: Transaksi) => {
  if (!item.id_transaksi) return;
  const confirmDelete = window.confirm(`Hapus transaksi "${item.Keterangan}"?`);
  if (!confirmDelete) return;

  deletingId.value = String(item.id_transaksi);
  try {
    const res = await transaksiService.deleteTransaksi(String(item.id_transaksi));
    if (res && res.status === 'error') {
      alert(res.message || 'Gagal menghapus transaksi');
      return;
    }
    list.value = list.value.filter((row) => row.id_transaksi !== item.id_transaksi);
  } catch (error) {
    console.error('Gagal menghapus transaksi:', error);
    alert('Terjadi kesalahan saat menghapus transaksi.');
  } finally {
    deletingId.value = null;
  }
};

onMounted(() => {
  fetchTransaksi();
});
</script>

<template>
  <div class="card border-0 rounded-4 shadow-sm p-4 bg-white">
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-4 pb-2 border-bottom">
      <div>
        <h4 class="fw-bold mb-1 text-dark">
          <i class="bi bi-wallet2 text-warning me-2"></i>Transaksi & Pengeluaran
        </h4>
        <p class="text-muted small mb-0">Catatan pembayaran biaya dari Google Sheet</p>
      </div>
      <button
        class="btn btn-sm btn-primary rounded-pill px-3 fw-semibold"
        @click="openCreateModal"
      >
        <i class="bi bi-plus-lg me-1"></i> Catat Pengeluaran
      </button>
    </div>

    <div v-if="isLoading" class="text-center py-5 text-muted">
      <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
      <p class="small mb-0">Memuat data transaksi...</p>
    </div>

    <div v-else-if="list.length === 0" class="text-center py-5 text-muted">
      <i class="bi bi-receipt fs-1 d-block mb-2 text-secondary"></i>
      <p class="mb-0 fw-medium">Belum ada transaksi yang tersimpan.</p>
    </div>

    <div v-else class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr class="small text-muted text-uppercase">
            <th>Tanggal</th>
            <th>Keterangan</th>
            <th>Kategori</th>
            <th>Kredit / Debit</th>
            <th class="text-end">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id_transaksi">
            <td class="text-muted small">{{ item.tanggal || '-' }}</td>
            <td class="fw-semibold text-dark">{{ item.Keterangan }}</td>
            <td><span class="badge bg-light text-dark border">{{ item.Kategori || '-' }}</span></td>
            <td class="fw-bold text-dark">{{ formatRupiah(item.Kredit_Debit) }}</td>
            <td class="text-end">
              <div class="d-inline-flex gap-1">
                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center p-0"
                  style="width: 32px; height: 32px;"
                  title="Ubah"
                  @click="openEditModal(item)"
                >
                  <i class="bi bi-pencil"></i>
                </button>
                <button
                  type="button"
                  class="btn btn-outline-danger btn-sm rounded-circle d-inline-flex align-items-center justify-content-center p-0"
                  style="width: 32px; height: 32px;"
                  title="Hapus"
                  :disabled="deletingId === String(item.id_transaksi)"
                  @click="handleDelete(item)"
                >
                  <span v-if="deletingId === String(item.id_transaksi)" class="spinner-border spinner-border-sm" role="status"></span>
                  <i v-else class="bi bi-trash3"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-backdrop-custom d-flex align-items-center justify-content-center">
      <div class="modal-dialog-custom bg-white rounded-4 shadow-lg p-4 w-100 mx-3" style="max-width: 500px;">
        <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <div class="d-flex align-items-center gap-2">
            <div class="bg-warning-subtle text-warning p-2 rounded-circle d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
              <i class="bi bi-wallet2 fs-5"></i>
            </div>
            <div>
              <h5 class="fw-bold mb-0 text-dark">{{ editingId ? 'Ubah Transaksi' : 'Catat Pengeluaran' }}</h5>
              <small class="text-muted">Simpan ke sheet transaksi</small>
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

        <div v-if="errorMessage" class="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-3">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="mb-3">
            <label class="form-label fw-semibold small text-dark mb-1">Tanggal</label>
            <input v-model="form.tanggal" type="date" class="form-control rounded-3" />
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold small text-dark mb-1">
              Keterangan <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.Keterangan"
              type="text"
              class="form-control rounded-3"
              placeholder="Contoh: DP Lokasi & Gedung"
              required
              autofocus
            />
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold small text-dark mb-1">Kategori</label>
            <input
              v-model="form.Kategori"
              type="text"
              class="form-control rounded-3"
              placeholder="Contoh: Lokasi, Konsumsi"
            />
          </div>
          <div class="mb-4">
            <label class="form-label fw-semibold small text-dark mb-1">
              Nominal Kredit / Debit <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.Kredit_Debit"
              type="number"
              class="form-control rounded-3"
              placeholder="15000000"
              required
            />
          </div>
          <div class="d-flex justify-content-end gap-2 pt-2 border-top">
            <button
              type="button"
              class="btn btn-light rounded-pill px-4 fw-semibold text-muted"
              :disabled="isSubmitting"
              @click="closeModal"
            >
              Batal
            </button>
            <button
              type="submit"
              class="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status"></span>
              <span v-else><i class="bi bi-save me-1"></i> Simpan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
}

.modal-dialog-custom {
  animation: slideDown 0.25s ease-out;
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
</style>
