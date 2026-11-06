# Mounted only into the e2e stack (see docker-compose.yml). Development builds URLs for
# localhost:3000 (the dev API), so cover image URLs would miss this stack's published port.
Rails.application.routes.default_url_options = { host: "localhost", port: 3100 }
