# Pollex

A tiny polling-based filesystem watcher that tries to be efficient.

This is a port of the idea behind [`esbuild`](https://esbuild.github.io/api/#watch)'s filesystem watcher, which uses polling but more efficiently than using it naively.

## Features

Unless you really want this I'd recommend using a [normal](https://github.com/fabiospampinato/watcher) filesystem watcher instead, since polling can get expensive.

- Changes happening inside the root folder should get picked up roughly within `options.pollingIntervalCold / 2` milliseconds on average.
- Changes happening inside files that the watcher already saw changing should get picked up roughly within `options.pollingIntervalHot / 2` milliseconds on average.
- Basically files that changed already are considered hot and polled frequently, while random subsets of the other files are polled infrequently.
- This should be roughly `options.pollingIntervalCold / options.pollingIntervalHot` times cheaper than just polling every file on a `options.pollingIntervalHot` interval.

In some niche scenarios a filesystem watcher that works like this could be useful:

- It doesn't rely on potentially buggy native filesystem watching APIs, it just needs to be able to fire `stat` syscalls.
- It works even over filesystems for which a native watching API is not available.
- It doesn't run out of file descriptors, because it doesn't keep any open indefinitely.
- It can potentially be used to react to filesystem events quicker than it's possible with `fs.watch` in Node, which is weirdly slow.
- It's about 20x smaller than [`chokidar`](https://github.com/paulmillr/chokidar), with no third-party dependencies, and a way simpler implementation.

## Install

```sh
npm install --save pollex
```

## Usage

```ts
import pollex from 'pollex';

// Let's define some options

const pollexOptions = {
  depth: 20, // Maximum depth to look at
  limit: 1_000_000, // Maximum number of files explored, useful as a stop gap in some edge cases
  followSymlinks: true, // Whether to follow symlinks or not
  ignore: targetPath => /node_modules/.test ( targetPath ), // Function that if returns true will ignore this particular file or a directory and its descendants
  ignoreInitial: true, // Ignore the initial "add" and "addDir" events while the folder is being scanned the first time
  pollingIntervalCold: 2000, // Poll all cold files, in different random subsets, within this amount of time, roughly
  pollingIntervalHot: 50 // Poll all hot files within this amount of time, roughly
};

// Let's listen for events

pollex ( process.cwd (), ( event, targetPath ) => {

  if ( event === 'add' ) {

    // The file at "targetPath" got added

  } else if ( event === 'addDir' ) {

    // The folder at "targetPath" got added

  } else if ( event === 'change' ) {

    // The file at "targetPath" changed

  } else if ( event === 'ready' ) {

    // The initial scan has been done and all initial events have been emitted

  } else if ( event === 'unlink' ) {

    // The file at "targetPath" got deleted

  } else if ( event === 'unlinkDir' ) {

    // The folder at "targetPath" got deleted

  }

}, pollexOptions );
```

## License

MIT © Fabio Spampinato
