import * as React from 'react';
import { css } from '../../../../stitches.config';
import {
  ScrollArea,
  ScrollAreaViewport,
  ScrollAreaButtonEnd,
  ScrollAreaButtonStart,
  ScrollAreaScrollbarX,
  ScrollAreaScrollbarY,
  ScrollAreaCorner,
  ScrollAreaTrack,
  ScrollAreaThumb,
  unstable_ScrollAreaNoNativeFallback as ScrollAreaNoNativeFallback,
  SCROLL_AREA_CSS_PROPS,
} from './ScrollArea';
import { Popover, PopoverContent, PopoverTrigger, PopoverArrow } from '@radix-ui/react-popover';

export default {
  title: 'Components/ScrollArea',
  decorators: [
    (Story: any) => (
      <ScrollPropControlProvider>
        <Story />
      </ScrollPropControlProvider>
    ),
  ],
};

export function Basic() {
  return (
    <React.Fragment>
      <ScrollPropControls />
      <hr />
      <Resizable>
        <ScrollArea
          className={win98RootClass}
          overflowX="scroll"
          {...useScrollAreaControlProps()}
          style={{ width: '400px', height: '400px' }}
        >
          <ScrollAreaScrollbarY className={win98ScrollbarYClass}>
            <ScrollAreaButtonStart className={win98ScrollButtonClass}>
              <Arrow direction="up" />
            </ScrollAreaButtonStart>

            <ScrollAreaTrack className={win98ScrollTrackClass}>
              <ScrollAreaThumb className={win98ScrollThumbClass} />
            </ScrollAreaTrack>
            <ScrollAreaButtonEnd className={win98ScrollButtonClass}>
              <Arrow direction="down" />
            </ScrollAreaButtonEnd>
          </ScrollAreaScrollbarY>

          <ScrollAreaScrollbarX className={win98ScrollbarXClass}>
            <ScrollAreaButtonStart className={win98ScrollButtonClass}>
              <Arrow direction="left" />
            </ScrollAreaButtonStart>

            <ScrollAreaTrack className={win98ScrollTrackClass}>
              <ScrollAreaThumb className={win98ScrollThumbClass} />
            </ScrollAreaTrack>
            <ScrollAreaButtonEnd className={win98ScrollButtonClass}>
              <Arrow direction="right" />
            </ScrollAreaButtonEnd>
          </ScrollAreaScrollbarX>

          <ScrollAreaCorner className={win98CornerClass} />

          <ScrollAreaViewport
            className={baseViewportClass}
            style={{ width: '2000px', padding: 20 }}
          >
            <LongContent />
            <LongContent />
            <LongContent />
            <LongContent />
            <LongContent />
            <LongContent />
            <LongContent />
          </ScrollAreaViewport>
        </ScrollArea>
        <button className={testButtonClass} onClick={() => alert('whoa')}>
          Test for pointer events
        </button>
      </Resizable>
    </React.Fragment>
  );
}

export function FillWidth() {
  return (
    <React.Fragment>
      <ScrollPropControls />
      <hr />
      <Resizable>
        <ScrollArea
          className={win98RootClass}
          {...useScrollAreaControlProps()}
          style={{ width: '400px', height: '400px' }}
        >
          <ScrollAreaScrollbarY className={win98ScrollbarYClass}>
            <ScrollAreaButtonStart className={win98ScrollButtonClass}>
              <Arrow direction="up" />
            </ScrollAreaButtonStart>

            <ScrollAreaTrack className={win98ScrollTrackClass}>
              <ScrollAreaThumb className={win98ScrollThumbClass} />
            </ScrollAreaTrack>
            <ScrollAreaButtonEnd className={win98ScrollButtonClass}>
              <Arrow direction="down" />
            </ScrollAreaButtonEnd>
          </ScrollAreaScrollbarY>

          <ScrollAreaScrollbarX className={win98ScrollbarXClass}>
            <ScrollAreaButtonStart className={win98ScrollButtonClass}>
              <Arrow direction="left" />
            </ScrollAreaButtonStart>

            <ScrollAreaTrack className={win98ScrollTrackClass}>
              <ScrollAreaThumb className={win98ScrollThumbClass} />
            </ScrollAreaTrack>
            <ScrollAreaButtonEnd className={win98ScrollButtonClass}>
              <Arrow direction="right" />
            </ScrollAreaButtonEnd>
          </ScrollAreaScrollbarX>
          <ScrollAreaCorner className={win98CornerClass} />
          <ScrollAreaViewport className={baseViewportClass}>
            <div
              style={{
                height: 1000,
                backgroundImage:
                  'repeating-linear-gradient(0deg, dodgerblue, dodgerblue 10px, transparent 10px, transparent 20px)',
              }}
            />
          </ScrollAreaViewport>
        </ScrollArea>
      </Resizable>
    </React.Fragment>
  );
}

