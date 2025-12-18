import {User} from "./firebase/model/user";
import {Prayer} from "./firebase/model/prayer";
import {Timer} from "./timer";
import {load_document, view} from "./view/view";
import {get_auth_user} from "./firebase/auth";
import {List} from "./firebase/model/list";
import {Service} from "./service";
import {prayer_list} from "./view/prayer-list";

const timer = Timer.start();

load_document().then(async root => {
    timer.checkpoint('load document');

    await get_auth_user();
    timer.checkpoint('load auth user');

    await User.get_current();
    timer.checkpoint('load current user');

    List.find(User.auth.id);
    timer.checkpoint('load current list');

    const url = new URL(location.href);

    const prayer_id = url.searchParams.get('prayer_id');
    if (prayer_id) {
        const prayer = await Prayer.find(prayer_id);
        if (prayer) {
            await Service.add_item(prayer, List.root);
        }
    }
    timer.checkpoint('checking prayer param');

    const list_id = url.searchParams.get('list_id');
    if (list_id) {
        const list = await List.find(list_id);
        if (list) {
            await Service.add_item(list, List.root);
        }
    }
    timer.checkpoint('checking list param');

    root.children(
        view.header(),
        view.main()
            .sync_with('user', User.auth)
            .children(() => [
                view.div()
                    .children(prayer_list(List.root)),
                view.button('add-prayer')
                    .children('New Prayer')
                    .on('click', () => Service.create_prayer(List.root)),
                view.button('add-list')
                    .children('New List')
                    .on('click', () => Service.create_list(List.root)),
            ])
    );
    timer.checkpoint('rendered');

    timer.log();
});
