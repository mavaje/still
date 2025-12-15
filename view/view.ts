import {Model} from "../firebase/model/model";
import {Unsubscribe} from "firebase/database";

type Attributes = Record<string, any>;
type Children = (string | View)[];
type AttributeCallback<D extends object> = (parent: D) => Attributes;
type ClassCallback<D extends object> = (parent: D) => string[];
type ChildrenCallback<D extends object> = (parent: D) => Children;

const CustomEvents = ['connect'] as const;
type CustomEvent = (typeof CustomEvents)[number];

export class View<
    E extends HTMLElement = HTMLElement,
    D extends object = {},
> {
    private static SINGLETON_TAGS = new Set<string>([
        'body',
        'head',
        'header',
        'html',
        'main',
        'title',
    ]);

    private static BOOLEAN_ATTRIBUTES = new Set<string>([
        'checked',
        'disabled',
        'selected',
        'ismap',
        'multiple',
        'readonly',
    ]);

    private static VIEWS: View[] = [];

    private _attribute_callback: AttributeCallback<D>;
    private _class_callback: ClassCallback<D>;
    private _children_callback: ChildrenCallback<D>;
    private _children: Children = [];

    private custom_listeners: {
        [E in CustomEvent]?: ((target: this) => void)[];
    } = {};

    private event_listeners: Unsubscribe[] = [];

    readonly element: E;
    data: D = {} as D;

    parent: View = null;

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

    static find_singleton_tag<T extends keyof HTMLElementTagNameMap>(tag_name: T): View<HTMLElementTagNameMap[T]> {
        if (!View.SINGLETON_TAGS.has(tag_name.toLowerCase())) return null;
        const element = document.getElementsByTagName(tag_name)[0];
        return View.from_element(element);
    }

    static find_or_create<T extends keyof HTMLElementTagNameMap>(tag_name: T, id: string): View<HTMLElementTagNameMap[T]> {
        return View.find(id) as View<HTMLElementTagNameMap[T]>
            ?? View.find_singleton_tag(tag_name)
            ?? View.create(tag_name).attributes({id});
    }

    set_up<T extends this>(callback: (view: this) => T): T {
        return this.if(!this.element.isConnected, callback) as T;
    }

    if<T extends this, F extends this = this>(
        condition: boolean,
        callback: (view: this) => T,
        fallback: (view: this) => F = () => this as F,
    ): this | T {
        return condition
            ? callback(this)
            : fallback(this);
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

    classes(...classes: string[]): this;
    classes(callback: ClassCallback<D>): this;
    classes(...args: string[] | [ClassCallback<D>]): this {
        if (typeof args[0] === 'function') {
            this._class_callback = args[0];
            this.refresh_classes();
        } else {
            this.refresh_classes(() => args as string[]);
        }
        return this;
    }

    add_classes(...classes: string[]): this {
        const old_callback = this._class_callback;
        this.classes(data => [
            ...old_callback(data),
            ...classes,
        ]);
        return this;
    }

    remove_classes(...classes: string[]): this {
        const old_callback = this._class_callback;
        this.classes(data => old_callback(data)
            .filter(name => !classes.includes(name)));
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

    on<E extends keyof HTMLElementEventMap>(event: E, listener: (target: this, event: HTMLElementEventMap[E]) => void): this;
    on(event: CustomEvent, listener: (target: this) => void): this;
    on(event: string, listener: (target: this, event?: Event) => void): this {
        if (CustomEvents.includes(event as CustomEvent)) {
            this.custom_listeners[event] ??= [];
            this.custom_listeners[event].push(listener);
        } else {
            const event_listener = (event: Event) => listener(this, event);
            this.element.addEventListener(event, event_listener);
            this.event_listeners.push(() => this.element.removeEventListener(event, event_listener));
        }
        return this;
    }

    once(event: CustomEvent, listener: (target: this) => void): this;
    once<E extends keyof HTMLElementEventMap>(event: E, listener: (target: this, event: HTMLElementEventMap[E]) => void): this;
    once(event: keyof HTMLElementEventMap | CustomEvent, listener: (target: this, event?: Event) => void): this {
        let unsubscribe: () => void = null;
        const callback = (target, event) => {
            listener(target, event);
            if (CustomEvents.includes(event as CustomEvent)) {
                this.custom_listeners[event] = this.custom_listeners[event]
                    .filter(l => l !== callback);
            } else {
                unsubscribe?.();
                this.event_listeners = this.event_listeners
                    .filter(l => l !== unsubscribe);
            }
        };

        this.on(event as any, callback);
        if (!CustomEvents.includes(event as CustomEvent)) {
            unsubscribe = this.event_listeners[this.event_listeners.length - 1];
        }
        return this;
    }

    sync_with<K extends string, T extends Model>(name: K, object: T): View<E, D & Record<K, T>> {
        const view = this as View<E, D & Record<K, T>>;
        view.assign_data(name, object as any);
        this.event_listeners.push(object.listen(o => {
            view.assign_data(name, o as any);
            view.refresh();
        }));
        return view;
    }

    tear_down(): void {
        this.element.remove();
        const index = View.VIEWS.indexOf(this);
        if (index > -1) View.VIEWS.splice(index, 1);
        this.custom_listeners = {};
        this.event_listeners.forEach(unsubscribe => unsubscribe());
    }

    private assign_data<
        K extends keyof D,
        T extends D[K],
    >(name: K, object: T) {
        this.data[name] = object;
    }

    private refresh() {
        this.refresh_attributes();
        this.refresh_classes();
        this.refresh_children();
    }

    private refresh_attributes(callback = this._attribute_callback) {
        if (!callback) return;
        const attributes = callback(this.data);
        Object.entries(attributes).forEach(([key, value]) => {
            if (View.BOOLEAN_ATTRIBUTES.has(key.toLowerCase())) {
                value = value ? '' : null;
            }
            if (value === null || value === undefined) {
                this.element.removeAttribute(key);
            } else {
                this.element.setAttribute(key, String(value));
            }
        });
    }

    private refresh_classes(callback = this._class_callback) {
        if (!callback) return;
        this.element.className = callback(this.data)
            .filter(Boolean)
            .join(' ');
    }

    private refresh_children(callback = this._children_callback) {
        if (!callback) return;
        this._children
            .filter(child => child instanceof View)
            .forEach((child: View) => child.tear_down());
        this._children = callback(this.data);
        this.element.innerText = '';
        this._children.forEach(child => {
            if (child instanceof View) {
                this.element.append(child.element);
                child.parent = this;
                if (this.element.isConnected) {
                    child.on_connect();
                }
            } else if (child) {
                (child?.trim() ?? '')
                    .split(/\n/g)
                    .forEach((line, i) => {
                        if (i > 0) {
                            this.element.append(view.br().element);
                        }
                        this.element.append(line);
                    }, [] as Children);
            }
        });
    }

    private on_connect() {
        this.custom_listeners.connect?.forEach(listener => listener(this));
        this._children
            .filter(child => child instanceof View)
            .forEach(child => child.on_connect());
    }
}

export async function load_document(): Promise<View<HTMLBodyElement>> {
    return new Promise<View<HTMLBodyElement>>(done =>
        document.addEventListener('DOMContentLoaded', () =>
            done(View.from_element(document.body as HTMLBodyElement))));
}

export const view = new Proxy(
    {},
    {
        get(_, property) {
            return View.find_or_create.bind(View, property);
        }
    },
) as {
    [T in keyof HTMLElementTagNameMap]: (id?: string) => View<HTMLElementTagNameMap[T]>
};
