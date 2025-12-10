import {Model} from "./model";
import {auth, get_auth_user} from "../auth";
import {PrayerReference} from "./prayer";
import {GroupReference} from "./group";
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
}
