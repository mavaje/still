import {getAuth, onAuthStateChanged, signInAnonymously, User} from "firebase/auth";
import {Unsubscribe} from "firebase/database";
import {app} from "./app";

const auth = getAuth(app);

export async function get_auth_user(): Promise<User> {
    if (!auth.currentUser) await signInAnonymously(auth);
    return auth.currentUser;
}

export function listen_to_auth_user(callback: (auth_user: User) => void): Unsubscribe {
    return onAuthStateChanged(auth, callback);
}
