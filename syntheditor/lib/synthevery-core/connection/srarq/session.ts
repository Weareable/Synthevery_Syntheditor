import { SRArqSender, SRArqReceiver, PacketTransmitter, getFixedTimeoutStrategy, SendPacket, ReceivePacket, getImmediateMissingPacketHandler } from '@/lib/srarq/srarq';
import { MeshPacket, P2PMacAddress } from '../../types/mesh';
import { deserializeAckPacket, deserializeDataPacket, getMeshPacketTransmitter, uint8SequenceNumberOperations } from './adapter';
import { getAddressString } from '../util';
import { mesh } from '../mesh';
import { MESH_PACKET_TYPE_SRARQ_DATA, MESH_PACKET_TYPE_SRARQ_ACK } from '../constants';

class SRArqSenderSession {
    meshPacketTransmitter: PacketTransmitter;
    sender: SRArqSender;
    packetMap: Map<number, SendPacket> = new Map();
    constructor(
        readonly address: P2PMacAddress,
        readonly sessionId: number,
    ) {
        this.meshPacketTransmitter = getMeshPacketTransmitter(sessionId, address);
        this.sender = new SRArqSender(this.packetMap, uint8SequenceNumberOperations, getFixedTimeoutStrategy(1000), this.meshPacketTransmitter, 5);
    }
}

class SRArqReceiverSession {
    meshPacketTransmitter: PacketTransmitter;
    receiver: SRArqReceiver;
    packetMap: Map<number, ReceivePacket> = new Map();
    constructor(
        readonly address: P2PMacAddress,
        readonly sessionId: number,
    ) {
        this.meshPacketTransmitter = getMeshPacketTransmitter(sessionId, address);
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
class SRArqSessionsController {
    senderSessions: Map<string, Map<number, SRArqSenderSession>> = new Map();
    receiverSessions: Map<string, Map<number, SRArqReceiverSession>> = new Map();
    lastSessionId: Map<string, number> = new Map();

    constructor() {
        mesh.setCallback(MESH_PACKET_TYPE_SRARQ_DATA, (meshPacket: MeshPacket) => {
            this.onReceiveData(meshPacket);
        });
        mesh.setCallback(MESH_PACKET_TYPE_SRARQ_ACK, (meshPacket: MeshPacket) => {
            this.onReceiveAck(meshPacket);
        });
    }

    createSenderSession(address: P2PMacAddress): SRArqSenderSession | null {
        let senderSession = this.senderSessions.get(getAddressString(address));
        if (senderSession === undefined) {
            senderSession = new Map();
            this.senderSessions.set(getAddressString(address), senderSession);
        }

        const sessionId = this.getNextSenderSessionId(address);
        if (sessionId === SessionIdOperations.INVALID_SESSION_ID) {
            return null;
        }

        const session = new SRArqSenderSession(address, sessionId);
        senderSession.set(sessionId, session);

        return session;
    }

    createReceiverSession(address: P2PMacAddress, sessionId: number): SRArqReceiverSession | null {
        let receiverSession = this.receiverSessions.get(getAddressString(address));
        if (receiverSession === undefined) {
            receiverSession = new Map();
            this.receiverSessions.set(getAddressString(address), receiverSession);
        }

        if (receiverSession.has(sessionId)) {
            // すでにセッションが存在する
            return null;
        }

        const session = new SRArqReceiverSession(address, sessionId);
        receiverSession.set(sessionId, session);

        return session;
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

        if (this.lastSessionId.has(getAddressString(address))) {
            this.lastSessionId.set(getAddressString(address), -1);
        }

        for (let i = 0; i < SessionIdOperations.NUM_SESSION_IDS; i++) {
            const sessionId = SessionIdOperations.wrap(this.lastSessionId.get(getAddressString(address))! + 1);
            if (!senderSession.has(sessionId)) {
                this.lastSessionId.set(getAddressString(address), sessionId);
                return sessionId;
            }
        }

        return SessionIdOperations.INVALID_SESSION_ID;
    }
}

export const srarqSessionsController = new SRArqSessionsController();