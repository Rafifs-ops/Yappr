# Dokumentasi Website Yappr (X/Twitter Clone)

Untuk aplikasi android/ios (coming soon) akan menggunakan library `capacitor.js` untuk mengonversi kode frontend Nuxt Js menjadi aplikasi native android/ios

Untuk keamanan, website ini sudah bisa mencegah serangan CSRF dan menerapakan rate limiting untuk mencegah DDoS dengan bantuan library `nuxt-security`

---

## Fitur-fitur yang ada di aplikasi

1. Registrasi Akun (dengan OTP)
Pengguna dapat mendaftar akun baru dengan mengisi nama pengguna, email, kata sandi, bio, dan mengunggah foto profil. Pendaftaran ini diamankan dan diselesaikan dengan tahap verifikasi email menggunakan 6 angka kode OTP (One Time Password) agar pengguna bisa diarahkan ke halaman utama.
2. Login dan Logout
Fitur autentikasi yang memungkinkan pengguna untuk masuk ke dalam akun menggunakan email dan kata sandi yang divalidasi dengan aman, serta keluar dari akun (logout) yang secara otomatis akan menghapus sesi token dari peramban.
3. Lupa Kata Sandi (Reset Password)
Pengguna yang lupa kata sandi dapat mengatur ulang akses masuk mereka melalui halaman login. Proses ini juga dijamin keamanannya dengan meminta pengguna untuk memverifikasi kode OTP yang dikirimkan via email sebelum membuat kata sandi baru.
4. Keamanan Sistem (Anti-CSRF & Rate Limiting)
Aplikasi secara bawaan telah dilengkapi dengan perlindungan terhadap serangan web CSRF dan menerapkan pembatasan akses (rate limiting) menggunakan sistem keamanan bawaan framework untuk mencegah kelumpuhan sistem atau DDoS.
5. Akun Privat (Private Account)
Pengguna dapat mengubah status akunnya menjadi privat. Jika diaktifkan, cuitan pengguna tidak akan muncul di publik dan pengguna lain yang ingin mengikuti harus mengirimkan permintaan mengikuti (follow request) yang kemudian bisa disetujui atau ditolak.
6. Pencarian Pengguna dan Hashtag
Aplikasi menyediakan fitur bagi pengguna untuk menelusuri pengguna lain menggunakan kata kunci pencarian, serta dapat memfilter cuitan spesifik yang mengandung hashtag tertentu.
7. Profil dan Pengaturan Profil
Setiap pengguna memiliki halaman profil khusus yang menampilkan detail bio, daftar cuitan mereka sendiri, cuitan yang disukai, dan cuitan yang dibagikan ulang. Pengguna juga dapat mengubah dan memperbarui informasi profil mereka seperti nama, bio, atau mengganti foto profil dengan yang baru.
8. Mengikuti dan Batal Mengikuti (Follow & Unfollow)
Fitur untuk membangun relasi jaringan antar pengguna di mana mereka dapat mengikuti akun publik, mengirim permintaan mengikuti ke akun privat, dan kapan saja dapat membatalkan tindakan tersebut (unfollow) yang akan langsung mengubah metrik jumlah pengikut secara otomatis.
9. Publikasi Cuitan (Twit) dan Penghapusan
Pengguna dapat membuat postingan baru dengan menyertakan teks beserta lampiran media seperti gambar atau video yang akan disimpan ke penyimpanan pihak ketiga (Cloudinary). Pengguna juga memiliki opsi untuk menghapus cuitan tersebut dari platform.
10. Beranda (Timeline) yang Terkurasi
Halaman utama pengguna menampilkan cuitan harian yang dinamis dan bebas duplikasi. Cuitan yang muncul di beranda difilter secara spesifik untuk hanya menampilkan postingan dari akun yang mereka ikuti, beserta postingan yang disukai atau dibagikan ulang oleh teman mereka.
11. Balasan Cuitan (SubTwit / Komentar)
Pengguna dapat saling berinteraksi dengan membalas langsung cuitan pengguna lain atau cuitan miliknya sendiri sebagai bentuk komentar yang akan menambah statistik jumlah balasan pada cuitan induk.
12. Suka (Like) dan Bagikan Ulang (Repost)
Fitur interaksi instan di mana pengguna bisa menyukai atau membagikan ulang cuitan favorit mereka ke profil sendiri, yang akan seketika menambah metrik angka dan mengubah tampilan antarmuka. Tindakan ini juga bisa ditarik kembali (unlike/un-repost) sewaktu-waktu.
13. Topik Hangat (Trending Hashtags)
Aplikasi dapat mengumpulkan dan menampilkan daftar hashtag yang sedang tren saat ini sehingga pengguna dapat melihat topik apa saja yang paling banyak dibicarakan oleh komunitas.
14. Notifikasi
Sistem pemberitahuan terpusat yang memberitahukan peristiwa penting kepada pengguna, salah satunya ketika ada permintaan masuk untuk mengikuti akun. Status notifikasi juga dapat diperbarui, misalnya ketika sudah ditandai sebagai telah dibaca.
15. Pesan Langsung (Realtime Chatting)
Pengguna dapat membuat ruang obrolan (room chat) dengan pengguna lain secara spesifik. Pesan obrolan ini diterima dan dikirim secara langsung tanpa jeda (realtime) menggunakan koneksi WebSocket yang menampilkan riwayat obrolan terdahulu beserta foto pengirimnya.

