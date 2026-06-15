import { SRArqSender, SRArqReceiver, PacketTransmitter, getFixedTimeoutStrategy, SendPacket, ReceivePacket, getImmediateMissingPacketHandler } from '@/lib/srarq/srarq';
import { MeshPacket, P2PMacAddress } from '../../types/mesh';
import { deserializeAckPacket, deserializeDataPacket, getMeshPacketTransmitter, uint8SequenceNumberOperations } from './adapter';
import { getAddressString } from '../util';
import { Mesh } from '../mesh';
import { MESH_PACKET_TYPE_SRARQ_DATA, MESH_PACKET_TYPE_SRARQ_ACK } from '../constants';

export class SRArqSenderSession {
    meshPacketTransmitter: PacketTransmitter;
    sender: SRArqSender;
    packetMap: Map<number, SendPacket> = new Map();
    constructor(
        private mesh: Mesh,
        readonly address: P2PMacAddress,
        readonly sessionId: number,
    ) {
        this.meshPacketTransmitter = getMeshPacketTransmitter(mesh, sessionId, address);
        this.sender = new SRArqSender(this.packetMap, uint8SequenceNumberOperations, getFixedTimeoutStrategy(1000), this.meshPacketTransmitter, 5);
    }
}

export class SRArqReceiverSession {
    meshPacketTransmitter: PacketTransmitter;
    receiver: SRArqReceiver;
    packetMap: Map<number, ReceivePacket> = new Map();
    constructor(
        private mesh: Mesh,
        readonly address: P2PMacAddress,
        readonly sessionId: number,
    ) {
        this.meshPacketTransmitter = getMeshPacketTransmitter(mesh, sessionId, address);
        this.receiver = new SRArqReceiver(this.packetMap, uint8SequenceNumberOperations, 5, this.meshPacketTransmitter, getImmediateMissingPacketHandler(this.meshPacketTransmitter));
    }
}

const SessionIdOperations = {
    INVALID_SESSION_ID: -1,
    NUM_SESSION_IDS: 32,
    wrap: (sessionId: number): number => {
        if (sessionId < 0) {
            return (sessionId + (SessionIdOperations.NUM_SESSION_IDS * Math.ceil(sessionId / SessionIdOperations.NUM_SESSION_IDS))) % SessionIdOperations.NUM_SESSION_IDS;
        }
        return sessionId % SessionIdOperations.NUM_SESSION_IDS;
    },
    isInvalid: (sessionId: number): boolean => {
        return sessionId < 0 || sessionId >= SessionIdOperations.NUM_SESSION_IDS;
    },
}
export class SRArqSessionsController {
    private mesh: Mesh;
    senderSessions: Map<string, Map<number, SRArqSenderSession>> = new Map();
    receiverSessions: Map<string, Map<number, SRArqReceiverSession>> = new Map();
    lastSessionId: Map<string, number> = new Map();

    constructor(mesh: Mesh) {
        this.mesh = mesh;
        this.mesh.setCallback(MESH_PACKET_TYPE_SRARQ_DATA, (meshPacket: MeshPacket) => {
            this.onReceiveData(meshPacket);
        });
        this.mesh.setCallback(MESH_PACKET_TYPE_SRARQ_ACK, (meshPacket: MeshPacket) => {
            this.onReceiveAck(meshPacket);
        });
    }

    createSenderSession(address: P2PMacAddress): { session: SRArqSenderSession, sessionId: number } | null {
        const addressStr = getAddressString(address);
        console.debug("SRArqSessionsController.createSenderSession: start", { address: addressStr });
        let senderSession = this.senderSessions.get(addressStr);
        if (senderSession === undefined) {
            console.debug("SRArqSessionsController.createSenderSession: init session map", { address: addressStr });
            senderSession = new Map();
            this.senderSessions.set(addressStr, senderSession);
        }

        const sessionId = this.getNextSenderSessionId(address);
        if (sessionId === SessionIdOperations.INVALID_SESSION_ID) {
            console.error("SRArqSessionsController.createSenderSession: failed to allocate sessionId", { address: addressStr });
            return null;
        }

        console.debug("SRArqSessionsController.createSenderSession: allocated sessionId", { address: addressStr, sessionId });
        const session = new SRArqSenderSession(this.mesh, address, sessionId);
        senderSession.set(sessionId, session);

        console.debug("SRArqSessionsController.createSenderSession: success", { address: addressStr, sessionId });
        return { session, sessionId };
    }

