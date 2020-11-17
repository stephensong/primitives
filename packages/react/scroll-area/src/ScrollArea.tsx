// This component is a progressive enhancement that will fallback to a staandard div with overflow:
// scroll for browsers that don't support features we rely on.

// Needs to support:
//  - ResizeObserver
//  - PointerEvents
//  - CSS scrollbar-width OR -webkit-scrollbar

// TODO: Replace all globals with globals relative to the root node
// TODO: RTL language testing for horizontal scrolling

import {
  composeEventHandlers,
  createContext,
  createStyleObj,
  forwardRef,
  memo,
  useCallbackRef,
  useComposedRefs,
  useConstant,
  useLayoutEffect,
  usePrefersReducedMotion,
} from '@interop-ui/react-utils';
import { clamp, cssReset, isMainClick } from '@interop-ui/utils';
import * as React from 'react';
import {
  Axis,
  LogicalDirection,
  ResizeBehavior,
  ScrollAreaContextValue,
  ScrollAreaEvent,
  ScrollAreaOwnProps,
  ScrollAreaReducerState,
  ScrollAreaNodes,
  ScrollAreaScrollbarNodes,
  ScrollbarContextValue,
  Size,
} from './types';
import { ScrollAreaState, ScrollAreaEvents, reducer } from './scrollAreaState';
import { bezier } from './bezier-easing';
import { Queue } from './queue';
import {
  animate,
  canScroll,
  determineScrollDirectionFromTrackClick,
  getClientSize,
  getLogicalRect,
  getLongPagedDraw,
  getLongPagedScrollDistance,
  getNewScrollPosition,
  getPagedDraw,
  getPagedScrollDistance,
  getPointerPosition,
  getScrollPosition,
  getScrollSize,
  getVisibleToTotalRatio,
  pointerIsOutsideElement,
  scrollBy,
  setScrollPosition,
  shouldFallbackToNativeScroll,
  shouldOverflow,
  useBorderBoxResizeObserver,
  hasOffset,
} from './scrollAreaUtils';
import { useHover } from './useHover';

const CSS_PROPS = {
  scrollbarThumbWillChange: '--interop-scroll-area-scrollbar-thumb-will-change',
  scrollbarThumbHeight: '--interop-scroll-area-scrollbar-thumb-height',
  scrollbarThumbWidth: '--interop-scroll-area-scrollbar-thumb-width',
  cornerLeft: '--interop-scroll-area-corner-left',
  cornerRight: '--interop-scroll-area-corner-right',
  cornerWidth: '--interop-scroll-area-corner-width',
  cornerHeight: '--interop-scroll-area-corner-height',
} as const;

const ROOT_DEFAULT_TAG = 'div';
const ROOT_NAME = 'ScrollArea';

// Keeping nodes in a separate context; should be a stable reference throughout the tree
const [ScrollAreaNodesContext, useScrollAreaNodes] = createContext<
  React.MutableRefObject<ScrollAreaNodes>
>('ScrollAreaNodesContext', ROOT_NAME);

const [ScrollAreaContext, useScrollAreaContext] = createContext<ScrollAreaContextValue>(
  'ScrollAreaContext',
  ROOT_NAME
);

const ScrollAreaStateContext = React.createContext<ScrollAreaReducerState>({} as any);
ScrollAreaStateContext.displayName = 'ScrollAreaStateContext';
const useScrollAreaStateContext = () => React.useContext(ScrollAreaStateContext);

// We render native scrollbars initially and switch to custom scrollbars after hydration if the
// user's browser supports the necessary features. Many internal components will return `null` when
// using native scrollbars, so we keep implementation separate throughout and check support in this
// context during render.
const NativeScrollContext = React.createContext<boolean>(true);
const useNativeScrollArea = () => React.useContext(NativeScrollContext);

const [DispatchContext, useDispatchContext] = createContext<React.Dispatch<ScrollAreaEvent>>(
  'DispatchContext',
  ROOT_NAME
);

/* -------------------------------------------------------------------------------------------------
 * ScrollArea
 * -----------------------------------------------------------------------------------------------*/

type ScrollAreaDOMProps = Omit<React.ComponentPropsWithoutRef<typeof ROOT_DEFAULT_TAG>, 'children'>;
type ScrollAreaProps = ScrollAreaDOMProps & ScrollAreaOwnProps;

const ScrollArea = forwardRef<typeof ROOT_DEFAULT_TAG, ScrollAreaProps, ScrollAreaStaticProps>(
  function ScrollArea(props, forwardedRef) {
    const {
      as: Comp = ROOT_DEFAULT_TAG,
      children,
      overflowX = 'auto',
      overflowY = 'auto',
      scrollbarVisibility = 'always',
      scrollbarVisibilityRestTimeout = 600,
      trackClickBehavior = 'relative',
      unstable_forceNative: forceNative = false,
      unstable_prefersReducedMotion = false,
      ...domProps
    } = props;

    const [usesNative, setUsesNative] = React.useState(true);
    const commonProps = { ...interopDataAttrObj('root'), ...domProps, ref: forwardedRef };

    // Check to make sure the user's browser supports our custom scrollbar features. We use a layout
    // effect here to avoid a visible flash when the custom scroll area replaces the native version.
    useLayoutEffect(() => {
      setUsesNative(forceNative || shouldFallbackToNativeScroll());
    }, [forceNative]);

    return usesNative ? (
      // We prevent resize as it's not currently supported
      <Comp {...commonProps} style={{ ...domProps.style, overflowX, overflowY, resize: 'none' }}>
        <NativeScrollContext.Provider value={true}>{children}</NativeScrollContext.Provider>
      </Comp>
    ) : (
      <ScrollAreaImpl
        {...commonProps}
        as={Comp}
        overflowX={overflowX}
        overflowY={overflowY}
        scrollbarVisibility={scrollbarVisibility}
        scrollbarVisibilityRestTimeout={scrollbarVisibilityRestTimeout}
        trackClickBehavior={trackClickBehavior}
        unstable_prefersReducedMotion={unstable_prefersReducedMotion}
        ref={forwardedRef}
      >
        <NativeScrollContext.Provider value={false}>{children}</NativeScrollContext.Provider>
      </ScrollAreaImpl>
    );
  }
);

type SomeRequired<T extends object, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
type ScrollAreaImplProps = SomeRequired<
  ScrollAreaProps,
  | 'overflowX'
  | 'overflowY'
  | 'scrollbarVisibility'
  | 'scrollbarVisibilityRestTimeout'
  | 'trackClickBehavior'
  | 'unstable_prefersReducedMotion'
>;

const initialSize = { width: 0, height: 0 };
const initialState: ScrollAreaReducerState = {
  state: ScrollAreaState.Idle,
  explicitResize: 'initial',
  isContentOverflowingX: false,
  isContentOverflowingY: false,
  domSizes: {
    scrollbarY: initialSize,
    scrollbarX: initialSize,
    trackY: initialSize,
    trackX: initialSize,
  },
};

