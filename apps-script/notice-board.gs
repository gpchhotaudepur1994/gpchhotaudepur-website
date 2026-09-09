/**
 * Government Polytechnic, Chhotaudepur — Notice Board Apps Script
 *
 * Public, read-only JSON bridge between the "Notice Board" Google Sheet and
 * the website's fetchNotices() (see js/main.js). This file is a reference
 * copy only — it is not run by the website itself and is not part of the
 * static site. Deploy it separately:
 *
 *   1. Open the Notice Board Google Sheet.
 *   2. Extensions > Apps Script.
 *   3. Replace the default Code.gs contents with this file's contents.
 *   4. Set SHEET_ID (and SHEET_NAME if different) below.
 *   5. Deploy > New deployment > type "Web app".
 *        Execute as:      Me
 *        Who has access:  Anyone   (must be public/anonymous access — NOT
 *                          "Anyone with a Google account" — otherwise the
 *                          website's fetch() will be blocked with a login
 *                          redirect instead of JSON)
 *   6. Copy the resulting URL (ends in /exec) into js/main.js's
 *      NOTICE_API_URL constant.
 *
 * Expected sheet layout — first row is headers, exact column names:
 *   Date | Notice | Description | Link | Active
 * Only rows with Active = "Yes" (case-insensitive) are published. Rows do
 * not need to already be sorted — this script sorts by Date, newest first.
 */

// CONFIGURE THIS: the Google Sheet's ID (the long string in its URL between
// "/d/" and "/edit"). Kept here, not in the website, so it's never exposed
// to a visitor's browser — see CLAUDE.md "Notice Board Maintenance".
var SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';

// Change this if the notices live on a differently named sheet/tab.
var SHEET_NAME = 'Notice Board';

function doGet(e) {
  var notices = [];

  try {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    var values = sheet.getDataRange().getValues();

    if (values.length > 1) {
      var headers = values[0].map(function (h) { return String(h).trim().toLowerCase(); });
      var dateCol = headers.indexOf('date');
      var noticeCol = headers.indexOf('notice');
      var descCol = headers.indexOf('description');
      var linkCol = headers.indexOf('link');
      var activeCol = headers.indexOf('active');

      for (var i = 1; i < values.length; i++) {
        var row = values[i];
        var title = noticeCol > -1 ? row[noticeCol] : '';
        var rawDate = dateCol > -1 ? row[dateCol] : '';

        // Skip blank rows safely (e.g. trailing empty rows in the sheet).
        if (!title && !rawDate) continue;

        var active = activeCol > -1 ? String(row[activeCol]).trim().toLowerCase() : 'yes';
        if (active !== 'yes') continue;

        notices.push({
          date: formatDate_(rawDate),
          title: String(title || '').trim(),
          description: descCol > -1 ? String(row[descCol] || '').trim() : '',
          link: linkCol > -1 ? String(row[linkCol] || '').trim() : ''
        });
      }
    }

    notices.sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });
  } catch (err) {
    // Return an empty list rather than an error page — the website's
    // fetchNotices() already falls back to data/notices.json if this
    // endpoint fails outright, but a clean empty response here is safer
    // than an exception leaking sheet/script details to a public URL.
    notices = [];
  }

  return ContentService
    .createTextOutput(JSON.stringify(notices))
    .setMimeType(ContentService.MimeType.JSON);
}

// Normalises a Date-typed cell (or an already-text date) to "YYYY-MM-DD" so
// the website's parsing/sorting/formatting is always consistent regardless
// of how the cell is formatted in the sheet.
function formatDate_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value || '').trim();
}
