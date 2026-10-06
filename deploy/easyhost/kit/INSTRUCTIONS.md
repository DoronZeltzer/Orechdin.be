# Putting the ORECH/DIN website on Easyhost

Nothing in this folder has been uploaded, and no DNS record has been changed. It is ready for when you decide to move.

## What is in this folder

| Item | What it is |
|---|---|
| `www/` | The whole website as plain files. Everything inside goes into the site's `/www` folder on Easyhost. |
| `www/api/contact.php` | The contact form (sends the enquiry to `info@orechdin.be`). |
| `www/.htaccess` | Redirects and security headers, if the server honours `.htaccess` files. |
| `config/orechdin-mail.sample.php` | A template for the mail password file. It does **not** go into `www/`. |
| `nginx-snippet.conf` | The same redirects and headers for a server that ignores `.htaccess`. Only needed if the test in step 3 fails. |

## Step 1: get what Easyhost needs

In https://my.easyhost.be → Webhosting → Beheer hosting:
1. Create an **FTP user** (Quick start → "Maak een FTP-gebruiker aan"), or use **SSH** if you prefer. Note the login; you type passwords yourself, nobody else needs them.
2. Note the **temporary address** of the site: `orechdinbe.webhosting.be`. It works before any DNS change.
3. Ask Easyhost support (one email): in which country are the servers; does the Large plan honour `.htaccess` files (it shows an nginx server); can PHP connect to `smtp-auth.mailprotect.be` on port 465.

## Step 2: build for the test address

On the computer with the project:

```bash
npm run build:easyhost -- --url=https://orechdinbe.webhosting.be
```

This creates `dist-easyhost/`. Search engines are blocked in this build, so the test copy cannot compete with the real site.

## Step 3: upload and test (still no DNS change)

1. Upload the **contents of `www/`** (including the hidden `.htaccess` files) into the site's `/www` folder.
2. Make the mail settings file: copy `config/orechdin-mail.sample.php` to `orechdin-mail.php`, enter the mailbox password, and upload it **one folder above `www`** (next to it, not inside it).
3. Open `https://orechdinbe.webhosting.be/` and check:
   - the address becomes `/en/`, and `/nl/` and `/he/` work (Hebrew runs right to left);
   - every page loads with photos and the logo;
   - the cookie banner appears; the map appears only after "Show the map";
   - the **contact form**: send a test enquiry. It should arrive at `info@orechdin.be`. Also try it with a wrong email address (an error appears) and twice quickly (still fine).
4. Test the server rules:
   - `https://orechdinbe.webhosting.be/the-office` should end up on `/en/office/`;
   - `https://orechdinbe.webhosting.be/does-not-exist` should show the site's own "Page not found" page;
   - in the browser's developer tools (Network tab) the page response should carry `Content-Security-Policy` and `X-Frame-Options`.
   If the redirects or headers are missing, `.htaccess` is being ignored: send `nginx-snippet.conf` to Easyhost support and ask them to add it. The site still works without these rules (small fallback pages handle the redirects), but the security headers are lost.

## Step 4: go-live build

```bash
npm run build:easyhost -- --live
```

Upload `www/` again over the test copy. This build points at `https://www.orechdin.be` and allows search engines.

## Step 5: switch the domain

In https://my.easyhost.be → Domeinnamen → orechdin.be:
1. Open **Beheer DNS** and compare the records with what the domain uses today. The prepared zone already holds the website records and the **email records** (`MX mx.mailprotect.be`, `mail` to `pop3.mailprotect.be`, the SPF text). Check that nothing else is in use (for example a verification record you added at Wix).
2. Click **Nameservers wijzigen** and choose Easyhost's name servers (`ns1.easyhost.be`, `ns2.easyhost.be`). Until now the domain uses Wix's.
3. Wait (minutes to a few hours). Then check the website, send a test enquiry, and send and receive a normal email.

**If anything goes wrong:** set the name servers back to Wix's (`ns6.wixdns.net`, `ns7.wixdns.net`). The old site comes back as it was. Keep the Wix subscription until everything is confirmed.

## Step 6: afterwards
- Submit `https://www.orechdin.be/sitemap.xml` in Google Search Console.
- The Privacy statement names Vercel as the host. It must be changed to Easyhost at the same time as the move.
- To change anything on the site later: change the text or code, run the build again, upload `www/` again.

## What the contact form needs on the server
PHP 8.1 or newer (the plan runs PHP 8.3), the right to connect to `smtp-auth.mailprotect.be:465`, and a writable temporary folder (for the "5 messages per 10 minutes" counter). If a message cannot be sent, the visitor sees the phone number and the email address instead, so nothing is lost silently.
