/**
 * Government Polytechnic, Chhotaudepur — Website Visit Counter Apps Script
 *
 * The single, global, website-wide visit counter. Every page of the website
 * calls this Web App once per page load (populateVisitCounter() in
 * js/main.js); each call adds one to the same shared total and returns the
 * new total as JSON: {"count": 1234}.
 *
 * Why Apps Script: the website is static (GitHub Pages now, possibly ERNET
 * hosting later), so it cannot run server-side code itself — counter.php
 * never executed on GitHub Pages. The Notice Board already uses an Apps
 * Script Web App the same way (apps-script/notice-board.gs), so this adds no
 * new vendor, account, cost or credential to the website. See CLAUDE.md
 * "Site-wide visit counter".
 *
 * This file is a reference copy — it is not run by the website. Deploy it
 * separately, as its OWN Apps Script project (one project can only have one
 * doGet, so it cannot share the Notice Board's project):
 *
 *   1. Go to https://script.google.com/ with the institute's Google account
 *      and choose New project. Name it e.g. "GPC Website Visit Counter".
 *   2. Replace the default Code.gs contents with this file's contents. Save.
 *   3. Deploy > New deployment > Select type: "Web app".
 *        Execute as:      Me
 *        Who has access:  Anyone   (must be public/anonymous access — NOT
 *                          "Anyone with a Google account" — otherwise the
 *                          website's fetch() gets a login page, not JSON)
 *      Approve the authorisation prompt.
 *   4. Copy the Web App URL (ends in /exec) into js/main.js's
 *      VISIT_COUNTER_API_URL constant, then publish the website.
 *
 * Opening the /exec URL in a browser also counts as one visit — expected.
 *
 * Storage: one Script Property (Project Settings > Script Properties), named
 * by COUNT_PROPERTY below. It starts at 0 automatically on the first call.
 * To carry over an official, verified count from an earlier counter, set that
 * property's value to that number before going live; never invent one.
 *
 * Concurrency: the read-increment-write runs under LockService's script lock,
 * so simultaneous visitors can't overwrite each other's increments. If the
 * lock or storage is unavailable, or the stored value isn't a whole number,
 * the script returns {"error": ...} instead of a count (leaving the stored
 * value untouched), and the website simply keeps the counter line hidden.
 */

var COUNT_PROPERTY = 'websiteVisitCount';

function doGet() {
  var count = null;
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);
    var props = PropertiesService.getScriptProperties();
    var stored = props.getProperty(COUNT_PROPERTY);
    // A hand-edited, blank or non-numeric value must not silently reset the
    // total — only a missing property (never counted yet) starts from 0.
    if (stored !== null && !/^\d+$/.test(stored)) throw new Error('Invalid stored count');
    count = (stored === null ? 0 : parseInt(stored, 10)) + 1;
    props.setProperty(COUNT_PROPERTY, String(count));
  } catch (err) {
    count = null;
  } finally {
    lock.releaseLock();
  }

  var body = count === null ? { error: 'Counter unavailable' } : { count: count };
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
