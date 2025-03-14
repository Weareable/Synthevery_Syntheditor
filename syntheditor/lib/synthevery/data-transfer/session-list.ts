// data-transfer/session-list.ts

import { SessionID, SessionCommandID } from './constants';
import { SenderSession, ReceiverSession } from './session'; // 修正

export class SenderSessionList { // クラス名を変更
    private sessions: Map<SessionID, SenderSession>; // 型を修正
    private lastSessionId: SessionID;

    constructor() {
        this.sessions = new Map();
        this.lastSessionId = 0;
    }

    registerSession(session: SenderSession): { sessionId: SessionID, session: SenderSession } | null { // 型を修正
        const sessionId = this.generateSessionID();
        if (sessionId === SessionCommandID.kInvalidSessionID) {
            return null;
        }
        this.sessions.set(sessionId, session);
        return { sessionId, session: this.sessions.get(sessionId)! };
    }

    removeSession(sessionId: SessionID): void {
        this.sessions.delete(sessionId);
    }

    getSession(sessionId: SessionID): SenderSession | undefined { // 型を修正
        return this.sessions.get(sessionId);
    }

    sessionExists(sessionId: SessionID): boolean {
        return this.sessions.has(sessionId);
    }

    getSessionCount(): number {
        return this.sessions.size;
    }

    canAddSession(): boolean {
        return this.getSessionCount() < SessionCommandID.kSessionIDMax;
    }
    checkSessions(): void {
        for (const [sessionId, session] of this.sessions) {
            if (!session.alive()) {
                this.sessions.delete(sessionId);
            }
        }
    }

    private generateSessionID(): SessionID {
        for (let i = 0; i <= SessionCommandID.kSessionIDMax; i++) {
            const sessionId = (this.lastSessionId + i) % (SessionCommandID.kSessionIDMax + 1);
            if (!this.sessionExists(sessionId)) {
                this.lastSessionId = sessionId;
                return sessionId;
            }
        }
        return SessionCommandID.kInvalidSessionID;
    }
}

export class ReceiverSessionList { // クラス名を変更
    private sessions: Map<SessionID, ReceiverSession>; // 型を修正

    constructor() {
        this.sessions = new Map();
    }

    registerSession(sessionId: SessionID, session: ReceiverSession): boolean { //型を修正
        if (!SessionCommandID.isValidSessionID(sessionId) || this.sessionExists(sessionId)) {
            return false;
        }
        this.sessions.set(sessionId, session);
        return true;
    }

    removeSession(sessionId: SessionID): void {
        this.sessions.delete(sessionId);
    }

    getSession(sessionId: SessionID): ReceiverSession | undefined { // 型を修正
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
                this.sessions.delete(sessionId);
            }
        }
    }
}