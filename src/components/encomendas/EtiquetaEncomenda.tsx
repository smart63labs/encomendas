import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, X } from 'lucide-react';
import { formatMatriculaVinculo } from '@/lib/utils';
import type { Encomenda } from '@/types/encomenda.types';
import { getEnderecoSetor } from '@/services/setores.service';

// Removido cache local e função duplicada; usamos serviço central de setores

interface EtiquetaEncomendaProps {
  codigo: string;
  remetente: string;
  destinatario: string;
  setorOrigem?: string;
  setorDestino: string;
  descricao: string;
  dataPostagem: string;
  codigoLacre?: string;
  numeroMalote?: string;
  numeroAR?: string;
  qrCodeData?: string;
  enderecoSetor?: string;
  enderecoSetorOrigem?: string;
  enderecoSetorDestino?: string;
  urgente?: boolean;
  className?: string;
  observacoes?: string;
  // Campos de matrícula e vínculo
  remetenteMatricula?: string | null;
  remetenteVinculo?: string | null;
  destinatarioMatricula?: string | null;
  destinatarioVinculo?: string | null;
}

const EtiquetaEncomenda: React.FC<EtiquetaEncomendaProps> = ({
  codigo,
  remetente,
  destinatario,
  setorOrigem,
  setorDestino,
  descricao,
  dataPostagem,
  codigoLacre,
  numeroMalote,
  numeroAR,
  qrCodeData,
  enderecoSetor,
  enderecoSetorOrigem,
  enderecoSetorDestino,
  urgente = false,
  className = '',
  observacoes,
  remetenteMatricula,
  remetenteVinculo,
  destinatarioMatricula,
  destinatarioVinculo
}) => {
  // Função para extrair apenas o nome limpo (sem matrícula) quando ela já estiver incluída
  const extractCleanName = (fullName: string, matricula?: string | null, vinculo?: string | null) => {
    if (!matricula) return fullName;
    
    const matriculaVinculo = formatMatriculaVinculo({ matricula, vinculo_funcional: vinculo });
    if (!matriculaVinculo) return fullName;
    
    // Remover a matrícula-vínculo do início do nome se estiver presente
    const pattern = new RegExp(`^${matriculaVinculo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\s*-\s*`);
    return fullName.replace(pattern, '').trim();
  };

  // Gerar código de barras como SVG
  const generateBarcode = (code: string) => {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, code, {
      format: 'CODE128',
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 12,
      margin: 0
    });
    return canvas.toDataURL();
  };

  const barcodeDataUrl = React.useMemo(() => {
    if (codigo) {
      try {
        return generateBarcode(codigo);
      } catch (error) {
        console.error('Erro ao gerar código de barras:', error);
        return '';
      }
    }
    return '';
  }, [codigo]);

  // Dados completos para QR Code
  const qrData = React.useMemo(() => {
    if (qrCodeData) {
      try {
        let cleanedData = qrCodeData.trim();

        // Remover aspas envolventes
        if ((cleanedData.startsWith('"') && cleanedData.endsWith('"')) ||
            (cleanedData.startsWith("'") && cleanedData.endsWith("'"))) {
          cleanedData = cleanedData.slice(1, -1);
        }

        // Unescape de aspas e caracteres especiais
        cleanedData = cleanedData
          .replace(/\\\n/g, '\n')
          .replace(/\\\r/g, '\r')
          .replace(/\\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/""/g, '"');

        const parsed = JSON.parse(cleanedData);
        return JSON.stringify(parsed);
      } catch (error) {
        console.warn('Erro ao processar QR Code do backend, usando fallback:', error);
        return qrCodeData;
      }
    }
    
    // Fallback
    const fallbackData = JSON.stringify({
      codigo,
      remetente,
      destinatario,
      setorOrigem,
      setorDestino,
      descricao,
      dataPostagem,
      codigoLacre,
      remetenteMatricula,
      remetenteVinculo,
      destinatarioMatricula,
      destinatarioVinculo,
      numeroMalote,
      numeroAR,
      enderecoSetorOrigem,
      enderecoSetorDestino,
      urgente
    });
    
    return fallbackData;
  }, [qrCodeData, codigo, remetente, destinatario, setorOrigem, setorDestino, descricao, dataPostagem, codigoLacre, remetenteMatricula, remetenteVinculo, destinatarioMatricula, destinatarioVinculo, numeroMalote, numeroAR, enderecoSetorOrigem, enderecoSetorDestino, urgente]);

  return (
    <div 
      className={`bg-white border-2 ${urgente ? 'border-red-500' : 'border-gray-300'} p-3 w-full mx-auto etiqueta-container ${className}`} 
      style={{ 
        fontFamily: 'Arial, sans-serif', 
        width: '160mm', 
        minHeight: '160mm',
        transform: 'scale(0.75)',
        transformOrigin: 'top center',
        marginBottom: '-40mm'
      }}
    >
      {/* Cabeçalho */}
      <div className={`text-center border-b-2 ${urgente ? 'border-red-500' : 'border-gray-300'} pb-1 mb-1 ${urgente ? 'bg-red-50' : ''}`}>
        <h2 className="text-lg font-bold text-gray-800">ETIQUETA DE ENCOMENDA</h2>
        <p className="text-sm text-gray-600">Governo do Estado do Tocantins</p>
        {urgente && (
          <div className="mt-1 inline-block bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            🚨 URGENTE 🚨
          </div>
        )}
      </div>

      {/* Código da Encomenda */}
      <div className="text-center mb-1">
        <div className={`text-xl font-bold p-1 rounded border ${
          urgente 
            ? 'text-red-600 bg-red-50 border-red-300' 
            : 'text-blue-600 bg-blue-50 border-blue-300'
        }`}>
          {codigo}
        </div>
      </div>

      {/* Dados do Remetente */}
      <div className="mb-1 border border-gray-200 p-1 rounded">
        <div className="text-xs font-semibold text-gray-700">REMETENTE:</div>
        <div className="text-sm font-medium text-gray-800">
          {formatMatriculaVinculo({ matricula: remetenteMatricula, vinculo_funcional: remetenteVinculo }) ? (
            <><span className="font-bold">{formatMatriculaVinculo({ matricula: remetenteMatricula, vinculo_funcional: remetenteVinculo })}</span> - {extractCleanName(remetente, remetenteMatricula, remetenteVinculo)}</>
          ) : (
            remetente
          )}
        </div>
        {setorOrigem && (
          <div className="text-xs text-gray-600"><span className="font-bold">Setor:</span> {setorOrigem}</div>
        )}
        {enderecoSetorOrigem && (
          <div className="text-xs text-gray-600">
            <span className="font-bold">Endereço:</span> {enderecoSetorOrigem}
          </div>
        )}
      </div>

      {/* Dados do Destinatário */}
      <div className="mb-1 border border-gray-200 p-1 rounded">
        <div className="text-xs font-semibold text-gray-700">DESTINATÁRIO:</div>
        <div className="text-sm font-medium text-gray-800">
          {formatMatriculaVinculo({ matricula: destinatarioMatricula, vinculo_funcional: destinatarioVinculo }) ? (
            <><span className="font-bold">{formatMatriculaVinculo({ matricula: destinatarioMatricula, vinculo_funcional: destinatarioVinculo })}</span> - {extractCleanName(destinatario, destinatarioMatricula, destinatarioVinculo)}</>
          ) : (
            destinatario
          )}
        </div>
        <div className="text-xs text-gray-600"><span className="font-bold">Setor:</span> {setorDestino}</div>
        {enderecoSetorDestino && (
          <div className="text-xs text-gray-600">
            <span className="font-bold">Endereço:</span> {enderecoSetorDestino}
          </div>
        )}
      </div>

      {/* Descrição da Encomenda */}
      <div className="mb-1 border border-gray-200 p-1 rounded">
        <div className="text-xs font-semibold text-gray-700">CONTEÚDO:</div>
        <div className="text-xs text-gray-800 break-words">{descricao}</div>
      </div>

      {/* Observações */}
      {observacoes && (
        <div className="mb-1 border border-gray-200 p-1 rounded">
          <div className="text-xs font-semibold text-gray-700">OBSERVAÇÕES:</div>
          <div className="text-xs text-gray-800 break-words">{observacoes}</div>
        </div>
      )}
      {/* Badges: Nº Malote, Código do Lacre e AR (se houver) */}
      <div className="mb-1 border border-gray-200 p-1 rounded">
        <div className="text-xs font-semibold text-gray-700">MALOTE / ETIQUETA / AR:</div>
        <div className="text-sm font-medium text-gray-800">
          <span className="font-bold">
            {`#${numeroMalote || '-'}`} / {`${codigoLacre || '-'}`} / {`${numeroAR || '-'}`}
          </span>
        </div>
      </div>
      {/* Data de Postagem */}
      <div className="mb-1">
        <div className="text-xs text-gray-600">
          <strong>Data de Postagem:</strong> {new Date(dataPostagem).toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* QR Code e Código de Barras */}
      <div className="border-t-2 border-gray-300 pt-1">
        <div className="flex justify-between items-center">
          {/* QR Code */}
          <div className="text-center">
            <div className="text-xs font-semibold text-gray-700">QR CODE</div>
            <QRCodeSVG
              value={qrData}
              size={120}
              level="H"
              includeMargin={true}
              bgColor="#FFFFFF"
              fgColor="#000000"
              imageSettings={{
                src: "",
                x: undefined,
                y: undefined,
                height: 0,
                width: 0,
                excavate: false,
              }}
            />
          </div>
      
          {/* Código de Barras */}
          <div className="text-center flex-1 ml-4">
            <div className="text-xs font-semibold text-gray-700">CÓDIGO DE BARRAS</div>
            {barcodeDataUrl && (
              <img 
                src={barcodeDataUrl} 
                alt={`Código de barras: ${codigo}`}
                className="max-w-full h-auto"
              />
            )}
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="text-center mt-1 pt-1 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Sistema de Protocolo Digital - SEFAZ/TO
        </div>
      </div>
    </div>
  );
};

