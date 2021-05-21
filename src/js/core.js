import mytags from './api/index';
import Core from './core/core';
import boot from './api/boot';
import * as components from './core/index';
import {each} from './util/lang';

// register components
each(components, (component, name) =>
    mytags.component(name, component)
);

// core functionality
mytags.use(Core);

boot(mytags);

export default mytags;
