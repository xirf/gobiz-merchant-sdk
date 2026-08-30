<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
    <!-- Header -->
    <AppHeader
      :config="config"
      :server-info="serverInfo"
      :loading="loading"
      @open-config="isConfigOpen = true"
    />

    <!-- Main Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- Tabs Navigation -->
      <div class="flex items-center gap-1.5 p-1.5 bg-slate-200/70 dark:bg-slate-900 border rounded-xl overflow-x-auto text-xs font-semibold">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          @click="activeTab = tab.id"
          class="flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap"
          :class="activeTab === tab.id ? 'bg-card text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'"
        >
          <span>{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Tab 1: Portal Dynamic QRIS (Direct Toko) -->
      <section v-if="activeTab === 'portal_qris'" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left: Form Input -->
        <div class="lg:col-span-7 bg-card border rounded-2xl p-6 shadow-sm space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold">Generator QRIS Dinamis (Akun Toko)</h2>
                <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  ⚡ Auto-Matching
                </span>
              </div>
              <p class="text-xs text-muted-foreground">Konversi QRIS Statis tokomu ke QRIS Dinamis + Kode Unik (1..99)</p>
            </div>
            <!-- Presets -->
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                @click="portalForm.amount = 10000; portalForm.trxId = 'ORDER-' + Math.floor(Math.random() * 10000)"
                class="px-2 py-1 text-[11px] font-medium rounded-md border bg-muted/50 hover:bg-muted"
              >
                Rp 10.000
              </button>
              <button
                type="button"
                @click="portalForm.amount = 50000; portalForm.trxId = 'ORDER-' + Math.floor(Math.random() * 10000)"
                class="px-2 py-1 text-[11px] font-medium rounded-md border bg-muted/50 hover:bg-muted"
              >
                Rp 50.000
              </button>
            </div>
          </div>

          <form @submit.prevent="generatePortalQris" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-muted-foreground mb-1">Nominal Dasar (IDR)</label>
                <div class="relative">
                  <span class="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">Rp</span>
                  <input
                    v-model.number="portalForm.amount"
                    type="number"
                    step="1000"
                    min="1000"
                    class="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-muted-foreground mb-1">Biaya Admin / Fee</label>
                <div class="relative">
                  <span class="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">Rp</span>
                  <input
                    v-model.number="portalForm.fee"
                    type="number"
                    min="0"
                    class="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-muted-foreground mb-1">ID Transaksi / Order</label>
                <input
                  v-model="portalForm.trxId"
                  type="text"
                  class="w-full px-3 py-2 rounded-lg border bg-background font-mono text-xs outline-none"
                  required
                />
              </div>
            </div>

            <!-- Unique Code Mode -->
            <div class="p-3 bg-muted/20 border rounded-xl space-y-2">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold block">Digit Kode Unik</span>
                  <span class="text-[11px] text-muted-foreground">Pilih 2 digit (10..99) atau 3 digit (100..999)</span>
                </div>
                <div class="flex gap-1.5">
                  <button
                    type="button"
                    @click="portalForm.uniqueCodeDigits = 2"
                    class="px-2.5 py-1 text-xs font-bold rounded-lg border transition-all"
                    :class="portalForm.uniqueCodeDigits === 2 ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'"
                  >
                    2 Digit (10-99)
                  </button>
                  <button
                    type="button"
                    @click="portalForm.uniqueCodeDigits = 3"
                    class="px-2.5 py-1 text-xs font-bold rounded-lg border transition-all"
                    :class="portalForm.uniqueCodeDigits === 3 ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'"
                  >
                    3 Digit (100-999)
                  </button>
                </div>
              </div>
            </div>

            <!-- Static QRIS String Source & Quick Upload -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold text-muted-foreground">QRIS Statis Toko</label>
                <button
                  type="button"
                  @click="showUploaderInForm = !showUploaderInForm"
                  class="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                >
                  <span>📷</span>
                  <span>{{ showUploaderInForm ? 'Tutup Upload' : 'Upload / Scan Gambar QRIS' }}</span>
                </button>
              </div>

              <!-- Quick Uploader Dropzone -->
              <div v-if="showUploaderInForm" class="p-3 bg-muted/30 border rounded-xl animate-in fade-in duration-150">
                <QrisImageUploader @decoded="(str) => { config.staticQris = str; showUploaderInForm = false; }" />
              </div>

              <input
                v-model="config.staticQris"
                type="text"
                class="w-full px-3 py-1.5 rounded-lg border bg-muted/40 font-mono text-[11px] outline-none"
                placeholder="000201010211..."
              />
            </div>

            <button
              type="submit"
              :disabled="actionLoading"
              class="w-full py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {{ actionLoading ? 'Membuat QRIS...' : '⚡ Generate QRIS Dinamis + Kode Unik' }}
            </button>
          </form>
        </div>

        <!-- Right: Generated Dynamic QRIS Visualizer -->
        <div class="lg:col-span-5 space-y-6">
          <div v-if="currentPortalPayment" class="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[11px] text-muted-foreground font-mono">Trx: {{ currentPortalPayment.trxId }}</span>
                <h3 class="text-sm font-bold">QRIS Dinamis Siap Scan</h3>
              </div>
              <span
                class="px-2 py-0.5 text-xs font-bold rounded-full uppercase"
                :class="isPortalPaid ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'"
              >
                {{ isPortalPaid ? 'PAID (LUNAS)' : 'PENDING' }}
              </span>
            </div>

            <!-- QR Code Visualizer -->
            <div class="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-inner text-black space-y-3">
              <img
                :src="currentPortalPayment.qrImageUrl"
                alt="Dynamic QRIS"
                class="w-48 h-48 rounded-lg shadow-sm border p-1"
              />
              <div class="text-center space-y-1">
                <span class="text-xs font-bold text-slate-800">Scan via GoPay, BCA, Mandiri, DANA, OVO</span>
                <div class="bg-slate-100 px-3 py-1 rounded-lg border font-mono">
                  <span class="text-xs text-slate-500">Total Transfer: </span>
                  <span class="text-sm font-black text-emerald-700">Rp {{ Number(currentPortalPayment.amountToPay).toLocaleString('id-ID') }}</span>
                </div>
                <p class="text-[10px] text-slate-500">
                  Nominal dasar: Rp {{ Number(currentPortalPayment.amount).toLocaleString('id-ID') }} + Kode Unik: <strong>+{{ currentPortalPayment.uniqueCode }}</strong>
                </p>
              </div>
            </div>

            <!-- Auto-Poll Switch & Status Log -->
            <div class="p-3 bg-muted/40 border rounded-xl space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full" :class="isAutoPolling ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'"></span>
                  <span class="text-xs font-bold">Auto-Check Mutasi Aman (Random 30s - 60s)</span>
                </div>
                <div class="flex items-center gap-2">
                  <span v-if="isAutoPolling && countdownSeconds > 0 && !isPortalPaid" class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold">
                    ⏱️ {{ countdownSeconds }}s
                  </span>
                  <input
                    type="checkbox"
                    v-model="isAutoPolling"
                    class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
              <div v-if="pollStatusLog" class="text-[11px] font-mono text-muted-foreground bg-background/60 p-2 rounded border">
                {{ pollStatusLog }}
              </div>
            </div>

            <!-- Manual Settlement Checking Button -->
            <button
              type="button"
              @click="checkPortalSettlement"
              :disabled="actionLoading"
              class="w-full py-2.5 px-3 rounded-xl border bg-emerald-600/10 border-emerald-600/30 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <span>🔍</span>
              <span>{{ actionLoading ? 'Memeriksa Mutasi GoBiz...' : 'Cek Mutasi Masuk Sekarang' }}</span>
            </button>

            <!-- Raw Mutations Viewer Trigger -->
            <div class="pt-2 border-t flex items-center justify-between">
              <span class="text-xs font-semibold text-muted-foreground">Riwayat Mutasi GoBiz</span>
              <button
                type="button"
                @click="loadPortalMutations"
                class="text-[11px] text-primary hover:underline font-bold"
              >
                🔄 Refresh Mutasi
              </button>
            </div>

            <!-- Recent Mutations Feed -->
            <div v-if="portalMutations.length" class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <div
                v-for="mut in portalMutations"
                :key="mut.id"
                class="p-2 rounded-lg border text-xs flex items-center justify-between transition-all"
                :class="currentPortalPayment && Math.abs(mut.amount - currentPortalPayment.amountToPay) === 0 ? 'bg-emerald-500/10 border-emerald-500/30 font-bold' : 'bg-background'"
              >
                <div class="space-y-0.5">
                  <div class="flex items-center gap-1.5">
                    <span class="font-mono text-emerald-600 dark:text-emerald-400 font-bold">Rp {{ Number(mut.amount).toLocaleString('id-ID') }}</span>
                    <span class="text-[10px] uppercase px-1 py-0.2 rounded bg-muted font-semibold">{{ mut.payment_type }}</span>
                  </div>
                  <span class="text-[10px] text-muted-foreground font-mono">{{ new Date(mut.transaction_time).toLocaleTimeString('id-ID') }}</span>
                </div>
                <span
                  class="text-[10px] px-1.5 py-0.5 rounded font-bold"
                  :class="mut.status === 'SETTLEMENT' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted text-muted-foreground'"
                >
                  {{ mut.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Empty placeholder -->
          <div v-else class="bg-card border rounded-2xl p-8 shadow-sm text-center text-muted-foreground space-y-2">
            <span class="text-3xl block">📲</span>
            <h4 class="text-xs font-bold">Belum Ada QRIS Aktif</h4>
            <p class="text-[11px]">Isi nominal di sebelah kiri dan klik tombol generate untuk membuat QRIS dinamis.</p>
          </div>
        </div>
      </section>

      <!-- Tab 2: Open API QRIS Transactions -->
      <section v-if="activeTab === 'openapi_qris'" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7 bg-card border rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 class="text-base font-bold">Official GoBiz Open API QRIS</h2>
            <p class="text-xs text-muted-foreground">Membuat transaksi melalui endpoint resmi GoTo Financial (POST /v2/transactions)</p>
          </div>

          <form @submit.prevent="createOpenApiPayment" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-muted-foreground mb-1">Outlet ID</label>
                <input v-model="openApiForm.outlet_id" type="text" class="w-full px-3 py-2 rounded-lg border bg-background font-mono text-xs outline-none" required />
              </div>
              <div>
                <label class="block text-xs font-semibold text-muted-foreground mb-1">Gross Amount (IDR)</label>
                <input v-model.number="openApiForm.amount" type="number" class="w-full px-3 py-2 rounded-lg border bg-background text-sm font-bold outline-none" required />
              </div>
              <div>
                <label class="block text-xs font-semibold text-muted-foreground mb-1">Order ID</label>
                <input v-model="openApiForm.order_id" type="text" class="w-full px-3 py-2 rounded-lg border bg-background font-mono text-xs outline-none" required />
              </div>
            </div>

            <button
              type="submit"
              :disabled="actionLoading"
              class="w-full py-2.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground transition-all shadow-md disabled:opacity-50"
            >
              {{ actionLoading ? 'Memproses...' : 'Generate Official QRIS Transaction' }}
            </button>
          </form>
        </div>

        <div class="lg:col-span-5 space-y-4">
          <div v-if="lastCreatedPayment" class="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 class="text-sm font-bold">Official QRIS Ready</h3>
            <div class="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-inner text-black space-y-2">
              <img
                :src="'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(lastCreatedPayment.transaction?.qris_string || 'QRIS')"
                alt="QRIS Code"
                class="w-44 h-44 rounded-lg shadow-sm border p-1"
              />
              <span class="text-xs font-bold text-slate-800">Rp {{ Number(lastCreatedPayment.transaction?.gross_amount || 0).toLocaleString('id-ID') }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Tab 3: Outlets Explorer -->
      <section v-if="activeTab === 'outlets'" class="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-bold">Merchant Outlets Explorer</h2>
            <p class="text-xs text-muted-foreground">Daftar outlet toko yang terhubung</p>
          </div>
          <button
            type="button"
            @click="loadLinkedOutlets"
            class="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground"
          >
            Fetch Linked Outlets
          </button>
        </div>

        <div v-if="outletsList.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="outlet in outletsList" :key="outlet.id" class="p-4 rounded-xl border bg-muted/20 space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold">{{ outlet.name || 'Outlet ' + outlet.id }}</h4>
              <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-500">
                {{ outlet.status || 'ACTIVE' }}
              </span>
            </div>
            <div class="text-[11px] text-muted-foreground space-y-1">
              <div><span class="font-semibold">Outlet ID:</span> <span class="font-mono">{{ outlet.id }}</span></div>
              <div v-if="outlet.brand_name"><span class="font-semibold">Brand:</span> {{ outlet.brand_name }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Live API Response Inspector -->
      <ResponseViewer :data="lastApiResponse" :error="lastApiError" :title="lastApiTitle" />
    </main>

    <!-- Credentials Modal -->
    <CredentialsDrawer
      :is-open="isConfigOpen"
      :config="config"
      @close="isConfigOpen = false"
      @save="onSaveConfig"
      @reset="resetToDefault"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onUnmounted } from 'vue';
import { useGoBizConfig } from './composables/useGoBizConfig.js';

const { config, serverInfo, loading, getHeaders, fetchServerInfo, resetToDefault } = useGoBizConfig();

const isConfigOpen = ref(false);
const showUploaderInForm = ref(false);
const activeTab = ref('portal_qris');
const actionLoading = ref(false);

const lastApiResponse = ref<any>(null);
const lastApiError = ref<any>(null);
const lastApiTitle = ref('API Response');

const currentPortalPayment = ref<any>(null);
const isPortalPaid = ref(false);

const lastCreatedPayment = ref<any>(null);
const outletsList = ref<any[]>([]);

const tabs = [
  { id: 'portal_qris', label: '⚡ Portal Dynamic QRIS (Direct Toko)', icon: '📲' },
  { id: 'openapi_qris', label: '🏢 Official Open API QRIS', icon: '🌐' },
  { id: 'outlets', label: '🏪 Outlets Explorer', icon: '🏬' },
];

const portalForm = reactive({
  amount: 25000,
  fee: 0,
  uniqueCodeDigits: 2 as 2 | 3,
  trxId: 'ORDER-' + Math.floor(Math.random() * 100000),
});

const openApiForm = reactive({
  outlet_id: 'G000012345',
  amount: 50000,
  order_id: 'ORD-OPENAPI-' + Math.floor(Math.random() * 100000),
});

const onSaveConfig = async () => {
  isConfigOpen.value = false;
  await fetchServerInfo();
};

const executeApi = async (title: string, fn: () => Promise<any>) => {
  actionLoading.value = true;
  lastApiError.value = null;
  lastApiResponse.value = null;
  lastApiTitle.value = title;
  try {
    const res = await fn();
    lastApiResponse.value = res;
    return res;
  } catch (err: any) {
    lastApiError.value = err;
    console.error(err);
  } finally {
    actionLoading.value = false;
  }
};

const isAutoPolling = ref(true);
const countdownSeconds = ref(0);
const pollStatusLog = ref('');
const portalMutations = ref<any[]>([]);
let pollTimeoutId: any = null;
let countdownIntervalId: any = null;
let pollCount = 0;

const getRandomIntervalMs = () => {
  // Random delay between 30s (30,000ms) and 60s (60,000ms)
  return Math.floor(Math.random() * (60000 - 30000 + 1)) + 30000;
};

const scheduleNextPoll = () => {
  if (pollTimeoutId) clearTimeout(pollTimeoutId);
  if (countdownIntervalId) clearInterval(countdownIntervalId);

  if (!isAutoPolling.value || !currentPortalPayment.value || isPortalPaid.value) return;

  const delayMs = getRandomIntervalMs();
  countdownSeconds.value = Math.round(delayMs / 1000);

  // 1-second countdown ticker
  countdownIntervalId = setInterval(() => {
    if (countdownSeconds.value > 0) {
      countdownSeconds.value--;
    } else {
      clearInterval(countdownIntervalId);
    }
  }, 1000);

  pollTimeoutId = setTimeout(async () => {
    if (!isAutoPolling.value || !currentPortalPayment.value || isPortalPaid.value) {
      stopAutoPolling();
      return;
    }

    pollCount++;
    pollStatusLog.value = `Memeriksa mutasi GoBiz ke-${pollCount}...`;

    try {
      const res: any = await $fetch('/api/portal/qris/check', {
        method: 'POST',
        headers: getHeaders(),
        body: {
          amountToPay: currentPortalPayment.value.amountToPay,
          token: config.portalCookieToken,
          email: config.portalEmail,
          password: config.portalPassword,
        },
      });

      if (res && res.paid) {
        isPortalPaid.value = true;
        pollStatusLog.value = `✅ PEMBAYARAN DITERIMA! Nominal Rp ${Number(res.amountToPay).toLocaleString('id-ID')} masuk pada ${new Date(res.paidAt).toLocaleTimeString('id-ID')}`;
        stopAutoPolling();
        loadPortalMutations();
      } else {
        pollStatusLog.value = `Menunggu pembayaran (${pollCount}x dicek). Belum ada mutasi untuk Rp ${Number(currentPortalPayment.value.amountToPay).toLocaleString('id-ID')}.`;
        scheduleNextPoll();
      }
    } catch (err: any) {
      pollStatusLog.value = `⚠️ Poller info: ${err.data?.message || err.message}`;
      scheduleNextPoll();
    }
  }, delayMs);
};

const startAutoPolling = () => {
  stopAutoPolling();
  if (!isAutoPolling.value || !currentPortalPayment.value || isPortalPaid.value) return;

  pollCount = 0;
  pollStatusLog.value = `Auto-polling aman aktif (Random 30-60s agar bebas rate-limit)...`;
  scheduleNextPoll();
};

const stopAutoPolling = () => {
  if (pollTimeoutId) {
    clearTimeout(pollTimeoutId);
    pollTimeoutId = null;
  }
  if (countdownIntervalId) {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null;
  }
  countdownSeconds.value = 0;
};

const loadPortalMutations = async () => {
  try {
    const list: any = await $fetch('/api/portal/transactions', {
      headers: getHeaders(),
    });
    if (Array.isArray(list)) {
      portalMutations.value = list;
    }
  } catch (err: any) {
    console.warn('Gagal memuat mutasi:', err);
  }
};

const generatePortalQris = async () => {
  stopAutoPolling();
  isPortalPaid.value = false;
  pollStatusLog.value = '';

  const res = await executeApi('Generate Portal Dynamic QRIS', () =>
    $fetch('/api/portal/qris/create', {
      method: 'POST',
      body: {
        amount: portalForm.amount,
        fee: portalForm.fee,
        uniqueCodeDigits: portalForm.uniqueCodeDigits,
        trxId: portalForm.trxId,
        staticQris: config.staticQris,
      },
    }),
  );
  if (res) {
    currentPortalPayment.value = res;
    if (isAutoPolling.value) {
      startAutoPolling();
    }
  }
};

const checkPortalSettlement = async () => {
  if (!currentPortalPayment.value) return;

  const res = await executeApi('Cek Mutasi Masuk GoBiz Portal', () =>
    $fetch('/api/portal/qris/check', {
      method: 'POST',
      headers: getHeaders(),
      body: {
        amountToPay: currentPortalPayment.value.amountToPay,
        token: config.portalCookieToken,
        email: config.portalEmail,
        password: config.portalPassword,
      },
    }),
  );

  if (res && res.paid) {
    isPortalPaid.value = true;
    pollStatusLog.value = `✅ PEMBAYARAN DITERIMA! Nominal Rp ${Number(res.amountToPay).toLocaleString('id-ID')} masuk pada ${new Date(res.paidAt).toLocaleTimeString('id-ID')}`;
    stopAutoPolling();
    loadPortalMutations();
  } else {
    pollStatusLog.value = `Belum ada mutasi masuk untuk nominal Rp ${Number(currentPortalPayment.value.amountToPay).toLocaleString('id-ID')}`;
  }
};

const createOpenApiPayment = async () => {
  const res = await executeApi('Create Open API QRIS', () =>
    $fetch('/api/payments/create', {
      method: 'POST',
      headers: getHeaders(),
      body: {
        outlet_id: openApiForm.outlet_id,
        transaction_details: {
          order_id: openApiForm.order_id,
          gross_amount: openApiForm.amount,
          currency: 'IDR',
        },
      },
    }),
  );
  if (res) {
    lastCreatedPayment.value = res;
  }
};

const loadLinkedOutlets = async () => {
  const res = await executeApi('Get Linked Outlets', () =>
    $fetch('/api/outlets', {
      headers: getHeaders(),
    }),
  );
  if (res && res.outlets) {
    outletsList.value = res.outlets;
  }
};

watch(isAutoPolling, (val) => {
  if (val) {
    startAutoPolling();
  } else {
    stopAutoPolling();
  }
});

onUnmounted(() => {
  stopAutoPolling();
});
</script>
