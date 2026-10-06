<?php
/**
 * Mail settings for the website's contact form (api/contact.php).
 *
 * HOW TO USE
 *   1. Copy this file to a new file called  orechdin-mail.php  (same folder as this sample).
 *   2. Put the real values below, including the mailbox password.
 *   3. Upload it ONE FOLDER ABOVE the website folder, next to /www, NOT inside /www.
 *      (If the site lives in /home/yourname/www, this file goes to /home/yourname/orechdin-mail.php.)
 *      Inside /www a browser could reach it. Above /www nobody can.
 *
 * Never send this file by email, never put it on GitHub, and never paste the password into a chat.
 */
return [
    'host'     => 'smtp-auth.mailprotect.be', // the outgoing mail server of the Easyhost mailbox
    'port'     => 465,                        // 465 (secure from the start) or 587 (STARTTLS)
    'user'     => 'info@orechdin.be',         // the mailbox login: the full email address
    'password' => 'PUT-THE-MAILBOX-PASSWORD-HERE',
    'from'     => 'info@orechdin.be',         // the address the message is sent from (the same mailbox)
    'to'       => 'info@orechdin.be',         // where enquiries arrive
];
