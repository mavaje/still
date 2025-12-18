import {Model} from "./model";
import {Unsubscribe} from "@firebase/firestore";

type FieldType = string | number | boolean;

export class Field<T extends FieldType = FieldType> {

    constructor(
        protected model: Model,
        public name: string,
        public default_value: T | (() => T) | (() => Promise<T>) = null,
    ) {
    }

    get value() {
        return this.model.data()?.[this.name];
    }

    async initial_value(value?: T): Promise<T> {
        return value ?? (typeof this.default_value === 'function'
            ? await this.default_value()
            : this.default_value) ?? null;
    }

    async read(): Promise<T> {
        const data = await this.model.read();
        return data[this.name];
    }

    async write(value: T): Promise<T> {
        await this.model.write({
            [this.name]: value,
        });
        return value;
    }

    listen(callback: (value: T) => void): Unsubscribe {
        let latest_value: T = this.value;
        return this.model.listen(() => {
            if (latest_value !== this.value) {
                latest_value = this.value;
                callback(latest_value);
            }
        });
    }
}
