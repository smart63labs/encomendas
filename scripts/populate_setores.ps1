# Script para popular a tabela SETORES com dados únicos do CSV dos servidores
# Extrai dados das colunas: ORGAO, SETOR, LOTACAO, HIERARQUIA_SETOR, MUNICIPIO_LOTACAO

$csvPath = "c:\Users\88417646191\Documents\NovoProtocolo\V2\docs\SERVIDORES DA SEFAZ_22-05-2025.csv"
$apiUrl = "http://localhost:3001/api/database/execute-sql"

# Função para executar SQL
function Execute-SQL {
    param([string]$sql)
    
    $headers = @{ 'Content-Type' = 'application/json' }
    $body = @{ sql = $sql } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri $apiUrl -Method POST -Headers $headers -Body $body
        $result = $response.Content | ConvertFrom-Json
        return $result
    }
    catch {
        Write-Host "Erro ao executar SQL: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Função para escapar aspas simples no SQL
function Escape-SqlString {
    param([string]$text)
    if ([string]::IsNullOrEmpty($text)) {
        return "NULL"
    }
    return "'" + $text.Replace("'", "''") + "'"
}

Write-Host "Iniciando importação dos setores..." -ForegroundColor Green

# Ler o CSV
try {
    $dados = Import-Csv -Path $csvPath -Delimiter ';' -Encoding UTF8
    Write-Host "CSV carregado com $($dados.Count) registros" -ForegroundColor Yellow
}
catch {
    Write-Host "Erro ao ler CSV: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Extrair setores únicos
$setoresUnicos = @{}

foreach ($linha in $dados) {
    # Criar chave única baseada em ORGAO + SETOR + LOTACAO
    $orgao = if ($linha.ORGAO) { $linha.ORGAO.Trim() } else { "" }
    $setor = if ($linha.SETOR) { $linha.SETOR.Trim() } else { "" }
    $lotacao = if ($linha.LOTACAO) { $linha.LOTACAO.Trim() } else { "" }
    $hierarquia = if ($linha.HIERARQUIA_SETOR) { $linha.HIERARQUIA_SETOR.Trim() } else { "" }
    $municipio = if ($linha.MUNICIPIO_LOTACAO) { $linha.MUNICIPIO_LOTACAO.Trim() } else { "" }
    
    if ([string]::IsNullOrEmpty($orgao) -or [string]::IsNullOrEmpty($setor)) {
        continue
    }
    
    # Gerar código do setor baseado na hierarquia ou criar um baseado no setor
    $codigoSetor = ""
    if (![string]::IsNullOrEmpty($hierarquia)) {
        # Extrair o último código da hierarquia
        $partes = $hierarquia.Split('/')
        $ultimaParte = $partes[-1]
        if ($ultimaParte -match '^\d+\.[A-Z]+') {
            $codigoSetor = $ultimaParte
        }
    }
    
    if ([string]::IsNullOrEmpty($codigoSetor)) {
        # Gerar código baseado no setor (primeiras letras + número sequencial)
        $prefixo = ($setor -replace '[^A-Z]', '').Substring(0, [Math]::Min(6, ($setor -replace '[^A-Z]', '').Length))
        $codigoSetor = "$prefixo" + ($setoresUnicos.Count + 1).ToString("000")
    }
    
    # Chave única para evitar duplicatas
    $chave = "$orgao|$setor|$lotacao"
    
    if (!$setoresUnicos.ContainsKey($chave)) {
        $setoresUnicos[$chave] = @{
            CodigoSetor = $codigoSetor
            Orgao = $orgao
            Setor = $setor
            Lotacao = $lotacao
            Hierarquia = $hierarquia
            Municipio = $municipio
        }
    }
}

Write-Host "Encontrados $($setoresUnicos.Count) setores únicos" -ForegroundColor Yellow

# Limpar tabela antes de inserir
Write-Host "Limpando tabela SETORES..." -ForegroundColor Yellow
$result = Execute-SQL "DELETE FROM SETORES"
if ($result -and $result.success) {
    Write-Host "Tabela SETORES limpa com sucesso" -ForegroundColor Green
}

# Inserir setores na tabela
$contador = 0
$lote = 0
$tamanhoLote = 50

foreach ($setor in $setoresUnicos.Values) {
    $contador++
    $lote++
    
    $codigoSetor = Escape-SqlString $setor.CodigoSetor
    $orgao = Escape-SqlString $setor.Orgao
    $setorNome = Escape-SqlString $setor.Setor
    $lotacao = if ([string]::IsNullOrEmpty($setor.Lotacao)) { "NULL" } else { Escape-SqlString $setor.Lotacao }
    $hierarquia = if ([string]::IsNullOrEmpty($setor.Hierarquia)) { "NULL" } else { Escape-SqlString $setor.Hierarquia }
    $municipio = if ([string]::IsNullOrEmpty($setor.Municipio)) { "NULL" } else { Escape-SqlString $setor.Municipio }
    
    $sql = "INSERT INTO SETORES (CODIGO_SETOR, ORGAO, SETOR, LOTACAO, HIERARQUIA_SETOR, MUNICIPIO_LOTACAO, ATIVO) VALUES ($codigoSetor, $orgao, $setorNome, $lotacao, $hierarquia, $municipio, 1)"
    
    $result = Execute-SQL $sql
    
    if ($result -and $result.success) {
        if ($lote -eq $tamanhoLote) {
            Write-Host "Inseridos $contador setores..." -ForegroundColor Yellow
            $lote = 0
        }
    } else {
        Write-Host "Erro ao inserir setor: $($setor.Setor)" -ForegroundColor Red
    }
}

Write-Host "Importação concluída! Total de setores inseridos: $contador" -ForegroundColor Green

# Verificar quantos registros foram inseridos
$result = Execute-SQL "SELECT COUNT(*) as TOTAL FROM SETORES"
if ($result -and $result.success -and $result.data.Count -gt 0) {
    Write-Host "Total de registros na tabela SETORES: $($result.data[0].TOTAL)" -ForegroundColor Green
}