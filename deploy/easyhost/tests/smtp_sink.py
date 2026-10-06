"""A tiny fake mail server for testing contact.php: accepts everything, writes each received message to a file."""
import asyncio, sys, os, json, time

OUT = sys.argv[2]
PORT = int(sys.argv[1])
os.makedirs(OUT, exist_ok=True)
counter = 0

async def handle(reader, writer):
    global counter
    async def send(line):
        writer.write((line + "\r\n").encode()); await writer.drain()
    meta = {"auth": None, "mail_from": None, "rcpt": []}
    await send("220 sink ESMTP")
    try:
        while True:
            raw = await reader.readline()
            if not raw: break
            line = raw.decode(errors="replace").rstrip("\r\n")
            up = line.upper()
            if up.startswith("EHLO"):
                writer.write(b"250-sink\r\n250-AUTH PLAIN LOGIN\r\n250 8BITMIME\r\n"); await writer.drain()
            elif up.startswith("AUTH PLAIN"):
                meta["auth"] = line; await send("235 ok")
            elif up.startswith("MAIL FROM"):
                meta["mail_from"] = line; await send("250 ok")
            elif up.startswith("RCPT TO"):
                meta["rcpt"].append(line); await send("250 ok")
            elif up == "DATA":
                await send("354 go")
                buf = b""
                while not buf.endswith(b"\r\n.\r\n"):
                    chunk = await reader.readline()
                    if not chunk: break
                    buf += chunk
                counter += 1
                name = f"{int(time.time()*1000)}-{counter}"
                open(os.path.join(OUT, name + ".eml"), "wb").write(buf)
                open(os.path.join(OUT, name + ".json"), "w").write(json.dumps(meta))
                await send("250 queued")
            elif up == "QUIT":
                await send("221 bye"); break
            else:
                await send("250 ok")
    finally:
        writer.close()

async def main():
    srv = await asyncio.start_server(handle, "127.0.0.1", PORT)
    async with srv: await srv.serve_forever()

asyncio.run(main())
