export default class MapController
{

    platform;
    map;

    markers;
    lookupService;

    longitude;
    latitude;

    constructor()
    {
        this.init();
    }

    init()
    {
        this.createMap();
        this.markers = [];
        this.lookupService = new NominatimService();
        this.centreMap();
        console.log("Map Controller loaded.");
    }

    //FR2.1 Displaying a Map for the area around the current location of the salesperson when at the client's premises and placing or viewing an order.
    createMap()
    {
        this.platform = new H.service.Platform({
            apikey: "zqku_5Q-nQghEm7kglQZHemT6NXizuJ3_hL4AoOMRcs",
        });

        let defaultLayers = this.platform.createDefaultLayers();
        this.map = new H.Map(
            document.getElementById("mapContainer"),
            defaultLayers.vector.normal.map,
            {
                zoom: 15,
                center: { lat: 52.5, lng: 13.4 },
            }
        );

        this.setupMap(defaultLayers);

        navigator.geolocation.watchPosition((position)=>{
            this.longitude = position.coords.longitude;
            this.latitude = position.coords.latitude;
            this.centreMap();
        });
    }

    setupMap(defaultLayers)
    {
        let ui = H.ui.UI.createDefault(this.map, defaultLayers);
        let mapSettings = ui.getControl("mapsettings");
        let zoom = ui.getControl("zoom");
        let scalebar = ui.getControl("scalebar");
        mapSettings.setAlignment("top-left");
        zoom.setAlignment("top-left");
        scalebar.setAlignment("top-left");
        new H.mapevents.Behavior(new H.mapevents.MapEvents(this.map));
    }

    addMarker(longitude, latitude)
    {
        let marker = new H.map.Marker({lat: latitude, lng: longitude});
        this.map.addObject(marker);
        this.markers.push(marker);
     }

    addMarkers(jsonData)
    {
        jsonData.forEach(e => {
            this.addMarker(e.longitude, e.latitude);
        });
    }

    clearMarkers()
    {
        this.markers = [];
    }

    preformAddressLookup(address, safeCallback)
    {
        this.lookupService.getAddress(address, safeCallback);
    }

    centreMap() {
        // This is implemented for you and no further work is needed on it
        // Note: This can take some time to callback or may never callback,
        //       if permissions are not set correctly on the phone/emulator/browser
        navigator.geolocation.getCurrentPosition((position)=>{
            var point = {
                lng: position.coords.longitude,
                lat: position.coords.latitude,
            };
            this.map.setCenter(point);
        }, ()=>{}, {
            enableHighAccuracy: true,
        });
    }
}

/**
 * Use the OpenStreetMap REST API without flooding the server.
 * The API has antiflood protection on it that means we must not submit more than one request per second.
 * This function restricts requests to every five seconds, and caches responses to further reduce requests.
 *
 * v1.1 Chris Thomson / Stephen Rice: Dec 2020
 * 
 * Adapted into a class
 */
 class NominatimService {

    // PRIVATE VARIABLES AND FUNCTIONS - available only to code inside the function

    cache = {};
    queue = [];
    scheduled = null;

    scheduleRequest(delay) {
        console.log(
            "Nominatim: Processing next request in " + delay + "ms",
            Object.assign({}, queue)
        );
        this.scheduled = setTimeout(processRequest, delay);
    }

    safeCallback(item, delay) {
        try {
            // Callback with cached data
            item.callback(this.cache[item.address]);
        } finally {
            // Schedule next request even if callback fails
            scheduleRequest(delay);
        }
    }

    processRequest() {
        // Stop if queue is empty
        if (this.queue.length === 0) {
            console.log("Nominatim: Queue complete");
            this.scheduled = null;
            return;
        }

        // Get the next item from the queue
        var item = this.queue.shift();

        // Check for cached data for this address
        if (this.cache[item.address]) {
            console.log("Nominatim: Data found in cache", this.cache[item.address]);

            // Callback and schedule the next request immediately as we did not call the API this time
            safeCallback(item, 0);
        } else {
            // Address is not cached so call the OpenStreetMap REST API
            var url =
                "http://nominatim.openstreetmap.org/search/" +
                encodeURI(item.address) +
                "?format=json&countrycodes=gb";

            var onSuccess = function (data) {
                console.log("Nominatim: Received data from " + url, data);

                // Cache the response data
                this.cache[item.address] = data;

                // Callback and schedule the next request in 5 seconds time:
                // This avoids flooding the API and getting locked out. 1 second should be
                // enough, but if you have several pages open then you need to wait longer
                safeCallback(item, 5000);
            };

            // Call the OpenStreetMap REST API
            console.log("Nominatim: Sending GET to " + url);
            $.ajax(url, { type: "GET", data: {}, success: onSuccess });
        }
    }

    // PUBLIC FUNCTIONS - available to the view

    // Queued/Cached call to OpenStreetMap REST API
    // address: address string to lookup
    // callback: function to handle the result of the call
    getAddress(address, callback) {
        // Add the item to the queue
        this.queue.push({ address: address, callback: callback });
        console.log("Nominatim: Queued request", Object.assign({}, queue));

        // Schedule the next request immediately if not already scheduled
        if (!this.scheduled) scheduleRequest(0);
    };
}