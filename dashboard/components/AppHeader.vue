<template>
  <header class="border-b bg-card text-card-foreground shadow-sm sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo & Title -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-500/20">
            GB
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-base font-bold tracking-tight">GoBiz Developer Dashboard</h1>
              <span
                class="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase"
                :class="config.isProductionMode ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'"
              >
                {{ config.isProductionMode ? 'PRODUCTION' : 'SANDBOX' }}
              </span>
            </div>
            <p class="text-xs text-muted-foreground">GoTo Financial / Gojek Open API Playground</p>
          </div>
        </div>

        <!-- Connection & Config Bar -->
        <div class="flex items-center gap-3">
          <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 text-xs border">
            <span class="w-2 h-2 rounded-full" :class="serverInfo?.tokenPreview && !serverInfo?.authError ? 'bg-emerald-500' : 'bg-amber-500'"></span>
            <span class="text-muted-foreground">Outlet:</span>
            <span class="font-mono font-medium">{{ config.outletId }}</span>
            <span class="text-muted-foreground ml-2">GoAuth:</span>
            <span class="font-mono text-[11px] text-primary">{{ serverInfo?.tokenPreview || (loading ? 'Authenticating...' : 'Disconnected') }}</span>
          </div>

          <button
            type="button"
            @click="$emit('open-config')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border bg-background hover:bg-muted transition-colors shadow-sm"
          >
            ⚙️ GoAuth Credentials
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  config: any;
  serverInfo: any;
  loading: boolean;
}>();

defineEmits(['open-config']);
</script>
