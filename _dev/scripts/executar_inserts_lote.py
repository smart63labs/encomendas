import json

def executar_inserts_em_lote():
    """Executa os INSERTs em lotes usando comandos SQL múltiplos"""
    
    # Carrega os comandos do arquivo JSON
    try:
        with open('comandos_insert_setores.json', 'r', encoding='utf-8') as f:
            comandos = json.load(f)
    except FileNotFoundError:
        print("Erro: Arquivo 'comandos_insert_setores.json' não encontrado!")
        return False
    
    print(f"Carregados {len(comandos)} comandos INSERT")
    
    # Agrupa os comandos em lotes de 10
    tamanho_lote = 10
    total_lotes = (len(comandos) + tamanho_lote - 1) // tamanho_lote
    
    print(f"Executando em {total_lotes} lotes de até {tamanho_lote} registros cada")
    
    # Gera os lotes de comandos SQL
    for i in range(0, len(comandos), tamanho_lote):
        lote_atual = i // tamanho_lote + 1
        lote_comandos = comandos[i:i + tamanho_lote]
        
        print(f"\n=== LOTE {lote_atual}/{total_lotes} ===")
        print(f"Registros {i+1} a {min(i+tamanho_lote, len(comandos))}")
        
        # Cria um script SQL com múltiplos INSERTs
        sql_lote = "BEGIN\n"
        
        for cmd in lote_comandos:
            # Remove o comentário LLM do SQL individual
            sql_limpo = cmd['sql'].replace('INSERT /* LLM in use is claude-sonnet-4 */ INTO', 'INSERT INTO')
            sql_lote += f"  {sql_limpo};\n"
            print(f"  - ID {cmd['id']}: {cmd['codigo']} - {cmd['nome'][:50]}...")
        
        sql_lote += "  COMMIT;\nEND;\n/"
        
        # Salva o lote em um arquivo para referência
        nome_arquivo = f"lote_{lote_atual:03d}.sql"
        with open(nome_arquivo, 'w', encoding='utf-8') as f:
            f.write(f"-- Lote {lote_atual} - Registros {i+1} a {min(i+tamanho_lote, len(comandos))}\n")
            f.write(sql_lote)
        
        print(f"  Arquivo gerado: {nome_arquivo}")
        print(f"  Tamanho do SQL: {len(sql_lote)} caracteres")
    
    print(f"\n✅ {total_lotes} arquivos de lote gerados com sucesso!")
    print("\nPróximos passos:")
    print("1. Execute cada arquivo .sql usando o MCP")
    print("2. Ou use os comandos individuais conforme necessário")
    
    return True

if __name__ == "__main__":
    print("=== GERAÇÃO DE LOTES PARA EXECUÇÃO VIA MCP ===")
    sucesso = executar_inserts_em_lote()
    
    if not sucesso:
        print("\n❌ Falha na geração dos lotes!")
        exit(1)