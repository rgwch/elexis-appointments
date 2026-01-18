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
        const response = await fetch(baseURL + `/api/checkAccess`, options)
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

async function getFreeSlotsAt(date: Date): Promise<Array<number>> {
    const response = await fetch(baseURL + `/api/getfreeslotsat?date=${date.toISOString()}`)
    const data = await response.json()
    return data.freeSlots
}
