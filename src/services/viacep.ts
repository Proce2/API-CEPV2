export type CepResult = {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean | string;
};

export async function lookupCep(cep: string): Promise<CepResult> {
  // use the CEP exactly as provided by the caller (no normalization)
  const value = cep ?? '';
  const res = await fetch(`https://viacep.com.br/ws/${encodeURIComponent(value)}/json/`);
  const data = await res.json();
  // return the raw response exactly as ViaCEP sent it
  return data as CepResult;
}
