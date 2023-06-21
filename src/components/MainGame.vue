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
            hide: item === maxNumber,
            even: item % 2 === 0,
            odd: item % 2 !== 0,
          }"
        >{{ item }}</div>
      </div>
      <div v-if="gameResult >= WIN" class="win">
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

const BIG_VAL = 3;
const [GAMING, WIN, NB] = [0, 1, 2];
const [TINY, MINI, SMALL, MIDDLE, LARGE] = ['tiny', 'mini', 'small', 'middle', 'large'];

const neighbours = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const clickCount = ref(0);
const gameResult = ref(GAMING);
const storageKey = computed(() => `__number_puzzle__${difficulty.value}`);
const maxNumber = computed(() => difficulty.value * difficulty.value);
const bestScore = ref(localStorage.getItem(storageKey.value));

const randomData = len => new Array(len * len).fill(1).map((v, idx) => idx + 1).sort(() => Math.random() - 0.5);
const sleep = ms => new Promise(res => setTimeout(res, ms));

const gameData = reactive({
  list: [],
  mask: [],
});
const gameArr = computed(() => {
  const len = difficulty.value;
  const res = new Array(len);
  for (let i = 0; i < len; i++) {
    res[i] = [...gameData.list.slice(i * len, i * len + len)];
  }
  return res;
});
let animationFrameId = null;

watchEffect(() => {
  bestScore.value = localStorage.getItem(storageKey.value);
});
watch(difficulty, initGame, { immediate: true });
watch(gameResult, val => {
  if (val === WIN) {
    updateBestScore();
    confetti();
  }
});

function initGame() {
  gameData.list = randomData(difficulty.value);
  gameData.mask = randomData(difficulty.value);
  gameResult.value = GAMING;
  clickCount.value = 0;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}
function toggleMask(idx) {
  const row = ~~(idx / difficulty.value);
  const col = idx % difficulty.value;
  gameData.mask[row][col] = 1;
  if (idx + 1 < difficulty.value * difficulty.value) {
    animationFrameId = requestAnimationFrame(() => {
      toggleMask(idx + 1);
    });
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
  const len = difficulty.value;
  const row = ~~(idx / len);
  const col = idx % len;
  neighbours.forEach(item => {
    const newRow = row + item[0];
    const newCol = col + item[1];
    if (newRow < 0 || newRow >= len || newCol < 0 || newCol >= len) return;
    if (gameArr.value[newRow][newCol] !== maxNumber.value) return;
    const newIdx = newRow * len + newCol;
    gameData.list[newIdx] = gameData.list[idx];
    gameData.list[idx] = maxNumber.value;
    clickCount.value++;
  });
  checkResult();
}
function checkResult() {
  const len = difficulty.value;
  for (let i = 0; i < len * len; i++) {
    if (gameData.list[i] !== i + 1) return;
  }
  gameResult.value = WIN;
}
</script>

<style scoped lang="scss">
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
  button,button:disabled {
    touch-action: manipulation;
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
    .win,.automask {
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
    .automask {
      background: rgba(255, 255, 255, 0);
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
}
</style>