export function InsidePopover() {
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      <ScrollPropControls />
      <hr />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger as="button">{open ? 'close' : 'open'}</PopoverTrigger>
        <PopoverContent
          style={{
            ...RECOMMENDED_CSS__POPOVER__CONTENT,
            backgroundColor: '#eee',
            width: 250,
            height: 150,
          }}
        >
          <ScrollArea overflowX="scroll" {...useScrollAreaControlProps()} className={baseRootClass}>
            <ScrollAreaScrollbarY className={macOsScrollbarYClass} style={{ bottom: 0 }}>
              <ScrollAreaTrack className={macOsScrollTrackClass}>
                <ScrollAreaThumb className={macOsScrollThumbYClass}>
                  <div className={macOsScrollThumbInnerClass} />
                </ScrollAreaThumb>
              </ScrollAreaTrack>
            </ScrollAreaScrollbarY>

            <ScrollAreaViewport className={baseViewportClass} style={{ padding: 10 }}>
              <p>
                Lacinia hendrerit auctor nam quisque augue suscipit feugiat, sit at imperdiet vitae
                lacus. Dolor sit dui posuere faucibus non pharetra laoreet conubia, augue rhoncus
                cras nisl sodales proin hac ipsum, per hendrerit sed volutpat natoque curae
                consectetur. Curae blandit neque vehicula vel mauris vulputate per felis sociosqu,
                sodales integer sollicitudin id litora accumsan viverra pulvinar, mus non adipiscing
                dolor facilisis habitasse mi leo. Litora faucibus eu pulvinar tempus gravida iaculis
                consectetur risus euismod fringilla, dui posuere viverra sapien tortor mattis et
                dolor tempor sem conubia, taciti sociis mus rhoncus cubilia praesent dapibus aliquet
                quis. Diam hendrerit aliquam metus dolor fusce lorem, non gravida arcu primis
                posuere ipsum adipiscing, mus sollicitudin eros lacinia mollis.
              </p>
            </ScrollAreaViewport>
          </ScrollArea>
          <PopoverArrow width={50} height={20} />
        </PopoverContent>
      </Popover>
    </React.Fragment>
  );
}

