// lib/utils/tonal-chordscale.ts
import { Chord, Scale, Note } from 'tonal';
import { ChordScaleConfig, Scale as ChordScale, Chord as ChordType, ChordScaleRelation, ScaleWithRoot } from '@/types/chordScale';

// MIDI note 60 (C4) を基準とした相対ノート番号に変換
const MIDI_BASE_NOTE = 60;

// コードで利用できるノート番号の範囲（相対値）
const CHORD_NOTE_RANGE = {
    min: -12, // 1オクターブ下
    max: 24   // 2オクターブ上
};

/**
 * MIDIノート番号を基準60からの相対値に変換
 */
export function midiToRelative(midiNote: number): number {
    return midiNote - MIDI_BASE_NOTE;
}

/**
 * ノート番号を指定範囲内に丸める
 * @param note ノート番号（相対値）
 * @param range 範囲制限（デフォルト: CHORD_NOTE_RANGE）
 * @returns 範囲内に丸められたノート番号
 */
export function clampNoteToRange(note: number, range: { min: number; max: number } = CHORD_NOTE_RANGE): number {
    return Math.max(range.min, Math.min(range.max, note));
}

/**
 * ノート番号を音程クラス（0-11）に正規化
 * @param note ノート番号（相対値）
 * @returns 音程クラス（0-11）
 */
export function normalizeToPitchClass(note: number): number {
    return ((note % 12) + 12) % 12;
}

/**
 * ノート番号配列を音程クラス配列に正規化
 * @param notes ノート番号配列（相対値）
 * @returns 音程クラス配列（重複除去済み、ソート済み）
 */
export function normalizeNotesToPitchClasses(notes: number[]): number[] {
    const pitchClasses = notes.map(normalizeToPitchClass);
    const uniquePitchClasses = [...new Set(pitchClasses)];
    return uniquePitchClasses.sort((a, b) => a - b);
}

/**
 * コード名からベースノートを抽出する関数
 * @param chordName コード名 (例: "F", "C/E")
 * @returns ベースノート名 (例: "F", "E")
 */
function extractBassNote(chordName: string): string | null {
    try {
        // "/" が含まれている場合は転回形（例: "C/E"）
        if (chordName.includes('/')) {
            const parts = chordName.split('/');
            if (parts.length >= 2) {
                return parts[1].trim();
            }
        }

        // 通常のコードの場合、ルートノートをベースノートとする
        const chord = Chord.get(chordName);
        if (!chord.empty && chord.tonic) {
            return chord.tonic;
        }

        return null;
    } catch (error) {
        console.error(`Error extracting bass note from ${chordName}:`, error);
        return null;
    }
}

/**
 * 指定されたMIDIノート範囲に最適なコードヴォイシングを見つける関数
 * (転回形やオクターブシフトを考慮し、ベースノートの音程を重視する)
 * 
 * @param chord Chord.get()の結果オブジェクト
 * @param minMidi 許容されるMIDIノート番号の最小値 (例: 60 for C4)
 * @param maxMidi 許容されるMIDIノート番号の最大値 (例: 71 for B4)
 * @param chordName コード名（ベースノート特定用）
 * @returns 最適なヴォイシングのMIDIノート番号配列。見つからない場合は空の配列。
 */
