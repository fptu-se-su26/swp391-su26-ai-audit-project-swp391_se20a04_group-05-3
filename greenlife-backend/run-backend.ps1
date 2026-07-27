$env:JAVA_HOME = "C:\Program Files\Java\jdk-21.0.10"
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $kv = $line.Split("=", 2)
            [System.Environment]::SetEnvironmentVariable($kv[0].Trim(), $kv[1].Trim(), "Process")
        }
    }
}
Write-Host "Starting GreenLife Backend with JAVA_HOME=$env:JAVA_HOME and AI_ENABLED=$env:AI_ENABLED"
.\mvnw.cmd spring-boot:run
