import MapController from "./controllers/MapController.js";
import RESTController from "./controllers/RESTController.js";
import WidgetController from "./controllers/WidgetController.js";
import OrderController from "./controllers/OrderController.js";

class App
{

    mapController;
    restController;
    widgetController;
    orderController;

    constructor()
    {
        this.init();
    }

    init()
    {
        this.loadControllers();
    }
    
    loadControllers()
    {
        this.mapController = new MapController();
        this.restController = new RESTController("dm27752", "3WH8zb9p");
        this.widgetController = new WidgetController(this);
        this.orderController= new OrderController(this);
    }

    switchWidget(direction)
    {
        this.widgetController.switchWidget(direction);
    }

    addWidget()
    {
        this.orderController.addItem(this.widgetController.currentWidget);
    }

    newOrder()
    {
        this.orderController.createOrder();
    }

    completeOrder()
    {
        this.orderController.completeOrder();
    }

    getRESTController()
    {
        return this.restController;
    }
    
}

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    console.log("Running cordova-" + cordova.platformId + "@" + cordova.version);
    window.application = new App();
}