// We'll likely remove this eventually
// See https://github.com/radix-ui/primitives/issues/351
export function WithoutNativeFallback() {
  const { unstable_forceNative, ...scrollAreaControlProps } = useScrollAreaControlProps();
  const divRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const div = divRef.current;
    function handleMouseEnter() {
      console.log('Hello, you have entered the div zone!');
    }
    div?.addEventListener('mouseenter', handleMouseEnter);
    return () => {
      div?.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);
  return (
    <React.Fragment>
      <ScrollPropControls disableForceNative />
      <hr />
      <Resizable>
        <ScrollAreaNoNativeFallback
          className={win98RootClass}
          overflowX="scroll"
          {...scrollAreaControlProps}
          style={{ width: '400px', height: '400px' }}
        >
          <ScrollAreaScrollbarY className={win98ScrollbarYClass}>
            <ScrollAreaButtonStart className={win98ScrollButtonClass}>
              <Arrow direction="up" />
            </ScrollAreaButtonStart>

            <ScrollAreaTrack className={win98ScrollTrackClass}>
              <ScrollAreaThumb className={win98ScrollThumbClass} />
            </ScrollAreaTrack>
            <ScrollAreaButtonEnd className={win98ScrollButtonClass}>
              <Arrow direction="down" />
            </ScrollAreaButtonEnd>
          </ScrollAreaScrollbarY>

          <ScrollAreaScrollbarX className={win98ScrollbarXClass}>
            <ScrollAreaButtonStart className={win98ScrollButtonClass}>
              <Arrow direction="left" />
            </ScrollAreaButtonStart>

            <ScrollAreaTrack className={win98ScrollTrackClass}>
              <ScrollAreaThumb className={win98ScrollThumbClass} />
            </ScrollAreaTrack>
            <ScrollAreaButtonEnd className={win98ScrollButtonClass}>
              <Arrow direction="right" />
            </ScrollAreaButtonEnd>
          </ScrollAreaScrollbarX>

          <ScrollAreaCorner className={win98CornerClass} />

          <ScrollAreaViewport
            className={baseViewportClass}
            style={{ width: '1000px', padding: 20 }}
          >
            <div ref={divRef} style={{ padding: '10px', border: '1px solid crimson' }}>
              Mouse over me and check your logs!
            </div>
            <LongContent />
            <LongContent />
            <LongContent />
          </ScrollAreaViewport>
        </ScrollAreaNoNativeFallback>
      </Resizable>
    </React.Fragment>
  );
}

export const Chromatic = () => (
  <>
    <h1>Styling</h1>
    <Resizable>
      <ScrollArea
        className={rootAttrClass}
        overflowX="scroll"
        scrollbarVisibility="always"
        style={{ width: '400px', height: '400px' }}
      >
        <ScrollAreaScrollbarY className={scrollbarYAttrClass}>
          <ScrollAreaButtonStart className={buttonStartAttrClass}>
            <Arrow direction="up" />
          </ScrollAreaButtonStart>
          <ScrollAreaTrack className={trackAttrClass}>
            <ScrollAreaThumb className={thumbAttrClass} />
          </ScrollAreaTrack>
          <ScrollAreaButtonEnd className={buttonEndAttrClass}>
            <Arrow direction="down" />
          </ScrollAreaButtonEnd>
        </ScrollAreaScrollbarY>

        <ScrollAreaScrollbarX className={scrollbarXAttrClass}>
          <ScrollAreaButtonStart className={buttonStartAttrClass}>
            <Arrow direction="left" />
          </ScrollAreaButtonStart>
          <ScrollAreaTrack className={trackAttrClass}>
            <ScrollAreaThumb className={thumbAttrClass} />
          </ScrollAreaTrack>
          <ScrollAreaButtonEnd className={buttonEndAttrClass}>
            <Arrow direction="right" />
          </ScrollAreaButtonEnd>
        </ScrollAreaScrollbarX>

        <ScrollAreaCorner className={cornerAttrClass} />

        <ScrollAreaViewport className={viewportAttrClass} style={{ width: '2000px', padding: 20 }}>
          <LongContent />
          <LongContent />
          <LongContent />
          <LongContent />
          <LongContent />
          <LongContent />
          <LongContent />
        </ScrollAreaViewport>
      </ScrollArea>
    </Resizable>
  </>
);
Chromatic.parameters = { chromatic: { disable: false } };

/* -------------------------------------------------------------------------------------------------
 * Reset components
 * -----------------------------------------------------------------------------------------------*/

const RECOMMENDED_CSS__POPOVER__CONTENT: any = {
  boxSizing: 'border-box',
  transformOrigin: 'var(--radix-popover-content-transform-origin)',
};

const RECOMMENDED_CSS__SCROLL_AREA__ROOT: any = {
  boxSizing: 'border-box',
  position: 'relative',
  // Root z-index set to 0 so we can set a new baseline for its children Apps may need to override
  // this if they have higher z-indices that conflict with their scrollbars, but they should not
  // need to change the z-indices for other elements in the tree. We'll want to document this
  // well!
  zIndex: 0,
  maxWidth: '100%',
  maxHeight: '100%',
  '& [data-radix-scroll-area-viewport-position]::-webkit-scrollbar': {
    display: 'none',
  },
};

