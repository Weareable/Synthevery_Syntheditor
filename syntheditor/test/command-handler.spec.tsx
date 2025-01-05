import { CommandHandlerImpl } from "@/lib/synthevery/connection/command-handler";
import { CommandID } from "@/types/command";
import { MockCommandClientInterface } from "./mock-arq-packet-handler";
import { ARQPacketHandlerImpl } from "@/lib/synthevery/connection/arq-packet-handler";
import { EventEmitter } from "eventemitter3";
import { MockARQPacketHandler } from "./mock-arq-packet-handler";

describe("CommandHandlerImpl (Integration Test)", () => {
    let commandHandler: CommandHandlerImpl;
    let mockPacketSender: jest.Mock;
    let mockClient: MockCommandClientInterface;
    let arqPacketHandler: ARQPacketHandlerImpl;
    beforeEach(() => {
        console.log("---");
        console.log(expect.getState().currentTestName);
        console.log("---");
        mockPacketSender = jest.fn();
        arqPacketHandler = new ARQPacketHandlerImpl(mockPacketSender);
        commandHandler = new CommandHandlerImpl(mockPacketSender, arqPacketHandler);
        mockClient = new MockCommandClientInterface();
        commandHandler.setClientInterface(mockClient);
        jest.useFakeTimers();
        jest.clearAllMocks();
    });
    afterEach(() => {
        jest.useRealTimers();
    })
    it('should send a command packet correctly', () => {
        const command: CommandID = { client_id: 1, type: 1 };
        commandHandler.pushCommand(command);
        expect(mockPacketSender).toHaveBeenCalledTimes(1);
        const sentPacket = mockPacketSender.mock.calls[0][0];
        const expected = new Uint8Array([0, 1, 1, 1, 2, 3]);
        expect(sentPacket).toEqual(expected);
    });
    it('should handle data packet correctly', () => {
        const data = new Uint8Array([0, 1, 1, 2, 3]);
        commandHandler.handlePacket(data);
        expect(mockClient.handleData).toHaveBeenCalledTimes(1);
        expect(mockPacketSender).toHaveBeenCalledTimes(1);
        const sentPacket = mockPacketSender.mock.calls[0][0];
        const expected = new Uint8Array([0x80, 0, 0, 4, 5, 6]);
        expect(sentPacket).toEqual(expected);
    });
    it('should handle ack packet correctly', () => {
        const command: CommandID = { client_id: 1, type: 1 };
        commandHandler.pushCommand(command);
        expect(mockPacketSender).toHaveBeenCalledTimes(1);

        const sentPacket = mockPacketSender.mock.calls[0][0];
        const expected = new Uint8Array([0, 1, 1, 1, 2, 3]);
        expect(sentPacket).toEqual(expected);

        const header = new Uint8Array([0x80]);
        const ackPacket = new Uint8Array(header.length + 3);
        ackPacket.set(header, 0);
        ackPacket.set(new Uint8Array([1, 1, 0]), header.length);
        commandHandler.handlePacket(ackPacket);
        expect(mockClient.handleAck).toHaveBeenCalledTimes(1);
    });
    it('should emit commandCompleted event on ackCompleted', () => {
        const command: CommandID = { client_id: 1, type: 1 };
        commandHandler.pushCommand(command);
        const commandCompletedCallback = jest.fn();
        commandHandler.eventEmitter.on('commandCompleted', commandCompletedCallback);
        const data = new Uint8Array([0x80, 1, 1, 0]);
        commandHandler.handlePacket(data);
        expect(commandCompletedCallback).toHaveBeenCalledTimes(1);
        expect(commandCompletedCallback).toHaveBeenCalledWith({ command });
        expect(mockClient.onComplete).toHaveBeenCalledTimes(1);
        expect(mockClient.onComplete).toHaveBeenCalledWith(command);
    });

    it('should emit commandTimeout event on ackTimeout', () => {
        const command: CommandID = { client_id: 1, type: 1 };
        commandHandler.pushCommand(command);
        const commandTimeoutCallback = jest.fn();
        commandHandler.eventEmitter.on('commandTimeout', commandTimeoutCallback);
        // @ts-ignore
        jest.advanceTimersByTime(1100);
        expect(commandTimeoutCallback).toHaveBeenCalledTimes(1);
        expect(commandTimeoutCallback).toHaveBeenCalledWith({ command });
        expect(mockClient.onTimeout).toHaveBeenCalledTimes(1);
        expect(mockClient.onTimeout).toHaveBeenCalledWith(command);
    });
    it('should use mock arqPacketHandler', () => {
        const mockArqPacketHandler = new MockARQPacketHandler();
        commandHandler = new CommandHandlerImpl(mockPacketSender, mockArqPacketHandler);
        commandHandler.setClientInterface(mockClient)
        const command: CommandID = { client_id: 1, type: 1 };
        commandHandler.pushCommand(command);
        expect(mockArqPacketHandler.sendPacket).toHaveBeenCalledTimes(1);
    });
});