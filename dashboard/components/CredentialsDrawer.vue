<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-card text-card-foreground border rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
      <div class="px-6 py-4 border-b flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold">GoBiz Integration Settings</h2>
          <p class="text-xs text-muted-foreground">Pilih metode integrasi GoBiz (Portal Toko vs Official Open API)</p>
        </div>
        <button
          type="button"
          @click="$emit('close')"
          class="text-muted-foreground hover:text-foreground text-xl p-1"
        >
          ✕
        </button>
      </div>

      <div class="p-6 space-y-5 text-sm max-h-[75vh] overflow-y-auto">
        <!-- Mock Simulator Switch -->
        <div class="p-3 bg-muted/40 border rounded-xl flex items-center justify-between">
          <div>
            <span class="text-xs font-bold block">Sandbox Simulation Mode</span>
            <span class="text-[11px] text-muted-foreground">Simulasi API tanpa koneksi live upstream</span>
          </div>
          <input
            type="checkbox"
            v-model="config.isMockMode"
            class="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
          />
        </div>

        <!-- Mode Selector -->
        <div>
          <label class="block text-xs font-bold uppercase text-muted-foreground mb-2">Tipe Integrasi</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              @click="config.integrationMode = 'portal'"
              class="py-2.5 px-3 text-xs font-bold rounded-xl border text-left flex flex-col gap-0.5 transition-all"
              :class="config.integrationMode === 'portal' ? 'bg-emerald-600/10 border-emerald-600 text-emerald-600 dark:text-emerald-400' : 'hover:bg-muted text-muted-foreground'"
            >
              <span class="font-bold flex items-center gap-1.5">⚡ Akun Portal Toko</span>
              <span class="text-[10px] font-normal opacity-80">Pakai akun GoBiz tokomu (Cookies / Password)</span>
            </button>

            <button
              type="button"
              @click="config.integrationMode = 'openapi'"
              class="py-2.5 px-3 text-xs font-bold rounded-xl border text-left flex flex-col gap-0.5 transition-all"
              :class="config.integrationMode === 'openapi' ? 'bg-primary/10 border-primary text-primary' : 'hover:bg-muted text-muted-foreground'"
            >
              <span class="font-bold flex items-center gap-1.5">🏢 Official Open API</span>
              <span class="text-[10px] font-normal opacity-80">Client Credentials (B2B Gojek Developer)</span>
            </button>
          </div>
        </div>

        <!-- PORTAL MODE SETTINGS -->
        <div v-if="config.integrationMode === 'portal'" class="space-y-4 pt-2 border-t">
          <div>
            <label class="block text-xs font-semibold text-muted-foreground mb-1.5">Metode Login Portal</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="config.portalAuthMethod = 'cookie'"
                class="py-1.5 text-xs font-semibold rounded-lg border transition-all"
                :class="config.portalAuthMethod === 'cookie' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted text-muted-foreground'"
              >
                🍪 Cookie Access Token
              </button>
              <button
                type="button"
                @click="config.portalAuthMethod = 'password'"
                class="py-1.5 text-xs font-semibold rounded-lg border transition-all"
                :class="config.portalAuthMethod === 'password' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted text-muted-foreground'"
              >
                🔑 Email & Password
              </button>
            </div>
          </div>

          <!-- Cookie Token Input -->
          <div v-if="config.portalAuthMethod === 'cookie'" class="space-y-1">
            <label class="block text-xs font-semibold text-muted-foreground">Cookie `access_token`</label>
            <textarea
              v-model="config.portalCookieToken"
              rows="2"
              placeholder="Paste token dari F12 -> Application -> Cookies -> access_token (portal.gofoodmerchant.co.id)"
              class="w-full px-3 py-2 rounded-lg border bg-background font-mono text-xs focus:ring-2 focus:ring-primary outline-none"
            ></textarea>
            <p class="text-[11px] text-muted-foreground">💡 Lebih aman: tidak perlu menyimpan password toko di server.</p>
          </div>

          <!-- Email Password Inputs -->
          <div v-if="config.portalAuthMethod === 'password'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-muted-foreground mb-1">GoBiz Email</label>
              <input
                v-model="config.portalEmail"
                type="email"
                placeholder="email@merchant.com"
                class="w-full px-3 py-2 rounded-lg border bg-background text-xs outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-muted-foreground mb-1">Password</label>
              <input
                v-model="config.portalPassword"
                type="password"
                placeholder="password akun portal"
                class="w-full px-3 py-2 rounded-lg border bg-background text-xs outline-none"
              />
            </div>
          </div>

          <!-- Static QRIS String & Image Uploader -->
          <div class="space-y-3 pt-2 border-t">
            <div>
              <label class="block text-xs font-bold uppercase text-muted-foreground mb-1">QRIS Statis Toko</label>
              <p class="text-[11px] text-muted-foreground mb-2">
                Upload foto/gambar QRIS tokomu, atau paste string QRIS di bawah:
              </p>
              <!-- Image Uploader Component -->
              <QrisImageUploader @decoded="(str) => config.staticQris = str" />
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-muted-foreground mb-1">String QRIS (`QRIS_STRING`)</label>
              <textarea
                v-model="config.staticQris"
                rows="2"
                placeholder="00020101021126610014COM.GO-JEK.WWW..."
                class="w-full px-3 py-2 rounded-lg border bg-background font-mono text-[11px] focus:ring-2 focus:ring-primary outline-none"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- OPEN API MODE SETTINGS -->
        <div v-if="config.integrationMode === 'openapi'" class="space-y-4 pt-2 border-t">
          <div>
            <label class="block text-xs font-semibold uppercase text-muted-foreground mb-1">Target Environment</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="config.isProductionMode = false"
                class="py-1.5 text-xs font-semibold rounded-lg border transition-all"
                :class="!config.isProductionMode ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted text-muted-foreground'"
              >
                🧪 Sandbox Gateway
              </button>
              <button
                type="button"
                @click="config.isProductionMode = true"
                class="py-1.5 text-xs font-semibold rounded-lg border transition-all"
                :class="config.isProductionMode ? 'bg-rose-600 text-white border-rose-600' : 'hover:bg-muted text-muted-foreground'"
              >
                🚀 Production Gateway
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-muted-foreground mb-1">Client ID</label>
              <input
                v-model="config.clientId"
                type="text"
                class="w-full px-3 py-2 rounded-lg border bg-background font-mono text-xs outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-muted-foreground mb-1">Client Secret</label>
              <input
                v-model="config.clientSecret"
                type="password"
                class="w-full px-3 py-2 rounded-lg border bg-background font-mono text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-muted-foreground mb-1">Outlet ID</label>
            <input
              v-model="config.outletId"
              type="text"
              class="w-full px-3 py-2 rounded-lg border bg-background font-mono text-xs outline-none"
            />
          </div>
        </div>
      </div>

      <div class="px-6 py-4 bg-muted/40 border-t flex items-center justify-between">
        <button
          type="button"
          @click="$emit('reset')"
          class="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Reset Defaults
        </button>
        <div class="flex gap-2">
          <button
            type="button"
            @click="$emit('save')"
            class="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
          >
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean;
  config: any;
}>();

defineEmits(['close', 'save', 'reset']);
</script>
