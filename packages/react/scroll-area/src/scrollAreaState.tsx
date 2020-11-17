import { Size, ResizeBehavior } from './types';

export enum ScrollAreaState {
  Idle = 'Idle',
  Thumbing = 'Thumbing',
  Tracking = 'Tracking',
  ButtonScrolling = 'ButtonScrolling',
}

export enum ScrollAreaEvents {
  DeriveStateFromProps,
  HandleScrollbarXResize,
  HandleScrollbarYResize,
  HandleTrackXResize,
  HandleTrackYResize,
  SetContentOverflowing,
  SetExplicitResize,
}

// prettier-ignore
export type ScrollAreaEvent =
  | { type: ScrollAreaEvents.SetExplicitResize; value: ResizeBehavior }
  | { type: ScrollAreaEvents.HandleScrollbarXResize; size: Size }
  | { type: ScrollAreaEvents.HandleScrollbarYResize; size: Size }
  | { type: ScrollAreaEvents.HandleTrackXResize; size: Size }
  | { type: ScrollAreaEvents.HandleTrackYResize; size: Size }
  | { type: ScrollAreaEvents.SetContentOverflowing; x: boolean, y: boolean }

export type ScrollAreaReducerState = {
  state: ScrollAreaState;
  explicitResize: ResizeBehavior;
  isContentOverflowingX: boolean;
  isContentOverflowingY: boolean;
  domSizes: {
    scrollbarY: Size;
    scrollbarX: Size;
    trackY: Size;
    trackX: Size;
  };
};

export function reducer(
  context: ScrollAreaReducerState,
  event: ScrollAreaEvent
): ScrollAreaReducerState {
  switch (event.type) {
    case ScrollAreaEvents.SetExplicitResize: {
      return {
        ...context,
        explicitResize: event.value,
      };
    }
    case ScrollAreaEvents.SetContentOverflowing: {
      return {
        ...context,
        isContentOverflowingX: event.x,
        isContentOverflowingY: event.y,
      };
    }
    case ScrollAreaEvents.HandleScrollbarXResize: {
      return {
        ...context,
        domSizes: { ...context.domSizes, scrollbarX: event.size },
      };
    }
    case ScrollAreaEvents.HandleScrollbarYResize: {
      return {
        ...context,
        domSizes: { ...context.domSizes, scrollbarY: event.size },
      };
    }
    case ScrollAreaEvents.HandleTrackXResize: {
      return {
        ...context,
        domSizes: { ...context.domSizes, trackX: event.size },
      };
    }
    case ScrollAreaEvents.HandleTrackYResize: {
      return {
        ...context,
        domSizes: { ...context.domSizes, trackY: event.size },
      };
    }
  }

  return context;
}
