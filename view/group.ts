import {view} from "./view";
import {Group} from "../firebase/model/group";
import {prayer_list} from "./prayer-list";

export function group(id: string) {
    return view.div()
        .sync_with('group', Group.shell(id))
        .classes('group')
        .children(({group}) => [
            view.div().children(group.name),
            prayer_list(group.prayers),
        ]);
}
