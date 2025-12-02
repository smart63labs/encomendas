import { Router, Request, Response } from 'express';
import axios from 'axios';
import { DatabaseService } from '../config/database';

const router = Router();

async function getOpenRouteServiceApiKey(): Promise<string> {
  try {
    const sql = `
      SELECT OPENROUTESERVICE_API_KEY AS key
      FROM CONFIGURACOES_APIS
      WHERE ATIVO = 'S' AND OPENROUTESERVICE_API_KEY IS NOT NULL
      ORDER BY DATA_ALTERACAO DESC NULLS LAST, DATA_CRIACAO DESC NULLS LAST, ID DESC
      FETCH FIRST 1 ROWS ONLY
    `;
    const result = await DatabaseService.executeQuery(sql);
    const dbKey = result?.rows?.[0]?.KEY || result?.rows?.[0]?.key;
    if (dbKey && typeof dbKey === 'string' && dbKey.trim().length > 0) {
      return dbKey.trim();
    }
  } catch (err) {
    console.warn('Não foi possível obter OPENROUTESERVICE_API_KEY do banco. Usando fallbacks. Erro:', (err as Error).message);
  }
  // Fallbacks
  return process.env.OPENROUTESERVICE_API_KEY || '5b3ce3597851110001cf6248a1c4c9b2b8c84f7bb0b8b4b4b4b4b4b4b4b4';
}

/**
 * @route POST /api/routing/directions
 * @desc Proxy para OpenRouteService API - calcular rotas
 * @access Public
 */
router.post('/directions', async (req: Request, res: Response) => {
  try {
    const { coordinates, profile = 'driving-car', radiuses } = req.body as {
      coordinates: [number, number][];
      profile?: string;
      radiuses?: number[];
    };

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Coordenadas inválidas. Forneça pelo menos 2 pontos [longitude, latitude]'
      });
    }

    // Configurar a requisição para OpenRouteService
    const openRouteServiceUrl = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;

    const requestBody: any = {
      coordinates: coordinates,
      format: 'geojson',
      instructions: false,
      geometry: true
    };

    // Suporte opcional ao parâmetro radiuses (array com mesmo tamanho de coordinates)
    if (Array.isArray(radiuses) && radiuses.length === coordinates.length) {
      requestBody.radiuses = radiuses;
    }

    const apiKey = await getOpenRouteServiceApiKey();

    // Fazer requisição para OpenRouteService
    const response = await axios.post(openRouteServiceUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      }
    });

    const routeData = response.data as any;

    // Verificar se há features na resposta
    if (!routeData.features || routeData.features.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma rota encontrada para as coordenadas fornecidas'
      });
    }

    // Extrair informações da rota
    const feature = routeData.features[0];
    const geometry = feature.geometry;
    const properties = feature.properties || {};

    const distanceMeters = properties.summary?.distance ?? properties.distance ?? 0;
    const durationSeconds = properties.summary?.duration ?? properties.duration ?? 0;

    // Montar resposta simplificada para o frontend
    return res.status(200).json({
      success: true,
      data: {
        coordinates: geometry?.coordinates || [],
        distance: (distanceMeters / 1000).toFixed(2), // Km
        duration: Math.round(durationSeconds / 60),   // Minutos
        profile,
        radiuses: requestBody.radiuses || undefined
      }
    });
  } catch (error: any) {
    // Tratamento de erros do ORS/axios
    const status = error?.response?.status || 500;
    const errData = error?.response?.data || {};
    const errCode = errData?.error?.code || 'ROUTING_ERROR';
    const errMessage = errData?.error?.message || error?.message || 'Erro ao calcular rota';

    return res.status(status === 200 ? 500 : status).json({
      success: false,
      message: 'Erro ao calcular rota',
      error: {
        code: errCode,
        message: errMessage
      }
    });
  }
});

export default router;