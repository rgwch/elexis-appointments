/**
 * Common Types shared between frontend and backend
 */
export type termin = {
    id: string          // UUID of the appointment
    patid: string       // Patient ID
    tag: string         // Date of appointment YYYYMMDD    
    beginn: string      // Start time minutes from midnight
    dauer: string       // Duration in minutes
    termintyp: string   // Type of appointment, as defined in Elexis
    terminstatus: string // Status of appointment, as defined in Elexis
    grund: string        // free text
    deleted: string     // "1" if appointment is deleted, "0" else    
}
export type user = {
    id: string
    lastname: string
    firstname: string
    mail: string
    verified?: boolean
}