<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { TamuServices, Tamu } from '../../services/api';

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
  try {
    const data = await TamuServices.getTamu();
    daftarTamu.value = data;
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
    const payload = {
      nama_tamu: nama,
      kategori: String(form.value.kategori || '').trim(),
      kontak: String(form.value.kontak ?? '').trim(),
      konfirmasi: form.value.konfirmasi
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
        daftarTamu.value.push(res.data);
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
  <div class="card border-0 rounded-4 shadow-sm p-4 bg-white">
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-4 pb-2 border-bottom">
      <div>
        <h4 class="fw-bold mb-1 text-dark">
          <i class="bi bi-people-fill text-info me-2"></i>Daftar Tamu Undangan
        </h4>
        <p class="text-muted small mb-0">Kelola daftar tamu keluarga, sahabat, dan status kehadiran</p>
      </div>
      <button class="btn btn-sm btn-primary rounded-pill px-3 fw-semibold" @click="openCreateModal">
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
            <th>Konfirmasi</th>
            <th class="text-end">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="5" class="text-center py-4 text-muted">Memuat data tamu...</td>
          </tr>
          <tr v-else-if="daftarTamu.length === 0">
            <td colspan="5" class="text-center py-4 text-muted">Belum ada data tamu.</td>
          </tr>
          <tr v-for="tamu in daftarTamu" :key="tamu.id || tamu.nama_tamu">
            <td class="fw-semibold text-dark">{{ tamu.nama_tamu }}</td>
            <td><span class="badge bg-light text-dark border">{{ tamu.kategori }}</span></td>
            <td>
              <a :href="'https://wa.me/' + tamu.kontak" target="_blank" class="text-decoration-none small text-success">
                <i class="bi bi-whatsapp me-1"></i>{{ tamu.kontak }}
              </a>
            </td>
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
            <td class="text-end">
              <button
                class="btn btn-sm btn-outline-secondary border-0 me-1"
                title="Edit Tamu"
                @click="openEditModal(tamu)"
              >
                <i class="bi bi-pencil-square"></i>
              </button>
              <button
                class="btn btn-sm btn-outline-danger border-0"
                title="Hapus Tamu"
                @click="handleDelete(tamu)"
              >
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Tambah / Edit Tamu -->
    <div v-if="showModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow rounded-4">
          <div class="modal-header border-bottom-0 pb-0">
            <h5 class="modal-title fw-bold">
              {{ editingId ? 'Edit Tamu Undangan' : 'Tambah Tamu Undangan' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal" :disabled="isSubmitting"></button>
          </div>
          <div class="modal-body pt-3">
            <div v-if="errorMessage" class="alert alert-danger py-2 small mb-3">
              {{ errorMessage }}
            </div>

            <form @submit.prevent="handleSubmit">
              <div class="mb-3">
                <label class="form-label small fw-semibold text-muted">Nama Tamu</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="form.nama_tamu"
                  placeholder="Contoh: Bpk. Hendra & Keluarga"
                  required
                />
              </div>

              <div class="mb-3">
                <label class="form-label small fw-semibold text-muted">Kategori / Kelompok</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="form.kategori"
                  placeholder="Contoh: Keluarga / Sahabat / Teman Kantor"
                />
              </div>

              <div class="mb-3">
                <label class="form-label small fw-semibold text-muted">Kontak (WhatsApp)</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="form.kontak"
                  placeholder="Contoh: 08123456789"
                />
              </div>

              <div class="mb-4">
                <label class="form-label small fw-semibold text-muted">Status Konfirmasi</label>
                <select class="form-select" v-model="form.konfirmasi">
                  <option value="Pending">Pending</option>
                  <option value="Hadir">Hadir</option>
                  <option value="Tidak Hadir">Tidak Hadir</option>
                </select>
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  class="btn btn-light rounded-pill px-4"
                  @click="closeModal"
                  :disabled="isSubmitting"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  class="btn btn-primary rounded-pill px-4"
                  :disabled="isSubmitting"
                >
                  <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
                  {{ editingId ? 'Simpan Perubahan' : 'Tambah Tamu' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
