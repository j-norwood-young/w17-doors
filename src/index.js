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
const setup_template = require("./templates/setup.pug");
const login_template = require("./templates/login.pug");
const waiting_template = require("./templates/waiting.pug");
const events_template = require("./templates/events.pug");

const app = document.getElementById("app");

var setting_up = false;

var getFeed = function() {
    if (setting_up) return true;
    return axios.get(feed_url)
    .then(result => {
        app.innerHTML = events_template();

        const calendar = ical.parse(result.data);
        const vcalendar = new ICAL.Component(calendar);
        const location = vcalendar.getFirstPropertyValue('name');

        document.getElementById("location").innerHTML = location;

        var vevents = vcalendar.getAllSubcomponents("vevent");
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
    })
    .catch(err => {
        console.error(err);
    })
}

function blackout() {
	var now = new Date();
	var h = now.getHours();
	if ((h > 20) || (h < 6)) {
		document.getElementById("blackout").classList.remove("hide");
	} else {
		document.getElementById("blackout").classList.add("hide");
	}
}

var setReset = function() {
    var el = document.getElementById("logo");
    el.addEventListener("dblclick", function() {
        setup();
    });
}

var init = function() {
    blackout();
    getFeed();
    setInterval(getFeed, config.refresh);
    setInterval(blackout, config.refresh);
    setReset();
}

var setup = function() {
    setting_up = true;
    app.innerHTML = login_template();
    document.getElementById("Submit").addEventListener("click", (e) => {
        e.preventDefault();
        var username = document.getElementById("Email").value;
        var password = document.getElementById("Password").value;
        app.innerHTML = waiting_template();
        var locations = null;
        var rooms = null;
        axios.get(`${ config.api_url }/api/location?sort[name]=1&filter[active]=true`, {
            auth: {
                username,
                password
            }
        }).then(result => {
            locations = result.data.data;
            return axios.get(`${ config.api_url }/api/room?sort[name]=1`, {
                auth: {
                    username,
                    password
                }
            })
        }).then(result => {
            rooms = result.data.data;
            app.innerHTML = setup_template({ locations, rooms });
            document.getElementById("RoomSubmit").addEventListener("click", function(e) {
                e.preventDefault();
                setting_up = false;
                room_id = document.getElementById("Room").value;
                if (room_id) {
                    window.localStorage.setItem("room_id", room_id);
                    feed_url = config.feed_url + room_id;
                    init();
                }
            })
        })
        .catch(err => {
            app.innerHTML = login_template({ msg: "Username or password incorrect"} );
            console.error(err);
        })
    })
}

var feed_url = null;

const qs = QueryString.parse(location.search);

if (qs.room_id) {
    window.localStorage.setItem("room_id", qs.room_id);
}

var room_id = window.localStorage.getItem("room_id");
if (room_id === "undefined") room_id = null;
if (room_id) {
    feed_url = config.feed_url + room_id;
    app.innerHTML = waiting_template();
    init();
} else {
    setup();
}
