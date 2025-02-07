import { decode, encode } from "@msgpack/msgpack";
import { MeshPacket, P2PMacAddress, NeighborListData } from "@/types/mesh";

export function decodeMeshPacket(data: Uint8Array): MeshPacket {
    const decodedObject = decode(data);
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

export function getAddressFromString(addressString: string): P2PMacAddress {
    return { address: new Uint8Array(addressString.split(':').toReversed().map(byte => parseInt(byte, 16))) };
}

export function getAddressString(address: P2PMacAddress | string | Uint8Array): string {
    if (typeof address === 'string') {
        return getAddressString(getAddressFromString(address));
    }
    if (address instanceof Uint8Array) {
        return getAddressString({ address: address });
    }
    return Array.from(address.address.toReversed()).map((byte) => byte.toString(16).padStart(2, '0')).join(':');
}

export function equalsAddress(a: P2PMacAddress, b: P2PMacAddress): boolean {
    return a.address.length === b.address.length && a.address.every((value, index) => value === b.address[index]);
}

