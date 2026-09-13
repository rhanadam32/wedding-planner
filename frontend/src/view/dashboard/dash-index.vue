<script setup lang="ts">
import { ref, inject, computed, onMounted } from 'vue';
import { authService, transaksiService, rencanaService, TamuServices, pengantinService, Transaksi, RencanaItem, Pengantin, User } from '../../services/api';

const user: User = authService.getUser() || { name: 'Pengantin', role: 'Calon Pengantin', username: 'user', id_user: '' };

// ============================================================
// Inject dari dashboard.vue (layout parent)
// ============================================================
const weddingProfileInjected = inject<ReturnType<typeof ref<Pengantin | null>>>('weddingProfile');
const sisaHariInjected = inject<ReturnType<typeof ref<number | null>>>('sisaHari');

// Local state – di-fetch langsung agar tidak bergantung pada timing inject
const localWeddingProfile = ref<Pengantin | null>(null);

// Gabungkan: prioritaskan local fetch, fallback ke inject dari parent
const weddingData = computed<Pengantin | null>(() =>
  localWeddingProfile.value ?? weddingProfileInjected?.value ?? null
);

const calculateSisaHari = (tglStr?: string): number | null => {
  if (!tglStr) return null;
  const target = new Date(tglStr);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  const targetMid = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((targetMid.getTime() - nowMid.getTime()) / (1000 * 60 * 60 * 24));
};

const fetchWeddingProfile = async () => {
  try {
    const data = await pengantinService.getPengantin(user?.id_user);
    if (data) localWeddingProfile.value = data;
  } catch (err) {
    console.warn('Gagal fetch wedding profile di dash-index:', err);
  }
};

// ============================================================
// State Data
// ============================================================
const transaksiTerakhir = ref<Transaksi[]>([]);
const totalSaldo = ref(0);
const totalDebit = ref(0);
const totalKredit = ref(0);
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
// Computed: Wedding Info
// ============================================================
const namaPassangan = computed(() => {
  const p = weddingData.value;
  if (!p) return '— & —';
  const pria = p.calon_pengantin_pria?.trim() || '—';
  const wanita = p.calon_pengantin_wanita?.trim() || '—';
  return `${pria} & ${wanita}`;
});

const tanggalPernikahan = computed(() => {
  const tgl = weddingData.value?.tanggal_pernikahan;
  if (!tgl) return '— Belum diisi —';
  const d = new Date(tgl);
  if (isNaN(d.getTime())) return tgl;
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
});

const lokasiPernikahan = computed(() => {
  return weddingData.value?.Lokasi?.trim() || '— Belum diisi —';
});