export function getVoicingInOneOctaveRange(chord: any, minMidi: number, maxMidi: number, chordName?: string): number[] {
    if (chord.empty) {
        console.warn(`無効なコード: ${chord}`);
        return [];
    }

    const baseNotes = chord.notes; // 例: ["C", "E", "G", "B"]
    const numNotes = baseNotes.length;

    // 可能なヴォイシングを全て格納する配列
    let allPossibleVoicings: number[][] = [];

    // 探索するオクターブ範囲 (現在の範囲の中心から-2 ~ +2オクターブ程度)
    const rangeMidMidi = Math.floor((minMidi + maxMidi) / 2);
    const baseOctaveForSearch = Math.floor(rangeMidMidi / 12) - 1;

    for (let currentBaseOctave = baseOctaveForSearch - 2; currentBaseOctave <= baseOctaveForSearch + 2; currentBaseOctave++) {
        // 全ての転回形を生成
        for (let inversion = 0; inversion < numNotes; inversion++) {
            const currentVoicing: number[] = [];
            // 転回形に応じてノートの順番を入れ替える
            const rotatedNotes = [...baseNotes.slice(inversion), ...baseNotes.slice(0, inversion)];

            let lastMidi = -Infinity; // 前の音より低いMIDI値にならないようにする
            let currentNoteOctave = currentBaseOctave; // 現在の音のオクターブ

            for (let i = 0; i < numNotes; i++) {
                const noteName = rotatedNotes[i];
                let midi = Note.midi(`${noteName}${currentNoteOctave}`);

                // 現在の音が、直前の音より低い、または同じMIDI値の場合、オクターブを上げる
                // ただし、最初の音（i=0）の場合はこのチェックは不要
                while (midi !== null && midi <= lastMidi && i > 0) {
                    currentNoteOctave++;
                    midi = Note.midi(`${noteName}${currentNoteOctave}`);
                }

                if (midi !== null) {
                    currentVoicing.push(midi);
                    lastMidi = midi; // 次の音のチェックのために現在のMIDIを保存
                }
            }

            if (currentVoicing.length === numNotes) {
                allPossibleVoicings.push(currentVoicing);
            }
        }
    }

    console.log('allPossibleVoicings', allPossibleVoicings);

    console.log('minMidi', minMidi);
    console.log('maxMidi', maxMidi);
    console.log('rangeMidMidi', rangeMidMidi);

    // ベースノートを特定（chordNameが提供されている場合）
    let targetBassNote: string | null = null;
    if (chordName) {
        targetBassNote = extractBassNote(chordName);
        console.log(`[getVoicingInOneOctaveRange] ベースノート特定: ${chordName} -> ${targetBassNote}`);
    }

    // 生成された全てのヴォイシングを評価
    let bestVoicing: number[] = [];
    let bestScore = -1; // スコアは、より多くの音が範囲内にあるほど高くなる
    let bestSpan = Infinity; // 同じスコアの場合、音域が狭い方が良い

    for (const voicing of allPossibleVoicings) {
        // 1. 範囲内の音の数 (主要なスコアリング)
        const inRangeCount = voicing.filter(midi => midi >= minMidi && midi < maxMidi).length;

        // 2. 音域の広さ (span)。同じinRangeCountの場合に利用
        const span = Math.max(...voicing) - Math.min(...voicing);

        // 3. 全ての音が範囲に収まっている場合のボーナス
        const isFullyInRange = inRangeCount === numNotes && span <= (maxMidi - minMidi);
        let currentScore = inRangeCount + (isFullyInRange ? 100 : 0); // 完全一致に高いボーナス

        // 4. ベースノートの音程を重視したスコアリング（新機能）
        if (targetBassNote && voicing.length > 0) {
            const bassMidi = voicing[0]; // 最初の音がベースノート
            const bassNoteName = Note.fromMidi(bassMidi);

            if (bassNoteName) {
                const bassPitchClass = Note.pitchClass(bassNoteName);
                const targetPitchClass = Note.pitchClass(targetBassNote);

                // ベースノートの音程クラスが一致する場合に高得点
                if (bassPitchClass === targetPitchClass) {
                    currentScore += 10; // ベースノート一致
                    console.log(`[getVoicingInOneOctaveRange] ベースノート一致ボーナス: ${bassNoteName}(${bassPitchClass}) === ${targetBassNote}(${targetPitchClass})`);
                }
            }
        }

        // 5. (オプション) ヴォイシングが範囲の中心に近いほど有利にする
        const voicingMidMidi = (Math.min(...voicing) + Math.max(...voicing)) / 2;
        currentScore -= Math.abs(voicingMidMidi - rangeMidMidi) * 0.1; // 中心から離れるほどわずかに減点

        console.log('voicing', voicing);
        console.log('inRangeCount', inRangeCount);
        console.log('span', span);
        console.log('isFullyInRange', isFullyInRange);
        console.log('voicingMidMidi', voicingMidMidi);
        console.log('rangeMidMidi', rangeMidMidi);
        console.log('currentScore', currentScore);

        if (currentScore > bestScore) {
            bestScore = currentScore;
            bestVoicing = voicing;
            bestSpan = span;
        } else if (currentScore === bestScore) {
            // 同じスコアの場合、より音域が狭いヴォイシングを選ぶ
            if (span < bestSpan) {
                bestVoicing = voicing;
                bestSpan = span;
            }
        }
    }

    // 最終チェック: 最適なヴォイシングが有効な場合はそのまま返し、
    // 有効でない場合は空配列を返す。
    if (bestVoicing.length > 0 && bestVoicing.filter(midi => midi >= minMidi && midi <= maxMidi).length > 0) {
        return bestVoicing;
    } else {
        console.warn(`コードは指定範囲 [${minMidi}-${maxMidi}] に最適なヴォイシングが見つかりませんでした。`);
        return [];
    }
}

