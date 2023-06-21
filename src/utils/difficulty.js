import { ref, watchEffect } from 'vue';

const difficultyStorageKey = '__number_puzzle__difficulty';
const INIT_DIFFICULTY = 4;
export const MIN_DIFFICULTY = 3;
export const MAX_DIFFICULTY = 6;

export const difficulty = ref(+localStorage.getItem(difficultyStorageKey) || INIT_DIFFICULTY);

watchEffect(() => {
  localStorage.setItem(difficultyStorageKey, difficulty.value);
});

export function changeDifficulty(diff) {
  if (difficulty.value === MIN_DIFFICULTY && diff < 0 || difficulty.value === MAX_DIFFICULTY && diff > 0) return;
  difficulty.value += diff;
}
