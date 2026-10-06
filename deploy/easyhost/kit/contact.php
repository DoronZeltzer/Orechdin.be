<?php
/**
 * POST /api/contact.php: sends the contact form to the office by email.
 *
 * This is the PHP twin of app/api/contact/route.ts (the version that runs on Vercel). It behaves the same
 * way and answers with the same codes, so the form on the website needs no changes:
 *
 *   200 {"ok":true}                      sent (or silently dropped, see "bot traps")
 *   400/403/405/413 {"error":"validation"}
 *   429 {"error":"rate_limited"}
 *   503 {"error":"not_configured"}       the mail settings file is missing or incomplete
 *   502 {"error":"send_failed"}
 *
 * What it does NOT do, on purpose: it stores nothing, it logs no message content, and it calls no third party
 * (no CAPTCHA service). The message goes from the visitor to the office's own mailbox and nowhere else.
 *
 * Protection, all local:
 *   - strict validation and a hard cap on the size of the request;
 *   - a same-site check, so another website cannot post here from a visitor's browser;
 *   - a hidden "honeypot" field and a minimum fill time, answered with a fake success so bots learn nothing;
 *   - at most 5 messages per visitor per 10 minutes (kept as an anonymous hash, in a temporary folder);
 *   - every value that reaches an email header is forced onto one line (no header injection), and the HTML
 *     part of the email is escaped.
 *
 * The mail settings (server, login, password) are NOT in this file. They live in orechdin-mail.php, one
 * folder ABOVE the website's /www folder, where no browser can ever reach them. See INSTRUCTIONS.md.
 */
declare(strict_types=1);

const WINDOW_SECONDS = 600;
const MAX_PER_WINDOW = 5;
const MAX_BODY_BYTES = 20000;
const MIN_FILL_MS = 2500;

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $error, int $status): never
{
    respond(['error' => $error], $status);
}

/** Header values must be one line, or a visitor could inject extra headers. */
function one_line(string $s): string
{
    return trim(preg_replace('/[\r\n\x{2028}\x{2029}]+/u', ' ', $s) ?? '');
}

function html(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** A header value that may contain non-ASCII text, as RFC 2047 encoded words of at most 40 bytes each. */
function mime_header(string $s): string
{
    if (preg_match('/^[A-Za-z0-9 .:_-]{0,60}$/', $s) === 1) {
        return $s;
    }
    $parts = [];
    $offset = 0;
    $length = strlen($s);
    while ($offset < $length) {
        $chunk = mb_strcut($s, $offset, 40, 'UTF-8');
        if ($chunk === '') {
            break;
        }
        $parts[] = '=?UTF-8?B?' . base64_encode($chunk) . '?=';
        $offset += strlen($chunk);
    }
    return implode("\r\n ", $parts);
}

/* ------------------------------------------------------------------------------ the request itself */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    fail('validation', 405);
}

// Same site only. A missing Origin (curl, server to server) is allowed; a different one is a cross-site post.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $originHost = parse_url($origin, PHP_URL_HOST);
    $originPort = parse_url($origin, PHP_URL_PORT);
    if (!is_string($originHost)) {
        fail('validation', 403);
    }
    $originHostPort = strtolower($originHost) . ($originPort ? ':' . $originPort : '');
    if ($originHostPort !== strtolower((string)($_SERVER['HTTP_HOST'] ?? ''))) {
        fail('validation', 403);
    }
}

$raw = (string)file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
if (strlen($raw) > MAX_BODY_BYTES) {
    fail('validation', 413);
}
$body = json_decode($raw, true);
if (!is_array($body)) {
    fail('validation', 400);
}

/* ------------------------------------------------------------------------------ validation (same limits as the website) */

function text_field(array $b, string $key, int $min, int $max): ?string
{
    if (!isset($b[$key]) || !is_string($b[$key])) {
        return null;
    }
    $v = trim($b[$key]);
    $len = mb_strlen($v, 'UTF-8');
    return ($len >= $min && $len <= $max) ? $v : null;
}

$name = text_field($body, 'name', 2, 120);
$message = text_field($body, 'message', 10, 5000);
$email = text_field($body, 'email', 3, 200);
if ($name === null || $message === null || $email === null || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    fail('validation', 400);
}

$phone = '';
if (isset($body['phone'])) {
    if (!is_string($body['phone'])) {
        fail('validation', 400);
    }
    $phone = trim($body['phone']);
    if (mb_strlen($phone, 'UTF-8') > 40 || preg_match('/^[0-9+().\/\s-]*$/', $phone) !== 1) {
        fail('validation', 400);
    }
}

