import { ref, computed, watchEffect } from 'vue';

const STORAGE_KEY = '__number_puzzle__theme';
const DARK = 'dark';
const LIGHT = 'light';

const themeColor = {
  [DARK]: '#444',
  [LIGHT]: '#fff'
};

export const theme = ref(localStorage.getItem(STORAGE_KEY) || LIGHT);

export const isDark = computed(() => {
  return theme.value === DARK;
});
export const toggle = () => {
  theme.value = theme.value === DARK ? LIGHT : DARK;
};

watchEffect(() => {
  localStorage.setItem(STORAGE_KEY, theme.value);
  document.querySelector('meta[name="theme-color"]').setAttribute('content', themeColor[theme.value]);
});
