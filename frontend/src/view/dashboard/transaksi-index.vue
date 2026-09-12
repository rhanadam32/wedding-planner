<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { transaksiService, Transaksi } from '../../services/api';

const list = ref<Transaksi[]>([]);
const isLoading = ref(true);
const showModal = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');
const deletingId = ref<string | null>(null);
const editingId = ref<string | null>(null);

// Radio button: 'debit' | 'kredit'
const tipeTransaksi = ref<'debit' | 'kredit'>('debit');
// Nominal absolut yang diinput user (selalu positif)
const nominalInput = ref<number | string>('');

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

// Deteksi apakah nilai adalah kredit (negatif)
const isKredit = (value: number | string) => Number(value) < 0;

// Computed totals
const totalDebit = computed(() =>
  list.value.reduce((sum, item) => {
    const val = Number(item.Kredit_Debit ?? 0);
    return sum + (val > 0 ? val : 0);
  }, 0)
);
const totalKredit = computed(() =>
  list.value.reduce((sum, item) => {
    const val = Number(item.Kredit_Debit ?? 0);
    return sum + (val < 0 ? Math.abs(val) : 0);
  }, 0)
);
const totalKeseluruhan = computed(() => totalDebit.value - totalKredit.value);

// Saat tipe berubah, update Kredit_Debit di form
const onTipeChange = () => {
  if (nominalInput.value === '' || nominalInput.value === null) return;
  const abs = Math.abs(Number(nominalInput.value));
  form.value.Kredit_Debit = tipeTransaksi.value === 'kredit' ? -abs : abs;
};

// Saat nominal berubah, update Kredit_Debit di form
const onNominalChange = () => {
  const abs = Math.abs(Number(nominalInput.value));
  form.value.Kredit_Debit = tipeTransaksi.value === 'kredit' ? -abs : abs;
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
  tipeTransaksi.value = 'debit';
  nominalInput.value = '';
  errorMessage.value = '';
  showModal.value = true;
};