const ScrollAreaImpl = forwardRef<typeof ROOT_DEFAULT_TAG, ScrollAreaImplProps>(
  function ScrollAreaImpl(props, forwardedRef) {
    const {
      as: Comp = ROOT_DEFAULT_TAG,
      children,
      overflowX,
      overflowY,
      scrollbarVisibility,
      scrollbarVisibilityRestTimeout,
      trackClickBehavior,
      unstable_prefersReducedMotion,
      ...domProps
    } = props;

    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const scrollAreaNodesRef = React.useRef<ScrollAreaNodes>({} as any);
    const ref = useComposedRefs(forwardedRef, scrollAreaRef);
    const prefersReducedMotion = usePrefersReducedMotion(scrollAreaRef);
    const isReducedMotion = unstable_prefersReducedMotion ?? prefersReducedMotion;
    const [reducerState, dispatch] = React.useReducer(reducer, initialState);
    const { scrollbarX, scrollbarY } = reducerState.domSizes;

    const {
      hoverProps: { onPointerEnter, onPointerLeave },
      isHovered,
    } = useHover();

    const context: ScrollAreaContextValue = React.useMemo(() => {
      return {
        dir: props.dir || 'ltr',
        isHovered,
        overflowX,
        overflowY,
        isReducedMotion,
        scrollbarVisibility,
        scrollbarVisibilityRestTimeout,
        trackClickBehavior,
      };
    }, [
      props.dir,
      isHovered,
      overflowX,
      overflowY,
      isReducedMotion,
      scrollbarVisibility,
      scrollbarVisibilityRestTimeout,
      trackClickBehavior,
    ]);

    return (
      <Comp
        {...domProps}
        ref={ref}
        onPointerEnter={composeEventHandlers(props.onPointerEnter, onPointerEnter)}
        onPointerLeave={composeEventHandlers(props.onPointerLeave, onPointerLeave)}
        style={{
          ...domProps.style,
          [CSS_PROPS.cornerHeight as any]: (scrollbarX.height || scrollbarY.width || 16) + 'px',
          [CSS_PROPS.cornerWidth as any]: (scrollbarY.width || scrollbarX.height || 16) + 'px',
        }}
      >
        <DispatchContext.Provider value={dispatch}>
          <ScrollAreaNodesContext.Provider value={scrollAreaNodesRef}>
            <ScrollAreaContext.Provider value={context}>
              <ScrollAreaStateContext.Provider value={reducerState}>
                {children}
              </ScrollAreaStateContext.Provider>
            </ScrollAreaContext.Provider>
          </ScrollAreaNodesContext.Provider>
        </DispatchContext.Provider>
      </Comp>
    );
  }
);

/* -------------------------------------------------------------------------------------------------
 * ScrollAreaViewport
 * -----------------------------------------------------------------------------------------------*/

const VIEWPORT_DEFAULT_TAG = 'div';
const VIEWPORT_NAME = 'ScrollArea.Viewport';
type ScrollAreaViewportDOMProps = React.ComponentPropsWithoutRef<typeof VIEWPORT_DEFAULT_TAG>;
type ScrollAreaViewportOwnProps = {};
type ScrollAreaViewportProps = ScrollAreaViewportDOMProps & ScrollAreaViewportOwnProps;

const ScrollAreaViewportImpl = forwardRef<typeof VIEWPORT_DEFAULT_TAG, ScrollAreaViewportProps>(
  function ScrollAreaViewportImpl(props, forwardedRef) {
    const { as: Comp = VIEWPORT_DEFAULT_TAG, ...domProps } = props;
    const scrollAreaNodesRef = useScrollAreaNodes(VIEWPORT_NAME);
    const scrollAreaNodes = scrollAreaNodesRef.current;
    const stateContext = useScrollAreaStateContext();
    const dispatch = useDispatchContext(VIEWPORT_NAME);
    const { overflowX, overflowY, scrollbarVisibility } = useScrollAreaContext(VIEWPORT_NAME);
    const viewportRef = React.useRef<HTMLDivElement>(null);
    const ref = useComposedRefs(
      forwardedRef,
      viewportRef,
      (node) => (scrollAreaNodesRef.current.viewport = node)
    );

    const hasOffsetX = hasOffset(
      scrollbarVisibility,
      overflowX,
      stateContext.isContentOverflowingX
    );

    const hasOffsetY = hasOffset(
      scrollbarVisibility,
      overflowY,
      stateContext.isContentOverflowingY
    );

    useBorderBoxResizeObserver(viewportRef, () => {
      if (scrollAreaNodes.position) {
        const { scrollWidth, clientWidth, scrollHeight, clientHeight } = scrollAreaNodes.position;
        const isOverflowingX = isContentOverflowing(scrollWidth, clientWidth);
        const isOverflowingY = isContentOverflowing(scrollHeight, clientHeight);
        const hasOverflowingXChanged = isOverflowingX !== stateContext.isContentOverflowingX;
        const hasOverflowingYChanged = isOverflowingY !== stateContext.isContentOverflowingY;

        if (hasOverflowingXChanged || hasOverflowingYChanged) {
          dispatch({
            type: ScrollAreaEvents.SetContentOverflowing,
            x: isOverflowingX,
            y: isOverflowingY,
          });
        }
      }
    });

    return (
      <div
        data-interop-scroll-area-position=""
        ref={(node) => (scrollAreaNodesRef.current.position = node)}
        style={{
          ...cssReset('div'),
          zIndex: 1,
          flexShrink: '1',
          scrollbarWidth: 'none',
          overflowScrolling: 'touch',
          resize: 'none',
          overflowX,
          overflowY,
        }}
      >
        <div
          data-interop-scroll-area-position-inner=""
          style={{
            ...cssReset('div'),
            // The browser won’t add right padding of the viewport when you scroll to the end of the
            // x axis if we put the scrollbar offset padding directly on the position element. We
            // get around this with an extra wrapper with `display: table`.
            // https://blog.alexandergottlieb.com/overflow-scroll-and-the-right-padding-problem-a-css-only-solution-6d442915b3f4
            display: 'table',
            paddingBottom: hasOffsetX && (stateContext.domSizes.scrollbarX.height ?? 0) + 'px',
            paddingRight: hasOffsetY && (stateContext.domSizes.scrollbarY.width ?? 0) + 'px',
          }}
        >
          <Comp {...interopDataAttrObj('viewport')} ref={ref} {...domProps} />
        </div>
      </div>
    );
  }
);

const ScrollAreaViewport = memo(
  forwardRef<typeof VIEWPORT_DEFAULT_TAG, ScrollAreaViewportProps>(function ScrollAreaViewport(
    props,
    forwardedRef
  ) {
    const { as: Comp = VIEWPORT_DEFAULT_TAG, ...domProps } = props;
    return useNativeScrollArea() ? (
      <Comp {...interopDataAttrObj('viewport')} ref={forwardedRef} {...domProps} />
    ) : (
      <ScrollAreaViewportImpl ref={forwardedRef} as={Comp} {...domProps} />
    );
  })
);

/* -------------------------------------------------------------------------------------------------
 * ScrollAreaScrollbarX / ScrollAreaScrollbarY
 * -----------------------------------------------------------------------------------------------*/

const SCROLLBAR_DEFAULT_TAG = 'div';
const SCROLLBAR_X_NAME = 'ScrollArea.ScrollbarX';
const SCROLLBAR_Y_NAME = 'ScrollArea.ScrollbarY';
type ScrollAreaScrollbarDOMProps = React.ComponentPropsWithoutRef<typeof SCROLLBAR_DEFAULT_TAG>;
type ScrollAreaScrollbarOwnProps = {};
type ScrollAreaScrollbarProps = ScrollAreaScrollbarDOMProps & ScrollAreaScrollbarOwnProps;
type ScrollAreaScrollbarXProps = ScrollAreaScrollbarProps;
type ScrollAreaScrollbarYProps = ScrollAreaScrollbarProps;
type InternalScrollbarProps = ScrollAreaScrollbarProps & {
  name: string;
  visible: boolean;
  contentOverflowing: boolean;
  onVisibleChange(isVisible: boolean): void;
};

