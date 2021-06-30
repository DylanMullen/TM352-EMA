export default class OrderController
{

    app;
    currentOrder;
    
    orderTable;
    orderBody;
    orderFooter;

    widgetAmount;
    agreedPrice;
    salesOUCU;
    clientID;

    constructor(_app)
    {
        this.app = _app;
        this.orderTable = document.getElementById("orderSummary");
        this.orderBody = document.getElementById("orderBody");
        this.widgetAmount = document.getElementById("widgetAmount");
        this.agreedPrice = document.getElementById("agreedPrice");
        this.salesOUCU = document.getElementById("salesPerson");
        this.clientID = document.getElementById("clientID");
        this.showTodaysMarkers();
    }

    //FR2.2 When clicking on Place NEW Order to start an empty order, displaying the orders along the day’s journey with markers, where the location of client’s addresses are used to place the markers.
    async showTodaysMarkers()
    {
        let orders = await this.retrieveAllOrders();
        let today = await this.retrieveTodaysOrderLocations(orders);

        this.app.mapController.addMarkers(today);
        this.app.mapController.centreMap();
    }

    async retrieveAllOrders()
    {
        let response = await this.app.getRESTController().preformGetRequest("orders/", {}, true);
        let jsonData = JSON.parse(response);
        console.log(jsonData);
        if(jsonData.status != "success")
        {

            console.log(jsonData.data);
            return;
        }
        return jsonData.data;
    }

    async retrieveTodaysOrderLocations(orders)
    {
        let response = [];
        console.log(orders);
        orders.map((e)=>
        {
            if(this.isToday(new Date(e.date)))
            {
                response.push({
                    longitude: e.longitude,
                    latitude: e.latitude
                })
            }
        });
        return response;
    }

    async isToday(date)
    {
        let now = new Date();
        console.log(date);
        return date.getDate() == now.getDate() && date.getMonth() == now.getMonth() && date.getYear() == now.getYear();
    }

    //FR2.2 When clicking on Place NEW Order to start an empty order, displaying the orders along the day’s journey with markers, where the location of client’s addresses are used to place the markers.
    async createOrder()
    {
        if(this.currentOrder != null)
        {
            if(!confirm("You currently have an order.\nWould you like to start again?"))
                return;
        }
        if(!this.validateOUCU(this.salesOUCU.value)) // FR1.1 Validating the OUCU starts with a letter and ends with a number.
        {
            alert("Error: OUCU is not valid"); 
            return;
        }

        let valid = await this.validateClientID();
        if(valid == null)
        {
            alert("Error: ClientID is not valid"); 
            return;
        }

        this.currentOrder = new Order(this.clientID.value, this.app.mapController.longitude, this.app.mapController.latitude);
        this.createTable(valid);
        this.showTodaysMarkers();
    }
    
    createTable(name)
    {
        this.orderTable.innerHTML = "";
        this.orderTable.appendChild(this.getTableCaption(name));
        this.orderTable.appendChild(this.getTableHeader());
        this.orderTable.appendChild(this.createTableBody());
        this.orderTable.appendChild(this.getTableFooter());

        this.orderBody = document.getElementById("orderBody");
        this.orderFooter = document.getElementById("orderFooter");
    }

    getTableCaption(name)
    {
        let caption = document.createElement("caption");
        let captionHeader = document.createElement("h3");
        let captionInformation = document.createElement("p");
        
        captionHeader.innerHTML = "ORDER SUMMARY";
        captionInformation.innerHTML = "Dear " + name + ",<br>Your summary for your recent order is below";
        caption.appendChild(captionHeader);
        caption.appendChild(captionInformation);    
        return caption;
    }

    getTableHeader()
    {
        let header = this.orderTable.createTHead();
        let row = header.insertRow(0);
        row.insertCell(-1).innerHTML = "Widget";
        row.insertCell(-1).innerHTML = "Amount";
        row.insertCell(-1).innerHTML = "Agreed Price";
        row.insertCell(-1).innerHTML = "Total";
        return header;
    }


    getTableFooter()
    {
        let tFoot = document.createElement("tfoot");
        let row = tFoot.insertRow();
        let totalCell = row.insertCell();
        let numberCell = row.insertCell();

        tFoot.id = "orderFooter";

        totalCell.colSpan = 3;
        totalCell.innerHTML = "TOTAL";

        numberCell.innerHTML = "£0.00";
        return tFoot;
    }

    createTableBody()
    {
        let tableBody = document.createElement("tbody");
        tableBody.id = "orderBody";
        return tableBody;
    }
    
    async validateClientID()
    {
        if(this.clientID == null)
        {
            alert("Error: ClientID cannot be left empty"); 
            return null;
        }
        
        let clientRes = await this.app.getRESTController().preformGetRequest("clients/" + this.clientID.value, {}, true);
        let jsonData = JSON.parse(clientRes);

        if(jsonData.status != "success")
        {
            alert("Error: " + jsonData.reason);
            return null;
        }

        return jsonData.data[0].name;
    }
    
    // FR1.1 Validating the OUCU starts with a letter and ends with a number.
    validateOUCU(oucu)
    {   
        return oucu.match(/^[a-zA-Z].*[0-9]$/); 
    }
    
    //FR1.4 Displaying the sum of ordered items and adding VAT to the agreed price of each of the order items at 20%.
    updateOrderTable(orderItem)
    {
        let id = orderItem.widgetID + "";
        let row = this.orderBody.insertRow(-1);

        row.insertCell(0).innerHTML = "Widget " + orderItem.widgetID;
        row.insertCell(1).innerHTML = this.currentOrder.getOrderItems()[id].amount;
        row.insertCell(2).innerHTML = this.formatPriceString(this.currentOrder.getOrderItems()[id].price);
        row.insertCell(3).innerHTML = this.formatPriceString(this.currentOrder.getOrderItems()[id].amount*this.currentOrder.getOrderItems()[id].price);
        
        this.currentOrder.getOrderItems()[id].row = "row.rowIndex";
        this.updateFooter();
    }

    updateFooter()
    {
        let cell = this.orderFooter.rows[0].cells[1];
        cell.innerHTML = this.formatPriceString(this.currentOrder.getVATPrice()) + 
            " (incl. "+ this.formatPriceString(this.currentOrder.getVAT()) + " in VAT)";
    }

    async completeOrder()
    {
        let orderID = await this.sendOrderREST();
        if(orderID == null)
            return;
        
        let orderItems = await this.sendOrderItems(orderID);
        if(!orderItems)
            return;
    }

    async sendOrderREST()
    {
        let response = await this.app.getRESTController().preformPostRequest("orders", 
            {client_id: this.clientID.value, longitude: this.currentOrder.longitude, latitude: this.currentOrder.latitude}, true);

        let jsonData = JSON.parse(response);

        console.log(jsonData);

        if(jsonData.status != "success")
        {
            alert("Error: Failed to create order. " + jsonData.data[0].reason);
            return null;
        }
        return jsonData[0].id;
    }

    async sendOrderItems(orderID)
    {
        let data = [];
        Object.keys(this.currentOrder.getOrderItems()).forEach((key)=>{
            data.push({
                order_id: orderID,
                widget_id: key,
                number: this.currentOrder.getOrderItems()[key].amount,
                pence_price: parseInt(this.currentOrder.getOrderItems()[key].price*100)
            })
        });

        let response = await this.app.getRESTController().preformPostRequest("orders", data , true);
        let jsonData = JSON.parse(response);
        if(response.status != "success")
        {
            alert("Error: Failed to submit order items. " + jsonData[0].reason);
            return false;
        }
        return true;
    }

    // FR1.3 Adding the currently displayed widget to the order items, including the amount and the agreed price.
    addItem(widget)
    {
        this.currentOrder.addOrderItem(widget, this.agreedPrice.value, this.widgetAmount.value);
        this.updateOrderTable(widget);
    }
    
    formatPriceString(pence)
    {
        return new Intl.NumberFormat('en-GB', {style: 'currency', currency: 'GBP', minimumFractionDigits: 2}).format(pence/100);
    }
}

class Order
{

    clientID;
    longitude;
    latitude;

    orderItems;

    currentPrice;

    constructor(_clientID, _longitude, _latitude)
    {
        this.clientID = _clientID;
        this.longitude = _longitude;
        this.latitude = _latitude;
        this.currentPrice=0;

        this.init();
    }

    init()
    {
        this.orderItems = {};
    }

    addOrderItem(item, agreedPrice, amount)
    {
        let id = item.widgetID;
        this.orderItems[id] = {
            price: agreedPrice,
            amount: amount
        };

        this.currentPrice += agreedPrice*amount;
    }

    removeOrderItem(item)
    {
        let index = orderItems.indexOf(item);
        if(index > -1)
            this.orderItems.splice(index, 1);
    }

    getOrderItems()
    {
        return this.orderItems;
    }

    getVATPrice()
    {
        return this.currentPrice + this.getVAT() ;
    }

    getVAT()
    {
        return ((this.currentPrice/10)*2);
    }
}