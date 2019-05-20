-- phpMyAdmin SQL Dump
-- version 4.8.5
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Waktu pembuatan: 07 Bulan Mei 2019 pada 03.55
-- Versi server: 10.1.38-MariaDB
-- Versi PHP: 7.1.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `skripsi_kapal`
--

DELIMITER $$
--
-- Prosedur
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `addBooking` (IN `idjad_` VARCHAR(100), IN `idcus_` VARCHAR(100), IN `np_` VARCHAR(100), IN `alamat_` VARCHAR(100), IN `notelp_` VARCHAR(100), IN `pax_` BIGINT, IN `tb_` BIGINT, IN `em_` VARCHAR(100), OUT `paramid_` VARCHAR(100), IN `numrand_` VARCHAR(100), IN `tglotw_` DATE, IN `wm_` DATETIME, IN `ws_` DATETIME, IN `tglbooking_` DATE)  BEGIN
	DECLARE jumlah_baris varchar(100);
    DECLARE date_ varchar(100);
	DECLARE id varchar(100);
	DECLARE id_auto varchar(100);
	DECLARE id_input longtext;
    
    SET date_ = (SELECT CURDATE() + 1 - 1);
	SET jumlah_baris = (SELECT COUNT(*) FROM booking WHERE tanggal_booking = CURDATE());
        IF jumlah_baris > 0 THEN			
	    SET id = (SELECT SUBSTRING(id_booking,21) FROM booking ORDER BY no DESC LIMIT 1);
	    SET id_auto = id + 1;
	    SET id_input = CONCAT('INV','888',date_,numrand_,id_auto);
	ELSE
		SET id = jumlah_baris;
	    SET id_auto = id + 1;
        SET id_input = CONCAT('INV','888',date_,numrand_,id_auto);
	END IF;
	
    SET paramid_ = id_input;
	
	INSERT INTO booking(id_booking, id_jadwal, id_customer, nama_pemesan, alamat, notelp, jumlahpenumpang, totalbayar, email_ver, tanggal_booking, tanggal_keberangkatan, status_pembayaran, wm, ws)
	VALUES (id_input, idjad_, idcus_, np_, alamat_, notelp_, pax_, tb_, em_, tglbooking_, tglotw_, "Pending", wm_, ws_);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `addCustomer` (IN `nm` VARCHAR(100), IN `em` VARCHAR(100), IN `pass` VARCHAR(100), IN `kv` VARCHAR(100), IN `lv` VARCHAR(100), IN `bw_` DATETIME)  BEGIN
	DECLARE jumlah_baris varchar(100);
	DECLARE id varchar(100);
	DECLARE id_auto varchar(100);
	DECLARE id_input varchar(100);
    
	SET jumlah_baris = (SELECT COUNT(*) FROM customer);
        IF jumlah_baris > 0 THEN			
	    SET id = (SELECT SUBSTRING(id_customer,4) FROM customer ORDER BY no DESC LIMIT 1);
	    SET id_auto = id + 1;
	    SET id_input = CONCAT('CUS', id_auto);
	ELSE
            SET id = jumlah_baris;
            SET id_auto = id + 1;
            SET id_input = CONCAT('CUS', id_auto);
        END IF;
        
	INSERT INTO customer (id_customer, nama, alamat, jenis_kelamin, no_telp)
	VALUES (id_input, nm, "", "", 0);
		
	INSERT INTO login(id_customer, email, password, status, kode_verifikasi, link_verifikasi, batas_waktu)
	VALUES (id_input, em, pass, "Belum Verifikasi", kv, lv, bw_);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `cancelBooking` (IN `idbooking_` VARCHAR(100))  BEGIN		
	UPDATE booking SET status_pembayaran = 'Expired' WHERE id_booking = 	idbooking_;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Struktur dari tabel `booking`
--

