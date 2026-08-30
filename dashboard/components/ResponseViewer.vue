<template>
  <div v-if="data || error" class="mt-4 rounded-lg border bg-slate-950 text-slate-50 font-mono text-xs overflow-hidden shadow-sm">
    <div class="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
      <div class="flex items-center gap-2">
        <span
          class="px-2 py-0.5 rounded text-[10px] font-bold"
          :class="error ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'"
        >
          {{ error ? 'ERROR ' + (error.statusCode || error.status || 500) : 'SUCCESS 200 OK' }}
        </span>
        <span class="text-slate-400 text-[11px]">{{ title || 'API Response' }}</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="copyToClipboard"
          class="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          {{ copied ? '✓ Copied' : 'Copy JSON' }}
        </button>
      </div>
    </div>
    <div class="p-3 max-h-80 overflow-y-auto">
      <pre class="leading-relaxed whitespace-pre-wrap word-break">{{ formattedContent }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  data?: any;
  error?: any;
  title?: string;
}>();

const copied = ref(false);

const formattedContent = computed(() => {
  if (props.error) {
    return JSON.stringify(props.error.data || props.error, null, 2);
  }
  if (typeof props.data === 'string') {
    try {
      return JSON.stringify(JSON.parse(props.data), null, 2);
    } catch {
      return props.data;
    }
  }
  return JSON.stringify(props.data, null, 2);
});

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(formattedContent.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch (err) {
    console.error('Failed to copy', err);
  }
};
</script>
