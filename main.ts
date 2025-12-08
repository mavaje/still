import {User} from "./firebase/schema";
import {get, ref, set} from "@firebase/database";
import {database} from "./firebase/database";

const user: User = {
    id: '1234567',
    name: 'Matthew',
    email: 'matthre@mail.com',
    prayers: [],
};

set(ref(database, `users/${user.id}`), user)
    .then(() => console.log('Saved user!'));

get(ref(database, `users/${user.id}`))
    .then(snapshot => console.log(snapshot.val()));
