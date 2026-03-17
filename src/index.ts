import type { Server } from 'node:http';
import https from 'node:https';
import http from 'node:http';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { program, Option } from 'commander';
import express, { type Request } from 'express';
import bodyParser from 'body-parser';
import updateNotifier from 'update-notifier';

import { Oceanid } from './Oceanid.js';

type Hosts = { name: string; family: string; address: string }[];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', 'package.json')).toString(),
);

type Conf = {
  host: string;
  cert?: string;
  key?: string;
  port?: number;
  redirectPort?: number;
  timeout?: number;
  keepAliveTimeout?: number;
  authUserFilename?: string;
  authUserFile?: string;
  authUsername?: string;
  authPassword?: string;
  dbDriver?: string;
  postgresHost?: string;
  postgresPort?: number;
  postgresDatabase?: string;
  postgresUsername?: string;
  postgresPassword?: string;
  postgresPrefix?: string;
  sqliteCacheSize?: number;
  sqlitePrefix?: string;
  updateCheck: boolean;
};

program
  .name(pkg.name)
  .description(pkg.description)
  .version(pkg.version, '-v, --version', 'Print the current version');

program
  .option(
    '-h, --host <host>',
    'A host address to listen on. The default is to listen on all external hosts.',
    '::',
  )
  .option(
    '--cert <cert_file>',
    'The filename of a certificate to use for HTTPS in PEM format.',
  )
  .option(
    '--key <key_file>',
    'The filename of a private key to use for HTTPS in PEM format.',
  )
  .addOption(
    new Option(
      '-p, --port <port>',
      'The port to listen on. Defaults to 443 if a cert is provided, 80 otherwise.',
    ).argParser(parseInt),
  )
  .addOption(
    new Option(
      '--redirect-port <redirect_port>',
      'The port to redirect HTTP traffic to HTTPS. Set this to 80 if you want to redirect plain HTTP requests.',
    ).argParser(parseInt),
  )
  .addOption(
    new Option(
      '-t, --timeout <milliseconds>',
      'Request timeout (in milliseconds). Requests will be terminated if they take longer than this time. Defaults to 7200000 (2 hours).',
    ).argParser(parseInt),
  )
  .addOption(
    new Option(
      '--keep-alive-timeout <milliseconds>',
      'Server will wait this long for additional data after writing its last response.',
    ).argParser(parseInt),
  )
  .option(
    '--auth-user-file <path>',
    'A specific htpasswd file to use for every request.',
  )
  .option(
    '--auth-username <username>',
    'Authenticate with a given username instead.',
  )
  .option(
    '--auth-password <password>',
    'Authenticate with a given password instead.',
  )
  .option(
    '--db-driver <db_driver>',
    'The type of the DB driver to use. (Can be "postgres" or "sqlite". Defaults to "sqlite").',
  )
  .option(
    '--postgres-host <host>',
    'The PostgreSQL host if the DB driver is "postgres". (Defaults to "localhost".)',
  )
  .addOption(
    new Option(
      '--postgres-port <port>',
      'The PostgreSQL port if the DB driver is "postgres". (Defaults to 5432.)',
    ).argParser(parseInt),
  )
  .option(
    '--postgres-database <database>',
    'The PostgreSQL database if the DB driver is "postgres". (Defaults to "oceanid".)',
  )
  .option(
    '--postgres-username <username>',
    'The PostgreSQL username if the DB driver is "postgres". (Defaults to "oceanid".)',
  )
  .option(
    '--postgres-password <password>',
    'The PostgreSQL password if the DB driver is "postgres". (Defaults to "password".)',
  )
  .option(
    '--postgres-prefix <prefix>',
    'The PostgreSQL table prefix if the DB driver is "postgres". (Defaults to "oceanid_".)',
  )
  .option(
    '--sqlite-cache-size <kilobytes>',
    'The SQLite cache size to maintain in memory. (Defaults to 100MB).',
  )
  .option(
    '--sqlite-prefix <prefix>',
    'The SQLite table prefix if the DB driver is "sqlite". (Defaults to "oceanid_".)',
  )
  .option(
    '--no-update-check',
    "Don't check for updates.",
    !['false', 'off', '0'].includes(
      (process.env.UPDATE_CHECK || '').toLowerCase(),
    ),
  );

