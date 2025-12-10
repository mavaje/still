import {Model} from "./model";
import {User} from "./user";

export interface PrayerReference {
    prayer_id: string;
}

export class Prayer extends Model {
    static table = 'prayers';

    user_id?: string;
    title?: string;
    body?: string;
    image?: string;
    prays?: number = 0;
    answered?: boolean = false;

    async save(): Promise<this> {
        this.user_id ??= User.current.id;
        return super.save();
    }
}
