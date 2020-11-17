import { Queue } from './queue';
import { ScrollAreaReducerState, ScrollAreaEvent } from './scrollAreaState';
import type { Axis, Size } from '@interop-ui/utils';
export type { Axis, Size, ScrollAreaReducerState, ScrollAreaEvent };
export type LogicalDirection = 'start' | 'end';
export type OverflowBehavior = 'auto' | 'hidden' | 'scroll' | 'visible';
export type PointerPosition = { x: number; y: number };
export type ResizeBehavior = 'none' | 'both' | 'horizontal' | 'vertical' | 'initial' | 'inherit';
export type ScrollbarVisibility = 'always' | 'scroll' | 'hover';
export type ScrollDirection = 'up' | 'down' | 'left' | 'right';
export type TrackClickBehavior = 'page' | 'relative';

export type ScrollAreaNodes = {
  position?: HTMLDivElement | null;
  scrollbarX?: HTMLDivElement | null;
  scrollbarY?: HTMLDivElement | null;
  viewport?: HTMLDivElement | null;
};

export type ScrollAreaScrollbarNodes = {
  thumb?: HTMLDivElement | null;
  track?: HTMLDivElement | null;
};

export type ScrollAreaOwnProps = {
  children: React.ReactNode;
  /**
   * Overflow behavior for the x axis. Mirrors the `overflow-x` CSS property.
   *
   * (default: `"auto"`)
   */
  overflowX?: OverflowBehavior;
  /**
   * Overflow behavior for the y axis. Mirrors the `overflow-y` CSS property.
   *
   * (default: `"auto"`)
   */
  overflowY?: OverflowBehavior;
  /**
   * Describes the nature of scrollbar visibility, similar to how the scrollbar preferences in MacOS
   * control visibility of native scrollbars.
   * - `"always"`: Scrollbars are always visible when content is overflowing
   * - `"scroll"`: Scrollbars are visible when the user is scrolling along its corresponding axis
   * - `"hover"`: Scrollbars are visible when the user is scrolling along its corresponding axis and
   *   when the user is hovering over scrollable area
   *
   * (default: `"always"`)
   */
  scrollbarVisibility?: ScrollbarVisibility;
  /**
   * If `scrollbarVisibility` is set to either `"scroll"`, this prop determines the length of time,
   * in milliseconds, before the scrollbars are hidden after the user stops interacting with
   * scrollbars.
   *
   * (default: 600)
   */
  scrollbarVisibilityRestTimeout?: number;
  /**
   * Describes the action that occurs when a user clicks on the scroll track. When `"relative"`, the
   * scroll area will jump to a spot relative to where the user has clicked in relation to the
   * track. When `"page"`, the scroll area will initially jump to the next or previous page of
   * the viewable area, depending on which direction on the track is clicked.
   *
   * (default: `"relative"`)
   */
  trackClickBehavior?: TrackClickBehavior;
  /**
   * Mostly here for debugging, but these might be useful for consumers
   */
  unstable_forceNative?: boolean;
  unstable_prefersReducedMotion?: boolean;
  dir?: 'rtl' | 'ltr';
};

export type ScrollAreaContextValue = {
  dir?: 'rtl' | 'ltr';
  overflowX: OverflowBehavior;
  overflowY: OverflowBehavior;
  isReducedMotion: boolean;
  scrollbarVisibility: ScrollbarVisibility;
  scrollbarVisibilityRestTimeout: number;
  trackClickBehavior: TrackClickBehavior;
  isHovered: boolean;
};

export type ScrollbarContextValue = {
  axis: Axis;
  scrollAnimationQueue: Queue<any>;
  scrollbarNodesRef: React.MutableRefObject<ScrollAreaScrollbarNodes>;
  onTrackResize(size: Size): void;
  onTrackPagePointerDown?(): void;
  onTrackScrollPointerDown?(): void;
};
