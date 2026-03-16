// app.js - Single Cell Practice: one cell, partial (first+last) then full, show key

const KEY_NAMES = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];
const KEY_ROUND_SIZE = 12;

// Pentatonic: minor key -> relative major (for display "Xm pentatonic / Y major pentatonic")
const RELATIVE_MAJOR = { "C": "Eb", "G": "Bb", "D": "F", "A": "C", "E": "G", "B": "D", "F#": "A", "Db": "E", "Ab": "B", "Eb": "Gb", "Bb": "Db", "F": "Ab" };
// Pentatonic: play IV7sus4 (key -> audio chord key)
const PENTATONIC_AUDIO_KEY = { "C": "F", "G": "C", "D": "G", "A": "D", "E": "A", "B": "E", "F#": "B", "Db": "F#", "Ab": "Db", "Eb": "Ab", "Bb": "Eb", "F": "Bb" };

let appState = {
    currentScreen: 'welcome',
    practiceType: 'cells', // 'cells' | 'phrases'
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

    // Apply phrase-mode centering only when we're in phrase practice on the cell screen
    const body = document.body;
    if (body) {
        if (appState.currentScreen === 'cell' && appState.practiceType === 'phrases') {
            body.classList.add('phrase-mode');
        } else {
            body.classList.remove('phrase-mode');
        }
    }
}

function updateCellDisplay() {
    if (!appState.currentCell || !appState.selectedKey) return;
    const isPhraseMode = appState.practiceType === 'phrases';
    let abcNotation;
    if (isPhraseMode) {
        // Phrase mode: use the exact same generator as bpp (generateABCScore)
        const phrase = appState.currentCell;
        if (!phrase || !Array.isArray(phrase) || phrase.length === 0) return;
        const phraseFn = (typeof window !== 'undefined' && typeof window.generateABCScore === 'function')
            ? window.generateABCScore
            : generateABCScore;
        abcNotation = phraseFn(phrase, appState.showingPartial, phrase.length);
    } else {
        // Cells 模式：仍然使用单 cell 的 ABC 生成（必须是 5 个音）
        abcNotation = generateABCSingleCell(appState.currentCell, appState.showingPartial);
    }
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
    const toggleText = isPhraseMode
        ? 'Generate Next Phrase'
        : (appState.showingPartial ? 'Show Full' : 'Generate Next');
    document.getElementById('toggle-cell-btn').textContent = toggleText;
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
    const isPhraseMode = appState.practiceType === 'phrases';
    if (isPhraseMode) {
        // Phrase 模式：先挖空再换句子，行为与 bpp 类似
        if (appState.showingPartial) {
            appState.showingPartial = false;
            updateCellDisplay();
            return;
        } else {
            if (appState.mode === 'random') {
                appState.selectedKey = pickNextKey();
            }
            appState.currentCell = generatePhraseForCurrentKey(appState.selectedKey);
            appState.showingPartial = true;
            updateCellDisplay();
            play7sus4Audio();
            return;
        }
    }

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

function generatePhraseForCurrentKey(key) {
    // Follow bpp 7sus4/major short (9-note) logic closely:
    // Start from rightCell conceptually (backward generation), then find a compatible leftCell
    // based on pivot (shared pitch class) and glue with 1-note overlap.
    const baseCells = getBaseCells();
    if (!baseCells || baseCells.length < 2) {
        return pickNextCellForKey(key);
    }

    function getPitchClassName(note) {
        return typeof note === 'string' ? note.slice(0, -1) : null;
    }

    let bestPhrase = null;
    const MAX_ATTEMPTS = 50;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        // 1. 从右往左：先选一个 rightCell（相当于 bpp 的当前 cell）
        const rightIndex = Math.floor(Math.random() * baseCells.length);
        const rightCellC = baseCells[rightIndex];
        if (!rightCellC || rightCellC.length === 0) continue;

        const firstRight = rightCellC[0];
        const firstPc = getPitchClassName(firstRight);
        if (!firstPc) continue;

        // 2. 在 baseCells 中寻找所有「以 firstPc 作为结尾」的 leftCell，确保 pivot。
        //    如果一个都找不到，就放弃这次尝试，重新选 rightCell（不能勉强用“错误调式”的 cell）。
        const compatibleLefts = baseCells.filter(cell => {
            const last = cell && cell[cell.length - 1];
            return last && getPitchClassName(last) === firstPc;
        });
        if (compatibleLefts.length === 0) {
            // 没有合法 pivot，换一个 rightCell 再试
            continue;
        }

        const leftIndex = Math.floor(Math.random() * compatibleLefts.length);
        const leftCellC = compatibleLefts[leftIndex];
        if (!leftCellC || leftCellC.length < 2) continue;

        // 3. 用 adjustRightCell 对右边 cell 做八度调整，保证连接时在 pivot 上平滑
        const adjustedRightC = (typeof window !== 'undefined' && typeof window.adjustRightCell === 'function')
            ? window.adjustRightCell(leftCellC, rightCellC)
            : rightCellC;

        // 4. 连接：left + adjustedRight.slice(1) = 5 + 4 = 9 notes
        const phraseC = leftCellC.concat(adjustedRightC.slice(1));

        // 5. 整句移到当前 key，并做整体八度调整与范围检查。
        //    Pentatonic 模式下，升降号拼写规则要与 cell 模式完全一致（例如 Gm 用降号、C#m 用升号），
        //    因此这里复用 pickNextCellForKey 中的 spellingKey 逻辑。
        let spellingKey = key;
        if (appState.cellType === 'pentatonic') {
            if (key === 'G') spellingKey = 'Bb';      // Gm pentatonic -> flats (Bb/Eb)
            else if (key === 'Db') spellingKey = 'C#'; // Dbm pentatonic 显示为 C#m，使用升号
        }

        const semitones = KEYS[key];
        const phraseInKey = phraseC.map(note => transposeNote(note, semitones, spellingKey));
        const octaveAdjusted = adjustPhraseOctave(phraseInKey, spellingKey);

        if (isPhraseInComfortRange(octaveAdjusted)) {
            return octaveAdjusted;
        }
        bestPhrase = octaveAdjusted;
    }

    return bestPhrase || pickNextCellForKey(key);
}

