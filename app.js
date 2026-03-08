// app.js - Single Cell Practice: one cell, partial (first+last) then full, show key

const KEY_NAMES = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];
const KEY_ROUND_SIZE = 12;

let appState = {
    currentScreen: 'welcome',
    mode: null,
    selectedKey: null,
    currentCell: null,
    showingPartial: true,
    cellRoundOrder: null,
    cellRoundIndex: 0,
    keyRoundOrder: null,
    keyRoundIndex: 0
};

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
    appState.cellRoundOrder = shuffleArray(
        BASE_CELLS.map((_, i) => i)
    );
    appState.cellRoundIndex = 0;
}

function pickNextCellForKey(key) {
    const groupSize = BASE_CELLS.length;
    if (
        !appState.cellRoundOrder ||
        appState.cellRoundIndex >= groupSize
    ) {
        startNewCellRound();
    }
    const index = appState.cellRoundOrder[appState.cellRoundIndex];
    appState.cellRoundIndex += 1;
    const baseCell = BASE_CELLS[index];
    const cellInKey = baseCell.map(note => transposeNote(note, KEYS[key], key));
    return adjustPhraseOctave(cellInKey, key);
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
    document.getElementById('key-display').textContent = `in the key of ${appState.selectedKey}7sus4`;
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
    const key = appState.selectedKey;
    const fileName = key + '7sus4.mp3';
    const audioPath = 'audio/' + encodeURIComponent(fileName);
    const audio = document.getElementById('audio-7sus4');
    if (!audio) return;
    audio.src = audioPath;
    audio.play().catch(function (e) {
        console.warn('Play failed:', e);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('login-btn').addEventListener('click', () => showScreen('mode'));

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
    document.getElementById('mode-return').addEventListener('click', () => showScreen('welcome'));
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
            else if (appState.currentScreen === 'mode') showScreen('welcome');
        } else if ((e.key === 'Enter' || e.key === ' ') && appState.currentScreen === 'cell') {
            handleToggleCell();
        }
    });

    showScreen('welcome');
});
