// music-utils.js - Music utilities for Single Cell Practice (from bpp-web-version)

function noteToPitch(note) {
    const pitchClasses = {
        "C": 0, "Db": 1, "C#": 1, "D": 2, "Eb": 3, "D#": 3, "E": 4,
        "F": 5, "Gb": 6, "F#": 6, "G": 7, "Ab": 8, "G#": 8, "A": 9,
        "Bb": 10, "A#": 10, "B": 11
    };
    if (!note || typeof note !== 'string') return [undefined, undefined];
    const name = note.slice(0, -1);
    const octaveStr = note.slice(-1);
    const octave = parseInt(octaveStr);
    if (!(name in pitchClasses) || isNaN(octave)) return [undefined, undefined];
    return [pitchClasses[name], octave];
}

// 谱面升降号：C,F,Bb,Eb,Ab,Db 用降号；其余调用升号。C 调特例：Gb 记为 F#，Bb 保持 Bb
function transposeNote(note, semitones, key) {
    const [pitchClass, octave] = noteToPitch(note);
    if (pitchClass === undefined || octave === undefined) return note;
    const newPitch = ((pitchClass + semitones) % 12 + 12) % 12;
    const newOctave = octave + Math.floor((pitchClass + semitones) / 12);
    const PITCH_CLASSES_SHARP = {0: "C", 1: "C#", 2: "D", 3: "D#", 4: "E", 5: "F", 6: "F#", 7: "G", 8: "G#", 9: "A", 10: "A#", 11: "B"};
    const PITCH_CLASSES_FLAT = {0: "C", 1: "Db", 2: "D", 3: "Eb", 4: "E", 5: "F", 6: "Gb", 7: "G", 8: "Ab", 9: "A", 10: "Bb", 11: "B"};
    const FLAT_KEYS = new Set(["C", "F", "Bb", "Eb", "Ab", "Db"]);
    let pitchName = FLAT_KEYS.has(key) ? PITCH_CLASSES_FLAT[newPitch] : PITCH_CLASSES_SHARP[newPitch];
    if (!FLAT_KEYS.has(key) && ["Db", "Eb", "Gb", "Ab", "Bb"].includes(pitchName)) {
        const sharpMap = {1: "C#", 3: "D#", 6: "F#", 8: "G#", 10: "A#"};
        pitchName = sharpMap[newPitch] || pitchName;
    }
    if (key === "C" && newPitch === 6) pitchName = "F#";
    return `${pitchName}${newOctave}`;
}

// 音高调整：舒适阅读范围 F3–C5，超出则整段移八度；移八度后按当前调重写升降号
const F3_PITCH = 5 + (2 * 12);  // 29
const C5_PITCH = 0 + (5 * 12);  // 60

// C,F,Bb,Eb,Ab,Db 用降号；G,D,A,E,B,F# 用升号
const FLAT_KEYS_ACCIDENTAL = new Set(["C", "F", "Bb", "Eb", "Ab", "Db"]);

function adjustPhraseOctave(phrase, key) {
    let hasHighNotes = false;
    let hasLowNotes = false;
    for (const note of phrase) {
        const [pitchClass, octave] = noteToPitch(note);
        if (pitchClass === undefined || octave === undefined) continue;
        const absolutePitch = pitchClass + (octave * 12);
        if (absolutePitch > C5_PITCH) hasHighNotes = true;
        if (absolutePitch < F3_PITCH) hasLowNotes = true;
    }
    let octaveShift = 0;
    if (hasHighNotes) octaveShift = -1;
    else if (hasLowNotes) octaveShift = 1;
    if (octaveShift === 0) return phrase;
    const PITCH_CLASSES_SHARP = {0: "C", 1: "C#", 2: "D", 3: "D#", 4: "E", 5: "F", 6: "F#", 7: "G", 8: "G#", 9: "A", 10: "A#", 11: "B"};
    const PITCH_CLASSES_FLAT = {0: "C", 1: "Db", 2: "D", 3: "Eb", 4: "E", 5: "F", 6: "Gb", 7: "G", 8: "Ab", 9: "A", 10: "Bb", 11: "B"};
    const sharpMap = {1: "C#", 3: "D#", 6: "F#", 8: "G#", 10: "A#"};
    const useFlats = FLAT_KEYS_ACCIDENTAL.has(key);
    return phrase.map(note => {
        const [pitchClass, octave] = noteToPitch(note);
        if (pitchClass === undefined || octave === undefined) return note;
        const newOctave = octave + octaveShift;
        let pitchName = useFlats ? PITCH_CLASSES_FLAT[pitchClass] : PITCH_CLASSES_SHARP[pitchClass];
        if (!useFlats && ["Db", "Eb", "Gb", "Ab", "Bb"].includes(pitchName)) {
            pitchName = sharpMap[pitchClass] || pitchName;
        }
        if (key === "C" && pitchClass === 6) pitchName = "F#";
        return `${pitchName}${newOctave}`;
    });
}

// Check if a phrase is within the comfortable reading range F3–C5 (used for phrase generation validation)
function isPhraseInComfortRange(phrase) {
    if (!phrase || !Array.isArray(phrase)) return false;
    for (const note of phrase) {
        const [pitchClass, octave] = noteToPitch(note);
        if (pitchClass === undefined || octave === undefined) continue;
        const absolutePitch = pitchClass + (octave * 12);
        if (absolutePitch < F3_PITCH || absolutePitch > C5_PITCH) {
            return false;
        }
    }
    return true;
}