function navigateToCellScreen() {
    if (appState.practiceType === 'phrases') {
        appState.currentCell = generatePhraseForCurrentKey(appState.selectedKey);
        appState.showingPartial = true; // 先挖空，再点一次显示完整句子
    } else {
        appState.currentCell = pickNextCellForKey(appState.selectedKey);
        appState.showingPartial = true;
    }
    showScreen('cell');
    updateCellDisplay();
    play7sus4Audio();
}

function navigateToCellScreenRandom() {
    appState.selectedKey = pickNextKey();
    if (appState.practiceType === 'phrases') {
        appState.currentCell = generatePhraseForCurrentKey(appState.selectedKey);
        appState.showingPartial = true; // 先挖空
    } else {
        appState.currentCell = pickNextCellForKey(appState.selectedKey);
        appState.showingPartial = true;
    }
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
    document.getElementById('login-btn').addEventListener('click', () => showScreen('practice-type'));

    // Practice type selection
    document.getElementById('practice-cells-btn').addEventListener('click', () => {
        appState.practiceType = 'cells';
        showScreen('cell-type');
    });
    document.getElementById('practice-phrases-btn').addEventListener('click', () => {
        appState.practiceType = 'phrases';
        showScreen('phrase-type');
    });

    // Cell type selection for "Cells" practice
    document.getElementById('bebop-cell-btn').addEventListener('click', () => {
        appState.practiceType = 'cells';
        appState.cellType = 'bebop';
        appState.pentatonicGroup = null;
        appState.cellRoundOrder = null;
        appState.cellRoundIndex = 0;
        showScreen('mode');
    });
    document.getElementById('pentatonic-cell-btn').addEventListener('click', () => {
        appState.practiceType = 'cells';
        appState.cellType = 'pentatonic';
        appState.pentatonicGroup = null;
        appState.cellRoundOrder = null;
        appState.cellRoundIndex = 0;
        showScreen('pentatonic-group');
    });

    // Phrase type selection for "Phrases" practice
    document.getElementById('bebop-phrase-btn').addEventListener('click', () => {
        appState.practiceType = 'phrases';
        appState.cellType = 'bebop';
        appState.pentatonicGroup = null;
        appState.cellRoundOrder = null;
        appState.cellRoundIndex = 0;
        showScreen('mode');
    });
    document.getElementById('pentatonic-phrase-btn').addEventListener('click', () => {
        appState.practiceType = 'phrases';
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
    document.getElementById('practice-type-return').addEventListener('click', () => showScreen('welcome'));
    document.getElementById('cell-type-return').addEventListener('click', () => showScreen('practice-type'));
    document.getElementById('phrase-type-return').addEventListener('click', () => showScreen('practice-type'));
    document.getElementById('pentatonic-group-return').addEventListener('click', () => {
        if (appState.practiceType === 'phrases') showScreen('phrase-type');
        else showScreen('cell-type');
    });
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
                else {
                    if (appState.practiceType === 'phrases') showScreen('phrase-type');
                    else showScreen('cell-type');
                }
            } else if (appState.currentScreen === 'pentatonic-group') {
                if (appState.practiceType === 'phrases') showScreen('phrase-type');
                else showScreen('cell-type');
            } else if (appState.currentScreen === 'phrase-type') showScreen('practice-type');
            else if (appState.currentScreen === 'cell-type') showScreen('practice-type');
            else if (appState.currentScreen === 'practice-type') showScreen('welcome');
        } else if ((e.key === 'Enter' || e.key === ' ') && appState.currentScreen === 'cell') {
            handleToggleCell();
        }
    });

    showScreen('welcome');
});