/**
 * 相対ノート番号をMIDIノート番号に変換
 */
export function relativeToMidi(relativeNote: number): number {
    return relativeNote + MIDI_BASE_NOTE;
}

/**
 * コード名からノート番号配列を生成
 * @param chordName コード名 (例: "Cmaj7", "Dm7", "G7")
 * @returns MIDI note 60を基準(0)とした相対ノート番号配列（ルートノート基準でオクターブ調整）
 */
export function chordToNotes(chordName: string, range: { min: number; max: number } = CHORD_NOTE_RANGE): number[] {
    try {
        console.log(`[chordToNotes] 開始: ${chordName}, range:`, range);

        // 転回形の場合は元のコード名を使用
        let chordNameForTonal = chordName;
        if (chordName.includes('/')) {
            chordNameForTonal = chordName.split('/')[0];
        }

        // Chord.get()を一度だけ呼び出し
        const chord = Chord.get(chordNameForTonal);
        if (chord.empty || !chord.notes || chord.notes.length === 0) {
            throw new Error(`Invalid chord: ${chordNameForTonal}`);
        }

        console.log(`[chordToNotes] Chord.get()結果:`, {
            chordName,
            notes: chord.notes,
            empty: chord.empty
        });

        // 最適なヴォイシングを取得（MIDI番号で）
        const minMidi = MIDI_BASE_NOTE + range.min;
        const maxMidi = MIDI_BASE_NOTE + range.max;
        const voicing = getVoicingInOneOctaveRange(chord, minMidi, maxMidi, chordName);

        console.log(`[chordToNotes] ヴォイシング結果:`, {
            voicing,
            minMidi,
            maxMidi,
            voicingLength: voicing.length
        });

        if (voicing.length === 0) {
            console.log(`[chordToNotes] フォールバック処理開始`);

            // フォールバック: 従来の方法（既に取得したchordを使用）
            const pcs: number[] = [];
            for (const noteName of chord.notes) {
                const midiAtC4 = Note.midi(`${noteName}4`);
                if (midiAtC4 == null) continue;
                const rel = midiAtC4 - MIDI_BASE_NOTE;
                const pc = ((rel % 12) + 12) % 12;
                pcs.push(pc);
                console.log(`[chordToNotes] フォールバック: ${noteName}4 -> MIDI:${midiAtC4} -> 相対:${rel} -> PC:${pc}`);
            }

            if (pcs.length === 0) return [];

            const stacked: number[] = [];
            let prev = pcs[0];
            stacked.push(clampNoteToRange(prev, range));

            for (let i = 1; i < pcs.length; i++) {
                let v = pcs[i];
                while (v < prev) v += 12;
                stacked.push(clampNoteToRange(v, range));
                prev = v;
                console.log(`[chordToNotes] スタック処理: PC[${i}]=${pcs[i]} -> v=${v} -> 最終=${clampNoteToRange(v, range)}`);
            }

            console.log(`[chordToNotes] フォールバック結果:`, stacked);
            return stacked;
        }

        // ヴォイシングを相対値に変換
        const result = voicing.map(midi => midiToRelative(midi));
        console.log(`[chordToNotes] 最終結果:`, result);
        return result;
    } catch (error) {
        console.error(`Error parsing chord ${chordName}:`, error);
        return [];
    }
}

