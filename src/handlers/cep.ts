import { FastifyInstance } from 'fastify';
import { cepSchema } from '../schemas/cep.js';

function validateCep(cep: string) {
  const n = (cep || '').replace(/-/g, '');
  if (!n) return 'CEP is required.';
  if (n.length !== 8 || !/^[0-9]+$/.test(n)) return 'CEP must be 8 digits.';
  return null;
}

export default async function (app: FastifyInstance) {
  app.get('/CEP/BuscaCEP', { schema: cepSchema }, async (req, reply) => {
    const { cep } = (req.query as any);
    const errMsg = validateCep(cep);
    if (errMsg) {
      // throw a 400 error so the central error handler formats the response
      const e = new Error(errMsg) as any;
      e.statusCode = 400;
      throw e;
    }

    const data = await import('../services/viacep.js').then(m => m.lookupCep(cep));
    return {
      cep: data.cep,
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf
    };
  });
}
