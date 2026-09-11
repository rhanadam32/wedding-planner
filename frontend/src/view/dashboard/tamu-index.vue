<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { authService, TamuServices, Tamu, User } from '../../services/api';

const user = ref<User | null>(authService.getUser());
const isLoading = ref(true);
const daftarTamu = ref<Tamu[]>([]);
const showModal = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');
const editingId = ref<string | null>(null);

const emptyForm = () => ({
  nama_tamu: '',
  kategori: '',
  kontak: '',
  konfirmasi: 'Pending' as 'Hadir' | 'Tidak Hadir' | 'Pending'
});

const form = ref(emptyForm());

const fetchtamu = async (showLoading = true) => {
  if (showLoading) isLoading.value = true;
  user.value = authService.getUser();
  try {
    const data = await TamuServices.getTamu(user.value?.id_user);
    const uid = String(user.value?.id_user || '').trim().toLowerCase();
    // Saring di sisi client agar tiap akun hanya melihat data miliknya (id_user)
    daftarTamu.value = uid
      ? data.filter((item) => String(item.id_user || '').trim().toLowerCase() === uid)
      : data;
  } catch (error) {
    console.error('Gagal memuat data tamu:', error);
  } finally {
    if (showLoading) isLoading.value = false;
  }
};

const openCreateModal = () => {
  editingId.value = null;
  form.value = emptyForm();
  errorMessage.value = '';
  showModal.value = true;
};

const openEditModal = (tamu: Tamu) => {
  if (tamu.id === undefined || tamu.id === null) return;
  editingId.value = String(tamu.id);
  form.value = {
    nama_tamu: String(tamu.nama_tamu || ''),
    kategori: String(tamu.kategori || ''),
    kontak: String(tamu.kontak ?? ''),
    konfirmasi: tamu.konfirmasi || 'Pending'
  };
  errorMessage.value = '';
  showModal.value = true;
};

const closeModal = () => {
  if (isSubmitting.value) return;
  showModal.value = false;
};

