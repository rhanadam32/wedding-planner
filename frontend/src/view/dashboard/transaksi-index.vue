<script setup lang="ts">
import { ref } from 'vue';

const transaksi = ref([
  { id: 1, item: 'DP Lokasi & Gedung', kategori: 'Lokasi', biaya: 'Rp 15.000.000', status: 'Lunas', tanggal: '10 Agu 2026' },
  { id: 2, item: 'Catering Makanan (DP 50%)', kategori: 'Konsumsi', biaya: 'Rp 12.000.000', status: 'DP', tanggal: '12 Agu 2026' },
  { id: 3, item: 'Sewa Busana & Rias Pengantin', kategori: 'Busana & MUA', biaya: 'Rp 6.000.000', status: 'Lunas', tanggal: '15 Agu 2026' },
  { id: 4, item: 'Foto & Video Dokumentasi', kategori: 'Dokumentasi', biaya: 'Rp 4.500.000', status: 'DP', tanggal: '18 Agu 2026' },
  { id: 5, item: 'Cincin Kawin & Mahar', kategori: 'Mahar', biaya: 'Rp 7.500.000', status: 'Lunas', tanggal: '20 Agu 2026' },
]);
</script>

<template>
  <div class="card border-0 rounded-4 shadow-sm p-4 bg-white">
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-4 pb-2 border-bottom">
      <div>
        <h4 class="fw-bold mb-1 text-dark">
          <i class="bi bi-wallet2 text-warning me-2"></i>Transaksi & Pengeluaran
        </h4>
        <p class="text-muted small mb-0">Catatan pembayaran biaya dan status pelunasan</p>
      </div>
      <button class="btn btn-sm btn-primary rounded-pill px-3 fw-semibold">
        <i class="bi bi-plus-lg me-1"></i> Catat Pengeluaran
      </button>
    </div>

    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr class="small text-muted text-uppercase">
            <th>Tanggal</th>
            <th>Pengeluaran</th>
            <th>Kategori</th>
            <th>Biaya</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in transaksi" :key="item.id">
            <td class="text-muted small">{{ item.tanggal }}</td>
            <td class="fw-semibold text-dark">{{ item.item }}</td>
            <td><span class="badge bg-light text-dark border">{{ item.kategori }}</span></td>
            <td class="fw-bold text-dark">{{ item.biaya }}</td>
            <td>
              <span 
                class="badge"
                :class="item.status === 'Lunas' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'"
              >
                {{ item.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
