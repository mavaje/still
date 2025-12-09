import {Table} from "./table";
import {PrayerReference} from "./prayer";
import {User} from "./user";

export interface GroupReference {
    group_id: string;
}

export class Group extends Table {
    static table = 'groups';

    user_id: string;
    name: string;
    prayers?: PrayerReference[] = [];

    async save(): Promise<this> {
        this.user_id = User.current.id;
        return super.save();
    }
}
