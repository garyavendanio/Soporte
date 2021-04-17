import TAGSX from './core';
import * as components from './components/index';
import {each} from './util/lang';

each(components, (component, name) =>
    TAGSX.component(name, component)
);

export default TAGSX;
