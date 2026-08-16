-- M4: repository social preview (Open Graph) image for plugin cards.
-- Populated from the GitHub GraphQL `Repository.openGraphImageUrl` field
-- (the same image GitHub shows on topic/explore pages). NULL means no
-- preview is available and the client falls back to kun.png.

ALTER TABLE repositories ADD COLUMN preview_image_url TEXT;
