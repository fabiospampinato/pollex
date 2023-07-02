
/* IMPORT */

import fs from 'node:fs';

/* MAIN */

const consume = <T> ( values: Set<T>, count: number ): Set<T> => {

  const consumed = new Set<T> ();

  for ( let i = 0; i < count && values.size; i++ ) {

    const value = values.values ().next ().value;

    consumed.add ( value );
    values.delete ( value );

  }

  return consumed;

};

const difference = ( prev: Set<string>, next: Set<string> ): [added: string[], deleted: string[]] => {

  const added: string[] = [];
  const deleted: string[] = [];

  for ( const value of prev ) {

    if ( next.has ( value ) ) continue;

    deleted.push ( value );

  }

  for ( const value of next ) {

    if ( prev.has ( value ) ) continue;

    added.push ( value );

  }

  return [added, deleted];

};

const shuffle = <T> ( values: T[] ): T[] => {

  const shuffled = Array.from ( values );

  for ( let ti = shuffled.length - 1; ti > 0; ti-- ) {

    const fi = Math.round ( Math.random () * ti );

    const from = shuffled[fi];
    const to = shuffled[ti];

    shuffled[fi] = to;
    shuffled[ti] = from;

  }

  return shuffled;

};

const stat = ( filePath: string ): fs.Stats | false | undefined => {

  try {

    return fs.statSync ( filePath );

  } catch ( error: unknown ) {

    return error instanceof Error && error['code'] === 'ENOENT' ? false : undefined; //UGLY

  }

};

const without = <T> ( values: Set<T>, exclude: Set<T> ): Set<T> => {

  const filtered = new Set<T> ();

  for ( const value of values ) {

    if ( exclude.has ( value ) ) continue;

    filtered.add ( value );

  }

  return filtered;

};

/* EXPORT */

export {difference, without, consume, shuffle, stat};
