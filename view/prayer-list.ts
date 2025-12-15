import {List} from "../firebase/model/list";
import {view} from "./view";
import {prayer_view} from "./prayer_view";
import {list_view} from "./list_view";

export function prayer_list(list: List) {
    return view.div()
        .set_up(prayer_list => prayer_list
            .sync_with('list', list))
        .classes('prayer-list')
        .children(({list}) => list.items
            .map(reference =>
                'prayer_id' in reference
                    ? prayer_view(reference.prayer_id, list)
                    : list_view(reference.list_id)),
        );
}
