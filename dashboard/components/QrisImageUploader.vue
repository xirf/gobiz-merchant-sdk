<template>
  <div class="space-y-3">
    <!-- Drag & Drop Zone -->
    <div
      class="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
      :class="isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/40'"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
      @paste="handlePaste"
      tabindex="0"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileSelect"
      />

      <div class="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl shadow-sm">
        📷
      </div>

      <div class="space-y-0.5 text-xs">
        <p class="font-bold text-foreground">
          {{ scanning ? 'Sedang Membaca QR Code...' : 'Upload / Drag & Drop Gambar QRIS Toko' }}
        </p>
        <p class="text-[11px] text-muted-foreground">
          Bisa juga langsung tekan <kbd class="px-1 py-0.5 text-[10px] rounded bg-muted border font-mono">Ctrl + V</kbd> untuk paste screenshot
        </p>
      </div>
    </div>

    <!-- Error message if decode fails -->
    <div v-if="error" class="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
      <span>⚠️</span>
      <span>{{ error }}</span>
    </div>

    <!-- Success Info Badge if Decoded -->
    <div v-if="decodedResult" class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1.5 animate-in fade-in duration-200">
      <div class="flex items-center justify-between">
        <span class="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
          ✅ QRIS Berhasil Dibaca dari Gambar!
        </span>
        <span class="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
          {{ decodedResult.length }} Chars
        </span>
      </div>
      <p class="font-mono text-[10px] break-all select-all text-slate-700 dark:text-slate-300 bg-background/80 p-2 rounded border">
        {{ decodedResult }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import jsQR from 'jsqr';

const emit = defineEmits<{
  (e: 'decoded', qrisString: string): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const scanning = ref(false);
const error = ref<string | null>(null);
const decodedResult = ref<string | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    processImageFile(file);
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) {
    processImageFile(file);
  }
};

const handlePaste = (event: ClipboardEvent) => {
  const items = event.clipboardData?.items;
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image/')) {
      const file = items[i].getAsFile();
      if (file) {
        processImageFile(file);
        break;
      }
    }
  }
};

const processImageFile = (file: File) => {
  error.value = null;
  scanning.value = true;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          error.value = 'Tidak dapat membuat canvas untuk membaca gambar.';
          scanning.value = false;
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (qrCode && qrCode.data) {
          const raw = qrCode.data.trim();
          if (raw.startsWith('000201')) {
            decodedResult.value = raw;
            emit('decoded', raw);
          } else {
            error.value = `Gambar terdeteksi sebagai QR Code biasa, bukan format QRIS (harus diawali '000201'). Teks: ${raw.slice(0, 30)}...`;
          }
        } else {
          error.value = 'QR Code tidak ditemukan dalam gambar. Pastikan gambar QRIS jelas dan tidak blur.';
        }
      } catch (err: any) {
        error.value = `Gagal memproses gambar: ${err.message}`;
      } finally {
        scanning.value = false;
      }
    };
    img.onerror = () => {
      error.value = 'File gambar rusak atau format tidak didukung.';
      scanning.value = false;
    };
    img.src = e.target?.result as string;
  };
  reader.onerror = () => {
    error.value = 'Gagal membaca file.';
    scanning.value = false;
  };
  reader.readAsDataURL(file);
};
</script>
