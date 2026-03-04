// app.js — ルーター・画面切替・初期化

import * as karaoke from './games/karaoke.js';
import * as movie from './games/movie.js';
import { startBGM, toggleBGM, isBGMEnabled, initAudio } from './sound.js';

const games = { karaoke, movie };
const gameList = [karaoke, movie];
let currentGame = null;
let audioInitialized = false;

function ensureAudio() {
  if (!audioInitialized) {
    audioInitialized = true;
    initAudio();
    startBGM();
  }
}

// ハッシュルーター
function getRoute() {
  const hash = location.hash.slice(1);
  return hash || 'menu';
}

function navigate(route) {
  location.hash = route;
}

// メニュー画面
function renderMenu() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="menu-screen">
      <div class="logo-container">
        <h1 class="logo">THE JUDGE</h1>
        <p class="logo-sub">ザ・ジャッジ</p>
      </div>
      <div class="genre-grid">
        ${gameList.map(g => {
          const p = g.getProgress();
          const pct = Math.round((p.current / p.total) * 100);
          return `
            <div class="genre-card" data-game="${g.config.id}"
                 style="--card-color: ${g.config.color}; --card-dark: ${g.config.colorDark}">
              <div class="genre-icon">${g.config.icon}</div>
              <div class="genre-title">${g.config.title}</div>
              <div class="genre-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${pct}%"></div>
                </div>
                <span class="progress-text">${p.current} / ${p.total}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="menu-footer">
        <button class="btn-bgm" id="btn-bgm">${isBGMEnabled() ? '🔊 BGM ON' : '🔇 BGM OFF'}</button>
      </div>
    </div>
  `;

  // カードクリック
  app.querySelectorAll('.genre-card').forEach(card => {
    card.addEventListener('click', () => {
      ensureAudio();
      navigate(card.dataset.game);
    });
  });

  // BGMボタン
  document.getElementById('btn-bgm').addEventListener('click', () => {
    ensureAudio();
    const on = toggleBGM();
    document.getElementById('btn-bgm').textContent = on ? '🔊 BGM ON' : '🔇 BGM OFF';
  });
}

// ゲーム画面
function renderGame(gameId) {
  const game = games[gameId];
  if (!game) { navigate('menu'); return; }
  currentGame = game;

  const p = game.getProgress();
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="game-screen" style="--game-color: ${game.config.color}; --game-dark: ${game.config.colorDark}">
      <header class="game-header">
        <button class="btn-back" id="btn-back">◀ 戻る</button>
        <div class="header-center">
          <span class="header-icon">${game.config.icon}</span>
          <span class="header-title">${game.config.title}</span>
        </div>
        <div class="header-right">
          <span class="header-progress" id="header-progress">${p.current} / ${p.total}</span>
          <button class="btn-reset" id="btn-reset">リセット</button>
        </div>
      </header>
      <main class="game-main" id="game-board-container"></main>
      <footer class="game-footer">
        <form class="input-area" id="input-form">
          <input type="text" id="game-input" class="game-input"
                 placeholder="${game.config.placeholder}" autocomplete="off" />
          <button type="submit" class="btn-judge">判定！</button>
        </form>
      </footer>
    </div>
  `;

  // ボード描画
  game.render(document.getElementById('game-board-container'));

  // 戻るボタン
  document.getElementById('btn-back').addEventListener('click', () => navigate('menu'));

  // リセットボタン
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('このジャンルの進捗をリセットしますか？')) {
      game.reset();
      renderGame(gameId);
    }
  });

  // 入力フォーム
  document.getElementById('input-form').addEventListener('submit', (e) => {
    e.preventDefault();
    ensureAudio();
    const input = document.getElementById('game-input');
    const val = input.value;
    if (!val.trim()) return;

    game.judge(val);
    input.value = '';
    input.focus();

    // 進捗更新
    const prog = game.getProgress();
    document.getElementById('header-progress').textContent = `${prog.current} / ${prog.total}`;
  });

  // オートフォーカス
  document.getElementById('game-input').focus();
}

// ルーター
function onRoute() {
  const route = getRoute();
  if (route === 'menu') {
    renderMenu();
    currentGame = null;
  } else {
    renderGame(route);
  }
}

window.addEventListener('hashchange', onRoute);
window.addEventListener('DOMContentLoaded', onRoute);
