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