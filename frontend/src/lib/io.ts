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

export async function bookAppointment(startMinute: number, duration: number): Promise<boolean> {
    const headers = createHeader()
    const body = {
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
    return response.ok
}
