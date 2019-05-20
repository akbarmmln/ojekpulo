'use strict';

var sha1 = require('sha1');
var url = require('url');
var notifier = require('node-notifier');
var datetime = require('node-datetime');
var moment = require('moment');
var response = require('../res/res');
var Task = require('../model/logic');
var nodemailer = require('nodemailer')
var transporter = nodemailer.createTransport({
    service: 'gmail',
    type: "SMTP",
    host: "smtp.gmail.com",
    secure: true,
    auth: {
        user: 'akbarmmln@gmail.com',
        pass: 'akbarakbar'
    }
});  

exports.index = function(req, res) {
    //response.ok("The Node JS RESTful side!", res);
    res.redirect('/app/home');
};

exports.home = function(req, res) {
    var sesslog = req.session._statlog;
    res.cookie("waktuisi", -1, {expire:120});
    res.render('home',{judul:"home", moment:moment, statlogin:sesslog});
};

exports.daftar = function(req, res)
{
    var sesslog = req.session._statlog;
    if(sesslog == "true")
    {
        res.redirect('/app/home');
    }
    else
    {
        res.render('regis',{judul:"true",statlogin:sesslog,moment:moment});
    }
};

exports.login = function(req, res) {
    var sesslog = req.session._statlog;
    if(!sesslog)
    {
        res.render('login',{judul:"login",statlogin:sesslog});
    }
    else
    {
        res.redirect('/app/home');
    }
};

exports.logout = function(req, res) {
    req.session._statlog = "";
    res.redirect('/app/login');
};

exports.cancelbooking = function(req, res)
{
    var sesslog = req.session._statlog;
    if(sesslog == "true")
    {
        var idbook = req.params.idbook;
        if(idbook == null || idbook == "")
        {
            res.redirect('/app/pesanan');
        }
        else
        {
            Task.cancelbooking(idbook, function(err, task){
                if(err)
                {
                    response.ok('Ya Error', res);
                }
                else
                {
                    if(task == "true")
                    {
                        notifier.notify({'title': 'Notifikasi', 'message' : 'Pesanan Anda telah berhasil dibatalkan'});
                    }
                    else if(task == "valid")
                    {
                        notifier.notify({'title': 'Notifikasi', 'message' : 'Pesanan Anda telah berhasil dibayarkan. Pembatalan Pesanan tidak dapat dilakukan'});
                    }
                    else if(task == "expired")
                    {
                        notifier.notify({'title': 'Notifikasi', 'message' : 'Pesanan Anda sudah dibatalkan'});
                    }
                    else if(task == "notmatch")
                    {
                        notifier.notify({'title': 'Notifikasi', 'message' : 'Pesanan tidak terdaftar'});
                    }
                    res.redirect('/app/pesanan');
                }
            })
        }
    }
    else
    {
        notifier.notify({'title': 'Notifikasi', 'message' : 'Masuk kedalam akun Anda untuk dapat melakukan pembatalan pesanan'});
        res.redirect('/app/login');
    }
};

exports.pesanan = function(req, res)
{
    var sesslog = req.session._statlog;
    if(sesslog == "true")
    {
        var sessidcus = req.session._userid;
        Task.check_booking(sessidcus, function(err, task)
        {
            if(err)
            {
                response.ok('Ya Error', res);
            }
            else
            {
                res.cookie("waktuisi", -1, {expire:120});
                res.render('pesanan',{judul:"true",data:task,sessidcus:sessidcus,statlogin:sesslog,moment:moment});
            }
        })
    }
    else
    {
        notifier.notify({'title': 'Notifikasi', 'message' : 'Masuk kedalam akun Anda untuk dapat melihat daftar pesanan'});
        res.redirect('/app/login');
    }
};

exports.prosesbooking = function(req, res)
{
    var sesslog = req.session._statlog;
    if(sesslog == "true")
    {
        var idcus = req.body.idcus;
        var idjad = req.body.idjad;
        var th = req.body.totalharga;
        var pax = req.body.pax;
        var tglotw = req.body.tglotw;
    
        var np = req.body.np;
        var al = req.body.al;
        var nt = req.body.nt;
        var em = req.body.em;
        
        for(var i=1; i<=pax; i++)
        {
            var noiden = req.body.noiden;
            var nama = req.body.nama;
        }

        Task.addBooking(idjad, idcus, np, al, nt, pax, th, em, noiden, nama, tglotw, function(err, task)
        {
            if(err)
            {
                response.ok('Ya Error', res);
            }
            else
            {
                if(task == "berhasil")
                {
                    res.redirect('/app/pesanan');
                }
                else if(task == "reject")
                {
                    notifier.notify({'title': 'Notifikasi', 'message' : 'Jumlah pesanan tiket tidak memenuhi jumlah tiket tersedia. Silahkan pesan ulang kembali'});
                    res.redirect('/app/home');
                }
                else
                {
                    notifier.notify({'title': 'Notifikasi', 'message' : 'Terdapat error pada sistem kami. Silhkan coba kembali'});
                    res.redirect('/app/home');
                }
            }
        })
    }
    else
    {
        res.redirect('/app/login');
    }
}

