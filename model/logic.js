'user strict';

var sql = require('../koneksi/conn');
var moment = require('moment');
var Task = function(task){};

Task.create_random = function(length)
{
    var result = "";
    var data = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    var charactersLength = data.length;
    for ( var i = 0; i < length; i++ ) {
        result += data.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

Task.create_random_number = function(length)
{
    var result = "";
    var data = '0123456789';
    var charactersLength = data.length;
    for ( var i = 0; i < length; i++ ) {
        result += data.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

Task.cancelbooking = function(idbook, result)
{
    sql.query("SELECT status_pembayaran FROM booking WHERE id_booking = ?",
    [ idbook ],
    function(err, rows, fields){
        if(err)
        {
            result(err, null);
        }
        else
        {
            if(rows.length > 0)
            {
                var statpem = rows[0].status_pembayaran;
                if(statpem == "Pending" || statpem == "ON")
                {
                    sql.query("CALL cancelBooking(?)",
                    [ idbook ],
                    function(errcan, rowscan){
                        if(errcan)
                        {
                            console.log(errcan);
                            result(err, null);
                        }
                        else
                        {
                            result(null, "true");
                        }
                    })
                }
                else if(statpem == "Expired")
                {
                    result(null, "expired");
                }
                else
                {
                    result(null, "valid");
                }
            }
            else
            {
                result(null, "notmatch");
            }
        }
    });
}

Task.check_booking = function(idcus, result)
{
    sql.query("SELECT * FROM jadwal JOIN booking ON jadwal.id_jadwal = booking.id_jadwal WHERE booking.id_customer = ? "+
    "AND (booking.status_pembayaran != 'Expired' AND booking.status_pembayaran != 'Valid') ORDER BY booking.no DESC",
    [ idcus ],
    function(err, rows, fields){
        if(err)
        {
            console.log(err);
            result(err, null);
        }
        else
        {
            result(null, rows);
        }
    });
}

Task.addBooking = function(idjad, idcus, np, alamat, notelp, pax, tb, em, noiden, nama, tglotw, result)
{
    var tglnow = moment().format('YYYY-MM-DD hh:mm');
    var tglnext = moment().add(1, 'hours').format('YYYY-MM-DD hh:mm');
    var tglbooking = moment().format('YYYY-MM-DD');
    var random = Task.create_random_number(6);

    //memeriksa ketersediaan tiket sebelum booking - jumlah tiket disediakan
    sql.query("SELECT jadwal.id_kapal, kapal.jumlah_kursi FROM jadwal JOIN kapal ON jadwal.id_kapal = kapal.id_kapal WHERE jadwal.id_jadwal = ?",
    [ idjad ],
    function(err, rowsta, fieldsta){
        var datatiketada = rowsta[0].jumlah_kursi;
        
        //memeriksa ketersediaan tiket sebelum booking - jumlah tiket telah dibooking
        sql.query("SELECT SUM(jumlahpenumpang) as tbooked FROM booking WHERE id_jadwal = ?",[ idjad ],
        function(err, rowstb, fieldstb){
            var datatiketdibook = rowstb[0].tbooked;

            if(datatiketdibook == "" || datatiketdibook == null)
            {
                datatiketdibook = 0;
            }

            //memeriksa ketersediaan tiket sebelum booking - jumlah tiket memenuhi pesanan booking
            var sisatiket = datatiketada - datatiketdibook;
            
            if(sisatiket >= pax)
            {
                sql.query('CALL addBooking(?,?,?,?,?,?,?,?,@out,?,?,?,?,?)',
                [ idjad, idcus, np, alamat, notelp, pax, tb, em, random, tglotw, tglnow, tglnext, tglbooking ],
                function(errcp, rowscp, fieldscp){
                    if(errcp)
                    {
                        console.log(errcp);
                        result(null,"error");
                    }
                    else
                    {
                        sql.query("SELECT @out as rid", function(errres, rowsres)
                        {
                            var k;
                            for(k=0; k<pax; k++)
                            {
                                sql.query("INSERT INTO rincian_booking(id_booking, noidentitas, nama) VALUES (?,?,?)",
                                [ rowsres[0].rid, noiden[k], nama[k] ],function(errfinal, resultfinal){
                                    if(errfinal)
                                    {
                                        console.log(errfinal);
                                    }
                                });
                            }
                            
                            if(k == pax)
                            {
                                result(null,"berhasil");
                            }
                            else
                            {
                                result(null,"error");
                            }
                        })
                    }
                });
            }
            else
            {
                result(null, "reject");
            }
        })
    });
};

Task.login = function(email, result) {
    sql.query("SELECT customer.id_customer, customer.nama, login.email, login.password, login.status " +
    "FROM customer join login ON customer.id_customer = login.id_customer WHERE login.email = ? ", [ email ],
    function (err, rows, fields) {
        if(err)
        {
            console.log(err);
            result(err, null);
        }
        else
        {
            result(null, rows);
        }
    });
};

Task.reviewkapalpesanan = function(idjadwal, result)
{
    sql.query("SELECT kapal.nama_kapal, kapal.harga, jadwal.id_kapal, jadwal.tanggal, jadwal.asal, jadwal.tujuan, " +
    "jadwal.waktu_berangkat, jadwal.waktu_tiba FROM kapal JOIN jadwal ON kapal.id_kapal = jadwal.id_kapal WHERE jadwal.id_jadwal = ?",
    [ idjadwal ],
    function(err, rows, fields)
    {
        if(err)
        {
            console.log(err);
            result(err, null);
        }
        else
        {
            result(null, rows);
        }
    });
};

Task.check_availkapalkursi = function(date, asal, tujuan, result){
    sql.query("SELECT kapal.id_kapal, kapal.nomor_kapal, kapal.nama_kapal, kapal.jumlah_kursi, " + 
    "kapal.harga, jadwal.id_jadwal, jadwal.waktu_berangkat, jadwal.waktu_tiba, jadwal.asal, jadwal.tujuan, jadwal.tanggal, " +
    "SUM(booking.jumlahpenumpang) as dipesan " +
    "FROM kapal JOIN jadwal ON kapal.id_kapal = jadwal.id_kapal LEFT JOIN booking on jadwal.id_jadwal = booking.id_jadwal " + 
    "WHERE jadwal.tanggal = ? AND jadwal.asal = ? AND jadwal.tujuan = ? GROUP BY jadwal.id_jadwal ORDER BY jadwal.id_jadwal ASC", 
    [ date, asal, tujuan ],
    function (err, rows, fields1) {
        if(err)
        {
            console.log(err);
            result(err, null);
        }
        else
        {
            result(null, rows);
        }
    });
};

Task.saveDataCustomer = function(nama, em, pass, kv, lv, result)
{
    var bw = moment().add(12, 'hours').format('YYYY-MM-DD hh:mm');
    sql.query('CALL addCustomer(?,?,?,?,?,?)',[ nama, em, pass, kv, lv, bw ],
    function(err, rows, fields){
        if(err)
        {
            result(err, null);
        }
        else
        {
            result(null, "true");
        }
    });
};

Task.ceklinkver = function(lv, result)
{
    sql.query("SELECT * FROM login WHERE link_verifikasi = ?",[ lv ],
    function(err, rows, fields){
        if(err)
        {
            result(err, null);
        }
        else
        {
            if(rows.length > 0)
            {
                var stat = "Aktif";
                var kd = "-";
                var lv = "-";
                sql.query("UPDATE login SET status = ?, kode_verifikasi = ?, link_verifikasi = ? WHERE id_customer = ?",
                [ stat, kd, lv, rows[0].id_customer ],
                function(err, rows, fields){
                    if(err)
                    {
                        result(err, null);
                    }
                    else
                    {
                        result(null, "ok");
                    }
                });
            }
            else
            {
                result(null, "nf");
            }
        }
    });
};

Task.cekresend = function(email, result)
{
    sql.query("SELECT customer.nama, login.* FROM customer JOIN login " +
    "ON customer.id_customer = login.id_customer WHERE login.email = ?",
    [ email ],
    function(err, rows, fields){
        if(err)
        {
            result(err, null);
        }
        else
        {
            result(null, rows);
        }
    });
};

Task.resend = function(em, kv, lv, result)
{
    var bw = moment().add(12, 'hours').format('YYYY-MM-DD hh:mm');
    sql.query("UPDATE login SET kode_verifikasi = ?, link_verifikasi = ?, batas_waktu = ? WHERE email = ?",
    [ kv, lv, bw, em ],function(err, rows, fields){
        if(err)
        {
            result(err, null);
        }
        else
        {
            result(null, "sukses");
        }
    })
};

Task.review_kapal_booking = function(idjad, idbook, result)
{
    sql.query("SELECT kapal.nama_kapal, kapal.harga, jadwal.id_kapal, jadwal.tanggal, jadwal.asal, jadwal.tujuan, "+
    "jadwal.waktu_berangkat, jadwal.waktu_tiba, booking.tanggal_booking, booking.jumlahpenumpang, booking.totalbayar, "+
    "booking.nama_pemesan, booking.email_ver, booking.status_pembayaran FROM kapal JOIN jadwal ON kapal.id_kapal = jadwal.id_kapal "+
    "JOIN booking ON jadwal.id_jadwal = booking.id_jadwal WHERE jadwal.id_jadwal = ? AND booking.id_booking = ?",
    [ idjad, idbook ],
    function(err, rows, fields){
        if(err)
        {
            result(err, null);
        }
        else
        {
            result(null, rows);
        }
    });
};

module.exports = Task;