import { mesh } from "../mesh";
import { srarqSessionsController } from "./session";
import { P2PMacAddress } from "../../types/mesh";

export function init(): number {
    mesh.eventEmitter.on("peerConnected", (address: P2PMacAddress) => {
        const receiverSession = srarqSessionsController.createReceiverSession(address, 0);

        if (receiverSession === null) {
            // すでにセッションが存在する
            return;
        }

        receiverSession.receiver.eventEmitter.on("received", (sequenceNumber: number) => {
            console.log("SRArq: received", sequenceNumber);
            // データ取得
            const data = receiverSession.receiver.getReceivedData(sequenceNumber);
            if (data === null) {
                // データが存在しない
                return;
            }

            console.log("SRArq: received data", data);
            // Ack送信
            receiverSession.receiver.sendAck(sequenceNumber, true);
        });
    });

    return 0;
}

export const mock = init();