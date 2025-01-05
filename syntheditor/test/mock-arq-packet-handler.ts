import { ARQPacketHandler, ARQPacketHandlerImpl } from '@/lib/synthevery/connection/arq-packet-handler';
import { CommandID, CommandResult } from '@/types/command';
import EventEmitter from 'eventemitter3';

export class MockARQPacketHandler implements ARQPacketHandler {
    sendPacket = jest.fn();
    handlePacket = jest.fn();
    reset = jest.fn();
    setDataHandler = jest.fn();
    setAckHandler = jest.fn();
    isWaitingForAck = jest.fn();
    eventEmitter = new EventEmitter<{ ackCompleted: { index: number }, ackTimeout: { index: number } }>();
}

export class MockCommandClientInterface {
    generateData = jest.fn((command: CommandID) => new Uint8Array([1, 2, 3]));
    handleData = jest.fn((command: CommandID, data: Uint8Array): [boolean, Uint8Array] => [true, new Uint8Array([4, 5, 6])]);
    handleAck = jest.fn((command: CommandID, data: Uint8Array) => true);
    onComplete = jest.fn((commandId: CommandID) => { });
    onTimeout = jest.fn((commandId: CommandID) => { });
    getClientID = jest.fn(() => 1)
}