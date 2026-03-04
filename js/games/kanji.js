// kanji.js — 1年生漢字ゲーム

import { KANJI_DATA } from '../data.js';
import { isOpened, addOpened, getOpenedCount, resetGenre } from '../state.js';
import { playCorrect, playWrong, playDuplicate } from '../sound.js';
import { flipCard, shakeInput, confetti, flash, showFeedback } from '../animations.js';

const GENRE = 'kanji';
const TOTAL = 70; // 80 - 10(数字漢字)
const COLS = 10;
const ROWS = 8;

export function render(container) {
  container.innerHTML = '';

  const board = document.createElement('div');
  board.className = 'game-board kanji-board';
  board.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;

  for (let i = 0; i < KANJI_DATA.allKanji.length; i++) {
    const kanji = KANJI_DATA.allKanji[i];
    const isNumber = KANJI_DATA.numberKanji.includes(kanji);
    const cell = document.createElement('div');
    cell.className = 'board-cell kanji-cell';
    cell.dataset.kanji = kanji;

    if (isNumber || isOpened(GENRE, kanji)) {
      cell.classList.add('opened');
      if (isNumber) cell.classList.add('number-kanji');
      cell.innerHTML = `<span class="cell-main kanji-char">${kanji}</span>`;
    } else {
      cell.classList.add('closed');
      cell.innerHTML = `<span class="cell-main kanji-char">？</span>`;
    }
    board.appendChild(cell);
  }

  container.appendChild(board);
}

export function judge(input) {
  const target = input.trim();
  if (!target) return null;

  // 1文字目のみ判定
  const kanji = target[0];

  // 数字漢字チェック
  if (KANJI_DATA.numberKanji.includes(kanji)) {
    playDuplicate();
    shakeInput(document.getElementById('game-input'));
    showFeedback(`「${kanji}」は最初から公開されています`, 'duplicate');
    return { type: 'duplicate', kanji };
  }

  // 重複チェック
  if (isOpened(GENRE, kanji)) {
    playDuplicate();
    shakeInput(document.getElementById('game-input'));
    showFeedback(`「${kanji}」は使用済みです`, 'duplicate');
    return { type: 'duplicate', kanji };
  }

  // 正解チェック
  if (KANJI_DATA.allKanji.includes(kanji)) {
    addOpened(GENRE, kanji);
    playCorrect();
    confetti(1500);
    flash();

    const cell = document.querySelector(`.kanji-cell[data-kanji="${kanji}"]`);
    if (cell) {
      flipCard(cell);
      setTimeout(() => {
        cell.classList.remove('closed');
        cell.classList.add('opened');
        cell.innerHTML = `<span class="cell-main kanji-char">${kanji}</span>`;
      }, 300);
    }

    showFeedback(`正解！「${kanji}」`, 'correct');
    return { type: 'correct', kanji };
  }

  // 不正解 + 煽りコメント
  const aori = KANJI_DATA.aoriComments[Math.floor(Math.random() * KANJI_DATA.aoriComments.length)];
  playWrong();
  shakeInput(document.getElementById('game-input'));
  showFeedback(`不正解！「${kanji}」 — ${aori}`, 'wrong');
  return { type: 'wrong', kanji, aori };
}

export function getProgress() {
  return { current: getOpenedCount(GENRE), total: TOTAL };
}

export function reset() {
  resetGenre(GENRE);
}

export const config = {
  id: GENRE,
  title: '1年生漢字',
  icon: '📚',
  color: '#9c27b0',
  colorDark: '#4a148c',
  placeholder: '漢字を入力（1文字目で判定）',
  total: TOTAL,
};
