Use in Chromium-based browsers (Chrome, Edge, etc.):
1. Open the console (F12)
2. Copy the code from the file `downgradeUsers.js` and paste it into the console
3. Enter auth token into `AUTH_TOKEN`. The token can be obtained from a Tracker browser request. Log into Tracker, open the console (F12), go to the Network tab, refresh the page, find the latest request with the name `graphql`, go to the Headers tab, copy the value of the `Authorization` header.
4. Enter the URI for the Tracker instance into `TRACKER_URI`
5. Press Enter
6. Wait for the script to finish
7. Enjoy

CSV file format given in the example file `example.csv`.