const sisaHari = computed(() => {
  // Gunakan inject dari parent jika tersedia, else hitung sendiri
  if (sisaHariInjected?.value !== null && sisaHariInjected?.value !== undefined) {
    return sisaHariInjected.value;
  }
  return calculateSisaHari(weddingData.value?.tanggal_pernikahan ?? undefined);
});

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
  const p = weddingData.value;
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
    label: 'Progress',
    nilai: progresRencana.value,
    subtext: progresSubtext.value,
    icon: 'bi bi-check2-circle',
    bg: 'bg-success-subtle text-success'
  },
  {
    label: 'Tabungan',
    nilai: isLoadingTransaksi.value ? '...' : formatRupiah(totalSaldo.value),
    subtext: isLoadingTransaksi.value ? 'Memuat...' : `Debit ${formatRupiah(totalDebit.value)} · Kredit ${formatRupiah(totalKredit.value)}`,
    icon: 'bi bi-wallet2',
    bg: 'bg-warning-subtle text-warning'
  },
  {
    label: 'Tamu',
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
    totalDebit.value = data.reduce((sum, item) => {
      const v = Number(item.Kredit_Debit) || 0;
      return sum + (v > 0 ? v : 0);
    }, 0);
    totalKredit.value = data.reduce((sum, item) => {
      const v = Number(item.Kredit_Debit) || 0;
      return sum + (v < 0 ? Math.abs(v) : 0);
    }, 0);
    totalSaldo.value = totalDebit.value - totalKredit.value;
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
  await Promise.all([fetchWeddingProfile(), fetchTransaksi(), fetchRencana(), fetchTamu()]);
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
        <div class="countdown-box w-auto w-md-auto text-center bg-light p-3 rounded-4 border flex-shrink-0" style="min-width: 140px;">
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
    <div class="row g-2 g-sm-3 stat-grid">
      <div v-for="(item, idx) in ringkasan" :key="idx" class="col-6 col-lg-4">
        <div class="card border-0 rounded-4 shadow-sm p-2 p-sm-4 bg-white h-100 stat-card">
          <div class="d-flex align-items-center justify-content-between mb-1 mb-sm-2 gap-1">
            <div class="overflow-hidden me-1 me-sm-2 flex-grow-1" style="min-width: 0;">
              <small class="text-muted d-block fw-semibold text-truncate stat-label">{{ item.label }}</small>
              <h5 class="fw-bold mb-0 mt-1 text-dark stat-value">{{ item.nilai }}</h5>
            </div>
            <div :class="item.bg" class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 stat-icon" style="width: 48px; height: 48px;">
              <i :class="item.icon" class="fs-4"></i>
            </div>
          </div>
          <small class="text-muted d-block stat-subtext">{{ item.subtext }}</small>
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

          <div v-else class="dash-trx-list">
            <div
              v-for="trx in transaksiTerakhir"
              :key="trx.id_transaksi"
              class="dash-trx-row"
            >
              <!-- Ikon tipe -->
              <div
                class="dash-trx-icon flex-shrink-0"
                :class="Number(trx.Kredit_Debit) < 0 ? 'dash-trx-out' : 'dash-trx-in'"
              >
                <i
                  class="bi"
                  :class="Number(trx.Kredit_Debit) < 0 ? 'bi-arrow-up-right' : 'bi-arrow-down-left'"
                ></i>
              </div>

              <!-- Tengah: keterangan + meta sebaris -->
              <div class="dash-trx-main">
                <div class="dash-trx-title" :title="trx.Keterangan || '—'">{{ trx.Keterangan || '—' }}</div>
                <div class="dash-trx-meta">
                  <span>{{ trx.tanggal || '-' }}</span>
                  <span class="dash-trx-dot">•</span>
                  <span>{{ trx.Kategori || '-' }}</span>
                </div>
              </div>

              <!-- Kanan: nominal + badge -->
              <div class="dash-trx-side flex-shrink-0">
                <div
                  class="dash-trx-amount"
                  :class="Number(trx.Kredit_Debit) < 0 ? 'text-danger' : 'text-success'"
                >{{ (Number(trx.Kredit_Debit) < 0 ? '−' : '+') + formatRupiah(Math.abs(Number(trx.Kredit_Debit))) }}</div>
                <span
                  class="badge rounded-pill dash-trx-badge"
                  :class="Number(trx.Kredit_Debit) >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'"
                >{{ Number(trx.Kredit_Debit) >= 0 ? 'Debit' : 'Kredit' }}</span>
              </div>
            </div>
          </div>

          <!-- Total -->
          <div v-if="!isLoadingTransaksi && jumlahTransaksi > 0" class="mt-3 pt-2 border-top">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <small class="text-muted">Total Debit</small>
              <span class="fw-semibold text-success small">{{ formatRupiah(totalDebit) }}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-1">
              <small class="text-muted">Total Kredit</small>
              <span class="fw-semibold text-danger small">{{ formatRupiah(totalKredit) }}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center pt-2 border-top mt-1">
              <small class="fw-bold text-dark">Saldo</small>
              <span class="fw-bold" :class="totalSaldo >= 0 ? 'text-success' : 'text-danger'">{{ formatRupiah(totalSaldo) }}</span>
            </div>
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

.stat-value {
  font-size: 1.15rem;
  word-break: break-word;
  line-height: 1.25;
}

.stat-subtext {
  font-size: 0.75rem;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  min-height: 2.1em;
}

.stat-icon {
  padding: 0.75rem;
}

/* ===== Widget Transaksi Terakhir: list satu baris ala mutasi ===== */
.dash-trx-list {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 0.9rem;
  overflow: hidden;
}

.dash-trx-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem 0.8rem;
  background: #fff;
}

.dash-trx-row + .dash-trx-row {
  border-top: 1px solid #f1f3f5;
}

.dash-trx-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.dash-trx-in {
  background: var(--bs-success-bg-subtle, #d1e7dd);
  color: var(--bs-success, #198754);
}

.dash-trx-out {
  background: var(--bs-danger-bg-subtle, #f8d7da);
  color: var(--bs-danger, #dc3545);
}

.dash-trx-main {
  flex: 1 1 auto;
  min-width: 0;
}

.dash-trx-title {
  font-weight: 700;
  color: #212529;
  font-size: 0.85rem;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dash-trx-meta {
  font-size: 0.72rem;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.dash-trx-dot {
  margin: 0 0.3rem;
  opacity: 0.6;
}

.dash-trx-side {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.dash-trx-amount {
  font-weight: 800;
  font-size: 0.82rem;
  white-space: nowrap;
}

.dash-trx-badge {
  font-size: 0.62rem;
}

/* ===== HP: banner full-width, statistik 2 kolom rapat ===== */
@media (max-width: 575.98px) {
  .dash-content {
    gap: 0.75rem;
  }

  .dash-content h3 {
    font-size: 1.3rem;
    line-height: 1.3;
  }

  .countdown-box {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .countdown-box .display-6 {
    font-size: 2rem;
  }

  .stat-grid {
    margin-left: -0.25rem;
    margin-right: -0.25rem;
  }

  .stat-grid > div {
    padding-left: 0.25rem;
    padding-right: 0.25rem;
  }

  .stat-card {
    border-radius: 1rem;
  }

  .stat-value {
    font-size: 0.92rem;
  }

  .stat-label {
    font-size: 0.7rem;
  }

  .stat-subtext {
    font-size: 0.68rem;
  }

  .stat-icon {
    width: 38px !important;
    height: 38px !important;
    padding: 0.5rem;
  }

  .stat-icon i {
    font-size: 1.1rem !important;
  }
}
</style>
