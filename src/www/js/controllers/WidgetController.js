export default class WidgetController
{

    app;
    static instance;

    currentWidget;
    loadedWidgets;

    widgetImage;
    widgetName;
    widgetDescription;
    prevButton;
    nextButton;

    maxSizeID;

    constructor(_app)
    {
        this.app = _app;
        WidgetController.instance=this;
        this.loadedWidgets = [];
        this.init();
    }

    init()
    {
        this.prevButton = document.getElementById("prevWidget");
        this.nextButton = document.getElementById("nextWidget");
        this.widgetImage = document.getElementById("widgetImage");
        this.widgetDescription = document.getElementById("widgetDescription");
        this.widgetName = document.getElementById("widgetName");
        this.setupCurrentWidget(1);
    }

    deactiveButton(button)
    {
        button.disabled = true;
    }

    resetButtons(id)
    {
        if(id == 1)
            this.prevButton.disabled=true;
        else if(id == this.maxSizeID)
            this.nextButton.disabled=true;
        else
        {
            this.prevButton.disabled=false;
            this.nextButton.disabled=false; 
        }
    }

    switchWidget(direction)
    {
        this.switch(direction);
    }
    
    // FR1.2 Navigating the widgets catalogue (with Previous and Next buttons) and display of widget images, 
    // in addition to the description and asking price.
    async switch(direction)
    {
        let id = this.currentWidget.widgetID + (direction == 0 ? -1 : 1);

        if(id<=0)
        {   
            this.deactiveButton(this.prevButton);

            return;
        }
        let widget = await this.loadWidget(id);
        if(widget == null)
        {
            if(direction == 1)
            {
                this.deactiveButton(this.nextButton);
                this.maxSizeID = id-1;
            }
            return;
        }
        this.setCurrentWidget(widget);
        this.resetButtons(id);
    }

    async setupCurrentWidget(id)
    {
        await this.loadWidgetFromURL(id);
        this.setCurrentWidget(this.getWidget(id));
    }
    
    setCurrentWidget(widget)
    {
        this.currentWidget = widget;

        this.updateWidgetCard();
    }

    updateWidgetCard()
    {
        this.widgetName.innerHTML = this.formatPriceString(this.currentWidget.price);
        this.widgetImage.src = this.currentWidget.imageURL;
        this.widgetDescription.innerHTML = this.currentWidget.description;
    }

    validateID(id, direction)
    {
        if(id <= 0)
        {
            this.deactiveButton(this.prevButton);
            return false;
        }

        let widget = this.loadWidget(id);

        if(widget == null || widget == undefined)
        {
            console.log("widget null");
            if(direction == 1)
            {
                this.deactiveButton(this.nextButton);
            }
            return false;
        }

        console.log("passed");
        return true;
    }

    async loadWidget(id)
    {
        if(this.getWidget(id) != null)
            return this.getWidget(id);
        else
        {
            let widgetData = await this.loadWidgetFromURL(id);
            return this.callback(widgetData);
        }
    }

    callback(data)
    {   
        let obj = JSON.parse(data);
        let jsonData = obj.data;
        console.log("herer");
        if(obj.status != "success")
        {   
            alert("Could not load Widget: " + jsonData[0].reason);
            return null;
        }
        console.log("herer342342");
        return WidgetController.instance.createWidget(jsonData[0]);
    }

    async loadWidgetFromURL(id)
    {
        return await this.app.getRESTController().preformGetRequest("widgets/"+id, {}, true).done(this.callback);
    }

    createWidget(data)
    {
        let widget = new Widget(data.id, data.url, data.description, data.pence_price);
        this.loadedWidgets.push(widget);
        return widget;
    }

    getWidget(id)
    {
        for(let x in this.loadedWidgets)
        {
            if(this.loadedWidgets[x].widgetID == id)
                return this.loadedWidgets[x];
        }

        return null;
    }

    formatPriceString(pence)
    {
        return new Intl.NumberFormat('en-GB', {style: 'currency', currency: 'GBP', minimumFractionDigits: 2}).format(pence/100);
    }


}

export class Widget
{

    widgetID;
    imageURL;
    description;
    price;

    constructor(_id, _url, _description, _price)
    {
        this.widgetID= Number(_id);
        this.imageURL=_url;
        this.description = _description;
        this.price = Number(_price);
    }

   

}