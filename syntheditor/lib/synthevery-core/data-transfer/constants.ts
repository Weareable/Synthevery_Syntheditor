// data-transfer/constants.ts
export type CommandType = number;
export type SessionID = number;

export const kChunkSize = 192;

export namespace SessionCommandID {
    export const kSessionIDBits = 5;
    export const kCommandTypeBits = 3;
    export const kSessionIDMask = (1 << kSessionIDBits) - 1;
    export const kCommandTypeMask = (1 << kCommandTypeBits) - 1;

    export const kInvalidSessionID = kSessionIDMask + 1;
    export const kSessionIDMax = kSessionIDMask;

    export const kRequest: CommandType = 0x00;
    export const kResponse: CommandType = 0x01;
    export const kReject: CommandType = 0x02;
    export const kCancel: CommandType = 0x03;
    export const kResult: CommandType = 0x06;
    export const kGetStatus: CommandType = 0x07;

    export function toCommandIDType(commandType: CommandType, sessionId: SessionID): number {
        return ((sessionId & kSessionIDMask) << kCommandTypeBits) | (commandType & kCommandTypeMask);
    }

    export function fromCommandID(commandIdType: number): { commandType: CommandType, sessionId: SessionID } {
        const commandType = commandIdType & kCommandTypeMask;
        const sessionId = (commandIdType >> kCommandTypeBits) & kSessionIDMask;
        return { commandType, sessionId };
    }

    export function isValidSessionID(sessionId: SessionID): boolean {
        return sessionId <= kSessionIDMask;
    }
}

export type SessionStatusType = number;

export namespace SessionStatus {
    export const kStatusPending: SessionStatusType = 0x00;
    export const kStatusTimeout: SessionStatusType = 0x01;
    export const kStatusTransferring: SessionStatusType = 0x02;
    export const kStatusInvalidPosition: SessionStatusType = 0x03;
    export const kStatusCanceled: SessionStatusType = 0x04;
    export const kStatusRejected: SessionStatusType = 0x05;
    export const kStatusCompleted: SessionStatusType = 0x06;
}