exports.booking = function(req, res){
    var sesslog = req.session._statlog;
    var sessidcus = req.session._userid;
    var waktuisi = req.cookies['waktuisi'];

    if(sesslog == "true")
    {
        var idjad = req.body.idjdwal;
        var jp = req.body.jumlahpenumpang;
        var date = datetime.create(req.body.tanggalberangkat).format('Y-m-d');

        Task.reviewkapalpesanan(idjad, function(err, task)
        {
            if(err)
            {
                response.ok('Ya Error', res);
            }
            else
            {
                if(waktuisi > 0)
                {
                    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
                    res.header('Pragma', 'no-cache');
                    res.render('booking',{judul:"true",cowktisi:waktuisi,data:task,sessidcus:sessidcus,idjad:idjad,jp:jp,date:date,statlogin:sesslog,moment:moment});
                }
                else
                {
                    notifier.notify({'title': 'Notifikasi', 'message' : 'Waktu pengisian pesanan sudah habis'});
                    res.redirect('/app/home');
                }
            }
        })
    }
    else
    {
        res.redirect('/app/login');
    }
}

exports.pencarian = function(req, res) {
    var sesslog = req.session._statlog;
    var asal = req.body.asal;
    var tujuan = req.body.tujuan;
    var date = datetime.create(req.body.datestart).format('Y-m-d');
    var pax = req.body.pax;

    Task.check_availkapalkursi(date, asal, tujuan, function(err, task)
    {
        if(err)
        {
            response.ok('Ya Error', res);
        }
        else
        {
            if(task.length > 0)
            {
                res.cookie("waktuisi", 120, {expire:120});
                res.render('pencarian',{judul:"true",data:task,asal:asal,tujuan:tujuan,date:date,pax:pax,statlogin:sesslog,moment:moment});
            }
            else
            {
                res.render('pencarian',{judul:"false",asal:asal,tujuan:tujuan,date:date,pax:pax,statlogin:sesslog,moment:moment});
            }
        }
    })
};

exports.vu = function(req, res) {
    var em = req.body.email;

    Task.cekresend(em, function(err, task){
        if(err)
        {
            response.ok('Ya Error', res);
        }
        else
        {
            if(task.length > 0)
            {
                var id = task[0].id_customer;
                var nama = task[0].nama;
                var usr = task[0].email;
                var status = task[0].status;

                if(status == "Belum Verifikasi")
                {
                    var kv = Task.create_random(6);
                    var lv = Task.create_random(30)+kv+Task.create_random(20)+id;

                    var url = "http://"+req.get('host')+"/app/mail/"+lv;
                    //var urlimg = "http://"+req.get('host')+"/assets/assetss/images/kapaltidung.jpg";

                    Task.resend(em, kv, lv, function(err, task1)
                    {
                        if(err)
                        {
                            response.ok('Ya Error', res);
                        }
                        else
                        {
                            if(task1 == "sukses")
                            {
                                var mailOptions = {
                                    from: 'OjekPulo Team noreply@ojekpulo.com',
                                    to: em,
                                    subject: 'Resend Email Verification',
                                    html : "<html><body style='margin: 10px;'><div style='width: 1000px; font-family: Helvetica, sans-serif; font-size: 13px; padding:10px; line-height:150%; border:#eaeaea solid 10px;'>"+ 
                                    "<strong>Terima Kasih Telah Mendaftar</strong><br>"+
                                    "<b>Nama Anda : </b>"+nama+"<br>"+
                                    "<b>Username : </b>"+usr+"<br>"+
                                    "<b>Kode Verifikasi : </b>"+kv+"<br>"+
                                    "<b>URL Link Konfirmasi : </b> <a href='"+url+"'>Klik link ini</a><br>"+
                                    "<b>Harap lakukan verifikasi dalam waktu 24 jam.</b><br><br>"+
                                    "<img src='https://ojekpulo.000webhostapp.com/assetss/images/kapaltidung.jpg' width='1000' height='200' alt=''/>"+
                                    "</div><body></html>"
                                };

                                transporter.sendMail(mailOptions, function(error, info){
                                    if (error) {
                                        console.log(error);
                                        notifier.notify({'title': 'Notifikasi', 'message' : 'Server tidak menaggapi, verifikasi ulang tidak dapat dilakukan. Silahkan coba kembali'});
                                    }
                                    else
                                    {
                                        console.log('Email sent: ' + info.response);
                                        notifier.notify({'title': 'Notifikasi', 'message' : 'Silahkan lakukan verifikasi akun melalui alamat email yang Anda daftarkan'});
                                    }
                                    res.redirect('/app/login');
                                });
                            }
                            else
                            {
                                notifier.notify({'title': 'Notifikasi', 'message' : 'Server tidak menaggapi, verifikasi ulang tidak dapat dilakukan. Silahkan coba kembali'});
                                res.redirect('/app/login');
                            }
                        }
                    })
                }
                else if(status == "Aktif")
                {
                    notifier.notify({'title': 'Notifikasi', 'message' : 'Akun sudah aktif'});
                    res.redirect('/app/login');
                }
                else
                {
                    notifier.notify({'title': 'Notifikasi', 'message' : 'Server tidak menaggapi, verifikasi ulang tidak dapat dilakukan. Silahkan coba kembali'});
                    res.redirect('/app/login');
                }
            }
            else
            {
                notifier.notify({'title': 'Notifikasi', 'message' : 'Email tidak terdaftar'});
                res.redirect('/app/login');
            }
        }
    })
};

