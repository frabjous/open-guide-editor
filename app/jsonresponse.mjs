
const handlers = {};

export default async function jsonresponse(reqdata, sessioninfo) {
  if (!("reqtype" in reqdata)) return {
    error: 'No request type specified.'
  }
  const reqtype = reqdata.reqtype;
  if (!(reqtype in handlers)) {
    try {
      const imported = await import('./json/' + reqtype + '.mjs');
      handlers[reqtype] = imported.default;
    } catch(err) {
      return {
        error: `Could not import ${reqtype}.mjs; ${err.toString()}`
      }
    }
  }
  if (!handlers?.[reqtype]) return {
    error: `Unable to import ${reqtype}.mjs`
  }
  const respdata = await handlers[reqtype](reqdata, sessioninfo);
  return respdata;
}
