import * as fs from "fs"
import * as path from "path"

// Email template types
export type TokenTemplateData = {
    verificationLink: string
    validUntil: string
}

export type ConfirmationTemplateData = {
    salutation: string
    lastname: string
    firstname: string
    date: string
    time: string
}

export type ICalTemplateData = {
    date: string
    time: string
}

type EmailTemplates = {
    token: {
        subject: string
        body: string
    }
    confirmation: {
        subject: string
        body: string
    }
    ical: {
        summary: string
        description: string
        organizerName: string
        prodId: string
    }
}

// Load templates from JSON file
let templates: EmailTemplates | null = null

function loadTemplates(): EmailTemplates {
    if (templates) return templates

    const templatePath = process.env.EMAIL_TEMPLATES_PATH || 
        path.join(__dirname, "email-templates.json")
    
    try {
        const fileContent = fs.readFileSync(templatePath, "utf-8")
        templates = JSON.parse(fileContent)
        return templates!
    } catch (e) {
        console.error("Error loading email templates, using defaults:", e)
        // Return default templates as fallback
        return {
            token: {
                subject: "Ihr Zugang für die Terminverwaltung Praxis Breite",
                body: "Bitte folgen Sie diesem Link, um den Zugang zu Ihrer Terminliste freizuschalten:\n\n{{verificationLink}}\n\nDieser Link ist gültig bis {{validUntil}}.\n\nFalls Sie diese E-Mail irrtümlich erhalten haben, können Sie sie einfach ignorieren.\n\n"
            },
            confirmation: {
                subject: "Terminbestätigung für {{date}} um {{time}} Uhr",
                body: "Sehr geehrte/r {{salutation}} {{lastname}} {{firstname}},\n\nhiermit bestätigen wir Ihren Termin am {{date}} um {{time}} Uhr.\n\nBitte denken Sie daran, uns rechtzeitig zu informieren, falls Sie den Termin nicht wahrnehmen können.\n\nFreundliche Grüsse\nIhre Praxis"
            },
            ical: {
                summary: "Arzttermin",
                description: "Ihr Termin in der Praxis am {{date}} um {{time}} Uhr.",
                organizerName: "Praxis",
                prodId: "elexis-appointments"
            }
        }
    }
}

// Simple template engine - replaces {{key}} with values
function renderTemplate(template: string, data: Record<string, string>): string {
    let result = template
    for (const [key, value] of Object.entries(data)) {
        result = result.replace(new RegExp(`{{${key}}}`, "g"), value)
    }
    return result
}

export function getTokenEmail(data: TokenTemplateData): { subject: string; body: string } {
    const tmpl = loadTemplates().token
    return {
        subject: renderTemplate(tmpl.subject, data as any),
        body: renderTemplate(tmpl.body, data as any)
    }
}

export function getConfirmationEmail(data: ConfirmationTemplateData): { subject: string; body: string } {
    const tmpl = loadTemplates().confirmation
    return {
        subject: renderTemplate(tmpl.subject, data as any),
        body: renderTemplate(tmpl.body, data as any)
    }
}

export function getICalConfig(): EmailTemplates["ical"] {
    return loadTemplates().ical
}

export function renderICalDescription(data: ICalTemplateData): string {
    const tmpl = loadTemplates().ical
    return renderTemplate(tmpl.description, data as any)
}
