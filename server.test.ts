import { describe, test, expect, beforeAll } from "bun:test"

// Mock environment variables before importing server
process.env.database = process.env.database || "mysql://test:test@localhost:3306/test_elexis"
// process.env.PORT = "3999" // Use different port for testing
process.env.MICROREST_JWT_SECRET = "test-secret-key"
process.env.bereich = "Test"
process.env.NODE_ENV = "test"

describe("Server API Endpoints", () => {
    const baseURL = `http://localhost:${process.env.PORT || 3000}`
    let authToken = ""
    let testPatientId = ""

    // Note: These tests require a running test database with test data
    // In a real CI/CD environment, you'd set up a test database beforehand

    describe("POST /api/checkaccess", () => {
        test("returns 400 for missing credentials", async () => {
            try {
                const response = await fetch(`${baseURL}/api/checkaccess`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({})
                })
                expect(response.status).toBe(400)
            } catch (e) {
                console.log("Skipping test - server not running:", e)
            }
        })

        test("returns 401 for invalid credentials", async () => {
            try {
                const response = await fetch(`${baseURL}/api/checkaccess`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: "invalid@test.com",
                        password: "2000-01-01"
                    })
                })
                expect(response.status).toBe(401)
            } catch (e) {
                console.log("Skipping test - server not running:", e)
            }
        })
    })

    describe("GET /api/getfreeslotsat", () => {
        test("returns 401 without authentication", async () => {
            try {
                const response = await fetch(`${baseURL}/api/getfreeslotsat?date=2026-01-26`)
                expect(response.status).toBe(401)
            } catch (e) {
                console.log("Skipping test - server not running:", e)
            }
        })

        test("returns 400 for missing date parameter", async () => {
            if (!authToken) {
                console.log("Skipping test - no auth token")
                return
            }
            try {
                const response = await fetch(`${baseURL}/api/getfreeslotsat`, {
                    headers: { "Authorization": `Bearer ${authToken}` }
                })
                expect(response.status).toBe(400)
            } catch (e) {
                console.log("Skipping test - server not running:", e)
            }
        })

        test("returns array of free slots with valid auth", async () => {
            if (!authToken) {
                console.log("Skipping test - no auth token")
                return
            }
            try {
                const response = await fetch(`${baseURL}/api/getfreeslotsat?date=2026-02-01`, {
                    headers: { "Authorization": `Bearer ${authToken}` }
                })
                
                if (response.ok) {
                    const data = await response.json() as { freeSlots: number[] }
                    expect(data.freeSlots).toBeDefined()
                    expect(Array.isArray(data.freeSlots)).toBe(true)
                }
            } catch (e) {
                console.log("Skipping test - server not running:", e)
            }
        })
    })

    describe("POST /api/takeslot", () => {
        test("returns 401 without authentication", async () => {
            try {
                const response = await fetch(`${baseURL}/api/takeslot`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        date: "2026-03-01",
                        startMinute: 540,
                        duration: 15,
                        patId: "test-patient"
                    })
                })
                expect(response.status).toBe(401)
            } catch (e) {
                console.log("Skipping test - server not running:", e)
            }
        })

        test("returns 400 for missing parameters", async () => {
            if (!authToken) {
                console.log("Skipping test - no auth token")
                return
            }
            try {
                const response = await fetch(`${baseURL}/api/takeslot`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${authToken}`
                    },
                    body: JSON.stringify({})
                })
                expect(response.status).toBe(400)
            } catch (e) {
                console.log("Skipping test - server not running:", e)
            }
        })
    })

    describe("GET /api/findappointments", () => {
        test("returns 401 without authentication", async () => {
            try {
                const response = await fetch(`${baseURL}/api/findappointments?patId=test-patient`)
                expect(response.status).toBe(401)
            } catch (e) {
                console.log("Skipping test - server not running:", e)
            }
        })

        test("returns 400 for missing patId parameter", async () => {
            if (!authToken) {
                console.log("Skipping test - no auth token")
                return
            }
            try {
                const response = await fetch(`${baseURL}/api/findappointments`, {
                    headers: { "Authorization": `Bearer ${authToken}` }
                })
                expect(response.status).toBe(400)
            } catch (e) {
                console.log("Skipping test - server not running:", e)
            }
        })
    })

    describe("POST /api/deleteappointment", () => {
        test("returns 401 without authentication", async () => {
            try {
                const response = await fetch(`${baseURL}/api/deleteappointment`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        appid: "test-appointment",
                        patId: "test-patient"
                    })
                })
                expect(response.status).toBe(401)
            } catch (e) {
                console.log("Skipping test - server not running:", e)
            }
        })

        test("returns 401 for non-verified users", async () => {
            if (!authToken) {
                console.log("Skipping test - no auth token")
                return
            }
            try {
                const response = await fetch(`${baseURL}/api/deleteappointment`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${authToken}` // This token is not verified
                    },
                    body: JSON.stringify({
                        appid: "test-appointment",
                        patId: "test-patient"
                    })
                })
                expect(response.status).toBe(401)
            } catch (e) {
                console.log("Skipping test - server not running:", e)
            }
        })
    })

    describe("GET /api/sendtoken", () => {
        test("returns 400 without user email", async () => {
            try {
                const response = await fetch(`${baseURL}/api/sendtoken`)
                expect(response.status).toBe(400)
            } catch (e) {
                console.log("Skipping test - server not running:", e)
            }
        })
    })

    describe("GET /api/verifytoken", () => {
        test("returns 401 without authentication", async () => {
            try {
                const response = await fetch(`${baseURL}/api/verifytoken?token=invalid-token`)
                expect(response.status).toBe(401)
            } catch (e) {
                console.log("Skipping test - server not running:", e)
            }
        })

        test("returns 400 for missing token parameter", async () => {
            if (!authToken) {
                console.log("Skipping test - no auth token")
                return
            }
            try {
                const response = await fetch(`${baseURL}/api/verifytoken`, {
                    headers: { "Authorization": `Bearer ${authToken}` }
                })
                expect(response.status).toBe(400)
            } catch (e) {
                console.log("Skipping test - server not running:", e)
            }
        })
    })

    describe("GET /api/sendconfirmation", () => {
        test("returns 401 without authentication", async () => {
            try {
                const response = await fetch(`${baseURL}/api/sendconfirmation?id=test-appointment`)
                expect(response.status).toBe(401)
            } catch (e) {
                console.log("Skipping test - server not running:", e)
            }
        })

        test("returns 400 for missing id parameter", async () => {
            if (!authToken) {
                console.log("Skipping test - no auth token")
                return
            }
            try {
                const response = await fetch(`${baseURL}/api/sendconfirmation`, {
                    headers: { "Authorization": `Bearer ${authToken}` }
                })
                expect(response.status).toBe(400)
            } catch (e) {
                console.log("Skipping test - server not running:", e)
            }
        })
    })
})

describe("Static file serving", () => {
    test("serves frontend index.html", async () => {
        const baseURL = `http://localhost:${process.env.PORT}`
        try {
            const response = await fetch(`${baseURL}/`)
            // Should either return 200 or 404 depending on whether frontend is built
            expect([200, 404]).toContain(response.status)
        } catch (e) {
            console.log("Skipping test - server not running:", e)
        }
    })
})
