const http = require('http')
const https = require('https')
const DomParser = require('dom-parser') 
const menuUrl = 'https://our-common-menu.acompany.com'

function commonGet(protocol, url){
    return new Promise((res, reject) => {
        protocol.get(url, response => {
            let data = ''

            response.on('data', chunk => {
                data += chunk
            })

            response.on('end', () => {
                res(data)
            })
        }).on("error", error => reject("Error: ", error))
    })
}

function transclude(body, menu){
    const parser = new DomParser()
    const dom = parser.parseFromString(menu)
    const prop = "innerHTML"

    body = body.replace(new RegExp('{{fragment\.skiplinks}}'), dom.getElementById("skiplinks")[prop])
    body = body.replace(new RegExp('{{fragment\.scripts}}'), dom.getElementById("scripts")[prop])
    body = body.replace(new RegExp('{{fragment\.styles}}'), dom.getElementById("styles")[prop])
    body = body.replace(new RegExp('{{fragment\.header-withmenu}}'), dom.getElementById("header-withmenu")[prop])
    body = body.replace(new RegExp('{{fragment\.footer-withmenu}}'), dom.getElementById("footer-withmenu")[prop])
    body = body.replace(new RegExp('{{fragment\.megamenu-resources}}'), dom.getElementById("megamenu-resources")[prop])

    return body
}

function createHeader(body){
    return {
        body: kropp,
        bodyEncoding: 'text',
        status: '200',
        statusDescription: 'OK',
        headers: {
            'cache-control': [
                {
                    'key': 'Cache-Control',
                    'value': 'max-age=300'
                }
            ]
        }
    }
}

exports.handler = async (event, context) => {

    const request = event.Records[0].cf.request
    const headers = request.headers
    const host = headers['host'][0].value
    const uri = request.uri

    if(uri == '/' || uri == '/index.html'){
        const indexUrl = "http://" + host + uri

        const menuPromise =  commonGet(https, menuUrl)
        const indexPromise =  commonGet(http, indexUrl)

        return Promise.all([indexPromise, menuPromise])
            .then((values) => {
                const body = transclude(values[0], values[1])
                return createHeader(body)
            })
            .catch( err => {
                console.log(err.message)
                return request
            })
            
    } else {
        request.headers = {
            ...request.headers,
            'cache-control': [
                {
                    'key': 'Cache-Control',
                    'value': 'max-age=10'
                }
            ]
        }
        return request
    }
}
