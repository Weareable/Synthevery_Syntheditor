// 新しいスケール推定アルゴリズムのテストスクリプト
const { Chord, Scale, Note } = require('tonal');

/**
 * コード進行から最適なスケールを推定し、ランキング順に返します。
 * @param {string[]} chords - コード名の配列 (例: ["Cmaj7", "G7", "Am"])
 * @param {string} [tonic] - (オプション) 中心となるトニックを指定すると、その音から始まるスケールが優先されます。
 * @returns {Object[]} 推定されるスケールの情報を含むオブジェクトの配列。
 */
function suggestScales(chords, tonic = "") {
    // Step 1: Collect all unique notes from the chord progression.
    const notesInProgression = chords.reduce((allNotes, chordName) => {
        const chord = Chord.get(chordName);
        if (chord.empty) return allNotes;
        chord.notes.forEach(note => {
            allNotes.add(Note.pitchClass(note));
        });
        return allNotes;
    }, new Set());

    if (notesInProgression.size === 0) {
        console.warn("有効なコードが見つかりませんでした。");
        return [];
    }

    const notesArray = Array.from(notesInProgression);

    // Step 2: Set options for Scale.detect, including the tonic if provided.
    const options = {};
    if (tonic && Note.get(tonic).pc) {
        options.tonic = tonic;
    }

    // Step 3: Use Tonal.js's built-in detection function with the new options.
    // This directly finds scales that fit the notes AND the tonic.
    const detectedScales = Scale.detect(notesArray, options);

    // Step 4: Map the results to the desired object format for display.
    // Sorting by the length of the scale name acts as a simple "simplicity" score.
    const candidates = detectedScales.map(scaleName => {
        const scale = Scale.get(scaleName);
        return {
            name: scaleName,
            notes: scale.notes
        };
    });

    // The function already returns a good order, but we can do a simple sort
    // by the number of notes to bring pentatonics etc. higher.
    return candidates.sort((a, b) => a.notes.length - b.notes.length);
}

// テストケース
console.log("=== 新しいスケール推定アルゴリズムのテスト ===\n");

// テストケース1: C G Am F (基本的なコード進行)
console.log("テストケース1: C G Am F");
const test1 = suggestScales(["C", "G", "Am", "F"]);
console.log("結果:");
test1.slice(0, 5).forEach((scale, index) => {
    console.log(`${index + 1}. ${scale.name} - [${scale.notes.join(', ')}]`);
});
console.log();

// テストケース2: Cmaj7 G7 Am7 Fmaj7 (より複雑なコード)
console.log("テストケース2: Cmaj7 G7 Am7 Fmaj7");
const test2 = suggestScales(["Cmaj7", "G7", "Am7", "Fmaj7"]);
console.log("結果:");
test2.slice(0, 5).forEach((scale, index) => {
    console.log(`${index + 1}. ${scale.name} - [${scale.notes.join(', ')}]`);
});
console.log();

// テストケース3: C G Am F (トニック指定: C)
console.log("テストケース3: C G Am F (トニック: C)");
const test3 = suggestScales(["C", "G", "Am", "F"], "C");
console.log("結果:");
test3.slice(0, 5).forEach((scale, index) => {
    console.log(`${index + 1}. ${scale.name} - [${scale.notes.join(', ')}]`);
});
console.log();

// テストケース4: Dm G C Am (マイナー系のコード進行)
console.log("テストケース4: Dm G C Am");
const test4 = suggestScales(["Dm", "G", "C", "Am"]);
console.log("結果:");
test4.slice(0, 5).forEach((scale, index) => {
    console.log(`${index + 1}. ${scale.name} - [${scale.notes.join(', ')}]`);
});
console.log();

// テストケース5: ペンタトニック系のコード進行
console.log("テストケース5: C F G Am (ペンタトニック系)");
const test5 = suggestScales(["C", "F", "G", "Am"]);
console.log("結果:");
test5.slice(0, 5).forEach((scale, index) => {
    console.log(`${index + 1}. ${scale.name} - [${scale.notes.join(', ')}]`);
});
console.log();

console.log("=== テスト完了 ===");
