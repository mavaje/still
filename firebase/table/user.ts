import {Table} from "./table";
import {get_auth_user} from "../auth";
import {PrayerReference} from "./prayer";
import {GroupReference} from "./group";

export class User extends Table {
    static table = 'users';

    static current: User = null;

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
}
