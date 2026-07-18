-- Full-text search trigger for posts.search_vector
-- Run this AFTER prisma migrate dev --name init

-- Create the GIN index on search_vector (Prisma can't create this via schema)
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING GIN(search_vector);

-- Create trigger to auto-update search_vector on insert/update
CREATE OR REPLACE FUNCTION posts_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_search_update ON posts;
CREATE TRIGGER posts_search_update
  BEFORE INSERT OR UPDATE OF title, description ON posts
  FOR EACH ROW
  EXECUTE FUNCTION posts_search_vector_update();

-- Create GiST indexes for geolocation queries (requires earthdistance extension)
-- These are optional — only enable if you have the extensions installed
-- CREATE EXTENSION IF NOT EXISTS cube;
-- CREATE EXTENSION IF NOT EXISTS earthdistance;
-- CREATE INDEX idx_users_location ON users USING GIST(ll_to_earth(latitude, longitude)) WHERE deleted_at IS NULL;
-- CREATE INDEX idx_posts_location ON posts USING GIST(ll_to_earth(latitude, longitude)) WHERE status = 'active';