const [ScrollbarContext, useScrollbarContext] = createContext<ScrollbarContextValue>(
  'ScrollbarContext',
  'ScrollAreaScrollbarImpl'
);

const ScrollAreaScrollbarImpl = forwardRef<typeof SCROLLBAR_DEFAULT_TAG, InternalScrollbarProps>(
  function ScrollAreaScrollbarImpl(props, forwardedRef) {
    const {
      as: Comp = SCROLLBAR_DEFAULT_TAG,
      name,
      visible: isVisible,
      contentOverflowing: isContentOverflowing,
      onPointerDown,
      onPointerUp,
      onPointerMove,
      onVisibleChange,
      onScroll,
      ...domProps
    } = props;
    const scrollAreaContext = useScrollAreaContext(name);
    const scrollAreaNodesRef = useScrollAreaNodes('ScrollAreaScrollbar');
    const scrollAreaNodes = scrollAreaNodesRef.current;
    const { scrollbarVisibility, scrollbarVisibilityRestTimeout, isHovered } = scrollAreaContext;
    const pointerDownRef = React.useRef(false);
    const timeoutIdRef = React.useRef<number>(0);
    const handleScroll = useCallbackRef(onScroll);
    const handleVisibleChange = useCallbackRef(onVisibleChange);

    const resetInteractiveTimer = React.useCallback(() => {
      if (scrollbarVisibility !== 'always') {
        window.clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = window.setTimeout(
          () => handleVisibleChange(false),
          scrollbarVisibilityRestTimeout
        );
      }
      return timeoutIdRef.current;
    }, [handleVisibleChange, scrollbarVisibility, scrollbarVisibilityRestTimeout]);

    React.useEffect(() => {
      const timer = isVisible ? resetInteractiveTimer() : 0;
      return () => window.clearTimeout(timer);
    }, [resetInteractiveTimer, isVisible]);

    React.useEffect(() => {
      if (scrollAreaNodes.position) {
        const position = scrollAreaNodes.position;
        position.addEventListener('scroll', handleScroll);
        return () => position.removeEventListener('scroll', handleScroll);
      }
    }, [scrollAreaNodes.position, handleScroll]);

    React.useEffect(() => {
      if (scrollbarVisibility === 'hover') handleVisibleChange(isHovered);
    }, [scrollbarVisibility, isHovered, handleVisibleChange]);

    // isContentOverflowing ? <Comp /> : null
    return (
      <Comp
        ref={forwardedRef}
        {...domProps}
        style={{
          ...domProps.style,
          display: !isContentOverflowing ? 'none' : domProps.style?.display,
          opacity: isVisible ? domProps.style?.opacity ?? 1 : 0,
          pointerEvents: isVisible ? domProps.style?.pointerEvents || 'auto' : 'none',
        }}
        onPointerDown={composeEventHandlers(onPointerDown, () => {
          // Not capturing the pointer because the user may be clicking on the thumb, but we
          // need to know whether or not it's down on pointer move so we use a ref.
          pointerDownRef.current = true;
          window.clearTimeout(timeoutIdRef.current);
        })}
        onPointerUp={composeEventHandlers(onPointerUp, () => {
          pointerDownRef.current = false;
          resetInteractiveTimer();
        })}
        onPointerMove={composeEventHandlers(onPointerMove, () => {
          if (!pointerDownRef.current) resetInteractiveTimer();
        })}
      />
    );
  }
);

const ScrollAreaScrollbarX = forwardRef<typeof SCROLLBAR_DEFAULT_TAG, ScrollAreaScrollbarXProps>(
  function ScrollAreaScrollbarX(props, forwardedRef) {
    return useNativeScrollArea() ? null : (
      <ScrollAreaScrollbarXImpl ref={forwardedRef} {...props} />
    );
  }
);

const ScrollAreaScrollbarXImpl = memo(
  forwardRef<typeof SCROLLBAR_DEFAULT_TAG, ScrollAreaScrollbarXProps>(function ScrollAreaScrollbarX(
    props,
    forwardedRef
  ) {
    const stateContext = useScrollAreaStateContext();
    const dispatch = useDispatchContext(SCROLLBAR_X_NAME);
    const { scrollbarVisibility } = useScrollAreaContext(SCROLLBAR_X_NAME);
    const scrollAreaNodesRef = useScrollAreaNodes(SCROLLBAR_X_NAME);
    const scrollAreaNodes = scrollAreaNodesRef.current;
    const scrollbarRef = React.useRef<HTMLDivElement>(null);
    const scrollbarNodesRef = React.useRef<ScrollAreaScrollbarNodes>({} as any);
    const scrollbarNodes = scrollbarNodesRef.current;
    const prevScrollPositionRef = React.useRef(0);
    const [isVisible, setIsVisible] = React.useState(() => scrollbarVisibility === 'always');

    const ref = useComposedRefs(
      forwardedRef,
      scrollbarRef,
      (node) => (scrollAreaNodesRef.current.scrollbarX = node)
    );

    const moveThumbToScrollPosition = React.useCallback(() => {
      if (scrollbarNodes.thumb && scrollAreaNodes.position) {
        const { scrollWidth, clientWidth, scrollLeft } = scrollAreaNodes.position;
        const thumbPos = getThumbPosition(scrollWidth, clientWidth, scrollLeft);
        if (thumbPos) scrollbarNodes.thumb.style.left = thumbPos;
      }
    }, [scrollbarNodes.thumb, scrollAreaNodes.position]);

    useBorderBoxResizeObserver(scrollbarRef, (size) => {
      dispatch({
        type: ScrollAreaEvents.HandleScrollbarXResize,
        size: { width: size.inlineSize, height: size.blockSize },
      });
    });

    React.useEffect(moveThumbToScrollPosition, [moveThumbToScrollPosition]);

    // Animation effects triggered by button and track clicks are managed in a queue to prevent race
    // conditions and invalid DOM measurements when the user clicks faster than the animation is
    // able to be completed
    const scrollAnimationQueue = useConstant(() => new Queue<any>());
    const context: ScrollbarContextValue = React.useMemo(
      () => ({
        axis: 'x',
        scrollAnimationQueue,
        scrollbarNodesRef,
        onTrackResize(size) {
          dispatch({ type: ScrollAreaEvents.HandleTrackXResize, size });
        },
      }),
      [scrollAnimationQueue, dispatch]
    );

    return (
      <ScrollAreaScrollbarImpl
        {...interopDataAttrObj('scrollbarX')}
        ref={ref}
        {...props}
        name={SCROLLBAR_X_NAME}
        visible={isVisible}
        contentOverflowing={stateContext.isContentOverflowingX}
        style={{
          ...props.style,
          [CSS_PROPS.scrollbarThumbWillChange as any]: 'left',
          [CSS_PROPS.scrollbarThumbHeight as any]: '100%',
          [CSS_PROPS.scrollbarThumbWidth as any]: 'auto',
        }}
        onVisibleChange={setIsVisible}
        onScroll={() => {
          if (scrollAreaNodes.position) {
            moveThumbToScrollPosition();
            if (scrollbarVisibility !== 'always') {
              setIsVisible(scrollAreaNodes.position.scrollLeft !== prevScrollPositionRef.current);
            }
            prevScrollPositionRef.current = scrollAreaNodes.position.scrollLeft;
          }
        }}
        onWheel={composeEventHandlers(props.onWheel, (event) => {
          if (scrollAreaNodes.position) scrollAreaNodes.position.scrollLeft += event.deltaX;
        })}
      >
        <ScrollbarContext.Provider value={context}>{props.children}</ScrollbarContext.Provider>
      </ScrollAreaScrollbarImpl>
    );
  })
);

