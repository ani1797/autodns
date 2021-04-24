const { Watch, KubeConfig } = require('@kubernetes/client-node');

const { create_svc_host } = require('./networking');
const { add_entry, remove_entry } = require('./files')

const config = new KubeConfig();
config.loadFromDefault();

if (process.env.NODE_ENV === "production" || config.clusters.length === 0) config.loadFromCluster();

const watch = new Watch(config);

function start_watch() {
  try {
    watch.watch('/api/v1/services', {}, on_service_create, console.log);
    watch.watch('/apis/networking.k8s.io/v1/ingresses', {}, on_ingress_create, console.log);
  } catch(err) {
    console.log("There was an error", err)
    start_watch()
  }
}

start_watch()

function on_service_create(phase, { metadata, spec, status }) {
  const { ip } = status.loadBalancer.ingress[0];
  const host = create_svc_host(metadata);
  console.log(`Service Event: ${phase}, ${metadata.name} - ${ip} (${host})`)
  var operation = null;

  if (
    phase === 'ADDED' && spec.type === 'LoadBalancer' ||
    phase === 'MODIFIED' && spec.type === 'LoadBalancer'
  ) {
    operation = add_entry;
  } else if (
    phase === 'MODIFIED' && spec.type !== 'LoadBalancer' ||
    phase === 'DELETED'
  ) {
    operation = remove_entry;
  }

  if (operation) operation(ip, host);
}
function on_ingress_create(phase, { metadata, spec, status }) {

  const { ip } = status.loadBalancer.ingress[0];
  const hosts = spec.rules.map(rule => rule.host);
  console.log(`Ingress Event: ${phase}, ${metadata.name} - ${ip} = ${hosts}`)

  if (phase === 'ADDED' || phase === 'MODIFIED') {
    hosts.forEach(host => {
      add_entry(ip, host)
    });
  } else if (phase === 'DELETED') {
    hosts.forEach(host => {
      remove_entry(ip, host)
    });
  }
}
