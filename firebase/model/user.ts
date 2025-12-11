import {Model} from "./model";
import {auth, get_auth_user} from "../auth";
import {Prayer, PrayerReference} from "./prayer";
import {Group, GroupReference} from "./group";
import {Unsubscribe} from "@firebase/database";
import {onAuthStateChanged} from "@firebase/auth";

export class User extends Model {
    static table = 'users';

    static current: User = new User();

    email: string;
    name?: string;
    prayers?: (PrayerReference | GroupReference)[] = [];

    static async get_current(): Promise<User> {
        const auth_user = await get_auth_user();

        return User.current = await User.find_or_create({
            id: auth_user.uid,
            email: auth_user.email,
        });
    }

    listen(callback: (object: this) => void): Unsubscribe {
        let unsubscribe_user: Unsubscribe = null;
        const unsubscribe_auth = onAuthStateChanged(auth, async user => {
            this.id = user.uid;
            unsubscribe_user?.();
            unsubscribe_user = super.listen(callback);
        });

        return () => {
            unsubscribe_auth();
            unsubscribe_user?.();
        };
    }

    async add_prayer(prayer: Prayer): Promise<void> {
        this.prayers.push({prayer_id: prayer.id});
        await this.save();
    }

    async add_group(group: Group): Promise<void> {
        this.prayers.push({group_id: group.id});
        await this.save();
    }

    async process_reference<P, G>(
        reference: PrayerReference | GroupReference,
        process_prayer: (prayer: Prayer) => P,
        process_group: (group: Group) => G,
    ): Promise<P | G> {
        if ('prayer_id' in reference) {
            const prayer = await Prayer.find(reference.prayer_id);
            return process_prayer(prayer);
        } else {
            const group = await Group.find(reference.group_id);
            return process_group(group);
        }
    }
}