const ScrollAreaScrollbarY = forwardRef<typeof SCROLLBAR_DEFAULT_TAG, ScrollAreaScrollbarYProps>(
  function ScrollAreaScrollbarY(props, forwardedRef) {
    return useNativeScrollArea() ? null : (
      <ScrollAreaScrollbarYImpl ref={forwardedRef} {...props} />
    );
  }
);

const ScrollAreaScrollbarYImpl = memo(
  forwardRef<typeof SCROLLBAR_DEFAULT_TAG, ScrollAreaScrollbarYProps>(function ScrollAreaScrollbarY(
    props,
    forwardedRef
  ) {
    const stateContext = useScrollAreaStateContext();
    const dispatch = useDispatchContext(SCROLLBAR_Y_NAME);
    const { scrollbarVisibility } = useScrollAreaContext(SCROLLBAR_Y_NAME);
    const scrollAreaNodesRef = useScrollAreaNodes(SCROLLBAR_Y_NAME);
    const scrollAreaNodes = scrollAreaNodesRef.current;
    const scrollbarRef = React.useRef<HTMLDivElement>(null);
    const scrollbarNodesRef = React.useRef<ScrollAreaScrollbarNodes>({} as any);
    const scrollbarNodes = scrollbarNodesRef.current;
    const prevScrollPositionRef = React.useRef(0);
    const [isVisible, setIsVisible] = React.useState(() => scrollbarVisibility === 'always');

    const ref = useComposedRefs(
      forwardedRef,
      scrollbarRef,
      (node) => (scrollAreaNodesRef.current.scrollbarY = node)
    );

    useBorderBoxResizeObserver(scrollbarRef, (size) => {
      dispatch({
        type: ScrollAreaEvents.HandleScrollbarYResize,
        size: { width: size.inlineSize, height: size.blockSize },
      });
    });

    const moveThumbToScrollPosition = React.useCallback(() => {
      if (scrollbarNodes.thumb && scrollAreaNodes.position) {
        const { scrollHeight, clientHeight, scrollTop } = scrollAreaNodes.position;
        const thumbPos = getThumbPosition(scrollHeight, clientHeight, scrollTop);
        if (thumbPos) scrollbarNodes.thumb.style.top = thumbPos;
      }
    }, [scrollbarNodes.thumb, scrollAreaNodes.position]);

    React.useEffect(moveThumbToScrollPosition, [moveThumbToScrollPosition]);

    // Animation effects triggered by button and track clicks are managed in a queue to prevent race
    // conditions and invalid DOM measurements when the user clicks faster than the animation is
    // able to be completed
    const scrollAnimationQueue = useConstant(() => new Queue<any>());
    const context: ScrollbarContextValue = React.useMemo(
      () => ({
        axis: 'y',
        scrollAnimationQueue,
        scrollbarNodesRef,
        onTrackResize(size) {
          dispatch({ type: ScrollAreaEvents.HandleTrackYResize, size });
        },
      }),
      [scrollAnimationQueue, dispatch]
    );

    return (
      <ScrollAreaScrollbarImpl
        {...interopDataAttrObj('scrollbarY')}
        ref={ref}
        {...props}
        name={SCROLLBAR_Y_NAME}
        visible={isVisible}
        contentOverflowing={stateContext.isContentOverflowingY}
        style={{
          ...props.style,
          [CSS_PROPS.scrollbarThumbWillChange as any]: 'top',
          [CSS_PROPS.scrollbarThumbHeight as any]: 'auto',
          [CSS_PROPS.scrollbarThumbWidth as any]: '100%',
        }}
        onVisibleChange={setIsVisible}
        onScroll={() => {
          if (scrollAreaNodes.position) {
            moveThumbToScrollPosition();
            if (scrollbarVisibility !== 'always') {
              setIsVisible(scrollAreaNodes.position.scrollTop !== prevScrollPositionRef.current);
            }
            prevScrollPositionRef.current = scrollAreaNodes.position.scrollTop;
          }
        }}
        onWheel={composeEventHandlers(props.onWheel, (event) => {
          if (scrollAreaNodes.position) scrollAreaNodes.position.scrollTop += event.deltaY;
        })}
      >
        <ScrollbarContext.Provider value={context}>{props.children}</ScrollbarContext.Provider>
      </ScrollAreaScrollbarImpl>
    );
  })
);

/* -------------------------------------------------------------------------------------------------
 * ScrollAreaTrack
 * -----------------------------------------------------------------------------------------------*/

const TRACK_DEFAULT_TAG = 'div';
const TRACK_NAME = 'ScrollArea.Track';
type ScrollAreaTrackDOMProps = React.ComponentPropsWithoutRef<typeof TRACK_DEFAULT_TAG>;
type ScrollAreaTrackOwnProps = {};
type ScrollAreaTrackProps = ScrollAreaTrackDOMProps & ScrollAreaTrackOwnProps;

