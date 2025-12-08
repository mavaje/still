export interface PrayerReference {
    prayer_id: string;
}

export interface GroupReference {
    group_id: string;
}

export type Reference = PrayerReference | GroupReference;

export interface User {
    id: string;
    name: string;
    email: string;
    prayers?: Reference[];
}

export interface Prayer {
    id: string;
    user_id: string;
    title: string;
    body: string;
    image: string;
    prays: number;
    answered: boolean;
}

export interface Group {
    id: string;
    user_id: string;
    name: string;
    prayers?: PrayerReference[];
}
