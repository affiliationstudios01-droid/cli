#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"
node --version
printf '%s\n' 'TOTALITY Gateway is ready.'
printf '%s\n' 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before starting.'
printf '%s\n' 'Run: npm start'
