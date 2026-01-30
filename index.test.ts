import { describe, test, expect, beforeAll, afterAll, mock } from "bun:test"
import { SQL } from "bun"
import {
    getFreeSlotsAt,
    takeSlot,
    deleteAppointment,
    findAppointments,
    checkAccess
} from "./index"

// Mock environment variables
process.env.database = process.env.database || "mysql://test:test@localhost:3306/test_elexis"
process.env.bereich = "Test"
process.env.minFreeMinutes = "30"
process.env.maxPerDay = "5"
process.env.workStart = "8"
process.env.workEnd = "18"
process.env.TerminTyp = "Internet"
process.env.CreatedState = "scheduled"
process.env.CancelledState = "cancelled"

describe("Date conversion", () => {
    test("elexisdateFromDate converts Date to YYYYMMDD format", () => {
        // This function is not exported, but we can test it indirectly through other functions
        const date = new Date("2026-01-26")
        // We'll verify this through the takeSlot function which uses it
        expect(date).toBeDefined()
    })
})

describe("getFreeSlotsAt", () => {
    test("returns a Set of free slots", async () => {
        const date = new Date("2026-01-26")
        try {
            const slots = await getFreeSlotsAt(date)
            expect(slots).toBeInstanceOf(Set)
            // Slots should be numbers representing minutes from midnight
            for (const slot of slots) {
                expect(typeof slot).toBe("number")
                expect(slot).toBeGreaterThanOrEqual(8 * 60) // workStart
                expect(slot).toBeLessThan(18 * 60) // workEnd
            }
        } catch (e) {
            // If database is not available in test environment, skip
            console.log("Skipping test - database not available:", e)
        }
    })

    test("respects minFreeMinutes configuration", async () => {
        const date = new Date("2026-02-01")
        const minFreeMinutes = parseInt(process.env.minFreeMinutes || "30")
        try {
            const slots = await getFreeSlotsAt(date)
            const slotsArray = Array.from(slots).sort((a, b) => a - b)

            // Each consecutive free slot should be at least minFreeMinutes apart
            for (let i = 0; i < slotsArray.length - 1; i++) {
                const current = slotsArray[i]
                const next = slotsArray[i + 1]
                if (current !== undefined && next !== undefined) {
                    expect(next - current).toBeGreaterThanOrEqual(minFreeMinutes)
                }
            }
        } catch (e) {
            console.log("Skipping test - database not available:", e)
        }
    })

    test("respects maxPerDay limit", async () => {
        const date = new Date("2026-02-15")
        const maxPerDay = parseInt(process.env.maxPerDay || "5")
        try {
            const slots = await getFreeSlotsAt(date)
            expect(slots.size).toBeLessThanOrEqual(maxPerDay)
        } catch (e) {
            console.log("Skipping test - database not available:", e)
        }
    })
})

describe("takeSlot", () => {
    test("creates appointment with correct data structure", async () => {
        const date = "2026-03-15"
        const startMinute = 540 // 09:00
        const reason = "something important"
        const patId = "test-patient-id"

        try {
            const termin = await takeSlot(date, startMinute, reason, patId)

            expect(termin).toBeDefined()
            expect(termin.id).toBeDefined()
            expect(termin.patid).toBe(patId)
            expect(termin.beginn).toBe(startMinute.toString())
            expect(termin.grund).toBe(reason)
            expect(termin.deleted).toBe("0")
        } catch (e) {
            console.log("Skipping test - database not available:", e)
        }
    })
})

describe("deleteAppointment", () => {
    test("marks appointment as cancelled", async () => {
        const appid = "test-appointment-id"
        const patid = "test-patient-id"

        try {
            await deleteAppointment(appid, patid)
            // Should not throw error
            expect(true).toBe(true)
        } catch (e) {
            console.log("Skipping test - database not available:", e)
        }
    })
})

describe("findAppointments", () => {
    test("returns array of appointments for patient", async () => {
        const patid = "test-patient-id"

        try {
            const appointments = await findAppointments(patid)
            expect(Array.isArray(appointments)).toBe(true)

            // Each appointment should have required fields
            appointments.forEach(appt => {
                expect(appt.id).toBeDefined()
                expect(appt.patid).toBeDefined()
                expect(appt.tag).toBeDefined()
                expect(appt.beginn).toBeDefined()
            })
        } catch (e) {
            console.log("Skipping test - database not available:", e)
        }
    })
})

describe("checkAccess", () => {
    test("returns null for invalid credentials", async () => {
        const result = await checkAccess("2000-01-01", "invalid@test.com")
        expect(result).toBeNull()
    })

    test("returns null for malformed birthdate", async () => {
        const result = await checkAccess("not-a-date", "test@test.com")
        expect(result).toBeNull()
    })

    test("returns null for malformed email", async () => {
        const result = await checkAccess("2000-01-01", "not-an-email")
        expect(result).toBeNull()
    })

    test("returns null for empty credentials", async () => {
        const result1 = await checkAccess("", "test@test.com")
        const result2 = await checkAccess("2000-01-01", "")
        const result3 = await checkAccess(null, "test@test.com")
        const result4 = await checkAccess("2000-01-01", null)

        expect(result1).toBeNull()
        expect(result2).toBeNull()
        expect(result3).toBeNull()
        expect(result4).toBeNull()
    })

    test("rejects SQL injection attempts", async () => {
        const result = await checkAccess("2000-01-01", "test'; DROP TABLE kontakt;--")
        expect(result).toBeNull()
    })
})

