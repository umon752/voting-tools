<script setup lang="ts">
import { computed } from 'vue';
import type { Poll } from '../types';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps<{
  poll: Poll,
  options?: any
}>();

const chartData = computed(() => {
  return {
    labels: props.poll.candidates.map(c => c.name),
    datasets: [
      {
        label: 'Votes',
        backgroundColor: '#6366f1',
        data: props.poll.candidates.map(c => c.votes),
        borderRadius: 8,
      }
    ]
  };
});

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(255, 255, 255, 0.1)' },
      ticks: { color: '#94a3b8' }
    },
    x: {
      grid: { display: false },
      ticks: { color: '#f8fafc', font: { weight: 'bold' } }
    }
  }
};

const chartOptions = computed(() => {
  return { ...defaultOptions, ...props.options };
});

</script>

<template>
  <div class="h-[200px] w-full">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
