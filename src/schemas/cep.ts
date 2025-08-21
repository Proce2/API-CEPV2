export const cepSchema = {
  querystring: {
    type: 'object',
    properties: {
      cep: {
        type: 'string',
        description: 'CEP must be 8 digits'
      }
    }
  },
  response: {
    200: {
      description: 'Success',
      type: 'object',
      properties: {
        cep: { type: 'string' },
        street: { type: 'string' },
        neighborhood: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' }
      }
    },
    400: { description: 'Bad Request', type: 'string' },
    404: { description: 'Not Found', type: 'null' },
    500: { description: 'Error: response status is 500', type: 'null' }
  }
};
