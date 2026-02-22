declare module 'asterisk-manager' {
    export default class AsteriskManager {
        constructor(port: number, host: string, username: string, secret: string, events?: boolean);
        connect(): void;
        disconnect(): void;
        on(event: string, callback: (data: any) => void): void;
        action(action: any, callback?: (err: any, res: any) => void): void;
    }
}
