<script setup lang="ts">
import { ref, inject, computed, onMounted } from 'vue';
import { authService, transaksiService, rencanaService, TamuServices, Transaksi, RencanaItem, Pengantin, User } from '../../services/api';

const user: User = authService.getUser() || { name: 'Pengantin', role: 'Calon Pengantin', username: 'user', id_user: '' };

// ============================================================
// Inject dari dashboard.vue (layout parent)
// ============================================================
const weddingProfile = inject<ReturnType<typeof ref<Pengantin | null>>>('weddingProfile');
const sisaHariInjected = inject<ReturnType<typeof ref<number | null>>>('sisaHari');

// ============================================================
// State Data
// ============================================================
const transaksiTerakhir = ref<Transaksi[]>([]);
const totalPengeluaran = ref(0);
const jumlahTransaksi = ref(0);

const rencanaList = ref<RencanaItem[]>([]);
const jumlahRencana = ref(0);
const jumlahSelesai = ref(0);

const jumlahTamu = ref(0);
const jumlahTamuHadir = ref(0);

const isLoadingTransaksi = ref(true);
const isLoadingRencana = ref(true);
const isLoadingTamu = ref(true);

// ============================================================
// Computed: Wedding Info dari inject
// ============================================================
const namaPassangan = computed(() => {
  const p = weddingProfile?.value;
  if (!p) return '— & —';
  const pria = p.calon_pengantin_pria?.trim() || '—';
  const wanita = p.calon_pengantin_wanita?.trim() || '—';
  return `${pria} & ${wanita}`;
});

const tanggalPernikahan = computed(() => {
  const tgl = weddingProfile?.value?.tanggal_pernikahan;
  if (!tgl) return '— Belum diisi —';
  const d = new Date(tgl);
  if (isNaN(d.getTime())) return tgl;
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
});

const lokasiPernikahan = computed(() => {
  return weddingProfile?.value?.Lokasi?.trim() || '— Belum diisi —';
});

const sisaHari = computed(() => sisaHariInjected?.value ?? null);

const sisaHariLabel = computed(() => {
  const n = sisaHari.value;
  if (n === null) return '—';
  if (n > 0) return `${n}`;
  if (n === 0) return '🎉';
  return `+${Math.abs(n)}`;
});

const sisaHariSubtext = computed(() => {
  const n = sisaHari.value;
  if (n === null) return 'Tanggal belum diisi';
  if (n > 0) return 'Hari Menuju Hari-H';
  if (n === 0) return 'Selamat! Hari-H Tiba!';
  return 'Hari sejak pernikahan';
});

const profilBelumLengkap = computed(() => {
  const p = weddingProfile?.value;
  return !p?.calon_pengantin_pria && !p?.calon_pengantin_wanita;
});

// ============================================================
// Computed: Progres Rencana
// ============================================================
const progresRencana = computed(() => {
  if (jumlahRencana.value === 0) return '0%';
  return `${Math.round((jumlahSelesai.value / jumlahRencana.value) * 100)}%`;
});

const progresSubtext = computed(() => {
  return `${jumlahSelesai.value} dari ${jumlahRencana.value} tugas selesai`;
});

// ============================================================
// Computed: 4 Kartu Statistik
// ============================================================
const ringkasan = computed(() => [
  {
    label: 'Sisa Waktu',
    nilai: sisaHariLabel.value,
    subtext: sisaHariSubtext.value,
    icon: 'bi bi-calendar2-heart-fill',
    bg: 'bg-primary-subtle text-primary'
  },
  {
    label: 'Progres Persiapan',
    nilai: progresRencana.value,
    subtext: progresSubtext.value,
    icon: 'bi bi-check2-circle',
    bg: 'bg-success-subtle text-success'
  },
  {
    label: 'Total Pengeluaran',
    nilai: isLoadingTransaksi.value ? '...' : formatRupiah(totalPengeluaran.value),
    subtext: isLoadingTransaksi.value ? 'Memuat...' : `${jumlahTransaksi.value} transaksi tercatat`,
    icon: 'bi bi-wallet2',
    bg: 'bg-warning-subtle text-warning'
  },
  {
    label: 'Tamu Undangan',
    nilai: isLoadingTamu.value ? '...' : `${jumlahTamu.value} Orang`,
    subtext: isLoadingTamu.value ? 'Memuat...' : `${jumlahTamuHadir.value} sudah konfirmasi hadir`,
    icon: 'bi bi-people-fill',
    bg: 'bg-info-subtle text-info'
  }
]);