const openEditModal = (item: Transaksi) => {
  if (!item.id_transaksi) return;
  editingId.value = String(item.id_transaksi);
  const val = Number(item.Kredit_Debit ?? 0);
  tipeTransaksi.value = val < 0 ? 'kredit' : 'debit';
  nominalInput.value = Math.abs(val);
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
  if (nominalInput.value === '' || nominalInput.value === null) {
    errorMessage.value = 'Nominal Kredit/Debit tidak boleh kosong!';
    return;
  }

  // Pastikan Kredit_Debit sudah ter-update
  const abs = Math.abs(Number(nominalInput.value));
  form.value.Kredit_Debit = tipeTransaksi.value === 'kredit' ? -abs : abs;

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
  <div class="card border-0 rounded-4 shadow-sm p-3 p-sm-4 bg-white">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4 pb-2 border-bottom">
      <div>
        <h4 class="fw-bold mb-1 text-dark">
          <i class="bi bi-wallet2 text-warning me-2"></i>Tabungan
        </h4>
        <p class="text-muted small mb-0">Catatan Transaksi Pemasukan dan Pengeluaran</p>
      </div>
      <button
        class="btn btn-sm btn-primary rounded-pill px-3 fw-semibold shadow-sm transaksi-add-btn"
        @click="openCreateModal"
      >
        <i class="bi bi-plus-lg me-1"></i> Catat Pengeluaran
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5 text-muted">
      <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
      <p class="small mb-0">Memuat data transaksi...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="list.length === 0" class="text-center py-5 text-muted">
      <i class="bi bi-receipt fs-1 d-block mb-2 text-secondary"></i>
      <p class="mb-0 fw-medium">Belum ada transaksi yang tersimpan.</p>
    </div>

    <!-- Data List -->
    <div v-else>
      <!-- Mobile List View (d-md-none): satu baris per transaksi -->
      <div class="d-md-none d-flex flex-column gap-2">
        <div class="trx-list">
          <div
            v-for="item in list"
            :key="item.id_transaksi"
            class="trx-row"
          >
            <!-- Ikon tipe -->
            <div
              class="trx-icon flex-shrink-0"
              :class="isKredit(item.Kredit_Debit) ? 'trx-out' : 'trx-in'"
            >
              <i
                class="bi"
                :class="isKredit(item.Kredit_Debit) ? 'bi-arrow-up-right' : 'bi-arrow-down-left'"
              ></i>
            </div>

            <!-- Tengah: keterangan + meta sebaris -->
            <div class="trx-main">
              <div class="trx-title">{{ item.Keterangan || '—' }}</div>
              <div class="trx-meta">
                <span class="trx-date">{{ item.tanggal || '-' }}</span>
                <span class="trx-dot">•</span>
                <span class="trx-cat">{{ item.Kategori || '-' }}</span>
              </div>
            </div>

            <!-- Kanan: nominal + aksi ikon -->
            <div class="trx-side flex-shrink-0">
              <div
                class="trx-amount"
                :class="isKredit(item.Kredit_Debit) ? 'text-danger' : 'text-success'"
              >{{ (isKredit(item.Kredit_Debit) ? '−' : '+') + formatRupiah(Math.abs(Number(item.Kredit_Debit))) }}</div>
              <div class="trx-actions">
                <button
                  type="button"
                  class="trx-btn trx-btn-edit"
                  title="Ubah"
                  aria-label="Ubah transaksi"
                  @click="openEditModal(item)"
                >
                  <i class="bi bi-pencil"></i>
                </button>
                <button
                  type="button"
                  class="trx-btn trx-btn-delete"
                  title="Hapus"
                  aria-label="Hapus transaksi"
                  :disabled="deletingId === String(item.id_transaksi)"
                  @click="handleDelete(item)"
                >
                  <span v-if="deletingId === String(item.id_transaksi)" class="spinner-border spinner-border-sm" role="status"></span>
                  <i v-else class="bi bi-trash3"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Totals Card -->
        <div class="rounded-3 border shadow-sm overflow-hidden mt-1">
          <div class="bg-light px-3 py-2 small fw-bold text-muted text-uppercase border-bottom">Ringkasan</div>
          <div class="p-3 d-flex flex-column gap-2">
            <div class="d-flex justify-content-between align-items-center">
              <span class="small text-muted">Total Debit</span>
              <span class="fw-bold text-success">{{ formatRupiah(totalDebit) }}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center">
              <span class="small text-muted">Total Kredit</span>
              <span class="fw-bold text-danger">{{ formatRupiah(totalKredit) }}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center border-top pt-2 mt-1">
              <span class="small fw-semibold text-dark">Keseluruhan (Saldo)</span>
              <span class="fw-bold" :class="totalKeseluruhan >= 0 ? 'text-success' : 'text-danger'">
                {{ formatRupiah(totalKeseluruhan) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Table View (d-none d-md-block) -->
      <div class="table-responsive d-none d-md-block">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr class="small text-muted text-uppercase">
              <th>ID User</th>
              <th>Tanggal</th>
              <th>Keterangan</th>
              <th>Kategori</th>
              <th class="text-success">Debit</th>
              <th class="text-danger">Kredit</th>
              <th class="text-end">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.id_transaksi">
              <td class="text-muted small">{{ item.id_user || '-' }}</td>
              <td class="text-muted small">{{ item.tanggal || '-' }}</td>
              <td class="fw-semibold text-dark">{{ item.Keterangan }}</td>
              <td><span class="badge bg-light text-dark border">{{ item.Kategori || '-' }}</span></td>
              <td class="fw-bold text-success">
                {{ !isKredit(item.Kredit_Debit) ? formatRupiah(item.Kredit_Debit) : '-' }}
              </td>
              <td class="fw-bold text-danger">
                {{ isKredit(item.Kredit_Debit) ? formatRupiah(Math.abs(Number(item.Kredit_Debit))) : '-' }}
              </td>
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
          <tfoot class="table-light fw-bold border-top border-2">
            <tr>
              <td colspan="4" class="text-end text-muted small pe-3">Total</td>
              <td class="text-success">{{ formatRupiah(totalDebit) }}</td>
              <td class="text-danger">{{ formatRupiah(totalKredit) }}</td>
              <td></td>
            </tr>
            <tr class="border-top">
              <td colspan="4" class="text-end text-muted small pe-3">Keseluruhan (Saldo)</td>
              <td colspan="2" :class="totalKeseluruhan >= 0 ? 'text-success' : 'text-danger'">
                {{ formatRupiah(totalKeseluruhan) }}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

    </div>

    <!-- Modal Form Tambah / Ubah Transaksi -->
    <div v-if="showModal" class="modal-backdrop-custom d-flex align-items-center justify-content-center">
      <div class="modal-dialog-custom bg-white rounded-4 shadow-lg p-3 p-sm-4 w-100 mx-3" style="max-width: 500px;">
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
            <label class="form-label fw-semibold small text-dark mb-2">
              Tipe Transaksi <span class="text-danger">*</span>
            </label>
            <div class="d-flex gap-3">
              <div class="form-check">
                <input
                  id="tipe-debit"
                  v-model="tipeTransaksi"
                  class="form-check-input"
                  type="radio"
                  value="debit"
                  @change="onTipeChange"
                />
                <label class="form-check-label text-success fw-semibold" for="tipe-debit">
                  <i class="bi bi-arrow-up-circle me-1"></i>Debit
                </label>
              </div>
              <div class="form-check">
                <input
                  id="tipe-kredit"
                  v-model="tipeTransaksi"
                  class="form-check-input"
                  type="radio"
                  value="kredit"
                  @change="onTipeChange"
                />
                <label class="form-check-label text-danger fw-semibold" for="tipe-kredit">
                  <i class="bi bi-arrow-down-circle me-1"></i>Kredit
                </label>
              </div>
            </div>
          </div>
          <div class="mb-4">
            <label class="form-label fw-semibold small text-dark mb-1">
              Nominal <span class="text-danger">*</span>
              <span class="text-muted fw-normal ms-1 small">
                ({{ tipeTransaksi === 'kredit' ? 'Kredit: akan disimpan sebagai nilai negatif (-)' : 'Debit: nilai positif' }})
              </span>
            </label>
            <div class="input-group">
              <span
                class="input-group-text fw-bold"
                :class="tipeTransaksi === 'kredit' ? 'text-danger bg-danger-subtle border-danger' : 'text-success bg-success-subtle border-success'"
              >{{ tipeTransaksi === 'kredit' ? '-' : '+' }}</span>
              <input
                v-model="nominalInput"
                type="number"
                class="form-control rounded-end-3"
                placeholder="15000000"
                min="0"
                required
                @input="onNominalChange"
              />
            </div>
          </div>
          <div class="d-flex flex-column-reverse flex-sm-row justify-content-end gap-2 pt-2 border-top">
            <button
              type="button"
              class="btn btn-light rounded-pill px-3 px-sm-4 fw-semibold text-muted"
              :disabled="isSubmitting"
              @click="closeModal"
            >
              Batal
            </button>
            <button
              type="submit"
              class="btn btn-primary rounded-pill px-3 px-sm-4 fw-semibold shadow-sm"
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

.input-group .form-control {
  min-height: 48px;
}

.d-md-none .btn {
  min-height: 44px;
}

/* ===== Mobile list: satu baris per transaksi ===== */
.trx-list {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 0.9rem;
  overflow: hidden;
}

.trx-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem 0.8rem;
  background: #fff;
}

.trx-row + .trx-row {
  border-top: 1px solid #f1f3f5;
}

.trx-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.trx-in {
  background: var(--bs-success-bg-subtle, #d1e7dd);
  color: var(--bs-success, #198754);
}

.trx-out {
  background: var(--bs-danger-bg-subtle, #f8d7da);
  color: var(--bs-danger, #dc3545);
}

.trx-main {
  flex: 1 1 auto;
  min-width: 0;
}

.trx-title {
  font-weight: 700;
  color: #212529;
  font-size: 0.88rem;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trx-meta {
  font-size: 0.74rem;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.trx-dot {
  margin: 0 0.3rem;
  opacity: 0.6;
}

.trx-side {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;
}

.trx-amount {
  font-weight: 800;
  font-size: 0.85rem;
  white-space: nowrap;
}

.trx-actions {
  display: flex;
  gap: 0.25rem;
}

.trx-btn {
  width: 32px;
  height: 32px;
  min-height: 32px;
  border-radius: 50%;
  border: 1px solid #dee2e6;
  background: #fff;
  color: #6c757d;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  padding: 0;
}

.trx-btn-edit {
  color: var(--bs-primary, #0d6efd);
  border-color: #cfe2ff;
}

.trx-btn-delete {
  color: var(--bs-danger, #dc3545);
  border-color: #f5c2c7;
}

.trx-btn:active {
  transform: scale(0.94);
}

.form-check-input {
  width: 20px;
  height: 20px;
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

/* HP: tombol catat full-width + modal jadi bottom-sheet */
@media (max-width: 575.98px) {
  .transaksi-add-btn {
    width: 100%;
    min-height: 44px;
    font-size: 0.9rem;
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

  .modal-dialog-custom .btn {
    min-height: 48px;
  }
}
</style>
