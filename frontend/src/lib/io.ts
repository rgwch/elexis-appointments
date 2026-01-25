import type { termin } from "../../../types.d"
import { _ } from "svelte-i18n"
import { DateTime } from "luxon"
const port = import.meta.env.VITE_PORT || 3000
export const baseURL = import.meta.env.DEV ? "http://localhost:" + port : ""
let jwtToken: string | null = null
let user: any = null
let trl: any = null
_.subscribe((value) => {
    trl = value
})

export function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export async function checkAccess(birthdate: string, mail: string): Promise<boolean> {
    try {
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ password: mail, username: birthdate })
        }
        const response = await fetch(baseURL + `/api/checkaccess`, options)
        if (response.ok) {
            const data = await response.json()
            jwtToken = data.token
            user = data.user
            return true
        }
    } catch (e) {
        console.error("Error during checkAccess:", e)
    }
    return false
}

function createHeader(): Headers {
    const headers = new Headers()
    headers.append("Content-Type", "application/json")
    if (jwtToken) {
        headers.append("Authorization", `Bearer ${jwtToken}`)
    }
    return headers
}
export async function getFreeSlotsAt(date: Date): Promise<Array<number>> {
    const headers = createHeader()

    const response = await fetch(baseURL + `/api/getfreeslotsat?date=${date.toISOString()}`, { headers })
    const data = await response.json()
    return data.freeSlots
}

export async function findAppointments(): Promise<Array<termin>> {
    const data = await doFetch(baseURL + `/api/findappointments?patId=${user.id}`)
    return data
}

export const findNextPossibleDate = async (startDate: Date): Promise<Date> => {
    let date = new Date(startDate)
    for (let i = 0; i < 30; i++) { // Limit search to next 30 days
        const freeSlots = await getFreeSlotsAt(date)
        if (freeSlots.length > 0) {
            return date
        }
        date.setDate(date.getDate() + 1)
    }
    throw new Error("No available dates in the next 30 days")
}

export const findPrevPossibleDate = async (startDate: Date): Promise<Date> => {
    let date = new Date(startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 30; i++) { // Limit search to previous 30 days
        date.setDate(date.getDate() - 1)
        if (date < today) {
            throw new Error("No available dates found (reached current date)")
        }
        const freeSlots = await getFreeSlotsAt(date)
        if (freeSlots.length > 0) {
            return date
        }
    }
    throw new Error("No available dates in the previous 30 days")
}

async function doFetch(url: string, body?: any): Promise<any> {
    const headers = createHeader()
    const options: RequestInit = {
        method: body ? "POST" : "GET",
        headers,
    }
    if (body) {
        options.body = JSON.stringify(body)
    }
    try {
        const response = await fetch(url, options)
        if (response.ok) {
            return await response.json()
        } else {
            if (response.status === 401) {
                jwtToken = null
                user = null
                alert(trl("expired"))
            } else if (response.status === 500) {
                alert(trl("internal_server_error"))
            }
            throw new Error(`Request failed with status ${response.status}`)
        }
    } catch (e) {
        console.error("Error during doFetch:", e)
        throw e
    }

}
export async function bookAppointment(date: Date, startMinute: number, duration: number): Promise<termin> {
    const headers = createHeader()
    const body = {
        date: date.toISOString(),
        startMinute,
        duration,
        patId: user.id
    }
    try {
        const data = await doFetch(baseURL + `/api/takeslot`, body)
        if (!data?.id) {
            throw new Error("Booking failed")
        }
        return data
    } catch (e) {
        console.error("Error during bookAppointment:", e)
        throw e
    }
}

export async function removeAppointment(appid: string): Promise<void> {
    await doFetch(baseURL + `/api/deleteappointment`, { appid, patId: user.id });
}