/*set up dotenv*/
//https://www.npmjs.com/package/dotenv
const dotenv = require('dotenv')
dotenv.config()

const geoNamesApiID = process.env.geoNamesAPI_ID;
const weatherbitApikey = process.env.weatherbitAPI_KEY;
const pixabayApikey = process.env.pixabayAPI_KEY;

/*set up fetch to be used in API calls*/
const fetch = require("node-fetch");

// Require Express to run server and routes
const express = require("express");

// Start up an instance of app
const app = express();

/*Dependencies*/
const bodyParser = require("body-parser");

/* Middleware*/
//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Cors for cross origin allowance
const cors = require("cors");
app.use(cors());

// Initialize the main project folder
app.use(express.static('dist'));

const port = 3000;

// Setup Server
const server = app.listen(port, () => {
    console.log(`this is working! the server is running on localhost: ${port}`)
});


////Get picture of the city - using pixabay API (api documentation: https://pixabay.com/api/docs/)
const picBaseURL = 'https://pixabay.com/api/'

//Define getCurrentWeatherData function to GET data from geoname API
const getPicture = async (baseURL, cityName, apiKey) => {
    const res = await fetch(baseURL+"?key="+apiKey+"&q="+encodeURIComponent(cityName)+"&image_type=photo&page=1&per_page=3&orientation=horizontal");
    try {
        const data = await res.json();
        // console.log(data)
        // console.log(data.hits[0])
        if (data.hits[0] === undefined){
            //most likely means the city name user entered does not return any matches in the pixabay api (this api's own limiation, e.g. i tried "Mianyang"， it returned {"total":0,"totalHits":0,"hits":[]}). In this case, return a placeholder image
            return {picURL: "https://cdn.pixabay.com/photo/2017/06/08/09/47/lego-2383096_960_720.jpg", cityName: cityName};
        } else{
            return {picURL: data.hits[0].webformatURL, cityName: cityName};
        }        
    } catch (error) {
        console.log("error:", error);
    }
}

app.post("/pixabay", function(req, res){
    const cityName = req.body.cityName
    //console.log(cityName)
    // call pixabay API to get picture
    getPicture(picBaseURL, cityName, pixabayApikey)
        .then(function(data){
            res.send(data);
        })
});

////Get geo data - using geonames API (api documentation: http://www.geonames.org/export/geonames-search.html)
const geoNamesbaseURL = 'http://api.geonames.org/searchJSON'

//Define getGeoData function to GET data from geoname API
const getGeoData = async (baseURL, cityName, apiID, cityURL) => {
    const res = await fetch(baseURL+"?q={"+cityName+"}&maxRows=1&username="+apiID);
    try {
        const data = await res.json();
        // console.log(data)
        // console.log(data.geonames[0]);
        if (data.geonames[0] === undefined){
             //most likely means the city name user entered does not return any matches in the geoname api (e.g. i tried "aaaaa"， it returned { totalResultsCount: 0, geonames: [] }). In this case, return a data
             return {data: "user city name returns nothing", cityURL: cityURL};
        } else {
            return {data: data.geonames[0], cityURL: cityURL};
        }

        
    } catch (error) {
        console.log("error:", error);
    }
}

app.post("/GeoNames", function(req, res){
    // get user input of zipcode sent from client side
    const cityName = req.body.cityName
    const cityURL = req.body.picURL
    console.log(cityName, cityURL)
    
    // call weather API to get weather data
    getGeoData(geoNamesbaseURL, cityName, geoNamesApiID, cityURL)
        .then(function(data){
            //console.log(data)
            res.send(data);
        })
});




////Get weather data - using weatherbit API (api documentation: https://www.weatherbit.io/api/weather-current)
const weatherbitCurrentBaseURL = 'https://api.weatherbit.io/v2.0/current?'

//Define getCurrentWeatherData function to GET data from geoname API
const getCurrentWeatherData = async (baseURL, lat, lon, apiKey, des) => {
    const res = await fetch(baseURL+"lat="+lat+"&lon="+lon+"&key="+apiKey);
    try {
        const data = await res.json();
        //console.log({data: data.data[0], des: des})
        return {data: data.data[0], des: des};
    } catch (error) {
        console.log("error:", error);
    }
}

app.post("/WeatherbitCurrent", function(req, res){
    // get user input of zipcode sent from client side
    const lat = req.body.lat
    const lon = req.body.lng
    const des = req.body.des
    console.log(lat,lon, des.cityName, des.countryName, des.daysAway, des.cityURL)
    // call weather API to get weather data
    getCurrentWeatherData(weatherbitCurrentBaseURL, lat, lon, weatherbitApikey, des)
        .then(function(data){
            res.send(data);
        })
});


////Get weather data - using weatherbit API (api documentation: https://www.weatherbit.io/api/climate-normals)
const weatherbitNormalBaseURL = 'https://api.weatherbit.io/v2.0/normals?'

//Define getCurrentWeatherData function to GET data from geoname API
const getNormalWeatherData = async (baseURL, lat, lon, startDay, endDay, apiKey, des) => {
    const res = await fetch(baseURL+"lat="+lat+"&lon="+lon+"&start_day="+startDay+"&end_day="+endDay+"&tp=daily&key="+apiKey);
    try {
        const data = await res.json();
        //console.log(data)
        return {data: data.data[0], des: des};
    } catch (error) {
        console.log("error:", error);
    }
}

app.post("/WeatherbitNormal", function(req, res){
    // get user input of zipcode sent from client side
    
    const lat = req.body.lat
    const lon = req.body.lng
    const userDate = req.body.userDate
    const des = req.body.des

    //userDay is a date in YYYY-MM-DD format entered by user. I need to add and substract 7 days to create startDay & endDay. Later I can use API to calculate aggregated stats historically in this day range.
    console.log(lat,lon, userDate, des.cityName, des.countryName)

    // call weather API to get weather data
    getNormalWeatherData(weatherbitNormalBaseURL, lat, lon, userDate, userDate, weatherbitApikey, des)
        .then(function(data){
            res.send(data);
        })
});



