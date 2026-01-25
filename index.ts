import "dotenv/config"
import type { termin, user } from "./types"
import { sql, SQL } from "bun"
import { Mailer } from "./mailer"
import ical from "ical-generator"

const tokens: Map<string, { token: string, verified: boolean }> = new Map();
function elexisdateFromDate(date: Date): string {
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    return year.toString().padStart(4, '0') + (month).toString().padStart(2, '0') + day.toString().padStart(2, '0')
}

/**
 * Get the free slots at a given date
 * @param date 
 * @returns A Set of numbers representing the free slots in minutes from midnight
 */
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

/**
 * Take a slot at a given date and time for a patient
 * @param date 
 * @param startMinute 
 * @param duration 
 * @param patId 
 * @returns a Termin object representing the booked appointment or null if booking failed
 */
export async function takeSlot(date: string, startMinute: number, duration: number, patId: string): Promise<termin> {
    const db = new SQL(process.env.database!)
    const currentTime = Math.round(new Date().getTime() / 60000).toString();
    const id = Math.random().toString(36).substring(2, 10);
    try {
        const result = await db`
        INSERT INTO agntermine (id, bereich, tag, beginn, dauer, deleted, patid,angelegt,erstelltvon, termintyp, terminstatus) 
        VALUES (${id}, ${process.env.bereich || "Arzt"}, 
        ${elexisdateFromDate(new Date(date))}, ${startMinute}, ${duration}, "0", ${patId} , ${currentTime}, 
        "internet", ${process.env.TerminTyp || "Normal"}, ${process.env.CreatedState || "geplant"})
    `
        return {
            id: id,
            patid: patId,
            tag: elexisdateFromDate(new Date(date)),
            beginn: startMinute.toString(),
            dauer: duration.toString(),
            termintyp: process.env.TerminTyp || "Normal",
            deleted: "0",
        }
    } catch (e) {
        console.error("Error booking slot:", e)
        throw e
    } finally {
        db.close()
    }
}

export async function deleteAppointment(appid: string, patid: string): Promise<void> {
    const db = new SQL(process.env.database!)
    try {
        await db`
        UPDATE agntermine SET terminstatus=${process.env.CancelledState || "abgesagt"} WHERE id=${appid} AND patid=${patid}
    `
        console.log(`Deleted appointment with id ${appid} for patient ${patid}`);
    } catch (e) {
        console.error("Error deleting appointment:", e)
        throw e
    } finally {
        db.close()
    }
}

export async function findAppointments(patid: string): Promise<Array<termin>> {
    let db: SQL | null = null
    try {
        db = new SQL(process.env.database!)
        const appnts = await db`
        SELECT * FROM agntermine 
        WHERE patid=${patid} AND deleted="0" AND terminstatus!=${process.env.CancelledState || "abgesagt"} 
        ORDER BY tag DESC, CAST(beginn AS UNSIGNED) DESC
    `
        const appointments: Array<termin> = []
        for (const appnt of appnts) {
            appointments.push({
                tag: appnt.tag,
                beginn: appnt.beginn,
                dauer: appnt.dauer,
                id: appnt.id,
                termintyp: appnt.termintyp,
                patid: appnt.patid,
                deleted: appnt.deleted
            })
        }
        return appointments;
    } catch (e) {
        console.error("Error finding appointments:", e)
        throw e
    } finally {
        db?.close()
    }
}

export async function sendToken(mail: string): Promise<void> {
    const mailer = new Mailer({
        host: process.env.SMTP_SERVER,
        port: parseInt(process.env.SMTP_PORT || "465"),
        user: process.env.SMTP_USER,
        pwd: process.env.SMTP_PASSWORD
    }, process.env.MAIL_FROM || "")
    const subject = `Ihr Zugangstoken für die Terminverwaltung`
    const token = Math.random().toString(36).substring(2, 10);
    const contents = `Bitte verwenden Sie diese Zeichenfolge, um den Zugang zu Ihrer Terminloste freizuschalten:\n\n` +
        `${token}\n\n` +
        `Falls Sie diese E-Mail irrtümlich erhalten haben, können Sie sie einfach ignorieren.\n\n`
    try {
        const result = await mailer.send(
            mail,
            subject,
            contents
        )
        tokens.set(mail, { token, verified: false });
        console.log(`Sent token email to ${mail}`);
    } catch (e) {
        console.error("Error sending token email:", e)
        throw e
    }
}

