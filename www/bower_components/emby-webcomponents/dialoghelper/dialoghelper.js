﻿define(['historyManager', 'focusManager', 'browser', 'layoutManager', 'inputManager', 'dom', 'css!./dialoghelper.css', 'scrollStyles'], function (historyManager, focusManager, browser, layoutManager, inputManager, dom) {

    var globalOnOpenCallback;

    function enableAnimation() {

        if (browser.animate) {
            return true;
        }

        if (browser.edge) {
            return true;
        }

        return false;
    }

    function removeCenterFocus(dlg) {

        if (layoutManager.tv) {
            if (dlg.classList.contains('smoothScrollX')) {
                centerFocus(dlg, true, false);
            }
            else if (dlg.classList.contains('smoothScrollY')) {
                centerFocus(dlg, false, false);
            }
        }
    }

    function dialogHashHandler(dlg, hash, resolve) {

        var self = this;
        self.originalUrl = window.location.href;
        var activeElement = document.activeElement;
        var removeScrollLockOnClose = false;

        function onHashChange(e) {

            var isBack = self.originalUrl == window.location.href;

            if (isBack || !isOpened(dlg)) {
                window.removeEventListener('popstate', onHashChange);
            }

            if (isBack) {
                self.closedByBack = true;
                closeDialog(dlg);
            }
        }

        function onBackCommand(e) {

            if (e.detail.command == 'back') {
                self.closedByBack = true;
                closeDialog(dlg);
                e.preventDefault();
            }
        }

        function onDialogClosed() {

            if (!isHistoryEnabled(dlg)) {
                inputManager.off(dlg, onBackCommand);
            }

            window.removeEventListener('popstate', onHashChange);

            removeBackdrop(dlg);
            dlg.classList.remove('opened');

            if (removeScrollLockOnClose) {
                document.body.classList.remove('noScroll');
            }

            if (!self.closedByBack && isHistoryEnabled(dlg)) {
                var state = history.state || {};
                if (state.dialogId == hash) {
                    history.back();
                }
            }

            if (layoutManager.tv) {
                activeElement.focus();
            }

            if (dlg.getAttribute('data-removeonclose') != 'false') {
                removeCenterFocus(dlg);

                var dialogContainer = dlg.dialogContainer;
                if (dialogContainer) {
                    dialogContainer.parentNode.removeChild(dialogContainer);
                    dlg.dialogContainer = null;
                } else {
                    dlg.parentNode.removeChild(dlg);
                }
            }

            //resolve();
            // if we just called history.back(), then use a timeout to allow the history events to fire first
            setTimeout(function () {
                resolve({
                    element: dlg,
                    closedByBack: self.closedByBack
                });
            }, 1);
        }

        dlg.addEventListener('close', onDialogClosed);

        var center = !dlg.classList.contains('dialog-fixedSize');
        if (center) {
            dlg.classList.add('centeredDialog');
        }

        dlg.classList.remove('hide');

        addBackdropOverlay(dlg);

        dlg.classList.add('opened');
        dlg.dispatchEvent(new CustomEvent('open', {
            bubbles: false,
            cancelable: false
        }));

        if (dlg.getAttribute('data-lockscroll') == 'true' && !document.body.classList.contains('noScroll')) {
            document.body.classList.add('noScroll');
            removeScrollLockOnClose = true;
        }

        animateDialogOpen(dlg);

        if (isHistoryEnabled(dlg)) {
            historyManager.pushState({ dialogId: hash }, "Dialog", hash);

            window.addEventListener('popstate', onHashChange);
        } else {
            inputManager.on(dlg, onBackCommand);
        }
    }

    function addBackdropOverlay(dlg) {

        var backdrop = document.createElement('div');
        backdrop.classList.add('dialogBackdrop');

        var backdropParent = dlg.dialogContainer || dlg;
        backdropParent.parentNode.insertBefore(backdrop, backdropParent);
        dlg.backdrop = backdrop;

        // Doing this immediately causes the opacity to jump immediately without animating
        setTimeout(function () {
            backdrop.classList.add('dialogBackdropOpened');
        }, 0);

        dom.addEventListener((dlg.dialogContainer || backdrop), 'click', function (e) {
            if (e.target == dlg.dialogContainer) {
                close(dlg);
            }
        }, {
            passive: true
        });
    }

    function isHistoryEnabled(dlg) {
        return dlg.getAttribute('data-history') == 'true';
    }

    function open(dlg) {

        if (globalOnOpenCallback) {
            globalOnOpenCallback(dlg);
        }

        var parent = dlg.parentNode;
        if (parent) {
            parent.removeChild(dlg);
        }

        var dialogContainer = document.createElement('div');
        dialogContainer.classList.add('dialogContainer');
        dialogContainer.appendChild(dlg);
        dlg.dialogContainer = dialogContainer;
        document.body.appendChild(dialogContainer);

        return new Promise(function (resolve, reject) {

            new dialogHashHandler(dlg, 'dlg' + new Date().getTime(), resolve);
        });
    }

    function isOpened(dlg) {

        //return dlg.opened;
        return !dlg.classList.contains('hide');
    }

    function close(dlg) {

        if (isOpened(dlg)) {
            if (isHistoryEnabled(dlg)) {
                history.back();
            } else {
                closeDialog(dlg);
            }
        }
    }

    function scaleUp(elem, onFinish) {

        var keyframes = [
          { transform: 'scale(0)', offset: 0 },
          { transform: 'none', offset: 1 }];
        var timing = elem.animationConfig.entry.timing;
        return elem.animate(keyframes, timing).onfinish = onFinish;
    }

    function slideUp(elem, onFinish) {

        var keyframes = [
          { transform: 'translate3d(0,30%,0)', opacity: 0, offset: 0 },
          { transform: 'none', opacity: 1, offset: 1 }];
        var timing = elem.animationConfig.entry.timing;
        return elem.animate(keyframes, timing).onfinish = onFinish;
    }

    function fadeIn(elem, onFinish) {

        var keyframes = [
          { opacity: '0', offset: 0 },
          { opacity: '1', offset: 1 }];
        var timing = elem.animationConfig.entry.timing;
        return elem.animate(keyframes, timing).onfinish = onFinish;
    }

    function scaleDown(elem) {

        var keyframes = [
          { transform: 'none', opacity: 1, offset: 0 },
          { transform: 'scale(0)', opacity: 0, offset: 1 }];
        var timing = elem.animationConfig.exit.timing;
        return elem.animate(keyframes, timing);
    }

    function fadeOut(elem) {

        var keyframes = [
          { opacity: '1', offset: 0 },
          { opacity: '0', offset: 1 }];
        var timing = elem.animationConfig.exit.timing;
        return elem.animate(keyframes, timing);
    }

    function slideDown(elem, onFinish) {

        var keyframes = [
          { transform: 'none', opacity: 1, offset: 0 },
          { transform: 'translate3d(0,30%,0)', opacity: 0, offset: 1 }];
        var timing = elem.animationConfig.entry.timing;
        return elem.animate(keyframes, timing);
    }

    function closeDialog(dlg) {

        if (!dlg.classList.contains('hide')) {

            dlg.dispatchEvent(new CustomEvent('closing', {
                bubbles: false,
                cancelable: false
            }));

            var onAnimationFinish = function () {
                focusManager.popScope(dlg);

                dlg.classList.add('hide');
                if (dlg.close) {
                    dlg.close();
                } else {
                    dlg.dispatchEvent(new CustomEvent('close', {
                        bubbles: false,
                        cancelable: false
                    }));
                }
            };
            if (!dlg.animationConfig) {
                onAnimationFinish();
                return;
            }

            var animation;

            if (dlg.animationConfig.exit.name == 'fadeout') {
                animation = fadeOut(dlg);
            } else if (dlg.animationConfig.exit.name == 'scaledown') {
                animation = scaleDown(dlg);
            } else if (dlg.animationConfig.exit.name == 'slidedown') {
                animation = slideDown(dlg);
            } else {
                onAnimationFinish();
                return;
            }

            animation.onfinish = onAnimationFinish;
        }
    }

    function animateDialogOpen(dlg) {

        var onAnimationFinish = function () {
            focusManager.pushScope(dlg);
            if (dlg.getAttribute('data-autofocus') == 'true') {
                focusManager.autoFocus(dlg);
            }
        };

        if (!dlg.animationConfig) {
            onAnimationFinish();
            return;
        }
        if (dlg.animationConfig.entry.name == 'fadein') {
            fadeIn(dlg, onAnimationFinish);
        } else if (dlg.animationConfig.entry.name == 'scaleup') {
            scaleUp(dlg, onAnimationFinish);
        } else if (dlg.animationConfig.entry.name == 'slideup') {
            slideUp(dlg, onAnimationFinish);
        }
    }

    function shouldLockDocumentScroll(options) {

        if (options.lockScroll != null) {
            return options.lockScroll;
        }

        if (options.size == 'fullscreen') {
            return true;
        }

        if (options.size) {
            return true;
        }

        return browser.touch;
    }

    function removeBackdrop(dlg) {

        var backdrop = dlg.backdrop;

        if (backdrop) {
            dlg.backdrop = null;

            backdrop.classList.remove('dialogBackdropOpened');

            setTimeout(function () {
                backdrop.parentNode.removeChild(backdrop);
            }, 300);
        }
    }

    function centerFocus(elem, horiz, on) {
        require(['scrollHelper'], function (scrollHelper) {
            var fn = on ? 'on' : 'off';
            scrollHelper.centerFocus[fn](elem, horiz);
        });
    }

    function createDialog(options) {

        options = options || {};

        // If there's no native dialog support, use a plain div
        // Also not working well in samsung tizen browser, content inside not clickable
        // Just go ahead and always use a plain div because we're seeing issues overlaying absoltutely positioned content over a modal dialog
        var dlg = document.createElement('div');

        dlg.classList.add('focuscontainer');
        dlg.classList.add('hide');

        if (shouldLockDocumentScroll(options)) {
            dlg.setAttribute('data-lockscroll', 'true');
        }

        if (options.enableHistory !== false && historyManager.enableNativeHistory()) {
            dlg.setAttribute('data-history', 'true');
        }

        // without this safari will scroll the background instead of the dialog contents
        // but not needed here since this is already on top of an existing dialog
        // but skip it in IE because it's causing the entire browser to hang
        // Also have to disable for firefox because it's causing select elements to not be clickable
        if (options.modal !== false) {
            dlg.setAttribute('modal', 'modal');
        }

        if (options.autoFocus !== false) {
            dlg.setAttribute('data-autofocus', 'true');
        }

        var defaultEntryAnimation = 'scaleup';
        var entryAnimation = options.entryAnimation || defaultEntryAnimation;
        var defaultExitAnimation = 'scaledown';
        var exitAnimation = options.exitAnimation || defaultExitAnimation;

        // If it's not fullscreen then lower the default animation speed to make it open really fast
        var entryAnimationDuration = options.entryAnimationDuration || (options.size !== 'fullscreen' ? 180 : 280);
        var exitAnimationDuration = options.exitAnimationDuration || (options.size !== 'fullscreen' ? 180 : 280);

        dlg.animationConfig = {
            // scale up
            'entry': {
                name: entryAnimation,
                node: dlg,
                timing: {
                    duration: entryAnimationDuration,
                    easing: 'ease-out'
                }
            },
            // fade out
            'exit': {
                name: exitAnimation,
                node: dlg,
                timing: {
                    duration: exitAnimationDuration,
                    easing: 'ease-out',
                    fill: 'both'
                }
            }
        };

        // too buggy in IE, not even worth it
        if (!enableAnimation()) {
            dlg.animationConfig = null;
        }

        dlg.classList.add('dialog');

        if (options.scrollX) {
            dlg.classList.add('smoothScrollX');

            if (layoutManager.tv) {
                centerFocus(dlg, true, true);
            }
        }
        else if (options.scrollY !== false) {
            dlg.classList.add('smoothScrollY');

            if (layoutManager.tv) {
                centerFocus(dlg, false, true);
            }
        }

        if (options.removeOnClose) {
            dlg.setAttribute('data-removeonclose', 'true');
        }

        if (options.size) {
            dlg.classList.add('dialog-fixedSize');
            dlg.classList.add('dialog-' + options.size);
        }

        return dlg;
    }

    return {
        open: open,
        close: close,
        createDialog: createDialog,
        setOnOpen: function (val) {
            globalOnOpenCallback = val;
        }
    };
});