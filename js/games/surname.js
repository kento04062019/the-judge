// surname.js — 名字TOP50ゲーム

import { SURNAME_DATA } from '../data.js';
import { isOpened, addOpened, getOpenedCount, resetGenre } from '../state.js';
import { playCorrect, playWrong, playNear, playDuplicate } from '../sound.js';
import { flipCard, shakeInput, confetti, flash, showFeedback } from '../animations.js';

const GENRE = 'surname';
const TOTAL = 50;
const COLS = 5;
const ROWS = 10;

// rank → name の逆引き
function rankToName(rank) {
  for (const [name, info] of Object.entries(SURNAME_DATA.top50)) {
    if (info.rank === rank) return { name, ...info };
  }
  return null;
}

export function render(container) {
  container.innerHTML = '';

  const board = document.createElement('div');
  board.className = 'game-board surname-board';
  board.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;

  // グリッド: 列優先（1列目=1-10位, 2列目=11-20位...）
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const rank = col * ROWS + row + 1;
      const cell = document.createElement('div');
      cell.className = 'board-cell';
      cell.dataset.rank = rank;

      const info = rankToName(rank);
      if (isOpened(GENRE, rank)) {
        cell.classList.add('opened');
        cell.innerHTML = `
          <span class="cell-rank">${rank}位</span>
          <span class="cell-main">${info.name}</span>
          <span class="cell-sub">${info.count}</span>
        `;
      } else {
        cell.classList.add('closed');
        cell.innerHTML = `
          <span class="cell-rank">${rank}位</span>
          <span class="cell-main">？</span>
        `;
      }
      board.appendChild(cell);
    }
  }

  container.appendChild(board);
}

export function judge(input) {
  const target = input.trim();
  if (!target) return null;

  // 異体字変換
  const normalized = SURNAME_DATA.variants[target] || target;

  // TOP50チェック
  if (normalized in SURNAME_DATA.top50) {
    const info = SURNAME_DATA.top50[normalized];
    const rank = info.rank;

    if (isOpened(GENRE, rank)) {
      playDuplicate();
      shakeInput(document.getElementById('game-input'));
      showFeedback(`「${normalized}」は既にオープン済み！`, 'duplicate');
      return { type: 'duplicate', rank, name: normalized };
    }

    addOpened(GENRE, rank);
    playCorrect();
    confetti();
    flash();

    // フリップアニメーション
    const cell = document.querySelector(`.board-cell[data-rank="${rank}"]`);
    if (cell) {
      flipCard(cell);
      setTimeout(() => {
        cell.classList.remove('closed');
        cell.classList.add('opened');
        cell.innerHTML = `
          <span class="cell-rank">${rank}位</span>
          <span class="cell-main">${normalized}</span>
          <span class="cell-sub">${info.count}</span>
        `;
      }, 300);
    }

    showFeedback(`正解！ ${rank}位：${normalized}（${info.count}）`, 'correct');
    return { type: 'correct', rank, name: normalized, count: info.count };
  }

  // 51-100位（惜しい）チェック
  if (normalized in SURNAME_DATA.near) {
    const info = SURNAME_DATA.near[normalized];
    playNear();
    shakeInput(document.getElementById('game-input'));
    showFeedback(`惜しい！ ${info.rank}位：${normalized}（${info.count}）`, 'near');
    return { type: 'near', rank: info.rank, name: normalized, count: info.count };
  }

  // 完全不正解
  playWrong();
  shakeInput(document.getElementById('game-input'));
  showFeedback(`「${target}」は100位圏外です`, 'wrong');
  return { type: 'wrong', name: target };
}

export function getProgress() {
  return { current: getOpenedCount(GENRE), total: TOTAL };
}

export function reset() {
  resetGenre(GENRE);
}

export const config = {
  id: GENRE,
  title: '名字 TOP50',
  icon: '🎌',
  color: '#4caf50',
  colorDark: '#1b5e20',
  placeholder: '名字を入力（漢字）',
  total: TOTAL,
};