const ScrollAreaTrack = forwardRef<typeof TRACK_DEFAULT_TAG, ScrollAreaTrackProps>(
  function ScrollAreaTrack(props, forwardedRef) {
    const { as: Comp = TRACK_DEFAULT_TAG, onPointerDown: onPointerDownProp, ...domProps } = props;
    const { trackClickBehavior, isReducedMotion } = useScrollAreaContext(TRACK_NAME);
    const scrollbarContext = useScrollbarContext(TRACK_NAME);
    const { axis } = scrollbarContext;
    const dispatch = useDispatchContext(TRACK_NAME);
    const scrollAreaNodesRef = useScrollAreaNodes(TRACK_NAME);
    const scrollAreaNodes = scrollAreaNodesRef.current;
    const scrollbarNodes = scrollbarContext.scrollbarNodesRef.current;
    const trackRef = React.useRef<HTMLDivElement>(null);
    const ref = useComposedRefs(
      trackRef,
      forwardedRef,
      (node) => (scrollbarContext.scrollbarNodesRef.current.track = node)
    );
    const onPointerDown = useCallbackRef(onPointerDownProp);
    const rafIdRef = React.useRef<number>(0);

    useBorderBoxResizeObserver(trackRef, (size: ResizeObserverSize) => {
      scrollbarContext.onTrackResize({ width: size.inlineSize, height: size.blockSize });
    });

    React.useEffect(() => {
      let trackPointerDownTimeoutId: number;
      let trackPointerUpTimeoutId: number;
      const track = trackRef.current!;

      const handlePointerDown = composeEventHandlers(
        onPointerDown as any,
        function handlePointerDown(event: PointerEvent) {
          const position = scrollAreaNodes.position;
          const thumb = scrollbarNodes.thumb;

          if (
            !isMainClick(event) ||
            !position ||
            !thumb ||
            // We don't want to stop propogation because we need the scrollbar itself to fire pointer
            // events, but we don't want pointer events on the thumb to trigger events on the track.
            thumb.contains(event.target as HTMLElement)
          ) {
            return;
          }

          const direction = determineScrollDirectionFromTrackClick({
            event,
            axis,
            thumbElement: thumb,
          });

          window.clearTimeout(trackPointerUpTimeoutId!);

          if (trackClickBehavior === 'page') {
            document.addEventListener('pointermove', handlePointerMove);
            document.addEventListener('pointerup', handlePointerUp);
            track.setPointerCapture(event.pointerId);

            // Handle immediate scroll event.
            if (isReducedMotion) {
              // Scroll immediately
              const distance = getPagedScrollDistance({
                direction,
                positionElement: position,
                axis,
              });
              const value = getNewScrollPosition(position, { direction, distance, axis });
              setScrollPosition(position, { axis, value });
            } else {
              // Queue scroll animation
              scrollbarContext.scrollAnimationQueue.enqueue(() => {
                return animate({
                  duration: 200,
                  timing: bezier(0.16, 0, 0.73, 1),
                  draw: getPagedDraw({ positionElement: position, direction, axis }),
                  rafIdRef,
                });
              });
            }

            // After some time 400ms, if the user still has the pointer down we'll start to scroll
            // further to some relative distance near the pointer in relation to the track.
            trackPointerDownTimeoutId = window.setTimeout(() => {
              const pointerPosition = getPointerPosition(event);
              const totalScrollDistance = getLongPagedScrollDistance({
                axis,
                direction,
                pointerPosition,
                positionElement: position,
                trackElement: track,
              });

              // If the initial scroll event already moved us past the point where we need to go
              if (
                (direction === 'start' && totalScrollDistance > 0) ||
                (direction === 'end' && totalScrollDistance < 0)
              ) {
                return;
              }

              if (isReducedMotion) {
                const newPosition = getNewScrollPosition(position, {
                  direction,
                  distance: totalScrollDistance,
                  axis,
                });
                setScrollPosition(position, { axis, value: newPosition });
              } else {
                const durationBasis = Math.round(Math.abs(totalScrollDistance));
                const duration = clamp(durationBasis, [100, 500]);
                scrollbarContext.scrollAnimationQueue.enqueue(() =>
                  animate({
                    duration,
                    timing: (n) => n,
                    draw: getLongPagedDraw({
                      axis,
                      direction,
                      pointerPosition,
                      positionElement: position,
                      trackElement: track,
                    }),
                    rafIdRef,
                  })
                );
              }
              window.clearTimeout(trackPointerDownTimeoutId!);
            }, 400);

            return function () {
              window.clearTimeout(trackPointerDownTimeoutId!);
            };
          } else {
            const pointerPosition = getPointerPosition(event);
            const totalScrollDistance = getLongPagedScrollDistance({
              axis,
              direction,
              pointerPosition,
              positionElement: position,
              trackElement: track,
            });
            const newPosition = getNewScrollPosition(position, {
              direction,
              distance: totalScrollDistance,
              axis,
            });
            setScrollPosition(position, { axis, value: newPosition });
            const thumbPointerDown = new PointerEvent('pointerdown', event);

            // Wait a tick for the DOM measurements to update, then fire event on the thumb to
            // immediately shift to a thumbing state.
            window.requestAnimationFrame(() => {
              thumb.dispatchEvent(thumbPointerDown);
            });
          }
        }
      );

      track.addEventListener('pointerdown', handlePointerDown);
      const rafId = rafIdRef.current;
      return function () {
        window.cancelAnimationFrame(rafId);
        window.clearTimeout(trackPointerDownTimeoutId);
        window.clearTimeout(trackPointerUpTimeoutId);
        track.removeEventListener('pointerdown', handlePointerDown);
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        scrollbarContext.scrollAnimationQueue.stop();
      };

      /**
       * If a mouse pointer leaves the bounds of the track before the track pointer timeout has been
       * executed, we need to clear the timeout as if the pointer was released.
       * @param event
       */
      function handlePointerMove(event: PointerEvent) {
        if (event.pointerType === 'mouse' && pointerIsOutsideElement(event, track)) {
          window.clearTimeout(trackPointerDownTimeoutId);
          document.removeEventListener('pointermove', handlePointerMove);
          scrollbarContext.scrollAnimationQueue.stop();
        }
      }

      function handlePointerUp(event: PointerEvent) {
        track.releasePointerCapture(event.pointerId);
        window.clearTimeout(trackPointerDownTimeoutId);
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        scrollbarContext.scrollAnimationQueue.stop();

        // Rapid clicks on the track will result in janky repeat animation if we stop the queue
        // immediately. Set a short timeout to make sure the user is finished clicking and then stop
        // the queue.
        trackPointerUpTimeoutId = window.setTimeout(() => {
          scrollbarContext.scrollAnimationQueue.stop();
        }, 200);
      }
    }, [
      axis,
      isReducedMotion,
      trackClickBehavior,
      // these should be stable references
      dispatch,
      onPointerDown,
      scrollAreaNodes.position,
      scrollbarContext.scrollAnimationQueue,
      scrollbarNodes.thumb,
    ]);

    return <Comp {...interopDataAttrObj('track')} ref={ref} {...domProps} data-axis={axis} />;
  }
);

/* -------------------------------------------------------------------------------------------------
 * ScrollAreaThumb
 * -----------------------------------------------------------------------------------------------*/

const THUMB_DEFAULT_TAG = 'div';
const THUMB_NAME = 'ScrollArea.Thumb';
type ScrollAreaThumbDOMProps = React.ComponentPropsWithoutRef<typeof THUMB_DEFAULT_TAG>;
type ScrollAreaThumbOwnProps = {};
type ScrollAreaThumbProps = ScrollAreaThumbDOMProps & ScrollAreaThumbOwnProps;

