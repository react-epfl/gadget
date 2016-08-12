"use strict";

var ut = ut || {}
ut.commons = ut.commons || {}
ut.commons.utils = ut.commons.utils || {}

ut.commons.utils.printDebugInformation = function () {
   console.log("*** ut.commons.utils.printDebugInformation ***")

   if (typeof osapi == 'object') {
      console.log("osapi: " + osapi);
   } else {
      console.log("osapi is undefined.");
   }
   if (typeof gadgets == 'object') {
      console.log("gadgets: " + gadgets);
   } else {
      console.log("gadgets is undefined.");
   }

   if (typeof osapi == 'object') {
      var batch = osapi.newBatch();
      batch.add('context', osapi.context.get());
      batch.add('viewer', osapi.people.getOwner());
      batch.add('app', osapi.apps.get({contextId: "@self"}));
      batch.execute(function (response) {
         console.log("actor.id (viewer.id): " + response.viewer.id);
         var uncapitalizedContextType = response.context.contextType.slice(1);
         var contextType = uncapitalizedContextType.charAt(0).toUpperCase() + uncapitalizedContextType.slice(1);
         console.log("objectType (context.contextType): " + contextType);
         console.log("generator.id (app.id): " + response.app.id);

      });
   }

   console.log("*** /debugInformation ***")
}

/**
 * If "gadgets" object exists, call gadgets.window.adjustHeight.
 * @return {undefined}
 */
var resizeRequestPending = false
var resizeExecutionMillis = 0
var resizeCollectionMillis = 250
ut.commons.utils.gadgetResize = function resize() {

   function checkResizeTask() {
      resizeRequestPending = true
      if (Date.now() > resizeExecutionMillis) {
         // console.log("calling gadgets.window.adjustHeight().");
         gadgets.window.adjustHeight();
         resizeRequestPending = false
      } else {
         setTimeout(checkResizeTask, resizeCollectionMillis)
      }
   }

   if (typeof gadgets == 'object') {
      if (gadgets.window) {
         resizeExecutionMillis = Date.now() + resizeCollectionMillis
         if (!resizeRequestPending) {
            checkResizeTask()
         }
      } else {
         console.warn('Please add <Require feature="dynamic-height"/> to your xml file.')
      }
   }
}

/**
 * Generates and returns a random UUID.
 * @return {String}   Returns a string value containing a random UUID
 */
ut.commons.utils.generateUUID_deprecated = function () {
   return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
       s4() + '-' + s4() + s4() + s4();

   function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
   };
}

/**
 * Generates and returns a random UUID with a much smaller collision chance
 * due to integration of a timestamp. It's a tiny little bit slower, though.
 * @return {String}   Returns a string value containing a random UUID
 */
ut.commons.utils.generateUUID = function () {
   var d = new Date().getTime();
   var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
   });
   return uuid;
};

function isStringEmpty(inputStr) {
   if (null == inputStr || "" == inputStr) {
      return true;
   } else {
      return false;
   }
}

/**
 * Converts a string with line breaks into a string with <br/>s.
 * Useful to get a multi-line text from a textarea and put it into a <p>.
 * @return {String}   Returns a string with line breaks replaced by <br> tags.
 */
function nl2br(str, is_xhtml) {
   var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br/>' : '<br>';
   return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}

ut.commons.utils.getAttributeValue = function (attributes, attributeName, defaultValue) {
   var lcName = attributeName.toLowerCase()
   if (attributes[lcName])
      return attributes[lcName]
   else if (typeof defaultValue !== "undefined")
      return defaultValue
   else
      return null
}

ut.commons.utils.addAttributeValueToOptions = function (attributes, attributeName, options, defaultValue) {
   var lcName = attributeName.toLowerCase()
   if (attributes[lcName])
      options[attributeName] = attributes[lcName]
   else if (typeof defaultValue !== "undefined")
      options[attributeName] = defaultValue
}

ut.commons.utils.getBooleanAttributeValue = function (attributes, attributeName, defaultValue) {
   var value = ut.commons.utils.getAttributeValue(attributes, attributeName, defaultValue)
   if (value) {
      if (typeof value === "boolean")
         return value
      var lcValue = value.toLowerCase().trim()
      switch (lcValue) {
         case "true":
         case "on":
            return true
         default:
            return false
      }
   } else
      return false
}