    createReceiverSession(address: P2PMacAddress, sessionId: number): SRArqReceiverSession | null {
        const addressStr = getAddressString(address);
        console.debug("SRArqSessionsController.createReceiverSession: start", { address: addressStr, sessionId });
        let receiverSession = this.receiverSessions.get(addressStr);
        if (receiverSession === undefined) {
            console.debug("SRArqSessionsController.createReceiverSession: init session map", { address: addressStr });
            receiverSession = new Map();
            this.receiverSessions.set(addressStr, receiverSession);
        }

        if (receiverSession.has(sessionId)) {
            // すでにセッションが存在する
            console.warn("SRArqSessionsController.createReceiverSession: session already exists", { address: addressStr, sessionId });
            return null;
        }

        const session = new SRArqReceiverSession(this.mesh, address, sessionId);
        receiverSession.set(sessionId, session);

        console.debug("SRArqSessionsController.createReceiverSession: success", { address: addressStr, sessionId });
        return session;
    }

    removeSenderSession(address: P2PMacAddress, sessionId: number): void {
        const addressStr = getAddressString(address);
        const senderSession = this.senderSessions.get(addressStr);
        if (senderSession === undefined) {
            return;
        }
        senderSession.delete(sessionId);
        console.debug("SRArqSessionsController.removeSenderSession", { address: addressStr, sessionId });
    }

    removeReceiverSession(address: P2PMacAddress, sessionId: number): void {
        const addressStr = getAddressString(address);
        const receiverSession = this.receiverSessions.get(addressStr);
        if (receiverSession === undefined) {
            return;
        }
        receiverSession.delete(sessionId);
        console.debug("SRArqSessionsController.removeReceiverSession", { address: addressStr, sessionId });
    }

    getSenderSession(address: P2PMacAddress, sessionId: number): SRArqSenderSession | null {
        const senderSession = this.senderSessions.get(getAddressString(address));
        if (senderSession === undefined) {
            return null;
        }
        const session = senderSession.get(sessionId);
        if (session === undefined) {
            return null;
        }
        return session;
    }

    getReceiverSession(address: P2PMacAddress, sessionId: number): SRArqReceiverSession | null {
        const receiverSession = this.receiverSessions.get(getAddressString(address));
        if (receiverSession === undefined) {
            return null;
        }
        const session = receiverSession.get(sessionId);
        if (session === undefined) {
            return null;
        }
        return session;
    }

    private onReceiveData(meshPacket: MeshPacket): void {
        const packet = deserializeDataPacket(meshPacket.data);
        if (packet === null) {
            return;
        }

        const receiverSession = this.receiverSessions.get(getAddressString(meshPacket.source));
        if (receiverSession === undefined) {
            return;
        }

        const session = receiverSession.get(packet.sessionId);
        if (session === undefined) {
            return;
        }

        session.receiver.receivePacket(packet.sequenceNumber, packet.data)
    }

    private onReceiveAck(meshPacket: MeshPacket): void {
        const packet = deserializeAckPacket(meshPacket.data);
        if (packet === null) {
            return;
        }

        const senderSession = this.senderSessions.get(getAddressString(meshPacket.source));
        if (senderSession === undefined) {
            return;
        }

        const session = senderSession.get(packet.sessionId);
        if (session === undefined) {
            return;
        }

        if (packet.ack) {
            session.sender.receiveAck(packet.sequenceNumber, true);
        } else {
            session.sender.receiveAck(packet.sequenceNumber, false);
        }
    }

    private getNextSenderSessionId(address: P2PMacAddress): number {
        const senderSession = this.senderSessions.get(getAddressString(address));
        if (senderSession === undefined) {
            return SessionIdOperations.INVALID_SESSION_ID;
        }

        const addressStr = getAddressString(address);
        if (!this.lastSessionId.has(addressStr)) {
            // 初回は -1 に初期化
            this.lastSessionId.set(addressStr, -1);
        }

        for (let i = 0; i < SessionIdOperations.NUM_SESSION_IDS; i++) {
            const sessionId = SessionIdOperations.wrap(this.lastSessionId.get(addressStr)! + 1);
            if (!senderSession.has(sessionId)) {
                this.lastSessionId.set(addressStr, sessionId);
                return sessionId;
            }
        }

        return SessionIdOperations.INVALID_SESSION_ID;
    }
}

// シングルトンインスタンスの即座生成を停止
// export const srarqSessionsController = new SRArqSessionsController();