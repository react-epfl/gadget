(function () {
  'use strict';

  var metadata = {};
  var historyStore = [];
  var historyIncrement = 5;
  var historyLimit = historyIncrement;
  var checkEditorModified = false;
  var currentTab;
  var appContext;

  var loadScript = function (scriptURL) {
    // load scripts from JS to avoid Shindig rendering them
    var scriptElem = document.createElement('script');
    scriptElem.setAttribute('type', 'text/javascript');
    scriptElem.setAttribute('src', scriptURL);
    document.body.appendChild(scriptElem);
  };

  var hideError = function () {
    // hide error message
    document.getElementById('error').classList.remove('active');
  };

  var logError = function (errMessage, errDetails) {
    // log error message and additional details
    console.error(errMessage);
    if (errDetails) console.error(errDetails);
  };

  var hideErrorTimeout;
  var displayError = function (errMessage, errDetails) {
    // display and log error message
    document.getElementById('error').classList.add('active');
    document.getElementById('error-message').innerHTML = errMessage;
    logError(errMessage, errDetails);

    // hide error message automatically after 5s
    clearTimeout(hideErrorTimeout);
    hideErrorTimeout = setTimeout(hideError, 5000);
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
    osapi.activitystreams.create(params).execute(function (data) {
      if (!data || !data.id || data.error) {
        var errDetails = data && data.error;
        logError('Error logging the ' + verb + ' action', errDetails);
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
      // add active class to the loading tab after 0.3s to try and avoid showing it
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

  var getContentFromHistory = function (history) {
    if (!history || history.length === 0) return '';

    // return the most recent entry from the history array
    var content = history[history.length - 1].data;

    return content;
  };

  var getHistoryFromResource = function (resource) {
    var history = [];
    if (resource.content) {
      // convert string to history object
      history = JSON.parse(JSON.parse(resource.content));
    }

    return history;
  };

  var loadHistoryFromAppData = function (cb) {
    var spaceId = metadata.provider && metadata.provider.inquiryPhaseId;
    if (!spaceId || spaceId === 'undefined') spaceId = metadata.provider && metadata.provider.id;
    if (!spaceId || spaceId === 'undefined') return cb('Parent space not available');

    var spaceContextId = 's_' + spaceId;

    // try to get the old app-data format for backwards compatibility
    osapi.appdata.get({userId: spaceContextId}).execute(function (data) {
      if (data && data.error) return cb(data.error);

      // if history app-data doesn't exist return an empty history array
      if (!data || !data[spaceContextId] || !data[spaceContextId].history ||
          data[spaceContextId].history.length === 0) {
        return cb(null, []);
      }

      // parse history data found in app-data
      var history = JSON.parse(data[spaceContextId].history);

      return cb(null, history);
    });
  };

  var loadHistoryFromVault = function (cb) {
    if (!metadata.storageId) return cb('Vault space not available');

    // query vault for resources created by this app
    ils.filterVault(metadata.storageId, null, metadata.generator.id, null, null, null, null, null,
        function (resources) {
      if (resources.error) return cb(resources.error);

      if (resources.length > 0 && resources[0].content) {
        // use the first resource returned from the vault
        var vaultResource = resources[0];

        // update metadata for saving
        if (!metadata.target) metadata.target = {};
        metadata.target.displayName = vaultResource.displayName;
        metadata.target.id = vaultResource.id;

        // get history object
        var history = getHistoryFromResource(vaultResource);

        cb(null, history);
      } else {
        // try to load existing app-data for backwards compatibility
        loadHistoryFromAppData(cb);
      }
    });
  };

  var loadHistory = function (cb) {
    if (appContext !== 'other' && (!metadata.generator || !metadata.generator.id)) {
      return cb('The app requested data before it initialised');
    }

    // load history from the correct location
    if (appContext === 'ils') {
      loadHistoryFromVault(cb);
    } else if (appContext === 'space') {
      loadHistoryFromAppData(cb);
    } else {
      cb(null, historyStore);
    }
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

  var updateHistoryTable = function (history) {
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

  var saveContentToAppData = function (history, cb) {
    if (!metadata.provider || !metadata.provider.inquiryPhaseId) {
      return cb('Parent space not available');
    }

    // create or update app-data for the app
    var spaceContext = 's_' + metadata.provider.inquiryPhaseId;
    osapi.appdata
      .update({
        userId: spaceContext,
        data: {
          history: JSON.stringify(history)
        }
      })
      .execute(function (data) {
        if (data && data.error) return cb(data.error);

        cb(null, history);
      });
  };

  var saveContentToVault = function (history, cb) {
    var vaultResourceContent = JSON.stringify(history);

    // check if a resource exists for updating or if a new resource should be created
    var saveFn = (metadata.target && metadata.target.id) ?
        updateVaultResource : createVaultResource;
    saveFn(vaultResourceContent, function (err, savedResource) {
      if (err) return cb(err);

      var history = getHistoryFromResource(savedResource);
      cb(null, history);
    });
  };

  var saveContent = function (content, history, cb) {
    // create history entry
    var timestamp = getDate();
    var dataObj = {
      viewer_name: (metadata.actor && metadata.actor.displayName) || '',
      data: content,
      date: timestamp
    };

    // add content to history
    if (!history) history = [];
    history.push(dataObj);

    // save or return history
    if (appContext === 'ils') {
      saveContentToVault(history, cb);
    } else if (appContext === 'space') {
      saveContentToAppData(history, cb);
    } else {
      cb(null, history);
    }
  };

  var save = function () {
    if (!tinymce.activeEditor) {
      return displayError(wikiTranslations.error_saving, 'TinyMCE is not active');
    }

    // load latest data
    loadHistory(function(err, history) {
      if (err) return displayError(wikiTranslations.error_saving, err);

      // get content from editor
      var currentContent = tinymce.activeEditor.getContent({format: 'raw'});

      // save current content
      saveContent(currentContent, history, function (err, history) {
        if (err) return displayError(wikiTranslations.error_saving, err);

        // update preview
        var savedContent = getContentFromHistory(history);
        updatePreviewContent(savedContent);
        checkEditorModified = false;
        changeTab('preview');

        // log updating the app content
        logAction('update');
      });
    });
  };

  var clearHistory = function () {
    // confirm with the user that they want to delete the history
    if (!confirm(wikiTranslations.clear_history_verification)) return;

    // load latest data
    loadHistory(function(err, history) {
      if (err) return displayError(wikiTranslations.error_clearing_history, err);

      // get the latest data from history
      var latestContent = (history.length > 0) ? history[history.length - 1].data : '';

      // save latest content
      saveContent(latestContent, [], function (err, savedHistory) {
        if (err) return displayError(wikiTranslations.error_saving, err);

        // update history in app
        historyStore = savedHistory;
        updateHistoryTable(savedHistory);

        // log clearing history
        logAction('clear');
      });
    });
  };

  var loadMoreHistory = function () {
    if (historyLimit >= historyStore.length) return;

    // load additional history entries incrementally
    historyLimit += historyIncrement;
    updateHistoryTable(historyStore);
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

  var loadPreviewTab = function () {
    // display loading message
    changeTab('loading');

    // get the latest content
    loadHistory(function (err, history) {
      if (err) displayError(wikiTranslations.error_loading_content, err);

      // update the preview
      var previewContent = getContentFromHistory(history);
      updatePreviewContent(previewContent);

      // display the tab
      changeTab('preview');
    });
  };

  var displayEditorWarning = function (reason) {
    // display a warning message
    document.getElementById('no-' + reason).style.display = 'block';
  };

  var loadEditorTab = function () {
    // display loading message
    changeTab('loading');

    // get the latest content
    loadHistory(function (err, history) {
      if (err) displayError(wikiTranslations.error_loading_content, err);

      var editorContent = getContentFromHistory(history);

      // provide app language to editor
      var prefs = new gadgets.Prefs();
      var langPref = prefs.getLang();
      var lang = getSupportedLang(langPref);

      var userType = metadata.actor && metadata.actor.objectType;
      var canEdit = (['graasp_editor', 'graasp_student'].indexOf(userType) > -1);

      // display warning messages
      if (appContext === 'ils' && !metadata.storageId) {
        // no vault space
        displayEditorWarning('vault');
      } else if (appContext === 'other') {
        // no storage
        displayEditorWarning('storage');
      } else if (appContext === 'space' && !canEdit) {
        // no permission
        displayEditorWarning('permission');
      }

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

  var loadHistoryTab = function () {
    // display loading message
    changeTab('loading');

    // get the latest content
    loadHistory(function (err, history) {
      if (err) displayError(wikiTranslations.error_loading_content, err);

      // update/reset data for history tab
      historyStore = history;
      historyLimit = historyIncrement;

      // update the history table
      updateHistoryTable(history);

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
    if (tabName === 'preview') return loadPreviewTab();
    if (tabName === 'editor') return loadEditorTab();
    if (tabName === 'history') return loadHistoryTab();
  };

  // setup interactions
  document.getElementById('preview-nav').onclick = function () {loadTab('preview');};
  document.getElementById('editor-nav').onclick = function () {loadTab('editor');};
  document.getElementById('history-nav').onclick = function () {loadTab('history');};
  document.getElementById('save-button').onclick = save;
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
    if (metadata.provider && metadata.provider.ilsRef) {
      appContext = 'ils';
    } else if (metadata.provider && metadata.provider.inquiryPhaseId &&
        metadata.provider.inquiryPhaseId !== 'undefined') {
      appContext = 'space';
    } else {
      appContext = 'other';
    }

    // log opening of app
    logAction('access');

    // load the default tab
    loadPreviewTab();
  });
})();
