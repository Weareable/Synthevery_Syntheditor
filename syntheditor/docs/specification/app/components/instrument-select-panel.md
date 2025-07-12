# 楽器選択パネル コンポーネント仕様

## 概要

楽器選択パネルは、Syntheveryアプリケーション内で楽器を選択するためのUIコンポーネントです。2行×4列のグリッドレイアウトで8つの楽器カードを表示し、ユーザーが直感的に楽器を選択できるインターフェースを提供します。

## コンポーネント仕様

### 基本情報
```typescript
interface InstrumentSelectPanelProps {
    // 選択された楽器
    selectedInstrument: number | null;
    
    // 楽器選択時のコールバック
    onInstrumentSelect: (instrumentId: number) => void;
    
    // 楽器リスト
    instruments: Instrument[];
    
    // カスタムクラス名
    className?: string;
}

interface Instrument {
    id: number;           // 楽器ID
    name: string;         // 楽器名
    icon: string;         // 楽器アイコン
    description?: string; // 楽器説明（オプション）
}
```

### デフォルト楽器リスト
```typescript
const defaultInstruments: Instrument[] = [
    { id: 1, name: "Piano", icon: "🎹", description: "ピアノ" },
    { id: 2, name: "Guitar", icon: "🎸", description: "ギター" },
    { id: 3, name: "Bass", icon: "🎸", description: "ベース" },
    { id: 4, name: "Drums", icon: "🥁", description: "ドラムス" },
    { id: 5, name: "Strings", icon: "🎻", description: "ストリングス" },
    { id: 6, name: "Brass", icon: "🎺", description: "ブラス" },
    { id: 7, name: "Woodwind", icon: "🎷", description: "木管楽器" },
    { id: 8, name: "Percussion", icon: "🪘", description: "パーカッション" }
];
```

## レイアウト仕様

### グリッドレイアウト
- **グリッドサイズ**: 2行 × 4列
- **カード数**: 8個
- **余白**: 各カード間に均等な余白（16px）
- **レスポンシブ**: 画面サイズに応じてグリッドサイズを調整

### カード仕様
```typescript
interface InstrumentCardProps {
    instrument: Instrument;
    isSelected: boolean;
    onClick: () => void;
    className?: string;
}
```

#### カードデザイン
- **サイズ**: 120px × 120px（デスクトップ）
- **角丸**: 10px
- **ボーダー**: 1px solid
- **背景**: カード背景色
- **ホバー効果**: 背景色の変化
- **選択状態**: 青いボーダー、シャドウ効果

#### カード内容
- **楽器番号**: 左上に表示（例: "1"）
- **楽器名**: 上部に表示（例: "Piano"）
- **楽器アイコン**: 中央に大きく表示（例: "🎹"）
- **説明**: 下部に小さく表示（オプション）

## 操作性仕様

### 選択機能
- **クリック選択**: カードをクリックで楽器選択
- **タップ選択**: タッチデバイスでのタップ選択
- **キーボード操作**: Tabキーでフォーカス移動、Enterキーで選択

### 視覚的フィードバック
```typescript
interface SelectionState {
    // 選択状態のスタイル
    selected: {
        borderColor: "var(--primary)";
        boxShadow: "0 0 0 2px var(--primary)";
        backgroundColor: "var(--accent)";
    };
    
    // ホバー状態のスタイル
    hover: {
        backgroundColor: "var(--muted)";
        transform: "scale(1.02)";
    };
    
    // フォーカス状態のスタイル
    focus: {
        outline: "2px solid var(--ring)";
        outlineOffset: "2px";
    };
}
```

### アクセシビリティ
- **aria-label**: 各カードに適切なラベル
- **aria-pressed**: 選択状態の表示
- **role**: "button"として定義
- **tabindex**: キーボードナビゲーション対応

## 状態管理

### 選択状態
```typescript
interface SelectionState {
    selectedInstrument: number | null;
    hoveredInstrument: number | null;
    focusedInstrument: number | null;
}
```

### 状態更新
```typescript
// 楽器選択
const handleInstrumentSelect = (instrumentId: number) => {
    setSelectedInstrument(instrumentId);
    onInstrumentSelect(instrumentId);
};

// ホバー状態
const handleMouseEnter = (instrumentId: number) => {
    setHoveredInstrument(instrumentId);
};

const handleMouseLeave = () => {
    setHoveredInstrument(null);
};

// フォーカス状態
const handleFocus = (instrumentId: number) => {
    setFocusedInstrument(instrumentId);
};

const handleBlur = () => {
    setFocusedInstrument(null);
};
```

