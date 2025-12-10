import {Model} from "../firebase/model/model";
import {Unsubscribe} from "@firebase/database";

type Attributes = Record<string, any>;
type Children = (string | View)[];
type AttributeCallback<D extends object> = (parent: D) => Attributes;
type ChildrenCallback<D extends object> = (parent: D) => Children;

export class View<
    E extends HTMLElement = HTMLElement,
    D extends object = {},
> {
    private static VIEWS: View[] = [];

    private _attribute_callback: AttributeCallback<D>;
    private _children_callback: ChildrenCallback<D>;
    private _children: Children = [];

    private listeners: Unsubscribe[] = [];

    element: E;
    data: D = {} as D;

    constructor(element: E) {
        this.element = element;
        View.VIEWS.push(this);
    }

    static from_element<E extends HTMLElement>(element: E): View<E> {
        if (!element) return null;
        for (const view of View.VIEWS) {
            if (view.element === element) return view as View<E>;
        }
        return new View(element);
    }

    static create<T extends keyof HTMLElementTagNameMap>(tag_name: T): View<HTMLElementTagNameMap[T]> {
        return new View(document.createElement(tag_name));
    }

    static find(id: string): View {
        if (!id) return null;
        const element = document.getElementById(id);
        return View.from_element(element);
    }

    static find_or_create<T extends keyof HTMLElementTagNameMap>(tag_name: T, id: string): View<HTMLElementTagNameMap[T]> {
        return View.find(id) as View<HTMLElementTagNameMap[T]>
            ?? View.create(tag_name).attributes({id});
    }

    attributes(attributes: Attributes): this;
    attributes(callback: AttributeCallback<D>): this;
    attributes(arg: Attributes | AttributeCallback<D>): this {
        if (typeof arg === 'function') {
            this._attribute_callback = arg as AttributeCallback<D>;
            this.refresh_attributes();
        } else {
            this.refresh_attributes(() => arg);
        }
        return this;
    }

    add_class(...classes: string[]): this {
        this.element.classList.add(...classes);
        return this;
    }

    remove_class(...classes: string[]): this {
        this.element.classList.remove(...classes);
        return this;
    }

    children(...children: Children): this;
    children(callback: ChildrenCallback<D>): this;
    children(...args: Children | [ChildrenCallback<D>]): this {
        if (typeof args[0] === 'function') {
            this._children_callback = args[0];
            this.refresh_children();
        } else {
            this.refresh_children(() => args as Children);
        }
        return this;
    }

    listen_to<K extends string, T extends Model>(name: K, object: T): View<E, D & Record<K, T>> {
        const view = this as View<E, D & Record<K, T>>;
        view.assign_data(name, object as any);
        this.listeners.push(object.listen(o => {
            view.assign_data(name, o as any);
            view.refresh();
        }));
        return view;
    }

    clean_up(): void {
        if (this.element.isConnected) return;
        this.element.remove();
        const index = View.VIEWS.indexOf(this);
        if (index > -1) View.VIEWS.splice(index, 1);
        this.listeners.forEach(unsubscribe => unsubscribe());
    }

    private assign_data<
        K extends keyof D,
        T extends D[K],
    >(name: K, object: T) {
        this.data[name] = object;
    }

    private refresh() {
        this.refresh_attributes();
        this.refresh_children();
    }

    private refresh_attributes(callback = this._attribute_callback) {
        if (!callback) return;
        const attributes = callback(this.data);
        Object.entries(attributes).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                this.element.removeAttribute(key);
            } else {
                this.element.setAttribute(key, String(value));
            }
        });
    }

    private refresh_children(callback = this._children_callback) {
        if (!callback) return;
        const old_children = this._children;
        this._children = callback(this.data);
        this.element.innerText = '';
        this._children.forEach(child => {
            if (child instanceof View) {
                this.element.append(child.element);
            } else {
                this.element.append(child);
            }
        });
        old_children
            .filter(child => child instanceof View)
            .forEach(child => child.clean_up());
    }
}

export async function load_document(): Promise<View<HTMLBodyElement>> {
    return new Promise<View<HTMLBodyElement>>(done =>
        document.addEventListener('DOMContentLoaded', () =>
            done(View.from_element(document.body as HTMLBodyElement))));
}

export const view = new Proxy(
    {} as {
        [T in keyof HTMLElementTagNameMap]: (id?: string) => View<HTMLElementTagNameMap[T]>
    },
    {
        get(_, property) {
            return View.find_or_create.bind(View, property);
        }
    },
);
