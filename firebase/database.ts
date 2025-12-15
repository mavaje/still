import {getDatabase} from "firebase/database";
import {app} from "./app";

export const database = getDatabase(app);
