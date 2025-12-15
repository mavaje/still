import {PrayerReference} from "./model";
import {OwnedModel} from "./owned-model";

export class Prayer extends OwnedModel {
    static table = 'prayers';

    text?: string;
    prays?: number = 0;
    answered?: boolean = false;

    item_reference(): PrayerReference {
        return {
            prayer_id: this.id,
        };
    }

    async pray() {
        return this.transaction(prayer => {
            if (prayer) prayer.prays++;
            return prayer;
        });
    }

    async answer(answered = !this.answered) {
        this.answered = answered;
        return this.save();
    }
}
