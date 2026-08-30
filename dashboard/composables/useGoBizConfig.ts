import { ref, reactive, watch, onMounted } from 'vue';

export interface GoBizConfigState {
  integrationMode: 'openapi' | 'portal';
  portalAuthMethod: 'cookie' | 'password';
  clientId: string;
  clientSecret: string;
  outletId: string;
  portalEmail: string;
  portalPassword: string;
  portalCookieToken: string;
  staticQris: string;
  isProductionMode: boolean;
  isMockMode: boolean;
}

const DEFAULT_SAMPLE_QRIS =
  '00020101021126610014COM.GO-JEK.WWW01189360091430438058080210G7641517890303UMI51440014ID.CO.QRIS.WWW0215ID10190450190010303UMI5204581253033605802ID5907GoBiz6015Jakarta61051022062070703A0163045E1B';

const DEFAULT_CONFIG: GoBizConfigState = {
  integrationMode: 'portal',
  portalAuthMethod: 'cookie',
  clientId: 'demo_client_id_gobiz',
  clientSecret: 'demo_client_secret_gobiz',
  outletId: 'G000012345',
  portalEmail: '',
  portalPassword: '',
  portalCookieToken: '',
  staticQris: DEFAULT_SAMPLE_QRIS,
  isProductionMode: false,
  isMockMode: true,
};

export const useGoBizConfig = () => {
  const config = reactive<GoBizConfigState>({ ...DEFAULT_CONFIG });
  const serverInfo = ref<any>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const loadFromStorage = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gobiz_dashboard_config_v2');
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
      localStorage.setItem('gobiz_dashboard_config_v2', JSON.stringify(config));
    }
  };

  const resetToDefault = () => {
    Object.assign(config, DEFAULT_CONFIG);
    saveToStorage();
    fetchServerInfo();
  };

  const getHeaders = () => {
    return {
      'x-gobiz-client-id': config.clientId,
      'x-gobiz-client-secret': config.clientSecret,
      'x-gobiz-outlet-id': config.outletId,
      'x-gobiz-portal-token': config.portalCookieToken,
      'x-gobiz-portal-email': config.portalEmail,
      'x-gobiz-portal-password': config.portalPassword,
      'x-gobiz-is-production': config.isProductionMode ? 'true' : 'false',
      'x-gobiz-mock-mode': config.isMockMode ? 'true' : 'false',
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
      error.value = err.data?.message || err.message || 'Failed to connect to GoBiz GoAuth';
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
