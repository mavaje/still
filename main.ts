import {User} from "./firebase/model/user";
import {load_document, view} from "./view/view";

load_document().then(root => root
    .children(() => [
        view.header()
            .children(
                view.img('logo').attributes({
                    src: 'dist/icon.svg',
                    alt: 'Logo',
                }),
                view.h1().children('Still')
            ),
        view.main()
            .listen_to('user', User.current)
            .children(({user}) => [
                user.id ?? 'Not logged in',
            ]),
    ])
);
