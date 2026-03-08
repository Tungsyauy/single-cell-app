// data.js - Cell data for Single Cell Practice (subset from bpp-web-version)
// 原始 BASE_CELLS 全部为 C 调。

const RAW_CELLS_IN_C = [
    //R
    //3rd
    ["E4", "G4", "A4", "D5", "Bb4"],
    //5th
    ["G4", "F4", "E4", "F4", "D4"],
    //7th
    ["Bb4", "F#4", "A4", "G4", "D4"],
    ["Bb4", "C5", "A4", "Bb4", "G4"],
    //9th
    ["D4", "E4", "F4", "F#4", "A4"],
    ["D4", "F4", "G4", "C5", "A4"],
    ["D5", "C5", "A4", "Bb4", "G4"],
    ["D4", "C4", "A3", "Bb3", "F4"],
    //11th
    ["F4", "G4", "E4", "F4", "D4"],
    //#11th
    ["F#4", "A4", "F#4", "G4", "Bb4"],
    ["F#4", "A4", "F#4", "G4", "D4"],
    ["F#4", "A4", "G4", "Bb3", "D4"],
    ["F#4", "G4", "A4", "F#4", "G4"],
    //13th
    ["A4", "C5", "A4", "Bb4", "G4"],
    ["A4", "C5", "A4", "Bb4", "D5"],
    ["A4", "F#4", "G4", "Bb3", "D4"],
];

// Key to semitones (same as original)
const KEYS = {
    "C": 0, "G": 7, "D": 2, "A": 9, "E": 4, "B": 11,
    "F#": 6, "Db": 1, "Ab": 8, "Eb": 3, "Bb": 10, "F": 5
};

// BASE_CELLS 即为 C 调数组
window.BASE_CELLS = RAW_CELLS_IN_C;
