import { decode, encode } from "@msgpack/msgpack";
import { MeshPacket, P2PMacAddress, NeighborListData } from "@/types/mesh";

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
        [packet.source.address], // P2PMacAddress は配列でラップする(構造体だから)
        [packet.destination.address],
        packet.data,
        packet.index,
    ]));
}

export function encodeNeighborListData(data: NeighborListData): Uint8Array {
    return new Uint8Array(encode([
        // 1. P2PMacAddress は配列でラップする(構造体だから)
        [data.sender.address],

        // 2. neighbor は「複数ある」→ それぞれ [bin(6)] の形にする
        data.neighbor_addresses.map(nb => [nb.address]),

        // 3. sent も同様
        data.sent_addresses.map(sent => [sent.address]),
    ]));
}