var express = require('express'),
    app = express(),
    port = process.env.PORT || 3000,
    bodyParser = require('body-parser'),
    controller = require('./controller/controller'),
    controllerAPI = require('./controller/controllerAPI');

var xml2js = require('xml2js');
const sha1 = require('sha1');
const request = require('request');
const cron = require("node-cron");
const cookie = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const ejs = require('ejs');

app.set('views',path.join(__dirname,'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/assets',express.static(__dirname + '/public'));
app.use(session({secret:'session', saveUninitialized:true, resave:true}));
app.use(cookie());
app.use(bodyParser.json());

var routes = require('./router/routes');
routes(app);

app.use(function(req, res){
    /*
    res.status(404).send({
        endpoint: req.originalUrl + ' not found'
    })
    */
    res.write('<html><head></head><body>');
    res.write('<script>window.location.href="javascript:history.back(-1)"</script>');
    res.end('</body></html>');
    return;
})

//cek ketersediaan bayar ckb/ukb -> setiap detik
cron.schedule("*/1 * * * * *", function() {
    var mallid = "11408317";
    var sharedkey = "pZ8nb8joZpJh";
    var chainmerchant = "NA";

    var headersOpt = {  
        "content-type": "application/json",
    };

    request.post('http://localhost:3000/api/cekketersediaanbayarckb',
        {
        form: {sb:'Pending'},
        headers: headersOpt,
        json: true,
        },(error, resp, body) => {
        if (error) {
            console.error(error);
            return;
        }
        else
        {
            for(var i=0; i<body.values.length; i++)
            {
                var idbook = body.values[i].id_booking; 
                var transidmerchant = idbook;
                var sessid = idbook;
                var words = mallid+sharedkey+transidmerchant;
                var words_ = sha1(words);
                
                request.post('https://staging.doku.com/Suite/CheckStatus',
                    {
                        form: {MALLID:mallid, CHAINMERCHANT:chainmerchant, TRANSIDMERCHANT:transidmerchant, SESSIONID:sessid, WORDS:words_},
                        headers: headersOpt,
                        json: true
                    },(error, res, bodys) => {
                    if(error)
                    {
                        console.log(error);
                    }
                    else
                    {
                        var parser = new xml2js.Parser();
                        parser.parseString(bodys, function (err, result) {
                            var tar = result['PAYMENT_STATUS']['TRANSIDMERCHANT'];
                            var ss = result['PAYMENT_STATUS']['SESSIONID'];
                            var pcy = result['PAYMENT_STATUS']['PAYMENTCHANNEL'];
                            var pc = result['PAYMENT_STATUS']['PAYMENTCODE'];
                            var stat = result['PAYMENT_STATUS']['RESULTMSG'];

                            if(stat != "TRANSACTION_NOT_FOUND")
                            {
                                request.post('http://localhost:3000/api/updateketersediaanbayarukb',
                                    {
                                        form: {idbo:idbook, inv:tar, sess:ss, pcy:pcy, pc:pc},
                                        headers: headersOpt,
                                        json: true
                                    },(error, res, hasil) => {})
                            }
                        });
                    }
                })
            }
        }
    })
});

//cek status pending dan on
cron.schedule("*/1 * * * * *", function() {
    var headersOpt = {
        "content-type": "application/json",
    };

    request.post('http://localhost:3000/api/cekstatuspendingoncspo',
        {
            headers: headersOpt,
            json: true
        },(error, res, hasil) => {})
});

app.listen(port);
console.log('RESTful API server started on http://localhost:' + port);