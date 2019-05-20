'use strict';

var moment = require('moment');
var response = require('../res/res');
var sql = require('../koneksi/conn');

exports.cekketersediaanbayarckb = function(req, res) {
    var sb = req.body.sb;
    sql.query("SELECT id_booking FROM booking WHERE status_pembayaran = ?", [ sb ],
    function(err, rows, fields){
        if(err)
        {
            response.ok('err', res);
        }
        else
        {
            response.ok(rows, res);
        }
    });    
};

exports.updateketersediaanbayarukb = function(req, res)
{
    var idbook = req.body.idbo;
    var inv = req.body.inv;
    var sess = req.body.sess;
    var pcy = req.body.pcy;
    var pc = req.body.pc;
    sql.query("UPDATE booking SET invoice_number = ?, session_id = ?, payment_channel = ?, payment_code = ?, status_pembayaran = 'ON' "+
    "WHERE id_booking = ?",
    [ inv, sess, pcy, pc, idbook ],function(err, rows, fields){
        if(err)
        {
            response.ok('err', res);
        }
        else
        {
            response.ok(rows, res);
        }
    })
};

exports.cekstatuspendingoncspo = function(req, res)
{
    sql.query("SELECT id_booking, ws FROM booking WHERE status_pembayaran = 'Pending' OR status_pembayaran = 'ON'",
    function(err, rows, fields){
        if(err)
        {
            console.log(err);
        }
        else
        {
            if(rows.length > 0)
            {
                for(var i=0; i<rows.length; i++)
                {
                    var now = moment().format("DD/MM/YYYY HH:mm:ss");
                    var wsa = moment(rows[i].ws).format('DD/MM/YYYY HH:mm:ss');
                    var ms = moment(wsa,"DD/MM/YYYY HH:mm:ss").diff(moment(now,"DD/MM/YYYY HH:mm:ss"));
                    var d = moment.duration(ms);
                    var menito = Math.floor(d.asHours());

                    if(menito < 0)
                    {
                        sql.query("UPDATE booking SET status_pembayaran = 'Expired' WHERE id_booking = ?",
                        [ rows[i].id_booking ],function(err, rows, fields){
                            if(err)
                            {
                                console.log(err);
                            }
                        })
                    }
                }
            }
        }
    })
};

exports.cekketersediaanbayarcvb = function(req, res)
{
    var sb = req.body.sb;
    sql.query("SELECT id_booking FROM booking WHERE status_pembayaran = ?",[ sb ],
    function(err, rows, fields){
        if(err)
        {
            response.ok('err', res);
        }
        else
        {
            response.ok(rows, res);
        }
    });
};