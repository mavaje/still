import {Data, Model, Reference} from "./model";
import {User} from "./user";

export abstract class OwnedModel extends Model {

    user_id?: string;

    is_mine(): boolean {
        return this.user_id === User.current.id;
    }

    can_write(): boolean {
        return this.is_mine();
    }

    item_reference(): Reference {
        return null;
    }

    async update(data: Partial<Data<this>>): Promise<this> {
        return this.is_mine()
            ? super.update(data)
            : this;
    }

    async save(): Promise<this> {
        this.user_id = User.current.id;
        return super.save();
    }
}
