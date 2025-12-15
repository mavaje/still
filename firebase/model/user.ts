import {Model} from "./model";
import {get_auth_user, listen_to_auth_user} from "../auth";
import {Unsubscribe} from "firebase/database";

export class User extends Model {
    static table = 'users';

    static current: User = new User();

    email?: string;
    list_id?: string;

    static async get_current(): Promise<User> {
        const auth_user = await get_auth_user();

        return User.current = await User.find_or_create({
            id: auth_user.uid,
            email: auth_user.email,
            list_id: Model.random_id(),
        });
    }

    can_write(): boolean {
        return this.id === User.current.id;
    }

    listen(callback: (object: this) => void): Unsubscribe {
        let unsubscribe_user: Unsubscribe = null;
        const unsubscribe_auth = listen_to_auth_user(async auth_user => {

            this.id = auth_user.uid;
            this.email = auth_user.email;

            unsubscribe_user?.();
            unsubscribe_user = super.listen(callback);
        });

        return () => {
            unsubscribe_auth();
            unsubscribe_user?.();
        };
    }
}
