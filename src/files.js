const { readFileSync, appendFileSync, writeFileSync, existsSync } = require('fs');

const { FILEPATH = '/opt/dnsmasq.conf', FORMAT = 'dnsmasq' } = process.env;

function getFormatString() {
  switch (FORMAT.toLowerCase()) {
    case 'dnsmasq':
      return 'address=/%host/%ip'
    case 'host':
      return '%ip %host'
    default:
      return null;
  }
}

if (!existsSync(FILEPATH)) writeFileSync(FILEPATH, "")

function entry_exists(ip, host) {
  function exists(predicate) {
    const data = readFileSync(FILEPATH);
    const lines = data.toString().split("\n");
    return lines.some(predicate);
  }

  switch (FORMAT) {
    case 'dnsmasq':
      return exists(item => item.startsWith("address=") && item.indexOf(host) !== -1)
    case 'host':
      return exists(item => item.startsWith(`${ip} ${host}`))
    default:
      return null;
  }
}

function add_entry(ip, host) {
  const format = getFormatString();
  if (format) {
    try {
      if (!entry_exists(ip, host)) {
        const data = format.replace('%ip', ip).replace('%host', host).concat("\n");
        appendFileSync(FILEPATH, data.toString());
        console.log(`Appended: ${data.toString()} to file ${FILEPATH}`)
      }
    } catch(err) {
      console.error(err);
    }
  } else {
    console.log(`Please verify that ${FILEPATH} is a valid ${FORMAT} config file`);
  }
}

function remove_entry(ip, host) {
  const format = getFormatString();
  if (format) {
    try {
      if (entry_exists(ip, host)) {
        const data = format.replace('%ip', ip).replace('%host', host).concat("\n");
        const newFile = readFileSync(FILEPATH).toString().replace(data, '');
        writeFileSync(FILEPATH, newFile.toString());
        console.log(`Removed: ${data.toString()} from file ${FILEPATH}`)
      }
    } catch(err) {
      console.error(err);
    }
  } else {
    console.log(`Please verify that ${FILEPATH} is a valid ${FORMAT} config file`);
  }
}

module.exports = { add_entry, remove_entry }
