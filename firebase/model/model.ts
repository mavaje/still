import {DatabaseReference, get, onValue, ref, runTransaction, set, Unsubscribe} from "firebase/database";
import {database} from "../database";
import {v4} from "uuid";

export type Data<T extends Model> = {
    [K in keyof T as T[K] extends Function ? never : K]: null | T[K];
} & {
    id: string;
};

export interface PrayerReference {
    prayer_id: string;
}

export interface ListReference {
    list_id: string;
}

export type Reference = PrayerReference | ListReference;

export abstract class Model {

    static table: string;

    static ignore_fields: string[] = [
        'exists',
    ];

    id?: string;
    exists?: boolean;

    static random_id(): string {
        return v4();
    }

    static path(id: string): string {
        return `${this.table}/${id}`;
    }

    static reference(id: string): DatabaseReference {
        return ref(database, this.path(id));
    }

    private static sanitise(object: any, ignore_fields: string[] = []): any {
        switch (typeof object) {
            case "object":
            case "undefined":
                if (object) {
                    return Object.fromEntries(
                        Object.entries(object)
                            .filter(([key]) => !ignore_fields.includes(key))
                            .map(([key, value]) => [key, Model.sanitise(value)])
                    );
                } else {
                    return null;
                }
            case "boolean":
            case "number":
            case "string":
                return object;
        }
    }

    protected static initialise<M extends typeof Model>(
        this: M,
        data: Data<InstanceType<M>>,
        exists: boolean = false,
    ): InstanceType<M> {
        const object =  new (this as any)();
        Object.assign(object, data);
        object.exists = exists;
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
        return data ? this.initialise(data, true) : null;
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
        return this.initialise({id} as Data<InstanceType<M>>, false);
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

    can_write(): boolean {
        return false;
    }

    listen(callback: (object: this) => void): Unsubscribe {
        return onValue(this.reference(), snapshot => {
            const data = snapshot.val();
            if (data) {
                Object.assign(this, data);
                this.exists = true;
                callback(this);
            } else {
                this.exists = false;
                callback(null);
            }
        });
    }

    async refresh(): Promise<this> {
        return new Promise<this>(done =>
            onValue(this.reference(), snapshot => {
                const data = snapshot.val();
                if (data) Object.assign(this, data);
                this.exists = !!data;
                done(this);
            }, {
                onlyOnce: true,
            })
        );
    }

    async update(data: Partial<Data<this>>): Promise<this> {
        Object.assign(this, data);
        return this.save();
    }

    async save(): Promise<this> {
        this.id ??= Model.random_id();
        await set(this.reference(), Model.sanitise(this, this.model().ignore_fields));
        this.exists = true;
        return this;
    }

    async transaction(callback: (model: this) => this): Promise<boolean> {
        const result = await runTransaction(this.reference(), callback);
        return result.committed;
    }

    async delete(): Promise<this> {
        await set(this.reference(), null);
        this.exists = false;
        return this;
    }
}
