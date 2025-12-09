import {Table} from "./table";
import {UserData} from "../schema";

export class User extends Table<UserData> {

    static table = 'users';

    declare static find: (id: string) => Promise<User>;
}
