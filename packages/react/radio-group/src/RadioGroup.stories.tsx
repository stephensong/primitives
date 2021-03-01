import * as React from 'react';
import { Label as LabelPrimitive } from '@radix-ui/react-label';
import { RadioGroup, RadioGroupItem, RadioGroupIndicator } from './RadioGroup';
import { css } from '../../../../stitches.config';
import { RECOMMENDED_CSS__LABEL__ROOT } from '../../label/src/Label.stories';

export default { title: 'Components/RadioGroup' };

export const Styled = () => (
  <Label>
    Favourite pet
    <RadioGroup className={rootClass} defaultValue="1">
      <Label>
        <RadioGroupItem className={itemClass} value="1">
          <RadioGroupIndicator className={indicatorClass} />
        </RadioGroupItem>
        Cat
      </Label>{' '}
      <Label>
        <RadioGroupItem className={itemClass} value="2">
          <RadioGroupIndicator className={indicatorClass} />
        </RadioGroupItem>
        Dog
      </Label>{' '}
      <Label>
        <RadioGroupItem className={itemClass} value="3">
          <RadioGroupIndicator className={indicatorClass} />
        </RadioGroupItem>
        Rabbit
      </Label>
    </RadioGroup>
  </Label>
);

export const Controlled = () => {
  const [value, setValue] = React.useState('2');

  return (
    <RadioGroup
      className={rootClass}
      value={value}
      onValueChange={(event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value)}
    >
      <RadioGroupItem className={itemClass} value="1">
        <RadioGroupIndicator className={indicatorClass} />
      </RadioGroupItem>
      <RadioGroupItem className={itemClass} value="2">
        <RadioGroupIndicator className={indicatorClass} />
      </RadioGroupItem>
      <RadioGroupItem className={itemClass} value="3">
        <RadioGroupIndicator className={indicatorClass} />
      </RadioGroupItem>
    </RadioGroup>
  );
};

export const Unset = () => (
  <Label>
    Favourite pet
    <RadioGroup className={rootClass}>
      <Label>
        <RadioGroupItem className={itemClass} value="1">
          <RadioGroupIndicator className={indicatorClass} />
        </RadioGroupItem>
        Cat
      </Label>{' '}
      <Label>
        <RadioGroupItem className={itemClass} value="2" disabled>
          <RadioGroupIndicator className={indicatorClass} />
        </RadioGroupItem>
        Dog
      </Label>{' '}
      <Label>
        <RadioGroupItem className={itemClass} value="3">
          <RadioGroupIndicator className={indicatorClass} />
        </RadioGroupItem>
        Rabbit
      </Label>
    </RadioGroup>
  </Label>
);

export const Animated = () => (
  <Label>
    Favourite pet
    <RadioGroup className={rootClass} defaultValue="1">
      <Label>
        <RadioGroupItem className={itemClass} value="1">
          <RadioGroupIndicator className={animatedIndicatorClass} />
        </RadioGroupItem>
        Cat
      </Label>{' '}
      <Label>
        <RadioGroupItem className={itemClass} value="2">
          <RadioGroupIndicator className={animatedIndicatorClass} />
        </RadioGroupItem>
        Dog
      </Label>{' '}
      <Label>
        <RadioGroupItem className={itemClass} value="3">
          <RadioGroupIndicator className={animatedIndicatorClass} />
        </RadioGroupItem>
        Rabbit
      </Label>
    </RadioGroup>
  </Label>
);