const ScrollAreaThumb = forwardRef<typeof THUMB_DEFAULT_TAG, ScrollAreaThumbProps>(
  function ScrollAreaThumb(props, forwardedRef) {
    const { as: Comp = THUMB_DEFAULT_TAG, onPointerDown: onPointerDownProp, ...domProps } = props;
    const scrollbarContext = useScrollbarContext(THUMB_NAME);
    const axis = scrollbarContext.axis;
    const dispatch = useDispatchContext(THUMB_NAME);
    const scrollAreaNodesRef = useScrollAreaNodes(THUMB_NAME);
    const scrollbarNodesRef = scrollbarContext.scrollbarNodesRef;
    const thumbRef = React.useRef<HTMLDivElement>(null);
    const ref = useComposedRefs(
      thumbRef,
      forwardedRef,
      (node) => (scrollbarContext.scrollbarNodesRef.current.thumb = node)
    );

    const stateContext = useScrollAreaStateContext();
    const onPointerDown = useCallbackRef(onPointerDownProp);

    const pointerInitialStartPointRef = React.useRef<number>(0);
    const pointerStartPointRef = React.useRef<number>(0);
    const thumbInitialData = React.useRef({ size: 0, positionStart: 0 });
    const trackInitialData = React.useRef({ size: 0, positionStart: 0 });

    // Update the thumb's size and position anytime any element in the scroll area tree is resized.
    const mounted = React.useRef(false);
    React.useEffect(() => {
      if (!mounted.current) {
        mounted.current = true;
        return;
      }

      const thumbElement = thumbRef.current;
      const trackElement = scrollbarNodesRef.current.track;
      const positionElement = scrollAreaNodesRef.current.position;
      if (thumbElement && positionElement && trackElement) {
        updateThumbPosition({ thumbElement, trackElement, positionElement, axis });
      }
    }, [
      scrollAreaNodesRef,
      scrollbarNodesRef,
      axis,

      // trigger update when any size changes occur
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ...getValuesFromSizeObjects(stateContext.domSizes),
    ]);

    // We need a stable reference to the track size so that changes don't detach the mousemove
    // listener while the user is moving the thumb.
    const trackSize =
      axis === 'x' ? stateContext.domSizes.trackX.width : stateContext.domSizes.trackY.height;
    const trackSizeRef = React.useRef(trackSize);
    useLayoutEffect(() => {
      trackSizeRef.current = trackSize;
    });

    React.useEffect(() => {
      const thumbElement = thumbRef.current!;
      const trackElement = scrollbarNodesRef.current.track;
      const positionElement = scrollAreaNodesRef.current.position!;
      if (!thumbElement || !trackElement || !positionElement) {
        // TODO:
        throw Error('why no refs 😢');
      }

      const handlePointerDown = composeEventHandlers(
        onPointerDown as any,
        function handlePointerDown(event: PointerEvent) {
          if (!isMainClick(event)) return;

          // const pointerPosition = getPointerPosition(event)[axis];

          const pointerPosition = getPointerPosition(event)[axis];

          // As the user moves the pointer, we want the thumb to stay positioned relative to the
          // pointer position at the time of the initial pointerdown event. We'll store some data in a
          // few refs that the pointermove handler can access to calculate this properly.
          thumbInitialData.current = getLogicalRect(thumbElement, { axis });
          trackInitialData.current = getLogicalRect(trackElement, { axis });

          pointerStartPointRef.current = pointerPosition;
          pointerInitialStartPointRef.current = pointerPosition;

          thumbElement.setPointerCapture(event.pointerId);
          document.addEventListener('pointerup', handlePointerUp);
          document.addEventListener('pointermove', handlePointerMove);
        }
      );

      thumbElement.addEventListener('pointerdown', handlePointerDown);
      return function () {
        thumbElement.removeEventListener('pointerdown', handlePointerDown);
        stopThumbing();
      };

      function stopThumbing() {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      }

      function handlePointerMove(event: PointerEvent) {
        const pointerPosition = getPointerPosition(event)[axis];
        const delta = pointerPosition - pointerStartPointRef.current;
        const trackSize = trackSizeRef.current;

        if (canScroll(positionElement, { axis, delta })) {
          // Offset by the distance between the initial pointer's distance from the initial
          // position of the thumb
          const { positionStart: trackPosition } = trackInitialData.current;
          const { positionStart: thumbInitialPosition } = thumbInitialData.current;
          const pointerOffset = pointerInitialStartPointRef.current - thumbInitialPosition;

          const pointerPositionRelativeToTrack = Math.round(pointerPosition - trackPosition);
          const viewportRatioFromPointer =
            Math.round(((pointerPositionRelativeToTrack - pointerOffset) / trackSize) * 100) / 100;
          const scrollSize = getScrollSize(positionElement, { axis });
          const value = viewportRatioFromPointer * scrollSize;
          setScrollPosition(positionElement, { axis, value });

          // Reset the pointer start point for the next pointer movement
          pointerStartPointRef.current = pointerPosition;
        }
      }

      function handlePointerUp(event: PointerEvent) {
        thumbElement.releasePointerCapture(event.pointerId);
        stopThumbing();
      }
    }, [
      axis,
      // these should be stable references
      onPointerDown,
      dispatch,
      scrollAreaNodesRef,
      scrollbarNodesRef,
    ]);

    const [thumbStyles, setThumbStyles] = React.useState<React.CSSProperties>({});

    React.useEffect(() => {
      const positionElement = scrollAreaNodesRef.current.position;
      const trackElement = scrollbarNodesRef.current.track;
      const thumbStyles = getThumbStyles({ positionElement, trackElement, axis });
      setThumbStyles(thumbStyles);
    }, [
      axis,
      scrollAreaNodesRef,
      scrollbarNodesRef,
      // trigger update when any size changes occur
      stateContext.domSizes.trackX,
      stateContext.domSizes.trackY,
    ]);

    return (
      <Comp
        {...interopDataAttrObj('thumb')}
        ref={ref}
        {...domProps}
        data-axis={axis}
        style={{ ...domProps.style, ...thumbStyles }}
      />
    );
  }
);

/* -------------------------------------------------------------------------------------------------
 * ScrollAreaButtonStart / ScrollAreaButtonEnd
 * -----------------------------------------------------------------------------------------------*/

const BUTTON_DEFAULT_TAG = 'div';
const BUTTON_START_NAME = 'ScrollArea.ButtonStart';
const BUTTON_END_NAME = 'ScrollArea.ButtonEnd';
type ScrollAreaButtonDOMProps = React.ComponentPropsWithoutRef<typeof BUTTON_DEFAULT_TAG>;
type ScrollAreaButtonOwnProps = {};
type ScrollAreaButtonProps = ScrollAreaButtonDOMProps & ScrollAreaButtonOwnProps;
type ScrollAreaButtonStartProps = ScrollAreaButtonProps;
type ScrollAreaButtonEndProps = ScrollAreaButtonProps;

// For directional scroll buttons, we emulate native Windows behavior as closely as possible. There,
// when a user presses a scroll button, the browser triggers 9 separate scroll events in ~16
// millisecond intervals, moving scrollTop by a short value with each scroll event. This array
// represents the differences between the element's scrollTop value at each of these intervals. I
// will likely rethink this approach tactically as it gets much more complicated for track clicks.
// We are concerned more about the bezier curve effect this creates vs. the actual values.
const BUTTON_SCROLL_TIME = 135;

type ScrollAreaButtonInternalProps = ScrollAreaButtonStartProps & {
  direction: LogicalDirection;
  name: string;
};

