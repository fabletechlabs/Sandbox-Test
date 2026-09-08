#!/usr/bin/env bash
# Runs when a person attaches to the codespace.
#
# The containers already start on their own, but they take about forty seconds
# and they do it silently. Someone who opens the codespace and looks straight
# away sees an empty workspace and reasonably decides that nothing ran. This
# script makes the wait visible, says clearly when the app is ready, and then
# leaves the API log on the screen.
#
# The working directory is the workspace folder, so no path is hard-coded.

set -u

echo 'Cardboard: starting the containers...'
docker compose up -d

printf 'Cardboard: waiting for the web app'
for _ in $(seq 1 90); do
  if curl -sf -o /dev/null http://localhost:3000/ 2>/dev/null; then
    echo ''
    echo ''
    echo '  Cardboard is ready. Open port 3000 from the Ports panel.'
    echo ''
    echo '  The API log follows. The simulator fires the webhook every 10s,'
    echo '  so traffic here means the whole chain works. Press Ctrl+C to stop'
    echo '  watching; the app keeps running.'
    echo ''
    exec docker compose logs -f api
  fi
  printf '.'
  sleep 2
done

echo ''
echo 'Cardboard did not answer on port 3000 within three minutes.'
echo "Run 'docker compose ps' and 'docker compose logs api' to see why."
