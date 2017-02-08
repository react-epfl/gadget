(function () {
  'use strict';

  var metadata = {};
  var historyStore = [];
  var historyIncrement = 5;
  var historyLimit = historyIncrement;
  var checkEditorModified = false;
  var currentTab;

  var loadScript = function (scriptURL) {
    // load scripts from JS to avoid Shindig rendering them
    var scriptElem = document.createElement('script');
    scriptElem.setAttribute('type', 'text/javascript');
    scriptElem.setAttribute('src', scriptURL);
    document.body.appendChild(scriptElem);
  };

  var logAction = function (verb) {
    // create action
    var published = new Date().toISOString();
    var params = {
      userId: '@viewer',
      groupId: '@self',
      activity: {
        verb: verb,
        published: published,
        object: metadata.generator,
        target: metadata.generator,
        generator: metadata.generator,
        actor: metadata.actor,
        provider: metadata.provider
      }
    };

    // send action
    osapi.activitystreams.create(params).execute(function (response) {
      if (!response || !response.id || response.error) {
        console.error('Error logging the ' + verb + ' action');
        if (response.error) console.error(response.error);
      }
    });
  };

  var loadingTabTimeout;
  var changeTab = function (tabName) {
    // remove all active classes
    document.querySelectorAll('.nav-link.active, .tab.active').forEach(function (el) {
      el.classList.remove('active');
    });

    // add active class to specified tab and content
    if (tabName === 'loading') {
      loadingTabTimeout = setTimeout(function () {
        document.getElementById(tabName).classList.add('active');
      }, 300);
    } else {
      clearTimeout(loadingTabTimeout);
      loadingTabTimeout = null;
      document.getElementById(tabName + '-nav').classList.add('active');
      document.getElementById(tabName).classList.add('active');
    }
    currentTab = tabName;
  };

  var hideError = function () {
    // hide error message
    document.getElementById('error').classList.remove('active');
  };

  var hideErrorTimeout;
  var displayError = function (errMessage, errDetails) {
    // display and log error message
    document.getElementById('error').classList.add('active');
    document.getElementById('error-message').innerHTML = errMessage;
    console.error(errMessage);
    if (errDetails) console.error(errDetails);

    // hide error message automatically after 5s
    clearTimeout(hideErrorTimeout);
    hideErrorTimeout = setTimeout(hideError, 5000);
  };

  var getContentFromHistory = function (history) {
    if (!history || history.length === 0) return '';

    // return the most recent entry from the history array
    var content = history[history.length - 1].data;

    return content;
  };

  var getHistoryFromResource = function (resource) {
    // update metadata for saving
    if (metadata.target) {
      metadata.target.displayName = resource.displayName;
      metadata.target.id = resource.id;
    }

    var history = [];
    if (resource.content) {
      // convert string to history object
      history = JSON.parse(JSON.parse(resource.content));
    }

    // update/reset data for history tab
    historyStore = history;
    historyLimit = historyIncrement;

    return history;
  };

  var getContentFromResource = function (resource) {
    // get history
    var history = getHistoryFromResource(resource);

    if (history.length === 0) return '';

    // return latest content
    var content = getContentFromHistory(history);

    return content;
  };

  var loadHistoryFromVault = function (cb) {
    if (!metadata.storageId || !metadata.generator || !metadata.generator.id) {
      return cb('The app requested data before it initialised');
    }

    // query vault for resources created by this app
    ils.filterVault(metadata.storageId, null, metadata.generator.id, null, null, null, null, null,
        function (resources) {
      if (resources.error) return cb(resources.error);

      if (resources.length > 0 && resources[0].content) {
        // use the first resource returned from the vault
        var vaultResource = resources[0];

        // get history object
        var history = getHistoryFromResource(vaultResource);

        return cb(null, history);
      } else {
        // try to get the old app-data format for backwards compatibility
        var spaceId = metadata.provider.inquiryPhaseId;
        if (!spaceId || spaceId === 'undefined') spaceId = metadata.provider.id;
        var spaceContextId = 's_' + spaceId;

        osapi.appdata.get({userId: spaceContextId}).execute(function (data) {
          if (data && data.error) return cb(data.error);

          // if history app-data doesn't exist return an empty history array
          if (!data || !data[spaceContextId] || !data[spaceContextId].history ||
              data[spaceContextId].history.length === 0) {
            return cb(null, []);
          }

          // parse history data found in app-data
          var appDataHistory = JSON.parse(data[spaceContextId].history);

          return cb(null, appDataHistory);
        });
      }
    });
  };

  var createVaultResource = function (content, cb) {
    // create a new vault resource and return the saved resource
    var resourceName = 'Shared Wiki';
    ils.createResource(resourceName, content, metadata, function (savedResource) {
      if (!savedResource) return cb('The created resource was not returned');
      if (savedResource.error) return cb(savedResource.error);

      // update resource content - this should be handled by Graasp, but the content is
      // extracted from the file after the resource has been returned to the client
      if (!savedResource.content && content) savedResource.content = JSON.stringify(content);

      cb(null, savedResource);
    });
  };

  var updateVaultResource = function (content, cb) {
    // replace a vault resource by ID and return the saved resource
    var resourceId = metadata.target && metadata.target.id;
    ils.updateResource(resourceId, content, metadata, function (savedResource) {
      if (!savedResource) return cb('The updated resource was not returned');
      if (savedResource.error) return cb(savedResource.error);

      cb(null, savedResource);
    });
  };

  var updatePreviewContent = function (html) {
    // replace content of the preview
    document.getElementById('preview').innerHTML = html;
  };

  var updateEditorContent = function (html) {
    if (!tinymce.activeEditor) {
      return displayError(wikiTranslations.error_updating_content, 'TinyMCE is not active');
    }

    // update TinyMCE content and focus cursor
    tinymce.activeEditor.focus();
    tinymce.activeEditor.setContent(html);
    tinymce.activeEditor.undoManager.clear();
    tinymce.activeEditor.isNotDirty = true;
  };

  var disableLoadMore = function () {
    // change the load more button so that it appears to be disabled
    document.getElementById('load-more-button').classList.add('disabled');
  };

  var enableLoadMore = function () {
    // change the load more button so that it appears to be enabled
    document.getElementById('load-more-button').classList.remove('disabled');
  };

  var disableClearHistory = function () {
    // change the load more button so that it appears to be disabled
    document.getElementById('clear-button').classList.add('disabled');
  };

  var enableClearHistory = function () {
    // change the load more button so that it appears to be enabled
    document.getElementById('clear-button').classList.remove('disabled');
  };

  var getHistoryRecordEl = function (historyRecord) {
    // create an element and insert content from history record
    var historyRecordEl = document.createElement('tr');
    historyRecordEl.innerHTML = '<td>' + historyRecord.viewer_name + '</td><td>' +
        historyRecord.data + '</td><td>' + historyRecord.date + '</td>';
    return historyRecordEl;
  };

  var updateHistoryContent = function (history) {
    // clear table
    var historyTableBodyEl = document.querySelector('.history-table tbody');
    historyTableBodyEl.innerHTML = '';

    if (!history) history = [];

    // only show the most recent history
    var historyCounter = history.length - historyLimit;
    if (historyCounter <= 0) {
      historyCounter = 0;
      disableLoadMore();
    } else {
      enableLoadMore();
    }

    if (history.length === 0) return disableClearHistory();

    enableClearHistory();

    // add history rows
    for (var i = history.length - 1; i >= historyCounter; i--) {
      var historyRecordEl = getHistoryRecordEl(history[i]);
      historyTableBodyEl.append(historyRecordEl);
    }
  };

  var getDate = function () {
    // get current time and format
    var currentTime = new Date();
    var date = ('0' + currentTime.getUTCDate()).slice(-2);
    var month = ('0' + (currentTime.getUTCMonth() + 1)).slice(-2);
    var year = currentTime.getUTCFullYear();
    var hours = ('0' + currentTime.getUTCHours()).slice(-2);
    var minutes = ('0' + currentTime.getUTCMinutes()).slice(-2);
    var seconds = ('0' + currentTime.getUTCSeconds()).slice(-2);

    return date + '/' + month + '/' + year + ' ' + hours + ':' + minutes + ':' + seconds + ' GMT';
  };

  var prepareAndShowPreview = function (err, resource) {
    if (err) return displayError(wikiTranslations.error_saving, err);

    // update preview
    var content = getContentFromResource(resource);
    updatePreviewContent(content);
    checkEditorModified = false;
    changeTab('preview');

    // log updating the app content
    logAction('update');
  };

  var saveContent = function () {
    if (!tinymce.activeEditor) {
      return displayError(wikiTranslations.error_saving, 'TinyMCE is not active');
    }

    // load latest vault data
    loadHistoryFromVault(function(err, history) {
      if (err) return displayError(wikiTranslations.error_saving, err);

      // add current content to history
      var currentContent = tinymce.activeEditor.getContent({format: 'raw'});
      var timestamp = getDate();
      var dataObj = {
        viewer_name: metadata.actor && metadata.actor.displayName,
        data: currentContent,
        date: timestamp
      };

      if (!history) history = [];
      history.push(dataObj);
      var vaultResourceContent = JSON.stringify(history);

      if (metadata.target && metadata.target.id) {
        // update the existing vault resource
        updateVaultResource(vaultResourceContent, prepareAndShowPreview);
      } else {
        // create a new vault resource
        createVaultResource(vaultResourceContent, prepareAndShowPreview);
      }
    });
  };

  var clearHistory = function () {
    // confirm with the user that they want to delete the history
    if (!confirm(wikiTranslations.clear_history_verification)) return;

    loadHistoryFromVault(function(err, history) {
      if (err) return displayError(wikiTranslations.error_clearing_history, err);

      // create a new history array with the latest data
      var latestContent = (history.length > 0) ? history.pop().data : '';
      var timestamp = getDate();
      var dataObj = {
        viewer_name: metadata.actor && metadata.actor.displayName,
        data: latestContent,
        date: timestamp
      };
      var newHistory = [dataObj];
      var vaultResourceContent = JSON.stringify(newHistory);

      // remove history from the vault resource
      updateVaultResource(vaultResourceContent, function (err, savedResource) {
        if (err) return displayError(wikiTranslations.error_clearing_history, err);

        // update history in app
        var savedHistory = getHistoryFromResource(savedResource);
        updateHistoryContent(savedHistory);

        // log clearing history
        logAction('clear');
      });
    });
  };

  var loadMoreHistory = function () {
    if (historyLimit >= historyStore.length) return;

    // load additional history entries incrementally
    historyLimit += historyIncrement;
    updateHistoryContent(historyStore);
  };

  // languages taken from the TinyMCE langs directory
  var supportedLangs = ('ar,az,be,bg_BG,ca,cs,cs_CZ,da,de,de_AT,el,en_CA,eo,es,es_MX,et,fa_IR,' +
      'fi,fo,fr_CH,fr_FR,ga,gd,he_IL,hi_IN,hr,hu_HU,id,is_IS,it,ja,ka_GE,kab,km_KH,ko_KR,lt,lv,' +
      'mk_MK,nb_NO,nl,oc,pl,pt_BR,pt_PT,ro,ru,sk,sr,sv_SE,ta,ta_IN,tr,tr_TR,ug,uk,uk_UA,vi_VN,' +
      'zh_CN.GB2312,zh_CN,zh_TW').split(',');

  // used to convert between short and long language codes
  var languageMap = {
    bg: 'bg_BG',
    fa: 'fa_IR',
    fr: 'fr_FR',
    he: 'he_IL',
    hi: 'hi_IN',
    hu: 'hu_HU',
    is: 'is_IS',
    ka: 'ka_GE',
    km: 'km_KH',
    ko: 'ko_KR',
    mk: 'mk_MK',
    nb: 'nb_NO',
    no: 'nb_NO',
    pt: 'pt_PT',
    sv: 'sv_SE',
    se: 'sv_SE',
    vi: 'vi_VN',
    zh: 'zh_CN'
  };

  var getSupportedLang = function (lang) {
    // no language provided - default to English
    if (!lang) return 'en';

    // direct match of supported language
    if (supportedLangs.indexOf(lang) > -1) return lang;

    // check if long version exists for short lang string
    if (lang.length === 2 && languageMap[lang]) return languageMap[lang];

    // check if short version exists for long lang string
    if (lang.length > 2) return getSupportedLang(lang.slice(0, 2));

    // no match found - default to English
    return 'en';
  };

  var loadPreview = function () {
    // display loading message
    changeTab('loading');

    // get the latest content
    loadHistoryFromVault(function (err, history) {
      if (err) displayError(wikiTranslations.error_loading_content, err);

      // update the preview
      var previewContent = getContentFromHistory(history);
      updatePreviewContent(previewContent);

      // display the tab
      changeTab('preview');
    });
  };

  var loadEditor = function () {
    // display loading message
    changeTab('loading');

    // get the latest content
    loadHistoryFromVault(function (err, history) {
      if (err) displayError(wikiTranslations.error_loading_content, err);

      var editorContent = getContentFromHistory(history);

      // provide app language to editor
      var prefs = new gadgets.Prefs();
      var langPref = prefs.getLang();
      var lang = getSupportedLang(langPref);

      if (tinymce.activeEditor) {
        // update the existing editor
        updateEditorContent(editorContent);
      } else {
        // initialise a new editor
        tinymce.init({
          selector: '#text-area',
          mode: 'textareas',
          theme: 'modern',
          plugins: 'table',
          tools: 'inserttable',
          extended_valid_elements: 'a[href|target=_blank]',
          height: 200,
          language : lang,
          init_instance_callback: function () {
            updateEditorContent(editorContent);
          }
        });
      }

      // display the tab
      changeTab('editor');
      checkEditorModified = true;
    });
  };

  var loadHistory = function () {
    // display loading message
    changeTab('loading');

    // get the latest content
    loadHistoryFromVault(function (err, history) {
      if (err) displayError(wikiTranslations.error_loading_content, err);

      // update the history table
      updateHistoryContent(history);

      // display the tab
      changeTab('history');
    });
  };

  var editorContentModified = function () {
    if (!tinymce || !tinymce.activeEditor || !tinymce.activeEditor.isDirty()) return false;

    if (confirm(wikiTranslations.discard_changes_verification)) {
      // allow changes to be discarded
      checkEditorModified = false;
      tinymce.activeEditor.isNotDirty = true;
      return false;
    } else {
      return true;
    }
  };

  var loadTab = function (tabName) {
    // don't reload the current tab
    if (tabName === currentTab) return;
    if (currentTab === loading) return;

    // display discard changes confirmation if required
    if (checkEditorModified && editorContentModified()) return;

    checkEditorModified = false;

    // load the specified tab
    if (tabName === 'preview') return loadPreview();
    if (tabName === 'editor') return loadEditor();
    if (tabName === 'history') return loadHistory();
  };

  // setup interactions
  document.getElementById('preview-nav').onclick = function () {loadTab('preview');};
  document.getElementById('editor-nav').onclick = function () {loadTab('editor');};
  document.getElementById('history-nav').onclick = function () {loadTab('history');};
  document.getElementById('save-button').onclick = saveContent;
  document.getElementById('load-more-button').onclick = loadMoreHistory;
  document.getElementById('clear-button').onclick = clearHistory;
  document.getElementById('error-close').onclick = hideError;

  // initialise
  var editorScriptUrl = ((window.location.hostname === 'localhost') ? '//localhost/prod/wiki/' :
      '//shindig2.epfl.ch/gadget/prod/wiki/') + 'tinymce/tinymce.min.js';
  loadScript(editorScriptUrl);
  changeTab('loading');

  // get information about the app
  ils.getAppContextParameters(function (data) {
    if (data.error) return displayError(wikiTranslations.error_loading_app, data.error);

    // keep app context in memory
    metadata = data;

    // log opening of app
    logAction('access');

    // load the default tab
    loadPreview();
  });
})();
