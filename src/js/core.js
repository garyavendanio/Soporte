import TAGSX from './api/index';
import Core from './core/core';
import boot from './api/boot';
import * as components from './core/index';
import {each} from './util/lang';

// register components
each(components, (component, name) =>
    TAGSX.component(name, component)
);

// core functionality
TAGSX.use(Core);

boot(TAGSX);

export default TAGSX;
