// indexEsp32.js

// Import modul yang diperlukan
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");

// Konfigurasi aplikasi
const app = express();
const PORT = 3003;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Koneksi ke database MySQL
const db = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "Monksayang111988",
    database: "esp32db", // Pastikan database ini sudah dibuat
});

// Endpoint sederhana
app.get("/", (req, res) => {
    res.send("Server berjalan dengan baik!");
});

// Membuat HTTP server
const server = http.createServer(app);

// Membuat WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Menangani upgrade request untuk WebSocket
server.on("upgrade", (request, socket, head) => {
    const pathname = request.url;
    console.log(`Received upgrade request for ${pathname}`);

    if (pathname === "/esp") {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit("connection", ws, request);
        });
    } else {
        socket.destroy();
    }
});


// Menangani koneksi WebSocket
wss.on("connection", (ws, request) => {
    console.log("ESP32 terhubung via WebSocket");
    ws.on("message", async (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === "buttonPress") {
                const { machineId, code } = data;
                console.log(`Tombol ditekan pada mesin ${machineId} dengan kode ${code}`);

                // Cek apakah sudah ada data sebelumnya untuk mesin ini
                const [rows] = await db.query("SELECT * FROM t_event WHERE machineId = ?", [machineId]);

                if (rows.length === 0) {
                    // Jika belum ada data, insert baru
                    await db.query("INSERT INTO t_event (machineId, code) VALUES (?, ?)", [machineId, code]);
                } else {
                    // Jika sudah ada, update kode
                    await db.query("UPDATE t_event SET code = ? WHERE machineId = ?", [code, machineId]);
                }


                const [dataTable] = await db.query("SELECT * FROM t_event");

                // Kirim data ke semua klien WebSocket
                broadcast({
                    type: "updateStatus",
                    machineId,
                    code,
                });

                broadcast({
                    type: "monitorStream",
                    dataTable
                });
            } else if (data.type === "scanRFID") {
                const { machineId, rfidID } = data;
                console.log(`RFID ${rfidID} dipindai pada mesin ${machineId}`);

                const [result] = await db.query("SELECT * FROM t_rfid WHERE rfid = ?", [rfidID]);

                if (result.length > 0) {
                    // Hapus alarm dari database
                    await db.query("DELETE FROM t_event WHERE machineId = ?", [machineId]);

                    const [dataTable] = await db.query("SELECT * FROM t_event");

                    // Kirim respon sukses ke ESP32
                    ws.send(
                        JSON.stringify({
                            type: "rfidResponse",
                            status: "success",
                            machineId,
                        })
                    );

                    // Kirim update ke semua klien WebSocket
                    broadcast({
                        type: "updateStatus",
                        machineId,
                        code: 0, // Kode 0 untuk kondisi netral
                    });

                    broadcast({
                        type: "monitorStream",
                        dataTable
                    });
                } else {
                    // Kirim respon gagal jika RFID tidak dikenal
                    ws.send(
                        JSON.stringify({
                            type: "rfidResponse",
                            status: "failed",
                            machineId,
                        })
                    );
                }
            }
        } catch (error) {
            console.error("Error handling message:", error);
        }
    });

    ws.on("close", () => {
        console.log("ESP32 terputus");
    });
});

// Fungsi untuk broadcast pesan ke semua klien WebSocket
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Menjalankan server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan di http://0.0.0.0:${PORT}`);
});