// Adjust rightCell so that its first note matches leftCell's last note EXACTLY in pitch (same pitch class + octave).
function adjustRightCell(leftCell, rightCell) {
    if (!leftCell || !rightCell || leftCell.length === 0 || rightCell.length === 0) {
        return rightCell;
    }
    const lastLeft = leftCell[leftCell.length - 1];
    const firstRight = rightCell[0];
    const [pcL, octL] = noteToPitch(lastLeft);
    const [pcR, octR] = noteToPitch(firstRight);
    if (pcL === undefined || pcR === undefined || octL === undefined || octR === undefined) {
        return rightCell;
    }

    // We want: pcR + 12*octR + totalShift === pcL + 12*octL  (exact match)
    const targetAbs = pcL + octL * 12;
    const baseAbs = pcR + octR * 12;
    const totalShift = targetAbs - baseAbs;

    return rightCell.map(note => transposeNote(note, totalShift, "C"));
}

function convertToABCWithAccidentals(notes) {
    const accidentalState = {};
    return notes.map(note => {
        const noteName = note.slice(0, -1);
        const octave = parseInt(note.slice(-1));
        const pitchClass = noteName[0];
        const currentAccidental = noteName.length > 1 ? noteName[1] : null;
        const accidentalKey = `${pitchClass}${octave}`;
        let baseNote = pitchClass.toLowerCase();
        let accidentalSymbol = "";
        if (currentAccidental === "#") {
            if (accidentalState[accidentalKey] !== "#") {
                accidentalSymbol = "^";
                accidentalState[accidentalKey] = "#";
            }
        } else if (currentAccidental === "b") {
            if (accidentalState[accidentalKey] !== "b") {
                accidentalSymbol = "_";
                accidentalState[accidentalKey] = "b";
            }
        } else {
            if (accidentalState[accidentalKey] === "#" || accidentalState[accidentalKey] === "b") {
                accidentalSymbol = "=";
                accidentalState[accidentalKey] = "natural";
            }
        }
        if (accidentalSymbol) baseNote = accidentalSymbol + baseNote;
        if (octave >= 5) baseNote = baseNote + "'".repeat(octave - 4);
        else if (octave === 3) baseNote = baseNote.toUpperCase();
        else if (octave <= 2) {
            baseNote = baseNote.toUpperCase() + ",".repeat(3 - octave);
        }
        return baseNote;
    });
}

function groupNotesForBeaming(abcNotesList) {
    const beamedGroups = [];
    for (let i = 0; i < abcNotesList.length; i += 4) {
        const group = abcNotesList.slice(i, i + 4);
        beamedGroups.push(group.length === 4 ? group.join('') : group.join(' '));
    }
    return beamedGroups.join(' ');
}

// Single cell: 5 notes. Partial = only first and last (middle three as rests).
function generateABCSingleCell(cell, partial) {
    if (!cell || cell.length !== 5) throw new Error("Cell must have 5 notes");
    let abcNotes;
    if (partial) {
        const notes = [cell[0], cell[4]];
        const abcList = convertToABCWithAccidentals(notes);
        abcNotes = `${abcList[0]} z z z ${abcList[1]}`;
    } else {
        const abcList = convertToABCWithAccidentals(cell);
        abcNotes = groupNotesForBeaming(abcList);
    }
    return `X:1
L:1/8
K:C
${abcNotes}`;
}

// Phrase: arbitrary length (e.g. 2 cells concatenated).
// Uses exactly the same logic as bpp-web-version's generateABCScore.
function generateABCScore(phrase, partial = false, phraseLength = 9) {
    let notes;
    let abcNotes;

    const displayPhrase = phrase;

    if (partial) {
        if (phraseLength < 5) {
            throw new Error("Phrase must have at least 5 notes for partial display");
        }

        if (phraseLength === 9) {
            // Show notes at positions [0, 4, 8] with rests between
            notes = [displayPhrase[0], displayPhrase[4], displayPhrase[8]];
            const abcNotesList = convertToABCWithAccidentals(notes);
            abcNotes = `${abcNotesList[0]} z z z ${abcNotesList[1]} z z z ${abcNotesList[2]}`;
        } else if (phraseLength === 17) {
            // Show notes at positions [0, 4, 8, 12, 16] with rests between
            notes = [displayPhrase[0], displayPhrase[4], displayPhrase[8], displayPhrase[12], displayPhrase[16]];
            const abcNotesList = convertToABCWithAccidentals(notes);
            abcNotes = `${abcNotesList[0]} z z z ${abcNotesList[1]} z z z ${abcNotesList[2]} z z z ${abcNotesList[3]} z z z ${abcNotesList[4]}`;
        } else {
            // Other lengths: show first, middle, and last notes
            notes = [displayPhrase[0], displayPhrase[4], displayPhrase[displayPhrase.length - 1]];
            const abcNotesList = convertToABCWithAccidentals(notes);
            abcNotes = `${abcNotesList[0]} z z z ${abcNotesList[1]} z z z ${abcNotesList[2]}`;
        }
    } else {
        // Full phrase: show all notes with proper accidental handling and beaming
        notes = displayPhrase;
        const abcNotesList = convertToABCWithAccidentals(notes);
        abcNotes = groupNotesForBeaming(abcNotesList);
    }

    const abcNotation = `X:1
L:1/8
K:C
${abcNotes}`;

    return abcNotation;
}

if (typeof window !== 'undefined') {
    window.noteToPitch = noteToPitch;
    window.transposeNote = transposeNote;
    window.adjustPhraseOctave = adjustPhraseOctave;
    window.isPhraseInComfortRange = isPhraseInComfortRange;
    window.adjustRightCell = adjustRightCell;
    window.generateABCSingleCell = generateABCSingleCell;
    window.generateABCScore = generateABCScore;
}