const RECOMMENDED_CSS__SCROLL_AREA__VIEWPORT: any = {
  boxSizing: 'border-box',
  zIndex: 1,
  position: 'relative',

  '&[data-dragging], &[data-scrolling]': {
    // Remove pointer events from the content area while dragging or scrolling
    pointerEvents: 'none !important',
  },
};

const RECOMMENDED_CSS__SCROLL_AREA__SCROLLBAR: any = {
  boxSizing: 'border-box',
  zIndex: 2,
  position: 'absolute',
  display: 'flex',
  userSelect: 'none',
};
const RECOMMENDED_CSS__SCROLL_AREA__SCROLLBAR_X: any = {
  ...RECOMMENDED_CSS__SCROLL_AREA__SCROLLBAR,
  // Height is arbitrary here, but a fixed height is recommended
  height: `16px`,
  left: 0,
  bottom: 0,
  right: `var(${SCROLL_AREA_CSS_PROPS.scrollbarXSize}, 0)`,
  flexDirection: 'row',
};
const RECOMMENDED_CSS__SCROLL_AREA__SCROLLBAR_Y: any = {
  ...RECOMMENDED_CSS__SCROLL_AREA__SCROLLBAR,
  // Width is arbitrary here, but a fixed height is recommended
  width: '16px',
  right: 0,
  top: 0,
  bottom: `var(${SCROLL_AREA_CSS_PROPS.scrollbarYSize}, 0)`,
  flexDirection: 'column',
};
const RECOMMENDED_CSS__SCROLL_AREA__TRACK: any = {
  boxSizing: 'border-box',
  zIndex: -1,
  position: 'relative',
  width: '100%',
  height: '100%',
};
const RECOMMENDED_CSS__SCROLL_AREA__THUMB: any = {
  boxSizing: 'border-box',
  position: 'absolute',
  top: '0',
  left: '0',
  userSelect: 'none',
  willChange: `var(${SCROLL_AREA_CSS_PROPS.scrollbarThumbWillChange})`,
  height: `var(${SCROLL_AREA_CSS_PROPS.scrollbarThumbHeight})`,
  width: `var(${SCROLL_AREA_CSS_PROPS.scrollbarThumbWidth})`,
};
const RECOMMENDED_CSS__SCROLL_AREA__BUTTON: any = {
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexGrow: 0,
  flexShrink: 0,
  flexBasis: 'auto',
};
const RECOMMENDED_CSS__SCROLL_AREA__CORNER: any = {
  userSelect: 'none',
  zIndex: 2,
  bottom: 0,
  right: `var(${SCROLL_AREA_CSS_PROPS.cornerRight})`,
  left: `var(${SCROLL_AREA_CSS_PROPS.cornerLeft})`,
  width: `var(${SCROLL_AREA_CSS_PROPS.cornerWidth})`,
  height: `var(${SCROLL_AREA_CSS_PROPS.cornerHeight})`,
};

const testButtonClass = css({
  appearance: 'none',
  display: 'block',
  marginTop: '10px',
  '&:hover': {
    background: 'crimson',
    color: '#fff',
  },
});

const baseRootClass = css({
  ...RECOMMENDED_CSS__SCROLL_AREA__ROOT,
  fontFamily: 'sans-serif',
});

const baseViewportClass = css({
  ...RECOMMENDED_CSS__SCROLL_AREA__VIEWPORT,
});

const baseScrollbarClass = css({
  ...RECOMMENDED_CSS__SCROLL_AREA__SCROLLBAR,
  transition: '300ms opacity ease',
});

const baseScrollbarYClass = css(baseScrollbarClass, {
  ...RECOMMENDED_CSS__SCROLL_AREA__SCROLLBAR_Y,
});

const baseScrollbarXClass = css(baseScrollbarClass, {
  ...RECOMMENDED_CSS__SCROLL_AREA__SCROLLBAR_X,
});