const handleSubmit = async () => {
  errorMessage.value = '';

  const nama = String(form.value.nama_tamu || '').trim();
  if (!nama) {
    errorMessage.value = 'Nama tamu tidak boleh kosong!';
    return;
  }

  isSubmitting.value = true;

  try {
    const currentUser = authService.getUser();
    const payload = {
      nama_tamu: nama,
      kategori: String(form.value.kategori || '').trim(),
      kontak: String(form.value.kontak ?? '').trim(),
      konfirmasi: form.value.konfirmasi,
      id_user: currentUser?.id_user
    };

    if (editingId.value) {
      const res = await TamuServices.updateTamu({
        id: editingId.value,
        ...payload
      });

      if (res && res.status === 'error') {
        errorMessage.value = res.message || 'Gagal menyimpan data tamu';
        return;
      }

      // Optimistic update pada daftar lokal
      const index = daftarTamu.value.findIndex(t => String(t.id) === String(editingId.value));
      if (index !== -1) {
        daftarTamu.value[index] = {
          ...daftarTamu.value[index],
          ...payload
        };
      }
    } else {
      const res = await TamuServices.addTamu(payload);

      if (res && res.status === 'error') {
        errorMessage.value = res.message || 'Gagal menyimpan data tamu';
        return;
      }

      if (res && res.data) {
        daftarTamu.value.push({ ...res.data, id_user: res.data.id_user ?? payload.id_user });
      }
    }

    closeModal();
    // Sinkronisasi data di background tanpa memicu loader tabel penuh
    fetchtamu(false);
  } catch (error: any) {
    console.error('Error saat menyimpan data tamu:', error);
    errorMessage.value = error?.message || 'Terjadi kesalahan pada server saat menyimpan data.';
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async (tamu: Tamu) => {
  if (tamu.id === undefined || tamu.id === null) return;
  const confirmDelete = window.confirm(`Hapus tamu "${tamu.nama_tamu}"?`);
  if (!confirmDelete) return;

  try {
    const res = await TamuServices.deleteTamu(String(tamu.id));
    if (res && res.status === 'error') {
      alert(res.message || 'Gagal menghapus tamu');
      return;
    }
    daftarTamu.value = daftarTamu.value.filter((item) => String(item.id) !== String(tamu.id));
  } catch (error) {
    console.error('Gagal menghapus tamu:', error);
    alert('Terjadi kesalahan saat menghapus tamu.');
  }
};

onMounted(() => {
  fetchtamu();
});
</script>

<template>
  <div class="card border-0 rounded-4 shadow-sm p-3 p-sm-4 bg-white">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4 pb-2 border-bottom">
      <div>
        <h4 class="fw-bold mb-1 text-dark">
          <i class="bi bi-people-fill text-info me-2"></i>Daftar Tamu Undangan
        </h4>
        <p class="text-muted small mb-0">
          Kelola daftar tamu keluarga, sahabat, dan status kehadiran khusus akun
          <strong class="text-primary">{{ user?.name || user?.username || 'Pengantin' }}</strong>
          <span v-if="user?.id_user" class="badge bg-light text-muted border ms-1">ID: {{ user.id_user }}</span>
        </p>
      </div>
      <button class="btn btn-sm btn-primary rounded-pill px-3 fw-semibold shadow-sm align-self-start align-self-sm-center" @click="openCreateModal">
        <i class="bi bi-person-plus me-1"></i> Tambah Tamu
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5 text-muted">
      <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
      <p class="small mb-0">Memuat data tamu...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="daftarTamu.length === 0" class="text-center py-5 text-muted">
      <i class="bi bi-people fs-1 d-block mb-2 text-secondary"></i>
      <p class="mb-0 fw-medium">Belum ada data tamu undangan.</p>
    </div>

    <!-- Data List -->
    <div v-else>
      <!-- Mobile Card View (d-md-none) -->
      <div class="d-md-none d-flex flex-column gap-3">
        <div
          v-for="tamu in daftarTamu"
          :key="tamu.id || tamu.nama_tamu"
          class="p-3 rounded-3 border bg-light-subtle d-flex flex-column gap-2 shadow-sm"
        >
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div class="flex-grow-1 overflow-hidden">
              <h6 class="fw-bold text-dark mb-1 text-break">{{ tamu.nama_tamu }}</h6>
              <div class="d-flex flex-wrap align-items-center gap-2 small">
                <span class="badge bg-white text-dark border">{{ tamu.kategori || '-' }}</span>
                <span
                  class="badge rounded-pill"
                  :class="{
                    'bg-success-subtle text-success': tamu.konfirmasi === 'Hadir',
                    'bg-danger-subtle text-danger': tamu.konfirmasi === 'Tidak Hadir',
                    'bg-secondary-subtle text-secondary': tamu.konfirmasi === 'Pending'
                  }"
                >
                  {{ tamu.konfirmasi }}
                </span>
                <span v-if="tamu.id_user" class="badge bg-light text-secondary border" style="font-size: 0.65rem;">
                  ID: {{ tamu.id_user }}
                </span>
              </div>
            </div>
            <div v-if="tamu.kontak" class="flex-shrink-0">
              <a
                :href="'https://wa.me/' + tamu.kontak"
                target="_blank"
                class="btn btn-sm btn-outline-success rounded-pill px-2 py-1 d-inline-flex align-items-center gap-1"
                style="font-size: 0.78rem;"
                title="Hubungi WhatsApp"
              >
                <i class="bi bi-whatsapp"></i>
                <span>WA</span>
              </a>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 pt-2 border-top">
            <button
              type="button"
              class="btn btn-outline-primary btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1"
              @click="openEditModal(tamu)"
            >
              <i class="bi bi-pencil"></i>
              <span>Ubah</span>
            </button>
            <button
              type="button"
              class="btn btn-outline-danger btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1"
              @click="handleDelete(tamu)"
            >
              <i class="bi bi-trash3"></i>
              <span>Hapus</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Desktop Table View (d-none d-md-block) -->
      <div class="table-responsive d-none d-md-block">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr class="small text-muted text-uppercase">
              <th>ID User</th>
              <th>Nama Tamu</th>
              <th>Kategori</th>
              <th>Kontak (WA)</th>
              <th>Konfirmasi</th>
              <th class="text-end">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tamu in daftarTamu" :key="tamu.id || tamu.nama_tamu">
              <td class="text-muted small">{{ tamu.id_user || '-' }}</td>
              <td class="fw-semibold text-dark">{{ tamu.nama_tamu }}</td>
              <td><span class="badge bg-light text-dark border">{{ tamu.kategori || '-' }}</span></td>
              <td>
                <a v-if="tamu.kontak" :href="'https://wa.me/' + tamu.kontak" target="_blank" class="text-decoration-none small text-success">
                  <i class="bi bi-whatsapp me-1"></i>{{ tamu.kontak }}
                </a>
                <span v-else class="text-muted small">-</span>
              </td>
              <td>
                <span
                  class="badge rounded-pill"
                  :class="{
                    'bg-success-subtle text-success': tamu.konfirmasi === 'Hadir',
                    'bg-danger-subtle text-danger': tamu.konfirmasi === 'Tidak Hadir',
                    'bg-secondary-subtle text-secondary': tamu.konfirmasi === 'Pending'
                  }"
                >
                  {{ tamu.konfirmasi }}
                </span>
              </td>
              <td class="text-end">
                <div class="d-inline-flex gap-1">
                  <button
                    type="button"
                    class="btn btn-outline-primary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center p-0"
                    style="width: 32px; height: 32px;"
                    title="Ubah"
                    @click="openEditModal(tamu)"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-danger btn-sm rounded-circle d-inline-flex align-items-center justify-content-center p-0"
                    style="width: 32px; height: 32px;"
                    title="Hapus"
                    @click="handleDelete(tamu)"
                  >
                    <i class="bi bi-trash3"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Tambah / Edit Tamu -->
    <div v-if="showModal" class="modal-backdrop-custom d-flex align-items-center justify-content-center">
      <div class="modal-dialog-custom bg-white rounded-4 shadow-lg p-3 p-sm-4 w-100 mx-3" style="max-width: 500px;">
        <!-- Modal Header -->
        <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <div class="d-flex align-items-center gap-2">
            <div class="bg-info-subtle text-info p-2 rounded-circle d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
              <i class="bi bi-people-fill fs-5"></i>
            </div>
            <div>
              <h5 class="fw-bold mb-0 text-dark">
                {{ editingId ? 'Ubah Tamu Undangan' : 'Tambah Tamu Undangan' }}
              </h5>
              <small class="text-muted">Kelola data tamu undangan pernikahan</small>
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
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit">
          <div class="mb-3">
            <label class="form-label fw-semibold small text-dark mb-1">
              Nama Tamu <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.nama_tamu"
              type="text"
              class="form-control rounded-3"
              placeholder="Contoh: Bpk. Hendra & Keluarga"
              required
              autofocus
            />
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold small text-dark mb-1">Kategori / Kelompok</label>
            <input
              v-model="form.kategori"
              type="text"
              class="form-control rounded-3"
              placeholder="Contoh: Keluarga / Sahabat / Rekan Kerja"
            />
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold small text-dark mb-1">Kontak (WhatsApp)</label>
            <input
              v-model="form.kontak"
              type="text"
              class="form-control rounded-3"
              placeholder="Contoh: 08123456789"
            />
          </div>

          <div class="mb-4">
            <label class="form-label fw-semibold small text-dark mb-1">Status Konfirmasi</label>
            <select v-model="form.konfirmasi" class="form-select rounded-3">
              <option value="Pending">Pending</option>
              <option value="Hadir">Hadir</option>
              <option value="Tidak Hadir">Tidak Hadir</option>
            </select>
          </div>

          <!-- Modal Footer -->
          <div class="d-flex justify-content-end gap-2 pt-2 border-top">
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
