// controllers/esp32controller.js

// Import modul yang diperlukan
const WebSocket = require('ws');
const mysql = require('mysql2/promise');
const moment = require('moment')

// Koneksi ke database MySQL
const db = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "Monksayang111988",
    database: "esp32db", // Pastikan database ini sudah dibuat
});


// Fungsi untuk menangani WebSocket
const espmodule = function (server) {
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
                        const [insertedData] = await db.query("INSERT INTO t_event (machineId, code) VALUES (?, ?)", [machineId, code]);
                        await db.query("insert into t_log (machineId, code, eventId) VALUES (?, ?, ?)", [machineId, code, insertedData.insertId]);
                    }

                    const [dataTable] = await db.query("SELECT * FROM t_event");
                    const [machineTable] = await db.query("SELECT * FROM t_machine");

                    const [updated] = await db.query("SELECT * FROM t_event WHERE machineId = ?", [machineId]);

                    // Kirim data ke semua klien WebSocket
                    broadcast({
                        type: "updateStatus",
                        machineId,
                        code: updated[0].code,
                    });

                    broadcast({
                        type: "monitorStream",
                        dataTable,
                        machineTable
                    });
                } else if (data.type === "scanRFID") {
                    const { machineId, rfidID } = data;
                    console.log(`RFID ${rfidID} dipindai pada mesin ${machineId}`);

                    const [result] = await db.query("SELECT * FROM t_rfid WHERE rfid = ?", [rfidID]);

                    if (result.length > 0) {
                        // Hapus alarm dari database
                        const endTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                        const [rows] = await db.query("SELECT * FROM t_event WHERE machineId = ?", [machineId]);
                        if (rows.length > 0) {
                            const deletedId = rows[0].id
                            await db.query("DELETE FROM t_event WHERE machineId = ?", [machineId]);
                            await db.query(`UPDATE t_log set timeEnd = ? WHERE eventId = ?`, [endTime, deletedId]);

                            const [dataTable] = await db.query("SELECT * FROM t_event");
                            const [machineTable] = await db.query("SELECT * FROM t_machine");
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
                                dataTable,
                                machineTable
                            });
                        } else {
                            broadcast({
                                type: "noData",
                                machineId,
                                code: 0, // Kode 0 untuk kondisi netral
                            });
                        }

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
                } else if (data.type === "updateRequest") {
                    const machineId = data.machineId;
                    const [rows] = await db.query("SELECT * FROM t_event WHERE machineId = ?", [machineId]);
                    if (rows.length > 0) {
                        let code = rows[0].code
                        broadcast({
                            type: "updateStatus",
                            machineId,
                            code
                        });
                    } else {
                        broadcast({
                            type: "updateStatus",
                            machineId,
                            code: 0, // Kode 0 untuk kondisi netral
                        });
                    }
                } else if (data.type === "monitorRequest") {

                    const [dataTable] = await db.query("SELECT * FROM t_event");
                    const [machineTable] = await db.query("SELECT * FROM t_machine");
                    broadcast({
                        type: "monitorStream",
                        dataTable,
                        machineTable
                    });
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
}; // Pastikan tanda kurung tutup fungsi ada di sini
// Ekspor modul
module.exports = espmodule;
