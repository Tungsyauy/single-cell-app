// app.js - Single Cell Practice: one cell, partial (first+last) then full, show key

const KEY_NAMES = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];
const KEY_ROUND_SIZE = 12;

// Pentatonic: minor key -> relative major (for display "Xm pentatonic / Y major pentatonic")
const RELATIVE_MAJOR = { "C": "Eb", "G": "Bb", "D": "F", "A": "C", "E": "G", "B": "D", "F#": "A", "Db": "E", "Ab": "B", "Eb": "Gb", "Bb": "Db", "F": "Ab" };
// Pentatonic: play IV7sus4 (key -> audio chord key)
const PENTATONIC_AUDIO_KEY = { "C": "F", "G": "C", "D": "G", "A": "D", "E": "A", "B": "E", "F#": "B", "Db": "F#", "Ab": "Db", "Eb": "Ab", "Bb": "Eb", "F": "Bb" };

let appState = {
    currentScreen: 'welcome',
    cellType: null,
    pentatonicGroup: null, // 1,2,3,4,'random'
    mode: null,
    selectedKey: null,
    currentCell: null,
    showingPartial: true,
    cellRoundOrder: null,
    cellRoundIndex: 0,
    keyRoundOrder: null,
    keyRoundIndex: 0
};

function getBaseCells() {
    if (appState.cellType === 'pentatonic') {
        return getPentatonicBaseCells();
    }
    return window.RAW_CELLS_BEBOP;
}

function getPentatonicBaseCells() {
    const groups = window.PENTATONIC_GROUPS || {};
    const g = appState.pentatonicGroup;
    if (g === 'random') {
        // 将 1–4 组所有 cells 合并为一个大集合
        let combined = [];
        [1, 2, 3, 4].forEach(num => {
            if (Array.isArray(groups[num]) && groups[num].length > 0) {
                combined = combined.concat(groups[num]);
            }
        });
        // 如果还没填其它组，只用 group1
        if (combined.length === 0 && Array.isArray(groups[1])) {
            combined = groups[1].slice();
        }
        return combined;
    }
    const groupIndex = typeof g === 'number' ? g : 1;
    const base = groups[groupIndex];
    if (Array.isArray(base) && base.length > 0) return base;
    // 默认回退到 group1
    return groups[1] || [];
}

function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function startNewKeyRound() {
    appState.keyRoundOrder = shuffleArray(
        KEY_NAMES.map((_, i) => i)
    );
    appState.keyRoundIndex = 0;
}

function pickNextKey() {
    if (
        !appState.keyRoundOrder ||
        appState.keyRoundIndex >= KEY_ROUND_SIZE
    ) {
        startNewKeyRound();
    }
    const index = appState.keyRoundOrder[appState.keyRoundIndex];
    appState.keyRoundIndex += 1;
    return KEY_NAMES[index];
}

function startNewCellRound() {
    const base = getBaseCells();
    appState.cellRoundOrder = shuffleArray(
        base.map((_, i) => i)
    );
    appState.cellRoundIndex = 0;
}

function pickNextCellForKey(key) {
    const base = getBaseCells();
    const groupSize = base.length;
    if (
        !appState.cellRoundOrder ||
        appState.cellRoundIndex >= groupSize
    ) {
        startNewCellRound();
    }
    const index = appState.cellRoundOrder[appState.cellRoundIndex];
    appState.cellRoundIndex += 1;
    const baseCell = base[index];

    // Pentatonic: use special spelling keys for accidentals without changing actual transposition
    let spellingKey = key;
    if (appState.cellType === 'pentatonic') {
        if (key === 'G') spellingKey = 'Bb';      // Gm pentatonic -> flats (Bb/Eb)
        else if (key === 'Db') spellingKey = 'C#'; // Dbm pentatonic displayed as C#m, use sharps
    }

    const cellInKey = baseCell.map(note => transposeNote(note, KEYS[key], spellingKey));
    return adjustPhraseOctave(cellInKey, spellingKey);
}

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.add('hidden'));
    document.getElementById(screenName + '-screen').classList.remove('hidden');
    appState.currentScreen = screenName;
}

function updateCellDisplay() {
    if (!appState.currentCell || !appState.selectedKey) return;
    const abcNotation = generateABCSingleCell(appState.currentCell, appState.showingPartial);
    renderABCNotation(abcNotation);
    const keyDisplay = document.getElementById('key-display');
    if (appState.cellType === 'pentatonic') {
        const rawKey = appState.selectedKey;
        const displayMinor = rawKey === 'Db' ? 'C#' : rawKey;
        const rel = RELATIVE_MAJOR[rawKey] || '';
        keyDisplay.textContent = `${displayMinor}m pentatonic / ${rel} major pentatonic`;
    } else {
        keyDisplay.textContent = `in the key of ${appState.selectedKey}7sus4`;
    }
    document.getElementById('toggle-cell-btn').textContent = appState.showingPartial ? 'Show Full' : 'Generate Next';
}