ut.commons.utils.getIntegerAttributeValue = function (attributes, attributeName, defaultValue) {
   var value = ut.commons.utils.getAttributeValue(attributes, attributeName, defaultValue)
   switch (typeof value) {
      case "string":
         return parseInt(value)
      case "number":
         return Math.round(value)
      default:
         return defaultValue
   }
}

ut.commons.utils.getCommonsPath = function () {
   var endPart = "/commons/"
   if (typeof golab !== 'undefined' && golab.common && golab.common.resourceLoader)
      return golab.common.resourceLoader.getBaseUrl() + endPart
   var commonsPath = "http://go-lab.gw.utwente.nl/sources" + endPart
   var currentHref = window.location.href
   var trySubPath = function (subPath) {
      var index = currentHref.lastIndexOf(subPath)
      if (index >= 0)
         commonsPath = currentHref.substr(0, index) + endPart
      else
         null
   }
   var subPaths = ["/tools/", "/labs/", "/web/"]
   for (var index in subPaths) {
      var subPath = subPaths[index]
      if (trySubPath(subPath))
         break
   }
   return commonsPath
}

ut.commons.utils.commonsPath = ut.commons.utils.getCommonsPath();

ut.commons.utils.getCommonsImagesPath = function () {
   return ut.commons.utils.getCommonsPath() + "images/"
}

ut.commons.utils.commonsImagesPath = ut.commons.utils.getCommonsImagesPath();

ut.commons.utils.getCommonsImagesDataSourcesPath = function () {
   return ut.commons.utils.getCommonsPath() + "images/dataSources/"
}

ut.commons.utils.commonsImagesDataSourcesPath = ut.commons.utils.getCommonsImagesDataSourcesPath();

// automatically calls "gadgetResize" if the window size changes
// please call it only once...
/*
 // this function breaks in Graasp
 ut.commons.utils.gadgetAutoResize = function() {
 window.onresize = function(event) {
 window.clearTimeout(this.resizeTimeoutId);
 return this.resizeTimeoutId = setTimeout((function() {
 return ut.commons.utils.gadgetResize();
 }), 500);
 };
 ut.commons.utils.gadgetResize();
 }
 */

ut.commons.utils.equalizeHeight = function () {
   var elementClassNames = []
   var addElementClassNames = function (classNames) {
      if (Array.isArray(classNames)) {
         for (var i in classNames) {
            addElementClassNames(classNames[i])
         }
      } else {
         elementClassNames.push(classNames)
      }
   }
   addElementClassNames(Array.prototype.slice.call(arguments))
   var equalize = function () {
      var elements = []
      var i = 0
      for (i in elementClassNames) {
         var element = $(elementClassNames[i])
         element.each(function (i) {
            elements.push($(element[i]))
         })
      }
      if (elements.length == 0)
         return
      var heights = []
      var maxHeight = 0
      var minHeight = Number.MAX_VALUE
      for (i in elements) {
         var height = elements[i].height()
         heights.push(height)
         maxHeight = Math.max(maxHeight, height)
         minHeight = Math.min(minHeight, height)
      }
      if (minHeight > 0) {
         for (i in elements) {
            if (maxHeight > heights[i])
               elements[i].height(maxHeight)
         }
      } else {
         setTimeout(equalize, 200)
      }
   }
   if (elementClassNames.length) {
      equalize()
   }
}

/*
 * Tries to find the nearest parent element which has a vertical scroll bar
 * and if found, set the scroll top, so that the element becomes visible
 *
 */
ut.commons.utils.scrollVerticalToVisible = function (element) {
   var newScrollTop, scrollElement, newScrollElement;
   if (element.length === 1) {
      scrollElement = element;
      while (scrollElement && scrollElement.css("overflow-y") !== "scroll") {
         newScrollElement = scrollElement.parent();
         if (newScrollElement !== scrollElement && scrollElement.length > 0 && scrollElement[0].tagName != "HTML") {
            scrollElement = newScrollElement;
            //console.log(scrollElement)
            //console.log(scrollElement[0].tagName)
            //console.log(scrollElement.css("overflow-y"))
         } else {
            scrollElement = null
         }
      }
      if (scrollElement) {
         newScrollTop = element.position().top + element.height() - scrollElement.height();
         scrollElement.scrollTop(newScrollTop);
      } else {
         //console.warn("ut.commons.utils.scrollVerticalToVisible: could not find parent scroll element of");
         //console.warn(element);
      }
   } else {
      console.warn("ut.commons.utils.scrollVerticalToVisible: expects only 1 DOM element, but found " + element.length)
      console.warn(element);
   }
};

