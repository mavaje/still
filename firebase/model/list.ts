import {ListReference, Reference} from "./model";
import {OwnedModel} from "./owned-model";
import {Field} from "./field";
import {get_auth_user, listen_to_auth_user} from "../auth";
import {doc} from "@firebase/firestore";

export class List extends OwnedModel {
    static table = 'lists';

    static root: List = new List(true);

    name = new Field<string>(this, 'name');
    items?: Reference[] = [];

    constructor(protected is_root = false) {
        super();
        if (this.is_root) {
            listen_to_auth_user(auth_user => {
                this.reference = doc(List.collection(), auth_user.uid);
                this.snapshot = null;
            });
        }
    }

    static async get_current(): Promise<List> {
        const auth_user = await get_auth_user();
        return List.root = await List.find(auth_user.uid).initialise();
    }

    item_reference(): ListReference {
        return {
            list_id: this.id,
        };
    }
}
