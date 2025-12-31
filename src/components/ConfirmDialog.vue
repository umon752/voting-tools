<script setup lang="ts">
import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid';

const props = defineProps<{
  show: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<template>
  <transition name="fade">
    <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div class="glass p-6 rounded-2xl max-w-md w-full animate-fade-in border border-white/10 shadow-2xl">
        
        <!-- Icon -->
        <div class="w-12 h-12 bg-yellow-500/20 rounded-full mx-auto flex items-center justify-center mb-4 text-yellow-400">
          <ExclamationTriangleIcon class="w-6 h-6" />
        </div>

        <!-- Title -->
        <h3 class="text-xl font-bold text-white text-center mb-2">
          {{ title }}
        </h3>

        <!-- Message -->
        <p class="text-slate-300 text-center mb-6">
          {{ message }}
        </p>

        <!-- Actions -->
        <div class="flex gap-3">
          <button 
            @click="handleCancel"
            class="flex-1 px-4 py-2 rounded-lg font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all duration-200 cursor-pointer"
          >
            {{ cancelText || 'Cancel' }}
          </button>
          <button 
            @click="handleConfirm"
            class="flex-1 px-4 py-2 rounded-lg font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all duration-200 cursor-pointer"
          >
            {{ confirmText || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