const baseScrollButtonClass = css({
  ...RECOMMENDED_CSS__SCROLL_AREA__BUTTON,
});

const baseScrollThumbClass = css({
  ...RECOMMENDED_CSS__SCROLL_AREA__THUMB,
});

const baseScrollTrackClass = css({
  ...RECOMMENDED_CSS__SCROLL_AREA__TRACK,
});

const win98RootClass = css(baseRootClass, {
  ...RECOMMENDED_CSS__SCROLL_AREA__ROOT,
  border: '2px solid #FFF',
  borderTopColor: '#858585',
  borderLeftColor: '#858585',
  borderRightColor: '#C0C0C0',
  borderBottomColor: '#C0C0C0',
});

const win98ScrollbarYClass = css(baseScrollbarYClass, {
  width: `16px`,
});

const win98ScrollbarXClass = css(baseScrollbarXClass, {
  height: `16px`,
});

const macOsScrollbarYClass = css(baseScrollbarYClass, {
  width: `14px`,
});

const win98ScrollButtonClass = css(baseScrollButtonClass, {
  position: 'relative',
  backgroundColor: '#C0C0C0',
  border: '2px solid #FFF',
  borderTopColor: '#FFF',
  borderLeftColor: '#FFF',
  borderRightColor: '#858585',
  borderBottomColor: '#858585',
  width: '16px',
  height: '16px',
  padding: '3px',
});

const win98ScrollThumbClass = css(baseScrollThumbClass, {
  backgroundColor: '#C0C0C0',
  border: '2px solid #FFF',
  borderTopColor: '#FFF',
  borderLeftColor: '#FFF',
  borderRightColor: '#858585',
  borderBottomColor: '#858585',
});

const macOsScrollThumbYClass = css(baseScrollThumbClass, {
  backgroundColor: 'transparent',
  padding: '2px 3px',
});

const macOsScrollThumbInnerClass = css({
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  borderRadius: '999px',
});

const win98ScrollTrackClass = css(baseScrollTrackClass, {
  background: '#DEDEDE',
});

const macOsScrollTrackClass = css(baseScrollTrackClass, {
  background: 'transparent',
});

const win98CornerClass = css({
  ...RECOMMENDED_CSS__SCROLL_AREA__CORNER,
  backgroundColor: '#C0C0C0',
});

const styles = {
  backgroundColor: 'rgba(0, 0, 255, 0.3)',
  border: '2px solid blue',
  padding: 10,
};
const rootAttrClass = css(baseRootClass, {
  ...styles,
  '[data-radix-scroll-area-viewport-position]': { padding: 10, border: '2px solid blue' },
  '[data-radix-scroll-area-viewport-position-inner]': { padding: 10, border: '2px solid blue' },
});
const scrollbarYAttrClass = css(baseScrollbarYClass, styles);
const scrollbarXAttrClass = css(baseScrollbarXClass, styles);
const buttonStartAttrClass = css(baseScrollButtonClass, styles);
const buttonEndAttrClass = css(baseScrollButtonClass, styles);
const trackAttrClass = css(baseScrollTrackClass, styles);
const thumbAttrClass = css(baseScrollThumbClass, styles);
const cornerAttrClass = css({
  ...RECOMMENDED_CSS__SCROLL_AREA__CORNER,
  ...styles,
});
const viewportAttrClass = css({
  ...RECOMMENDED_CSS__SCROLL_AREA__VIEWPORT,
  ...styles,
});

const Arrow = React.forwardRef<SVGSVGElement, any>(function Arrow(
  { direction, ...props },
  forwardedRef
) {
  const transform =
    direction === 'down'
      ? undefined
      : `rotate(${
          direction === 'left'
            ? '90deg'
            : direction === 'right'
            ? '-90deg'
            : direction === 'up'
            ? '180deg'
            : '0'
        })`;

  return (
    <svg
      {...props}
      ref={forwardedRef}
      viewBox="0 0 20 10"
      preserveAspectRatio="none"
      style={{
        ...props.style,
        flexGrow: 1,
        transform,
      }}
    >
      <polygon points="0,0 20,0 10,10" />
    </svg>
  );
});