---

## Alur Fitur Private Account

1. Di skema model User, ada field isPrivate dengan type data Boolean untuk menandai status akun
2. Di skema model Follow, ada field status ( Enum: accepted or pending ) karena proses follow akun privat tidak langsung berhasil, melainkan harus "menunggu persetujuan".
3. Di endpoint `server/api/follow/add.post.ts` (menambah data followers & following). Sebelum membuat follow, cek dulu apakah user yang difollow (following) memiliki isPrivate: true. Jika akun privat, maka buat data(doc) Follow dengan status: 'pending'. Jangan langsung jalankan `$inc: { followers: 1 } dan $inc: { following: 1 }`. Server langsung buat data(doc) notifikasi pada model Notification dengan tipe: 'follow_request', pesannya: 'meminta untuk mengikuti Anda'. Intinya untuk membuat notifikasi kepada user yang difollow untuk meminta izin untuk follow. Jika akun publik, maka status accepted dan langsung increment angka followers.

> Catatan: Ada 2 endpoint API di folder follow yaitu `accept.post.ts` dan `reject.post.ts` untuk mengubah status 'pending' menjadi 'accepted' (sekaligus menambah jumlah followers) atau menghapusnya.

4. Untuk data akun yang diprivat, pada endponit `server/api/user/[id].get.ts` (mengambil data profil orang lain), server mengecek relasi follow (mencari tahu sudah di follow atau belum) dan mencari yang statusnya accepted. Cek apakah field isPrivate pada data(doc) user itu true? Jika privat dan currentUser.id (diambil dari session auth) !== userDb._id (bukan dirinya sendiri) DAN isFollowed bernilai false (belum di-follow / masih pending), maka, kosongkan array userTweets (jangan kirim tweet ke klien). Tweet user (orang lain) tidak akan muncul. Pada endpoint `server/api/twits/user/[id].get.ts` (mengambil data twit orang lain), maka server akan mengambil data(doc) User terlebih dahulu berdasarkan id untuk mengecek isPrivate. Pengecekan akan sama, jika akun privat dan user yang memanggil API belum follow (status pending), kembalikan array kosong []. Begitu juga pada endpoint-endpoint yang bersifat publik lainnya yang mengambil data twit

---

## Alur Authentikasi

