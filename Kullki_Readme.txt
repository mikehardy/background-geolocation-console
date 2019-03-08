- this is mostly for demonstration purposes, although it does serve to take data points in
- you have to run 2 servers for it to work well, because it does not correctly handle SSL and non-SSL on the same server
- I'm using this command line to start the SSL server for devices to post:
  - first log on to the server and start screen: `screen -S geo-console-ssl`
  - second get in the right directory: cd background-geolocation-console
  - third make sure you use the correct node version: `nvm use lts/dubnium`
  - fourth start the server `NODE_ENV=production SSLPORT=9001 DOMAINNAME=app.kullki.com ADMINEMAIL=mike@kull.com npm run start`
  - finally, detach the screen session after successful startup: `ctrl-a d`
- These commands start the non-SSL server for viewing the console (on http://dashboard.kullki.com:10000/locations/testrun/)
  - same 3 commands as above, then:
  - fourth start the server with `PORT=10000 npm run start`
  - then detach the screen again with ctrl-a d

To get back on the server log in and do a `screen -ls` to see the running screens, then attach one with `screen -r geo-console-ssl` (or nossl)


