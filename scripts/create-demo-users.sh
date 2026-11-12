#!/usr/bin/env bash
# Creates the two demo accounts listed in README.md in a Handuty user pool.
# Run it in AWS CloudShell (or anywhere with AWS credentials):
#   bash create-demo-users.sh <user-pool-id>
set -euo pipefail

pool_id="${1:?usage: create-demo-users.sh <user-pool-id>}"

create_user() {
  local email="$1" password="$2"
  aws cognito-idp admin-create-user \
    --user-pool-id "$pool_id" \
    --username "$email" \
    --user-attributes Name=email,Value="$email" Name=email_verified,Value=true \
    --message-action SUPPRESS >/dev/null
  aws cognito-idp admin-set-user-password \
    --user-pool-id "$pool_id" \
    --username "$email" \
    --password "$password" \
    --permanent
  echo "created $email"
}

create_user worker@handuty.test 'Handuty-Worker-2026!'
create_user client@handuty.test 'Handuty-Client-2026!'
