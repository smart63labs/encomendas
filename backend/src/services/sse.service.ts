import { Request, Response } from 'express';

/**
 * Serviço simples de Server-Sent Events (SSE) para broadcasting
 * Mantém uma lista de clientes conectados e envia eventos em tempo real
 */
class SseService {
  private clients: Set<Response> = new Set();

  /**
   * Inicializa headers e registra o cliente
   */
  addClient(res: Response): void {
    // Headers obrigatórios do SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // Alguns proxies precisam desse header para não bufferizar
    res.setHeader('X-Accel-Buffering', 'no');

    // Enviar um ping inicial e tempo de retry
    res.write('retry: 5000\n\n');

    this.clients.add(res);
  }

  /**
   * Remove cliente quando a conexão fecha
   */
  removeClient(res: Response): void {
    if (this.clients.has(res)) {
      try { res.end(); } catch {}
      this.clients.delete(res);
    }
  }

  /**
   * Helper: configura stream e ciclo de vida
   */
  setupStream(req: Request, res: Response): void {
    this.addClient(res);

    // Keep-alive ping a cada 25s para manter conexões em proxies
    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(keepAlive);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      this.removeClient(res);
    });
  }

  /**
   * Envia um evento para todos os clientes conectados
   */
  broadcast(event: string, data: any): void {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    const message = `event: ${event}\ndata: ${payload}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(message);
      } catch {
        this.removeClient(client);
      }
    }
  }
}

export const sse = new SseService();
export default sse;