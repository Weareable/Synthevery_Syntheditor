import { useState, useEffect } from 'react';
import { getSyntheveryInstance } from '@/lib/synthevery-core';

function useSynthevery() {
    const [synthevery, setSynthevery] = useState(getSyntheveryInstance());

    useEffect(() => {
        // TODO: Synthevery インスタンスの状態が変化したときに、コンポーネントを再レンダリングするための処理を実装する
    }, [synthevery]);

    return synthevery;
}

export default useSynthevery;