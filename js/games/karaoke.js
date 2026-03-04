// karaoke.js — カラオケTOP30ゲーム

import { KARAOKE_DATA } from '../data.js';
import { isOpened, addOpened, getOpenedCount, resetGenre } from '../state.js';
import { playCorrect, playWrong, playDuplicate } from '../sound.js';
import { flipCard, shakeInput, confetti, flash, showFeedback } from '../animations.js';

const GENRE = 'karaoke';
const TOTAL = 30;
const COLS = 5;
const ROWS = 6;

export function render(container) {
  container.innerHTML = '';

  const board = document.createElement('div');
  board.className = 'game-board karaoke-board';
  board.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const rank = col * ROWS + row + 1;
      if (rank > TOTAL) continue;

      const item = KARAOKE_DATA[rank - 1];
      const cell = document.createElement('div');
      cell.className = 'board-cell';
      cell.dataset.rank = rank;

      if (isOpened(GENRE, rank)) {
        cell.classList.add('opened');
        cell.innerHTML = `
          <span class="cell-rank">${rank}位</span>
          <span class="cell-main cell-title">${item.title}</span>
          <span class="cell-sub">${item.artist}</span>
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

function matchSong(input) {
  const q = input.toLowerCase();
  for (const item of KARAOKE_DATA) {
    // 完全一致（タイトル）
    if (item.title === input || item.title.toLowerCase() === q) return item;
    // エイリアス一致
    for (const alias of item.aliases) {
      if (alias.toLowerCase() === q) return item;
    }
    // 部分一致（4文字以上）
    if (q.length >= 4) {
      if (item.title.toLowerCase().includes(q)) return item;
      for (const alias of item.aliases) {
        if (alias.toLowerCase().includes(q)) return item;
      }
    }
    // アーティスト名でもマッチ（4文字以上）
    if (q.length >= 4 && item.artist.toLowerCase().includes(q)) return item;
  }
  return null;
}

export function judge(input) {
  const target = input.trim();
  if (!target) return null;

  const matched = matchSong(target);

  if (matched) {
    if (isOpened(GENRE, matched.rank)) {
      playDuplicate();
      shakeInput(document.getElementById('game-input'));
      showFeedback(`「${matched.title}」は既にオープン済み！`, 'duplicate');
      return { type: 'duplicate', rank: matched.rank, title: matched.title };
    }

    addOpened(GENRE, matched.rank);
    playCorrect();
    confetti();
    flash('rgba(255,105,180,0.15)');

    const cell = document.querySelector(`.karaoke-board .board-cell[data-rank="${matched.rank}"]`);
    if (cell) {
      flipCard(cell);
      setTimeout(() => {
        cell.classList.remove('closed');
        cell.classList.add('opened');
        cell.innerHTML = `
          <span class="cell-rank">${matched.rank}位</span>
          <span class="cell-main cell-title">${matched.title}</span>
          <span class="cell-sub">${matched.artist}</span>
        `;
      }, 300);
    }

    showFeedback(`正解！ ${matched.rank}位：${matched.title} / ${matched.artist}`, 'correct');
    return { type: 'correct', ...matched };
  }

  playWrong();
  shakeInput(document.getElementById('game-input'));
  showFeedback(`「${target}」はTOP30にありません`, 'wrong');
  return { type: 'wrong', input: target };
}

export function getProgress() {
  return { current: getOpenedCount(GENRE), total: TOTAL };
}

export function reset() {
  resetGenre(GENRE);
}

export const config = {
  id: GENRE,
  title: 'カラオケ TOP30',
  icon: '🎤',
  color: '#e91e63',
  colorDark: '#880e4f',
  placeholder: '曲名を入力（部分一致OK）',
  total: TOTAL,
};
