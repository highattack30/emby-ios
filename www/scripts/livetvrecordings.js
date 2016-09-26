﻿define(['components/categorysyncbuttons', 'cardBuilder', 'scripts/livetvcomponents', 'emby-button', 'listViewStyle', 'emby-itemscontainer'], function (categorysyncbuttons, cardBuilder) {

    function getRecordingGroupHtml(group) {

        var html = '';

        html += '<div class="listItem">';

        html += '<button type="button" is="emby-button" class="fab mini autoSize blue" item-icon><i class="md-icon">live_tv</i></button>';

        html += '<div class="listItemBody two-line">';
        html += '<a href="livetvitems.html?type=Recordings&groupid=' + group.Id + '" class="clearLink">';

        html += '<div>';
        html += group.Name;
        html += '</div>';

        html += '<div class="secondary">';
        if (group.RecordingCount == 1) {
            html += Globalize.translate('ValueItemCount', group.RecordingCount);
        } else {
            html += Globalize.translate('ValueItemCountPlural', group.RecordingCount);
        }
        html += '</div>';

        html += '</a>';
        html += '</div>';
        html += '</div>';

        return html;
    }

    function renderRecordingGroups(context, groups) {

        if (groups.length) {
            context.querySelector('#recordingGroups').classList.remove('hide');
        } else {
            context.querySelector('#recordingGroups').classList.add('hide');
        }

        var html = '';

        html += '<div class="paperList">';

        for (var i = 0, length = groups.length; i < length; i++) {

            html += getRecordingGroupHtml(groups[i]);
        }

        html += '</div>';

        context.querySelector('#recordingGroupItems').innerHTML = html;

        Dashboard.hideLoadingMsg();
    }

    function enableScrollX() {
        return browserInfo.mobile && AppInfo.enableAppLayouts;
    }

    function renderRecordings(elem, recordings, cardOptions) {

        if (recordings.length) {
            elem.classList.remove('hide');
        } else {
            elem.classList.add('hide');
        }

        var recordingItems = elem.querySelector('.recordingItems');

        if (enableScrollX()) {
            recordingItems.classList.add('hiddenScrollX');
            recordingItems.classList.remove('vertical-wrap');
        } else {
            recordingItems.classList.remove('hiddenScrollX');
            recordingItems.classList.add('vertical-wrap');
        }

        recordingItems.innerHTML = cardBuilder.getCardsHtml(Object.assign({
            items: recordings,
            shape: (enableScrollX() ? 'autooverflow' : 'auto'),
            showTitle: true,
            showParentTitle: true,
            coverImage: true,
            lazy: true,
            cardLayout: true,
            allowBottomPadding: !enableScrollX(),
            preferThumb: 'auto'

        }, cardOptions || {}));

        ImageLoader.lazyChildren(recordingItems);
    }

    function renderActiveRecordings(context) {

        ApiClient.getLiveTvTimers({

            IsActive: true

        }).then(function (result) {

            // The IsActive param is new, so handle older servers that don't support it
            if (result.Items.length && result.Items[0].Status != 'InProgress') {
                result.Items = [];
            }

            renderTimers(context.querySelector('#activeRecordings'), result.Items, {
                indexByDate: false
            });
        });
    }

    function renderLatestRecordings(context) {

        ApiClient.getLiveTvRecordings({

            UserId: Dashboard.getCurrentUserId(),
            Limit: enableScrollX() ? 12 : 8,
            IsInProgress: false,
            Fields: 'CanDelete,PrimaryImageAspectRatio,BasicSyncInfo',
            EnableTotalRecordCount: false,
            EnableImageTypes: "Primary,Thumb,Backdrop"

        }).then(function (result) {

            renderRecordings(context.querySelector('#latestRecordings'), result.Items);

            Dashboard.hideLoadingMsg();
        });
    }

    function renderMovieRecordings(context) {

        ApiClient.getLiveTvRecordings({

            UserId: Dashboard.getCurrentUserId(),
            Limit: enableScrollX() ? 12 : 8,
            IsInProgress: false,
            Fields: 'CanDelete,PrimaryImageAspectRatio,BasicSyncInfo',
            EnableTotalRecordCount: false,
            IsMovie: true

        }).then(function (result) {

            renderRecordings(context.querySelector('#movieRecordings'), result.Items, {
                showYear: true,
                showParentTitle: false
            });
        });
    }

    function renderEpisodeRecordings(context) {

        ApiClient.getLiveTvRecordingSeries({

            UserId: Dashboard.getCurrentUserId(),
            Limit: enableScrollX() ? 12 : 8,
            IsInProgress: false,
            Fields: 'CanDelete,PrimaryImageAspectRatio,BasicSyncInfo',
            EnableTotalRecordCount: false,
            IsSeries: true

        }).then(function (result) {

            renderRecordings(context.querySelector('#episodeRecordings'), result.Items, {
                showItemCounts: true,
                showParentTitle: false
            });
        });
    }

    function renderSportsRecordings(context) {

        ApiClient.getLiveTvRecordings({

            UserId: Dashboard.getCurrentUserId(),
            Limit: enableScrollX() ? 12 : 8,
            IsInProgress: false,
            Fields: 'CanDelete,PrimaryImageAspectRatio,BasicSyncInfo',
            EnableTotalRecordCount: false,
            IsSports: true

        }).then(function (result) {

            renderRecordings(context.querySelector('#sportsRecordings'), result.Items, {
                showYear: true,
                showParentTitle: false
            });
        });
    }

    function renderKidsRecordings(context) {

        ApiClient.getLiveTvRecordings({

            UserId: Dashboard.getCurrentUserId(),
            Limit: enableScrollX() ? 12 : 8,
            IsInProgress: false,
            Fields: 'CanDelete,PrimaryImageAspectRatio,BasicSyncInfo',
            EnableTotalRecordCount: false,
            IsKids: true

        }).then(function (result) {

            renderRecordings(context.querySelector('#kidsRecordings'), result.Items, {
                showYear: true,
                showParentTitle: false
            });
        });
    }

    function renderTimers(context, timers, options) {

        LiveTvHelpers.getTimersHtml(timers, options).then(function (html) {

            var elem = context;

            if (html) {
                elem.classList.remove('hide');
            } else {
                elem.classList.add('hide');
            }

            elem.querySelector('.recordingItems').innerHTML = html;

            ImageLoader.lazyChildren(elem);
        });
    }

    function reload(context) {

        Dashboard.showLoadingMsg();

        renderActiveRecordings(context);
        renderLatestRecordings(context);
        renderMovieRecordings(context);
        renderEpisodeRecordings(context);
        renderSportsRecordings(context);
        renderKidsRecordings(context);

        ApiClient.getLiveTvRecordingGroups({

            userId: Dashboard.getCurrentUserId()

        }).then(function (result) {

            renderRecordingGroups(context, result.Items);
        });
    }

    function onMoreClick(e) {

        var type = this.getAttribute('data-type');

        switch(type) {
            case 'latest':
                Dashboard.navigate('livetvitems.html?type=Recordings');
                break;
            case 'movies':
                Dashboard.navigate('livetvitems.html?type=Recordings&IsMovie=true');
                break;
            case 'episodes':
                Dashboard.navigate('livetvitems.html?type=RecordingSeries');
                break;
            case 'programs':
                Dashboard.navigate('livetvitems.html?type=Recordings&IsSeries=false&IsMovie=false');
                break;
            case 'kids':
                Dashboard.navigate('livetvitems.html?type=Recordings&IsKids=true');
                break;
            case 'sports':
                Dashboard.navigate('livetvitems.html?type=Recordings&IsSports=true');
                break;
            default:
                break;
        }
    }

    return function (view, params, tabContent) {

        var self = this;

        categorysyncbuttons.init(tabContent);

        var moreButtons = tabContent.querySelectorAll('.more');
        for (var i = 0, length = moreButtons.length; i < length; i++) {
            moreButtons[i].addEventListener('click', onMoreClick);
        }
        tabContent.querySelector('#activeRecordings .recordingItems').addEventListener('timercancelled', function () {
            reload(tabContent);
        });

        self.renderTab = function () {
            reload(tabContent);
        };
    };

});