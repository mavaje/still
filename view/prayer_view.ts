import {List} from "../firebase/model/list";
import {Prayer} from "../firebase/model/prayer";
import {view} from "./view";

export function prayer_view(id: string, list: List) {
    return view.div(`prayer-${id}`)
        .set_up(prayer_text => prayer_text
            .sync_with('prayer', Prayer.find(id))
        )
        .classes('prayer')
        .children(({prayer}) => [
            view.div()
                .classes('bullet'),
            view.div()
                .classes(
                    'prayer-text',
                    !prayer.text.value?.trim() && 'empty',
                )
                .attributes({
                    contenteditable: prayer.is_mine(),
                })
                .children(prayer.text.value)
                .on('blur', target => {
                    const text = target.element.innerText
                        .replace(/\u200B/g, '')
                        .trim();
                    target.children(text);
                    prayer.write({text});
                })
                .on('keypress', (target, event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        const selection = document.getSelection();
                        const range = selection.getRangeAt(0);
                        range.deleteContents();

                        const new_line = document.createElement('br');
                        range.insertNode(new_line);
                        range.setStartAfter(new_line);
                        range.setEndAfter(new_line);

                        const zero_width_space = document.createTextNode('\u200B');
                        range.insertNode(zero_width_space);
                        range.setStartBefore(zero_width_space);
                        range.setEndBefore(zero_width_space);

                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }),
            view.div()
                .classes('buttons')
                .children(
                    view.input()
                        .attributes({
                            type: 'checkbox',
                            checked: prayer.answered.value,
                            disabled: !prayer.is_mine(),
                        })
                        .on('change', () => prayer.answered.write(!prayer.answered.value)),
                    view.button()
                        .children('share')
                        .on('click', () => console.log(prayer.id)),
                    view.button()
                        .classes('success')
                        .children(`pray\n${prayer.prays}`)
                        .on('click', () => prayer.pray()),
                ),
        ]);
}
