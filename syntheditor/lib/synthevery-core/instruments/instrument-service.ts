import { InstrumentRepository } from './instrument-repository'
import { builtinPresets } from './builtin'
import { TrackConfigManager } from '../tracks/track-config-manager'
import { DeviceConfigManager } from '../device/device-config-manager'
import { DataTransferController } from '../data-transfer/data-transfer-controller'
import { Mesh } from '../connection/mesh'
import { P2PMacAddress } from '../types/mesh'
import { NoteBuilderConfig, GeneratorConfig } from '../types/player'
import { sendInstrumentConfigForTrack } from '../device/config'

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
        // also reflect selection to TrackDetail with proper displayName/icon and instrumentPresetId
        const curDetail = this.trackConfigManager.getAppTrackDetail(trackIndex) || { displayName: '', icon: '', instrumentPresetId: '' }
        const nextDetail = {
            displayName: preset.displayName || curDetail.displayName,
            icon: preset.icon || curDetail.icon,
            instrumentPresetId: preset.id,
        }
        // syncToDevices=true -> broadcast updated TrackDetail to devices
        this.trackConfigManager.updateAppConfig('trackDetail', trackIndex, nextDetail as any, true)

        // broadcast per-track
        const peers: P2PMacAddress[] = this.mesh.getConnectedPeers()
        console.debug('InstrumentService.setInstrument: broadcasting preset', {
            trackIndex,
            presetId: preset.id,
            peers: peers.length,
        })
        for (const peer of peers) {
            try {
                sendInstrumentConfigForTrack(
                    this.dataTransferController,
                    peer,
                    trackIndex,
                    preset.noteBuilderConfig as NoteBuilderConfig,
                    preset.generatorConfig as GeneratorConfig,
                )
            } catch (e) {
                console.error('InstrumentService.setInstrument: failed to send combined config', { peer, trackIndex, presetId: preset.id, error: e })
            }
        }
    }
}


