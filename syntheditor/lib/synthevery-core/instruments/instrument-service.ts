import { InstrumentRepository } from './instrument-repository'
import { builtinPresets } from './builtin'
import { TrackConfigManager } from '../tracks/track-config-manager'
import { DeviceConfigManager } from '../device/device-config-manager'
import { DataTransferController } from '../data-transfer/data-transfer-controller'
import { Mesh } from '../connection/mesh'
import { P2PMacAddress } from '../types/mesh'
import { NoteBuilderConfig, GeneratorConfig } from '../types/player'
import { sendNoteBuilderConfigForTrack, sendGeneratorConfigForTrack } from '../device/config'

export class InstrumentService {
    constructor(
        private repo: InstrumentRepository,
        private trackConfigManager: TrackConfigManager,
        private dataTransferController: DataTransferController,
        private mesh: Mesh,
        _deviceConfigManager: DeviceConfigManager,
    ) {
        // bootstrap builtin presets if storage empty
        if (this.repo.list().length === 0) {
            this.repo.import(builtinPresets, false)
        }
    }

    setInstrument(trackIndex: number, presetId: string) {
        const preset = this.repo.get(presetId)
        if (!preset) throw new Error('preset not found: ' + presetId)

        // update app state
        this.trackConfigManager.updateAppConfig('noteBuilder', trackIndex, preset.noteBuilderConfig, false)
        this.trackConfigManager.updateAppConfig('generator', trackIndex, preset.generatorConfig, false)
        // also reflect selection to TrackDetail.instrumentPresetId in app store
        const curDetail = this.trackConfigManager.getAppTrackDetail(trackIndex) || { displayName: '', icon: '', instrumentPresetId: '' }
        this.trackConfigManager.updateAppConfig('trackDetail', trackIndex, { ...curDetail, instrumentPresetId: preset.id }, false)

        // broadcast per-track
        const peers: P2PMacAddress[] = this.mesh.getConnectedPeers()
        console.debug('InstrumentService.setInstrument: broadcasting preset', {
            trackIndex,
            presetId: preset.id,
            peers: peers.length,
        })
        for (const peer of peers) {
            try {
                sendNoteBuilderConfigForTrack(this.dataTransferController, peer, trackIndex, preset.noteBuilderConfig as NoteBuilderConfig)
                sendGeneratorConfigForTrack(this.dataTransferController, peer, trackIndex, preset.generatorConfig as GeneratorConfig)

                // 成功ログ
                // ここでは詳細は送らず相手先とトラック/プリセット識別子を記録
                // SRArqセッションは DataTransferController 側でログ済み

            } catch (e) {
                console.error('InstrumentService.setInstrument: failed to send configs', { peer, trackIndex, presetId: preset.id, error: e })
            }
        }
    }
}