// =========================
// Modal de Reimpressão
// =========================

interface ModalReimpressaoEtiquetaProps {
  isOpen: boolean;
  onClose: () => void;
  encomenda: Encomenda;
}

export const ModalReimpressaoEtiqueta: React.FC<ModalReimpressaoEtiquetaProps> = ({
  isOpen,
  onClose,
  encomenda,
}) => {
  const [enderecoSetorOrigem, setEnderecoSetorOrigem] = useState<string>('Carregando endereço...');
  const [enderecoSetorDestino, setEnderecoSetorDestino] = useState<string>('Carregando endereço...');

  useEffect(() => {
    if (isOpen && encomenda) {
      if (encomenda.setorOrigem) {
        getEnderecoSetor(encomenda.setorOrigem).then(setEnderecoSetorOrigem);
      }
      if (encomenda.setorDestino) {
        getEnderecoSetor(encomenda.setorDestino).then(setEnderecoSetorDestino);
      }
    }
  }, [isOpen, encomenda]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const etiquetaElement = document.getElementById('etiqueta-reimpressao');
      if (etiquetaElement) {
        const etiquetaContent = etiquetaElement.innerHTML;

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Etiqueta de Encomenda</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                * { box-sizing: border-box; }
                body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                @media print {
                  @page { size: A4; margin: 10mm; }
                  body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  .bg-red-50 { background-color: #fef2f2 !important; }
                  .bg-red-600 { background-color: #dc2626 !important; }
                  .bg-blue-50 { background-color: #eff6ff !important; }
                  .text-red-600 { color: #dc2626 !important; }
                  .text-blue-600 { color: #2563eb !important; }
                  .text-white { color: #ffffff !important; }
                  .border-red-500 { border-color: #ef4444 !important; }
                  .border-red-300 { border-color: #fca5a5 !important; }
                  .border-blue-300 { border-color: #93c5fd !important; }
                  .border-gray-300 { border-color: #d1d5db !important; }
                  .border-gray-200 { border-color: #e5e7eb !important; }
                  .animate-pulse { animation: none !important; }
                  .etiqueta-container { width: 160mm !important; max-width: 160mm !important; min-height: auto !important; height: auto !important; page-break-inside: avoid !important; }
                }
                .etiqueta-container { width: 160mm; max-width: 160mm; min-height: auto; font-family: Arial, sans-serif; }
              </style>
            </head>
            <body>
              <div class="etiqueta-container">${etiquetaContent}</div>
            </body>
          </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 1000);
      }
    }
  };

  if (!encomenda) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Reimpressão de Etiqueta
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Imprimir Etiqueta
            </Button>
          </div>

          <div id="etiqueta-reimpressao" className="flex justify-center">
          <EtiquetaEncomenda
            codigo={encomenda.codigoRastreamento || encomenda.codigo}
            remetente={encomenda.remetente}
            destinatario={encomenda.destinatario}
            setorOrigem={encomenda.setorOrigem}
            setorDestino={encomenda.setorDestino}
            descricao={encomenda.descricao}
            dataPostagem={encomenda.dataPostagem}
            codigoLacre={encomenda.codigoLacre}
            numeroMalote={encomenda.numeroMalote}
            numeroAR={encomenda.numeroAR}
            qrCodeData={encomenda.qrCodeData}
            enderecoSetorOrigem={enderecoSetorOrigem}
            enderecoSetorDestino={enderecoSetorDestino}
            urgente={encomenda.urgente}
            observacoes={encomenda.observacoes}
            remetenteMatricula={encomenda.remetenteMatricula}
            remetenteVinculo={encomenda.remetenteVinculo}
            destinatarioMatricula={encomenda.destinatarioMatricula}
            destinatarioVinculo={encomenda.destinatarioVinculo}
          />
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EtiquetaEncomenda;