import Modal from '../mixin/modal';
import {$, addClass, assign, css, Deferred, hasClass, height, html, isString, on, Promise, removeClass} from 'utilities';

export default {

    install,

    mixins: [Modal],

    data: {
        clsPage: 'x-modal-page',
        selPanel: '.x-modal-dialog',
        selClose: '.x-modal-close, .x-modal-close-default, .x-modal-close-outside, .x-modal-close-full'
    },

    events: [

        {
            name: 'show',

            self: true,

            handler() {

                if (hasClass(this.panel, 'x-margin-auto-vertical')) {
                    addClass(this.$el, 'x-flex');
                } else {
                    css(this.$el, 'display', 'block');
                }

                height(this.$el); // force reflow
            }
        },

        {
            name: 'hidden',

            self: true,

            handler() {

                css(this.$el, 'display', '');
                removeClass(this.$el, 'x-flex');

            }
        }

    ]

};

function install({modal}) {

    modal.dialog = function (content, options) {

        const dialog = modal(
            `<div class="x-modal">
                <div class="x-modal-dialog">${content}</div>
             </div>`,
            options
        );

        dialog.show();

        on(dialog.$el, 'hidden', () =>
            Promise.resolve().then(() =>
                dialog.$destroy(true)
            ), {self: true}
        );

        return dialog;
    };

    modal.alert = function (message, options) {
        return openDialog(
            ({labels}) => `<div class="x-modal-body">${isString(message) ? message : html(message)}</div>
            <div class="x-modal-footer x-text-right">
                <button class="x-button x-button-primary x-modal-close" autofocus>${labels.ok}</button>
            </div>`,
            options,
            deferred => deferred.resolve()
        );
    };

    modal.confirm = function (message, options) {
        return openDialog(
            ({labels}) => `<form>
                <div class="x-modal-body">${isString(message) ? message : html(message)}</div>
                <div class="x-modal-footer x-text-right">
                    <button class="x-button x-button-default x-modal-close" type="button">${labels.cancel}</button>
                    <button class="x-button x-button-primary" autofocus>${labels.ok}</button>
                </div>
            </form>`,
            options,
            deferred => deferred.reject()
        );
    };

    modal.prompt = function (message, value, options) {
        return openDialog(
            ({labels}) => `<form class="x-form-stacked">
                <div class="x-modal-body">
                    <label>${isString(message) ? message : html(message)}</label>
                    <input class="x-input" value="${value || ''}" autofocus>
                </div>
                <div class="x-modal-footer x-text-right">
                    <button class="x-button x-button-default x-modal-close" type="button">${labels.cancel}</button>
                    <button class="x-button x-button-primary">${labels.ok}</button>
                </div>
            </form>`,
            options,
            deferred => deferred.resolve(null),
            dialog => $('input', dialog.$el).value
        );
    };

    modal.labels = {
        ok: 'Ok',
        cancel: 'Cancel'
    };

    function openDialog(tmpl, options, hideFn, submitFn) {

        options = assign({bgClose: false, escClose: true, labels: modal.labels}, options);

        const dialog = modal.dialog(tmpl(options), options);
        const deferred = new Deferred();

        let resolved = false;

        on(dialog.$el, 'submit', 'form', e => {
            e.preventDefault();
            deferred.resolve(submitFn && submitFn(dialog));
            resolved = true;
            dialog.hide();
        });

        on(dialog.$el, 'hide', () => !resolved && hideFn(deferred));

        deferred.promise.dialog = dialog;

        return deferred.promise;
    }

}
