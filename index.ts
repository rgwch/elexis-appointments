import "dotenv/config"
import { sql, SQL } from "bun"

async function getFreeSlotsAt(date: Date): Promise<Set<number>> {
    const db = new SQL(process.env.database!)
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    const elexisdate = year.toString().padStart(4, '0') + (month - 1).toString().padStart(2, '0') + day.toString().padStart(2, '0')
    const results = await db`
        SELECT * FROM agntermine 
        WHERE tag=${elexisdate} AND deleted="0" AND bereich=${process.env.bereich || "Arzt"}
    `;
    console.log(`Found ${results.length} appointments on ${elexisdate}`);
    // console.log(results);
    const takenSlots = new Set<number>();
    results.forEach((termin: any) => {
        const start = parseInt(termin.beginn);
        const duration = parseInt(termin.dauer);
        for (let i = 0; i < duration; i++) {
            takenSlots.add(start + i);
        }
    });

    const freeSlots = new Set<number>();
    const workStart = 8 * 60; // 08:00
    const workEnd = 18 * 60; // 18:00

    for (let minute = workStart; minute < workEnd; minute++) {
        if (!takenSlots.has(minute)) {
            // Check if we have at least 30 consecutive free minutes
            let isFree = true;
            for (let j = 0; j < parseInt(process.env.minFreeMinutes || "30"); j++) {
                if (takenSlots.has(minute + j)) {
                    isFree = false;
                    break;
                }
            }
            if (isFree) {
                freeSlots.add(minute);
                minute += parseInt(process.env.minFreeMinutes || "30") - 1; // Skip ahead
            }
        }
    }
    return freeSlots;
}

function checkAccess(birthdate: string, mail: string): Promise<boolean> {
    const db = new SQL(process.env.database!)
    const dat = (birthdate || "01.01").split(".")
    if (!dat || dat.length != 3 || !dat[0] || !dat[1] || !dat[2]) return Promise.resolve(false)
    const elexisdate = dat[2].padStart(4, '0') + dat[1].padStart(2, '0') + dat[0].padStart(2, '0')

    return db`
        SELECT * FROM kontakt 
        WHERE geburtsdatum=${elexisdate} AND email=${mail}
    `.then(results => {
        return results.length > 0;
    });
}

getFreeSlotsAt(new Date(2026, 1, 7)).then(results => {
    console.log(results)
});
checkAccess("1.2.1950", "testperson@elexis.ch").then(access => {
    console.log("Access:", access)
    process.exit(0)
});