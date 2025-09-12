# How to Check for Errors and Report Them Using Seq

This guide will help you check for backend errors in the TrainStation system and report them if you find any issues.

## What You Need

- A web browser (Chrome, Edge, Firefox, etc.)
- Access to the Seq log viewer (URL will be provided by your system administrator, usually something like http://localhost:5341 or http://your-server-ip:5341)

---

## Step 1: Open the Seq Log Viewer

1. Open your web browser.
2. Type in the Seq address (for example: `http://localhost:5341`) and press Enter.
   - If you don’t know the address, ask your administrator.

---

## Step 2: Log In (if required)

- You might need a username and password to log in. If so, use the credentials your administrator gave you.

---

## Step 3: Search for Errors

1. In the Seq dashboard, look for a search box at the top.
2. To find errors, type this in the search box:
   ```
   @Level = 'Error'
   ```
3. Press Enter. Seq will show all error messages from the backend.

---

## Step 4: View Error Details

- Click on any error entry to see more details, including the time, message, and sometimes technical details that are useful for troubleshooting.

---

## Step 5: Report an Error

If you see an error:

1. Click on the error message to open it.
2. Click the **Copy** button or select the error details and copy them.
3. Send the copied information to your system administrator or developer (for example, by email or chat).

Include:
- The full error message
- The date and time it happened
- Any additional context (what you were doing at the time)

---

## Troubleshooting

- **Can't access Seq?** Make sure Seq is running on your computer or server. If not, contact your administrator.
- **No errors found?** That means everything is working as expected!
- **Unsure what the error means?** Just copy and send it to your administrator—they’ll know what to do.

---

## Example Error Report

> Hi,  
> I found this error in Seq at 2025-09-12 15:00:00:  
> ```
> System.Exception: Database connection failed.
> at TrainStation.Backend.Service...
> ```
> I was trying to open the dashboard when this happened.

---

If you need more help, ask your administrator or developer for assistance!