param(
  [string]$Host = "91.99.109.84",
  [int]$Port = 7722,
  [string]$Branch = "beta",
  [switch]$NoCache = $true
)

Write-Host "[deploy] Remote: $Host:$Port, branch: $Branch, no-cache: $NoCache"

# Build remote command (single-line to avoid quoting issues)
$buildArg = if ($NoCache) { " --no-cache" } else { "" }
$remoteCmd = @(
  'set -e',
  'cd /srv/prime',
  'git fetch --all --prune',
  "git checkout $Branch",
  'git pull --ff-only',
  "docker compose build$buildArg app",
  'docker compose up -d app',
  'docker compose ps',
  'docker compose logs --tail=120 app'
) -join '; '

Write-Host "[deploy] Running remote command via SSH..." -ForegroundColor Cyan

$sshArgs = @('-p', $Port, "deploy@$Host", $remoteCmd)
& ssh @sshArgs

if ($LASTEXITCODE -ne 0) {
  Write-Error "[deploy] SSH command failed with exit code $LASTEXITCODE"
  exit $LASTEXITCODE
}

Write-Host "[deploy] Done" -ForegroundColor Green
