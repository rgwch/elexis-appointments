import { MikroRest } from '@rgwch/mikrorest'
import { checkAccess, deleteAppointment, getFreeSlotsAt, takeSlot } from "./index"

const port = process.env.PORT ? parseInt(process.env.PORT) : 3341;
process.env.NODE_ENV = process.env.NODE_ENV || "development"

const server = new MikroRest({ port, allowedOriginsProd: [`http://localhost:${port}`, ""] })
/*
server.addRoute("get", "/api/checkAccess", async (req, res) => {
    const params = server.getParams(req)
    const access = await checkAccess(params.get("birthdate"), params.get("mail"))
    server.sendJson(res, { id: access })
    return false
})
*/
server.addRoute("get", "/api/getfreeslotsat", async (req, res) => {
    const params = server.getParams(req)
    const dateStr = params.get("date")
    if (!dateStr) {
        server.error(res, 400, "Missing date parameter")
        return false
    }
    const date = new Date(dateStr)
    const freeSlots = await getFreeSlotsAt(date)
    server.sendJson(res, { freeSlots: Array.from(freeSlots) })
    return false
})
server.addRoute("post", "/api/takeslot", async (req, res) => {
    const body = await server.readJsonBody(req)
    const startMinute = body.startMinute
    const duration = body.duration || parseInt(process.env.defaultAppointmentDuration || "15")
    const patId = body.patId
    if (startMinute === undefined || patId === undefined) {
        server.error(res, 400, "Missing parameters")
        return false
    }
    const slotID = await takeSlot(startMinute, duration, patId)
    server.sendJson(res, { success: true, slotID: slotID })
    return false
})

server.addRoute("post", "/api/deleteappointment", async (req, res) => {
    const body = await server.readJsonBody(req)
    const palmid = body.palmid
    if (!palmid) {
        server.error(res, 400, "Missing palmid parameter")
        return false
    }
    const patId = body.patId
    if (!patId) {
        server.error(res, 400, "Missing patId parameter")
        return false
    }
    await deleteAppointment(palmid, patId)
    server.sendJson(res, { success: true })
    return false
})
server.handleLogin("/api/checkaccess", async (birthdate, mail) => {
    console.log("checkAccess called with", birthdate, mail)
    return checkAccess(birthdate, mail)
})
console.log("listening on port", port)
server.start()