1. User Login, server akan memeriksa apakah email nya ada?, apakah emailnya sesuai format?. Jika ada dan sesuai, maka server kan mencari data(Doc) User ke database.
2. Jika User ada dan email sudah terverifikasi, maka password dari input user akan dicompare dengan password di database menggunakan bycrpt. Jika true, maka server akan membuat access token dan refresh token dengan payload userId dengan jsonwebtoken
3. Setelah itu, access dan refresh token akan disimpan di cookie web client. Login berhasil dan Data user nanti akan disimpan di session bagian server
4. Session server mendapatkan data User dengan cara mengambil access token yang ada di cookie, lalu token tersebut akan digunakan untuk diverify sekaligus di decode untuk mendapatkan userId
5. Refresh token berfungsi jika access token user sudah kadaluwarsa, maka server akan menggunakan refresh token untuk membuat access token yang baru. Sehingga user tidak perlu login ulang jika access token mereka sudah kadaluwarsa
6. Lalu, Session akan mencari data(doc) user ke database dengan userId yang sudah didapat dari decode token. Data(doc) User akan dikembalikan sebagai response backend untuk dikirim ke frontend (client)

---

## Alur Registrasi

1. User mengisi data-data sekaligus photo profil
2. Saat request ke endpoint server/api/auth/register.post.ts (untuk daftar), maka akan melewati sebuah middleware untuk menyimpan foto profil ke storage pihak ketiga (cloudinary) dan mendapatkan nama file photo profilnya yang akan dimasukan ke dalam database User
3. Saat sampai di endpoint API registrasi, server akan memeriksa apakah data nya lengkap, username & email sesuai format yang telah ditentukan, dan apakah ada user lain yang sudah mendaftar dengan data username dan email yang sama.
4. Jika aman, maka data password yang telah diinput akan di hash dengan bcrypt dengan salt 10. Kemudian data-data user akan diinput ke database User dengan email yang belum terverifikasi dan membuat data(doc) kode OTP ke Model Otp (database) yang memiliki kadaluwarsa 5 menit

> Catatan: Meskipun data-data yang diinput user langsung masuk ke database, email nya belum terverikasi. Maka user belum bisa langsung dibuatkan session auth untuk login/masuk ke halaman utama

5. Saat request ke endpoint `server/api/auth/register.post.ts` (untuk daftar), user juga request ke endpoint `server/api/send-otp.post.ts`. Di endpoint tersebut, server akan mengenerate 6 angka kode otp dan mengirimnya ke user melalui Email user.
6. Ketika User sudah mengisi kode OTP di frontend, maka user otomatis merequest endpoint `server/api/verify-otp.post.ts` untuk memeriksa apakah otp yang diinput oleh user dengan otp yang dibuat oleh server sudah sesuai?. Jika sesuai, maka akan langsung dibuatkan session login dengan membuat token dan menyimpannya di cookie (sama seperti alur authentikasi di atas). User akan otomatis diarahkan ke halaman utama.

---

## Alur Logout

1. Jika user klik tombol logout di profile, maka otomatis akan request ke endpoint `server/api/logout.post.ts`. Di endpoint tersebut, server akan menghapus token yand ada di cookie web client, sehingga session tidak lagi bisa mendapatkan data user di database karena tokennya sudah dihapus.
2. User otomatis akan diarahkan ke halaman login

---

## Alur Membuat Twit

1. User membuat twit denga mengisi data-data yang diperlukan (teks, gambar/video) di frontend.
2. Ketika User mengklik tombol create, makan akan request ke endpoint `server/api/twits/index.post.ts` (membuat twit). Di endpoint tersebut, server akan memeriksa apakah ada foto/video?. Jika ada, maka akan langsung dimasukan ke storage pihak ketiga (cloudinary) dan mendapatkan nama foto/video nya akan akan diinput ke dalam database data(doc) Twit
3. Jika ada twitId di body request, maka twit yang user buat adalah subTwit (twit untuk membalas twit parent/twit orang lain). Maka data(doc) twit orang lain yang dibalas akan dinaikan (increment) angka commentCount nya
4. Jika Berhasil, maka user akan langsung diarahkan ke halaman profil user tersebut untuk melihat twit yang baru dibuat

---

## Alur Mendapatkan Data-data Twit Untuk Halaman Utama

