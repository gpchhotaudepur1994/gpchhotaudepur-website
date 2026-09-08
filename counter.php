<?php
// Single global site-wide visit counter.
//
// Called once per page load (see populateVisitCounter() in js/main.js) via a
// root-relative fetch("/counter.php") — the same convention already used for
// the JSON data files, so this one script works unmodified from every page
// depth. There is exactly one counter for the whole site: this endpoint takes
// no input from the request at all (no filename/path/query parameter is ever
// read), so there is no way for a client to name or influence which file gets
// read or written — the counter file path below is the only one that can
// ever be touched.
//
// Storage is a single plain-text integer file, guarded with an exclusive
// flock() around the read-increment-write so concurrent requests can't race
// or corrupt the count. If the file can't be opened or locked for any reason
// (e.g. missing write permission on shared hosting), this fails quietly with
// a JSON error response rather than a fatal error, so a broken counter can
// never take the rest of the site down with it.

header('Content-Type: application/json');
header('Cache-Control: no-store');

$counterFile = __DIR__ . '/data/visit-count.txt';
$count = null;

$handle = @fopen($counterFile, 'c+');
if ($handle !== false) {
    if (flock($handle, LOCK_EX)) {
        $current = (int) trim((string) stream_get_contents($handle));
        $count = $current + 1;

        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, (string) $count);
        fflush($handle);

        flock($handle, LOCK_UN);
    }
    fclose($handle);
}

if ($count === null) {
    http_response_code(503);
    echo json_encode(['error' => 'Counter unavailable']);
    exit;
}

echo json_encode(['count' => $count]);
