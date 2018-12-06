import './sass/style.scss';
const QueryString = require("query-string");
const config = require("../config/development.json");
const axios = require("axios");
const ical = require("ical.js");
const moment = require("moment-timezone");
moment.tz.setDefault(config.timezone);

const next_events_template = require("./templates/next-events.pug");
const primary_event_template = require("./templates/primary-event.pug");
const no_event_template = require("./templates/no-event.pug");

const qs = QueryString.parse(location.search);
var feed_url = config.test_feed;

if (qs.room_id) {
    feed_url = config.feed_url + qs.room_id;
}

var getFeed = function() {
    axios.get(feed_url)
    .then(result => {
        // console.log(result);
        const calendar = ical.parse(result.data);
        const vcalendar = new ICAL.Component(calendar);
        const location = vcalendar.getFirstPropertyValue('name');

        document.getElementById("location").innerHTML = location;

        var vevents = vcalendar.getAllSubcomponents("vevent");
        // console.log(vevents);
        var events = vevents.map(vevent => {
            return {
                name: vevent.getFirstPropertyValue("summary"),
                starttime: moment(vevent.getFirstPropertyValue("dtstart").toString()).format(),
                endtime: moment(vevent.getFirstPropertyValue("dtend").toString()).format(),
                description: vevent.getFirstPropertyValue("description")
            };
        });
        var current = events.find(event => moment().isBetween(event.starttime, event.endtime));
        if (current) {
            document.getElementById("primaryEvent").innerHTML = primary_event_template({ moment, event: current });
        }
        var future = events.filter(event => moment().isBefore(event.starttime));
        if (future.length) {
            document.getElementById("nextEvents").innerHTML = next_events_template({ moment, events: future });
        } else {
            document.getElementById("nextEvents").innerHTML = no_event_template();
        }
        // console.log({ events });
    })
    .catch(err => {
        console.error(err);
    })
}

function blackout() {
	var now = new Date();
	var h = now.getHours();
	// console.log(h);
	if ((h > 20) || (h < 6)) {
		document.getElementById("blackout").classList.remove("hide");
	} else {
		document.getElementById("blackout").classList.add("hide");
	}
}

var init = function() {
    blackout();
    getFeed();
    setInterval(getFeed, config.refresh);
    setInterval(blackout, config.refresh);
}

init();
