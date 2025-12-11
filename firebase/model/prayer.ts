import {OwnedModel} from "./owned-model";

export interface PrayerReference {
    prayer_id: string;
}

export class Prayer extends OwnedModel {
    static table = 'prayers';

    title?: string;
    body?: string;
    image?: string;
    prays?: number = 0;
    answered?: boolean = false;
}
