import {Prayer} from "../firebase/model/prayer";
import {clean_text, view} from "./view";

export function prayer(id: string) {
    return view.div()
        .sync_with('prayer', Prayer.shell(id))
        .classes(({prayer}) => [
            'prayer',
            !prayer.title?.trim() && 'no-title',
            !prayer.body?.trim() && 'no-body',
        ])
        .children(({prayer}) => [
            view.div()
                .classes('title')
                .attributes({contenteditable: prayer.is_mine()})
                .children(clean_text(prayer.title))
                .on('blur', ({target}) => {
                    const title = (target as HTMLElement).innerText;
                    prayer.update({title});
                }),
            view.div()
                .classes('body')
                .attributes({contenteditable: prayer.is_mine()})
                .children(clean_text(prayer.body))
                .on('blur', ({target}) => {
                    const body = (target as HTMLInputElement).value;
                    prayer.update({body});
                }),
        ]);
}
