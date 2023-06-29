<template>
  <div class="wrapper" :class="theme">
    <TopHeader />
    <div class="score-area">
      {{ i18n('bestScore') }}: {{ bestScore || '--' }} <EasterEgg @onScoreReset="onScoreReset" /> {{ i18n('availableClicks') }}: {{ clickCount }}
    </div>
    <div class="opt-area">
      <button @click="changeDifficulty(-1)" class="opt-icon" :class="{disable: difficulty === MIN_DIFFICULTY}">
        <i i-carbon-subtract-alt />
      </button>
      {{ difficulty }}
      <button @click="changeDifficulty(1)" class="opt-icon" :class="{disable: difficulty === MAX_DIFFICULTY}">
        <i i-carbon-add-alt />
      </button>
      <button @click="initGame" class="game-icon">{{ i18n('start') }}</button>
    </div>
    <div class="game-area" :class="`cell-${difficulty}`">
      <div
        class="cell"
        v-for="(item, idx) in gameData.list"
        :key="item"
        @click="onCellClick(idx)"
      >
        <div
          class="inner"
          :class="{
            hide: item === maxNumber && !gameData.mask[idx] && !showWin,
            even: item % 2 === 0,
            odd: item % 2 !== 0,
            zoom: gameResult >= WIN && gameData.zoom[idx],
            shake: gameData.shake === idx,
          }"
        >
          <div class="mask" v-if="gameData.mask[idx]"></div>
          {{ item }}
        </div>
      </div>
      <div v-if="showWin" class="win">
        <span>🎉🎉 {{ i18n('tipWin') }} 🎉🎉</span>
        <span v-if="gameResult === NB">{{ i18n('newBest') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, watchEffect } from 'vue';

import EasterEgg from './EasterEgg.vue';
import TopHeader from './TopHeader.vue';
import { theme } from '../utils/theme';
import confetti from '../utils/confetti';
import { difficulty, changeDifficulty, MIN_DIFFICULTY, MAX_DIFFICULTY } from '../utils/difficulty';

const [GAMING, WIN, NB] = [0, 1, 2];

const clickCount = ref(0);
const lastRandom = ref(0);
const gameResult = ref(GAMING);
const showWin = ref(false);
const storageKey = computed(() => `__number_puzzle__${difficulty.value}`);
const maxNumber = computed(() => difficulty.value * difficulty.value);
const randomCount = computed(() => 4 << difficulty.value);
const animateTime = computed(() => ~~(800 / maxNumber.value));
const neighbours = [[-1, 0], [0, -1], [0, 1], [1, 0]]; // order matters
const bestScore = ref(localStorage.getItem(storageKey.value));

const initData = len => new Array(len).fill(1).map((_, idx) => idx + 1);
const sleep = ms => new Promise(res => setTimeout(res, ms));

const gameData = reactive({
  list: [],
  mask: [],
  zoom: [],
  shake: -1,
});
const gameArr = computed(() => {
  const len = difficulty.value;
  const res = new Array(len);
  for (let i = 0; i < len; i++) {
    res[i] = [...gameData.list.slice(i * len, i * len + len)];
  }
  return res;
});
let maskTimer = null;
let zoomTimer = null;
let winTimer = null;

watchEffect(() => {
  bestScore.value = localStorage.getItem(storageKey.value);
});
watch(difficulty, initGame, { immediate: true });
watch(gameResult, val => {
  if (val === WIN) {
    updateBestScore();
    toggleZoom(0);
  }
});
watch(showWin, val => {
  if (val) confetti();
});

function initGame() {
  gameData.list = initData(maxNumber.value);
  gameData.mask = new Array(maxNumber.value).fill(1);
  gameData.zoom = [];
  randomOperations();
  gameResult.value = GAMING;
  showWin.value = false;
  clickCount.value = 0;
  lastRandom.value = 0;
  if (maskTimer) {
    clearTimeout(maskTimer);
    maskTimer = null;
  }
  if (zoomTimer) {
    clearTimeout(zoomTimer);
    zoomTimer = null;
  }
  if (winTimer) {
    clearTimeout(winTimer);
    winTimer = null;
  }
  toggleMask(0);
}
function swapTwoIdx(idx1, idx2) {
  const tmp = gameData.list[idx1];
  gameData.list[idx1] = gameData.list[idx2];
  gameData.list[idx2] = tmp;
}

function getRandom() {
  while (true) {
    const newIdx = ~~(Math.random() * 4)
    if (lastRandom.value + newIdx !== 3) {
      lastRandom.value = newIdx;
      break;
    }
  }
  return neighbours[lastRandom.value];
}
function randomOperations() {
  const len = difficulty.value;
  let lastRow = len - 1;
  let lastCol = len - 1;
  for (let i = 0; i < randomCount.value; i++) {
    const [dRow, dCol] = getRandom();
    const newRow = lastRow + dRow;
    const newCol = lastCol + dCol;
    if (newRow < 0 || newRow >= len || newCol < 0 || newCol >= len) continue;
    swapTwoIdx(lastRow * len + lastCol, newRow * len + newCol);
    lastRow = newRow;
    lastCol = newCol;
  }
}
function toggleMask(idx) {
  gameData.mask[idx] = 0;
  if (idx + 1 < maxNumber.value) {
    maskTimer = setTimeout(() => {
      toggleMask(idx + 1);
    }, animateTime.value);
  } else {
    checkResult();
  }
}
function toggleZoom(idx) {
  gameData.zoom[idx] = 1;
  if (idx + 1 < maxNumber.value) {
    zoomTimer = setTimeout(() => {
      toggleZoom(idx + 1);
    }, animateTime.value);
  } else {
    winTimer = setTimeout(() => {
      showWin.value = true;
    }, 300);
  }
}
function onScoreReset() {
  bestScore.value = null;
}
function updateBestScore() {
  const score = clickCount.value;
  if (!bestScore.value || score < bestScore.value) {
    localStorage.setItem(storageKey.value, score);
    bestScore.value = score;
    gameResult.value = NB;
  }
}
function onCellClick(idx) {
  if (gameResult.value >= WIN) return;
  const len = difficulty.value;
  const lastRow = ~~(idx / len);
  const lastCol = idx % len;
  let operate = false;
  neighbours.forEach(diff => {
    const newRow = lastRow + diff[0];
    const newCol = lastCol + diff[1];
    if (newRow < 0 || newRow >= len || newCol < 0 || newCol >= len) return;
    const newIdx = newRow * len + newCol;
    if (gameData.list[newIdx] !== maxNumber.value) return;
    operate = true;
    swapTwoIdx(idx, newIdx);
    clickCount.value++;
  });
  if (operate) checkResult();
  else shakeCell(idx);
}
function shakeCell(idx) {
  gameData.shake = idx;
  setTimeout(() => {
    gameData.shake = -1;
  }, 100);
}
function checkResult() {
  for (let i = 0; i < maxNumber.value; i++) {
    if (gameData.list[i] !== i + 1) return;
  }
  gameResult.value = WIN;
}
</script>

<style scoped lang="scss">
@keyframes shake {
  from {
    transform: translateX(-12%);
  }
  to {
    transform: translateX(12%);
  }
}
@keyframes zoom {
  from {
    transform: scale(1);
  }
  50% {
    transform: scale(1.25);
  }
  to {
    transform: scale(1);
  }
}

.wrapper {
  width: 100vw;
  min-width: 360px;
  min-height: 100vh;
  box-sizing: border-box;
  color: #2c3e50;
  &.dark {
    background: #444;
    color: #eee;
    .header-wrapper {
      border-bottom: 1px solid #333;
    }
    .game-area {
      .win {
        background-color: #333;
      }
      .cell .inner {
        &.even {
          background: rgba(210, 210, 210, 0.90);
        }
        &.odd {
          background: rgba(125, 125, 125, 0.90);
        }
      }
    }
  }
  .header-wrapper {
    border-bottom: 1px solid #eee;
  }
  .score-area {
    margin: 50px 0 15px;
  }
  .opt-icon,.game-icon {
    cursor: pointer;
    display: inline-block;
    border: 1px solid #e1e1e1;
    padding: 2px;
    width: 25px;
    height: 30px;
    margin: 0 4px;
    color: #222;
    text-align: center;
    font-style: normal;
    font-weight: bold;
    font-size: 15px;
    border-radius: 6px;
    &.disable {
      color: #e1e1e1;
      cursor: not-allowed;
    }
  }
  .game-icon {
    margin-left: 10px;
    width: auto;
    padding: 5px 8px;
    font-size: 14px;
    background: rgba(60, 160, 60, 0.9);
    color: #fff;
    border: 0 none;
    &:disabled {
      background-color: #aaa;
      cursor: not-allowed;
    }
  }
  .opt-area {
    margin: 15px 0;
  }
  .game-area {
    display: inline-block;
    position: relative;
    margin: 60px auto 30px;
    padding: 15px;
    .win {
      background-color: #f1f1f1;
      position: absolute;
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
      opacity: 0.95;
      font-weight: bold;
      color: #11aa11;
      font-size: 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    &.cell-3 {
      width: 195px;
      .cell {
        width: 65px;
        height: 65px;
      }
    }
    &.cell-4 {
      width: 240px;
      .cell {
        width: 60px;
        height: 60px;
      }
    }
    &.cell-5 {
      width: 275px;
      .cell {
        width: 55px;
        height: 55px;
      }
    }
    &.cell-6 {
      width: 300px;
      .cell {
        width: 50px;
        height: 50px;
      }
    }
    .cell {
      display: inline-block;
      position: relative;
      box-sizing: border-box;
      padding: 3px;
      .mask {
        width: 100%;
        height: 100%;
        position: absolute;
        z-index: 1;
        background: #ccc;
        border-radius: 2px;
      }
      .inner {
        cursor: pointer;
        display: flex;
        position: relative;
        width: 100%;
        height: 100%;
        align-items: center;
        justify-content: center;
        border: 1px solid #e1e1e1;
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
        color: #222;
        opacity: 1;
        &.hide {
          visibility: hidden;
        }
        &.shake {
          animation: 0.025s ease-in-out 0s infinite shake;
        }
        &.zoom {
          animation: 0.08s ease-in-out 0s zoom;
        }
        &.even {
          background-color: #e5e5e5;
        }
        &.odd {
          background-color: #ddffdd;
        }
      }
    }
  }
}
@media only screen and (min-width: 320px) and (max-width: 720px) {
  * {
    user-select: none;
  }
}
</style>
