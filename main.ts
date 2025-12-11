import {User} from "./firebase/model/user";
import {load_document, view} from "./view/view";
import {Service} from "./service";
import {prayer_list} from "./view/prayer-list";

load_document().then(async root => {
    await User.get_current();

    root.children(() => [
            view.header()
                .children(
                    view.img('logo').attributes({
                        src: 'dist/icon.svg',
                        alt: 'Logo',
                    }),
                    view.h1().children('Still')
                ),
            view.main()
                .sync_with('user', User.current)
                .children(({user}) =>
                    [
                        prayer_list(user.prayers),
                        view.button('add-prayer')
                            .children('New Prayer')
                            .on('click', Service.create_prayer),
                        view.button('add-group')
                            .children('New Group')
                            .on('click', Service.create_group),
                    ]
                ),
        ]);
    }
);