function LongContent() {
  return (
    <React.Fragment>
      <p>
        Lacinia hendrerit auctor nam quisque augue suscipit feugiat, sit at imperdiet vitae lacus.
        Dolor sit dui posuere faucibus non pharetra laoreet conubia, augue rhoncus cras nisl sodales
        proin hac ipsum, per hendrerit sed volutpat natoque curae consectetur. Curae blandit neque
        vehicula vel mauris vulputate per felis sociosqu, sodales integer sollicitudin id litora
        accumsan viverra pulvinar, mus non adipiscing dolor facilisis habitasse mi leo. Litora
        faucibus eu pulvinar tempus gravida iaculis consectetur risus euismod fringilla, dui posuere
        viverra sapien tortor mattis et dolor tempor sem conubia, taciti sociis mus rhoncus cubilia
        praesent dapibus aliquet quis. Diam hendrerit aliquam metus dolor fusce lorem, non gravida
        arcu primis posuere ipsum adipiscing, mus sollicitudin eros lacinia mollis.
      </p>
      <p>
        Habitant fames mi massa mollis fusce congue nascetur magna bibendum inceptos accumsan,
        potenti ipsum ac sollicitudin taciti dis rhoncus lacinia fermentum placerat. Himenaeos
        taciti egestas lacinia maecenas ornare ultricies, auctor vitae nulla mi posuere leo mollis,
        eleifend lacus rutrum ante curabitur. Nullam mi quisque nulla enim pretium facilisi interdum
        morbi, himenaeos velit fames pellentesque eget nascetur laoreet vel rutrum, malesuada risus
        ad netus dolor et scelerisque.
      </p>
      <ul>
        <li>Dis cubilia aenean tortor iaculis fames duis aliquet</li>
        <li>Erat non lacinia, tempor molestie fringilla</li>
        <li>Porttitor litora praesent placerat pulvinar</li>
        <li>Arcu curabitur fermentum felis sollicitudin varius nec cras</li>
      </ul>
      <p>
        Habitasse tristique hac ligula in metus blandit lobortis leo nullam litora, tempus fusce
        tincidunt phasellus urna est rhoncus pretium etiam eu, fames neque faucibus sociis primis
        felis dui vitae odio. Egestas purus morbi pulvinar luctus adipiscing rutrum ultrices hac,
        vehicula odio ridiculus cubilia vivamus blandit faucibus, dapibus velit sociis metus
        ultricies amet scelerisque.
      </p>
      <p>
        Scelerisque commodo nam cras litora lacinia primis fames morbi natoque, quisque ante duis
        phasellus pharetra convallis montes felis. Consectetur leo suspendisse fringilla elementum
        maecenas massa urna malesuada auctor senectus, pretium turpis nisi orci ipsum vulputate
        cubilia sociis adipiscing. Vulputate ridiculus amet dis accumsan non ultrices fames mattis
        hendrerit, ornare elementum sociosqu eget consectetur duis viverra vivamus tincidunt,
        blandit nulla porta semper dolor pharetra nisi scelerisque. Consequat conubia porta cras et
        ac auctor pellentesque luctus morbi potenti, viverra varius commodo venenatis vestibulum
        erat sagittis laoreet.
      </p>
    </React.Fragment>
  );
}

function CheckedInput({ children, ...props }: React.ComponentProps<'input'>) {
  return (
    <label style={{ display: 'flex', gap: 4, marginTop: '0.25em' }}>
      <input {...props} />
      <span>{children}</span>
    </label>
  );
}

function Checkbox({ ...props }: Omit<React.ComponentProps<'input'>, 'type'>) {
  return <CheckedInput {...props} type="checkbox" />;
}

