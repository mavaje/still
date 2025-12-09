import {Prayer} from "./firebase/table/prayer";

Prayer.find('123')
    .then(prayer => console.log(prayer.data));
