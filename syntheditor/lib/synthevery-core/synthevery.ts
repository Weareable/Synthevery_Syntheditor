import { mesh } from "./connection/mesh";
import { commandDispatcher } from "./command/dispatcher";
import { deviceTypeSynchronizer } from "./devicetype/devicetype";
import { appStateSyncConnector } from "./appstate/sync";
import { playerSyncStates } from "./player/states";
import { deviceController } from "./device/controller";
import { srarqSessionsController } from "./connection/srarq/session";
import { dataTransferController } from "./data-transfer/data-transfer-controller";
import { deviceConfigManager } from "./device/device-config-manager";
import { trackConfigManager } from "./tracks/track-config-manager";

export const synthevery = {
    mesh,
    commandDispatcher,
    deviceTypeSynchronizer,
    appStateSyncConnector,
    playerSyncStates,
    deviceController,
    srarqSessionsController,
    dataTransferController,
    deviceConfigManager,
    trackConfigManager,
}