const ScrollAreaButton = forwardRef<typeof BUTTON_DEFAULT_TAG, ScrollAreaButtonInternalProps>(
  function ScrollAreaButton(props, forwardedRef) {
    const {
      as: Comp = BUTTON_DEFAULT_TAG,
      direction,
      name,
      onPointerDown: onPointerDownProp,
      ...domProps
    } = props;
    const { axis, scrollAnimationQueue } = useScrollbarContext(name);
    const dispatch = useDispatchContext(name);
    const { isReducedMotion } = useScrollAreaContext(name);
    const scrollAreaNodesRef = useScrollAreaNodes(name);
    const scrollAreaNodes = scrollAreaNodesRef.current;
    const buttonRef = React.useRef<HTMLDivElement>(null);
    const ref = useComposedRefs(buttonRef, forwardedRef);
    const rafIdRef = React.useRef<number>();
    const onPointerDown = useCallbackRef(onPointerDownProp);

    React.useEffect(() => {
      const buttonElement = buttonRef.current!;
      const positionElement = scrollAreaNodes.position;
      if (!buttonElement || !positionElement) {
        // TODO:
        throw Error('arrrrg ref feed me');
      }

      let buttonPointerDownTimeoutId: number;

      let buttonIntervalId: number = null!;
      const handlePointerDown = composeEventHandlers(
        onPointerDown as any,
        function handlePointerDown(event: PointerEvent) {
          if (!isMainClick(event)) return;

          buttonElement.setPointerCapture(event.pointerId);
          document.addEventListener('pointerup', handlePointerUp);
          document.addEventListener('pointermove', handlePointerMove);

          const delta = direction === 'start' ? -1 : 1;
          if (isReducedMotion) {
            scrollBy(positionElement, { axis, value: 51 * delta });
          } else {
            if (
              canScroll(positionElement, { axis, delta }) //  &&
              // Only queue new animation if the queue's state isn't already adding to the queue or
              // pending a current animation. The prevents fast button clicks from creating an effect
              // where the last queued animation stops too long after the user has stopped clicking.
              // !scrollAnimationQueue.isBusy
            ) {
              scrollAnimationQueue.enqueue(() =>
                animate({
                  duration: BUTTON_SCROLL_TIME,
                  timing: bezier(0.16, 0, 0.73, 1),
                  draw(progress) {
                    scrollBy(positionElement, { axis, value: progress * 15 * delta });
                  },
                  rafIdRef,
                })
              );
            }
          }

          // Handle case for user holding down the button, in which case we will repeat the
          // `scrollAfterButtonPress` call on a ~300 ms interval until they release the pointer.
          // Scrolling will also need to pause if the pointer leaves the button, but it should resume
          // should they mouse back over it before releasing the pointer. After some time (~400ms?),
          // if the user still has the pointer down we'll start to scroll further to some relative
          // distance near the pointer in relation to the track.
          buttonPointerDownTimeoutId = window.setTimeout(() => {
            if (isReducedMotion) {
              buttonIntervalId = window.setInterval(() => {
                if (canScroll(positionElement, { axis, delta })) {
                  scrollBy(positionElement, { axis, value: 60 * delta });
                } else {
                  window.clearInterval(buttonIntervalId);
                }
              }, BUTTON_SCROLL_TIME);
            } else {
              const pointerId = event.pointerId;
              (function keepScrolling() {
                if (canScroll(positionElement, { axis, delta })) {
                  scrollAnimationQueue.enqueue(() =>
                    animate({
                      duration: BUTTON_SCROLL_TIME,
                      timing: (n) => n,
                      draw(progress) {
                        scrollBy(positionElement, { axis, value: progress * (15 * delta) });
                      },
                      done: buttonElement.hasPointerCapture(pointerId) ? keepScrolling : undefined,
                      rafIdRef,
                    })
                  );
                }
              })();
            }
            window.clearTimeout(buttonPointerDownTimeoutId!);
          }, 400);
        }
      );

      buttonElement.addEventListener('pointerdown', handlePointerDown);

      return function () {
        buttonElement.removeEventListener('pointerdown', handlePointerDown);
        document.removeEventListener('pointerup', handlePointerUp);
        document.removeEventListener('pointermove', handlePointerMove);
        window.clearTimeout(buttonPointerDownTimeoutId!);
        window.clearInterval(buttonIntervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        window.cancelAnimationFrame(rafIdRef.current!);
      };

      /**
       * If a mouse pointer leaves the bounds of the button before the track pointer timeout has been
       * executed, we need to clear the timeout as if the pointer was released.
       * @param event
       */
      function handlePointerMove(event: PointerEvent) {
        if (event.pointerType === 'mouse' && pointerIsOutsideElement(event, buttonElement)) {
          window.clearTimeout(buttonPointerDownTimeoutId!);
          document.removeEventListener('pointermove', handlePointerMove);
        }
      }

      function handlePointerUp(event: PointerEvent) {
        window.clearTimeout(buttonPointerDownTimeoutId!);
        window.clearInterval(buttonIntervalId);
        buttonElement.releasePointerCapture(event.pointerId);
        buttonElement.removeEventListener('pointerup', handlePointerUp);
      }
    }, [
      axis,
      direction,
      isReducedMotion,
      // these should be stable references
      dispatch,
      onPointerDown,
      scrollAnimationQueue,
      scrollAreaNodes.position,
    ]);

    return <Comp {...domProps} ref={ref} data-axis={axis} />;
  }
);

const ScrollAreaButtonStart = forwardRef<typeof BUTTON_DEFAULT_TAG, ScrollAreaButtonStartProps>(
  function ScrollAreaButtonStart(props, forwardedRef) {
    return (
      <ScrollAreaButton
        {...props}
        name={BUTTON_START_NAME}
        direction="start"
        {...interopDataAttrObj('buttonStart')}
        ref={forwardedRef}
      />
    );
  }
);

const ScrollAreaButtonEnd = forwardRef<typeof BUTTON_DEFAULT_TAG, ScrollAreaButtonEndProps>(
  function ScrollAreaButtonEnd(props, forwardedRef) {
    return (
      <ScrollAreaButton
        {...props}
        name={BUTTON_END_NAME}
        direction="end"
        {...interopDataAttrObj('buttonEnd')}
        ref={forwardedRef}
      />
    );
  }
);

/* -------------------------------------------------------------------------------------------------
 * ScrollAreaCorner
 * -----------------------------------------------------------------------------------------------*/

const CORNER_DEFAULT_TAG = 'div';
const CORNER_NAME = 'ScrollArea.Corner';
type ScrollAreaCornerDOMProps = React.ComponentPropsWithoutRef<typeof CORNER_DEFAULT_TAG>;
type ScrollAreaCornerOwnProps = {};
type ScrollAreaCornerProps = ScrollAreaCornerDOMProps & ScrollAreaCornerOwnProps;

const ScrollAreaCornerImpl = forwardRef<typeof CORNER_DEFAULT_TAG, ScrollAreaCornerProps>(
  function ScrollAreaCornerImpl(props, forwardedRef) {
    const { as: Comp = CORNER_DEFAULT_TAG, ...domProps } = props;
    const scrollAreaNodesRef = useScrollAreaNodes(CORNER_NAME);
    const scrollAreaNodes = scrollAreaNodesRef.current;
    const dispatch = useDispatchContext(CORNER_NAME);
    const { dir } = useScrollAreaContext(CORNER_NAME);
    const isRTL = dir === 'rtl';

    /**
     * The corner element is placed, by default, in the bottom right corner of the scroll area. In
     * RTL writing mode it should be placed on the bottom left. Its cursor depends on the direction
     * in which the user is able to resize the container.
     *
     * We rely on computed styles because the `resize` prop value can be `initial` or `inherit`
     * which doesn't give us the direct information we need to derive the correct style for the
     * cursor.
     */
    React.useEffect(() => {
      if (scrollAreaNodes.position) {
        const computedStyles = window.getComputedStyle(scrollAreaNodes.position);
        dispatch({
          type: ScrollAreaEvents.SetExplicitResize,
          value: computedStyles.resize as ResizeBehavior,
        });
      }
    }, [scrollAreaNodes.position, dispatch]);

    return (
      <Comp
        {...interopDataAttrObj('corner')}
        ref={forwardedRef}
        {...domProps}
        style={{
          ...domProps.style,
          // The resize handle is placed, by default, in the bottom right corner of the scroll area. In
          // RTL writing mode it should be placed on the bottom left. Vertical reading modes have no
          // impact on handle placement.
          left: isRTL ? 0 : 'unset',
          right: isRTL ? 'unset' : 0,
        }}
      />
    );
  }
);

const ScrollAreaCorner = memo(
  forwardRef<typeof CORNER_DEFAULT_TAG, ScrollAreaCornerProps>(function ScrollAreaCorner(
    props,
    forwardedRef
  ) {
    return useNativeScrollArea() ? null : <ScrollAreaCornerImpl ref={forwardedRef} {...props} />;
  })
);

/* ------------------------------------------------------------------------------------------------*/

interface ScrollAreaStaticProps {
  Viewport: typeof ScrollAreaViewport;
  ScrollbarX: typeof ScrollAreaScrollbarX;
  ScrollbarY: typeof ScrollAreaScrollbarY;
  Track: typeof ScrollAreaTrack;
  Thumb: typeof ScrollAreaThumb;
  ButtonStart: typeof ScrollAreaButtonStart;
  ButtonEnd: typeof ScrollAreaButtonEnd;
  Corner: typeof ScrollAreaCorner;
}

ScrollArea.Viewport = ScrollAreaViewport;
ScrollArea.ScrollbarX = ScrollAreaScrollbarX;
ScrollArea.ScrollbarY = ScrollAreaScrollbarY;
ScrollArea.Track = ScrollAreaTrack;
ScrollArea.Thumb = ScrollAreaThumb;
ScrollArea.ButtonStart = ScrollAreaButtonStart;
ScrollArea.ButtonEnd = ScrollAreaButtonEnd;
ScrollArea.Corner = ScrollAreaCorner;

ScrollArea.Viewport.displayName = VIEWPORT_NAME;
ScrollArea.ScrollbarX.displayName = SCROLLBAR_X_NAME;
ScrollArea.ScrollbarY.displayName = SCROLLBAR_Y_NAME;
ScrollArea.Track.displayName = TRACK_NAME;
ScrollArea.Thumb.displayName = THUMB_NAME;
ScrollArea.ButtonStart.displayName = BUTTON_START_NAME;
ScrollArea.ButtonEnd.displayName = BUTTON_END_NAME;
ScrollArea.Corner.displayName = CORNER_NAME;

const commonScrollbarStyles = {
  zIndex: 2,
  position: 'absolute',
  display: 'flex',
  userSelect: 'none',
} as const;

const commonButtonStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexGrow: 0,
  flexShrink: 0,
  flexBasis: 'auto',
} as const;

