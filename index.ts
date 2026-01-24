import "dotenv/config"
import { sql, SQL } from "bun"

export type user = {
    id: string
    lastname: string
    firstname: string
    mail: string
}
function elexisdateFromDate(date: Date): string {
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    return year.toString().padStart(4, '0') + (month).toString().padStart(2, '0') + day.toString().padStart(2, '0')
}
export async function getFreeSlotsAt(date: Date): Promise<Set<number>> {
    const db = new SQL(process.env.database!)
    try {
        const results = await db`
        SELECT * FROM agntermine 
        WHERE tag=${elexisdateFromDate(date)} AND deleted="0" AND bereich=${process.env.bereich || "Arzt"}
    `;
        // console.log(`Found ${results.length} free slots on ${elexisdate}`);
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
                // Check if we have at least minFreeMMinutes consecutive free minutes
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
        const maxPerDay = parseInt(process.env.maxPerDay || "5");
        if (freeSlots.size > maxPerDay) {
            const slotsArray = Array.from(freeSlots);
            const earliest = slotsArray[0];
            const latest = slotsArray[slotsArray.length - 1];

            // Select random slots from the middle
            const middle = slotsArray.slice(1, -1);
            const numMiddle = maxPerDay - 2;
            const selected = new Set<number>([earliest, latest].filter((n): n is number => n !== undefined));

            for (let i = 0; i < numMiddle && i < middle.length; i++) {
                const randomIndex = Math.floor(Math.random() * middle.length);
                const slot = middle[randomIndex];
                if (slot !== undefined) {
                    selected.add(slot);
                }
                middle.splice(randomIndex, 1);
            }

            return new Set(Array.from(selected).sort((a, b) => a - b));
        }
        return freeSlots;
    } catch (e) {
        console.error("Database error:", e);
        throw e;
    } finally {
        db.close()
    }

}

export async function takeSlot(date: string, startMinute: number, duration: number, patId: string): Promise<string> {
    const db = new SQL(process.env.database!)
    const palmid =
        Math.floor(Math.random() * 2147483640)
    const currentTime = Math.round(new Date().getTime() / 60000).toString();
    try {
        await db`
        INSERT INTO agntermine (id, bereich, tag, beginn, dauer, deleted, palmid, patid,angelegt,erstelltvon) 
        VALUES (${Math.random().toString(36).substring(2, 10)}, ${process.env.bereich || "Arzt"}, 
        ${elexisdateFromDate(new Date(date))}, ${startMinute}, ${duration}, "0", ${palmid}, ${patId} , ${currentTime}, "internet")
    `
        return palmid.toString(20);
    } catch (e) {
        console.error("Error booking slot:", e)
        throw e
    } finally {
        db.close()
    }
}

export async function deleteAppointment(palmid: string, patid: string): Promise<void> {
    const db = new SQL(process.env.database!)
    await db`
        UPDATE agntermine WHERE palmid=${palmid} AND patid=${patid} set deleted="1"
    `
    console.log(`Deleted appointment with palmid ${palmid}`);
    db.close()
}


export async function checkAccess(birthdate: string | null, mail: string | null): Promise<user | null> {
    if (!birthdate || birthdate === "") return Promise.resolve(null)
    if (!mail || mail === "") return Promise.resolve(null)
    const dat = (birthdate || "01-01").split("-")
    if (!dat || dat.length != 3 || !dat[0] || !dat[1] || !dat[2]) return Promise.resolve(null)
    const elexisdate = dat[0] + dat[1] + dat[2]

    const db = new SQL(process.env.database!)
    const results = await db`
        SELECT * FROM kontakt 
        WHERE geburtsdatum=${elexisdate} AND email=${mail}
    `;
    db.close()
    if (results.length > 0) {
        return {
            id: results[0].id,
            lastname: results[0].bezeichnung1,
            firstname: results[0].bezeichnung2,
            mail
        };
    }
    return null;
}

import './server'
