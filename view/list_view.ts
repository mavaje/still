import {view} from "./view";
import {List} from "../firebase/model/list";
import {prayer_list} from "./prayer-list";

export function list_view(id: string) {
    return view.div(`list-${id}`)
        .sync_with('list', List.find(id))
        .classes('list')
        .children(({list}) => [
            view.div()
                .classes('list-header')
                .children(
                    view.div()
                        .classes('list-name', !list.name.value.trim() && 'empty')
                        .attributes({
                            contenteditable: list?.is_mine(),
                        })
                        .children(list.name.value)
                        .on('blur', target => {
                            const name = target.element.innerText.trim();
                            list?.write({name});
                        })
                        .on('keypress', (target, event) => {
                            if (event.key === 'Enter') {
                                target.element.blur();
                            }
                        })
                        .if(!list?.name?.value.trim(), target => target
                            .once('connect', target => {
                                const {width} = window.getComputedStyle(target.element, '::before');
                                target.attributes({style: `min-width: ${width}`});
                            })
                        )
                ),
            prayer_list(list),
        ]);
}
