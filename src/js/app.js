import mytags from './core';
import * as components from './components/index';
import {each} from './util/lang';

each(components, (component, name) =>
    mytags.component(name, component)
);

export default mytags;
