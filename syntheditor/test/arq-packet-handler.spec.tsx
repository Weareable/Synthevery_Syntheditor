// ARQPacketHandlerImpl.test.ts
import { ARQPacketHandlerImpl } from '@/lib/synthevery/connection/arq-packet-handler';
import { EventEmitter } from 'eventemitter3';

// モックのpacketSender
const createMockPacketSender = () => {
    return jest.fn();
};

describe('ARQPacketHandlerImpl (Unit Test)', () => {
    let packetSender: ReturnType<typeof createMockPacketSender>;
    let arqHandler: ARQPacketHandlerImpl;

    beforeEach(() => {
        packetSender = createMockPacketSender();
        arqHandler = new ARQPacketHandlerImpl(packetSender);
        jest.useFakeTimers();
        jest.clearAllMocks();
    });
    afterEach(() => {
        jest.useRealTimers()
    })
    it('sendPacket should send a packet with correct header and data', () => {
        const data = new Uint8Array([1, 2, 3]);
        arqHandler.sendPacket(data);
        expect(packetSender).toHaveBeenCalledTimes(1);
        const sentPacket = packetSender.mock.calls[0][0];
        expect(sentPacket[0]).toBe(0); // index
        expect(sentPacket.slice(1)).toEqual(data);
    });

    it('should not send packet if waiting for ACK', () => {
        const data = new Uint8Array([1, 2, 3]);
        arqHandler.sendPacket(data);
        const [result, index] = arqHandler.sendPacket(data);
        expect(result).toBe(false);
        expect(index).toBe(0);
        expect(packetSender).toHaveBeenCalledTimes(1);
    });

    it('handlePacket should handle data packets correctly', () => {
        const mockDataHandler = jest.fn(
            (index: number, data: Uint8Array): [boolean, Uint8Array] => [true, new Uint8Array([4, 5, 6])]
        );
        arqHandler.setDataHandler(mockDataHandler);

        const data = new Uint8Array([0, 1, 2, 3]);
        arqHandler.handlePacket(data);

        expect(mockDataHandler).toHaveBeenCalledTimes(1);
        expect(mockDataHandler).toHaveBeenCalledWith(0, new Uint8Array([1, 2, 3]));
        expect(packetSender).toHaveBeenCalledTimes(1);
        const sentPacket = packetSender.mock.calls[0][0];
        expect(sentPacket[0]).toBe(0x80);
        expect(sentPacket.slice(1)).toEqual(new Uint8Array([4, 5, 6]));
    });

    it('handlePacket should not handle duplicate data packets', () => {
        const mockDataHandler = jest.fn(
            (index: number, data: Uint8Array): [boolean, Uint8Array] => [true, new Uint8Array([4, 5, 6])]
        );
        arqHandler.setDataHandler(mockDataHandler);

        const data = new Uint8Array([0, 1, 2, 3]);
        arqHandler.handlePacket(data);
        arqHandler.handlePacket(data);

        expect(mockDataHandler).toHaveBeenCalledTimes(1);
        expect(packetSender).toHaveBeenCalledTimes(2);
    });

    it('handlePacket should handle ack packets correctly', () => {
        const mockAckHandler = jest.fn((index: number, data: Uint8Array) => true);
        arqHandler.setAckHandler(mockAckHandler);
        const data = new Uint8Array([1, 2, 3]);
        arqHandler.sendPacket(data);
        const ackPacket = new Uint8Array([0x80, 0]);
        arqHandler.handlePacket(ackPacket);

        expect(mockAckHandler).toHaveBeenCalledTimes(1);
        expect(mockAckHandler).toHaveBeenCalledWith(0, new Uint8Array([0]));
        expect(arqHandler.isWaitingForAck()).toBe(false);
    });

    it('handlePacket should ignore invalid ack packets', () => {
        const mockAckHandler = jest.fn((index: number, data: Uint8Array) => true);
        arqHandler.setAckHandler(mockAckHandler);
        const data = new Uint8Array([1, 2, 3]);
        arqHandler.sendPacket(data);
        const ackPacket = new Uint8Array([0x80 | 1, 0]);
        arqHandler.handlePacket(ackPacket);

        expect(mockAckHandler).not.toHaveBeenCalled();
        expect(arqHandler.isWaitingForAck()).toBe(true);
    });
    it('should emit ackCompleted event on successful ACK', () => {
        const mockAckHandler = jest.fn((index: number, data: Uint8Array) => true);
        arqHandler.setAckHandler(mockAckHandler);
        const data = new Uint8Array([1, 2, 3]);
        const ackCompletedCallback = jest.fn();
        arqHandler.eventEmitter.on('ackCompleted', ackCompletedCallback);
        arqHandler.sendPacket(data);
        const ackPacket = new Uint8Array([0x80, 0]);
        arqHandler.handlePacket(ackPacket);

        expect(ackCompletedCallback).toHaveBeenCalledTimes(1);
        expect(ackCompletedCallback).toHaveBeenCalledWith({ index: 0 });
    });

    it('should emit ackTimeout event on resend timeout', () => {
        const ackTimeoutCallback = jest.fn();
        arqHandler.eventEmitter.on('ackTimeout', ackTimeoutCallback);
        const data = new Uint8Array([1, 2, 3]);
        arqHandler.sendPacket(data);

        jest.advanceTimersByTime(1100)

        expect(ackTimeoutCallback).toHaveBeenCalledTimes(1);
        expect(ackTimeoutCallback).toHaveBeenCalledWith({ index: 0 });
    });
    it('reset should reset the state', () => {
        const data = new Uint8Array([1, 2, 3]);
        arqHandler.sendPacket(data);
        arqHandler.reset();
        expect(arqHandler.isWaitingForAck()).toBe(false);
    });
    it('should send a packet with resend flag', () => {
        const data = new Uint8Array([1, 2, 3]);
        arqHandler.sendPacket(data);
        expect(packetSender).toHaveBeenCalledTimes(1);
        jest.clearAllMocks();
        const [result, index] = arqHandler.sendPacket(data, true);
        expect(result).toBe(true);
        expect(index).toBe(0);
        expect(packetSender).toHaveBeenCalledTimes(1);
    });
});