export async function verifyToken(token: string): Promise<boolean> {
    if (tokens.has(token)) {
        const entry = tokens.get(token);
        if (entry && entry.token === token) {
            tokens.set(token, { token: entry.token, verified: true });
            return true;

        }
    }
    return false
}

export async function sendMail(id: string) {
    const db = new SQL(process.env.database!)
    try {
        const results = await db`SELECT * from agntermine WHERE id=${id}`
        if (results.length === 0) {
            throw new Error("Appointment not found")
        }
        const appointment = results[0]
        const patientResults = await db`SELECT * from kontakt WHERE id=${appointment.patid}`
        if (patientResults.length === 0) {
            throw new Error("Patient not found")
        }
        const patient = patientResults[0]
        if (!patient.email || patient.email === "") {
            throw new Error("Patient has no email")
        }
        console.log(`Sending email to ${patient.email} for appointment on ${appointment.tag} at ${appointment.beginn}`)
        const mailer = new Mailer({
            host: process.env.SMTP_SERVER,
            port: parseInt(process.env.SMTP_PORT || "465"),
            user: process.env.SMTP_USER,
            pwd: process.env.SMTP_PASSWORD
        }, process.env.MAIL_FROM || "")
        const appointmentDate = new Date(
            parseInt(appointment.tag.substring(0, 4)),
            parseInt(appointment.tag.substring(4, 6)) - 1,
            parseInt(appointment.tag.substring(6, 8)),
            Math.floor(parseInt(appointment.beginn) / 60),
            parseInt(appointment.beginn) % 60
        )
        const cal = ical({ "prodId": "elexis-appointments", "name": "Arzttermin" })
        cal.createEvent({
            start: appointmentDate,
            end: new Date(appointmentDate.getTime() + 15 * 60000),
            summary: "Arzttermin",
            description: `Ihr Termin in der Praxis am ${appointmentDate.toLocaleDateString()} um ${appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Uhr.`,
            organizer: {
                name: "Praxis",
                email: process.env.MAIL_FROM || ""
            }
        })
        const icalString = cal.toString()
        const subject = `Terminbestätigung für ${appointmentDate.toLocaleDateString()} um ${appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Uhr`
        const contents = `Sehr geehrte/r ${patient.bezeichnung2} ${patient.bezeichnung1},\n\n` +
            `hiermit bestätigen wir Ihren Termin am ${appointmentDate.toLocaleDateString()} um ${appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Uhr.\n\n` +
            `Bitte denken Sie daran, uns rechtzeitig zu informieren, falls Sie den Termin nicht wahrnehmen können.\n\n` +
            `Freundliche Grüsse\nIhre Praxis`
        const result = await mailer.send(
            patient.email,
            subject,
            contents,
            undefined,
            icalString
        )
        console.log(`Email sent to ${patient.email} for appointment ${id}`);
    } catch (e) {
        console.error("Error sending mail:", e)
        throw e
    } finally {
        db.close()
    }
}


/**
 * authorize method for the MikroRest server
 * @param birthdate date as string in format YYYY-MM-DD
 * @param mail string email address
 * @returns the patient associated with the credentials or null if not found
 */
export async function checkAccess(birthdate: string | null, mail: string | null): Promise<user | null> {
    let db: SQL | null = null
    try {
        db = new SQL(process.env.database!)

        if (!birthdate || birthdate === "") return Promise.resolve(null)
        if (!mail || mail === "") return Promise.resolve(null)
        const dat = (birthdate || "01-01").split("-")
        if (!dat || dat.length != 3 || !dat[0] || !dat[1] || !dat[2]) return Promise.resolve(null)
        if (!/^\d+$/.test(dat[0]) || !/^\d+$/.test(dat[1]) || !/^\d+$/.test(dat[2])) return Promise.resolve(null)
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return Promise.resolve(null)
        if (/[\/\\'";]/.test(mail)) return Promise.resolve(null)
        const elexisdate = dat[0] + dat[1] + dat[2]
        const results = await db`
        SELECT * FROM kontakt 
        WHERE geburtsdatum = ${elexisdate} AND email = ${mail}
        `;
        if (results.length > 0) {
            return {
                id: results[0].id,
                lastname: results[0].bezeichnung1,
                firstname: results[0].bezeichnung2,
                mail,
                verified: false
            };
        }
        return null;
    } catch (e) {
        console.error("Error checking access:", e)
        return null
    } finally {
        db?.close()
    }

}


import './server'
