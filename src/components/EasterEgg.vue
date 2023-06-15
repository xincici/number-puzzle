<template>
  <span cursor-pointer @click.stop="onClick">🍔</span>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { MIN_DIFFICULTY, MAX_DIFFICULTY } from '../utils/difficulty';

const emit = defineEmits(['onScoreReset']);

const max = 5;
const clicked = ref(0);
const recordsPrefix = '__number_puzzle__';

function onClick() {
  clicked.value++;
  if (clicked.value === max) {
    removeRecords();
    emit('onScoreReset');
  }
}

function removeRecords() {
  for (let i = MIN_DIFFICULTY; i <= MAX_DIFFICULTY; i++) {
    localStorage.removeItem(`${recordsPrefix}${i}`);
  }
}

function onBodyClick() {
  clicked.value = 0;
}

onMounted(() => {
  document.body.addEventListener('click', onBodyClick);
});

onUnmounted(() => {
  document.body.removeEventListener('click', onBodyClick);
});

</script>

