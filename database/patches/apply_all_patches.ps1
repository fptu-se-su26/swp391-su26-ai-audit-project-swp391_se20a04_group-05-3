$connectionString = "Server=localhost,1433;Database=GreenLife;User Id=sa;Password=sa;Encrypt=False;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connectionString)
try {
    $conn.Open()
    Write-Host "Connected to SQL Server GreenLife database successfully."
    $sqlFiles = Get-ChildItem -Path "." -Filter "*.sql" | Sort-Object Name
    foreach ($file in $sqlFiles) {
        Write-Host "Applying $($file.Name)..."
        $content = Get-Content $file.FullName -Raw
        # Split by GO if GO statements exist, otherwise execute directly
        $statements = $content -split "(?im)^\s*GO\s*$`r?\n?"
        foreach ($stmt in $statements) {
            $trimmed = $stmt.Trim()
            if ($trimmed) {
                $cmd = $conn.CreateCommand()
                $cmd.CommandText = $trimmed
                $cmd.CommandTimeout = 120
                try {
                    [void]$cmd.ExecuteNonQuery()
                } catch {
                    Write-Host "  Warning/Error in statement of $($file.Name): $($_.Exception.Message)"
                }
            }
        }
    }
    Write-Host "All database patches processed!"
} catch {
    Write-Error "Database connection failed: $($_.Exception.Message)"
} finally {
    if ($conn.State -eq 'Open') { $conn.Close() }
}
