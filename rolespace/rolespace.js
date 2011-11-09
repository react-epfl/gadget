google.load("feeds", "1");

var initialize = function() {
	$(window).adjustHeight(500);
	// var prefs = new gadgets.Prefs();
	var url = // prefs.getString("feed") ||
	"http://newsrss.bbc.co.uk/rss/newsonline_world_edition/front_page/rss.xml";
	fetch(url);
};

var fetch = function(url) {
	var feed = new google.feeds.Feed(url);
	feed.setNumEntries(20);
	feed.load(function(result) {
		var container = document.getElementById("feed");
		$(container).html("");
		if (!result.error) {
			createTitleElt(url, result.feed, container).appendTo(container);
			for ( var i = 0; i < result.feed.entries.length; i++) {
				createEntryElt(result.feed.entries[i]).appendTo(container);
			}
		} else {
			createErrorElt(url, result.error, container).appendTo(container);
		}
		$(container).fadeIn();
	});
};

var createEntryElt = function(entry) {
	var entryElt = $("<a/>").addClass("entry").html(entry.title).attr("href",
			entry.link);
	var contentElt = $("<div/>").addClass("content").html(entry.content)
			.appendTo(entryElt);
	var linkElt = $("<a/>").addClass("entryLink").text("read").attr("title",
			"in a new window").attr("href", entry.link).appendTo(contentElt);
	contentElt.find("a").attr("target", "_blank");
	entryElt
			.click(function(event) {
				if (event.target !== this && event.target.tagName === "A") {
					if (event.target.href.substring(0, 11) !== "javascript:") {
						window.open(event.target.href);
					}
					event.preventDefault();
					return false;
				}
				var feed = document.getElementById("feed");
				var oldSel = typeof feed.selectedEntry !== "undefined" ? feed.selectedEntry
						: null;
				if (oldSel) {
					$(oldSel).toggleClass("selectedEntry");
					$(oldSel).children().slideUp();
				}
				if (oldSel === this) {
					feed.selectedEntry = null;
				} else {
					feed.selectedEntry = this;
					$(this).toggleClass("selectedEntry");
					$(this).children().slideDown();
				}
				event.preventDefault();
				return false;
			});
	return entryElt;
};

var createTitleElt = function(url, feed, container) {
	var entryElt = $("<a/>").addClass("entry").addClass("title").html(
			feed.title).attr("href", feed.link);
	var contentElt = $("<div/>").addClass("content").html(feed.description)
			.appendTo(entryElt);
	var linkElt = $("<a/>").addClass("entryLink").text("website").attr("title",
			"opens in a new window").attr("href", feed.link).appendTo(
			contentElt);
	contentElt.find("a").attr("target", "_blank");
	var feedUrlElt = $("<div/>").css("margin-top", "1em").appendTo(contentElt);
	$("<span/>").css("font-weight", "bold").text("Feed URL: ").appendTo(
			feedUrlElt);
	var feedUrlInput = $("<input/>").attr("type", "text").css("width", "50%")
			.val(url).click(function() {
				this.setSelectionRange(0, this.value.length);
			}).appendTo(feedUrlElt);
	var feedUrlUpdate = $("<a/>").addClass("entryLink").text("set as current")
			.attr("title", "the feed located at the URL on the left").attr(
					"href", "javascript:void(0)").appendTo(feedUrlElt);
	createExamplesElt(feedUrlInput, feedUrlUpdate).appendTo(contentElt);
	feedUrlUpdate.click(function(event) {
		$(container).fadeOut(function() {
			fetch(feedUrlInput.val());
		});
	});
	entryElt
			.click(function(event) {
				if (event.target !== this && event.target.tagName === "A") {
					if (event.target.href.substring(0, 11) !== "javascript:") {
						window.open(event.target.href);
					}
					event.preventDefault();
					return false;
				} else if (event.target !== this
						&& event.target.tagName !== "DIV") {
					event.preventDefault();
					return false;
				}
				var feed = document.getElementById("feed");
				var oldSel = typeof feed.selectedEntry !== "undefined" ? feed.selectedEntry
						: null;
				if (oldSel) {
					$(oldSel).toggleClass("selectedEntry");
					$(oldSel).children().slideUp();
				}
				if (oldSel === this) {
					feed.selectedEntry = null;
				} else {
					feed.selectedEntry = this;
					$(this).toggleClass("selectedEntry");
					$(this).children().slideDown();
				}
				event.preventDefault();
				return false;
			});
	return entryElt;
};

var createErrorElt = function(url, error, container) {
	var entryElt = createTitleElt(url, {
		title : "Feed error",
		description : error.message,
		link : "javascript:void(0)"
	}, container);
	entryElt.addClass("selectedEntry");
	entryElt.unbind();
	entryElt.find(".content").css("display", "block");
	return entryElt;
};

var createExamplesElt = function(feedUrlInput, feedUrlUpdate) {
	var examplesElt = $("<div/>");
	$("<span/>").text("Examples: ").css("font-weight", "bold").appendTo(
			examplesElt);
	createExampleElt(
			"BBC News",
			"http://newsrss.bbc.co.uk/rss/newsonline_world_edition/front_page/rss.xml",
			feedUrlInput, feedUrlUpdate).appendTo(examplesElt);
	$("<span/>").text(", ").appendTo(examplesElt);
	createExampleElt("ROLE", "http://www.role-project.eu/?feed=atom",
			feedUrlInput, feedUrlUpdate).appendTo(examplesElt);
	return examplesElt;
};

var createExampleElt = function(text, url, feedUrlInput, feedUrlUpdate) {
	return $("<a/>").text(text).attr("href", "javascript:void(0)").attr(
			"title", "then click 'set as current'").click(function() {
		feedUrlInput.val(url);
		feedUrlUpdate.fadeOut().fadeIn();
	});
};
