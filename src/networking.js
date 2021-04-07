
function create_svc_host({name, namespace}) {
  return `${name}.${namespace}.svc.cluster.local`
}

module.exports = { create_svc_host: create_svc_host }
