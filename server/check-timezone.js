
import db from './database.js';

async function checkTime() {
    try {
        const jsDate = new Date();
        console.log('JS Date (UTC):', jsDate.toISOString());
        console.log('JS Date (Local):', jsDate.toString());

        const [rows] = await db.getConnection().then(async (conn) => {
            const [res] = await conn.query("SELECT NOW() as db_now, CURDATE() as db_date, @@global.time_zone as global_tz, @@session.time_zone as session_tz");
            conn.release();
            return [res];
        });

        console.log('DB NOW():', rows[0].db_now);
        console.log('DB CURDATE():', rows[0].db_date);
        console.log('DB Global TZ:', rows[0].global_tz);
        console.log('DB Session TZ:', rows[0].session_tz);

    } catch (err) {
        console.error(err);
    }
}

checkTime();
