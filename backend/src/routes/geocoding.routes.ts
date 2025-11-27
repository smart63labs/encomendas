import { Router, Request, Response } from 'express';
import { GeocodingService } from '../services/geocoding.service';

const router = Router();

/**
 * @route GET /api/geocoding/cep/:cep
 * @desc Obter coordenadas geográficas por CEP
 * @access Public
 */
router.get('/cep/:cep', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cep } = req.params;
    
    // Normalizar CEP (remover caracteres não numéricos)
    const normalizedCep = cep.replace(/\D/g, '');
    
    // Validar se tem pelo menos 5 dígitos e no máximo 8
    if (normalizedCep.length < 5 || normalizedCep.length > 8) {
      res.status(400).json({
        success: false,
        message: 'CEP deve ter entre 5 e 8 dígitos'
      });
      return;
    }
    
    // Se CEP tem menos de 8 dígitos, completar com zeros à direita
    const completeCep = normalizedCep.padEnd(8, '0');
    
    console.log(`[Geocoding API] CEP original: ${cep}, normalizado: ${normalizedCep}, completo: ${completeCep}`);
    
    const result = await GeocodingService.getCoordinatesFromCEP(completeCep);
    
    if (!result || !result.latitude || !result.longitude) {
      res.status(404).json({
        success: false,
        message: 'CEP não encontrado ou sem coordenadas disponíveis'
      });
      return;
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Erro ao geocodificar CEP:', error);
    
    // Retornar erro 404 para CEPs não encontrados, não 500
    if (error.message && error.message.includes('não encontrado')) {
      res.status(404).json({
        success: false,
        message: 'CEP não encontrado'
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao geocodificar CEP',
      error: error.message
    });
  }
});

/**
 * @route POST /api/geocoding/address
 * @desc Obter coordenadas geográficas por endereço completo
 * @access Public
 */
router.post('/address', async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.body;
    
    if (!address || typeof address !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Endereço é obrigatório e deve ser uma string'
      });
      return;
    }
    
    const result = await GeocodingService.getCoordinatesFromAddress(address);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Erro ao geocodificar endereço:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao geocodificar endereço',
      error: error.message
    });
  }
});

export default router;