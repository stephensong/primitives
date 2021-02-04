import * as React from 'react';
import { Separator } from './Separator';
import { css } from '../../../../stitches.config';

export default { title: 'Components/Separator' };

export const Styled = () => (
  <>
    <h1>Horizontal</h1>
    <p>The following separator is horizontal and has semantic meaning.</p>
    <Separator className={rootClass} orientation="horizontal" />
    <p>
      The following separator is horizontal and is purely decorative. Assistive technology will
      ignore this element.
    </p>
    <Separator className={rootClass} orientation="horizontal" decorative />

    <h1>Vertical</h1>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <p>The following separator is vertical and has semantic meaning.</p>
      <Separator className={rootClass} orientation="vertical" />
      <p>
        The following separator is vertical and is purely decorative. Assistive technology will
        ignore this element.
      </p>
      <Separator className={rootClass} orientation="vertical" decorative />
    </div>
  </>
);

export const Chromatic = () => (
  <>
    <h1>Horizontal</h1>
    <p>The following separator is horizontal and has semantic meaning.</p>
    <Separator className={rootClass} orientation="horizontal" />
    <p>
      The following separator is horizontal and is purely decorative. Assistive technology will
      ignore this element.
    </p>
    <Separator className={rootClass} orientation="horizontal" decorative />

    <h1>Vertical</h1>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <p>The following separator is vertical and has semantic meaning.</p>
      <Separator className={rootClass} orientation="vertical" />
      <p>
        The following separator is vertical and is purely decorative. Assistive technology will
        ignore this element.
      </p>
      <Separator className={rootClass} orientation="vertical" decorative />
    </div>

    <h1>Data attribute selectors</h1>
    <Separator className={rootAttrClass} />
  </>
);
Chromatic.parameters = { chromatic: { disable: false } };

const rootClass = css({
  border: 'none',
  backgroundColor: '$red',

  '&[data-orientation="horizontal"]': {
    height: '1px',
    width: '100%',
    margin: '20px 0',
    '&[role="separator"]': { height: '2px' },
  },

  '&[data-orientation="vertical"]': {
    height: '100px',
    width: '1px',
    margin: '0 20px',
    '&[role="separator"]': { width: '2px' },
  },
});

const styles = {
  backgroundColor: 'rgba(0, 0, 255, 0.3)',
  border: '2px solid blue',
  padding: 10,
};
const rootAttrClass = css({ '&[data-radix-separator]': styles });
