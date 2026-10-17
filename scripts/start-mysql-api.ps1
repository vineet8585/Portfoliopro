$ErrorActionPreference = 'Stop'
$securePassword = Read-Host 'MySQL password for portfolio_user (input is hidden)' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
    $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    $encodedPassword = [Uri]::EscapeDataString($password)
    $env:DATABASE_URL = "mysql://portfolio_user:$encodedPassword@127.0.0.1:3306/portfoliopro"
    $env:PORT = '8081'
    $env:SPRING_PROFILES_ACTIVE = 'local'

    $backend = Join-Path $PSScriptRoot '..\backend'
    $mavenArguments = @(
        '-f', (Join-Path $backend 'pom.xml'),
        '-B',
        '-e',
        '-Dspring-boot.run.fork=false',
        'spring-boot:run'
    )
    $logPath = Join-Path $backend 'target\mysql-startup.log'
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & (Join-Path $backend 'mvnw.cmd') @mavenArguments 2>&1 | Tee-Object -FilePath $logPath
    $mavenExitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorActionPreference
    exit $mavenExitCode
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
}