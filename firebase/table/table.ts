import {DatabaseReference, get, ref, set} from "@firebase/database";
import {database, sanitise} from "../database";
import * as UUID from "uuid";

export type Data<I extends Table> = {
    [K in keyof I as I[K] extends Function ? never : K]: null | I[K];
};

export abstract class Table {

    static table: string;

    id?: string;

    static reference(id: string): DatabaseReference {
        return ref(database, `${this.table}/${id}`);
    }

    private static initialise<T extends typeof Table>(
        this: T,
        data: Data<InstanceType<T>>,
    ): InstanceType<T> {
        const object =  new (this as any)(data);
        Object.assign(object, data);
        object.id ??= UUID.v4();
        return object;
    }

    static async create<T extends typeof Table>(
        this: T,
        data: Data<InstanceType<T>>,
    ): Promise<InstanceType<T>> {
        return this.initialise(data).save();
    }

    static async find<T extends typeof Table>(
        this: T,
        id: string,
    ): Promise<InstanceType<T>> {
        const snapshot = await get(this.reference(id));
        const data = snapshot.val();
        return data ? this.initialise(data) : null;
    }

    static async find_or_create<T extends typeof Table>(
        this: T,
        data: Data<InstanceType<T>> & Data<Table>,
    ): Promise<InstanceType<T>> {
        return (await this.find(data.id))
            ?? (await this.create(data));
    }

    table(): typeof Table {
        return this.constructor as typeof Table;
    }

    reference() {
        return this.table().reference(this.id);
    }

    async save(): Promise<this> {
        await set(this.reference(), sanitise(this));
        return this;
    }

    async delete(): Promise<this> {
        await set(this.reference(), null);
        return this;
    }
}