function Radio({ ...props }: Omit<React.ComponentProps<'input'>, 'type'> & { value: string }) {
  const { name, checked, getChangeHandler } = React.useContext(RadioGroupContext);
  const handleChange = props.onChange || getChangeHandler?.(props.value);
  return (
    <CheckedInput
      name={name}
      checked={checked != null ? checked === props.value : undefined}
      onChange={handleChange}
      {...props}
      type="radio"
    />
  );
}

function RangeInput({ children, ...props }: Omit<React.ComponentProps<'input'>, 'type'>) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span>{children}</span>
      <input {...props} type="range" />
    </label>
  );
}

// Internal stuff

const ScrollPropControlContext = React.createContext<{
  forceNative: boolean;
  setForceNative: React.Dispatch<React.SetStateAction<boolean>>;
  prefersReducedMotion: boolean;
  setPrefersReducedMotion: React.Dispatch<React.SetStateAction<boolean>>;
  scrollbarVisibilityRestTimeout: number;
  setScrollbarVisibilityRestTimeout: React.Dispatch<React.SetStateAction<number>>;
  scrollbarVisibility: ScrollbarVisibility;
  setScrollbarVisibility: React.Dispatch<React.SetStateAction<ScrollbarVisibility>>;
  trackClickBehavior: TrackClickBehavior;
  setTrackClickBehavior: React.Dispatch<React.SetStateAction<TrackClickBehavior>>;
}>({} as any);

const ScrollPropControlProvider: React.FC = ({ children }) => {
  const [forceNative, setForceNative] = React.useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  const [scrollbarVisibilityRestTimeout, setScrollbarVisibilityRestTimeout] = React.useState(600);
  const [scrollbarVisibility, setScrollbarVisibility] = React.useState<ScrollbarVisibility>(
    'hover'
  );
  const [trackClickBehavior, setTrackClickBehavior] = React.useState<TrackClickBehavior>(
    'relative'
  );
  return (
    <ScrollPropControlContext.Provider
      value={{
        forceNative,
        setForceNative,
        prefersReducedMotion,
        setPrefersReducedMotion,
        scrollbarVisibilityRestTimeout,
        setScrollbarVisibilityRestTimeout,
        scrollbarVisibility,
        setScrollbarVisibility,
        trackClickBehavior,
        setTrackClickBehavior,
      }}
    >
      {children}
    </ScrollPropControlContext.Provider>
  );
};

function useScrollAreaControlProps() {
  const {
    forceNative,
    prefersReducedMotion,
    scrollbarVisibilityRestTimeout,
    scrollbarVisibility,
    trackClickBehavior,
  } = React.useContext(ScrollPropControlContext);
  return {
    unstable_forceNative: forceNative,
    unstable_prefersReducedMotion: prefersReducedMotion,
    scrollbarVisibilityRestTimeout,
    scrollbarVisibility,
    trackClickBehavior,
  };
}

