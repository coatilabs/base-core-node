import * as yup from 'yup';

export function numberFixedLen(n: number, len: number) {
  return (1e4 + '' + n).slice(-len);
}

export function perPage(per_page = 10, page = 1) {
  if (isNaN(page) || page < 1) { page = 1;}
  const limit = +per_page;
  const offset = limit * (page - 1);
  return { limit, offset};
}

export async function validateYup(body: any, schema: yup.ObjectSchema) {
  const isValid = await schema.isValid(body);

  if (!isValid) {
    await schema.validate(body);
  };
}