function renderABCNotation(abcNotation) {
    const notationDiv = document.getElementById('notation');
    notationDiv.innerHTML = '';
    const staffwidth = 350;
    const scale = 1.0;
    const padding = 40;
    ABCJS.renderAbc(notationDiv, abcNotation, {
        responsive: "resize",
        scale: scale,
        staffwidth: staffwidth,
        paddingleft: padding,
        paddingright: padding,
        paddingtop: padding,
        paddingbottom: padding,
        add_classes: true
    });
    setTimeout(() => {
        const svg = notationDiv.querySelector('svg');
        if (svg) {
            svg.style.filter = 'brightness(0) invert(1) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))';
        }
    }, 80);
}

function handleToggleCell() {
    if (appState.showingPartial) {
        appState.showingPartial = false;
        updateCellDisplay();
    } else {
        if (appState.mode === 'random') {
            appState.selectedKey = pickNextKey();
        }
        appState.currentCell = pickNextCellForKey(appState.selectedKey);
        appState.showingPartial = true;
        updateCellDisplay();
        play7sus4Audio();
    }
}

function navigateToCellScreen() {
    appState.currentCell = pickNextCellForKey(appState.selectedKey);
    appState.showingPartial = true;
    showScreen('cell');
    updateCellDisplay();
    play7sus4Audio();
}

function navigateToCellScreenRandom() {
    appState.selectedKey = pickNextKey();
    appState.currentCell = pickNextCellForKey(appState.selectedKey);
    appState.showingPartial = true;
    showScreen('cell');
    updateCellDisplay();
    play7sus4Audio();
}

function play7sus4Audio() {
    if (!appState.selectedKey) return;
    const chordKey = appState.cellType === 'pentatonic'
        ? (PENTATONIC_AUDIO_KEY[appState.selectedKey] || appState.selectedKey)
        : appState.selectedKey;
    const fileName = chordKey + '7sus4.mp3';
    const audioPath = 'audio/' + encodeURIComponent(fileName);
    const audio = document.getElementById('audio-7sus4');
    if (!audio) return;
    audio.src = audioPath;
    audio.play().catch(function (e) {
        console.warn('Play failed:', e);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('login-btn').addEventListener('click', () => showScreen('cell-type'));

    document.getElementById('bebop-cell-btn').addEventListener('click', () => {
        appState.cellType = 'bebop';
        appState.pentatonicGroup = null;
        appState.cellRoundOrder = null;
        appState.cellRoundIndex = 0;
        showScreen('mode');
    });
    document.getElementById('pentatonic-cell-btn').addEventListener('click', () => {
        appState.cellType = 'pentatonic';
        appState.pentatonicGroup = null;
        appState.cellRoundOrder = null;
        appState.cellRoundIndex = 0;
        showScreen('pentatonic-group');
    });

    // Pentatonic group selection
    function selectPentatonicGroup(groupValue) {
        appState.pentatonicGroup = groupValue;
        appState.cellRoundOrder = null;
        appState.cellRoundIndex = 0;
        showScreen('mode');
    }
    document.getElementById('group-1-btn').addEventListener('click', () => selectPentatonicGroup(1));
    document.getElementById('group-2-btn').addEventListener('click', () => selectPentatonicGroup(2));
    document.getElementById('group-3-btn').addEventListener('click', () => selectPentatonicGroup(3));
    document.getElementById('group-4-btn').addEventListener('click', () => selectPentatonicGroup(4));
    document.getElementById('group-random-btn').addEventListener('click', () => selectPentatonicGroup('random'));

    document.getElementById('random-mode-btn').addEventListener('click', () => {
        appState.mode = 'random';
        navigateToCellScreenRandom();
    });
    document.getElementById('designate-mode-btn').addEventListener('click', () => {
        appState.mode = 'designate';
        showScreen('key');
    });

    document.querySelectorAll('.key-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            appState.selectedKey = btn.dataset.key;
            navigateToCellScreen();
        });
    });

    document.getElementById('toggle-cell-btn').addEventListener('click', handleToggleCell);
    document.getElementById('cell-type-return').addEventListener('click', () => showScreen('welcome'));
    document.getElementById('pentatonic-group-return').addEventListener('click', () => showScreen('cell-type'));
    document.getElementById('mode-return').addEventListener('click', () => {
        if (appState.cellType === 'pentatonic') showScreen('pentatonic-group');
        else showScreen('cell-type');
    });
    document.getElementById('key-return').addEventListener('click', () => showScreen('mode'));
    document.getElementById('cell-return').addEventListener('click', () => {
        if (appState.mode === 'random') showScreen('mode');
        else showScreen('key');
    });
    document.getElementById('play-7sus4-btn').addEventListener('click', play7sus4Audio);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.key === 'Backspace') {
            if (appState.currentScreen === 'cell') {
                if (appState.mode === 'random') showScreen('mode');
                else showScreen('key');
            } else if (appState.currentScreen === 'key') showScreen('mode');
            else if (appState.currentScreen === 'mode') {
                if (appState.cellType === 'pentatonic') showScreen('pentatonic-group');
                else showScreen('cell-type');
            } else if (appState.currentScreen === 'pentatonic-group') showScreen('cell-type');
            else if (appState.currentScreen === 'cell-type') showScreen('welcome');
        } else if ((e.key === 'Enter' || e.key === ' ') && appState.currentScreen === 'cell') {
            handleToggleCell();
        }
    });

    showScreen('welcome');
});
