import { decode, encode } from "@msgpack/msgpack";

export interface P2PMacAddress {
    address: Uint8Array;
}

export interface MeshPacket {
    type: number;
    source: P2PMacAddress;
    destination: P2PMacAddress;
    data: Uint8Array;
    index: number;
}

export interface NeighborListData {
    sender: P2PMacAddress;
    neighbor_addresses: P2PMacAddress[];
    sent_addresses: P2PMacAddress[];
}

export function decodeMeshPacket(data: Uint8Array): MeshPacket {
    const decodedObject = decode(data.buffer);
    if (decodedObject instanceof Array) {
        return {
            type: decodedObject[0],
            source: { address: new Uint8Array(decodedObject[1][0]) },
            destination: { address: new Uint8Array(decodedObject[2][0]) },
            data: new Uint8Array(decodedObject[3]),
            index: decodedObject[4],
        };
    }
    throw new Error("Invalid MeshPacket");
}

export function encodeMeshPacket(packet: MeshPacket): Uint8Array {
    return new Uint8Array(encode([
        packet.type,
        [Array.from(packet.source.address)],
        [Array.from(packet.destination.address)],
        Array.from(packet.data),
        packet.index,
    ]));
}

