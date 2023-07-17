
/* MAIN */

type Disposer = () => void;

type Event = 'add' | 'addDir' | 'change' | 'ready' | 'unlink' | 'unlinkDir';

type Handler = ( event: Event, targetPath: string ) => void;

type Ignore = (( targetPath: string ) => boolean) | RegExp;

type Options = {
  depth?: number,
  limit?: number,
  followSymlinks?: boolean,
  ignore?: Ignore,
  ignoreInitial?: boolean,
  ignoreReady?: boolean,
  pollingIntervalCold?: number,
  pollingIntervalHot?: number
};

/* EXPORT */

export type {Disposer, Event, Handler, Ignore, Options};
