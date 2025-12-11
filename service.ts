import {Prayer} from "./firebase/model/prayer";
import { User } from "./firebase/model/user";
import {Group} from "./firebase/model/group";

export class Service {
    static async create_prayer(): Promise<Prayer> {
        const prayer = await Prayer.create();
        await User.current.add_prayer(prayer);
        return prayer;
    }

    static async create_group(): Promise<Group> {
        const group = await Group.create();
        await User.current.add_group(group);
        return group;
    }
}
