<script setup lang="ts">
defineProps<{
    activeMenu?:string
}>();


const emit = defineEmits(['selectMenu']);
</script>

<template>
    <aside class="bg-white border-end d-flex flex-column" style="width: 250px; min-width: 250px; min-height: 100vh;">
        <div class="p-3 border-bottom text-center">
            <h5 class="fw-bold text-primary mb-0">Wedding Planner</h5>
        </div>

        <div class="p-3 flex-grow-1">
            <ul class="nav flex-column gap-2">
                <li class="nav-item">
                    <button @click="emit('selectMenu', 'dashboard')" class="btn w-100 text-start">
                        <i class="bi bi-grid-fill me-2"></i>
                        Dashboard
                    </button>
                </li>
                 <li class="nav-item">
                    <button @click="emit('selectMenu', 'rencana')" class="btn w-100 text-start">
                        <i class="bi bi-grid-fill me-2"></i>
                        Rencana
                    </button>
                </li>
                 <li class="nav-item">
                    <button @click="emit('selectMenu', 'transaksi')" class="btn w-100 text-start">
                        <i class="bi bi-grid-fill me-2"></i>
                        transaksi
                    </button>
                </li>
                  <li class="nav-item">
                    <button @click="emit('selectMenu', 'tamu')" class="btn w-100 text-start">
                        <i class="bi bi-grid-fill me-2"></i>
                        Tamu Undangan
                    </button>
                </li>
                 <li class="nav-item">
                    <button @click="emit('selectMenu', 'akun')" class="btn w-100 text-start">
                        <i class="bi bi-grid-fill me-2"></i>
                      Akun
                    </button>
                </li>
            </ul>
        </div>
    </aside>
</template>