1. Begitu user tiba di halaman utama, otomatis akan request ke endpoint `server/api/twits/index.get.ts` untuk mendapatkan twit-twit harian.
2. Twit-twit itu adalah twit yang dimiliki oleh orang yang difollow oleh user, dilike, dan direpost oleh orang yang difollow oleh user(client)
3. Untuk langkah-langkah di dalam servernya, server akan mencari orang-orang yang di follow oleh user(client) melalui model Follow dan membuat array baru (map) untuk mengambil id-id user nya saja
4. Lalu id-id tersebut akan digunakan untuk mencari twit, twit yang diliked/direposted oleh user-user yang difollow oleh client (dari model Like/Repost, populate twit)
5. Setelah itu, twit-twit hasil kueri dari database tersebut akan digabung menjadi satu

> Catatan: Sebelum digabung menjadi satu, twit-twit tersebut akan difilter lagi untuk menghilangkan twit yang sudah tidak ada (null). Contoh kasusnhya seperti twit yang dilike/direpost oleh teman user sudah dihapus oleh pemilik nya. Maka saat mengkueri ke database (langkah 4), maka akan menghasilkan null karena twitnya sudah tidak ada. Jadi, sebelum digabung, twit-twit tersebut akan difilter untuk membuang twit yang null

6. Server akan juga menghapus duplikasi twit, mengurut urutan twit berdasarkan yang terbaru, dan menambah status isLiked & isReposted (apakah client sudah like/repost twit tersebut) yang dimana status itu akan dimanfaatkan di bagian frontend untuk fitur like dan repost

---

## Alur Like dan Repost

1. Ketika user(client) klik tombol like/repost pada salah satu twit, maka otomatis akan request ke endpoint `server/api/like/add.post.ts` atau `server/api/repost/add.post.ts`.
2. Didalam endpoint server tersebut, server akan menambah data(doc) kedatabase untuk mencatat siapa yang like/repost dan twit apa yang dilike/direpost. Server juga akan menambah angka repostCount/likeCount di data(doc) Twit

> Catatan: jika user sudah like/repost twit tersebut, maka endpoint api di frontend akan akan berubah menjadi `server/api/like/remove.post.ts` atau `server/api/repost/remove.post.ts` untuk menghapus data(doc) Like/Repost dan mengurangi angka repostCount/likeCount di data(doc) Twit

3. Di frontend, user akan langsung menerima effect setelah request yaitu angka like/repost langsung naik/turun dan warna icon berubah sesuai status yang dimanfaatkan dari Alur Mendapatkan Data-data Twit Untuk Halaman Utama langkah terakhir

---

## Alur Reset Password

1. User hanya bisa reset password saat di halaman login ketika user lupa passwordnya
2. Saat tiba di halaman reset password user akan merequest ke endpoint `server/api/send-otp.post.ts` untuk menerima kode otp via email
3. Jika sudah terkirim maka user bisa langsung mengisi password baru beserta kode otp. Lalu user click tombol ubah password sambil request ke endpoint `server/api/reset-password.post.ts`. Di endpoint ini, server juga memverifikasi kode otp sama hal nya dengan endpoint `server/api/verify-otp.post.ts`
4. Jika otp tidak sesuai, maka ubah password gagal. Jika otp sesuai, maka password berhasil diubah dan user otomatis akan diarahkan ke halaman login

---

## Alur Membuat Room Chat

1. Client menentukan siapa lawan bicara nya dan click tombol start chat
2. Setelah itu, client akan merequest ke endpoint `server/api/chat/index.post.ts` untuk membuat data(doc) pada model Chat untuk membuat room chat dan model MemberChat untuk menentukan anggota room chat yang berelasi ke model Chat
3. Client akan otomatis diarahkan ke halaman `chats/[id]`

---

## Alur Chat

1. Ketika user membuka halaman chats/[id], otomatis request ke endpoint `server/api/chat/[id]/message.get.ts` untuk mendapatkan riwayat chat dan membuka/memulai server websocket yang siap menerima data message
2. Di dalam websocket server ada fungsi untuk membuat data(doc) pada model Message yang siap menampung message dari user. Begitu client mengirim pesan, maka akan langsung terhubung dengan fungsi tersebut untuk input message ke database dan websocket akan mengirim balik messagenya ke client

> Catatan: Route websocket nya adalah `https://[host domain]/ws-chat`. File terletak di `server/routes/ws-chat.ts`

