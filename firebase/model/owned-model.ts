import {Data, Model} from "./model";
import {User} from "./user";

export abstract class OwnedModel extends Model {

    user_id?: string;

    is_mine(): boolean {
        return this.user_id === User.current.id;
    }

    async update(data: Partial<Data<this>>): Promise<this> {
        return this.is_mine()
            ? super.update(data)
            : this;
    }

    async save(): Promise<this> {
        this.user_id ??= User.current.id;
        return super.save();
    }
}
