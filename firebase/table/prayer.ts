import {Table} from "./table";
import {PrayerData} from "../schema";

export class Prayer extends Table<PrayerData> {

    static table = 'prayers';

    declare static find: (id: string) => Promise<Prayer>;
}
