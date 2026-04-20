/**
 * Server entry point for Elexis Appointments backend
 * (c) 2026 G. Weirich
 */
import { MikroRest } from '@rgwch/mikrorest'
import {
    checkAccess, deleteAppointment, findAppointments, getFreeSlotsAt,
    sendMail, takeSlot, sendToken, isDatabaseAlive
} from "./index"

const port = process.env.PORT ? parseInt(process.env.PORT) : 3341;
process.env.NODE_ENV = process.env.NODE_ENV || "development"

const server = new MikroRest({ port, allowedOriginsProd: [`http://localhost:${port}`, ""] })

if (process.env.LOGFILE) {
    server.setLogfile(process.env.LOGFILE)
}
server.addStaticDir("./frontend/dist")

/**
 * Health check endpoint
 */
server.addRoute("get", "/api/health", async (req, res) => {
    const dbAlive = await isDatabaseAlive();
    if (dbAlive) {
        server.sendJson(res, { status: "ok", database: "connected" });
    } else {
        console.error("Database connection failed in health check")
        server.error(res, 503, "Database unavailable");
    }
    return false;
});

/**
 * Get free slots at a given date. Authentication required.
 */
server.addRoute("get", "/api/getfreeslotsat", server.authorize, async (req, res) => {
    const params = server.getParams(req)
    const dateStr = params.get("date")
    if (!dateStr) {
        server.error(res, 400, "Missing date parameter")
        return false
    }
    const date = new Date(dateStr)
    try {
        const freeSlots = await getFreeSlotsAt(date)
        server.sendJson(res, { freeSlots: Array.from(freeSlots) })
        return false
    } catch (e) {
        console.error("Error in /api/getfreeslotsat:", e)
        server.error(res, 500, "Internal server error")
        return false
    }
})

/**
 * Send a verification token to the user's email address. Authentication required.
 */
server.addRoute("get", "/api/sendtoken", server.authorize, async (req, res) => {
    const user = (req as any).user?.user;
    if (!user || !user.mail) {
        console.error("User data missing or mail not set in /api/sendtoken")
        server.error(res, 400, "Missing mail parameter")
        return false
    }
    const { token, validUntil } = MikroRest.createJWT({ ...user, verified: true })
    try {
        await sendToken(user.mail, token, validUntil);
        server.sendJson(res, { success: true })
    } catch (e) {
        console.error("Error sending token mail:", e)
        server.error(res, 500, "Internal server error")
        return false
    }
    return false
})

/**
 * Verify verification token and return user data if valid
 */
server.addRoute("get", "/api/verifytoken", async (req, res) => {
    const params = server.getParams(req)
    const token = params.get("token")
    if (!token) {
        server.error(res, 400, "Missing token")
        return false
    }
    try {
        const user = MikroRest.decodeJWT(token)?.user;
        if (user) {
            server.sendJson(res, { token, user })
        } else {
            console.error("Invalid token in /api/verifytoken")
            server.error(res, 401, "Invalid token")
        }
        return false
    } catch (e) {
        console.error("Error in /api/verifytoken:", e)
        server.error(res, 500, "Internal server error")
        return false
    }
})

/**
 * Book an appointment slot for the currently logged in user. Authentication required.
 */
server.addRoute("post", "/api/takeslot", server.authorize, async (req, res) => {
    const body = await server.readJsonBody(req)
    const ip = req.socket.remoteAddress
    const startMinute = body.startMinute
    const reason = body.reason || ""
    const patId = body.patId
    const date = body.date
    if (startMinute === undefined || patId === undefined || !date) {
        console.error("Missing parameters in /api/takeslot:", { startMinute, patId, date })
        server.error(res, 400, "Missing parameters")
        return false
    }
    try {
        const termin = await takeSlot(date, startMinute, reason, patId, ip)
        server.sendJson(res, termin)
        return false
    } catch (e) {
        console.error("Error in /api/takeslot:", e)
        server.error(res, 500, "Internal server error")
        return false
    }
})

/**
 * Find existing appointments for the currently logged in user. 
 * Authentication and additional verification required.
 * If they are not verified, return 401 Unauthorized.
 */
server.addRoute("get", "/api/findappointments", server.authorize, async (req, res) => {
    const params = server.getParams(req)
    const user = (req as any).user?.user;
    if (!user.verified) {
        console.error("User not verified in /api/findappointments: ", user)
        server.error(res, 420, "2nd factor authentication required")
        return false
    }
    const patId = params.get("patId")
    if (!patId) {
        server.error(res, 400, "Missing patId parameter")
        return false
    }
    try {
        const appointments = await findAppointments(patId)
        server.sendJson(res, appointments)
        return false
    } catch (e) {
        console.error("Error in /api/findappointments:", e)
        server.error(res, 500, "Internal server error")
        return false
    }
})

/**
 * Cancel an appointment by its ID for the currently logged in user.
 * Authentication and additional verification required. 
 * If they are not verified, return 401 Unauthorized.
 */
server.addRoute("post", "/api/deleteappointment", server.authorize, async (req, res) => {
    const body = await server.readJsonBody(req)
    const user = (req as any).user?.user;
    if (!user.verified) {
        console.error("User not verified in /api/deleteappointment: ", user)
        server.error(res, 401, "Unauthorized")
        return false
    }
    const patId = body.patId
    if (!patId) {
        server.error(res, 400, "Missing patId parameter")
        return false
    }
    const appid = body.appid
    if (!appid) {
        server.error(res, 400, "Missing appid parameter")
        return false
    }
    try {
        await deleteAppointment(appid, patId)
        server.sendJson(res, { success: true })
        return false
    } catch (e) {
        console.error("Error in /api/deleteappointment:", e)
        server.error(res, 500, "Internal server error")
        return false
    }
})

/**
 * Send a confirmation mail for an appointment
 */
server.addRoute("get", "/api/sendconfirmation", server.authorize, async (req, res) => {
    const params = server.getParams(req)
    const id = params.get("id")
    if (!id) {
        server.error(res, 400, "Missing id parameter")
        return false
    }
    try {
        await sendMail(id)
        server.sendJson(res, { success: true })
    } catch (e) {
        console.error("Error in /api/sendconfirmation:", e)
        server.error(res, 500, "Internal server error")
        return false
    }
    return false
})

/**
 * Login handler for checking access with birthdate and mail, used by MikroRest's handleLogin
 */
server.handleLogin("/api/checkaccess", async (mail, birthdate) => {
    try {
        const acc = await checkAccess(birthdate, mail)
        return acc
    } catch (e) {
        console.error("Error in /api/checkaccess:", e)
        return false
    }
})
console.log("listening on port", port)
server.start()