export const Chromatic = () => (
  <>
    <h1>Uncontrolled</h1>
    <h2>Unset</h2>
    <RadioGroup className={rootClass}>
      <RadioGroupItem className={itemClass} value="1">
        <RadioGroupIndicator className={indicatorClass} />
      </RadioGroupItem>
      <RadioGroupItem className={itemClass} value="2">
        <RadioGroupIndicator className={indicatorClass} />
      </RadioGroupItem>
      <RadioGroupItem className={itemClass} value="3">
        <RadioGroupIndicator className={indicatorClass} />
      </RadioGroupItem>
    </RadioGroup>

    <h2>Set</h2>
    <RadioGroup className={rootClass} defaultValue="3">
      <RadioGroupItem className={itemClass} value="1">
        <RadioGroupIndicator className={indicatorClass} />
      </RadioGroupItem>
      <RadioGroupItem className={itemClass} value="2">
        <RadioGroupIndicator className={indicatorClass} />
      </RadioGroupItem>
      <RadioGroupItem className={itemClass} value="3">
        <RadioGroupIndicator className={indicatorClass} />
      </RadioGroupItem>
    </RadioGroup>

    <h1>Controlled</h1>
    <h2>Unset</h2>
    <RadioGroup className={rootClass} value="">
      <RadioGroupItem className={itemClass} value="1">
        <RadioGroupIndicator className={indicatorClass} />
      </RadioGroupItem>
      <RadioGroupItem className={itemClass} value="2">
        <RadioGroupIndicator className={indicatorClass} />
      </RadioGroupItem>
      <RadioGroupItem className={itemClass} value="3">
        <RadioGroupIndicator className={indicatorClass} />
      </RadioGroupItem>
    </RadioGroup>

    <h2>Set</h2>
    <RadioGroup className={rootClass} value="3">
      <RadioGroupItem className={itemClass} value="1">
        <RadioGroupIndicator className={indicatorClass} />
      </RadioGroupItem>
      <RadioGroupItem className={itemClass} value="2">
        <RadioGroupIndicator className={indicatorClass} />
      </RadioGroupItem>
      <RadioGroupItem className={itemClass} value="3">
        <RadioGroupIndicator className={indicatorClass} />
      </RadioGroupItem>
    </RadioGroup>

    <h1>Disabled</h1>
    <RadioGroup className={rootClass}>
      <RadioGroupItem className={itemClass} value="1">
        <RadioGroupIndicator className={indicatorClass} />
      </RadioGroupItem>
      <RadioGroupItem className={itemClass} value="2" disabled>
        <RadioGroupIndicator className={indicatorClass} />
      </RadioGroupItem>
      <RadioGroupItem className={itemClass} value="3">
        <RadioGroupIndicator className={indicatorClass} />
      </RadioGroupItem>
    </RadioGroup>

    <h1>Force mounted indicator</h1>
    <RadioGroup className={rootClass}>
      <RadioGroupItem className={itemClass} value="1">
        <RadioGroupIndicator className={indicatorClass} forceMount />
      </RadioGroupItem>
      <RadioGroupItem className={itemClass} value="2">
        <RadioGroupIndicator className={indicatorClass} forceMount />
      </RadioGroupItem>
      <RadioGroupItem className={itemClass} value="3">
        <RadioGroupIndicator className={indicatorClass} forceMount />
      </RadioGroupItem>
    </RadioGroup>

    <h1>State attributes</h1>
    <h2>Default</h2>
    <RadioGroup className={rootAttrClass} defaultValue="3">
      <RadioGroupItem className={itemAttrClass} value="1">
        <RadioGroupIndicator className={indicatorAttrClass} />
      </RadioGroupItem>
      <RadioGroupItem className={itemAttrClass} value="2">
        <RadioGroupIndicator className={indicatorAttrClass} />
      </RadioGroupItem>
      <RadioGroupItem className={itemAttrClass} value="3">
        <RadioGroupIndicator className={indicatorAttrClass} />
      </RadioGroupItem>
    </RadioGroup>

    <h2>Disabled</h2>
    <RadioGroup className={rootAttrClass} defaultValue="3">
      <RadioGroupItem className={itemAttrClass} value="1">
        <RadioGroupIndicator className={indicatorAttrClass} />
      </RadioGroupItem>
      <RadioGroupItem className={itemAttrClass} value="2" disabled>
        <RadioGroupIndicator className={indicatorAttrClass} />
      </RadioGroupItem>
      <RadioGroupItem className={itemAttrClass} value="3">
        <RadioGroupIndicator className={indicatorAttrClass} />
      </RadioGroupItem>
    </RadioGroup>

    <RadioGroup className={rootAttrClass} defaultValue="2">
      <RadioGroupItem className={itemAttrClass} value="1">
        <RadioGroupIndicator className={indicatorAttrClass} />
      </RadioGroupItem>
      <RadioGroupItem className={itemAttrClass} value="2" disabled>
        <RadioGroupIndicator className={indicatorAttrClass} />
      </RadioGroupItem>
      <RadioGroupItem className={itemAttrClass} value="3">
        <RadioGroupIndicator className={indicatorAttrClass} />
      </RadioGroupItem>
    </RadioGroup>
  </>
);
Chromatic.parameters = { chromatic: { disable: false } };

const Label = (props: any) => <LabelPrimitive {...props} style={RECOMMENDED_CSS__LABEL__ROOT} />;

const rootClass = css({});

const RECOMMENDED_CSS__RADIO_GROUP__ITEM = {
  // better default alignment
  verticalAlign: 'middle',
};

const itemClass = css({
  ...RECOMMENDED_CSS__RADIO_GROUP__ITEM,
  width: 30,
  height: 30,
  display: 'inline-grid',
  padding: 0,
  placeItems: 'center',
  border: '1px solid $gray300',
  borderRadius: 9999,

  '&:focus': {
    outline: 'none',
    borderColor: '$red',
    boxShadow: '0 0 0 1px $red',
  },

  '&[data-disabled]': {
    opacity: 0.5,
  },
});

const indicatorClass = css({
  width: 18,
  height: 18,
  backgroundColor: '$red',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'inherit',
});

const fadeIn = css.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const fadeOut = css.keyframes({
  from: { opacity: 1 },
  to: { opacity: 0 },
});

const animatedIndicatorClass = css(indicatorClass, {
  '&[data-state="checked"]': {
    animation: `${fadeIn} 300ms ease-out`,
  },
  '&[data-state="unchecked"]': {
    animation: `${fadeOut} 300ms ease-in`,
  },
});

const styles = {
  backgroundColor: 'rgba(0, 0, 255, 0.3)',
  border: '2px solid blue',
  padding: 10,

  '&:disabled': { opacity: 0.5 },
  '&[data-disabled]': { borderStyle: 'dashed' },

  '&[data-state="unchecked"]': { borderColor: 'red' },
  '&[data-state="checked"]': { borderColor: 'green' },
};
const rootAttrClass = css(styles);
const itemAttrClass = css(styles);
const indicatorAttrClass = css(styles);
