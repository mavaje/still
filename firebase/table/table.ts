import {get, ref} from "@firebase/database";
import {database} from "../database";

export abstract class Table<D extends object> {

    static table: string;

    constructor(public data: Partial<D> = {}) {}

    static async find(id: string): Promise<any> {
        const reference = ref(database, `${this.table}/${id}`);
        const snapshot = await get(reference);
        const data = snapshot.val();
        return data ? new (this as any)(data) : null;
    }
}
