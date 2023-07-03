<template>
  <span cursor-pointer @click.stop="toggle">
    <i i-mdi-power-socket-fr v-if="enableRocker" />
    <i i-mdi-cursor-move v-else />
  </span>
</template>

<script setup>

import { enableRocker, toggle } from '../utils/rocker';

</script>

