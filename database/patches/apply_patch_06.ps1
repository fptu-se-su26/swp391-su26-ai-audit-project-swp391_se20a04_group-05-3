$sqlFile = "c:\FPT\GreenLife\swp391-su26-ai-audit-project-swp391_se20a04_group-05-3\database\patches\patch_06_notifications.sql"
if (Test-Path $sqlFile) {
    $sql = Get-Content -Raw -Path $sqlFile
    $statements = $sql -split "(?i)\bGO\b"
    $conn = New-Object System.Data.SqlClient.SqlConnection
    $conn.ConnectionString = "Server=localhost,1433;Database=GreenLife;User Id=sa;Password=sa;Encrypt=False;"
    try {
        $conn.Open()
        foreach ($stmt in $statements) {
            $trimmed = $stmt.Trim()
            if ($trimmed) {
                $cmd = $conn.CreateCommand()
                $cmd.CommandText = $trimmed
                [void]$cmd.ExecuteNonQuery()
            }
        }
        Write-Output "Notification patch applied successfully!"
    } catch {
        Write-Error $_.Exception.Message
    } finally {
        $conn.Close()
    }
} else {
    Write-Error "SQL patch file not found."
}
