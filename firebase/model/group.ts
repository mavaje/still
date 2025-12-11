import {PrayerReference} from "./prayer";
import {OwnedModel} from "./owned-model";

export interface GroupReference {
    group_id: string;
}

export class Group extends OwnedModel {
    static table = 'groups';

    name: string;
    prayers?: PrayerReference[] = [];
}
