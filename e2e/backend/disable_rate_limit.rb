# Mounted only into the e2e stack (see docker-compose.yml). Every request in the suite comes
# from the same IP, so the per-IP throttles would trip after a run or two.
Rack::Attack.enabled = false
