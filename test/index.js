
/* IMPORT */

import {describe} from 'fava';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {setTimeout as delay} from 'node:timers/promises';
import pollex from '../dist/index.js';

/* MAIN */

describe ( 'Pollex', it => {

  it ( 'works', async t => {

    const ROOT_PATH = process.cwd ();
    const FILE_PATH = path.join ( ROOT_PATH, '_file.txt' );
    const DIR_PATH = path.join ( ROOT_PATH, '_dir' );
    const DEEP_FILE_PATH = path.join ( DIR_PATH, '_file.txt' );

    const events = [];

    const dispose = pollex ( ROOT_PATH, ( event, path ) => events.push ({ event, path }), {
      ignoreInitial: true,
      ignoreReady: false,
      pollingIntervalCold: 400,
      pollingIntervalHot: 40
    });

    /* INIT */

    t.is ( events.shift (), undefined );

    /* READY */

    await delay ( 100 );

    t.deepEqual ( events.shift (), { event: 'ready', path: ROOT_PATH } );

    /* ADD */

    fs.writeFileSync ( FILE_PATH, 'test' );

    await delay ( 500 );

    t.deepEqual ( events.shift (), { event: 'add', path: FILE_PATH } );

    /* CHANGE */

    fs.writeFileSync ( FILE_PATH, 'test2' );

    await delay ( 500 );

    t.deepEqual ( events.shift (), { event: 'change', path: FILE_PATH } );

    /* UNLINK */

    fs.unlinkSync ( FILE_PATH );

    await delay ( 100 );

    t.deepEqual ( events.shift (), { event: 'unlink', path: FILE_PATH } );

    /* ADD DIR */

    fs.mkdirSync ( DIR_PATH );

    await delay ( 500 );

    t.deepEqual ( events.shift (), { event: 'addDir', path: DIR_PATH } );

    /* ADD */

    fs.writeFileSync ( DEEP_FILE_PATH, 'test' );

    await delay ( 500 );

    t.deepEqual ( events.shift (), { event: 'add', path: DEEP_FILE_PATH } );

    /* CHANGE */

    fs.writeFileSync ( DEEP_FILE_PATH, 'test2' );

    await delay ( 500 );

    t.deepEqual ( events.shift (), { event: 'change', path: DEEP_FILE_PATH } );

    /* UNLINK */

    fs.unlinkSync ( DEEP_FILE_PATH );

    await delay ( 100 );

    t.deepEqual ( events.shift (), { event: 'unlink', path: DEEP_FILE_PATH } );

    /* UNLINK DIR */

    fs.rmdirSync ( DIR_PATH );

    await delay ( 500 );

    t.deepEqual ( events.shift (), { event: 'unlinkDir', path: DIR_PATH } );

    /* DISPOSE */

    dispose ();

  });

});
