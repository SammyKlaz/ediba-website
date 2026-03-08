-- Schema for Render import

-- users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- events
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  event_date DATE,
  flyer TEXT,
  comment_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- event_comments
CREATE TABLE IF NOT EXISTS event_comments (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  parent_comment_id INTEGER REFERENCES event_comments(id) ON DELETE CASCADE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- event_likes
CREATE TABLE IF NOT EXISTS event_likes (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

-- event_media
CREATE TABLE IF NOT EXISTS event_media (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  media_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- sermons
CREATE TABLE IF NOT EXISTS sermons (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bible_passage TEXT,
  sermon_date DATE,
  speaker TEXT,
  video TEXT,
  comment_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- sermon_comments
CREATE TABLE IF NOT EXISTS sermon_comments (
  id SERIAL PRIMARY KEY,
  sermon_id INTEGER NOT NULL REFERENCES sermons(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  parent_comment_id INTEGER REFERENCES sermon_comments(id) ON DELETE CASCADE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- sermon_likes
CREATE TABLE IF NOT EXISTS sermon_likes (
  id SERIAL PRIMARY KEY,
  sermon_id INTEGER NOT NULL REFERENCES sermons(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sermon_id, user_id)
);

-- ministers
CREATE TABLE IF NOT EXISTS ministers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  photo TEXT,
  position TEXT,
  short_intro TEXT,
  biography TEXT,
  is_in_charge BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- about
CREATE TABLE IF NOT EXISTS about (
  id SERIAL PRIMARY KEY,
  membership_total INTEGER,
  membership_year INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- homepage_images
CREATE TABLE IF NOT EXISTS homepage_images (
  id SERIAL PRIMARY KEY,
  section TEXT NOT NULL UNIQUE,
  file_path TEXT,
  alt_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- give
CREATE TABLE IF NOT EXISTS give (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  bank_name TEXT,
  account_name TEXT,
  account_number TEXT,
  is_main BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  year INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- birthdays
CREATE TABLE IF NOT EXISTS birthdays (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  photo TEXT,
  arm TEXT,
  position TEXT,
  year INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- receipts
CREATE TABLE IF NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2),
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
