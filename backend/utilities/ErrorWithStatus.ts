export class ErrorWithStatus extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "ErrorWithStatus";
        this.status = status;
    }
}