$locale = $body['locale'] ?? null;
if (!is_string($locale) || !in_array($locale, ['en', 'nl', 'he'], true)) {
    fail('validation', 400);
}
$honeypot = isset($body['website']) && is_string($body['website']) ? $body['website'] : '';
$elapsed = $body['elapsedMs'] ?? null;
if (!(is_int($elapsed) || is_float($elapsed)) || $elapsed < 0) {
    fail('validation', 400);
}

// Bot traps: answer as if it worked, send nothing.
if ($honeypot !== '' || $elapsed < MIN_FILL_MS) {
    respond(['ok' => true]);
}

/* ------------------------------------------------------------------------------ rate limit */

function client_ip(): string
{
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    // Behind a caching proxy (Varnish) the connection comes from the proxy itself; then the real visitor is the
    // first address in X-Forwarded-For. Only trusted when the connection is from a private or local address.
    $public = filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false;
    if (!$public && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $first = trim(explode(',', (string)$_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
        if (filter_var($first, FILTER_VALIDATE_IP) !== false) {
            return $first;
        }
    }
    return $ip;
}

function rate_limited(string $ip): bool
{
    $dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'orechdin-contact';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        return false; // no place to keep the counter: do not block real visitors
    }
    $now = time();
    // Occasionally tidy up this form's own counters that have expired.
    if (random_int(1, 50) === 1) {
        foreach (glob($dir . DIRECTORY_SEPARATOR . '*.hits') ?: [] as $old) {
            if ($now - (int)@filemtime($old) > WINDOW_SECONDS) {
                @unlink($old);
            }
        }
    }
    $file = $dir . DIRECTORY_SEPARATOR . hash('sha256', 'orechdin|' . $ip) . '.hits';
    $fh = @fopen($file, 'c+');
    if ($fh === false) {
        return false;
    }
    flock($fh, LOCK_EX);
    $times = array_values(array_filter(
        array_map('intval', array_filter(explode("\n", (string)stream_get_contents($fh)), 'strlen')),
        static fn(int $t): bool => $now - $t < WINDOW_SECONDS
    ));
    $limited = count($times) >= MAX_PER_WINDOW;
    if (!$limited) {
        $times[] = $now;
    }
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, implode("\n", $times));
    flock($fh, LOCK_UN);
    fclose($fh);
    return $limited;
}

if (rate_limited(client_ip())) {
    fail('rate_limited', 429);
}

/* ------------------------------------------------------------------------------ mail settings */

function load_mail_config(): ?array
{
    $candidates = [];
    $docRoot = (string)($_SERVER['DOCUMENT_ROOT'] ?? '');
    if ($docRoot !== '') {
        $candidates[] = dirname(rtrim($docRoot, '/\\')) . '/orechdin-mail.php';
    }
    $candidates[] = dirname(__DIR__, 2) . '/orechdin-mail.php'; // www/api -> the folder above www
    foreach ($candidates as $path) {
        if (is_file($path)) {
            // Anything the settings file prints is thrown away. A file saved in Windows Notepad starts with an
            // invisible marker (a "BOM") that would otherwise be sent in front of the answer.
            ob_start();
            try {
                $cfg = include $path;
            } finally {
                ob_end_clean();
            }
            if (is_array($cfg)) {
                $host = (string)($cfg['host'] ?? '');
                $from = (string)($cfg['from'] ?? '');
                $to = (string)($cfg['to'] ?? $from);
                if ($host !== '' && filter_var($from, FILTER_VALIDATE_EMAIL) !== false && filter_var($to, FILTER_VALIDATE_EMAIL) !== false) {
                    return [
                        'host' => $host,
                        'port' => (int)($cfg['port'] ?? 465),
                        'user' => (string)($cfg['user'] ?? ''),
                        'password' => (string)($cfg['password'] ?? ''),
                        'from' => $from,
                        'to' => $to,
                    ];
                }
            }
        }
    }
    return null;
}

$cfg = load_mail_config();
if ($cfg === null) {
    fail('not_configured', 503);
}

/* ------------------------------------------------------------------------------ the email */

$name = one_line($name);
$phone = one_line($phone);

$textLines = [
    'Name: ' . $name,
    'Email: ' . $email,
];
if ($phone !== '') {
    $textLines[] = 'Phone: ' . $phone;
}
$textLines[] = 'Language of the page: ' . $locale;
$textLines[] = '';
$textLines[] = $message;
$text = str_replace(["\r\n", "\r"], "\n", implode("\n", $textLines));
$text = str_replace("\n", "\r\n", $text);

$htmlBody = '<p><strong>Name:</strong> ' . html($name) . '<br>'
    . '<strong>Email:</strong> ' . html($email) . '<br>'
    . ($phone !== '' ? '<strong>Phone:</strong> ' . html($phone) . '<br>' : '')
    . '<strong>Language of the page:</strong> ' . html($locale) . '</p>'
    . '<p style="white-space:pre-wrap">' . html($message) . '</p>';