// Preview 5 rencana pertama
const checklistPreview = computed(() => rencanaList.value.slice(0, 5));

// ============================================================
// Format Helper
// ============================================================
const formatRupiah = (value: number | string) => {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value || '-');
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(n);
};

// ============================================================
// Fetch Data
// ============================================================
const fetchTransaksi = async () => {
  isLoadingTransaksi.value = true;
  try {
    const data = await transaksiService.getTransaksi(user?.id_user);
    transaksiTerakhir.value = [...data].slice(-4).reverse();
    totalPengeluaran.value = data.reduce((sum, item) => sum + (Number(item.Kredit_Debit) || 0), 0);
    jumlahTransaksi.value = data.length;
  } catch (error) {
    console.error('Gagal memuat transaksi:', error);
  } finally {
    isLoadingTransaksi.value = false;
  }
};

const fetchRencana = async () => {
  isLoadingRencana.value = true;
  try {
    const data = await rencanaService.getRencana(user?.id_user);
    rencanaList.value = data;
    jumlahRencana.value = data.length;
    jumlahSelesai.value = data.filter(r => r.status === 'selesai').length;
  } catch (error) {
    console.error('Gagal memuat rencana:', error);
  } finally {
    isLoadingRencana.value = false;
  }
};

const fetchTamu = async () => {
  isLoadingTamu.value = true;
  try {
    const data = await TamuServices.getTamu(user?.id_user);
    jumlahTamu.value = data.length;
    jumlahTamuHadir.value = data.filter(t => t.konfirmasi === 'Hadir').length;
  } catch (error) {
    console.error('Gagal memuat tamu:', error);
  } finally {
    isLoadingTamu.value = false;
  }
};

onMounted(async () => {
  await Promise.all([fetchTransaksi(), fetchRencana(), fetchTamu()]);
});
</script>

