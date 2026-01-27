import ical, { ICalCalendarMethod, ICalEvent } from 'ical-generator';
import nodemailer from 'nodemailer';


export type Attachment = {
    filename: string
    content?: Buffer | string
    path?: string
}
export class Mailer {
    /**
     *
     * @param {{host,port,user,pwd}} config
     * @param {*} sender
     */
    private smtp
    private transporter
    constructor(private config: any, private sender: string) {
        this.sender = sender

        this.smtp = {
            host: this.config.host,
            port: this.config.port,
            secure: true,
            auth: {
                user: this.config.user || process.env.SMTP_USER,
                pass: this.config.pwd || process.env.SMTP_PASSWORD,
            },
        }
        this.transporter = nodemailer.createTransport(this.smtp)
    }
    async send(
        address: string,
        subject: string,
        contents: string,
        attachment?: Attachment,
        ical?: string
    ): Promise<any> {
        const message: {
            from: string;
            to: string;
            subject: string;
            text: string;
            icalEvent?: {
                filename: string;
                method: string;
                content: string;
            };
            attachments?: Attachment[];
        } = {
            from: this.sender,
            to: address,
            subject: subject,
            text: contents,
        }
        
        if (ical) {
            message['icalEvent'] = {
                filename: 'arzttermin.ics',
                method: 'publish',
                content: ical,
            }
        } 
        if (attachment) {
            message['attachments'] = [attachment]
        }
        
        try {
            const result = await this.transporter.sendMail(message)
            return result
        } catch (err) {
            console.log(err)
            return { error: err }
        }
    }
}
