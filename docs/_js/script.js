// -- GLOBAL VARS

// for the changelog wrapper
var fullHeight, clippedHeight, wrapper, toggle;
// for the scrollToTarget() function
var rafID = 0, s_startTime = null, s_duration = 0;
var startY, scrollDelta;

// -- END -- GLOBAL VARS

// -- On Page Load --> Initialization
(function() {
	if(Element.prototype.addEventListener) {
		document.addEventListener("DOMContentLoaded",init,false);
	}
	else {
		window.onload = init;
	}
})();

function init(){

	// init changelog wrapper
	wrapper = document.getElementById('cl_wrapper');
	fullHeight = wrapper.clientHeight;
	var s = wrapper.getElementsByTagName('h3')[1];
	clippedHeight = getOffsetTop(s) - getOffsetTop(wrapper);
	toggle = document.getElementById('cl_toggle').getElementsByTagName('a')[0];
	hideCL(false);

	// if loading to #anchor section, make sure that anchor
	// isn't covered by header
	var hash = location.hash;
	if(hash.length > 1) {
		window.scrollBy(0, -1 * document.getElementById('header').clientHeight);
	}

	// cancel scroll animation on user interaction
	document.body.onmousewheel = cancelScroll;

	// check subnav positions, but only for browsers
	// that support the flexbox
	if(window.ie9) {
		document.documentElement.className = "ie9";
	}
	else {
		popupCheckInit();
		// prepare #anchor links for smooth scrolling
		setAnchorLinks();
	}

	// add download button functionality
	activateDLButton();

	// remove inner text from feedback link
	//var tb = document.querySelector('.feedback a');
	//if (tb.textContent) tb.textContent = "";
	//else tb.innerText = "";
	//tb.style.display = 'block';
};

function cancelScroll() {
	if(rafID) { 
		cancelAnimationFrame(rafID);
		rafID = 0;
	}
}

// -- Changelog show/hide functions
function hideCL(doScroll) {

	wrapper.style.height = clippedHeight + "px";

	if(toggle.textContent) toggle.textContent = 'show all';
	else toggle.innerText = 'show all';
	toggle.onclick = function(e){ showCL(); e.preventDefault()};

	if(doScroll) { 
		scrollToTarget('cl_wrapper',750,false); 
	}
}

function showCL() {
	wrapper.style.height = fullHeight + "px";

	if(toggle.textContent) toggle.textContent = 'show less';
	else toggle.innerText = 'show less';
	toggle.onclick = function(e){ hideCL(true); e.preventDefault()};
}

// -- Apply scrollToTarget() function to #anchor links
function setAnchorLinks() {

	anchors = document.getElementsByTagName('a');

	for (var a = 0; a < anchors.length; a++) {
		var anchor = anchors[a];
		if(anchor.hasAttribute('href')) {
			var h = anchor.getAttribute('href');
			if((h.length) && (h.charAt(0) == '#')) {
				
				var ht = ((h.substr(1) == '') ? 'null' : h.substr(1));
				if(ht != 'null') {
					var fbody = ('scrollToTarget("'+ht+'",750, true); event.preventDefault();');
					anchor.onclick = new Function('event', fbody);
				}
			}
		}
	}
}

// -- Smooth Scrolling function

function scrollToTarget(targetID, duration, setHash) {
	var target = document.getElementById(targetID) || targetID;
	if(!target) {return;}
	var header = document.getElementById('header');

	// do we want to update the hashtag in the address?
	if(setHash) {
		if(history.pushState) { history.pushState(null,null,'#'+targetID); }
		else { location.hash = targetID; }
	}

	// get target's absolute Y position relative to document top + header
	var targetY = getOffsetTop(target) - (header.clientHeight + 15);
	if(targetY < 0) { 
		targetY = 0; 
	}
	else if(targetY > document.documentElement.scrollHeight) { 
		targetY = document.documentElement.scrollHeight; 
	}

	// init global vars for scroll animation
	startY = document.documentElement.scrollTop;
	scrollDelta = targetY - startY;
	s_duration = duration;

	if(rafID) { cancelAnimationFrame(rafID); }
	rafID = requestAnimationFrame(sttAnimate);
}

