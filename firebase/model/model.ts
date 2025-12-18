import {firestore} from "../firestore";
import {
    addDoc,
    collection,
    CollectionReference,
    doc,
    DocumentReference,
    DocumentSnapshot,
    getDoc,
    onSnapshot,
    setDoc,
    Unsubscribe,
} from "@firebase/firestore";
import {Field} from "./field";

export type Data<M extends Model> = {
    [K in keyof M as M[K] extends Field ? K : never]?: M[K] extends Field<infer T> ? T : never;
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

    protected reference: DocumentReference;
    protected snapshot: DocumentSnapshot;

    get id() {
        return this.reference?.id;
    }

    get exists() {
        return this.snapshot?.exists();
    }

    static collection(): CollectionReference {
        return collection(firestore, this.table);
    }

    protected static instance<M extends typeof Model>(this: M, reference: DocumentReference): InstanceType<M> {
        const model = new (this as any)() as InstanceType<M>;
        model.reference = reference;
        return model;
    }

    static async new<M extends typeof Model>(
        this: M,
        data: Data<InstanceType<M>> = {},
    ): Promise<InstanceType<M>> {
        const model = this.instance(null);
        data = await model.initial_data(data);
        model.reference = await addDoc(this.collection(), data as object);
        return model;
    }

    static find<M extends typeof Model>(this: M, id: string): InstanceType<M> {
        const reference = doc(this.collection(), id);
        return this.instance(reference);
    }

    async initial_data(data: Data<this> = {}): Promise<Data<this>> {
        for (const field of this.fields()) {
            data[field.name] ??= await field.initial_value(data[field.name]);
            if (data[field.name] === null) delete data[field.name];
        }
        return data;
    }

    can_write(): boolean {
        return false;
    }

    fields(): Field[] {
        return Object.values(this)
            .filter(field => field instanceof Field);
    }

    data(): Data<this> {
        return this.snapshot?.data() as Data<this> ?? null;
    }

    replace_with<M extends Model>(this: M, model: M): M {
        this.reference = model.reference;
        this.snapshot = model.snapshot;
        return this;
    }

    async read(): Promise<Data<this>> {
        this.snapshot = await getDoc(this.reference);
        return this.data();
    }

    async initialise(data: Data<this> = {}): Promise<this> {
        data = await this.initial_data(data);
        await this.write(data);
        return this;
    }

    async write(data: Data<this>, merge: boolean = true): Promise<void> {
        await setDoc(this.reference, data as object, {merge});
        await this.read();
    }

    listen(callback: (model: this) => void): Unsubscribe {
        return onSnapshot(this.reference, snapshot => {
            this.snapshot = snapshot;
            callback(this);
        });
    }
}
