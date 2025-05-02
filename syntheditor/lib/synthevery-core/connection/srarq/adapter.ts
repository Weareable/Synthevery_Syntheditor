import { P2PMacAddress } from "../../types/mesh";
import { MESH_PACKET_TYPE_SRARQ_DATA, MESH_PACKET_TYPE_SRARQ_ACK } from "../constants";
import { mesh } from "../mesh";
import { PacketTransmitter, SequenceNumberOperations } from "@/lib/srarq/srarq"


export interface DataPacket {
    sessionId: number;
    sequenceNumber: number;
    data: Uint8Array;
}

export interface AckPacket {
    sessionId: number;
    sequenceNumber: number;
    ack: boolean;
}

export function serializeDataPacket(packet: DataPacket): Uint8Array {
    const buffer = new Uint8Array(packet.data.length + 2);
    buffer[0] = packet.sessionId;
    buffer[1] = packet.sequenceNumber;
    buffer.set(packet.data, 2);
    return buffer;
}

export function deserializeDataPacket(buffer: Uint8Array): DataPacket | null {
    if (buffer.length < 2) {
        return null;
    }
    return {
        sessionId: buffer[0],
        sequenceNumber: buffer[1],
        data: buffer.slice(2),
    };
}

export function serializeAckPacket(packet: AckPacket): Uint8Array {
    const buffer = new Uint8Array(3);
    buffer[0] = packet.sessionId;
    buffer[1] = packet.sequenceNumber;
    buffer[2] = packet.ack ? 1 : 0;
    return buffer;
}

export function deserializeAckPacket(buffer: Uint8Array): AckPacket | null {
    if (buffer.length < 3) {
        return null;
    }
    return {
        sessionId: buffer[0],
        sequenceNumber: buffer[1],
        ack: buffer[2] === 1,
    };
}

export function getMeshPacketTransmitter(sessionId: number, address: P2PMacAddress): PacketTransmitter {
    return {
        transmitData(sequenceNumber: number, data: Uint8Array): Promise<void> {
            const packet = serializeDataPacket({ sessionId, sequenceNumber, data });
            return mesh.sendPacket(MESH_PACKET_TYPE_SRARQ_DATA, address, packet);
        },
        transmitAck(sequenceNumber: number): Promise<void> {
            const packet = serializeAckPacket({ sessionId, sequenceNumber, ack: true });
            return mesh.sendPacket(MESH_PACKET_TYPE_SRARQ_ACK, address, packet);
        },
        transmitNack(sequenceNumber: number): Promise<void> {
            const packet = serializeAckPacket({ sessionId, sequenceNumber, ack: false });
            return mesh.sendPacket(MESH_PACKET_TYPE_SRARQ_ACK, address, packet);
        },
    }
}

export const uint8SequenceNumberOperations: SequenceNumberOperations = {
    increment: (sequenceNumber: number, quantity: number) => (sequenceNumber + quantity) % 256,
    decrement: (sequenceNumber: number, quantity: number) => (sequenceNumber - quantity + 256) % 256,
    isInRange: (sequenceNumber: number, start: number, end: number) => {
        if (start > end) {
            return sequenceNumber >= start || sequenceNumber <= end;
        }
        return sequenceNumber >= start && sequenceNumber <= end;
    },
    isNewer: (sequenceNumber: number, otherSequenceNumber: number) => {
        return uint8SequenceNumberOperations.isInRange(sequenceNumber, otherSequenceNumber, uint8SequenceNumberOperations.increment(otherSequenceNumber, 128));
    },
    difference: (sequenceNumber: number, otherSequenceNumber: number) => {
        return (sequenceNumber - otherSequenceNumber + 256) % 256;
    },
}

