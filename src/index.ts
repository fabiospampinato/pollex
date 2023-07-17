
/* IMPORT */

import LRU from 'picolru';
import readdir from 'tiny-readdir';
import {difference, consume, shuffle, stat} from './utils';
import type {Disposer, Event, Handler, Options} from './types';

/* MAIN */

//TODO: Handle edge cases like the file being updated multiple times within the same millisecond right while polling it (maybe check the file size also)
//TODO: Maybe gradually cool down hot files
//TODO: Maybe add a new "warm" tier for newly added files
//TODO: Support rename detection

const pollex = ( rootPath: string, handler: Handler, options: Options = {} ): Disposer => {

  /* STATE */

  const ignoreInitial = options.ignoreInitial ?? false;
  const ignoreReady = options.ignoreReady ?? false;
  const pollingIntervalCold = options.pollingIntervalCold ?? 2000;
  const pollingIntervalHot = options.pollingIntervalHot ?? 50;

  const directories = new Set<string> ();
  const files = new Set<string> ();
  const filesMtimes = new Map<string, number> ();
  const signal = { aborted: false };

  let filesCold = new Set<string> ();
  let filesHot = new LRU<string, true> ({ maxSize: 16 });

  let initial = true;
  let lastScanTimestamp = -1;
  let pollingChunkSize = -1;

  /* EVENTS */

  const on = ( event: Event, targetPath: string ): void => {

    if ( signal.aborted ) return;

    if ( initial && ignoreInitial && event !== 'ready' ) return;

    if ( ignoreReady && event === 'ready' ) return;

    handler ( event, targetPath );

  };

  const onAdd = ( targetPath: string ): void => {

    on ( 'add', targetPath );

    files.add ( targetPath );
    filesMtimes.set ( targetPath, lastScanTimestamp - 1 );

    if ( initial ) {

      filesCold.add ( targetPath );

    } else {

      filesHot.set ( targetPath, true ); //TODO: Maybe add a "filesWarm" tier for this, many files could be added at once but never edited

    }

  };

  const onAddDir = ( targetPath: string ): void => {

    on ( 'addDir', targetPath );

    directories.add ( targetPath );

  };

  const onChange = ( targetPath: string, modified: number ): void => {

    on ( 'change', targetPath );

    filesCold.delete ( targetPath );
    filesHot.set ( targetPath, true );
    filesMtimes.set ( targetPath, modified );

  };

  const onReady = ( targetPath: string ): void => {

    on ( 'ready', targetPath );

  };

  const onUnlink = ( targetPath: string ): void => {

    on ( 'unlink', targetPath );

    files.delete ( targetPath );
    filesCold.delete ( targetPath );
    filesHot.delete ( targetPath );
    filesMtimes.delete ( targetPath );

  };

  const onUnlinkDir = ( targetPath: string ): void => {

    on ( 'unlinkDir', targetPath );

    directories.delete ( targetPath );

  };

  /* REFRESH */

  const refreshReaddir = () => {

    return readdir ( rootPath, {
      depth: options.depth,
      limit: options.limit,
      followSymlinks: options.followSymlinks,
      ignore: options.ignore,
      signal
    });

  };

  const refreshDirents = async (): Promise<void> => {

    lastScanTimestamp = Date.now ();

    const scan = await refreshReaddir ();
    const directoriesNext = new Set ( scan.directories );
    const filesNext = new Set ( scan.files );
    const [directoriesAdded, directoriesDeleted] = difference ( directories, directoriesNext );
    const [filesAdded, filesDeleted] = difference ( files, filesNext );

    directoriesDeleted.forEach ( onUnlinkDir );
    filesDeleted.forEach ( onUnlink );
    directoriesAdded.forEach ( onAddDir );
    filesAdded.forEach ( onAdd );

    filesCold = new Set ( shuffle ([ ...files ]) );
    pollingChunkSize = Math.ceil ( filesCold.size / ( ( pollingIntervalCold / pollingIntervalHot ) - 1 ) );

  };

  const refreshFiles = async ( filePaths: Set<string> | Map<string, unknown> ): Promise<void> => {

    for ( const filePath of filePaths.keys () ) {

      const stats = stat ( filePath );
      const mtimeMs = filesMtimes.get ( filePath );

      if ( stats ) {

        if ( mtimeMs && stats.mtimeMs > mtimeMs ) {

          onChange ( filePath, stats.mtimeMs );

        }

      } else if ( stats === false ) {

        onUnlink ( filePath );

      } else {

        // Some error different than ENOENT happened, we'll try again later...

      }

    }

  };

  const refreshFilesCold = async (): Promise<void> => {

    await refreshFiles ( consume ( filesCold, pollingChunkSize ) );

  };

  const refreshFilesHot = async (): Promise<void> => {

    await refreshFiles ( filesHot );

  };

  const refresh = async (): Promise<void> => {

    if ( !filesCold.size ) {

      await refreshDirents ();

    }

    await refreshFilesHot ();
    await refreshFilesCold ();

  };

  /* LIFECYCLE */

  const loop = async (): Promise<void> => {

    if ( signal.aborted ) return;

    await refresh ();

    setTimeout ( loop, pollingIntervalHot );

  };

  const start = async (): Promise<void> => {

    initial = true;

    await loop ();

    onReady ( rootPath );

    initial = false;

  };

  const stop = (): void => {

    signal.aborted = true;

  };

  /* RETURN */

  start ();

  return stop;

};

/* EXPORT */

export default pollex;