function sttAnimate(timeStamp) {
	if(s_startTime === null) { 
		s_startTime = timeStamp;
	}
	var time = timeStamp - s_startTime;
	if (time < s_duration) {
		var y = Math.floor(easeOut(startY, scrollDelta, time, s_duration,3));
		window.scrollTo(0,y);
		rafID = requestAnimationFrame(sttAnimate);
	}
	else {
		cancelAnimationFrame(rafID);
		rafID = 0;
		s_startTime = null;
	}

}

// -- Easing functions (used by scrollToTarget)
function easeOut(s, c, t,d,exp) {
	if (exp == undefined) exp = 4;
	return s + c * (1 - Math.pow(1 - t/d, exp));
}

function easeInOut(s, c, t,d) {
	return -c/2 * (Math.cos(Math.PI*t/d) - 1) + s;
}

// -- calculate absolute offset from document top edge
function getOffsetTop(t) {
	var target = t;
	var top = target.offsetTop;
	while(target.offsetParent) {
		target = target.offsetParent;
		top += target.offsetTop;
	}
	return top;
}

// -- Check subnav position

// -- add event listener when a subnav is displayed
function popupCheckInit() {

	var lis = document.querySelectorAll('.nav > li');
	for(var l in lis) {
		lis[l].onmouseenter = function(e) { popupCheck(this); };
	}
}

// -- check if the subnav can be displayed or must be repositioned
function popupCheck(target) {

	var children = target.childNodes;
	for(c in children) {
		var child = children[c];
		if(child.nodeName == 'UL' && child.className.search('subnav') != -1) {
			var nav = child;
			// first, set to default (left) to see if it fits
			nav.style.left = "0px";
			nav.className = toggleClass(nav.className, 'sn_right', 'remove');
			// calculate left edge position
			var leftEdge = nav.offsetLeft;
			var p = nav.offsetParent;
			while(p) {
				leftEdge += p.offsetLeft;
				p = p.offsetParent;
			}
			// calculate right edge position
			var rightEdge = leftEdge + nav.scrollWidth;
			// distance from right edge to window right edge
			var dRight = document.body.offsetWidth - rightEdge;

			// if it overflows the right window edge
			if(dRight < 0) {
				// calculate where to position right edge so that
				// it aligns with target's right edge
				var rPos = nav.scrollWidth - target.offsetWidth;

				var leftPos = 0;

				// if it overflows window when aligned right, then align
				// it wherever there is more space and offset so that it 
				// doesn't overflow the window
				if(rPos > leftEdge) {
					var r_of = leftEdge - rPos; // overflow if align right
					var l_of = Math.abs(dRight); // overflow if align left
					if(r_of >= l_of) {
						// align left (default) - overflow
						leftPos = -1 * l_of;
					}
					else {
						// align right + overflow
						leftPos = -1 * (rPos + r_of);
						nav.className = toggleClass(nav.className, 'sn_right', 'add');
					}
				}
				// no overflow, just align right
				else {
					leftPos = -1 * rPos;
					nav.className = toggleClass(nav.className, 'sn_right', 'add');
				}

				nav.style.left = leftPos + "px";
				
			}
		}
	}
}

function toggleClass(cn,c, m) {

	// cn = className, c = class, m = mode

	var result;

	if(m === undefined) {
		result = (cn.search(c) != -1) ? cn.replace(c, '') : (cn + ' ' + c);
	}
	else {
		if(m == "add") {
			result = (cn.search(c) != -1) ? cn : (cn + ' ' + c);
		}
		else {
			result = (cn.search(c) != -1) ? cn.replace(c, '') : cn;
		}
	}
	result = result.trim();
	while(result.search("  ") != -1) {
		result = result.replace("  ", " ");
	}

	return result;
}

function activateDLButton() {
	var btn = document.getElementById('downloadButton');
	btn.onclick = function(e) {
		window.location = 'https://github.com/awesome-ad/aweControlPicker/releases/download/v1.4/aweControlPicker.zip';
	}
	btn.addEventListener("dragstart", function(e){e.preventDefault}, false);

	var vcBtn = document.getElementById('viewChangeLog');
	vcBtn.onclick = function(e){
		e.preventDefault;
		scrollToTarget('changelog', 500, 15, false);
	}
}