$boundary = '=_orechdin_' . bin2hex(random_bytes(12));
$fromDomain = substr(strrchr($cfg['from'], '@') ?: '@orechdin.be', 1);
$headers = [
    'Date: ' . date('r'),
    'From: ' . mime_header('Orechdin website') . ' <' . $cfg['from'] . '>',
    'To: <' . $cfg['to'] . '>',
    'Reply-To: ' . mime_header($name) . ' <' . $email . '>',
    'Subject: ' . mime_header('Website contact: ' . $name),
    'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . $fromDomain . '>',
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
];
$mime = implode("\r\n", $headers) . "\r\n\r\n"
    . '--' . $boundary . "\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
    . chunk_split(base64_encode($text), 76, "\r\n")
    . '--' . $boundary . "\r\n"
    . "Content-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
    . chunk_split(base64_encode($htmlBody), 76, "\r\n")
    . '--' . $boundary . "--\r\n";

/* ------------------------------------------------------------------------------ sending (plain SMTP with login) */

/** Reads one SMTP reply (it may span several lines) and returns [code, text]. */
function smtp_read($fp): array
{
    $lines = [];
    do {
        $line = fgets($fp, 2048);
        if ($line === false) {
            throw new RuntimeException('read');
        }
        $lines[] = rtrim($line);
    } while (strlen($line) >= 4 && $line[3] === '-');
    return [(int)substr($lines[0], 0, 3), implode("\n", $lines)];
}

/** Sends a command and checks the reply code. */
function smtp_cmd($fp, ?string $command, array $expected): string
{
    if ($command !== null) {
        if (fwrite($fp, $command . "\r\n") === false) {
            throw new RuntimeException('write');
        }
    }
    [$code, $text] = smtp_read($fp);
    if (!in_array($code, $expected, true)) {
        throw new RuntimeException('smtp_' . $code);
    }
    return $text;
}

function smtp_send(array $c, string $data): void
{
    $implicitTls = $c['port'] === 465;
    $context = stream_context_create(['ssl' => [
        'verify_peer' => true,
        'verify_peer_name' => true,
        'peer_name' => $c['host'],
        'SNI_enabled' => true,
    ]]);
    $fp = @stream_socket_client(
        ($implicitTls ? 'ssl://' : 'tcp://') . $c['host'] . ':' . $c['port'],
        $errno,
        $errstr,
        12,
        STREAM_CLIENT_CONNECT,
        $context
    );
    if ($fp === false) {
        throw new RuntimeException('connect');
    }
    stream_set_timeout($fp, 15);
    try {
        smtp_cmd($fp, null, [220]);
        $helo = 'orechdin.be';
        $caps = smtp_cmd($fp, 'EHLO ' . $helo, [250]);

        if (!$implicitTls && stripos($caps, 'STARTTLS') !== false) {
            smtp_cmd($fp, 'STARTTLS', [220]);
            if (stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT) !== true) {
                throw new RuntimeException('tls');
            }
            $caps = smtp_cmd($fp, 'EHLO ' . $helo, [250]);
        }

        if ($c['user'] !== '') {
            if (stripos($caps, 'AUTH') !== false && stripos($caps, 'PLAIN') !== false) {
                smtp_cmd($fp, 'AUTH PLAIN ' . base64_encode("\0" . $c['user'] . "\0" . $c['password']), [235]);
            } else {
                smtp_cmd($fp, 'AUTH LOGIN', [334]);
                smtp_cmd($fp, base64_encode($c['user']), [334]);
                smtp_cmd($fp, base64_encode($c['password']), [235]);
            }
        }

        smtp_cmd($fp, 'MAIL FROM:<' . $c['from'] . '>', [250]);
        smtp_cmd($fp, 'RCPT TO:<' . $c['to'] . '>', [250, 251]);
        smtp_cmd($fp, 'DATA', [354]);
        // Normalise line ends and protect lines that start with a dot, then end the message with a lone dot.
        $data = preg_replace('/\r\n|\r|\n/', "\r\n", $data) ?? $data;
        $data = preg_replace('/^\./m', '..', $data) ?? $data;
        if (fwrite($fp, $data . "\r\n.\r\n") === false) {
            throw new RuntimeException('write');
        }
        smtp_cmd($fp, null, [250]);
        @fwrite($fp, "QUIT\r\n");
    } finally {
        @fclose($fp);
    }
}

try {
    smtp_send($cfg, $mime);
} catch (Throwable $e) {
    // Log the failure code only, never the visitor's message or address.
    error_log('[contact] send failed: ' . $e->getMessage());
    fail('send_failed', 502);
}

respond(['ok' => true]);
