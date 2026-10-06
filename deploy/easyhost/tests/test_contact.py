"""Tests ../kit/contact.php against a fake mail server. Nothing is installed and nothing is sent anywhere.

How to run (needs PHP 8.1 or newer on the PATH):
  1. python smtp_sink.py 2525 sink-out      fake mail server; keeps what it receives in sink-out/
  2. make site/www/api/ and put contact.php in it; make site/orechdin-mail.php returning
     ['host'=>'127.0.0.1','port'=>2525,'user'=>'info@orechdin.be','password'=>'x','from'=>'info@orechdin.be','to'=>'info@orechdin.be']
  3. php -S 127.0.0.1:8092 -t site/www
  4. python test_contact.py
The rate-limit counter lives in the system temp folder (orechdin-contact): empty it between runs.
"""
import json, os, glob, time, base64, email, urllib.request, urllib.error, shutil, subprocess, sys
from email import policy

S = os.path.dirname(os.path.abspath(__file__))  # sink-out/ is read from next to this file
BASE = "http://127.0.0.1:8092"
SINK = os.path.join(S, "sink-out")

def post(body, headers=None, raw=None):
    data = raw if raw is not None else json.dumps(body).encode()
    req = urllib.request.Request(BASE + "/api/contact.php", data=data, method="POST",
                                 headers={"Content-Type": "application/json", **(headers or {})})
    try:
        r = urllib.request.urlopen(req, timeout=30)
        return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read() or b"{}")
        except Exception: return e.code, {}

def mails():
    return sorted(glob.glob(os.path.join(SINK, "*.eml")))

def good(**over):
    d = {"name": "Test Person", "email": "test.person@example.com", "phone": "+32 3 123 45 67",
         "message": "Hello, this is a test message of enough length.", "locale": "en", "website": "", "elapsedMs": 9000}
    d.update(over); return d

results = []
def check(label, cond, extra=""):
    results.append(cond)
    print(("PASS " if cond else "FAIL ") + label + (("  | " + str(extra)) if extra else ""))

# ---------------------------------------------------------------- wrong method
try:
    r = urllib.request.urlopen(BASE + "/api/contact.php", timeout=20); st = r.status
except urllib.error.HTTPError as e: st = e.code
check("GET is refused (405)", st == 405, st)

# ---------------------------------------------------------------- validation
st, b = post(None, raw=b"not json");                 check("invalid JSON -> 400 validation", (st, b.get("error")) == (400, "validation"), (st, b))
st, b = post(good(email="not-an-email"));            check("bad email -> 400", st == 400, st)
st, b = post(good(name="A"));                        check("name too short -> 400", st == 400, st)
st, b = post(good(message="short"));                 check("message too short -> 400", st == 400, st)
st, b = post(good(phone="abc"));                     check("bad phone -> 400", st == 400, st)
st, b = post(good(locale="fr"));                     check("locale fr -> 400", st == 400, st)
st, b = post(good(elapsedMs="x"));                   check("elapsedMs not a number -> 400", st == 400, st)
st, b = post(good(), headers={"Origin": "https://evil.example"}); check("other website -> 403", st == 403, st)
st, b = post(None, raw=b"x" * 25000);                check("body too large -> 413", st == 413, st)
check("none of those sent a mail", len(mails()) == 0, len(mails()))

# ---------------------------------------------------------------- bot traps
st, b = post(good(website="http://spam"));           check("honeypot -> fake success, nothing sent", (st, b.get("ok")) == (200, True) and len(mails()) == 0, (st, b))
st, b = post(good(elapsedMs=100));                   check("too fast -> fake success, nothing sent", (st, b.get("ok")) == (200, True) and len(mails()) == 0, (st, b))

# ---------------------------------------------------------------- a real message (English)
st, b = post(good(), headers={"Origin": BASE})
time.sleep(0.6)
check("valid message -> 200 ok", (st, b.get("ok")) == (200, True), (st, b))
m = mails()
check("exactly one mail arrived", len(m) == 1, len(m))
if m:
    meta = json.load(open(m[-1][:-4] + ".json"))
    msg = email.message_from_bytes(open(m[-1], "rb").read(), policy=policy.default)
    check("envelope: MAIL FROM and RCPT TO are the office", "info@orechdin.be" in meta["mail_from"] and "info@orechdin.be" in meta["rcpt"][0], meta)
    check("login was sent (AUTH PLAIN)", meta["auth"] is not None)
    check("Reply-To is the visitor", "test.person@example.com" in str(msg["Reply-To"]), msg["Reply-To"])
    check("Subject", str(msg["Subject"]) == "Website contact: Test Person", msg["Subject"])
    text = msg.get_body(preferencelist=("plain",)).get_content()
    htmlp = msg.get_body(preferencelist=("html",)).get_content()
    check("plain part has the fields", all(x in text for x in ("Name: Test Person", "Email: test.person@example.com", "Phone: +32 3 123 45 67", "Language of the page: en", "Hello, this is a test message")), text)
    check("html part present", "<strong>Name:</strong> Test Person" in htmlp)

# ---------------------------------------------------------------- Hebrew name, dot at line start, injection and HTML
before = len(mails())
st, b = post(good(name="דבורה ג׳ונסון", locale="he", message="שלום,\n.line starting with a dot\n<script>alert(1)</script> & \"quotes\" 😀"))
time.sleep(0.6)
check("Hebrew message accepted", (st, b.get("ok")) == (200, True), (st, b))
m = mails()
if len(m) > before:
    msg = email.message_from_bytes(open(m[-1], "rb").read(), policy=policy.default)
    text = msg.get_body(preferencelist=("plain",)).get_content()
    htmlp = msg.get_body(preferencelist=("html",)).get_content()
    check("Hebrew subject decodes", "דבורה" in str(msg["Subject"]), msg["Subject"])
    check("Hebrew name in Reply-To decodes", "דבורה" in str(msg["Reply-To"]), msg["Reply-To"])
    check("line starting with a dot survived", "\n.line starting with a dot" in text.replace("\r\n", "\n"), text)
    check("html is escaped", "<script>" not in htmlp and "&lt;script&gt;" in htmlp)
    check("emoji survived", "😀" in text)
else:
    check("Hebrew mail arrived", False)

before = len(mails())
st, b = post(good(name="Bob\r\nBcc: attacker@example.com", message="Injection attempt, ten chars at least."))
time.sleep(0.6)
m = mails()
if len(m) > before:
    raw = open(m[-1], "rb").read().decode("utf-8", "replace")
    header_block = raw.split("\r\n\r\n", 1)[0]
    check("header injection: no Bcc header created", "\r\nBcc:" not in header_block and not any(l.lower().startswith("bcc:") for l in header_block.split("\r\n")), header_block[:300])
else:
    check("injection test mail arrived (name one-lined)", False)

# ---------------------------------------------------------------- rate limit (5 per 10 minutes)
codes = []
for i in range(8):
    st, b = post(good(message="Rate limit test message number %d, long enough." % i)); codes.append(st)
check("rate limit: later requests get 429", 429 in codes, codes)

print("\n%d of %d checks passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
