// DEV-ONLY helper. Holds the most recently generated password-reset link in
// memory so it can be surfaced in the UI while no real email provider is
// wired up. Delete this file (and its usages in lib/auth.js and app.js)
// once sendResetPassword actually sends an email.

let lastResetLink = null

function setLastResetLink(url) {
  lastResetLink = url
}

function getLastResetLink() {
  return lastResetLink
}

module.exports = { setLastResetLink, getLastResetLink }