CREATE TABLE `booking` (
  `no` bigint(100) NOT NULL,
  `id_booking` varchar(200) NOT NULL,
  `id_jadwal` bigint(100) NOT NULL,
  `id_customer` longtext NOT NULL,
  `nama_pemesan` varchar(100) NOT NULL,
  `alamat` longtext NOT NULL,
  `notelp` varchar(100) NOT NULL,
  `jumlahpenumpang` int(10) NOT NULL,
  `totalbayar` float(50,2) NOT NULL,
  `email_ver` varchar(100) NOT NULL,
  `tanggal_booking` date NOT NULL,
  `tanggal_keberangkatan` date NOT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `payment_channel` varchar(100) DEFAULT NULL,
  `payment_code` varchar(100) DEFAULT NULL,
  `status_pembayaran` varchar(100) NOT NULL,
  `wm` datetime NOT NULL,
  `ws` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Struktur dari tabel `customer`
--

CREATE TABLE `customer` (
  `no` bigint(100) NOT NULL,
  `id_customer` longtext NOT NULL,
  `nama` varchar(100) NOT NULL,
  `alamat` text NOT NULL,
  `jenis_kelamin` varchar(100) NOT NULL,
  `no_telp` bigint(20) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data untuk tabel `customer`
--

INSERT INTO `customer` (`no`, `id_customer`, `nama`, `alamat`, `jenis_kelamin`, `no_telp`) VALUES
(5, 'CUS1', 'Khairatin Mudasir', 'Depok Baru', 'Laki-Laki', 85771501947),
(20, 'CUS2', 'Akbar', '', '', 0);

-- --------------------------------------------------------

--
-- Struktur dari tabel `jadwal`
--

CREATE TABLE `jadwal` (
  `id_jadwal` bigint(100) NOT NULL,
  `id_kapal` bigint(20) NOT NULL,
  `tanggal` date NOT NULL,
  `asal` varchar(100) NOT NULL,
  `tujuan` varchar(100) NOT NULL,
  `waktu_berangkat` varchar(100) NOT NULL,
  `waktu_tiba` varchar(100) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data untuk tabel `jadwal`
--

INSERT INTO `jadwal` (`id_jadwal`, `id_kapal`, `tanggal`, `asal`, `tujuan`, `waktu_berangkat`, `waktu_tiba`) VALUES
(61, 1, '2019-05-07', 'Pulau Tidung', 'Kali Adem (Muara Angke)', '08:00', '10:30'),
(62, 2, '2019-05-07', 'Kali Adem (Muara Angke)', 'Pulau Tidung', '08:00', '10:30'),
(63, 3, '2019-05-07', 'Pulau Tidung', 'Kali Adem (Muara Angke)', '08:00', '10:30'),
(64, 4, '2019-05-07', 'Kali Adem (Muara Angke)', 'Pulau Tidung', '08:00', '10:30'),
(65, 5, '2019-05-07', 'Pulau Tidung', 'Kali Adem (Muara Angke)', '08:00', '10:30'),
(66, 6, '2019-05-07', 'Kali Adem (Muara Angke)', 'Pulau Tidung', '08:00', '10:30'),
(67, 1, '2019-05-08', 'Pulau Tidung', 'Kali Adem (Muara Angke)', '08:00', '10:30'),
(68, 2, '2019-05-08', 'Kali Adem (Muara Angke)', 'Pulau Tidung', '08:00', '10:30'),
(69, 3, '2019-05-08', 'Pulau Tidung', 'Kali Adem (Muara Angke)', '08:00', '10:30'),
(70, 4, '2019-05-08', 'Kali Adem (Muara Angke)', 'Pulau Tidung', '08:00', '10:30'),
(71, 5, '2019-05-08', 'Pulau Tidung', 'Kali Adem (Muara Angke)', '08:00', '10:30'),
(72, 6, '2019-05-08', 'Kali Adem (Muara Angke)', 'Pulau Tidung', '08:00', '10:30');

-- --------------------------------------------------------

--
-- Struktur dari tabel `kapal`
--

CREATE TABLE `kapal` (
  `id_kapal` bigint(100) NOT NULL,
  `nomor_kapal` bigint(100) NOT NULL,
  `nama_kapal` varchar(50) DEFAULT NULL,
  `jumlah_kursi` int(50) NOT NULL,
  `harga` bigint(20) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data untuk tabel `kapal`
--

INSERT INTO `kapal` (`id_kapal`, `nomor_kapal`, `nama_kapal`, `jumlah_kursi`, `harga`) VALUES
(1, 15133, 'Bisma', 200, 10000),
(2, 15134, 'Transpasific', 250, 10000),
(3, 15355, 'Islani', 300, 10000),
(4, 15356, 'Anterja', 180, 10000),
(5, 15357, 'Hasbi Jaya', 150, 10000),
(6, 15358, 'Cahaya Laut', 200, 10000);

-- --------------------------------------------------------

--
-- Struktur dari tabel `login`
--

CREATE TABLE `login` (
  `id_customer` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL DEFAULT '',
  `status` varchar(100) NOT NULL,
  `kode_verifikasi` varchar(100) NOT NULL,
  `link_verifikasi` longtext NOT NULL,
  `batas_waktu` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data untuk tabel `login`
--

INSERT INTO `login` (`id_customer`, `email`, `password`, `status`, `kode_verifikasi`, `link_verifikasi`, `batas_waktu`) VALUES
('CUS1', 'atinkhairatin@gmail.com', '123', 'Aktif', '-', '-', '2019-02-20 06:31:00'),
('CUS2', 'akbarmmln@gmail.com', '123', 'Aktif', '-', '-', '2019-05-07 08:53:00');

-- --------------------------------------------------------

--
-- Struktur dari tabel `rincian_booking`
--

CREATE TABLE `rincian_booking` (
  `no` int(11) NOT NULL,
  `id_booking` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `noidentitas` bigint(20) NOT NULL,
  `nama` varchar(100) COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `transaski`
--

CREATE TABLE `transaski` (
  `id_transaksi` longtext NOT NULL,
  `id_customer` longtext NOT NULL,
  `id_kapal` longtext NOT NULL,
  `id_jadwal` varchar(100) NOT NULL,
  `tgl_transaksi` date NOT NULL,
  `no_telp` int(15) NOT NULL,
  `harga` float(50,2) NOT NULL,
  `waktu` varchar(30) NOT NULL DEFAULT ''
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `booking`
--
ALTER TABLE `booking`
  ADD PRIMARY KEY (`no`);

--
-- Indeks untuk tabel `customer`
--
ALTER TABLE `customer`
  ADD PRIMARY KEY (`no`);

--
-- Indeks untuk tabel `jadwal`
--
ALTER TABLE `jadwal`
  ADD PRIMARY KEY (`id_jadwal`);

--
-- Indeks untuk tabel `kapal`
--
ALTER TABLE `kapal`
  ADD PRIMARY KEY (`id_kapal`);

--
-- Indeks untuk tabel `login`
--
ALTER TABLE `login`
  ADD PRIMARY KEY (`email`);

--
-- Indeks untuk tabel `rincian_booking`
--
ALTER TABLE `rincian_booking`
  ADD PRIMARY KEY (`no`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `booking`
--
ALTER TABLE `booking`
  MODIFY `no` bigint(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=149;

--
-- AUTO_INCREMENT untuk tabel `customer`
--
ALTER TABLE `customer`
  MODIFY `no` bigint(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT untuk tabel `jadwal`
--
ALTER TABLE `jadwal`
  MODIFY `id_jadwal` bigint(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=158;

--
-- AUTO_INCREMENT untuk tabel `kapal`
--
ALTER TABLE `kapal`
  MODIFY `id_kapal` bigint(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT untuk tabel `rincian_booking`
--
ALTER TABLE `rincian_booking`
  MODIFY `no` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
