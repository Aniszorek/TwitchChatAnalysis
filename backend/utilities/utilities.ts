import {DateTime} from "luxon";

export const createTimestamp = (): string => {
    const now = DateTime.now().toUTC()
    return now.toFormat("yyyy-LL-dd HH:mm:ss") + now.toFormat("ZZ");

}