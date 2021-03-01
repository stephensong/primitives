import * as React from 'react';
import {
  createContextObj,
  composeEventHandlers,
  useControlledState,
  useComposedRefs,
} from '@radix-ui/react-utils';
import { Primitive } from '@radix-ui/react-primitive';
import { useLabelContext } from '@radix-ui/react-label';

import type * as Polymorphic from '@radix-ui/react-polymorphic';

/* -------------------------------------------------------------------------------------------------
 * Switch
 * -----------------------------------------------------------------------------------------------*/

const SWITCH_NAME = 'Switch';
const SWITCH_DEFAULT_TAG = 'button';

type InputDOMProps = React.ComponentProps<'input'>;
type SwitchOwnProps = Polymorphic.Merge<
  Polymorphic.OwnProps<typeof Primitive>,
  {
    checked?: boolean;
    defaultChecked?: boolean;
    required?: InputDOMProps['required'];
    readOnly?: InputDOMProps['readOnly'];
    onCheckedChange?: InputDOMProps['onChange'];
  }
>;

type SwitchPrimitive = Polymorphic.ForwardRefComponent<typeof SWITCH_DEFAULT_TAG, SwitchOwnProps>;

type SwitchContextValue = { checked: boolean; disabled?: boolean };

const [SwitchProvider, useSwitchContext] = createContextObj<SwitchContextValue>(SWITCH_NAME);

const Switch = React.forwardRef((props, forwardedRef) => {
  const {
    as = SWITCH_DEFAULT_TAG,
    'aria-labelledby': ariaLabelledby,
    name,
    checked: checkedProp,
    defaultChecked,
    required,
    disabled,
    readOnly,
    value = 'on',
    onCheckedChange,
    ...switchProps
  } = props;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const ref = useComposedRefs(forwardedRef, buttonRef);
  const labelId = useLabelContext(buttonRef);
  const labelledBy = ariaLabelledby || labelId;
  const [checked = false, setChecked] = useControlledState({
    prop: checkedProp,
    defaultProp: defaultChecked,
  });

  return (
    /**
     * The `input` is hidden from non-SR and SR users as it only exists to
     * ensure form events fire when the value changes and that the value
     * updates when clicking an associated label.
     */
    <>
      <input
        ref={inputRef}
        type="checkbox"
        name={name}
        checked={checked}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        value={value}
        hidden
        onChange={composeEventHandlers(onCheckedChange, (event) => {
          setChecked(event.target.checked);
        })}
      />
      <SwitchProvider checked={checked} disabled={disabled}>
        <Primitive
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={labelledBy}
          aria-required={required}
          data-state={getState(checked)}
          data-disabled={disabled ? '' : undefined}
          data-readonly={readOnly}
          {...switchProps}
          as={as}
          ref={ref}
          disabled={disabled}
          value={value}
          /**
           * The `input` is hidden, so when the button is clicked we trigger
           * the input manually
           */
          onClick={composeEventHandlers(props.onClick, () => inputRef.current?.click(), {
            checkForDefaultPrevented: false,
          })}
        />
      </SwitchProvider>
    </>
  );
}) as SwitchPrimitive;

Switch.displayName = SWITCH_NAME;

/* -------------------------------------------------------------------------------------------------
 * SwitchThumb
 * -----------------------------------------------------------------------------------------------*/

const THUMB_NAME = 'SwitchThumb';
const THUMB_DEFAULT_TAG = 'span';

type SwitchThumbOwnProps = Polymorphic.OwnProps<typeof Primitive>;
type SwitchThumbPrimitive = Polymorphic.ForwardRefComponent<
  typeof THUMB_DEFAULT_TAG,
  SwitchThumbOwnProps
>;

const SwitchThumb = React.forwardRef((props, forwardedRef) => {
  const { as = THUMB_DEFAULT_TAG, ...thumbProps } = props;
  const context = useSwitchContext(THUMB_NAME);
  return (
    <Primitive
      data-state={getState(context.checked)}
      data-disabled={context.disabled ? '' : undefined}
      {...thumbProps}
      as={as}
      ref={forwardedRef}
    />
  );
}) as SwitchThumbPrimitive;

SwitchThumb.displayName = THUMB_NAME;

/* ---------------------------------------------------------------------------------------------- */

function getState(checked: boolean) {
  return checked ? 'checked' : 'unchecked';
}

const Root = Switch;
const Thumb = SwitchThumb;

export {
  Switch,
  SwitchThumb,
  //
  Root,
  Thumb,
};
