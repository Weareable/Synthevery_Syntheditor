export interface CommandID {
    client_id: number;
    type: number;
}

export interface CommandResult {
    command: CommandID;
    result: number;
}