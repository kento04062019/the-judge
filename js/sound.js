// sound.js — 効果音 + BGM管理（Web Audio API生成BGM）

let audioCtx = null;
let bgmEnabled = true;
let bgmPlaying = false;
let bgmNodes = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// MP3ファイル再生
function playFile(src) {
  const audio = new Audio(src);
  audio.volume = 0.7;
  audio.play().catch(() => {});
}

// Web Audio APIでシンプルなビープ
function playTone(freq, duration, type = 'sine') {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

export function playCorrect() {
  playFile('sounds/ding.mp3');
}

export function playWrong() {
  playFile('sounds/buzzer.mp3');
}

export function playNear() {
  playTone(440, 0.15);
  setTimeout(() => playTone(554, 0.15), 150);
}

export function playDuplicate() {
  playTone(300, 0.2, 'square');
}

// ===== BGM生成 =====
// ゲームショー風のループBGM（Web Audio APIで生成）
function createBGM() {
  const ctx = getCtx();
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.03;
  masterGain.connect(ctx.destination);

  // コード進行 (Cmaj7 - Am7 - Dm7 - G7 のループ)
  const chords = [
    [261.63, 329.63, 392.00, 493.88],  // Cmaj7
    [220.00, 261.63, 329.63, 392.00],  // Am7
    [293.66, 349.23, 440.00, 523.25],  // Dm7
    [196.00, 246.94, 293.66, 349.23],  // G7
  ];

  // ベースライン
  const bassNotes = [130.81, 110.00, 146.83, 98.00];

  const BPM = 115;
  const beatSec = 60 / BPM;
  const barSec = beatSec * 4;
  const loopSec = barSec * 4; // 4小節ループ

  // メロディ（ペンタトニック風、ランキングゲーム番組っぽく）
  const melodyNotes = [
    523.25, 587.33, 659.25, 784.00, 880.00,  // C5, D5, E5, G5, A5
    784.00, 659.25, 587.33, 523.25, 440.00,
    523.25, 659.25, 784.00, 880.00, 784.00,
    659.25, 587.33, 523.25, 440.00, 392.00,
  ];

  let currentTime = ctx.currentTime;
  const scheduledNodes = [];

  function scheduleLoop(startTime) {
    for (let bar = 0; bar < 4; bar++) {
      const barStart = startTime + bar * barSec;
      const chord = chords[bar];

      // パッド（コード）
      for (const freq of chord) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, barStart);
        gain.gain.setValueAtTime(0.15, barStart + barSec - 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, barStart + barSec);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(barStart);
        osc.stop(barStart + barSec);
        scheduledNodes.push(osc);
      }

      // ベース
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.value = bassNotes[bar];
      bassGain.gain.setValueAtTime(0.3, barStart);
      // ベースのリズム（on-off）
      for (let beat = 0; beat < 4; beat++) {
        const t = barStart + beat * beatSec;
        bassGain.gain.setValueAtTime(0.3, t);
        bassGain.gain.exponentialRampToValueAtTime(0.05, t + beatSec * 0.5);
        bassGain.gain.setValueAtTime(0.01, t + beatSec * 0.5);
      }
      bassOsc.connect(bassGain);
      bassGain.connect(masterGain);
      bassOsc.start(barStart);
      bassOsc.stop(barStart + barSec);
      scheduledNodes.push(bassOsc);

      // メロディ（1小節に5音）
      for (let n = 0; n < 5; n++) {
        const noteIdx = bar * 5 + n;
        const freq = melodyNotes[noteIdx % melodyNotes.length];
        const noteStart = barStart + n * (barSec / 5);
        const noteDur = barSec / 5 * 0.8;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.06, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDur);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(noteStart);
        osc.stop(noteStart + noteDur);
        scheduledNodes.push(osc);
      }

      // ハイハット風パーカッション
      for (let beat = 0; beat < 8; beat++) {
        const t = barStart + beat * (beatSec / 2);
        const bufferSize = ctx.sampleRate * 0.03;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const hihatGain = ctx.createGain();
        const accent = beat % 2 === 0 ? 0.08 : 0.04;
        hihatGain.gain.setValueAtTime(accent, t);
        hihatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        const hihatFilter = ctx.createBiquadFilter();
        hihatFilter.type = 'highpass';
        hihatFilter.frequency.value = 8000;

        noise.connect(hihatFilter);
        hihatFilter.connect(hihatGain);
        hihatGain.connect(masterGain);
        noise.start(t);
        noise.stop(t + 0.05);
        scheduledNodes.push(noise);
      }
    }
  }

  // 最初の2ループをスケジュール
  scheduleLoop(currentTime);
  scheduleLoop(currentTime + loopSec);

  // ループ継続用インターバル
  let nextLoopTime = currentTime + loopSec * 2;
  const intervalId = setInterval(() => {
    if (!bgmPlaying) {
      clearInterval(intervalId);
      return;
    }
    // 次のループが近づいたらスケジュール
    if (ctx.currentTime > nextLoopTime - loopSec) {
      scheduleLoop(nextLoopTime);
      nextLoopTime += loopSec;
    }
  }, 1000);

  return { masterGain, intervalId, scheduledNodes };
}

export function startBGM() {
  if (bgmPlaying) return;
  if (!bgmEnabled) return;
  bgmPlaying = true;
  bgmNodes = createBGM();
}

export function stopBGM() {
  bgmPlaying = false;
  if (bgmNodes) {
    bgmNodes.masterGain.gain.setValueAtTime(bgmNodes.masterGain.gain.value, getCtx().currentTime);
    bgmNodes.masterGain.gain.exponentialRampToValueAtTime(0.001, getCtx().currentTime + 0.5);
    clearInterval(bgmNodes.intervalId);
    bgmNodes = null;
  }
}

export function toggleBGM() {
  bgmEnabled = !bgmEnabled;
  if (bgmEnabled) {
    startBGM();
  } else {
    stopBGM();
  }
  return bgmEnabled;
}

export function isBGMEnabled() {
  return bgmEnabled;
}

export function initAudio() {
  getCtx();
}
