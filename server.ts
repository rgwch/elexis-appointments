import { MikroRest } from '@rgwch/mikrorest'
import { checkAccess, deleteAppointment, findAppointments, getFreeSlotsAt, sendMail, takeSlot, verifyToken } from "./index"
import app from './frontend/src/main';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3341;
process.env.NODE_ENV = process.env.NODE_ENV || "development"

const server = new MikroRest({ port, allowedOriginsProd: [`http://localhost:${port}`, ""] })

server.addStaticDir("./frontend/dist")
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

server.addRoute("get", "/api/verifytoken", async (req, res) => {
    const params = server.getParams(req)
    const token = params.get("token")
    if (!token) {
        server.error(res, 400, "Missing token")
        return false
    }
    try {
        const user = await verifyToken(token) // implement in index.ts
        if (user) {
            const jwtToken = MikroRest.createJWT("", "", { verified: true })
            server.sendJson(res, { token: jwtToken, user })
        } else {
            server.error(res, 401, "Invalid token")
        }
        return false
    } catch (e) {
        server.error(res, 500, "Internal server error")
        return false
    }
})
server.addRoute("post", "/api/takeslot", server.authorize, async (req, res) => {
    const body = await server.readJsonBody(req)
    const startMinute = body.startMinute
    const duration = body.duration || parseInt(process.env.defaultAppointmentDuration || "15")
    const patId = body.patId
    const date = body.date
    if (startMinute === undefined || patId === undefined || !date) {
        server.error(res, 400, "Missing parameters")
        return false
    }
    try {
        const termin = await takeSlot(date, startMinute, duration, patId)
        server.sendJson(res, termin)
        return false
    } catch (e) {
        console.error("Error in /api/takeslot:", e)
        server.error(res, 500, "Internal server error")
        return false
    }
})

server.addRoute("get", "/api/findappointments", server.authorize, async (req, res) => {
    const params = server.getParams(req)
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

server.addRoute("post", "/api/deleteappointment", server.authorize, async (req, res) => {
    const body = await server.readJsonBody(req)
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

server.addRoute("get", "/api/sendmail", async (req, res) => {
    const params = server.getParams(req)
    const id = params.get("id")
    if (!id) {
        server.error(res, 400, "Missing id parameter")
        return false
    } await sendMail(id)
    return false
})

server.handleLogin("/api/checkaccess", async (birthdate, mail) => {

    // console.log("checkAccess called with", birthdate, mail)
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
