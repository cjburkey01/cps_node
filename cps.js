'use strict';

console.log('Loading...')

// Require and instantiate the Koa library
const Koa = require('koa');
const app = new Koa();

// Allow funny business
const mount = require('koa-mount');

// Static file serving, such as the resources directory
const serve = require('koa-static');

// Routing with Koa
const route = require('koa-route');

// Read files
const fs = require('fs');

// Require pug, the format of webpage I've chosen to write.
// It's compiled into HTML via Middleware
// See: https://pugjs.org
const pug = require('js-koa-pug');

// data.json IS NOT SHIPPED IN THE REPO!
// It must have these keys:
/*
    {
        "apiKey": "<API_KEY_HERE>",
        "orgId": 1179
    }
*/
// The Cabarrus Pets Society RescueGroups Organization ID is 1179
// The API key is requested from RescueGroups
const config = JSON.parse(fs.readFileSync('data.json'));

// Requests to API
const api = (new require('./module/cps_api.js'))(config);

// This should probably stay 80, but it can depend on the host
const port = 80;

// Middleware
app.use(pug('views'));

// Routes
app.use(mount('/static', serve('static')));
staticRender('/', 'index');
staticRender('/dogs', 'dogs');
app.use(route.get('/dogs/:id', async (ctx, id) => {
    let dog = 'five';
    
    let data = await processSearch('Available', 1, 0, [
        'animalName',
        'animalStatus',
        'animalBirthdate',
        'animalPictures',
        'animalAdoptionFee',
        'animalAltered',
        'animalBirthdate',
        'animalBirthdateExact',
        'animalBreed',
        'animalDescriptionPlain',
        'animalAdoptionPending',
        'animalSex',
        'fosterEmail',
        'fosterFirstname',
        'fosterLastname',
        'fosterName',
    ], [
        {
            fieldName: 'animalID',
            operation: 'equals',
            criteria: id,
        }
    ]);
    
    if (data === null
            || data.foundRows === undefined
            || data.foundRows === null
            || data.foundRows < 1) {
        ctx.redirect('/dogs');
        return;
    }
    
    // Hacky way to get that first element
    let dat;
    for (let d in data.data) {
        dat = data.data[d];
        break;
    }
    
    ctx.render('dogs', {
        dog: dat,
    });
}));

// API Routes
app.use(route.get('/api/dog_list/:perPage/:page', async (ctx, perPage, page) => {
    let data = await processSearch('Available', perPage, page, [
        'animalID',
        'animalName',
        'animalStatus',
        'animalPictures',
    ], []);
    ctx.body = data;
}));

async function processSearch(available, perPage, currentPage, results, filters) {
    if (available !== undefined && available !== null) {
        filters.push({
            fieldName: 'animalStatus',
            operation: 'equals',
            criteria: available,
        });
    }
    let resp = await api.searchCps(perPage, currentPage, results, filters);
    
    // TERNARY MADNESS!
    let dat = (resp === null) ? null : resp.data;
    dat.error = ((dat !== null && dat.status == 'ok')
        ? null
        : ((dat !== null
            && dat !== undefined
            && dat.messages !== null
            && dat.messages !== undefined
            && dat.messages.generalMessages !== null
            && dat.messages.generalMessages !== undefined
            && dat.messages.generalMessages.length > 0)
                ? (dat.messages.generalMessages[0].messageText)
                : 'An error occurred'));
    
    return dat;
}

// Open the server
app.listen(port);
console.log(`Opened server on port ${port}`);

function staticRender(at, view) {
    app.use(route.get(at, async ctx => ctx.render(view)));
}