exports.splogin = function(req, res){
    var idjad = req.body.pilidjad;
    var tgl = moment(req.body.piltgl).format('YYYY-MM-DD');
    var jml = req.body.piljml;
    var em = req.body.email;
    var pass = req.body.password;

    Task.login(em, function(err, task)
    {
        if(err)
        {
            response.ok('Ya Error', res);
        }
        else
        {
            if(task.length > 0)
            {
                if(em == task[0].email && pass == task[0].password)
                {
                    req.session._userid = task[0].id_customer;
                    req.session._statlog = "true";
                    res.write('<html><head></head><body>');
                    res.write('<form name=myform id=myform action=/app/booking method=POST>');
                    res.write('<input type=hidden name=idjdwal value='+idjad+' />');
                    res.write('<input type=hidden name=jumlahpenumpang value='+jml+' />');
                    res.write('<input type=hidden name=tanggalberangkat value='+tgl+' />');
                    res.write('<input type=submit name=submits id=submits value=submit />');
                    res.write('</form>');
                    res.write('<script type=text/javascript>');
                    res.write('window.onload = function () {document.getElementById("submits").style.display="none";document.myform.submits.click()}');
                    res.write('</script>');
                    res.end('</body></html>');
                }
                else
                {
                    delete req.session._email;
                    res.write('<html><head></head><body>');
                    res.write('<script>window.location.href="javascript:history.back(-1)"</script>');
                    res.end('</body></html>');
                    notifier.notify({'title': 'Notifikasi', 'message' : 'Email dan password salah'});
                }
            }
            else
            {
                res.write('<html><head></head><body>');
                res.write('<script>window.location.href="javascript:history.back(-1)"</script>');
                res.end('</body></html>');
                notifier.notify({'title': 'Notifikasi', 'message' : 'Email dan password salah'});
            }
        }
    })
};

exports.mail = function(req, res)
{
    var lv = req.params.lv;

    Task.ceklinkver(lv, function(err, task){
        if(err)
        {
            response.ok('Ya Error', res);
        }
        else
        {
            if(task == "ok")
            {
                notifier.notify({'title': 'Notifikasi', 'message' : 'Akun Anda berhasil di aktifasi'});
            }
            else if(task == "nf")
            {
                notifier.notify({'title': 'Notifikasi', 'message' : 'Link Verifikasi tidak ditemukan atau telah kadaluwarsa'});
            }
            else
            {
                notifier.notify({'title': 'Notifikasi', 'message' : 'Terjadi kesalahan pada server. Silahkan coba kembali'});
            }
            res.redirect('/app/login');
        }
    })
};

