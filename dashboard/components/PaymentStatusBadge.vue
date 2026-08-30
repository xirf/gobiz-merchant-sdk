<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider"
    :class="badgeClass"
  >
    <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="dotClass"></span>
    {{ state || 'UNKNOWN' }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  state?: string;
}>();

const badgeClass = computed(() => {
  switch (props.state) {
    case 'PAID':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
    case 'CREATED':
    case 'PAYMENT_METHOD_CHOSEN':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800';
    case 'AUTHORIZED':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800';
    case 'CANCELED':
    case 'TIMEOUTED':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
  }
});

const dotClass = computed(() => {
  switch (props.state) {
    case 'PAID':
      return 'bg-emerald-500';
    case 'CREATED':
    case 'PAYMENT_METHOD_CHOSEN':
      return 'bg-blue-500 animate-pulse';
    case 'AUTHORIZED':
      return 'bg-amber-500';
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
      return 'bg-purple-500';
    case 'CANCELED':
    case 'TIMEOUTED':
      return 'bg-rose-500';
    default:
      return 'bg-slate-400';
  }
});
</script>
