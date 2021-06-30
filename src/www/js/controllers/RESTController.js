export default class RESTController
{

    oucu;
    password;

    BASE_URL;

    constructor(_oucu, _password)
    {
        this.oucu=_oucu;
        this.password=_password;
        this.setupRESTUrl();
    }

    setupRESTUrl()
    {
        this.BASE_URL = "http://137.108.92.9/openstack/api/";
        if (cordova.platformId === "browser")
            this.BASE_URL = "https://cors-anywhere.herokuapp.com/" + this.BASE_URL;
    }

    preformGetRequest(urlAddition, data, async)
    {
        let url = this.BASE_URL + (urlAddition == null ? "" : "/" + urlAddition);
        data.OUCU = this.oucu;
        data.password=this.password;

        console.log(url);


        return $.get({url: url, data: data, async: async});
    }

    preformPostRequest(urlAddition, data, async)
    {
        let url = this.BASE_URL + (urlAddition == null ? "" : "/" + urlAddition);
        data.OUCU = this.oucu;
        data.password=this.password;

        console.log(url);

        return $.post({url: url, data: data, async: async});
    }

    
}