exports.pdaftar = function(req, res)
{
    var nama = req.body.name;
    var em = req.body.email;
    var pass = req.body.password;
    var kv = Task.create_random(6);
    var lv = Task.create_random(30)+kv+nama+Task.create_random(20);
    var url = "http://"+req.get('host')+"/app/mail/"+lv;

    Task.saveDataCustomer(nama, em, pass, kv, lv, function(err, task){
        if(err)
        {
            response.ok('Ya Error', res);
        }
        else
        {
            if(task == "true")
            {
                var mailOptions = {
                    from: 'OjekPulo Team noreply@ojekpulo.com',
                    to: em,
                    subject: 'Email Verification',
                    html : "<html><body style='margin: 10px;'><div style='width: 1000px; font-family: Helvetica, sans-serif; font-size: 13px; padding:10px; line-height:150%; border:#eaeaea solid 10px;'>"+ 
                    "<strong>Terima Kasih Telah Mendaftar</strong><br>"+
                    "<b>Nama Anda : </b>"+nama+"<br>"+
                    "<b>Username : </b>"+em+"<br>"+
                    "<b>Kode Verifikasi : </b>"+kv+"<br>"+
                    "<b>URL Link Konfirmasi : </b> <a href='"+url+"'>Klik link ini</a><br>"+
                    "<b>Harap lakukan verifikasi dalam waktu 24 jam.</b><br><br>"+
                    "<img src='https://ojekpulo.000webhostapp.com/assetss/images/kapaltidung.jpg' width='1000' height='200' alt=''/>"+
                    "</div><body></html>"
                };

                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                        console.log(error);
                        notifier.notify({'title': 'Notifikasi', 'message' : 'Email verifikasi tidak dapat dikirimkan. Coba kembali sesaat lagi.'});
                    }
                    else
                    {
                        console.log('Email sent: ' + info.response);
                        notifier.notify({'title': 'Notifikasi', 'message' : 'Registrasi Berhasil. Lakukan verifikasi akun melalui alamat email yang anda daftarkan'});
                    }
                    res.redirect('/app/login');
                });
            }
            else
            {
                notifier.notify({'title': 'Notifikasi', 'message' : 'Terjadi kesalahan pada server. Silahkan coba kembali'});
            }
            res.redirect('/app/login');
        }
    })
};

exports.plogin = function(req, res) {
    var email = req.body.email;
    var password = req.body.password;

    Task.login(email, function(err, task)
    {
        if(err)
        {
            response.ok('Ya Error', res);
        }
        else
        {
            if(task.length > 0)
            {
                if(email == task[0].email && password == task[0].password)
                {
                    req.session._userid = task[0].id_customer;
                    req.session._statlog = "true";
                    notifier.notify({'title': 'Notifikasi', 'message' : 'Selamat Datang di Ojekpulo ' + task[0].nama});
                    /*
                    notifier.notify({
                        'title': 'David Walsh Blog',
                        'subtitle': 'Daily Maintenance',
                        'message': 'Go approve comments in moderation!',
                        'icon': 'dwb-logo.png',
                        'contentImage': 'blog.png',
                        'sound': 'ding.mp3',
                        'wait': true
                    });
                    */
                    res.redirect('/app/home');
                }
                else
                {
                    delete req.session._email;
                    notifier.notify({'title': 'Notifikasi', 'message' : 'Email dan password salah'});
                    res.redirect('/app/login');
                }
            }
            else
            {
                notifier.notify({'title': 'Notifikasi', 'message' : 'Email dan password salah'});
                res.redirect('/app/login');
            }
        }
    })
};

exports.conpembayaran = function(req, res)
{
    var sesslog = req.session._statlog;
    if(sesslog == "true")
    {
        var param = req.params.lk;
        var host = req.get('host');
        var link = "http://"+host+"/app/pembayaran/h?"+param;
        var q = url.parse(link, true);
        var qdata = q.query;
        var idjad = qdata.po;
        var idbook = qdata.pt;

        Task.review_kapal_booking(idjad, idbook, function(err, task){
            if(err)
            {
                response.ok('Ya Error', res);
            }
            else
            {
                if(task.length > 0)
                {
                    res.render('pembayaran',{judul:"true",idbook:idbook,data:task,statlogin:sesslog,moment:moment,sha1:sha1});
                }
                else
                {
                    response.ok('asas', res);
                }
            }
        })
    }
    else
    {
        notifier.notify({'title': 'Notifikasi', 'message' : 'Untuk melanjutkan tahap pembayaran, Anda diharuskan masuk ke dalam Akun'});
        res.redirect('/app/login');
    }
};