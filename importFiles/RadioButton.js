import './RadioButton.scss';
import classnames from 'classnames';
import * as React from 'react';

import { setBaseClass } from 'client/utils';

const cls = setBaseClass('RadioButton');

export function RadioButton() {
  const classes = [cls()];
  if (props.checked) {
    classes.push(cls('__checked'));
  }
  if (props.disabled) {
    classes.push(cls('__disabled'));
  }
  const click = !props.disabled && props.onClick;
  return (
    <div onClick={click} className={classnames(cls('__wrapper'), props.className)}>
      <div className={classes.join(' ')}></div>
      {props.label && <div className={cls('__label')}>{props.label}</div>}
    </div>
  );
}