3. Otomatis lawan bicara akan langsung menerima pesannya secara realtime
4. WebSocket akan menutup/mati jika user meninggalkan halaman chats/[id]

---

## Alur Follow dan Unfollow

1. Ketika user (client) mengklik tombol follow pada profil orang lain, otomatis frontend akan melakukan request ke endpoint `server/api/follow/add.post.ts`.
2. Di dalam endpoint tersebut, server akan mengecek status privasi akun target (yang di-follow). Jika target adalah akun publik (isPrivate: false), server akan membuat data(doc) Follow dengan status 'accepted'. Bersamaan dengan itu, server akan menjalankan fungsi `$inc` untuk menaikkan (increment) angka `followers` pada akun target dan angka `following` pada akun user yang me-request.
3. (Catatan: Jika akun target diprivat, alurnya akan mengikuti aturan "Alur Fitur Private Account" di mana status menjadi 'pending' dan membutuhkan persetujuan lewat endpoint `server/api/follow/accept.post.ts` atau `server/api/follow/reject.post.ts`).
4. Untuk proses Unfollow, ketika user mengklik tombol unfollow, frontend akan merequest ke endpoint `server/api/follow/remove.post.ts`.
5. Pada endpoint remove tersebut, server akan mencari data(doc) Follow yang merelasikan kedua user di database, lalu menghapusnya. Setelah dihapus, server akan menurunkan (decrement) angka `followers` pada akun target dan angka `following` pada akun user klien.
6. Di frontend, user akan langsung menerima efeknya di mana teks dan warna tombol akan berubah kembali menjadi "Follow" atau "Unfollow" sesuai dengan aksi yang baru saja diselesaikan.

---

## Alur Edit Profile

1. User masuk ke halaman edit profil yang berada di `app/pages/profile/edit.vue`. Saat halaman dimuat, frontend akan otomatis mengisi form (pre-fill) dengan data user yang saat ini sedang login yang didapat dari session auth.
2. User mengubah data-data yang diinginkan, seperti nama, bio, atau mengganti foto profil.
3. Ketika user mengklik tombol simpan (save), frontend akan melakukan request ke endpoint `server/api/user/update.put.ts`.
4. Di endpoint tersebut, server pertama-tama akan memvalidasi data yang dikirim. Jika user juga mengunggah foto profil baru, file foto tersebut akan di-upload terlebih dahulu ke storage pihak ketiga (misalnya Cloudinary) menggunakan middleware atau fungsi utilitas terkait, lalu server akan mendapatkan nama/URL file yang baru.
5. Setelah itu, server akan memperbarui data(doc) User di database berdasarkan userId milik klien. Field yang diperbarui meliputi teks biodata dan nama file foto profil yang baru (jika user mengganti fotonya).
6. Jika proses update ke database berhasil, server akan mengembalikan response sukses. Frontend kemudian akan mengarahkan (redirect) user kembali ke halaman profil utamanya, baik itu `app/pages/profile/index.vue` atau `app/pages/profile/[id].vue`, dan data profil yang tampil sudah merupakan data yang paling baru.

---

## ERD

