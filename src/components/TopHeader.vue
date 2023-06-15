<template>
  <div class="header-wrapper">
    <span class="item-wrapper">
      <HelpDialog />
    </span>
    <span class="item-wrapper" @click="audioPlay = !audioPlay">
      <i i-carbon-pause-outline v-if="audioPlay" />
      <i i-carbon-play-outline v-else />
    </span>
    <span class="title">{{ i18n('gameTitle') }}</span>
    <span class="item-wrapper" @click="toggleTheme">
      <i i-carbon-moon v-if="isDark" />
      <i i-carbon-sun v-else />
    </span>
    <span class="item-wrapper" @click="toggleLanguage">
      <i i-carbon-ibm-watson-language-translator />
    </span>
    <audio :src="audio" ref="audioRef" loop="true"></audio>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import HelpDialog from './HelpDialog.vue';

import audio from '../assets/yzcw.mp3';
import { toggle as toggleLanguage } from '../plugins/i18n';
import { isDark, toggle as toggleTheme } from '../utils/theme';

const audioRef = ref(null);
const audioPlay = ref(false);

onMounted(() => {
  watch(audioPlay, val => {
    if (val) audioRef.value.play();
    else audioRef.value.pause();
  });
});
</script>

<style scoped lang="scss">
.header-wrapper {
  max-width: 600px;
  margin: 0 auto;
  padding: 10px 8px;
  display: flex;
  align-items: center;
  .title {
    flex: 1;
    font-size: 18px;
    font-weight: bold;
    text-align: center;
  }
  .item-wrapper {
    flex-grow: 0;
    cursor: pointer;
    margin: 0 8px;
    font-size: 20px;
  }
}
</style>
