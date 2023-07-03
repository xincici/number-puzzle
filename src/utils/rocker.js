import { ref, watch } from 'vue';

const storageKey = '__number_puzzle__enable_rocker'
export const enableRocker = ref(Boolean(localStorage.getItem(storageKey)));

watch(enableRocker, val => {
  if (val) localStorage.setItem(storageKey, 1);
  else localStorage.removeItem(storageKey);
});

export const toggle = function() {
  enableRocker.value = !enableRocker.value;
};

