import {getAuth, signInAnonymously, User} from "firebase/auth";
import {app} from "./app";

export const auth = getAuth(app);

export async function get_auth_user(): Promise<User> {
    if (!auth.currentUser) await signInAnonymously(auth);
    return auth.currentUser;
}