const [styles, interopDataAttrObj] = createStyleObj(ROOT_NAME, {
  root: {
    ...cssReset(ROOT_DEFAULT_TAG),
    position: 'relative',
    // Root z-index set to 0 so we can set a new baseline for its children Apps may need to override
    // this if they have higher z-indices that conflict with their scrollbars, but they should not
    // need to change the z-indices for other elements in the tree. We'll want to document this
    // well!
    zIndex: 0,
    display: 'flex',
    maxWidth: '100%',
    maxHeight: '100%',
    '&[data-dragging], &[data-scrolling]': {
      pointerEvents: 'auto !important',
    },
    '& [data-interop-scroll-area-position]::-webkit-scrollbar': {
      display: 'none',
    },
  },
  viewport: {
    ...cssReset(VIEWPORT_DEFAULT_TAG),
    zIndex: 1,
    position: 'relative',
    flexShrink: 0,

    '&[data-dragging], &[data-scrolling]': {
      // Remove pointer events from the content area while dragging or scrolling
      pointerEvents: 'none !important',
    },
  },
  scrollbarX: {
    ...cssReset(SCROLLBAR_DEFAULT_TAG),
    ...commonScrollbarStyles,
    height: `16px`,
    left: 0,
    bottom: 0,
    right: `var(${CSS_PROPS.cornerWidth}, 0)`,
    flexDirection: 'row',
  },
  scrollbarY: {
    ...cssReset(SCROLLBAR_DEFAULT_TAG),
    ...commonScrollbarStyles,
    width: '16px',
    right: 0,
    top: 0,
    bottom: `var(${CSS_PROPS.cornerHeight}, 0)`,
    flexDirection: 'column',
  },
  track: {
    ...cssReset(TRACK_DEFAULT_TAG),
    zIndex: -1,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  thumb: {
    ...cssReset(THUMB_DEFAULT_TAG),
    position: 'absolute',
    top: '0',
    left: '0',
    userSelect: 'none',
    willChange: `var(${CSS_PROPS.scrollbarThumbWillChange})`,
    height: `var(${CSS_PROPS.scrollbarThumbHeight})`,
    width: `var(${CSS_PROPS.scrollbarThumbWidth})`,
  },
  buttonStart: {
    ...cssReset(BUTTON_DEFAULT_TAG),
    ...commonButtonStyles,
  },
  buttonEnd: {
    ...cssReset(BUTTON_DEFAULT_TAG),
    ...commonButtonStyles,
  },
  corner: {
    ...cssReset(CORNER_DEFAULT_TAG),
    userSelect: 'none',
    zIndex: 2,
    position: 'absolute',
    bottom: '0',
    right: `var(${CSS_PROPS.cornerRight})`,
    left: `var(${CSS_PROPS.cornerLeft})`,
    width: `var(${CSS_PROPS.cornerWidth})`,
    height: `var(${CSS_PROPS.cornerHeight})`,
  },
});

export { ScrollArea, styles };
export type {
  ScrollAreaProps,
  ScrollAreaViewportProps,
  ScrollAreaScrollbarXProps,
  ScrollAreaScrollbarYProps,
  ScrollAreaButtonStartProps,
  ScrollAreaButtonEndProps,
  ScrollAreaTrackProps,
  ScrollAreaThumbProps,
};

/* ---------------------------------------------------------------------------------------------- */

function getThumbStyles(args: {
  trackElement: HTMLElement | null | undefined;
  positionElement: HTMLElement | null | undefined;
  axis: Axis;
}): React.CSSProperties {
  const { trackElement, positionElement, axis } = args;
  if (!trackElement || !positionElement) {
    return {};
  }

  const visibleRatio = getVisibleToTotalRatio(positionElement, { axis });
  const trackSize = getClientSize(trackElement, { axis });
  const thumbSize = visibleRatio * trackSize;

  if (!shouldOverflow(positionElement, { axis })) {
    // We're at 100% visible area, no need to show the scroll thumb:
    return {
      display: 'none',
      width: 0,
      height: 0,
    };
  }
  return {
    [axis === 'x' ? 'width' : 'height']: thumbSize,
  };
}

function updateThumbPosition(args: {
  thumbElement: HTMLElement;
  trackElement: HTMLElement;
  positionElement: HTMLElement;
  axis: Axis;
}) {
  const { thumbElement, positionElement, axis } = args;

  const totalScrollSize = getScrollSize(positionElement, { axis });

  const visibleSize = getClientSize(positionElement, { axis });
  const scrollPos = getScrollPosition(positionElement, { axis });
  const visibleToTotalRatio = visibleSize / totalScrollSize;
  const thumbPos = scrollPos / totalScrollSize;

  if (visibleToTotalRatio >= 1) {
    // We're at 100% visible area, the scroll thumb is invisible so we don't need to do anything:
  } else if (axis === 'x') {
    thumbElement.style.left = `${thumbPos * 100}%`;
  } else if (axis === 'y') {
    thumbElement.style.top = `${thumbPos * 100}%`;
  }
}

function isContentOverflowing(totalScrollSize: number, visibleSize: number) {
  return visibleSize / totalScrollSize < 1;
}

function getThumbPosition(totalScrollSize: number, visibleSize: number, scrollPos: number) {
  const thumbPos = scrollPos / totalScrollSize;
  if (isContentOverflowing(totalScrollSize, visibleSize)) {
    return `${thumbPos * 100}%`;
  }
}

function getValuesFromSizeObjects(obj: Record<string, Size>) {
  const sizes: number[] = [];
  for (const k of Object.keys(obj)) {
    const o = obj[k];
    sizes.push(o.height, o.width);
  }
  return sizes;
}

// TODO: Currently parcel does not recognize global types in our type root directories. Patching
// here until we can address it properly. Move these back to types/index.d.ts
interface ResizeObserverSize {
  readonly inlineSize: number;
  readonly blockSize: number;
}

interface ResizeObserverEntry {
  readonly target: Element;
  readonly contentRect: DOMRectReadOnly;
  readonly borderBoxSize: ResizeObserverSize[] | ResizeObserverSize;
  readonly contentBoxSize: ResizeObserverSize[] | ResizeObserverSize;
  readonly devicePixelContentBoxSize: ResizeObserverSize[];
}

declare class ResizeObserver {
  constructor(callback: ResizeObserverCallback);
  observe: (target: Element, options?: ResizeObserverOptions) => void;
  unobserve: (target: Element) => void;
  disconnect: () => void;
}

type ResizeObserverBoxOptions = 'border-box' | 'content-box' | 'device-pixel-content-box';

interface ResizeObserverOptions {
  box?: ResizeObserverBoxOptions;
}

type ResizeObserverCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;
