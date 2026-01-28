# elexis-appointments

## Basics

Elexis-Appointments is a tool to allow patients of an Elexis-operated practice to manage their appointmens via internet themselves.

### Prerequisites

* A running Elexis database. For security reasons, It is recommended to run this tool not on the main Elexis-Server.
* A database user with (at least) SELECT,INSERT,UPDATE privileges on "agntermine" and with SELECT privilege on "kontakt". For security reasons, it is recommended to create a specific user for this tool with the least possible privileges.
* [Bun](https://bun.sh/) v. 1.3.6 or higher
* A domain name pointing to your router and a port forwarding from your router to the configured port of the computer running this app. If you have more than one webservice, you'll need a reverse proxy. See below for an example Apache2 configuration.

### Install and install dependencies:

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

### Create standalone executable:

```bash
cd frontend
bun install
bun run build
cd ..
bun install
bun build --compile --minify --target=bun-linux-x64 ./index.ts --outfile termine-linux-x64
bun build --compile --minify --target=bun-windows-x64 ./index.ts --outfile termine-windows-x64
bun build --compile --minify --target=bun-darwin-x64 ./index.ts --outfile termine-macos-x64
bun build --compile --minify --target=bun-darwin-arm64 ./index.ts --outfile termine -macos-arm64
```

There's no big performance or usage difference in running the exectutable or running `bun index.ts`. The only relevant difference is, that the executable does not need a locally installed bun runtime.

## Configure

* Edit .env (copied from env,.sample). See the comments in env.sample for explanations of the various options. 

* Edit the files in frontend/src/lib/content as needed.

* Edit frontend/src/lib/i18n/i18n.ts if more, less, or other languages are needed. Currently, the app is based on german and translated to english, french, italian, portuguese, russian, serbian, and tamil.