function ScrollPropControls({ disableForceNative }: { disableForceNative?: boolean }) {
  const {
    forceNative,
    setForceNative,
    prefersReducedMotion,
    setPrefersReducedMotion,
    scrollbarVisibility,
    setScrollbarVisibility,
    trackClickBehavior,
    setTrackClickBehavior,
    scrollbarVisibilityRestTimeout,
    setScrollbarVisibilityRestTimeout,
  } = React.useContext(ScrollPropControlContext);
  return (
    <div
      style={{
        display: 'flex',
        flexFlow: 'row wrap',
        gap: 8,
        fontFamily: 'sans-serif',
        fontSize: '12px',
      }}
    >
      <Box>
        <Fieldset>
          <Legend>Simulation options:</Legend>
          {!disableForceNative ? (
            <Checkbox
              name="forceNative"
              checked={forceNative}
              onChange={(e) => setForceNative(e.target.checked)}
            >
              Force native scrollbars
            </Checkbox>
          ) : null}
          <Checkbox
            name="prefersReducedMotion"
            checked={prefersReducedMotion}
            onChange={(e) => setPrefersReducedMotion(e.target.checked)}
            disabled={forceNative}
          >
            Simulate preference for reduced motion
          </Checkbox>
        </Fieldset>
      </Box>

      <Box>
        <RadioGroup
          name="scrollbarVisibility"
          checked={scrollbarVisibility}
          onChange={(newValue) => {
            setScrollbarVisibility(newValue as ScrollbarVisibility);
          }}
        >
          <Legend>
            Show scrollbars <Code>scrollbarVisibility</Code>
          </Legend>
          <Radio value="always" disabled={forceNative}>
            Always <Code>"always"</Code>
          </Radio>
          <Radio value="scroll" disabled={forceNative}>
            When scrolling <Code>"scroll"</Code>
          </Radio>
          <Radio value="hover" disabled={forceNative}>
            When scrolling and when the pointer is over the scrollable area <Code>"hover"</Code>
          </Radio>
        </RadioGroup>
      </Box>

      <Box>
        <RadioGroup
          name="trackClickBehavior"
          checked={trackClickBehavior}
          onChange={(newValue) => {
            setTrackClickBehavior(newValue as TrackClickBehavior);
          }}
        >
          <Legend>
            Track click behavior <Code>trackClickBehavior</Code>
          </Legend>
          <Radio value="page" disabled={forceNative}>
            Jump to the next page <Code>"page"</Code>
          </Radio>
          <Radio value="relative" disabled={forceNative}>
            Jump to the spot that's clicked <Code>"relative"</Code>
          </Radio>
        </RadioGroup>
      </Box>

      <Box>
        <RangeInput
          name="scrollbarVisibilityRestTimeout"
          value={scrollbarVisibilityRestTimeout}
          onChange={(e) => {
            setScrollbarVisibilityRestTimeout(Number(e.target.value));
          }}
          min={100}
          max={2000}
          disabled={scrollbarVisibility === 'always'}
        >
          <span style={{ fontWeight: 'bolder' }}>Rest timeout</span>{' '}
          <span style={{ display: 'block' }}>(Min: 100ms, Max: 2000ms)</span>
          <Code>scrollbarVisibilityRestTimeout</Code>
        </RangeInput>
      </Box>
    </div>
  );
}

function Box({ as: Comp = 'div', ...props }: any) {
  return (
    <Comp
      {...props}
      style={{ padding: 16, background: '#eee', flexBasis: 200, flexShrink: 0, ...props.style }}
    />
  );
}

function Resizable({ ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      {...props}
      style={{
        padding: 10,
        border: '1px solid gray',
        resize: 'both',
        overflow: 'auto',
        ...props.style,
      }}
    />
  );
}

const RadioGroupContext = React.createContext<{
  name?: string;
  checked?: string;
  getChangeHandler?(value: string): (event: React.ChangeEvent<HTMLInputElement>) => void;
}>({});

function RadioGroup({
  children,
  name,
  checked,
  onChange,
  ...props
}: Omit<React.ComponentProps<'fieldset'>, 'onChange'> & {
  name: string;
  checked: string;
  onChange(value: string): void;
}) {
  function getChangeHandler(value: string) {
    return function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
      if (event.target.checked) {
        onChange(value);
      }
    };
  }

  return (
    <Fieldset {...props}>
      <RadioGroupContext.Provider value={{ name, checked, getChangeHandler }}>
        {children}
      </RadioGroupContext.Provider>
    </Fieldset>
  );
}

function Fieldset({ ...props }: React.ComponentProps<'fieldset'>) {
  return <fieldset {...props} style={{ padding: 0, margin: 0, border: 0, ...props.style }} />;
}

function Legend({ ...props }: React.ComponentProps<'legend'>) {
  return (
    <legend {...props} style={{ fontWeight: 'bolder', marginBottom: '0.5em', ...props.style }} />
  );
}

function Code({ ...props }: React.ComponentProps<'code'>) {
  return (
    <code
      {...props}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: '#fff',
        border: '1px solid #bbb',
        borderRadius: 3,
        padding: '2px 3px',
        lineHeight: 1,
        ...props.style,
      }}
    />
  );
}

type TrackClickBehavior = 'page' | 'relative';
type ScrollbarVisibility = 'always' | 'scroll' | 'hover';
