export type termin = {
    id: string
    patid: string
    tag: string
    beginn: string
    dauer: string
    termintyp: string
    grund: string
    deleted: string
}
export type user = {
    id: string
    lastname: string
    firstname: string
    mail: string
    verified?: boolean
}