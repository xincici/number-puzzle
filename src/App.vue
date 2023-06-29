<template>
  <MainGame />
</template>

<script setup>
import MainGame from './components/MainGame.vue';
</script>

<style lang="scss">
html, body, #app {
  height: 100vh;
  overflow-y: hidden;
  margin: 0;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
</style>
