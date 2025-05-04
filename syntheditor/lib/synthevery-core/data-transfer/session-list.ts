// data-transfer/session-list.ts

import { SessionID, SessionCommandID } from './constants';
import { SenderSession, ReceiverSession } from './session'; // 修正
import { EventEmitter } from 'eventemitter3';


interface SessionListEvents {
    sessionDead: (sessionId: SessionID) => void;
}

export class SessionList<T extends SenderSession | ReceiverSession> { // クラス名を変更
    private sessions: Map<SessionID, T>; // 型を修正
    public readonly eventEmitter = new EventEmitter<SessionListEvents>();

    constructor() {
        this.sessions = new Map();
    }

    registerSession(sessionId: SessionID, session: T): boolean { //型を修正
        if (!SessionCommandID.isValidSessionID(sessionId) || this.sessionExists(sessionId)) {
            return false;
        }
        this.sessions.set(sessionId, session);
        return true;
    }

    removeSession(sessionId: SessionID): void {
        this.sessions.delete(sessionId);
    }

    getSession(sessionId: SessionID): T | undefined { // 型を修正
        return this.sessions.get(sessionId);
    }

    sessionExists(sessionId: SessionID): boolean {
        return this.sessions.has(sessionId);
    }

    getSessionCount(): number {
        return this.sessions.size;
    }

    checkSessions(): void {
        for (const [sessionId, session] of this.sessions) {
            if (!session.alive()) {
                this.eventEmitter.emit('sessionDead', sessionId);
                this.sessions.delete(sessionId);
            }
        }
    }
}