program.addHelpText(
  'after',
  `
Environment Variables:
  HOST                                       Same as --host.
  PORT                                       Same as --port.
  REDIRECT_PORT                              Same as --redirect-port.
  TIMEOUT                                    Same as --timeout.
  KEEPALIVETIMEOUT                           Same as --keep-alive-timeout.
  CERT_FILE                                  Same as --cert.
  CERT                                       Text of a cert in PEM format.
  KEY_FILE                                   Same as --key.
  KEY                                        Text of a key in PEM format.
  AUTH_USER_FILE                             Same as --auth-user-file.
  AUTH_USERNAME                              Same as --auth-username.
  AUTH_PASSWORD                              Same as --auth-password.
  DB_DRIVER                                  Same as --db-driver.
  POSTGRES_HOST                              Same as --postgres-host.
  POSTGRES_PORT                              Same as --postgres-port.
  POSTGRES_DATABASE                          Same as --postgres-database.
  POSTGRES_USERNAME                          Same as --postgres-username.
  POSTGRES_PASSWORD                          Same as --postgres-password.
  POSTGRES_PREFIX                            Same as --postgres-prefix.
  SQLITE_CACHE_SIZE                          Same as --sqlite-cache-size.
  SQLITE_PREFIX                              Same as --sqlite-prefix.
  UPDATE_CHECK                               Same as --no-update-check when set to "false", "off" or "0".

Options given on the command line take precedence over options from an environment variable.`,
);

program.addHelpText(
  'afterAll',
  `
Oceanid repo: https://github.com/sciactive/oceanid
Copyright (C) 2026 SciActive, Inc
https://sciactive.com/`,
);

