import {PrayerReference} from "./model";
import {OwnedModel} from "./owned-model";
import {Field} from "./field";
import {increment} from "@firebase/firestore";

export class Prayer extends OwnedModel {
    static table = 'prayers';

    text = new Field<string>(this, 'text');
    prays = new Field<number>(this, 'prays', 0);
    answered = new Field<boolean>(this, 'answered', false);

    item_reference(): PrayerReference {
        return {
            prayer_id: this.id,
        };
    }

    async pray() {
        return this.prays.write(increment(1));
    }
}
