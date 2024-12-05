import {DateTime} from "luxon";

export const createTimestamp = (): string => {
    const now = DateTime.now().toUTC()
    return now.toFormat("yyyy-LL-dd HH:mm:ss") + now.toFormat("ZZ");

}

export const createTimestampWithoutDate = (): string => {
    const now = DateTime.now()
    return now.toFormat("HH:mm:ss")
}

export function encodeTimestamp(timestamp: string): string {
    return timestamp
        .replace(/:/g, '%3A')
        .replace(/\+/g, '%2B')
        .replace(/ /g, '%2B');
}