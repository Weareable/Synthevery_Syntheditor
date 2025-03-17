import { getSyntheveryInstance } from '../index';
import { P2PMacAddress } from '../types/mesh';
import EventEmitter from 'eventemitter3';
import { CommandHandler, CommandHandlerImpl } from '../../synthevery/connection/command-handler';
import { ARQPacketHandlerImpl } from '../../synthevery/connection/arq-packet-handler';

export type { CommandHandler };

export function getCommandHandler(nodeAddress: P2PMacAddress, create: boolean): CommandHandler | undefined {
    // TODO: コマンドハンドラーを取得する処理を実装する
    const synthevery = getSyntheveryInstance();
    if (create) {
        return new CommandHandlerImpl(
            (data) => {
                // Mesh 経由でデータを送信する処理を実装する
                synthevery.sendPacket(1, nodeAddress, data);
            },
            new ARQPacketHandlerImpl(
                (data) => {
                    // Mesh 経由でデータを送信する処理を実装する
                    synthevery.sendPacket(1, nodeAddress, data);
                },
                1000,
                3
            )
        );
    }
    return undefined;
}

export function getEventEmitter(nodeAddress: P2PMacAddress): EventEmitter<any> | undefined {
    // TODO: イベントエミッターを取得する処理を実装する
    const synthevery = getSyntheveryInstance();
    const commandHandler = synthevery.getCommandHandler(nodeAddress, false);
    return commandHandler?.eventEmitter;
}

export function isAvailable(nodeAddress: P2PMacAddress): boolean {
    // TODO: コマンドが利用可能かどうかを確認する処理を実装する
    const synthevery = getSyntheveryInstance();
    return synthevery.peerMacAddress?.address === nodeAddress.address;
}