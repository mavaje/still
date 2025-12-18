import {Model, Reference} from "./model";
import {User} from "./user";
import {Field} from "./field";
import {get_auth_id} from "../auth";

export abstract class OwnedModel extends Model {

    user_id = new Field<string>(this, 'user_id', get_auth_id);

    is_mine(): boolean {
        return this.user_id.value === User.auth.id;
    }

    can_write(): boolean {
        return this.is_mine();
    }

    item_reference(): Reference {
        return null;
    }
}
