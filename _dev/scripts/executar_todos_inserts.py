import json
import time

def executar_todos_inserts():
    """Executa todos os INSERTs restantes usando o MCP"""
    
    # Carrega os comandos do arquivo JSON
    try:
        with open('comandos_insert_setores.json', 'r', encoding='utf-8') as f:
            comandos = json.load(f)
    except FileNotFoundError:
        print("Erro: Arquivo 'comandos_insert_setores.json' não encontrado!")
        return False
    
    print(f"Carregados {len(comandos)} comandos INSERT")
    
    # Registros já inseridos: 1, 2, 3, 4, 5
    registros_inseridos = [1, 2, 3, 4, 5]
    
    # Filtra apenas os comandos que ainda não foram executados
    comandos_pendentes = [cmd for cmd in comandos if int(cmd['id']) not in registros_inseridos]
    
    print(f"Registros já inseridos: {registros_inseridos}")
    print(f"Comandos pendentes: {len(comandos_pendentes)}")
    
    # Gera os comandos MCP para execução
    print("\n=== COMANDOS MCP PARA EXECUÇÃO ===")
    print("Copie e execute os comandos abaixo no MCP um por vez:\n")
    
    for i, cmd in enumerate(comandos_pendentes[:20]):  # Mostra os primeiros 20
        # Limpa o SQL removendo quebras de linha desnecessárias
        sql_limpo = ' '.join(cmd['sql'].split())
        
        print(f"# Registro {i+1}/20 - ID {cmd['id']}: {cmd['codigo']}")
        print(f"run_mcp(server_name='mcp.config.usrlocalmcp.sqlcl', tool_name='run-sql', args={{'sql': \"{sql_limpo}\", 'model': 'claude-sonnet-4', 'mcp_client': 'Trae AI'}})")
        print()
    
    if len(comandos_pendentes) > 20:
        print(f"... e mais {len(comandos_pendentes) - 20} comandos")
    
    # Salva todos os comandos em um arquivo para referência
    with open('comandos_mcp_completos.txt', 'w', encoding='utf-8') as f:
        f.write("# COMANDOS MCP PARA INSERIR TODOS OS SETORES\n\n")
        
        for i, cmd in enumerate(comandos_pendentes):
            sql_limpo = ' '.join(cmd['sql'].split())
            f.write(f"# Registro {i+1} - ID {cmd['id']}: {cmd['codigo']} - {cmd['nome']}\n")
            f.write(f"run_mcp(server_name='mcp.config.usrlocalmcp.sqlcl', tool_name='run-sql', args={{'sql': \"{sql_limpo}\", 'model': 'claude-sonnet-4', 'mcp_client': 'Trae AI'}})\n\n")
    
    print(f"\n✅ Todos os comandos MCP foram salvos em 'comandos_mcp_completos.txt'")
    print(f"Total de comandos pendentes: {len(comandos_pendentes)}")
    
    return True

if __name__ == "__main__":
    print("=== GERAÇÃO DE COMANDOS MCP PARA INSERÇÃO COMPLETA ===")
    sucesso = executar_todos_inserts()
    
    if not sucesso:
        print("\n❌ Falha na geração dos comandos MCP!")
        exit(1)