import {getComponentName} from './component';
import {apply, fastdom, hasAttr, inBrowser} from 'utilities';

export default function (TAGSX) {

    const {connect, disconnect} = TAGSX;

    if (!inBrowser || !window.MutationObserver) {
        return;
    }

    fastdom.read(function () {

        if (document.body) {
            apply(document.body, connect);
        }

        new MutationObserver(records =>
            records.forEach(applyChildListMutation)
        ).observe(document, {
            childList: true,
            subtree: true
        });

        new MutationObserver(records =>
            records.forEach(applyAttributeMutation)
        ).observe(document, {
            attributes: true,
            subtree: true
        });

        TAGSX._initialized = true;
    });

    function applyChildListMutation({addedNodes, removedNodes}) {
        for (let i = 0; i < addedNodes.length; i++) {
            apply(addedNodes[i], connect);
        }

        for (let i = 0; i < removedNodes.length; i++) {
            apply(removedNodes[i], disconnect);
        }
    }

    function applyAttributeMutation({target, attributeName}) {

        const name = getComponentName(attributeName);

        if (!name || !(name in TAGSX)) {
            return;
        }

        if (hasAttr(target, attributeName)) {
            TAGSX[name](target);
            return;
        }

        const component = TAGSX.getComponent(target, name);

        if (component) {
            component.$destroy();
        }

    }

}
