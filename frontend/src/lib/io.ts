export const baseURL = import.meta.env.DEV ? "http://localhost:3341" : ""
let jwtToken: string | null = null
let user: any = null

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

export async function bookAppointment(date: Date, startMinute: number, duration: number): Promise<string> {
    const headers = createHeader()
    const body = {
        date: date.toISOString(),
        startMinute,
        duration,
        patId: user.id
    }
    const options = {
        method: "POST",
        headers,
        body: JSON.stringify(body)
    }
    const response = await fetch(baseURL + `/api/takeslot`, options)
    const data = await response.json()
    if (data.success !== true) {
        throw new Error("Booking failed")
    }
    return data.slotID
}