## レスポンシブデザイン

### ブレークポイント対応
```css
/* デスクトップ */
@media (min-width: 1024px) {
    .instrument-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
    }
}

/* タブレット */
@media (min-width: 768px) and (max-width: 1023px) {
    .instrument-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
    }
}

/* モバイル */
@media (max-width: 767px) {
    .instrument-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
    }
}
```

### カードサイズ調整
- **デスクトップ**: 120px × 120px
- **タブレット**: 100px × 100px
- **モバイル**: 80px × 80px

## 拡張性

### 楽器追加・変更
```typescript
// 楽器リストの動的更新
const updateInstruments = (newInstruments: Instrument[]) => {
    setInstruments(newInstruments);
};

// 楽器の追加
const addInstrument = (instrument: Instrument) => {
    setInstruments(prev => [...prev, instrument]);
};

// 楽器の削除
const removeInstrument = (instrumentId: number) => {
    setInstruments(prev => prev.filter(i => i.id !== instrumentId));
};
```

### カスタマイズ機能
- **テーマ対応**: ダーク/ライトテーマ
- **カスタムスタイル**: ユーザー定義スタイル
- **アニメーション**: カスタムアニメーション

## パフォーマンス最適化

### メモ化
```typescript
// 楽器カードのメモ化
const InstrumentCard = React.memo<InstrumentCardProps>(({ 
    instrument, 
    isSelected, 
    onClick 
}) => {
    return (
        <div 
            className={`instrument-card ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
        >
            {/* カード内容 */}
        </div>
    );
});

// 選択状態のメモ化
const selectedInstrument = useMemo(() => {
    return instruments.find(i => i.id === selectedId);
}, [instruments, selectedId]);
```

### 仮想化（将来機能）
```typescript
// 大量の楽器がある場合の仮想化
const VirtualizedInstrumentGrid = ({ instruments }) => {
    return (
        <VirtualGrid
            items={instruments}
            itemHeight={120}
            itemWidth={120}
            renderItem={(instrument) => (
                <InstrumentCard instrument={instrument} />
            )}
        />
    );
};
```

## テスト仕様

### 単体テスト
```typescript
describe('InstrumentSelectPanel', () => {
    it('renders all instruments', () => {
        render(<InstrumentSelectPanel instruments={defaultInstruments} />);
        defaultInstruments.forEach(instrument => {
            expect(screen.getByText(instrument.name)).toBeInTheDocument();
        });
    });
    
    it('handles instrument selection', () => {
        const onSelect = jest.fn();
        render(
            <InstrumentSelectPanel 
                instruments={defaultInstruments}
                onInstrumentSelect={onSelect}
            />
        );
        
        fireEvent.click(screen.getByText('Piano'));
        expect(onSelect).toHaveBeenCalledWith(1);
    });
    
    it('shows selected state', () => {
        render(
            <InstrumentSelectPanel 
                instruments={defaultInstruments}
                selectedInstrument={1}
            />
        );
        
        const pianoCard = screen.getByText('Piano').closest('.instrument-card');
        expect(pianoCard).toHaveClass('selected');
    });
});
```

### 統合テスト
```typescript
describe('InstrumentSelectPanel Integration', () => {
    it('integrates with player state', () => {
        const { result } = renderHook(() => usePlayerState());
        
        render(
            <InstrumentSelectPanel 
                instruments={defaultInstruments}
                onInstrumentSelect={(id) => result.current.setInstrument(id)}
            />
        );
        
        fireEvent.click(screen.getByText('Guitar'));
        expect(result.current.selectedInstrument).toBe(2);
    });
});
```

## 将来の改善計画

### 短期的改善
- **アニメーション強化**: スムーズな選択アニメーション
- **音声フィードバック**: 選択時の音声効果
- **触覚フィードバック**: モバイルでの振動フィードバック

### 中期的改善
- **楽器プレビュー**: 楽器音のプレビュー機能
- **カスタム楽器**: ユーザー定義楽器の追加
- **楽器カテゴリ**: 楽器のカテゴリ分類

### 長期的改善
- **AI楽器推薦**: 使用履歴に基づく楽器推薦
- **楽器学習**: 楽器の使用方法学習機能
- **VR楽器体験**: VRでの楽器体験機能 