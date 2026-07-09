import fs from "fs";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./config/db.js";
import swaggerUi from "swagger-ui-express";
// import swaggerDocs from "./swagger_output.json" assert { type: "json" };
import patientRoutes from "./routes/patient.route.js";
import userRoutes from "./routes/user.route.js";
import doctorRoutes from "./routes/doctor.route.js";
import opdRoutes from "./routes/opd.route.js";
import ipdRoutes from "./routes/ipd.route.js";
import authRoutes from "./routes/auth.route.js";
import wardRoutes from "./routes/ward.route.js";
import pharmacyRoutes from "./routes/pharmacy.route.js";
import payRoutes from "./routes/pay.route.js";
import pathologyRoutes from "./routes/pathology.route.js";
import prescriptionRoute from "./routes/prescription.route.js";
import eyeRoutes from "./routes/eye.route.js";
import opticalRoutes from "./routes/optical.route.js";
import eyeSurgeryRoutes from "./routes/eyeSurgery.route.js";

dotenv.config();
connectDB();

const app = express();
const swaggerDocs = JSON.parse(
  fs.readFileSync(new URL("./swagger_output.json", import.meta.url))
);

app.use(helmet());
app.use(express.json());

const allowedOrigins = [
  "http://localhost:3000",
  "http://superadmin.localhost:3000",
  "https://www.hp.velocare.in",
  "https://hp.velocare.in",
  "https://superadmin.velocare.in",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server and mobile apps (no origin)
      if (!origin) return callback(null, true);

      // Normalize origin (remove trailing slash)
      const cleanOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      } else {
        console.log("❌ CORS Blocked Origin:", origin);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send(`
    <body style="
      margin: 0;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      background: linear-gradient(to right, #007BFF, #00C6FF);
      font-family: system-ui, sans-serif;
      color: white;
    ">
      <h1 style="margin: 0;">🚀 Hospital ERP API</h1>
      <a href="/api-docs" style="
        margin-top: 16px;
        color: #fff;
        background: rgba(255,255,255,0.2);
        padding: 10px 20px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 500;
      ">📘 Swagger Docs</a>
    </body>
  `);
});
// app.use((req, res, next) => {
//   console.log(`[OPD ROUTE] ${req.method} ${req.originalUrl}`);
//   next();
// });
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use("/api/patient", patientRoutes);
app.use("/api/user", userRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/opd", opdRoutes);
app.use("/api/ipd", ipdRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ward", wardRoutes);
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/pay", payRoutes);
app.use("/api/pathology", pathologyRoutes);
app.use("/api/prescription", prescriptionRoute);
app.use("/api/eye", eyeRoutes);
app.use("/api/optical", opticalRoutes);
app.use("/api/eye-surgery", eyeSurgeryRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
