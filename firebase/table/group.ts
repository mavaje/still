import {Table} from "./table";
import {GroupData} from "../schema";

export class Group extends Table<GroupData> {

    static table = 'groups';

    declare static find: (id: string) => Promise<Group>;
}
