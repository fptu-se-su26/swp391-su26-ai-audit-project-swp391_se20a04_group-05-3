$conn = New-Object System.Data.SqlClient.SqlConnection
$conn.ConnectionString = "Server=localhost,1433;Database=GreenLife;User Id=sa;Password=sa;Encrypt=False;"
try {
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('stores') AND name = 'verification_document') BEGIN ALTER TABLE stores ADD verification_document NVARCHAR(500) NULL; END"
    $res = $cmd.ExecuteNonQuery()
    Write-Output "Patch applied successfully. Result code: $res"
} catch {
    Write-Error $_.Exception.Message
} finally {
    $conn.Close()
}
