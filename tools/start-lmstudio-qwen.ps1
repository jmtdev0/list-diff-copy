param(
    [string]$Model = "qwen3.5-9b-deepseek-v4-flash",
    [string]$Identifier = "qwen3.5-9b-deepseek-v4-flash",
    [int]$Port = 1234,
    [string]$Bind = "127.0.0.1",
    [string]$Gpu = "max",
    [int]$ContextLength = 50734,
    [int]$Parallel = 4,
    [int]$TimeoutSeconds = 180,
    [switch]$Cors
)

$ErrorActionPreference = "Stop"

function Resolve-LmsPath {
    $command = Get-Command lms -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $fallback = Join-Path $env:USERPROFILE ".lmstudio\bin\lms.exe"
    if (Test-Path -LiteralPath $fallback) {
        return $fallback
    }

    throw "LM Studio CLI 'lms' was not found. Install it from LM Studio or add it to PATH."
}

function Invoke-Lms {
    param([string[]]$Arguments)

    & $script:LmsPath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "lms $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
    }
}

function Test-ServerReady {
    param([string]$BaseUrl)

    try {
        Invoke-RestMethod -Uri "$BaseUrl/api/v1/models" -Method Get -TimeoutSec 3 | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Test-ModelLoaded {
    param(
        [string]$BaseUrl,
        [string]$ExpectedIdentifier,
        [string]$ExpectedModel
    )

    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/models" -Method Get -TimeoutSec 5
        foreach ($modelInfo in $response.models) {
            if ($modelInfo.key -eq $ExpectedModel -or $modelInfo.key -eq $ExpectedIdentifier) {
                foreach ($instance in $modelInfo.loaded_instances) {
                    if ($instance.id -eq $ExpectedIdentifier) {
                        return $true
                    }
                }
            }
        }
    } catch {
        return $false
    }

    return $false
}

$script:LmsPath = Resolve-LmsPath
$baseUrl = "http://$Bind`:$Port"

Write-Host "Using LM Studio CLI: $script:LmsPath"
Write-Host "Starting LM Studio server at $baseUrl ..."

$serverArgs = @("server", "start", "--port", "$Port", "--bind", $Bind)
if ($Cors) {
    $serverArgs += "--cors"
}
Invoke-Lms -Arguments $serverArgs

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
while (-not (Test-ServerReady -BaseUrl $baseUrl)) {
    if ((Get-Date) -gt $deadline) {
        throw "LM Studio server did not become ready within $TimeoutSeconds seconds."
    }
    Start-Sleep -Milliseconds 750
}

Write-Host "Loading model '$Model' as '$Identifier' ..."
$loadArgs = @(
    "load",
    $Model,
    "--identifier",
    $Identifier,
    "--gpu",
    $Gpu,
    "--context-length",
    "$ContextLength",
    "--parallel",
    "$Parallel",
    "--yes"
)
Invoke-Lms -Arguments $loadArgs

while (-not (Test-ModelLoaded -BaseUrl $baseUrl -ExpectedIdentifier $Identifier -ExpectedModel $Model)) {
    if ((Get-Date) -gt $deadline) {
        throw "Model '$Identifier' was not visible in /api/v1/models within $TimeoutSeconds seconds."
    }
    Start-Sleep -Seconds 1
}

$models = Invoke-RestMethod -Uri "$baseUrl/api/v1/models" -Method Get -TimeoutSec 5
$loaded = $models.models |
    Where-Object { $_.loaded_instances | Where-Object { $_.id -eq $Identifier } } |
    Select-Object -First 1
$instance = $loaded.loaded_instances | Where-Object { $_.id -eq $Identifier } | Select-Object -First 1

Write-Host ""
Write-Host "LM Studio is ready."
Write-Host "Base URL: $baseUrl"
Write-Host "Model:    $Identifier"
Write-Host "Context:  $($instance.config.context_length)"
Write-Host "Parallel: $($instance.config.parallel)"
Write-Host ""
Write-Host "Test endpoint:"
Write-Host "  $baseUrl/api/v1/models"
