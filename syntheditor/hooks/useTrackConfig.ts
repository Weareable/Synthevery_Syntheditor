import { useState, useEffect, useCallback } from 'react';
import { useSynthevery } from '@/contexts/SyntheveryContext';
import { TrackDetail, NoteBuilderConfig, GeneratorConfig } from '@/lib/synthevery-core/types/player';
import { P2PMacAddress } from '@/lib/synthevery-core/types/mesh';
import { getAddressString } from '@/lib/synthevery-core/connection/util';

/**
 * トラックコンフィグ管理のカスタムフック
 * trackConfigManagerのイベントをReact stateに変換
 */
export function useTrackConfig() {
    const { trackConfigManager } = useSynthevery();
    const [trackDetails, setTrackDetails] = useState<TrackDetail[]>([]);
    const [noteBuilderConfigs, setNoteBuilderConfigs] = useState<NoteBuilderConfig[]>([]);
    const [generatorConfigs, setGeneratorConfigs] = useState<GeneratorConfig[]>([]);
    const [isReady, setIsReady] = useState(false);
    const [deviceConfigStatus, setDeviceConfigStatus] = useState<Map<string, { trackDetail: boolean; noteBuilder: boolean; generator: boolean }>>(new Map());

    // 初期状態の取得
    const updateState = useCallback(() => {
        if (trackConfigManager.isReady()) {
            setTrackDetails(trackConfigManager.getAppTrackDetails());
            setNoteBuilderConfigs(trackConfigManager.getAppNoteBuilderConfigs());
            setGeneratorConfigs(trackConfigManager.getAppGeneratorConfigs());
            setDeviceConfigStatus(trackConfigManager.getAllDeviceConfigStatus());
            setIsReady(true);
        }
    }, []);

    // イベントリスナーの設定
    useEffect(() => {
        // 初期状態の取得
        updateState();

        // イベントハンドラー
        const handleAppConfigChanged = (configType: 'trackDetail' | 'noteBuilder' | 'generator', trackIndex: number) => {
            console.log('useTrackConfig: App config changed:', configType, trackIndex);

            switch (configType) {
                case 'trackDetail':
                    setTrackDetails(trackConfigManager.getAppTrackDetails());
                    break;
                case 'noteBuilder':
                    setNoteBuilderConfigs(trackConfigManager.getAppNoteBuilderConfigs());
                    break;
                case 'generator':
                    setGeneratorConfigs(trackConfigManager.getAppGeneratorConfigs());
                    break;
            }
        };

        const handleConfigSyncRequired = (device: P2PMacAddress, missingConfigs: string[]) => {
            console.log('useTrackConfig: Config sync required for device:', device, 'missing:', missingConfigs);
            console.log('useTrackConfig: Current app state - trackDetails:', trackConfigManager.getAppTrackDetails().length, 'noteBuilder:', trackConfigManager.getAppNoteBuilderConfigs().length, 'generator:', trackConfigManager.getAppGeneratorConfigs().length);
            console.log('useTrackConfig: Device address:', getAddressString(device));
            // デバイスコンフィグ状態を更新
            setDeviceConfigStatus(trackConfigManager.getAllDeviceConfigStatus());
        };

        const handleConfigSyncCompleted = (device: P2PMacAddress) => {
            console.log('useTrackConfig: Config sync completed for device:', device);
            console.log('useTrackConfig: Device address:', getAddressString(device));
            console.log('useTrackConfig: Before update - trackDetails:', trackDetails.length, 'noteBuilder:', noteBuilderConfigs.length, 'generator:', generatorConfigs.length);
            // アプリのコンフィグ状態を更新
            setTrackDetails(trackConfigManager.getAppTrackDetails());
            setNoteBuilderConfigs(trackConfigManager.getAppNoteBuilderConfigs());
            setGeneratorConfigs(trackConfigManager.getAppGeneratorConfigs());
            // デバイスコンフィグ状態を更新
            setDeviceConfigStatus(trackConfigManager.getAllDeviceConfigStatus());
            console.log('useTrackConfig: After update - trackDetails:', trackConfigManager.getAppTrackDetails().length, 'noteBuilder:', trackConfigManager.getAppNoteBuilderConfigs().length, 'generator:', trackConfigManager.getAppGeneratorConfigs().length);
        };

        const handleDeviceConfigChanged = (device: P2PMacAddress, configType: string, trackIndex: number) => {
            console.log('useTrackConfig: Device config changed:', device, configType, trackIndex);
            // アプリのコンフィグ状態も更新（デバイスから受信した場合があるため）
            setTrackDetails(trackConfigManager.getAppTrackDetails());
            setNoteBuilderConfigs(trackConfigManager.getAppNoteBuilderConfigs());
            setGeneratorConfigs(trackConfigManager.getAppGeneratorConfigs());
            // デバイスコンフィグ状態を更新
            setDeviceConfigStatus(trackConfigManager.getAllDeviceConfigStatus());
        };

        // イベントリスナーの登録
        trackConfigManager.on('appConfigChanged', handleAppConfigChanged);
        trackConfigManager.on('configSyncRequired', handleConfigSyncRequired);
        trackConfigManager.on('configSyncCompleted', handleConfigSyncCompleted);
        trackConfigManager.on('deviceConfigChanged', handleDeviceConfigChanged);

        // クリーンアップ
        return () => {
            trackConfigManager.off('appConfigChanged', handleAppConfigChanged);
            trackConfigManager.off('configSyncRequired', handleConfigSyncRequired);
            trackConfigManager.off('configSyncCompleted', handleConfigSyncCompleted);
            trackConfigManager.off('deviceConfigChanged', handleDeviceConfigChanged);
        };
    }, []); // オブジェクトが不変なので空でOK！

    // 準備状態の監視
    useEffect(() => {
        const checkReadyState = () => {
            if (trackConfigManager.isReady() && !isReady) {
                console.log('useTrackConfig: trackConfigManager is now ready, updating state');
                updateState();
            }
        };

        // 初期チェック
        checkReadyState();

        // 定期的にチェック（ready状態になったら停止）
        const readyCheckInterval = setInterval(() => {
            if (trackConfigManager.isReady()) {
                clearInterval(readyCheckInterval);
            } else {
                checkReadyState();
            }
        }, 200);

        return () => {
            clearInterval(readyCheckInterval);
        };
    }, [isReady, updateState]);

    // デバイス接続時の状態更新を確実にするための追加監視
    useEffect(() => {
        const checkDeviceState = () => {
            const deviceCount = trackConfigManager.getConnectedDeviceCount();
            const currentTrackDetails = trackConfigManager.getAppTrackDetails();
            const currentNoteBuilderConfigs = trackConfigManager.getAppNoteBuilderConfigs();
            const currentGeneratorConfigs = trackConfigManager.getAppGeneratorConfigs();

            console.log('useTrackConfig: Device state check - deviceCount:', deviceCount, 'trackDetails:', currentTrackDetails.length, 'noteBuilder:', currentNoteBuilderConfigs.length, 'generator:', currentGeneratorConfigs.length);

            // デバイスが接続されていて、コンフィグが存在する場合は状態を更新
            if (deviceCount > 0 && (currentTrackDetails.length > 0 || currentNoteBuilderConfigs.length > 0 || currentGeneratorConfigs.length > 0)) {
                console.log('useTrackConfig: Device configs detected, updating state');
                setTrackDetails(currentTrackDetails);
                setNoteBuilderConfigs(currentNoteBuilderConfigs);
                setGeneratorConfigs(currentGeneratorConfigs);
                setDeviceConfigStatus(trackConfigManager.getAllDeviceConfigStatus());
                setIsReady(true);

                // 状態が更新されたら、この定期的なチェックを停止
                return true;
            }
            return false;
        };

        // 初期チェック
        const shouldStop = checkDeviceState();
        if (shouldStop) return;

        // 定期的にチェック（デバイス接続後のコンフィグ更新を確実にするため）
        const deviceCheckInterval = setInterval(() => {
            const shouldStop = checkDeviceState();
            if (shouldStop) {
                clearInterval(deviceCheckInterval);
            }
        }, 500);

        return () => {
            clearInterval(deviceCheckInterval);
        };
    }, []); // 依存配列を空にして、マウント時にのみ実行

    // 定期的な状態同期は削除（イベントベースの更新で十分）
    // 必要に応じて、手動で状態を同期する関数を提供

    // 手動で状態を同期する関数
    const syncState = useCallback(() => {
        if (trackConfigManager.isReady()) {
            setTrackDetails(trackConfigManager.getAppTrackDetails());
            setNoteBuilderConfigs(trackConfigManager.getAppNoteBuilderConfigs());
            setGeneratorConfigs(trackConfigManager.getAppGeneratorConfigs());
            setDeviceConfigStatus(trackConfigManager.getAllDeviceConfigStatus());
        }
    }, []);

    // コンフィグ更新関数
    const updateTrackDetail = useCallback((trackIndex: number, trackDetail: TrackDetail, syncToDevices: boolean = false) => {
        trackConfigManager.updateAppConfig('trackDetail', trackIndex, trackDetail, syncToDevices);
    }, []);

    const updateNoteBuilderConfig = useCallback((trackIndex: number, config: NoteBuilderConfig, syncToDevices: boolean = false) => {
        trackConfigManager.updateAppConfig('noteBuilder', trackIndex, config, syncToDevices);
    }, []);

    const updateGeneratorConfig = useCallback((trackIndex: number, config: GeneratorConfig, syncToDevices: boolean = false) => {
        trackConfigManager.updateAppConfig('generator', trackIndex, config, syncToDevices);
    }, []);

    // 特定トラックのコンフィグ取得
    const getTrackDetail = useCallback((trackIndex: number): TrackDetail | undefined => {
        return trackDetails[trackIndex];
    }, [trackDetails]);

    const getNoteBuilderConfig = useCallback((trackIndex: number): NoteBuilderConfig | undefined => {
        return noteBuilderConfigs[trackIndex];
    }, [noteBuilderConfigs]);

    const getGeneratorConfig = useCallback((trackIndex: number): GeneratorConfig | undefined => {
        return generatorConfigs[trackIndex];
    }, [generatorConfigs]);

    // デバイス関連の情報
    const getConnectedDeviceCount = useCallback((): number => {
        return deviceConfigStatus.size;
    }, [deviceConfigStatus]);

    const getDeviceConfigStatus = useCallback((device: P2PMacAddress) => {
        return trackConfigManager.getDeviceConfigStatus(device);
    }, []);

    return {
        // 状態
        trackDetails,
        noteBuilderConfigs,
        generatorConfigs,
        isReady,
        deviceConfigStatus,

        // 更新関数
        updateTrackDetail,
        updateNoteBuilderConfig,
        updateGeneratorConfig,

        // 取得関数
        getTrackDetail,
        getNoteBuilderConfig,
        getGeneratorConfig,

        // デバイス情報
        getConnectedDeviceCount,
        getDeviceConfigStatus,

        // 手動同期関数
        syncState,
    };
}
