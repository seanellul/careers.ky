-- The Careers.ky Briefing (spec 8.9): lightweight email-only subscription
-- (no registration required), sent Mondays from the existing daily digest
-- cron (plan cron limits — no new cron entry). Unsubscribe by token link
-- in every email.

-- UP
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  unsubscribe_token VARCHAR(64) UNIQUE NOT NULL,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  unsubscribed_at TIMESTAMP,
  last_sent_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_newsletter_active
  ON newsletter_subscribers (id) WHERE unsubscribed_at IS NULL;

-- DOWN
-- DROP TABLE IF EXISTS newsletter_subscribers;
