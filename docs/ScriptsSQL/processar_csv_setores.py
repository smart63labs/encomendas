#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para processar o CSV SETORES_NORMALIZADO_PADRONIZADO.csv
e gerar comandos SQL de importação corrigidos
"""

import csv
import os

def processar_csv_setores():
    # Caminhos dos arquivos
    csv_path = r"C:\Users\88417646191\Documents\NovoProtocolo\V2\docs\SETORES_NORMALIZADO_PADRONIZADO.csv"
    sql_path = r"C:\Users\88417646191\Documents\NovoProtocolo\V2\docs\ScriptsSQL\importar_setores_processado.sql"
    
    # Verificar se o arquivo CSV existe
    if not os.path.exists(csv_path):
        print(f"Erro: Arquivo CSV não encontrado: {csv_path}")
        return
    
    # Abrir arquivo SQL para escrita
    with open(sql_path, 'w', encoding='utf-8') as sql_file:
        # Cabeçalho do script SQL
        sql_file.write("-- Script gerado automaticamente para importar dados do CSV SETORES_NORMALIZADO_PADRONIZADO.csv\n")
        sql_file.write("-- Problemas identificados e corrigidos:\n")
        sql_file.write("-- 1. Espaços extras nas coordenadas\n")
        sql_file.write("-- 2. Coordenadas LONGITUDE incorretas (positivas)\n")
        sql_file.write("-- 3. Formatação de dados\n\n")
        
        sql_file.write("-- Limpar dados existentes\n")
        sql_file.write("DELETE FROM SETORES;\n\n")
        
        # Abrir e processar o CSV
        with open(csv_path, 'r', encoding='utf-8') as csv_file:
            # Usar ponto e vírgula como separador
            reader = csv.DictReader(csv_file, delimiter=';')
            
            registros_processados = 0
            problemas_encontrados = []
            
            for row_num, row in enumerate(reader, start=2):  # Começar da linha 2 (após cabeçalho)
                # Pular linhas vazias ou com problemas no ID
                if not row.get('ID') or row['ID'].strip() == '' or not row['ID'].strip().isdigit():
                    problemas_encontrados.append(f"Linha {row_num}: ID inválido ou vazio: '{row.get('ID', '')}'")
                    continue
                try:
                    # Extrair e limpar dados
                    id_setor = row['ID'].strip()
                    codigo_setor = row['CODIGO_SETOR'].strip()
                    nome_setor = row['NOME_SETOR'].strip().replace("'", "''")  # Escapar aspas simples
                    orgao = row['ORGAO'].strip().replace("'", "''")
                    ativo = row['ATIVO'].strip()
                    logradouro = row['LOGRADOURO'].strip().replace("'", "''")
                    numero = row['NUMERO'].strip()
                    complemento = row['COMPLEMENTO'].strip().replace("'", "''")
                    bairro = row['BAIRRO'].strip().replace("'", "''")
                    cidade = row['CIDADE'].strip().replace("'", "''")
                    estado = row['ESTADO'].strip()
                    cep = row['CEP'].strip()
                    telefone = row['TELEFONE'].strip()
                    email = row['EMAIL'].strip()
                    data_criacao = row['DATA_CRIACAO'].strip()
                    data_atualizacao = row['DATA_ATUALIZACAO'].strip()
                    
                    # Processar coordenadas (remover espaços e corrigir sinais)
                    latitude_str = row['LATITUDE'].strip()
                    longitude_str = row['LONGITUDE'].strip()
                    
                    # Converter para float para validação
                    latitude = float(latitude_str)
                    longitude = float(longitude_str)
                    
                    # Corrigir LONGITUDE se for positiva (Brasil tem longitude negativa)
                    if longitude > 0:
                        longitude = -longitude
                        problemas_encontrados.append(f"ID {id_setor}: LONGITUDE corrigida de {longitude_str} para {longitude}")
                    
                    # Gerar comando INSERT
                    sql_insert = f"""INSERT INTO SETORES (ID, CODIGO_SETOR, NOME_SETOR, ORGAO, ATIVO, LOGRADOURO, NUMERO, COMPLEMENTO, BAIRRO, CIDADE, ESTADO, CEP, TELEFONE, EMAIL, DATA_CRIACAO, DATA_ATUALIZACAO, LATITUDE, LONGITUDE) VALUES
({id_setor}, '{codigo_setor}', '{nome_setor}', '{orgao}', {ativo}, '{logradouro}', '{numero}', '{complemento}', '{bairro}', '{cidade}', '{estado}', '{cep}', '{telefone}', '{email}', TO_TIMESTAMP('{data_criacao}', 'DD/MM/YYYY HH24:MI'), TO_TIMESTAMP('{data_atualizacao}', 'DD/MM/YYYY HH24:MI'), {latitude}, {longitude});

"""
                    
                    sql_file.write(sql_insert)
                    registros_processados += 1
                    
                except Exception as e:
                    problemas_encontrados.append(f"Erro ao processar linha ID {row.get('ID', 'desconhecido')}: {str(e)}")
                    continue
            
            # Finalizar script SQL
            sql_file.write("\n-- Commit das alterações\n")
            sql_file.write("COMMIT;\n\n")
            sql_file.write("-- Verificar quantos registros foram inseridos\n")
            sql_file.write("SELECT COUNT(*) AS TOTAL_INSERIDO FROM SETORES;\n\n")
            sql_file.write("-- Mostrar alguns registros inseridos\n")
            sql_file.write("SELECT ID, CODIGO_SETOR, NOME_SETOR, CIDADE, LATITUDE, LONGITUDE FROM SETORES WHERE ROWNUM <= 10;\n\n")
            sql_file.write("EXIT;\n")
    
    # Relatório de processamento
    print(f"Processamento concluído!")
    print(f"Registros processados: {registros_processados}")
    print(f"Arquivo SQL gerado: {sql_path}")
    
    if problemas_encontrados:
        print(f"\nProblemas encontrados e corrigidos ({len(problemas_encontrados)}):")
        for problema in problemas_encontrados:
            print(f"  - {problema}")
    else:
        print("\nNenhum problema encontrado nos dados.")

if __name__ == "__main__":
    processar_csv_setores()