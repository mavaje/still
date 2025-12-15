import {ListReference, Reference} from "./model";
import {OwnedModel} from "./owned-model";
import {User} from "./user";

export class List extends OwnedModel {
    static table = 'lists';

    static current: List = new List();

    name?: string;
    items?: Reference[] = [];

    item_reference(): ListReference {
        return {
            list_id: this.id,
        };
    }

    static async get_current(): Promise<List> {
        const user = await User.get_current();

        List.current = await List.find_or_create({
            id: user.list_id,
            user_id: user.id,
        });

        await user.update({list_id: List.current.id});

        return List.current;
    }
}
