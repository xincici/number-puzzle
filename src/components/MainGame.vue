<template>
  <div class="wrapper" :class="`${rocker? 'rocker' : '' }`">
    <TopHeader />
    <div class="score-area">
      {{ i18n('bestScore') }}: {{ bestScore === null ? '--' : bestScore }}
      <EasterEgg @onScoreReset="onScoreReset" />
      {{ i18n('availableClicks') }}: {{ clickCount }}
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
    <Transition name="rocker">
      <div v-if="rocker" class="rocker-area">
        <button
          @click="rockerClick(1, 0)"
          :disabled="rockerDisable[0]"
        >
          <i i-mdi-arrow-up-bold-circle />
        </button>
        <br />
        <button
          @click="rockerClick(0, 1)"
          :disabled="rockerDisable[1]"
        >
          <i i-mdi-arrow-left-bold-circle />
        </button>
        <button
          @click="rockerClick(0, -1)"
          :disabled="rockerDisable[2]"
        >
          <i i-mdi-arrow-right-bold-circle />
        </button>
        <br />
        <button
          @click="rockerClick(-1, 0)"
          :disabled="rockerDisable[3]"
        >
          <i i-mdi-arrow-down-bold-circle />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, watchEffect } from 'vue';

import EasterEgg from './EasterEgg.vue';
import TopHeader from './TopHeader.vue';
import confetti from '../utils/confetti';
import { rocker } from '../utils/rocker';
import { difficulty, changeDifficulty, MIN_DIFFICULTY, MAX_DIFFICULTY } from '../utils/difficulty';

const [GAMING, WIN, NB] = [0, 1, 2];

const clickCount = ref(0);
const gameResult = ref(GAMING);
const showWin = ref(false);
const storageKey = computed(() => `__number_puzzle__${difficulty.value}`);
const maxNumber = computed(() => difficulty.value * difficulty.value);
const maxIndex = ref(-1);
const randomCount = computed(() => 4 << difficulty.value);
const animateTime = computed(() => ~~(800 / maxNumber.value));
const rockerDisable = computed(() => {
  if (gameResult.value !== GAMING) return new Array(4).fill(true);
  const len = difficulty.value;
  const maxRow = ~~(maxIndex.value / len);
  const maxCol = maxIndex.value % len;
  return [
    maxRow === len - 1,
    maxCol === len - 1,
    maxCol === 0,
    maxRow === 0
  ];
});
const neighbours = [[-1, 0], [0, -1], [0, 1], [1, 0]]; // order matters
const bestScore = ref(localStorage.getItem(storageKey.value) || null);

const initData = len => new Array(len).fill(1).map((_, idx) => idx + 1);
const sleep = ms => new Promise(res => setTimeout(res, ms));

const gameData = reactive({
  list: [],
  mask: [],
  zoom: [],
  shake: -1,
});
let maskTimer = null;
let zoomTimer = null;
let winTimer = null;
let lastRandom = 0; // 最后一次随机的下标

let eventInited = false;

watchEffect(() => {
  bestScore.value = localStorage.getItem(storageKey.value) || null;
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
  clearTimer();
  gameData.list = initData(maxNumber.value);
  gameData.mask = new Array(maxNumber.value).fill(1);
  gameData.zoom = [];
  maxIndex.value = maxNumber.value - 1;
  gameResult.value = GAMING;
  showWin.value = false;
  clickCount.value = 0;
  lastRandom = 0;
  randomOperations();
  addKeyboardHandler();
  toggleMask(0);
}
function clearTimer() {
  if (maskTimer) clearTimeout(maskTimer);
  if (zoomTimer) clearTimeout(zoomTimer);
  if (winTimer) clearTimeout(winTimer);
  maskTimer = zoomTimer = winTimer = null;
}
function swapTwoIdx(idx1, idx2) {
  const tmp = gameData.list[idx1];
  gameData.list[idx1] = gameData.list[idx2];
  gameData.list[idx2] = tmp;
  maxIndex.value = idx1;
}

function getRandom() {
  while (true) {
    const newIdx = ~~(Math.random() * 4)
    if (lastRandom + newIdx !== 3) {
      lastRandom = newIdx;
      break;
    }
  }
  return neighbours[lastRandom];
}
function addKeyboardHandler() {
  if (eventInited) return;
  eventInited = true;
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowUp' && !rockerDisable.value[0]) {
      e.preventDefault();
      rockerClick(1, 0);
    } else if (e.key === 'ArrowLeft' && !rockerDisable.value[1]) {
      e.preventDefault();
      rockerClick(0, 1);
    } else if (e.key === 'ArrowRight' && !rockerDisable.value[2]) {
      e.preventDefault();
      rockerClick(0, -1);
    } else if (e.key === 'ArrowDown' && !rockerDisable.value[3]) {
      e.preventDefault();
      rockerClick(-1, 0);
    }
  });
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
    swapTwoIdx(newRow * len + newCol, lastRow * len + lastCol);
    lastRow = newRow;
    lastCol = newCol;
  }
  maxIndex.value = gameData.list.indexOf(maxNumber.value);
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
  if (bestScore.value === null || score < bestScore.value) {
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
function rockerClick(dRow, dCol) {
  const len = difficulty.value;
  const lastRow = ~~(maxIndex.value / len);
  const lastCol = maxIndex.value % len;
  const newRow = lastRow + dRow;
  const newCol = lastCol + dCol;
  if (newRow < 0 || newRow >= len || newCol < 0 || newCol >= len) return;
  const newIdx = newRow * len + newCol;
  onCellClick(newIdx);
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
  overflow-y: auto;
  background: var(--bg-color);
  color: var(--text-color);
  &.rocker {
    .score-area {
      margin-top: 70px;
    }
    .game-area {
      margin-top: 0px;
    }
  }
  .score-area {
    transition: margin-top 0.3s ease-in-out;
    margin: 100px 0 15px;
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
    transition: margin-top 0.3s ease-in-out;
    margin: 40px auto 20px;
    padding: 15px;
    .win {
      background-color: var(--mask-color);
      position: absolute;
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
      font-weight: bold;
      color: #1b1;
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
          background: var(--even-bg-color);
        }
        &.odd {
          background: var(--odd-bg-color);
        }
      }
    }
  }
  .rocker-area {
    padding-bottom: 20px;
    button {
      height: 56px;
      width: 56px;
      border: 1px solid #e1e1e1;
      border-radius: 5px;
      margin: 1px 29px;
      padding: 0;
      font-size: 24px;
      display: inline-block;
      text-align: center;
      vertical-align: middle;
      color: #222;
      i {
        margin: 0;
      }
      &:disabled {
        color: #aaa;
      }
    }
  }
  .rocker-enter-active,
  .rocker-leave-active {
    transition: all 0.3s ease-in-out;
  }
  .rocker-enter-from,
  .rocker-leave-to {
    transform: translateY(80px);
    opacity: 0;
  }
}
@media only screen and (min-width: 320px) and (max-width: 720px) {
  * {
    user-select: none;
  }
}
</style>