<template>
  <div class="dash-content d-flex flex-column gap-3 gap-md-4">

    <!-- ===== BANNER ATAS: INFO PERNIKAHAN ===== -->
    <div class="card border-0 rounded-4 shadow-sm p-3 p-sm-4 bg-white">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div class="flex-grow-1">
          <span class="badge bg-danger-subtle text-danger px-3 py-1 rounded-pill mb-2 fw-semibold">
            <i class="bi bi-heart-fill me-1"></i> Rencana Pernikahan Mandiri
          </span>
          <h3 class="fw-bold text-dark mb-1 text-break">{{ namaPassangan }}</h3>
          <p class="text-muted mb-0 d-flex flex-wrap gap-2 gap-sm-3 small mt-2">
            <span><i class="bi bi-calendar-event me-1 text-primary"></i>{{ tanggalPernikahan }}</span>
            <span><i class="bi bi-geo-alt me-1 text-danger"></i>{{ lokasiPernikahan }}</span>
            <span><i class="bi bi-person me-1 text-success"></i>Akun: {{ user.name }} <span v-if="user.id_user" class="badge bg-light text-muted border ms-1">ID: {{ user.id_user }}</span></span>
          </p>
        </div>

        <!-- Countdown Box -->
        <div class="w-auto w-md-auto text-center text-md-end bg-light p-3 rounded-4 border flex-shrink-0" style="min-width: 140px;">
          <span v-if="sisaHari === null" class="text-muted small d-block text-center">Tanggal<br class="d-none d-md-block"> belum diisi</span>
          <template v-else>
            <span
              class="display-6 fw-bold lh-1 d-block"
              :class="sisaHari > 0 ? 'text-danger' : sisaHari === 0 ? 'text-success' : 'text-secondary'"
            >
              {{ sisaHariLabel }}
            </span>
            <span class="d-block text-muted small fw-semibold mt-1">{{ sisaHariSubtext }}</span>
          </template>
        </div>
      </div>
    </div>

    <!-- ===== 4 KARTU STATISTIK ===== -->
    <div class="row g-3">
      <div v-for="(item, idx) in ringkasan" :key="idx" class="col-12 col-sm-6 col-xl-3">
        <div class="card border-0 rounded-4 shadow-sm p-3 p-sm-4 bg-white h-100">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <div class="overflow-hidden me-2">
              <small class="text-muted d-block fw-semibold text-truncate">{{ item.label }}</small>
              <h5 class="fw-bold mb-0 mt-1 text-dark text-break">{{ item.nilai }}</h5>
            </div>
            <div :class="item.bg" class="rounded-3 p-3 d-flex align-items-center justify-content-center flex-shrink-0" style="width: 48px; height: 48px;">
              <i :class="item.icon" class="fs-4"></i>
            </div>
          </div>
          <small class="text-muted text-truncate d-block" style="font-size: 0.75rem;">{{ item.subtext }}</small>
        </div>
      </div>
    </div>

    <!-- ===== MAIN TWO-COLUMN ===== -->
    <div class="row g-3 g-md-4">

      <!-- KOLOM KIRI: CHECKLIST RENCANA -->
      <div class="col-12 col-lg-7">
        <div class="card border-0 rounded-4 shadow-sm p-3 p-sm-4 bg-white h-100">
          <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3 pb-2 border-bottom">
            <div>
              <h5 class="fw-bold mb-0 text-dark">
                <i class="bi bi-check2-square text-success me-2"></i>Checklist Persiapan
              </h5>
              <small class="text-muted">{{ progresSubtext }}</small>
            </div>
            <router-link to="/dashboard/rencana" class="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold shadow-sm align-self-start align-self-sm-center">
              Lihat Semua
            </router-link>
          </div>

          <div v-if="isLoadingRencana" class="text-center py-4 text-muted">
            <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
            <p class="small mb-0">Memuat rencana...</p>
          </div>

          <div v-else-if="checklistPreview.length === 0" class="text-center py-4 text-muted">
            <i class="bi bi-clipboard-x fs-2 d-block mb-2 text-secondary"></i>
            <p class="small mb-0">Belum ada rencana. <router-link to="/dashboard/rencana">Tambah sekarang</router-link></p>
          </div>

          <div v-else class="list-group list-group-flush">
            <div
              v-for="item in checklistPreview"
              :key="item.id"
              class="list-group-item d-flex justify-content-between align-items-center px-0 py-3 gap-2"
            >
              <div class="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden">
                <i
                  class="bi flex-shrink-0 fs-5"
                  :class="item.status === 'selesai' ? 'bi-check-circle-fill text-success' : 'bi-circle text-warning'"
                ></i>
                <span
                  class="text-break"
                  :class="item.status === 'selesai' ? 'text-decoration-line-through text-muted small' : 'fw-medium text-dark small'"
                >
                  {{ item.TugasRencana }}
                </span>
              </div>
              <span
                class="badge rounded-pill flex-shrink-0"
                :class="item.status === 'selesai' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'"
              >
                {{ item.status === 'selesai' ? 'Selesai' : 'Pending' }}
              </span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div v-if="!isLoadingRencana && jumlahRencana > 0" class="mt-3 pt-2 border-top">
            <div class="d-flex justify-content-between small text-muted mb-1">
              <span>Progress</span>
              <span class="fw-semibold text-success">{{ progresRencana }}</span>
            </div>
            <div class="progress" style="height: 8px; border-radius: 4px;">
              <div
                class="progress-bar bg-success"
                role="progressbar"
                :style="{ width: progresRencana }"
                :aria-valuenow="jumlahSelesai"
                :aria-valuemax="jumlahRencana"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- KOLOM KANAN: TRANSAKSI TERAKHIR -->
      <div class="col-12 col-lg-5">
        <div class="card border-0 rounded-4 shadow-sm p-3 p-sm-4 bg-white h-100">
          <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3 pb-2 border-bottom">
            <div>
              <h5 class="fw-bold mb-0 text-dark">
                <i class="bi bi-receipt text-warning me-2"></i>Transaksi Terakhir
              </h5>
              <small class="text-muted">{{ isLoadingTransaksi ? 'Memuat...' : `${jumlahTransaksi} transaksi total` }}</small>
            </div>
            <router-link to="/dashboard/transaksi" class="btn btn-sm btn-outline-warning rounded-pill px-3 fw-semibold shadow-sm align-self-start align-self-sm-center">
              Lihat Semua
            </router-link>
          </div>

          <div v-if="isLoadingTransaksi" class="text-center py-4 text-muted">
            <div class="spinner-border spinner-border-sm text-warning mb-2" role="status"></div>
            <p class="small mb-0">Memuat transaksi...</p>
          </div>

          <div v-else-if="transaksiTerakhir.length === 0" class="text-center py-4 text-muted">
            <i class="bi bi-wallet2 fs-2 d-block mb-2 text-secondary"></i>
            <p class="small mb-0">Belum ada transaksi. <router-link to="/dashboard/transaksi">Tambah sekarang</router-link></p>
          </div>

          <div v-else class="d-flex flex-column gap-2">
            <div
              v-for="trx in transaksiTerakhir"
              :key="trx.id_transaksi"
              class="p-3 rounded-3 border bg-light d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2"
            >
              <div class="overflow-hidden flex-grow-1">
                <strong class="d-block text-dark small text-break">{{ trx.Keterangan || '—' }}</strong>
                <div class="d-flex flex-wrap align-items-center gap-1 mt-1">
                  <span class="badge bg-white text-dark border" style="font-size: 0.68rem;">{{ trx.Kategori || '-' }}</span>
                  <small class="text-muted" style="font-size: 0.7rem;">{{ trx.tanggal || '' }}</small>
                </div>
              </div>
              <div class="text-sm-end flex-shrink-0">
                <span class="fw-bold text-dark small">{{ formatRupiah(trx.Kredit_Debit) }}</span>
              </div>
            </div>
          </div>

          <!-- Total -->
          <div v-if="!isLoadingTransaksi && jumlahTransaksi > 0" class="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
            <small class="text-muted fw-semibold">Total Pengeluaran</small>
            <span class="fw-bold text-warning">{{ formatRupiah(totalPengeluaran) }}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- ===== BANNER SETUP PROFIL (jika profil kosong) ===== -->
    <div v-if="profilBelumLengkap" class="card border-0 rounded-4 shadow-sm p-3 p-sm-4 bg-white">
      <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
        <div class="d-flex align-items-center gap-3 flex-grow-1">
          <div class="bg-primary-subtle text-primary rounded-3 p-3 d-flex align-items-center justify-content-center flex-shrink-0" style="width: 52px; height: 52px;">
            <i class="bi bi-person-heart fs-4"></i>
          </div>
          <div>
            <h6 class="fw-bold text-dark mb-1">Lengkapi Data Pernikahan Anda</h6>
            <small class="text-muted">Isi nama pengantin, tanggal, dan lokasi agar dashboard tampil lebih personal.</small>
          </div>
        </div>
        <router-link to="/dashboard/akun" class="btn btn-primary btn-sm rounded-pill px-4 fw-semibold flex-shrink-0 align-self-stretch align-self-sm-center text-center shadow-sm">
          <i class="bi bi-pencil me-1"></i> Lengkapi
        </router-link>
      </div>
    </div>

  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
