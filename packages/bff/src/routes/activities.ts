import { Router } from "express";
import { getBearerToken, isTaktApiConfigured, taktApiFetch } from "../takt-client";

export const activitiesRouter = Router();

export interface Activity {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  productivityLevel: 1 | 2 | 3 | 4; // 1: Nada, 2: Pouco, 3: Produtivo, 4: Altamente
  note?: string; // Limit 500 chars, optional
  title: string; // Mandatory title or activity descriptor
}

// In-memory list of tracked activities
let activities: Activity[] = [
  // Mock entry 1: Yesterday
  {
    id: "act-1",
    categoryId: "cat-global-2",
    categoryName: "Programação",
    categoryColor: "#10b981",
    startTime: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(), // 28 hours ago
    endTime: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // 26 hours ago
    productivityLevel: 4,
    note: "Fiz a modelagem do banco e configurei a estrutura base do monorepo. Muito fluido.",
    title: "Configurações de infra do projeto",
  },
  // Mock entry 2: Today
  {
    id: "act-2",
    categoryId: "cat-global-1",
    categoryName: "Reuniões",
    categoryColor: "#38bdf8",
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    endTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(), // 3.5 hours ago
    productivityLevel: 2,
    note: "Alinhamento demorado sobre o escopo do MVP, poderia ter sido um email.",
    title: "Daily Meeting & Planning",
  },
];

// GET activities
activitiesRouter.get("/", async (req, res) => {
  if (isTaktApiConfigured()) {
    const token = getBearerToken(req.headers.authorization);
    if (!token) return res.status(401).json({ error: "Authorization token is required" });

    try {
      return res.json(await taktApiFetch<Activity[]>("/time-entries", token));
    } catch (error: any) {
      return res.status(502).json({ error: error.message || "Failed to load activities" });
    }
  }

  res.json(activities);
});

// POST add activity
activitiesRouter.post("/", async (req, res) => {
  const {
    categoryId,
    categoryName,
    categoryColor,
    startTime,
    endTime,
    productivityLevel,
    note,
    title,
  } = req.body;

  if (isTaktApiConfigured()) {
    const token = getBearerToken(req.headers.authorization);
    if (!token) return res.status(401).json({ error: "Authorization token is required" });

    try {
      return res.status(200).json(
        await taktApiFetch<Activity>("/time-entries", token, {
          method: "POST",
          body: JSON.stringify(req.body),
        }),
      );
    } catch (error: any) {
      return res.status(502).json({ error: error.message || "Failed to create time entry" });
    }
  }

  if (!categoryId || !categoryName || !startTime || !endTime || !title) {
    return res.status(400).json({ error: "Missing required activity fields" });
  }

  const trimmedTitle = title.trim();
  if (trimmedTitle.length === 0) {
    return res.status(400).json({ error: "Title cannot be empty" });
  }

  const prodLevel = Number(productivityLevel);
  if (![1, 2, 3, 4].includes(prodLevel)) {
    return res
      .status(400)
      .json({ error: "Productivity level must be 1, 2, 3 or 4" });
  }

  if (note && note.length > 500) {
    return res.status(400).json({ error: "Note cannot exceed 500 characters" });
  }

  const parsedStartTime = new Date(startTime);
  const parsedEndTime = new Date(endTime);

  if (
    Number.isNaN(parsedStartTime.getTime()) ||
    Number.isNaN(parsedEndTime.getTime())
  ) {
    return res
      .status(400)
      .json({ error: "Start and end times must be valid ISO dates" });
  }

  if (parsedEndTime <= parsedStartTime) {
    return res.status(400).json({ error: "End time must be after start time" });
  }

  const newActivity: Activity = {
    id: `act-${Date.now()}`,
    categoryId,
    categoryName,
    categoryColor: categoryColor || "#64748b",
    startTime,
    endTime,
    productivityLevel: prodLevel as 1 | 2 | 3 | 4,
    note: note ? note.trim() : undefined,
    title: trimmedTitle,
  };

  activities.push(newActivity);
  res.status(201).json(newActivity);
});

// PUT update activity
activitiesRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    categoryId,
    categoryName,
    categoryColor,
    startTime,
    endTime,
    productivityLevel,
    note,
    title,
  } = req.body;

  const activityIndex = activities.findIndex((a) => a.id === id);

  if (isTaktApiConfigured()) {
    const token = getBearerToken(req.headers.authorization);
    if (!token) return res.status(401).json({ error: "Authorization token is required" });

    try {
      return res.json(
        await taktApiFetch<Activity>(`/time-entries/${id}`, token, {
          method: "PATCH",
          body: JSON.stringify(req.body),
        }),
      );
    } catch (error: any) {
      return res.status(502).json({ error: error.message || "Failed to update activity" });
    }
  }

  if (activityIndex === -1) {
    return res.status(404).json({ error: "Activity not found" });
  }

  if (!categoryId || !categoryName || !startTime || !endTime || !title) {
    return res.status(400).json({ error: "Missing required activity fields" });
  }

  const trimmedTitle = title.trim();
  if (trimmedTitle.length === 0) {
    return res.status(400).json({ error: "Title cannot be empty" });
  }

  const prodLevel = Number(productivityLevel);
  if (![1, 2, 3, 4].includes(prodLevel)) {
    return res
      .status(400)
      .json({ error: "Productivity level must be 1, 2, 3 or 4" });
  }

  if (note && note.length > 500) {
    return res.status(400).json({ error: "Note cannot exceed 500 characters" });
  }

  const parsedStartTime = new Date(startTime);
  const parsedEndTime = new Date(endTime);

  if (
    Number.isNaN(parsedStartTime.getTime()) ||
    Number.isNaN(parsedEndTime.getTime())
  ) {
    return res
      .status(400)
      .json({ error: "Start and end times must be valid ISO dates" });
  }

  if (parsedEndTime <= parsedStartTime) {
    return res.status(400).json({ error: "End time must be after start time" });
  }

  const updatedActivity: Activity = {
    id,
    categoryId,
    categoryName,
    categoryColor: categoryColor || "#64748b",
    startTime,
    endTime,
    productivityLevel: prodLevel as 1 | 2 | 3 | 4,
    note: note ? note.trim() : undefined,
    title: trimmedTitle,
  };

  activities[activityIndex] = updatedActivity;
  res.json(updatedActivity);
});

// DELETE activity
activitiesRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (isTaktApiConfigured()) {
    const token = getBearerToken(req.headers.authorization);
    if (!token) return res.status(401).json({ error: "Authorization token is required" });

    try {
      await taktApiFetch<void>(`/time-entries/${id}`, token, { method: "DELETE" });
      return res.json({ message: "Activity deleted successfully", id });
    } catch (error: any) {
      return res.status(502).json({ error: error.message || "Failed to delete activity" });
    }
  }

  const activityIndex = activities.findIndex((a) => a.id === id);

  if (activityIndex === -1) {
    return res.status(404).json({ error: "Activity not found" });
  }

  activities.splice(activityIndex, 1);
  res.json({ message: "Activity deleted successfully", id });
});
