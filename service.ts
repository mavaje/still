import {Prayer} from "./firebase/model/prayer";
import {List} from "./firebase/model/list";

export class Service {
    static async create_prayer(parent: List): Promise<Prayer> {
        const prayer = await Prayer.new();
        return Service.add_item(prayer, parent);
    }

    static async create_list(parent: List): Promise<List> {
        const list = await List.new();
        return Service.add_item(list, parent);
    }

    static async add_item<T extends Prayer | List>(item: T, list: List): Promise<T> {
        if (list.can_write()) {
            list.items.push(item.item_reference());
            // await list.save();
        }
        return item;
    }

    static async move_item(item: Prayer | List, list_old: List, list_new: List): Promise<void> {
        await Service.remove_item(item,list_old);
        await Service.add_item(item, list_new);
    }

    static async remove_item(item: Prayer | List, list: List): Promise<void> {
        if (item && list?.can_write()) {
            const item_key = item instanceof Prayer ? 'prayer_id' : 'list_id';
            list.items = list.items
                .filter(reference => reference[item_key] !== item.id);
            // await list.save();
        }
    }
}
