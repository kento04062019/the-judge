// state.js — localStorage永続化の状態管理

const STORAGE_KEY = 'the-judge-state';

const defaultState = {
  surname: { opened: [] },
  kanji:   { opened: [] },
  karaoke: { opened: [] },
  movie:   { opened: [] },
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // マージして不足キーを補完
      return { ...defaultState, ...parsed };
    }
  } catch (e) {
    console.warn('State load failed, resetting:', e);
  }
  return structuredClone(defaultState);
}

let state = load();

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getOpened(genre) {
  return new Set(state[genre]?.opened || []);
}

export function addOpened(genre, item) {
  if (!state[genre]) state[genre] = { opened: [] };
  if (!state[genre].opened.includes(item)) {
    state[genre].opened.push(item);
    save();
  }
}

export function isOpened(genre, item) {
  return state[genre]?.opened?.includes(item) || false;
}

export function getOpenedCount(genre) {
  return state[genre]?.opened?.length || 0;
}

export function resetGenre(genre) {
  if (state[genre]) {
    state[genre].opened = [];
    save();
  }
}

export function resetAll() {
  state = structuredClone(defaultState);
  save();
}
