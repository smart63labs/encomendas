import csv
import json

def processar_csv_e_inserir_via_mcp():
    """Lê o CSV e gera comandos INSERT SQL para execução via MCP"""
    csv_file = r'c:\Users\88417646191\Documents\NovoProtocolo\V2\docs\SETORES_NORMALIZADO_PROCESSADO.CSV'
    
    print(f"Processando arquivo: {csv_file}")
    
    try:
        with open(csv_file, 'r', encoding='utf-8-sig') as file:  # utf-8-sig remove o BOM
            # Usa ponto e vírgula como delimitador
            csv_reader = csv.DictReader(file, delimiter=';')
            
            contador = 0
            comandos_sql = []
            
            for row in csv_reader:
                contador += 1
                
                # Pula o primeiro registro que já foi inserido
                if contador == 1:
                    continue
                
                # Trata valores nulos e escapa aspas simples
                def tratar_valor(valor):
                    if valor is None or valor.strip() == '':
                        return 'NULL'
                    # Escapa aspas simples
                    valor_escapado = valor.replace("'", "''")
                    return f"'{valor_escapado}'"
                
                # Monta o comando INSERT
                sql = f"""INSERT /* LLM in use is claude-sonnet-4 */ INTO SETORES (
                    ID, CODIGO_SETOR, NOME_SETOR, ORGAO, ATIVO, CREATED_AT, UPDATED_AT,
                    LOGRADOURO, NUMERO, COMPLEMENTO, BAIRRO, CIDADE, ESTADO, CEP,
                    TELEFONE, EMAIL, LATITUDE, LONGITUDE
                ) VALUES (
                    {row['ID']},
                    {tratar_valor(row['CODIGO_SETOR'])},
                    {tratar_valor(row['NOME_SETOR'])},
                    {tratar_valor(row['ORGAO'])},
                    {row['ATIVO']},
                    SYSDATE,
                    SYSDATE,
                    {tratar_valor(row['LOGRADOURO'])},
                    {tratar_valor(row['NUMERO'])},
                    {tratar_valor(row['COMPLEMENTO'])},
                    {tratar_valor(row['BAIRRO'])},
                    {tratar_valor(row['CIDADE'])},
                    {tratar_valor(row['ESTADO'])},
                    {tratar_valor(row['CEP'])},
                    {tratar_valor(row['TELEFONE'])},
                    {tratar_valor(row['EMAIL'])},
                    {row['LATITUDE'] if row['LATITUDE'] else 'NULL'},
                    {row['LONGITUDE'] if row['LONGITUDE'] else 'NULL'}
                )"""
                
                comandos_sql.append({
                    'id': row['ID'],
                    'codigo': row['CODIGO_SETOR'],
                    'nome': row['NOME_SETOR'],
                    'sql': sql
                })
            
            print(f"\nTotal de comandos INSERT preparados: {len(comandos_sql)}")
            
            # Salva os comandos em um arquivo JSON para uso posterior
            with open('comandos_insert_setores.json', 'w', encoding='utf-8') as f:
                json.dump(comandos_sql, f, ensure_ascii=False, indent=2)
            
            print(f"Comandos salvos em: comandos_insert_setores.json")
            
            # Mostra alguns exemplos
            print("\nPrimeiros 3 comandos:")
            for i, cmd in enumerate(comandos_sql[:3]):
                print(f"\n--- Comando {i+1} (ID: {cmd['id']}) ---")
                print(f"Código: {cmd['codigo']}")
                print(f"Nome: {cmd['nome']}")
                print(f"SQL: {cmd['sql'][:100]}...")
            
            return comandos_sql
            
    except Exception as e:
        print(f"Erro ao processar arquivo: {e}")
        return []

if __name__ == "__main__":
    print("=== PREPARAÇÃO DE COMANDOS INSERT PARA SETORES ===")
    comandos = processar_csv_e_inserir_via_mcp()
    
    if comandos:
        print(f"\n✅ {len(comandos)} comandos INSERT preparados com sucesso!")
        print("\nPróximos passos:")
        print("1. Os comandos foram salvos em 'comandos_insert_setores.json'")
        print("2. Agora vou executar os comandos via MCP em lotes")
    else:
        print("\n❌ Falha na preparação dos comandos!")