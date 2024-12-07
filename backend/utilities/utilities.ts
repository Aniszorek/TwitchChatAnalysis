import {DateTime} from "luxon";

export const createTimestamp = (): string => {
    const now = DateTime.now().toUTC()
    return now.toFormat("yyyy-LL-dd'T'HH:mm:ssZZ");
}

export const createTimestampWithoutDate = (): string => {
    const now = DateTime.now()
    return now.toFormat("HH:mm:ss")
}
