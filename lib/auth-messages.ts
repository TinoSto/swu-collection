/** Fehlermeldungen, adressiert über ?error=<key> in der URL. */
export const AUTH_ERRORS: Record<string, string> = {
  missing_fields: "Bitte E-Mail und Passwort ausfüllen.",
  password_short: "Das Passwort braucht mindestens 8 Zeichen.",
  password_mismatch: "Die beiden Passwörter stimmen nicht überein.",
  invalid_credentials: "E-Mail oder Passwort ist falsch.",
  email_not_confirmed:
    "Diese E-Mail-Adresse ist noch nicht bestätigt. Öffne den Link in der Bestätigungsmail.",
  user_exists: "Zu dieser E-Mail-Adresse gibt es bereits ein Konto. Melde dich an.",
  weak_password: "Das Passwort ist zu schwach. Wähle ein längeres oder weniger häufiges Passwort.",
  rate_limited: "Zu viele Versuche. Warte kurz und probiere es erneut.",
  callback_failed:
    "Der Bestätigungslink ist ungültig oder abgelaufen. Melde dich an oder registriere dich erneut.",
  unknown: "Das hat nicht geklappt. Versuche es erneut.",
};

/** Hinweise, adressiert über ?message=<key> in der URL. */
export const AUTH_INFOS: Record<string, string> = {
  confirm_email:
    "Konto angelegt. Bestätige deine E-Mail-Adresse über den Link in der Mail und melde dich danach an.",
};