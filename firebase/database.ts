import {getDatabase} from "firebase/database";
import {app} from "./app";

export const database = getDatabase(app);

export function sanitise(object: any): any {
    switch (typeof object) {
        case "object":
        case "undefined":
            if (object) {
                return Object.fromEntries(
                    Object.entries(object)
                        .map(([key, value]) => [key, sanitise(value)])
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
