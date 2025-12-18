import {Model} from "./model";
import {get_auth_user, listen_to_auth_user} from "../auth";
import {Field} from "./field";
import {doc, Unsubscribe} from "@firebase/firestore";

export class User extends Model {
    static table = 'users';

    static auth: User = new User(true);

    email = new Field<string>(this, 'email', async () => (await get_auth_user()).email);

    constructor(protected is_auth = false) {
        super();
        if (this.is_auth) {
            listen_to_auth_user(auth_user => {
                this.reference = doc(User.collection(), auth_user.uid);
                this.snapshot = null;
            });
        }
    }

    static async get_current(): Promise<User> {
        const auth_user = await get_auth_user();
        return User.auth = await User.find(auth_user.uid).initialise();
    }

    can_write(): boolean {
        return this.id === User.auth.id;
    }

    listen(callback: (object: this) => void): Unsubscribe {
        if (this.is_auth) {
            let unsubscribe_user: Unsubscribe = null;
            const unsubscribe_auth = listen_to_auth_user(async () => {
                const user = await User.get_current();
                this.replace_with(user);
                unsubscribe_user?.();
                unsubscribe_user = super.listen(callback);
            });

            return () => {
                unsubscribe_auth();
                unsubscribe_user?.();
            };
        } else {
            return super.listen(callback);
        }
    }
}
