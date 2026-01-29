# elexis-appointments

## Basics

Elexis-Appointments is a tool to allow patients of an [Elexis](http://github.com/elexis)-operated practice to manage their appointments via the internet themselves.
They can book new appointments and modify their existing appointments.

### Prerequisites

* A running Elexis database. For security reasons, it is recommended to run this tool not on the main Elexis-Server.
* A database user with (at least) SELECT,INSERT,UPDATE privileges on "agntermine" and with SELECT privilege on "kontakt". For security reasons, it is recommended to create a specific user for this tool with the least possible privileges.
* [Bun](https://bun.sh/) v. 1.3.6 or higher (nodejs/npm will not work).
* A domain name pointing to your router and a port forwarding from your router to the configured port of the computer running this app. If you have more than one webservice, you'll need a reverse proxy. See below for an example Apache2 configuration.

### Install and set up dependencies:

```bash
git clone https://github.com/rgwch/elexis-appointments
cd elexis-appointments
bun install
cd frontend
bun install
bun run build
cd ..
cp env.sample .env
```

### Run:

```bash
bun index.ts
```

### Create standalone executables:

```bash
cd frontend
bun install
bun run build
cd ..
bun install
bun build --compile --minify --target=bun-linux-x64 ./index.ts --outfile termine-linux-x64
bun build --compile --minify --target=bun-windows-x64 ./index.ts --outfile termine-windows-x64
bun build --compile --minify --target=bun-darwin-x64 ./index.ts --outfile termine-macos-x64
bun build --compile --minify --target=bun-darwin-arm64 ./index.ts --outfile termine-macos-arm64
```

There's no big performance or usage difference in running the executable or running `bun index.ts`. The only relevant difference is that the executable does not need a locally installed bun runtime.

## Configure

* Edit .env (copied from env.sample). See the comments in env.sample for explanations of the various options. 

* Edit the files in frontend/src/lib/content as needed.
  
* Edit email-templates.json as needed

* Edit frontend/src/lib/i18n/i18n.ts if more, less, or other languages are needed. Currently, the app is based on German and translated to English, French, Italian, Portuguese, Russian, Serbian, and Tamil.

## Integration


Here's an example configuration for apache2:


/etc/apache2/sites-available/elexistermine.conf
```apache
<VirtualHost *:80>
        ServerName termine.myserver.ch
        ProxyPass / http://elexisapps:3349/
        ProxyPassReverse / http://elexisapps:3349/
        RewriteEngine on
        RewriteCond %{SERVER_NAME} =termine.myserver.ch
        RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
</VirtualHost>

<IfModule mod_ssl.c>
        <VirtualHost *:443>
                ServerName termine.myserver.ch
                ProxyPass / http://elexisapps:3349/
                ProxyPassReverse / http://elexisapps:3349/

                SSLCertificateFile /etc/letsencrypt/live/termine.elexisapps.ch/fullchain.pem
                SSLCertificateKeyFile /etc/letsencrypt/live/termine.elexisapps.ch/privkey.pem
                Include /etc/letsencrypt/options-ssl-apache.conf
        </VirtualHost>
</IfModule>
```

This config

* expects that you have set up a domain `termine.myserver.ch` with your domain registrar that points to the public address of your router (either acquired with a dynamic dns service or with a static IP)
* expects that you get ssl certificates with the letsencrypt certbot (see below).
* expects that the router forwards calls to port 80 to the host running apache.
* expects that elexis-appointments runs on a host 'elexisapps' and uses port 3349.
* enforces encrypted ssl (https://) connections

### SSL certificates

It is highly recommended to allow connections to your appointment service only via encrypted channels, i.e. SSL / HTTPS.

Set up for letsencrypt certificates is easy:

First, make the system work for unencrypted connections and test it thoroughly (domain, port forwarding, connection with the database, and so on).

Then:

```bash
sudo apt install certbot
sudo certbot --apache
```
and select the sites you want to secure.

That's all. Certbot will manage and update the certificates as needed.

## Install as a service

You'll want to install this app as a service, so it runs automatically if the computer restarts.

Bun plays well with the pm2 service manager. install it with `sudo npm i -g pm2`

and add the following snippet to ecosystem.config.js:

```
{
	name: "termine",
	interpreter:"bun",
	cwd: "/path/to/elexis-appointments",
	script: "index.ts",
	env: {
    		PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}`
  	}
    }
```
Then you can `pm2 start termine`, `pm2 stop termine` or `pm2 restart termine` and so on.

## License


This project is published under the MIT License. This means, in short: You may do whatever you like, but don't blame us for any faults or damages. The exact terms and conditions are in the file LICENSE.
