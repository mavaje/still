import {User} from "./firebase/table/user";

User.get_current()
    .then(user => {
        document.body.innerHTML = user.id;
    });