try {
  // Parse args.
  if (
    process.argv.length > 2 &&
    process.argv[1].includes('/pm2/') &&
    process.argv.includes('--')
  ) {
    // pm2-runtime command is sometimes given whole and not understood by commander
    // also it doubles the args after --
    const rest = process.argv.slice(process.argv.indexOf('--') + 1);
    if (rest.length > 1 && rest[0] === rest[rest.length / 2]) {
      rest.splice(rest.length / 2, rest.length);
    }
    program.parse([process.argv[0], __filename, ...rest]);
  } else {
    program.parse();
  }
  const options = program.opts();
  let {
    host,
    cert,
    key,
    port,
    redirectPort,
    timeout,
    keepAliveTimeout,
    authUserFile,
    authUsername,
    authPassword,
    dbDriver,
    postgresHost,
    postgresPort,
    postgresDatabase,
    postgresUsername,
    postgresPassword,
    postgresPrefix,
    sqliteCacheSize,
    sqlitePrefix,
    updateCheck,
  } = {
    host: process.env.HOST,
    cert: process.env.CERT_FILE,
    key: process.env.KEY_FILE,
    authUserFile: process.env.AUTH_USER_FILE,
    authUsername: process.env.AUTH_USERNAME,
    authPassword: process.env.AUTH_PASSWORD,
    dbDriver: process.env.DB_DRIVER,
    postgresHost: process.env.POSTGRES_HOST,
    postgresPort: process.env.POSTGRES_PORT,
    postgresDatabase: process.env.POSTGRES_DATABASE,
    postgresUsername: process.env.POSTGRES_USERNAME,
    postgresPassword: process.env.POSTGRES_PASSWORD,
    postgresPrefix: process.env.POSTGRES_PREFIX,
    sqliteCacheSize: process.env.SQLITE_CACHE_SIZE,
    sqlitePrefix: process.env.SQLITE_PREFIX,
    ...options,
  } as Conf;

  if (updateCheck) {
    updateNotifier({ pkg }).notify({ defer: false });
  }

  if (cert) {
    cert = fs.readFileSync(path.resolve(cert)).toString();
  } else {
    cert = process.env.CERT;
  }

  if (key) {
    key = fs.readFileSync(path.resolve(key)).toString();
  } else {
    key = process.env.KEY;
  }

  const secure = !!(cert && key);
  if (port == null) {
    port = parseInt(process.env.PORT || (secure ? '443' : '80'));
  }

  if (redirectPort == null && secure) {
    redirectPort = parseInt(process.env.REDIRECT_PORT || '0');
  }

  if (redirectPort != null && redirectPort <= 0) {
    redirectPort = undefined;
  }

  if (timeout == null) {
    timeout = parseInt(process.env.TIMEOUT || '7200000') || 0;
  }

  if (timeout != null && timeout < 0) {
    timeout = 0;
  }

  if (keepAliveTimeout == null) {
    keepAliveTimeout = process.env.KEEPALIVETIMEOUT
      ? parseInt(process.env.KEEPALIVETIMEOUT)
      : undefined;
  }

  if (keepAliveTimeout != null && keepAliveTimeout < 0) {
    keepAliveTimeout = 0;
  }

  // Validate args.
  // TODO: validate args

  // Get server ready.
  const getHosts = () => {
    const ifaces = networkInterfaces();
    let serverHosts: Hosts = [];
    for (let name in ifaces) {
      const netDict = ifaces[name];
      if (netDict == null) {
        continue;
      }
      for (let net of netDict) {
        if (!net.internal && net.address) {
          if (host.trim() !== '::' && host.trim() !== net.address) {
            continue;
          }
          serverHosts.push({ name, family: net.family, address: net.address });
        }
      }
    }
    return serverHosts;
  };

  const serverHosts = getHosts();
  const app = express();

  if (serverHosts.length === 0) {
    throw new Error('No hosts to listen on.');
  }

  const oceanid = new Oceanid();

  function getLanguage(request: Request) {
    let language: 'english' | 'spanish' | 'french' | 'arabic' = 'english';
    const contentLanguage = request.get('Content-Language') ?? 'en';
    switch (contentLanguage.split('-')[0]) {
      case 'es':
        language = 'spanish';
        break;
      case 'fr':
        language = 'french';
        break;
      case 'ar':
        language = 'arabic';
        break;
      case 'en':
      default:
        // Do nothing.
        break;
    }
    return language;
  }

  app.get('/tokens/:text', (request, response) => {
    response.status(200);
    response.type('application/json');
    const tokens = oceanid.getTokens(request.params.text, getLanguage(request));
    response.send(JSON.stringify(tokens, undefined, 2));
    response.end();
  });

  app.use('/tokens', bodyParser.text({ type: 'text/plain' }));
  app.post('/tokens', async (request, response) => {
    response.status(200);
    response.type('application/json');
    const tokens = oceanid.getTokens(request.body, getLanguage(request));
    response.send(JSON.stringify(tokens, undefined, 2));
    response.end();
  });

  app.use('/', (_request, response) => {
    response.sendStatus(404);
    response.end();
  });

  // Run server.
  let server: Server;
  if (secure) {
    server = https
      .createServer({ cert, key }, app)
      .listen(port, host === '::' ? undefined : host);

    if (redirectPort != null) {
      const redirectApp = express();

      redirectApp.use((req, res) => {
        // Redirect to the secure app.
        return res.redirect(req.protocol + 's://' + req.headers.host + req.url);
      });

      const redirectServer = http
        .createServer({}, redirectApp)
        .listen(redirectPort, host === '::' ? undefined : host);

      redirectServer.on('listening', () => {
        console.log(
          `Oceanid redirect server listening on ${serverHosts
            .map(
              ({ name, address }) =>
                `http://${address}:${redirectPort} (${name})`,
            )
            .join(', ')}`,
        );
      });

      redirectServer.on('close', () => {
        console.log('Oceanid redirect server closed.');
      });
    }
  } else {
    server = http
      .createServer({}, app)
      .listen(port, host === '::' ? undefined : host);
  }

  server.on('listening', () => {
    console.log(
      `Oceanid server listening on \n\t${serverHosts
        .map(
          ({ name, address }) =>
            `http${secure ? 's' : ''}://${address}:${port} (${name})`,
        )
        .join('\n\t')}`,
    );

    server.requestTimeout = timeout || 0;
    if (keepAliveTimeout != null) {
      server.keepAliveTimeout = keepAliveTimeout;
      server.headersTimeout = Math.max(
        server.headersTimeout,
        server.keepAliveTimeout + 1000,
      );
    }
  });

  server.on('close', () => {
    console.log('Oceanid server closed.');
  });
} catch (e: any) {
  console.error('Error:', e.message);
  process.exit(1);
}