![gambar-erd](https://res.cloudinary.com/dzj9avwsg/image/upload/v1781370962/Cuplikan_layar_2026-06-14_001134_hcl8hz.png)

---

## Endpoint API List

### 🔐 Autentikasi (Auth) & Keamanan

| Endpoint API | Method HTTP | Fungsi |
| --- | --- | --- |
| `/api/auth/login` | `POST` | Mengautentikasi pengguna (masuk ke akun). |
| `/api/auth/logout` | `POST` | Mengakhiri sesi pengguna (keluar dari akun). |
| `/api/auth/register` | `POST` | Mendaftarkan akun pengguna baru. |
| `/api/auth/session` | `GET` | Mendapatkan data sesi atau informasi pengguna yang sedang login saat ini. |
| `/api/reset-password` | `POST` | Mereset kata sandi pengguna. |
| `/api/send-otp` | `POST` | Mengirimkan kode OTP (One Time Password) untuk verifikasi. |
| `/api/verify-otp` | `POST` | Memverifikasi kode OTP yang telah dikirimkan. |

### 👤 Pengguna (User) & Relasi (Follow)

| Endpoint API | Method HTTP | Fungsi |
| --- | --- | --- |
| `/api/user` | `GET` | Mendapatkan daftar pengguna. |
| `/api/user/:id` | `GET` | Mendapatkan profil detail dari pengguna tertentu berdasarkan ID. |
| `/api/user/search` | `GET` | Mencari pengguna berdasarkan kata kunci (query). |
| `/api/user/update` | `PUT` | Memperbarui profil/data pengguna. |
| `/api/user/get-follow-lists/:id` | `GET` | Mendapatkan daftar *followers* (pengikut) dan *following* (yang diikuti) dari pengguna tertentu. |
| `/api/follow/add` | `POST` | Mengikuti (*follow*) pengguna lain atau mengirimkan permintaan mengikuti. |
| `/api/follow/remove` | `POST` | Batal mengikuti (*unfollow*) pengguna lain atau menghapus pengikut. |
| `/api/follow/accept` | `POST` | Menerima permintaan mengikuti (*follow request*). |
| `/api/follow/reject` | `POST` | Menolak permintaan mengikuti. |

### 📝 Twits (Postingan/Cuitan)

| Endpoint API | Method HTTP | Fungsi |
| --- | --- | --- |
| `/api/twits` | `GET` | Mendapatkan daftar cuitan (timeline). |
| `/api/twits` | `POST` | Membuat cuitan (twit) baru. |
| `/api/twits` | `DELETE` | Menghapus cuitan tertentu. |
| `/api/twits/:id` | `GET` | Mendapatkan detail sebuah cuitan berdasarkan ID. |
| `/api/twits/subTwit/:id` | `GET` | Mendapatkan balasan/komentar dari sebuah cuitan tertentu. |
| `/api/twits/user/:id` | `GET` | Mendapatkan daftar cuitan yang dibuat oleh pengguna tertentu. |
| `/api/twits/user/:userId/liked` | `GET` | Mendapatkan daftar cuitan yang disukai oleh pengguna tertentu. |
| `/api/twits/user/:userId/reposted` | `GET` | Mendapatkan daftar cuitan yang di-*repost* oleh pengguna tertentu. |
| `/api/twits/hashtag/:hashtag` | `GET` | Mendapatkan daftar cuitan berdasarkan hashtag tertentu. |
| `/api/hashtags/trending` | `GET` | Mendapatkan daftar hashtag yang sedang tren. |

### ❤️ Interaksi (Like, Repost, Notifikasi)

| Endpoint API | Method HTTP | Fungsi |
| --- | --- | --- |
| `/api/like/add` | `POST` | Menyukai (*like*) sebuah cuitan. |
| `/api/like/remove` | `POST` | Batal menyukai (*unlike*) sebuah cuitan. |
| `/api/repost/add` | `POST` | Membagikan ulang (*repost*) sebuah cuitan. |
| `/api/repost/remove` | `POST` | Batal membagikan ulang (*un-repost*) sebuah cuitan. |
| `/api/notifications` | `GET` | Mendapatkan daftar notifikasi pengguna. |
| `/api/notifications/:id` | `PATCH` | Memperbarui status notifikasi (contoh: menandai notifikasi telah dibaca). |

### 💬 Obrolan (Chat)

| Endpoint API | Method HTTP | Fungsi |
| --- | --- | --- |
| `/api/chat` | `GET` | Mendapatkan daftar ruang obrolan (chat list) pengguna. |
| `/api/chat` | `POST` | Membuat ruang obrolan baru atau mengirim pesan awal ke pengguna lain. |
| `/api/chat/:id/message` | `GET` | Mendapatkan riwayat pesan dari ruang obrolan tertentu berdasarkan ID obrolan. |

*(Catatan: Karakter `:id`, `:userId`, dan `:hashtag` pada tabel di atas mewakili parameter dinamis yang dikirimkan pada URL, sejalan dengan format penamaan file Nuxt `[id].get.ts`)*.