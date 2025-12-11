import {PrayerReference} from "../firebase/model/prayer";
import {view} from "./view";
import {GroupReference} from "../firebase/model/group";
import {prayer} from "./prayer";
import {group} from "./group";

export function prayer_list(references: (PrayerReference | GroupReference)[]) {
    return view.div()
        .classes('prayer-list')
        .children(
            ...references.map(reference =>
                'prayer_id' in reference
                    ? prayer(reference.prayer_id)
                    : group(reference.group_id)),
        );
}
