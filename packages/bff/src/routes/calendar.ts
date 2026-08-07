import { Router } from "express";
import { getBearerToken, isTaktApiConfigured, taktApiFetch } from "../takt-client";

export interface CalendarResponse {
  date: string;
  startDate: string;
  endDate: string;
  timeEntries: unknown[];
  categories: unknown[];
  productivityLevels: unknown[];
}

export const calendarRouter = Router();

calendarRouter.get("/", async (req, res) => {
  if (!isTaktApiConfigured()) {
    return res.json({
      date: req.query.startDate || new Date().toISOString().slice(0, 10),
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      timeEntries: [],
      categories: [],
      productivityLevels: [],
    });
  }

  const { startDate, endDate } = req.query;
  if (typeof startDate !== "string" || typeof endDate !== "string") {
    return res.status(400).json({ error: "startDate and endDate are required" });
  }

  const token = getBearerToken(req.headers.authorization);
  if (!token) return res.status(401).json({ error: "Authorization token is required" });

  try {
    const params = new URLSearchParams({ startDate, endDate });
    return res.json(await taktApiFetch<CalendarResponse>(`/calendar?${params}`, token));
  } catch (error: any) {
    return res.status(502).json({ error: error.message || "Failed to load calendar" });
  }
});
