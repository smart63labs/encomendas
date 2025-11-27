import L from 'leaflet';

/**
 * 🎨 Nova função Helper para gerar o string SVG
 *
 * Esta versão remove o 'stroke' pesado e adiciona um filtro
 * de sombra ('feDropShadow') para um visual mais suave e profissional.
 */
const getIconSVGString = (color: string, size: [number, number] = [25, 41]): string => {
  // O filtro é definido em <defs> e depois aplicado ao <path>
  const svgIcon = `
    <svg width="${size[0]}" height="${size[1]}" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg"
         style="overflow: visible;">
      <defs>
        <filter id="svg-marker-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="rgba(0,0,0,0.4)" />
        </filter>
      </defs>
      
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 10.9 12.5 28.5 12.5 28.5S25 23.4 25 12.5C25 5.6 19.4 0 12.5 0z" 
            fill="${color}" 
            filter="url(#svg-marker-shadow)"/>
      
      <circle cx="12.5" cy="12.5" r="6" fill="#fff" stroke="${color}" stroke-width="0.5"/>
    </svg>
  `;
  return svgIcon;
};

// Função alternativa usando Data URLs (mais compatível)
const createDataURLIcon = (color: string, size: [number, number] = [25, 41]) => {
  // 1. Reutiliza a nova função
  const svgIcon = getIconSVGString(color, size);
  const dataUrl = `data:image/svg+xml;base64,${btoa(svgIcon)}`;

  return new L.Icon({
    iconUrl: dataUrl,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [1, -size[1] + 10],
    shadowSize: [41, 41]
  });
};

// Ícones pré-definidos para diferentes status e tipos
export const mapIcons = {
  // Status das encomendas
  pendente: createDataURLIcon('#6b7280'), // cinza
  preparando: createDataURLIcon('#3b82f6'), // azul
  transito: createDataURLIcon('#f59e0b'), // laranja
  entregue: createDataURLIcon('#10b981'), // verde
  devolvido: createDataURLIcon('#ef4444'), // vermelho

  // Tipos de marcadores
  origem: createDataURLIcon('#10b981'), // verde
  destino: createDataURLIcon('#ef4444'), // vermelho
  encomenda: createDataURLIcon('#3b82f6'), // azul
  inicio: createDataURLIcon('#10b981'), // verde
  fim: createDataURLIcon('#ef4444'), // vermelho

  // Ícone padrão
  default: createDataURLIcon('#6b7280') // cinza
};

// Função para criar ícone com contador
export const createIconWithCounter = (baseColor: string, count: number, size: [number, number] = [25, 41]) => {
  if (count === 1) {
    return createDataURLIcon(baseColor, size);
  }

  // 2. Reutiliza a nova função aqui também
  const iconSvg = getIconSVGString(baseColor, size);

  return new L.DivIcon({
    html: `
      <div style="position: relative; display: inline-block;">
        ${iconSvg}
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          background: ${baseColor};
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          z-index: 10;
        ">${count}</div>
      </div>
    `,
    className: 'custom-marker-with-count',
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [1, -size[1] + 10]
  });
};

// Função para obter ícone por status
export const getIconByStatus = (status: string) => {
  const normalizedStatus = status.toLowerCase();
  return mapIcons[normalizedStatus as keyof typeof mapIcons] || mapIcons.default;
};

// Função para criar ícone customizado por cor
export const createCustomIcon = (color: string, size: [number, number] = [25, 41]) => {
  return createDataURLIcon(color, size);
};

// Nota: A função 'createSVGIcon' original (com Blob) foi omitida
// pois 'createDataURLIcon' é mais compatível, como você mesmo notou.