/**
 * スケール名からノート番号配列を生成
 * @param scaleName スケール名 (例: "C major", "D dorian")
 * @param range ノート番号の範囲制限
 * @returns MIDI note 60を基準(0)とした相対ノート番号配列
 */
export function scaleToNotes(scaleName: string, range: { min: number; max: number } = CHORD_NOTE_RANGE): number[] {
    try {
        // tonal.jsの正しいAPIを使用
        const scale = Scale.get(scaleName);
        if (scale.empty || !scale.notes || scale.notes.length === 0) {
            throw new Error(`Invalid scale: ${scaleName}`);
        }

        // スケールのノート配列を処理（ルートを0として正規化）
        // スケールは音楽理論的に正しい形で生成し、範囲制限は適用しない
        const normalized: number[] = [];
        const rootMidi = Note.midi(`${scale.tonic}4`);
        if (rootMidi == null) return [];

        for (const noteName of scale.notes) {
            const midiAtC4 = Note.midi(`${noteName}4`);
            if (midiAtC4 == null) continue;
            const rel = midiAtC4 - rootMidi; // ルート基準の相対値
            normalized.push(rel); // ルート基準の相対値を使用
        }

        // 昇順にソート
        normalized.sort((a, b) => a - b);

        return normalized;
    } catch (error) {
        console.error(`Error parsing scale ${scaleName}:`, error);
        return [];
    }
}

/**
 * コード名から構成音配列を取得
 * @param chordName コード名 (例: "Cmaj7", "Dm7", "G7")
 * @returns 構成音の配列 (例: ["C", "E", "G", "B"])
 */
export function getChordNotes(chordName: string): string[] {
    try {
        const chord = Chord.get(chordName);
        if (chord.empty || !chord.notes || chord.notes.length === 0) {
            console.warn(`無効なコード名: ${chordName}`);
            return [];
        }
        return chord.notes;
    } catch (error) {
        console.error(`Error parsing chord ${chordName}:`, error);
        return [];
    }
}

/**
 * 構成音配列からスケール候補を検出
 * @param notes 構成音の配列 (例: ["C", "E", "G", "B"])
 * @returns スケール候補の配列
 */
export function detectScalesFromNotes(notes: string[]): string[] {
    try {
        // tonal.jsのScale.detectを使用してスケール候補を取得
        const detectedScales = Scale.detect(notes);

        if (!detectedScales || detectedScales.length === 0) {
            console.warn(`構成音 [${notes.join(', ')}] からスケール候補が見つかりませんでした`);
            return [];
        }

        return detectedScales;
    } catch (error) {
        console.error(`Error detecting scales from notes [${notes.join(', ')}]:`, error);
        return [];
    }
}

/**
 * スケール名からモード拡張を行う
 * @param scaleName スケール名 (例: "C major")
 * @returns モード拡張されたスケール名の配列
 */
export function expandScaleModes(scaleName: string): string[] {
    try {
        const scale = Scale.get(scaleName);
        if (scale.empty) {
            console.warn(`無効なスケール名: ${scaleName}`);
            return [scaleName]; // 元のスケール名を返す
        }

        // tonal.jsのmodeNamesを使用してモード拡張
        const modeNames = Scale.modeNames(scaleName);

        if (!modeNames || modeNames.length === 0) {
            return [scaleName]; // モードが見つからない場合は元のスケール名を返す
        }

        // 元のスケール名も含めて返す（modeNamesはScaleMode[]なので文字列に変換）
        const modeNamesAsStrings = modeNames.map(mode => mode.toString());
        return [scaleName, ...modeNamesAsStrings];
    } catch (error) {
        console.error(`Error expanding modes for scale ${scaleName}:`, error);
        return [scaleName]; // エラーの場合は元のスケール名を返す
    }
}

/**
 * スケール名の配列から重複を統合
 * @param scaleNames スケール名の配列
 * @returns 重複を統合したスケール名の配列
 */
export function consolidateScaleNames(scaleNames: string[]): string[] {
    try {
        // 重複を除去
        const uniqueScales = [...new Set(scaleNames)];

        // 音程クラスベースでさらに統合
        const consolidatedScales: string[] = [];

        for (const scaleName of uniqueScales) {
            const scale = Scale.get(scaleName);
            if (scale.empty) continue;

            const scaleNotes = scale.notes;
            if (!scaleNotes || scaleNotes.length === 0) continue;

            // 音程クラスに変換
            const pitchClasses = scaleNotes.map(note => {
                const midi = Note.midi(`${note}4`);
                return midi !== null ? midi % 12 : -1;
            }).filter(pc => pc !== -1).sort((a, b) => a - b);

            // 既存のスケールと音程クラスが同じかチェック
            const isDuplicate = consolidatedScales.some(existingScaleName => {
                const existingScale = Scale.get(existingScaleName);
                if (existingScale.empty) return false;

                const existingNotes = existingScale.notes;
                if (!existingNotes || existingNotes.length === 0) return false;

                const existingPitchClasses = existingNotes.map(note => {
                    const midi = Note.midi(`${note}4`);
                    return midi !== null ? midi % 12 : -1;
                }).filter(pc => pc !== -1).sort((a, b) => a - b);

                return pitchClasses.length === existingPitchClasses.length &&
                    pitchClasses.every((pc, i) => pc === existingPitchClasses[i]);
            });

            if (!isDuplicate) {
                consolidatedScales.push(scaleName);
            }
        }

        return consolidatedScales;
    } catch (error) {
        console.error(`Error consolidating scale names:`, error);
        return scaleNames; // エラーの場合は元の配列を返す
    }
}

/**
 * コード進行から最適なスケールを推定し、ランキング順に返します。
 * @param chords コード名の配列 (例: ["Cmaj7", "G7", "Am"])
 * @param tonic (オプション) 中心となるトニックを指定すると、その音から始まるスケールが優先されます。
 * @returns 推定されるスケールの情報を含むオブジェクトの配列。
 */
export function suggestScales(chords: string[], tonic: string = ""): Array<{ name: string; notes: string[] }> {
    // Step 1: Collect all unique notes from the chord progression.
    const notesInProgression = chords.reduce((allNotes, chordName) => {
        const chord = Chord.get(chordName);
        if (chord.empty) return allNotes;
        chord.notes.forEach(note => {
            allNotes.add(Note.pitchClass(note));
        });
        return allNotes;
    }, new Set<string>());

    if (notesInProgression.size === 0) {
        console.warn("有効なコードが見つかりませんでした。");
        return [];
    }

    const notesArray = Array.from(notesInProgression);

    // Step 2: Set options for Scale.detect, including the tonic if provided.
    const options: any = {};
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

/**
 * コード名のリストからスケールを生成（新しいアプローチ）
 * @param chordNames コード名の配列
 * @returns 生成されたスケール名の配列（トップのスケールのみ）
 */
export function generateScalesFromChords(chordNames: string[]): string[] {
    try {
        // 新しいアルゴリズムを使用してスケール候補を取得
        const suggestions = suggestScales(chordNames);

        if (suggestions.length === 0) {
            console.warn("コード進行からスケール候補が見つかりませんでした");
            return [];
        }

        // トップのスケールのみを返す（最初の候補）
        const topScaleName = suggestions[0].name;

        console.log(`Generated top scale: ${topScaleName}`);

        return [topScaleName];
    } catch (error) {
        console.error(`Error generating scales from chords:`, error);
        return [];
    }
}

/**
 * コードとスケールの関係を自動生成
 * @param chordName コード名
 * @param scaleName スケール名
 * @returns ChordScaleRelation オブジェクト
 */
export function generateChordScaleRelation(
    chordName: string,
    scaleName: string,
    chordId: number,
    scaleId: number
): ChordScaleRelation | null {
    try {
        const chord = Chord.get(chordName);
        const scale = Scale.get(scaleName);

        if (chord.empty || scale.empty) {
            return null;
        }

        const chordRoot = chord.tonic;
        const scaleRoot = scale.tonic;

        if (!chordRoot || !scaleRoot) {
            return null;
        }

        // オクターブ情報を追加してMIDI番号を取得
        const chordRootMidi = Note.midi(`${chordRoot}4`);
        const scaleRootMidi = Note.midi(`${scaleRoot}4`);

        if (chordRootMidi === null || scaleRootMidi === null) {
            return null;
        }

        const rootOffset = midiToRelative(chordRootMidi) - midiToRelative(scaleRootMidi);

        return {
            chord_id: chordId,
            scale_with_root: {
                scale_id: scaleId,
                root_offset: rootOffset
            }
        };
    } catch (error) {
        console.error(`Error generating chord-scale relation:`, error);
        return null;
    }
}

/**
 * コード名からChordScaleConfigを自動生成（新しいスケール生成アプローチ）
 * @param chordNames コード名の配列
 * @param range ノート番号の範囲制限
 * @param useVoicingAlgorithm 最適ヴォイシングアルゴリズムを使用するか
 * @param consolidateScalesFlag スケールを統合するか
 * @returns ChordScaleConfig オブジェクト
 */
export function generateChordScaleConfigWithRange(
    chordNames: string[],
    range: { min: number; max: number } = CHORD_NOTE_RANGE,
    useVoicingAlgorithm: boolean = true,
    consolidateScalesFlag: boolean = true
): ChordScaleConfig {
    const scales: ChordScale[] = [];
    const chords: ChordType[] = [];
    const chordScaleRelations: ChordScaleRelation[] = [];
    const sequences: any[] = [];

    // 新しいアプローチでスケールを生成（トップのスケールのみ）
    const generatedScaleNames = generateScalesFromChords(chordNames);
    console.log(`Generated scale names: [${generatedScaleNames.join(', ')}]`);

    // 生成されたスケール名からスケールオブジェクトを作成（トップのスケールのみ）
    if (generatedScaleNames.length > 0) {
        const topScaleName = generatedScaleNames[0];
        const scaleNotes = scaleToNotes(topScaleName, range);
        if (scaleNotes.length > 0) {
            scales.push({ notes: scaleNotes });
        }
    }

    // 各コードを処理
    chordNames.forEach((chordName, chordIndex) => {
        // コードのノート配列を生成（範囲指定オプション付き）
        const chordNotes = chordToNotes(chordName, range);
        if (chordNotes.length > 0) {
            chords.push({ notes: chordNotes });

            // コードの構成音を取得
            const chordNotesArray = getChordNotes(chordName);
            if (chordNotesArray.length > 0 && generatedScaleNames.length > 0) {
                // トップのスケールを使用（スケールIDは常に0）
                const topScaleName = generatedScaleNames[0];
                const scaleId = 0;

                // コード・スケール関係を生成
                const relation = generateChordScaleRelation(
                    chordName,
                    topScaleName,
                    chordIndex,
                    scaleId
                );

                if (relation) {
                    chordScaleRelations.push(relation);
                }
            }
        }
    });

    // デフォルトのシーケンスを生成（各コードを480 ticks間隔で配置）
    chordNames.forEach((_, index) => {
        sequences.push({
            tick: index * 480,
            data: {
                chord_ids: [index],
                scale_with_roots: chordScaleRelations[index] ? [chordScaleRelations[index].scale_with_root] : []
            }
        });
    });

    return {
        scales,
        chords,
        chord_scale_relations: chordScaleRelations,
        sequences,
        loop_length_tick: chordNames.length * 480
    };
}

/**
 * スケールを統合して既存のスケールを見つけるか、新しいスケールを作成する
 * @param scales 既存のスケール配列
 * @param scaleNotes 新しいスケールのノート配列
 * @param chordName コード名（デバッグ用）
 * @returns スケールID
 */
function findOrCreateConsolidatedScale(scales: ChordScale[], scaleNotes: number[], chordName: string): number {
    // 新しいスケールの音程クラスを取得
    const newPitchClasses = normalizeNotesToPitchClasses(scaleNotes);

    // 1. 完全一致を探す（音程クラスベース）
    let exactMatch = scales.findIndex(s => {
        const existingPitchClasses = normalizeNotesToPitchClasses(s.notes);
        return existingPitchClasses.length === newPitchClasses.length &&
            existingPitchClasses.every((pc, i) => pc === newPitchClasses[i]);
    });

    if (exactMatch !== -1) {
        console.log(`完全一致: ${chordName} -> Scale ${exactMatch} (音程クラス: [${newPitchClasses.join(', ')}])`);
        return exactMatch;
    }

    // 2. 包含関係を探す（新しいスケールが既存スケールを含む場合）
    for (let i = 0; i < scales.length; i++) {
        const existingScale = scales[i];
        const existingPitchClasses = normalizeNotesToPitchClasses(existingScale.notes);

        if (newPitchClasses.every(pc => existingPitchClasses.includes(pc))) {
            console.log(`包含関係: ${chordName} -> Scale ${i} (新しいスケールが既存スケールを含む) [${newPitchClasses.join(', ')}] ⊆ [${existingPitchClasses.join(', ')}]`);
            return i;
        }
    }

    // 3. 逆包含関係を探す（既存スケールが新しいスケールを含む場合）
    for (let i = 0; i < scales.length; i++) {
        const existingScale = scales[i];
        const existingPitchClasses = normalizeNotesToPitchClasses(existingScale.notes);

        if (existingPitchClasses.every(pc => newPitchClasses.includes(pc))) {
            // 既存スケールを新しいスケールで拡張
            scales[i] = { notes: scaleNotes };
            console.log(`逆包含関係: ${chordName} -> Scale ${i} (既存スケールを拡張) [${existingPitchClasses.join(', ')}] ⊆ [${newPitchClasses.join(', ')}]`);
            return i;
        }
    }

    // 4. 共通ノートが多いスケールを探す（閾値: 70%以上、音程クラスベース）
    let bestMatch = -1;
    let bestScore = 0;
    const threshold = 0.7;

    for (let i = 0; i < scales.length; i++) {
        const existingScale = scales[i];
        const existingPitchClasses = normalizeNotesToPitchClasses(existingScale.notes);

        const commonPitchClasses = newPitchClasses.filter(pc => existingPitchClasses.includes(pc));
        const score = commonPitchClasses.length / Math.max(newPitchClasses.length, existingPitchClasses.length);

        if (score >= threshold && score > bestScore) {
            bestMatch = i;
            bestScore = score;
        }
    }

    if (bestMatch !== -1) {
        // 既存スケールを新しいスケールで置き換え（統合）
        scales[bestMatch] = { notes: scaleNotes };
        const existingPitchClasses = normalizeNotesToPitchClasses(scales[bestMatch].notes);
        console.log(`高類似度統合: ${chordName} -> Scale ${bestMatch} (類似度: ${(bestScore * 100).toFixed(1)}%) [${newPitchClasses.join(', ')}] ≈ [${existingPitchClasses.join(', ')}]`);
        return bestMatch;
    }

    // 5. 新しいスケールを作成
    scales.push({ notes: scaleNotes });
    console.log(`新規作成: ${chordName} -> Scale ${scales.length - 1} (音程クラス: [${newPitchClasses.join(', ')}])`);
    return scales.length - 1;
}

/**
 * ノート番号配列を音符名に変換（デバッグ用）
 * @param notes 相対ノート番号配列
 * @returns 音符名の配列
 */
export function notesToNames(notes: number[]): string[] {
    return notes.map(note => {
        const midiNote = relativeToMidi(note);
        const noteName = Note.fromMidi(midiNote);
        return noteName || `Unknown(${midiNote})`;
    });
}

/**
 * コード名の妥当性をチェック
 * @param chordName コード名
 * @returns 妥当性チェック結果
 */
export function validateChordName(chordName: string): { isValid: boolean; error?: string } {
    try {
        const chord = Chord.get(chordName);
        if (chord.empty || !chord.notes || chord.notes.length === 0) {
            return { isValid: false, error: 'Invalid chord name' };
        }
        return { isValid: true };
    } catch (error) {
        return { isValid: false, error: 'Invalid chord name format' };
    }
}

/**
 * スケール名の妥当性をチェック
 * @param scaleName スケール名
 * @returns 妥当性チェック結果
 */
export function validateScaleName(scaleName: string): { isValid: boolean; error?: string } {
    try {
        const scale = Scale.get(scaleName);
        if (scale.empty || !scale.notes || scale.notes.length === 0) {
            return { isValid: false, error: 'Invalid scale name' };
        }
        return { isValid: true };
    } catch (error) {
        return { isValid: false, error: 'Invalid scale name format' };
    }
}
