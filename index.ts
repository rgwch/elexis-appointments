import "dotenv/config"
import { sql, SQL } from "bun"

export type user = {
    id: string
    lastname: string
    firstname: string
    mail: string
}
export async function getFreeSlotsAt(date: Date): Promise<Set<number>> {
    const db = new SQL(process.env.database!)
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    const elexisdate = year.toString().padStart(4, '0') + (month).toString().padStart(2, '0') + day.toString().padStart(2, '0')
    const results = await db`
        SELECT * FROM agntermine 
        WHERE tag=${elexisdate} AND deleted="0" AND bereich=${process.env.bereich || "Arzt"}
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
}

export async function takeSlot(date: string, startMinute: number, duration: number, patId: string): Promise<string> {
    const db = new SQL(process.env.database!)
    const now = new Date(date)
    const elexisdate = now.getFullYear().toString().padStart(4, '0') +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0')
    const palmid =
        Math.random().toString(36).substring(2, 10)
    try {
        await db`
        INSERT INTO agntermine (bereich, tag, beginn, dauer, deleted, palmid, patid) 
        VALUES (${process.env.bereich || "Arzt"}, ${elexisdate}, ${startMinute}, ${duration}, "0", ${palmid}, ${patId})
    `
        console.log(`Booked slot at ${startMinute} for ${duration} minutes on ${elexisdate}`);
        return palmid;
    } catch (e) {
        console.error("Error booking slot:", e)
        throw e
    }
}

export async function deleteAppointment(palmid: string, patid: string): Promise<void> {
    const db = new SQL(process.env.database!)
    await db`
        DELETE FROM agntermine WHERE palmid=${palmid} AND patid=${patid}
    `
    console.log(`Deleted appointment with palmid ${palmid}`);

}

export async function checkAccess(birthdate: string | null, mail: string | null): Promise<user | null> {
    if (!birthdate || birthdate === "") return Promise.resolve(null)
    if (!mail || mail === "") return Promise.resolve(null)
    const db = new SQL(process.env.database!)
    const dat = (birthdate || "01-01").split("-")
    if (!dat || dat.length != 3 || !dat[0] || !dat[1] || !dat[2]) return Promise.resolve(null)
    const elexisdate = dat[0] + dat[1] + dat[2]

    const results = await db`
        SELECT * FROM kontakt 
        WHERE geburtsdatum=${elexisdate} AND email=${mail}
    `;
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
