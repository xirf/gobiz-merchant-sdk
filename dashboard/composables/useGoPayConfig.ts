import { ref, reactive, watch, onMounted } from 'vue';

export interface GoPayConfigState {
  goid: string;
  clientId: string;
  clientSecret: string;
  isProductionMode: boolean;
}

const DEFAULT_CONFIG: GoPayConfigState = {
  goid: '8583067438',
  clientId: '1223619925',
  clientSecret: '6vkhVP8c',
  isProductionMode: false,
};

export const useGoPayConfig = () => {
  const config = reactive<GoPayConfigState>({ ...DEFAULT_CONFIG });
  const serverInfo = ref<any>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const loadFromStorage = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gopay_dashboard_config');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          Object.assign(config, parsed);
        } catch {
          // ignore
        }
      }
    }
  };

  const saveToStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gopay_dashboard_config', JSON.stringify(config));
    }
  };

  const resetToDefault = () => {
    Object.assign(config, DEFAULT_CONFIG);
    saveToStorage();
    fetchServerInfo();
  };

  const getHeaders = () => {
    return {
      'x-gopay-goid': config.goid,
      'x-gopay-client-id': config.clientId,
      'x-gopay-client-secret': config.clientSecret,
      'x-gopay-is-production': config.isProductionMode ? 'true' : 'false',
    };
  };

  const fetchServerInfo = async () => {
    loading.value = true;
    error.value = null;
    try {
      const res: any = await $fetch('/api/config/info', {
        headers: getHeaders(),
      });
      serverInfo.value = res;
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to connect to GoPay API';
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    loadFromStorage();
    fetchServerInfo();
  });

  watch(config, () => {
    saveToStorage();
  }, { deep: true });

  return {
    config,
    serverInfo,
    loading,
    error,
    getHeaders,
    fetchServerInfo,
    resetToDefault,
  };
};
