$sqlFile = "c:\FPT\GreenLife\swp391-su26-ai-audit-project-swp391_se20a04_group-05-3\database\patches\patch_08_bookings_snapshots_and_lifecycle.sql"
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
        Write-Output "Bookings snapshots and lifecycle patch applied successfully!"
    } catch {
        Write-Error $_.Exception.Message
    } finally {
        $conn.Close()
    }
} else {
    Write-Error "SQL patch file not found."
}