/*
 The above code does not always work. And the code (still under development) below does also not always work.

 function printPositionInfo(element, label) {
 console.log(label + ": offset: " + JSON.stringify(element.offset()) + ", position: " + JSON.stringify(element.position())
 + ", height: " + element.height() + ", position: " + element.css("position"))
 }

 ut.commons.utils.scrollVerticalToVisible = function (element) {
 var newScrollTop, scrollElement, newScrollElement;
 if (element.length === 1) {
 scrollElement = element;
 var elementTopPosition = 0;
 while (scrollElement && scrollElement.css("overflow-y") !== "scroll") {
 console.log(scrollElement)
 printPositionInfo(scrollElement, "")
 if (scrollElement.css("position")!=="static"){
 elementTopPosition += scrollElement.position().top
 }
 newScrollElement = scrollElement.parent();
 if (newScrollElement !== scrollElement) {
 scrollElement = scrollElement.parent();
 } else {
 scrollElement = null
 }
 }
 console.log("end of search for scrollParent, elementTopPosition: " + elementTopPosition)
 var scrollParent = element.scrollParent()
 if (scrollElement) {
 var scrollToVisible = function () {
 //element.css("background", "red")
 console.log(element)
 console.log(scrollElement)
 console.log(scrollParent)
 printPositionInfo(element, "element")
 printPositionInfo(scrollElement, "scrollElement")
 var elementPosition = element.position()
 //console.log("element.postion.top: " + element.position().top + ", element.height(): " + element.height()
 //+ ", scrollElement.height(): " + scrollElement.height() + ", scrollElement.position().top: " + scrollElement.position().top)
 var beforeScrollTop = scrollElement.scrollTop()
 var newScrollTop = element.position().top + Math.min(element.height(), scrollElement.height()) - scrollElement.height() - scrollElement.position().top;
 var useElementHeight = Math.min(element.height(), scrollElement.height())
 newScrollTop = elementTopPosition + useElementHeight - scrollElement.height() - scrollElement.position().top;
 if (newScrollTop<0) {
 newScrollTop = 0
 }
 scrollElement.scrollTop(newScrollTop);
 setTimeout(function () {
 var afterScrollTop = scrollElement.scrollTop()
 console.log("beforeScrollTop: " + beforeScrollTop + ", newScrollTop: " + newScrollTop + ", afterScrollTop: " + afterScrollTop)

 }, 50)
 }
 //scrollToVisible()
 setTimeout(scrollToVisible, 50)
 } else {
 console.warn("ut.commons.utils.scrollVerticalToVisible: could not find parent scroll element of");
 console.warn(element);
 }
 } else {
 console.warn("ut.commons.utils.scrollVerticalToVisible: expects only 1 DOM element, but found " + element.length)
 console.warn(element);
 }
 };

 */

var specialChars = [
   {
      char: '.',
      encodeRegExp: /\./g,
      decodeRegExp: /\\u002E/g,
      encodedChar: "\\u002E"
   },
   {
      char: '$',
      encodeRegExp: /\$/g,
      decodeRegExp: /\\u0024/g,
      encodedChar: "\\u0024"
   },
]

var encodeSpecialJsonKeyChars = function (key) {
   var encodedKey = key
   for (var i in  specialChars) {
      encodedKey = encodedKey.replace(specialChars[i].encodeRegExp, specialChars[i].encodedChar)
   }
   return encodedKey
}

var decodeSpecialJsonKeyChars = function (key) {
   var decodedKey = key
   for (var i in  specialChars) {
      decodedKey = decodedKey.replace(specialChars[i].decodeRegExp, specialChars[i].char)
   }
   return decodedKey
}

var codeSpecialKeyCharsInJson = function (json, codeFunction) {
   switch (typeof json) {
      case "object":
         for (var key in json) {
            codeSpecialKeyCharsInJson(json[key], codeFunction);
            if (typeof(key) === "string") {
               var codedKey = codeFunction(key)
               if (codedKey !== key) {
                  var value = json[key]
                  delete json[key]
                  json[codedKey] = value
               }
            }
         }
         break
      default:
         return json
   }
}

ut.commons.utils.encodeSpecialKeyCharsInJson = function (json) {
   codeSpecialKeyCharsInJson(json, encodeSpecialJsonKeyChars)
}

ut.commons.utils.decodeSpecialKeyCharsInJson = function (json) {
   codeSpecialKeyCharsInJson(json, decodeSpecialJsonKeyChars)
}