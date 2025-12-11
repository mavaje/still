import {DatabaseReference, get, onValue, ref, set, Unsubscribe} from "@firebase/database";
import {database, sanitise} from "../database";
import {v4} from "uuid";

export type Data<T extends Model> = {
    [K in keyof T as T[K] extends Function ? never : K]: null | T[K];
} & {
    id: string;
};

export abstract class Model {

    static table: string;

    id?: string;

    static path(id: string): string {
        return `${this.table}/${id}`;
    }

    static reference(id: string): DatabaseReference {
        return ref(database, this.path(id));
    }

    protected static initialise<M extends typeof Model>(
        this: M,
        data: Data<InstanceType<M>>,
    ): InstanceType<M> {
        const object =  new (this as any)();
        Object.assign(object, data);
        return object;
    }

    static async create<M extends typeof Model>(
        this: M,
        data: Data<InstanceType<M>> = {} as Data<InstanceType<M>>,
    ): Promise<InstanceType<M>> {
        return this.initialise(data).save();
    }

    static async find<M extends typeof Model>(
        this: M,
        id: string,
    ): Promise<InstanceType<M>> {
        const snapshot = await get(this.reference(id));
        const data = snapshot.val();
        return data ? this.initialise(data) : null;
    }

    static async find_or_create<M extends typeof Model>(
        this: M,
        data: Data<InstanceType<M>>,
    ): Promise<InstanceType<M>> {
        return (await this.find(data.id))
            ?? (await this.create(data));
    }

    static shell<M extends typeof Model>(
        this: M,
        id: string,
    ): InstanceType<M> {
        return this.initialise({id} as Data<InstanceType<M>>);
    }

    model(): typeof Model {
        return this.constructor as typeof Model;
    }

    path() {
        return this.model().path(this.id);
    }

    reference() {
        return this.model().reference(this.id);
    }

    listen(callback: (object: this) => void): Unsubscribe {
        return onValue(this.reference(), snapshot => {
            const data = snapshot.val();
            if (data) {
                Object.assign(this, data);
                callback(this);
            } else {
                callback(null);
            }
        });
    }

    async refresh(): Promise<this> {
        return new Promise<this>(done =>
            onValue(this.reference(), snapshot => {
                const data = snapshot.val();
                Object.assign(this, data);
                done(this);
            })
        );
    }

    async update(data: Partial<Data<this>>): Promise<this> {
        Object.assign(this, data);
        return this.save();
    }

    async save(): Promise<this> {
        this.id ??= v4();
        await set(this.reference(), sanitise(this));
        return this;
    }

    async delete(): Promise<this> {
        await set(this.reference(), null);
        return this;
    }
}
